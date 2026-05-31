import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../db/db';
import { dbService } from '../../services/dbService';
import { syncService } from '../../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, TrendingUp, TrendingDown, ClipboardList, BookOpen, AlertCircle, 
  Users, CreditCard, CheckCircle, Smartphone, Banknote, RefreshCw, Plus, 
  Trash2, X, Download, FileText, Check, Package, Car, Utensils, Receipt, 
  Sparkles, Filter, Search, Printer, Send, Info, Calendar, ShieldCheck, Sliders
} from 'lucide-react';
import { format } from 'date-fns';

interface Merchant {
  id: string;
  name: string;
  type: string;
  plan: string;
  currency: string;
}

export const SchoolAccountingSaaS = ({ merchant, subTab }: { merchant: Merchant, subTab?: string }) => {
  const currency = merchant.currency || 'FCFA';

  // State management
  const [activeSubTab, setActiveSubTab] = useState<'kpi' | 'scolarite' | 'caisse' | 'depenses' | 'salaires' | 'stock' | 'transport' | 'cantine'>((subTab as any) || 'kpi');

  useEffect(() => {
    if (subTab && subTab !== activeSubTab) {
      setActiveSubTab(subTab as any);
    }
  }, [subTab, activeSubTab]);
  
  // Modals & Forms
  const [showFeeConfigModal, setShowFeeConfigModal] = useState<any>(null); // student object for configuring fees
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null); // student object for quick payment cashier
  const [selectedStudentFinance, setSelectedStudentFinance] = useState<any>(null); // student selected for advanced financial sheet
  const [financeFormCategory, setFinanceFormCategory] = useState<string>('Scolarité Mensuelle');
  const [financeFormAmount, setFinanceFormAmount] = useState<number>(30000);
  const [financeFormMode, setFinanceFormMode] = useState<string>('Wave');
  const [isEditingFeesInline, setIsEditingFeesInline] = useState<boolean>(false);
  const [inlineFees, setInlineFees] = useState<any>({
    inscription: 25000,
    scolarite: 300000,
    uniforme: 40000,
    transport: 60000,
    cantine: 90000
  });

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null); // payment receipt object
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: 0, category: 'Salaires', description: '', staffId: '' });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stockQuantity: 50, category: 'Uniforme' });
  const [saving, setSaving] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Tous');

  // Load database items via useLiveQuery (Reactive)
  const students = useLiveQuery(() => 
    db.students.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const employees = useLiveQuery(() => 
    db.employees.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  // Derived financial computations
  const finances = useMemo(() => {
    // 1. Calculate revenues from sales/payments
    let totalRevenue = 0;
    sales.forEach(sale => {
      totalRevenue += Number(sale.totalAmount || 0);
    });

    // 2. School fees specific metrics (from students database)
    let totalTargetFees = 0;
    let totalPaidFees = 0;
    students.forEach((s: any) => {
      const fees = s.tuitionFeesBreakdown || {
        inscription: 25000,
        scolarite: 300000,
        uniforme: 40000,
        transport: 60000,
        cantine: 90000
      };
      
      const stTotal = Number(fees.inscription || 0) + 
                     Number(fees.scolarite || 0) + 
                     Number(fees.uniforme || 0) + 
                     Number(fees.transport || 0) + 
                     Number(fees.cantine || 0);
      
      totalTargetFees += stTotal;

      // Extract paid amount for this student
      const stPayments = s.tuitionPayments || [];
      const stPaid = stPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      totalPaidFees += stPaid;
    });

    // If no sales exist yet, we can benchmark with student payments
    const actualRevenue = Math.max(totalRevenue, totalPaidFees);

    // 3. Expenses
    let totalExpenses = 0;
    expenses.forEach(exp => {
      totalExpenses += Number(exp.amount || 0);
    });

    const netResult = actualRevenue - totalExpenses;
    const totalOverdue = Math.max(0, totalTargetFees - totalPaidFees);

    return {
      totalRevenue: actualRevenue,
      totalExpenses,
      netResult,
      totalTargetFees,
      totalPaidFees,
      totalOverdue
    };
  }, [sales, expenses, students]);

  // Unique grade levels
  const uniqueClassGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    students.forEach((s: any) => {
      if (s.grade) gradesSet.add(s.grade);
    });
    return ['Tous', ...Array.from(gradesSet).sort()];
  }, [students]);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      const q = searchTerm.toLowerCase().trim();
      const nameMatch = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(q) ||
                        (s.matricule || '').toLowerCase().includes(q);
      const gradeMatch = selectedGrade === 'Tous' || s.grade === selectedGrade;
      return nameMatch && gradeMatch;
    });
  }, [students, searchTerm, selectedGrade]);

  // 1. SAVE NEW FEE CONFIGURATION FOR A STUDENT
  const handleSaveFeeConfig = async (studentId: string, breakdown: any) => {
    const student = students.find((s: any) => s.id === studentId);
    if (!student) return;

    setSaving(true);
    try {
      await dbService.students.save({
        ...student,
        tuitionFeesBreakdown: breakdown,
        updatedAt: new Date()
      });
      syncService.syncAllMerchantData(merchant.id);
      setShowFeeConfigModal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 2. SAVE PAYMENT (ENCAISSEMENT CAISSE)
  const handleRecordPayment = async (studentId: string, paymentData: { amount: number, category: string, mode: string }) => {
    const student = students.find((s: any) => s.id === studentId);
    if (!student) return;

    if (paymentData.amount <= 0) return;
    setSaving(true);

    try {
      const receiptNumber = `REC-2026-${String(sales.length + 1).padStart(4, '0')}`;
      const newPayment = {
        id: crypto.randomUUID(),
        amount: Number(paymentData.amount),
        category: paymentData.category,
        mode: paymentData.mode,
        date: new Date().toISOString(),
        receiptNumber
      };

      // Append to student record
      const existingPayments = student.tuitionPayments || [];
      const updatedPayments = [...existingPayments, newPayment];

      await dbService.students.save({
        ...student,
        tuitionPayments: updatedPayments,
        updatedAt: new Date()
      });

      // Mirror onto general Sales ledger for accounting compliance
      await dbService.merchantSales.save({
        merchantId: merchant.id,
        items: [{
          productId: 'scolarite',
          name: `Frais Scolaires: ${paymentData.category} - ${student.firstName} ${student.lastName}`,
          quantity: 1,
          price: Number(paymentData.amount)
        }],
        totalAmount: Number(paymentData.amount),
        paymentMode: paymentData.mode,
        syncStatus: 'pending',
        receiptNumber,
        clientName: `${student.firstName} ${student.lastName}`,
        clientPhone: student.parentContact || '',
        createdAt: new Date()
      });

      // Synchronize in background
      syncService.syncAllMerchantData(merchant.id);
      syncService.syncSales(merchant.id);

      setSelectedReceipt({
        ...newPayment,
        studentName: `${student.firstName} ${student.lastName}`,
        matricule: student.matricule || 'N/A',
        grade: student.grade || 'Non spécifié'
      });

      setShowPaymentModal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 3. RECORD EXPENSE or SALARY
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    setSaving(true);
    try {
      await dbService.merchantExpenses.save({
        title: newExpense.title,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description || '',
        merchantId: merchant.id,
        createdAt: new Date()
      });
      syncService.syncExpenses(merchant.id);
      setIsAddingExpense(false);
      setNewExpense({ title: '', amount: 0, category: 'Salaires', description: '', staffId: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 4. RECORD NEW STOCK PRODUCT
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    setSaving(true);
    try {
      await dbService.merchantProducts.save({
        name: newProduct.name,
        price: Number(newProduct.price),
        stockQuantity: Number(newProduct.stockQuantity),
        category: newProduct.category,
        merchantId: merchant.id,
        updatedAt: new Date()
      });
      syncService.syncProducts(merchant.id);
      setIsAddingProduct(false);
      setNewProduct({ name: '', price: 0, stockQuantity: 50, category: 'Uniforme' });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* SaaS Premium Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" /> SÉCURISÉ
            </span>
            <span className="text-[10px] font-bold text-gray-400 font-mono">UTC: 29/05/2026</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-950 mt-1">Scolarité & Finance</h1>
          <p className="text-xs text-slate-500 font-medium">Livre de caisse unifié des encaissements, salaires, cantine, transport et stocks.</p>
        </div>

        {/* Global Action Selector bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsAddingExpense(true)}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-md shadow-rose-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      {/* Modern Dashboard Navigation Tabs Removed (Now grouped in Top Navigation) */}

      {/* TAB CONTEXT VALUE WRAPPER */}
      <div className="min-h-[450px]">
        {/* ======================================= */}
        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {/* ======================================= */}
        {activeSubTab === 'kpi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Recettes Scolarité & Caisse</p>
                <h3 className="text-2xl font-black text-indigo-950 mt-2">
                  {finances.totalRevenue.toLocaleString()} <span className="text-[10px] text-gray-400">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-600 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Encaissé réels ce mois</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Charges & Dépense d'école</p>
                <h3 className="text-2xl font-black text-rose-600 mt-2">
                  {finances.totalExpenses.toLocaleString()} <span className="text-[10px] text-rose-400">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Professeurs, Senelec, fonctionnement</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Résultat Net Restant</p>
                <h3 className={`text-2xl font-black mt-2 ${finances.netResult >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {finances.netResult.toLocaleString()} <span className="text-[10px] opacity-70">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-bold animate-pulse">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Santé de la trésorerie scolaire</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-500 animate-bounce" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Impayés & Débiteurs</p>
                <h3 className="text-2xl font-black text-amber-600 mt-2">
                  {finances.totalOverdue.toLocaleString()} <span className="text-[10px] text-amber-400">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 font-bold">
                  <span>Scolarité attendue à recouvrer</span>
                </div>
              </div>
            </div>

            {/* Quick Informational Box & Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-indigo-950 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                <div>
                  <h4 className="text-lg font-black tracking-tight">IA Analyste Trésorerie</h4>
                  <p className="text-[11px] text-indigo-200 mt-2 leading-relaxed">
                    Sur la base de <span className="text-white font-bold">{students.length} élèves inscrits</span> pour l'année administrative courante, votre rentrée prévisionnelle globale s'élève à <span className="text-white font-bold">{finances.totalTargetFees.toLocaleString()} FCFA</span>.
                  </p>
                  <p className="text-[11px] text-indigo-200 mt-3 leading-relaxed">
                    Le taux actuel de recouvrement s'élève à <span className="text-emerald-400 font-bold">{finances.totalTargetFees > 0 ? Math.round((finances.totalPaidFees / finances.totalTargetFees) * 100) : 0}%</span>. Nous vous recommandons de préparer les notifications d'impayés pour la relance automatique des parents d'élèves en retard via WhatsApp.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
                  <span>Statut : Trésorerie d'excellence</span>
                  <span className="text-emerald-400">● Live Sync</span>
                </div>
              </div>

              {/* Graphical Visualizer bar charts */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                <h4 className="text-md font-bold text-indigo-950">Courbe Comparative Mensuelle</h4>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Comparatif des écritures de débit / crédit</p>
                
                <div className="mt-8 flex items-end justify-between h-44 px-4 bg-slate-50/50 rounded-3xl p-6 relative">
                  {/* Ledger benchmark points */}
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-12 bg-indigo-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '110px' }}></div>
                    <div className="w-12 bg-rose-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '40px' }}></div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 mt-2">Semestre 1</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-12 bg-indigo-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '135px' }}></div>
                    <div className="w-12 bg-rose-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '60px' }}></div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 mt-2">Semestre 2</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-12 bg-indigo-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '90px' }}></div>
                    <div className="w-12 bg-rose-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '55px' }}></div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 mt-2">Semestre 3</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 justify-center text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                    <span>Recettes (Revenus)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-rose-600">
                    <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                    <span>Dépenses (Charges d'école)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: SCOLARITE - ELEVE ACCOUNTS */}
        {/* ======================================= */}
        {activeSubTab === 'scolarite' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrer un élève..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center space-x-2 bg-white rounded-xl border border-gray-200 px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                >
                  {uniqueClassGrades.map(grade => (
                    <option key={grade} value={grade}>{grade === 'Tous' ? 'Toutes les classes' : grade}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-150">
                      <th className="px-8 py-5">Élève</th>
                      <th className="px-8 py-5">Classe / Matricule</th>
                      <th className="px-8 py-5">Fiche Facturation Annuelle</th>
                      <th className="px-8 py-5">Versements Effectués</th>
                      <th className="px-8 py-5 text-right">Actions Financières</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400 text-sm">
                          Aucun élève trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st: any) => {
                        const breakdown = st.tuitionFeesBreakdown || {
                          inscription: 25000,
                          scolarite: 300000,
                          uniforme: 40000,
                          transport: 60000,
                          cantine: 90000
                        };

                        const totalTarget = Number(breakdown.inscription || 0) + 
                                            Number(breakdown.scolarite || 0) + 
                                            Number(breakdown.uniforme || 0) + 
                                            Number(breakdown.transport || 0) + 
                                            Number(breakdown.cantine || 0);

                        const totalPaid = (st.tuitionPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                        const owed = Math.max(0, totalTarget - totalPaid);

                        return (
                          <tr key={st.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4.5">
                              <p className="font-black text-indigo-950 text-sm leading-tight">{st.firstName} {st.lastName}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-mono">ID: {st.id.slice(0, 8)} | Parent: {st.parentContact || 'N/A'}</p>
                            </td>
                            <td className="px-8 py-4.5">
                              <span className="px-2.5 py-1 bg-slate-100/80 rounded-md text-[10px] font-black uppercase tracking-wider text-slate-600">
                                {st.grade || 'N/A'}
                              </span>
                              <p className="text-[9px] font-mono text-gray-400 mt-1">MAT: {st.matricule || 'GEN-2026'}</p>
                            </td>
                            <td className="px-8 py-4.5">
                              <p className="text-sm font-black text-indigo-950 font-mono">{totalTarget.toLocaleString()} {currency}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[8px] font-bold px-1 py-0.5 bg-gray-100 text-gray-500 rounded">Insc: {(breakdown.inscription || 0).toLocaleString()}</span>
                                <span className="text-[8px] font-bold px-1 py-0.5 bg-gray-100 text-gray-500 rounded">Mens: {(breakdown.scolarite || 0).toLocaleString()}</span>
                                <span className="text-[8px] font-bold px-1 py-0.5 bg-gray-100 text-gray-500 rounded">Unif: {(breakdown.uniforme || 0).toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4.5">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-emerald-600 font-mono">{totalPaid.toLocaleString()} {currency}</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${owed === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                  {owed === 0 ? 'Solder' : `${Math.round((totalPaid/totalTarget)*100)}%`}
                                </span>
                              </div>
                              <p className="text-[10px] text-rose-500 font-mono mt-1">Impayé : {owed.toLocaleString()} {currency}</p>
                            </td>
                            <td className="px-8 py-4.5 text-right">
                              <div className="flex items-center justify-end">
                              <div className="flex items-center justify-end gap-2">
                                {/* Bouton 1: Encaisser (Vert, rapide) */}
                                <button
                                  onClick={() => {
                                    setShowPaymentModal(st);
                                    // Set default category to first unpaid/uncompleted fee
                                    const bd = st.tuitionFeesBreakdown || {
                                      inscription: 25000,
                                      scolarite: 300000,
                                      uniforme: 40000,
                                      transport: 60000,
                                      cantine: 90000
                                    };
                                    const cats = [
                                      { key: 'inscription', label: "Inscription / Réinscription" },
                                      { key: 'scolarite', label: "Scolarité Mensuelle" },
                                      { key: 'uniforme', label: "Uniforme Scolaire" },
                                      { key: 'transport', label: "Transport Scolaire" },
                                      { key: 'cantine', label: "Cantine Cafétéria" }
                                    ];
                                    let chosenCat = "Scolarité Mensuelle";
                                    let chosenAmount = 30000;
                                    for(const cat of cats) {
                                      const limitVal = Number(bd[cat.key] || 0);
                                      const paidVal = (st.tuitionPayments || [])
                                        .filter((p: any) => p.category === cat.label)
                                        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                                      if (paidVal < limitVal) {
                                        chosenCat = cat.label;
                                        chosenAmount = limitVal - paidVal;
                                        break;
                                      }
                                    }
                                    setFinanceFormCategory(chosenCat);
                                    setFinanceFormAmount(chosenAmount);
                                    setFinanceFormMode('Wave');
                                  }}
                                  className="px-3.5 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
                                  title="Guichet rapide d'encaissement"
                                >
                                  <CreditCard className="w-4 h-4 text-emerald-300" />
                                  <span>Encaisser</span>
                                </button>

                                {/* Bouton 2: Ajuster Fiche de Frais (Bleu/Blanc) */}
                                <button
                                  onClick={() => {
                                    setShowFeeConfigModal(st);
                                  }}
                                  className="px-3 py-2.5 bg-white border border-slate-200 text-indigo-950 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1 shadow-sm"
                                  title="Modifier les frais annuels contractuels de l'élève"
                                >
                                  <Sliders className="w-4 h-4 text-indigo-600" />
                                  <span>Tarifs</span>
                                </button>

                                {/* Bouton 3: Dossier de l'élève & Reçus (Gris) */}
                                <button
                                  onClick={() => {
                                    setSelectedStudentFinance(st);
                                    setIsEditingFeesInline(false);
                                  }}
                                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1 shadow-sm"
                                  title="Consulter le dossier, le reste à payer et les reçus"
                                >
                                  <Receipt className="w-4 h-4 text-slate-500" />
                                  <span>Dossier ({ (st.tuitionPayments || []).length })</span>
                                </button>
                              </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: CAISSE - JOURNAL D'ENCAISSEMENT */}
        {/* ======================================= */}
        {activeSubTab === 'caisse' && (
          <div className="space-y-6">
            <div className="bg-indigo-950 text-white p-6 rounded-[2rem] shadow-md flex justify-between items-center">
              <div>
                <p className="text-[9px] font-mono text-indigo-200 uppercase tracking-widest">LIVRE DE CAISSE SCOLAIRE</p>
                <h3 className="text-xl font-black mt-1">Registre des encaissements physiques & mobiles</h3>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400">+{sales.length} transactions</span>
            </div>

            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-150">
                      <th className="px-8 py-5">Référence / Date</th>
                      <th className="px-8 py-5">Émetteur / Contat</th>
                      <th className="px-8 py-5">Désignation frais scolaire</th>
                      <th className="px-8 py-5">Mode de paiement</th>
                      <th className="px-8 py-5 text-right">Montant encaissé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400">Aucune transaction de caisse enregistrée</td>
                      </tr>
                    ) : (
                      sales.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-4.5">
                            <p className="font-mono text-indigo-950 text-xs font-bold leading-tight">{sale.receiptNumber || `REC-${sale.id.slice(0, 8)}`}</p>
                            <p className="text-[9px] text-gray-400 mt-1">
                              {sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </p>
                          </td>
                          <td className="px-8 py-4.5">
                            <p className="font-bold text-slate-800 text-xs">{sale.clientName || 'Anonyme'}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{sale.clientPhone || 'Aucun numéro'}</p>
                          </td>
                          <td className="px-8 py-4.5">
                            <p className="text-xs font-semibold text-slate-600 leading-normal max-w-xs truncate">
                              {sale.items?.[0]?.name || 'Versement Frais'}
                            </p>
                          </td>
                          <td className="px-8 py-4.5">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              sale.paymentMode === 'Wave' ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' :
                              sale.paymentMode === 'Orange Money' ? 'bg-orange-50 text-orange-600 border border-orange-100 font-bold' :
                              'bg-green-50 text-green-700 border border-green-100'
                            }`}>
                              {sale.paymentMode || 'Wave'}
                            </span>
                          </td>
                          <td className="px-8 py-4.5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <p className="text-sm font-black text-indigo-950 font-mono">
                                +{(sale.totalAmount || sale.total_amount || 0).toLocaleString()} {currency}
                              </p>
                              <button
                                onClick={() => setSelectedReceipt({
                                  amount: sale.totalAmount || sale.total_amount,
                                  category: 'Scolarité / Caisse',
                                  mode: sale.paymentMode,
                                  date: sale.createdAt ? new Date(sale.createdAt).toISOString() : new Date().toISOString(),
                                  receiptNumber: sale.receiptNumber || `REC-${sale.id.slice(0, 8)}`,
                                  studentName: sale.clientName,
                                  matricule: 'INSCRIT',
                                  grade: 'Niveau d\'étude'
                                })}
                                className="p-1 text-gray-400 hover:text-black hover:scale-105 transition-transform"
                                title="Ré-éditer le reçu de paiement"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 4: DEPENSES GENERALES */}
        {/* ======================================= */}
        {activeSubTab === 'depenses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-150">
                      <th className="px-8 py-5">Libellé de charge</th>
                      <th className="px-8 py-5">Catégorie dépenses</th>
                      <th className="px-8 py-5">Date d'émission</th>
                      <th className="px-8 py-5 text-right">Montant décaissé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.filter(e => e.category !== 'Salaires').length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-gray-400 text-sm">
                          Aucun frais de fonctionnement ou charges enregistrées dehors salaires.
                        </td>
                      </tr>
                    ) : (
                      expenses.filter(e => e.category !== 'Salaires').map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4.5">
                            <p className="font-black text-indigo-950 text-sm leading-tight">{exp.title}</p>
                            <p className="text-[10px] font-mono text-gray-400 mt-1">ID: {exp.id.slice(0, 8)} | Note: {exp.description || 'Non renseignée'}</p>
                          </td>
                          <td className="px-8 py-4.5">
                            <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md font-bold text-[9px] uppercase tracking-wider border border-yellow-100">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-8 py-4.5">
                            <p className="text-[11px] font-mono text-slate-600">
                              {exp.createdAt ? format(new Date(exp.createdAt), 'dd/MM/yyyy') : 'N/A'}
                            </p>
                          </td>
                          <td className="px-8 py-4.5 text-right">
                            <p className="text-sm font-black text-rose-500 font-mono">-{exp.amount.toLocaleString()} {currency}</p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 5: SALAIRES & PERSONNEL */}
        {/* ======================================= */}
        {activeSubTab === 'salaires' && (
          <div className="space-y-6">
            <div className="bg-indigo-950 text-white p-8 rounded-[2rem] shadow-sm flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest">SALAIRES & REMUNERATIONS DU PERSONNEL</p>
                <h3 className="text-xl font-bold mt-1">Génération des virements administratifs</h3>
              </div>
              <button
                onClick={() => {
                  setNewExpense({ title: 'Régularisation Salaire Enseignant', amount: 150000, category: 'Salaires', description: '', staffId: '' });
                  setIsAddingExpense(true);
                }}
                className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-600 transition-colors"
              >
                Payer un membre
              </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-150">
                      <th className="px-8 py-5">Personnel</th>
                      <th className="px-8 py-5">Poste / Rôle</th>
                      <th className="px-8 py-5">Fiche Salaire Mensuel Brut</th>
                      <th className="px-8 py-5">Décalcomanie Charges / Retenue</th>
                      <th className="px-8 py-5 text-right">Net perçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400 text-xs">
                          Aucun enseignant ou membre administratif enregistré dans le module R.H.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp: any) => {
                        const baseBrut = Number(emp.salary || emp.salaireBase || 150000);
                        const prime = Math.round(baseBrut * 0.1); // default 10% prime
                        const retention = Math.round(baseBrut * 0.05); // default 5% tax
                        const netPayable = baseBrut + prime - retention;

                        return (
                          <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4.5">
                              <p className="font-black text-indigo-950 text-sm leading-tight">{emp.name || `${emp.firstName} ${emp.lastName}`}</p>
                              <p className="text-[10px] text-slate-500 mt-1 font-mono">Contact : {emp.phone || 'Aucun standard'}</p>
                            </td>
                            <td className="px-8 py-4.5">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-bold text-[9px] uppercase tracking-wider">
                                {emp.role || emp.position || 'ADMINISTRATION'}
                              </span>
                            </td>
                            <td className="px-8 py-4.5">
                              <p className="text-sm font-black text-indigo-950 font-mono">{baseBrut.toLocaleString()} {currency}</p>
                              <span className="text-[9px] text-slate-400 mt-0.5 block">Brut Conventionnel</span>
                            </td>
                            <td className="px-8 py-4.5">
                              <div className="text-[11px] space-y-0.5">
                                <p className="text-emerald-600 font-bold">Primes d'excellence: +{prime.toLocaleString()} {currency}</p>
                                <p className="text-rose-500 font-bold">Retenus sociales: -{retention.toLocaleString()} {currency}</p>
                              </div>
                            </td>
                            <td className="px-8 py-4.5 text-right">
                              <p className="text-sm font-black text-indigo-950 font-mono">{netPayable.toLocaleString()} {currency}</p>
                              <button
                                onClick={async () => {
                                  setSaving(true);
                                  try {
                                    await dbService.merchantExpenses.save({
                                      title: `Salaire payé à : ${emp.name || emp.firstName}`,
                                      amount: netPayable,
                                      category: 'Salaires',
                                      description: `Virement des salaires pour la période courante - Poste: ${emp.role || 'Enseignant'}`,
                                      merchantId: merchant.id,
                                      createdAt: new Date()
                                    });
                                    syncService.syncExpenses(merchant.id);
                                    alert(`Le virement de salaire de ${netPayable} FCFA pour ${emp.name} a été enregistré dans le livre comptable.`);
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                                className="mt-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-100 hover:bg-emerald-100"
                              >
                                Émettre fiche & virement
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 6: STOCK SCOLAIRE */}
        {/* ======================================= */}
        {activeSubTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-indigo-950">Magasin d'uniformes & fournitures scolaires</h3>
                <p className="text-xs text-slate-500 font-medium">Boutique officielle de distribution de matériels scellés.</p>
              </div>
              <button
                onClick={() => setIsAddingProduct(true)}
                className="px-4 py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1 hover:bg-black"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nvel Uniforme / Cahier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.length === 0 ? (
                <div className="col-span-3 bg-white p-12 text-center text-gray-400 text-sm border rounded-[2rem]">
                  Aucun article enregistré. Les uniformes, livres et cahiers s'ajustent ici.
                </div>
              ) : (
                products.map((item: any) => (
                  <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-md text-[9px] font-black uppercase tracking-wider text-slate-600">
                        {item.category || 'SCOLAIRE'}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.stockQuantity <= 10 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        Stock: {item.stockQuantity} unités
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-indigo-950 text-md leading-tight">{item.name}</h4>
                      <p className="text-xl font-black font-mono text-indigo-950 mt-1">{item.price.toLocaleString()} {currency}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-mono">REF: {item.id.slice(0, 8)}</span>
                      <button
                        onClick={async () => {
                          const quantity = Number(prompt("Quantité d'uniformes vendue :", "1"));
                          if (!quantity || quantity <= 0) return;
                          if (quantity > item.stockQuantity) {
                            alert("Quantité en stock insuffisante.");
                            return;
                          }

                          setSaving(true);
                          try {
                            const decAmount = item.price * quantity;
                            // Reduce stock
                            await dbService.merchantProducts.save({
                              ...item,
                              stockQuantity: item.stockQuantity - quantity,
                              updatedAt: new Date()
                            });

                            // Write sale
                            await dbService.merchantSales.save({
                              merchantId: merchant.id,
                              items: [{
                                productId: item.id,
                                name: `${item.name} (Vente Directe Boutique)`,
                                quantity,
                                price: item.price
                              }],
                              totalAmount: decAmount,
                              paymentMode: 'Espèces',
                              createdAt: new Date()
                            });

                            syncService.syncProducts(merchant.id);
                            syncService.syncSales(merchant.id);
                            alert(`Vente de ${quantity} x ${item.name} enregistrée avec succès.`);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-100"
                      >
                        Enregistrer une Vente
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 7: TRANSPORT SCOLAIRE */}
        {/* ======================================= */}
        {activeSubTab === 'transport' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-150 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-black rounded-md tracking-widest uppercase">Flotte de transport</span>
                <h3 className="text-xl font-black text-indigo-950 mt-1.5">Gestion des circuits de bus & ramassages</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                <p>🚏 Lignes de bus : <span className="font-extrabold text-indigo-950">04 lignes actives</span></p>
                <p>🚌 Bus : <span className="font-extrabold text-indigo-950">04 bus climatisés</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-indigo-950">Ligne active : Plateau - Liberté - Sacré Cœur</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="flex justify-between"><span>👤 Chauffeur responsable:</span> <span className="font-extrabold">Moussa Camara (+221 77 123 45 67)</span></p>
                  <p className="flex justify-between"><span>🏫 Heure de ramassage élèves:</span> <span className="font-extrabold">06h45 - 07h30</span></p>
                  <p className="flex justify-between"><span>🎟 Tarif d'abonnement mensuel:</span> <span className="font-extrabold text-indigo-950">15 000 FCFA / enfant</span></p>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] bg-slate-50 border px-2.5 py-1 rounded-md font-mono text-gray-500 font-bold block text-center">
                    08 élèves souscrits sur ce circuit
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-indigo-950">Ligne active : Almadies - Yoff - Ouest Foire</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="flex justify-between"><span>👤 Chauffeur responsable:</span> <span className="font-extrabold">Abdoulaye Ndiaye (+221 77 987 65 43)</span></p>
                  <p className="flex justify-between"><span>🏫 Heure de ramassage élèves:</span> <span className="font-extrabold">06h30 - 07h15</span></p>
                  <p className="flex justify-between"><span>🎟 Tarif d'abonnement mensuel:</span> <span className="font-extrabold text-indigo-950">20 000 FCFA / enfant</span></p>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] bg-slate-50 border px-2.5 py-1 rounded-md font-mono text-gray-500 font-bold block text-center">
                    12 élèves souscrits sur ce circuit
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 8: CANTINE & REPAS */}
        {/* ======================================= */}
        {activeSubTab === 'cantine' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black rounded-md tracking-widest uppercase">Service Cafétéria</span>
                <h3 className="text-xl font-black text-indigo-950 mt-1.5">Menus cantine & abonnements scolaires</h3>
              </div>
              <div className="text-xs text-slate-600 font-mono space-y-1">
                <p>🍲 Plan repas proposé : <span className="font-extrabold text-indigo-950">Menu du Jour</span></p>
                <p>⭐ Norme sanitaire : <span className="font-extrabold text-emerald-600">Certifié ACOM</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="text-md font-bold text-indigo-950">Abonnement Mensuel Cantine</h4>
                <p className="text-xs text-slate-500 font-medium">Forfait complet midi (repas du jour + dessert + boisson).</p>
                <p className="text-2xl font-black font-mono text-indigo-950">10 000 FCFA <span className="text-xs text-slate-400">/ mois</span></p>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>95 élèves abonnés</span>
                  <span>Actif</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-rose-500" />
                </div>
                <h4 className="text-md font-bold text-indigo-950">Abonnement Cantine XL (Spécial Maternelle)</h4>
                <p className="text-xs text-slate-500 font-medium font-sans">Forfait déjeuner équilibré + goûter de 16h.</p>
                <p className="text-2xl font-black font-mono text-indigo-950">15 000 FCFA <span className="text-xs text-slate-400">/ mois</span></p>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>45 élèves abonnés</span>
                  <span>Actif</span>
                </div>
              </div>

              <div className="bg-indigo-950 text-white p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-md text-white">Menu Hebdomadaire Suggéré</h4>
                  <ul className="mt-3 text-[11px] text-indigo-200 space-y-1.5 list-disc pl-3">
                    <li><span className="text-white font-bold">Lundi :</span> Riz au poisson (Thiéboudienne)</li>
                    <li><span className="text-white font-bold">Mardi :</span> Mafé au bœuf d'excellence</li>
                    <li><span className="text-white font-bold">Mercredi :</span> Poulet yassa traditionnel d'ACOM</li>
                    <li><span className="text-white font-bold">Jeudi :</span> Couscous sénégalais sauce gombo</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-indigo-300">
                  <span>Cuisine certifiée</span>
                  <span className="text-emerald-400 font-bold">Inspecté</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* GLOBAL MODALS (ANIMATED SEAMLESSLY) */}
      {/* ======================================= */}
      <AnimatePresence>
        {/* MODAL 1: CONFIGURATION RE-PENSÉ DE LA FICHE DES FRAIS ANNUELS */}
        {showFeeConfigModal && (() => {
          const activeS = students.find((s: any) => s.id === showFeeConfigModal.id) || showFeeConfigModal;
          const currentFees = activeS.tuitionFeesBreakdown || {
            inscription: 25000,
            scolarite: 300000,
            uniforme: 40000,
            transport: 60000,
            cantine: 90000
          };

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-sans"
              >
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-700" />
                    <div>
                      <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight">Fiche de Facturation</h3>
                      <p className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-widest mt-0.5">
                        Ajuster les tarifs pour {activeS.firstName} {activeS.lastName}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowFeeConfigModal(null)} 
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border shadow-sm text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const target = e.target as any;
                    const bd = {
                      inscription: Number(target.inscription.value || 0),
                      scolarite: Number(target.scolarite.value || 0),
                      uniforme: Number(target.uniforme.value || 0),
                      transport: Number(target.transport.value || 0),
                      cantine: Number(target.cantine.value || 0)
                    };
                    handleSaveFeeConfig(activeS.id, bd);
                    setShowFeeConfigModal(null);
                  }} 
                  className="p-8 space-y-4"
                >
                  <p className="text-xs text-slate-500 leading-normal mb-2 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                    Modifiez les frais annuels contractuels de l'élève. Ces valeurs déterminent les objectifs de recouvrement et les impayés du pensionnaire.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">1. Frais d'Inscription ({currency})</label>
                      <input name="inscription" type="number" defaultValue={(currentFees.inscription ?? 25000)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">2. Scolarité Annuelle ({currency})</label>
                      <input name="scolarite" type="number" defaultValue={(currentFees.scolarite ?? 300000)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">3. Uniforme Scolaire ({currency})</label>
                      <input name="uniforme" type="number" defaultValue={(currentFees.uniforme ?? 40000)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">4. Transport Scolaire ({currency})</label>
                      <input name="transport" type="number" defaultValue={(currentFees.transport ?? 60000)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">5. Cantine Scolaire ({currency})</label>
                      <input name="cantine" type="number" defaultValue={(currentFees.cantine ?? 90000)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-5 border-t border-gray-150 mt-4">
                    <button type="button" onClick={() => setShowFeeConfigModal(null)} className="flex-1 py-4 border border-slate-200 text-xs font-black uppercase tracking-wider rounded-2xl text-gray-500 hover:bg-gray-50">Annuler</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-4 bg-indigo-950 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-black transition-all">
                      {saving ? 'Sauvegarde...' : 'Enregistrer Tarifs'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          );
        })()}

        {/* MODAL 2: GUICHET DE CAISSE DÉDIÉ (LASER-FOCUSED ON PAYMENT COLLECTION) */}
        {showPaymentModal && (() => {
          const activeS = students.find((s: any) => s.id === showPaymentModal.id) || showPaymentModal;
          const currentFees = activeS.tuitionFeesBreakdown || {
            inscription: 25000,
            scolarite: 300000,
            uniforme: 40000,
            transport: 60000,
            cantine: 90000
          };

          const catsInfo = [
            { label: "Inscription / Réinscription", key: "inscription" },
            { label: "Scolarité Mensuelle", key: "scolarite" },
            { label: "Uniforme Scolaire", key: "uniforme" },
            { label: "Transport Scolaire", key: "transport" },
            { label: "Cantine Cafétéria", key: "cantine" }
          ];

          // Compute remaining due for selected category to guide the accountant
          const getCategoryStatus = (catLabel: string) => {
            const mapped = catsInfo.find(c => c.label === catLabel);
            if (!mapped) return { target: 0, paid: 0, owed: 0 };
            const target = Number(currentFees[mapped.key] ?? 0);
            const paid = (activeS.tuitionPayments || [])
              .filter((p: any) => p.category === catLabel)
              .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
            return { target, paid, owed: Math.max(0, target - paid) };
          };

          const statusSelected = getCategoryStatus(financeFormCategory);

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-sans"
              >
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-gray-150 flex justify-between items-center bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xs">💰</div>
                    <div>
                      <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Guichet d'Encaissement</h3>
                      <p className="text-[10px] font-bold font-mono text-emerald-600 uppercase tracking-widest mt-0.5">
                        Élève: {activeS.firstName} {activeS.lastName}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(null)} 
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border shadow-sm text-slate-400 hover:text-slate-850"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-8 space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">Rubrique de paiement</label>
                    <select 
                      value={financeFormCategory} 
                      onChange={(e) => {
                        const statusObj = getCategoryStatus(e.target.value);
                        setFinanceFormCategory(e.target.value);
                        setFinanceFormAmount(statusObj.owed);
                      }}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-extrabold cursor-pointer focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                    >
                      <option value="Scolarité Mensuelle">Scolarité Mensuelle</option>
                      <option value="Inscription / Réinscription">Inscription / Réinscription</option>
                      <option value="Uniforme Scolaire">Uniforme Scolaire</option>
                      <option value="Transport Scolaire">Transport Scolaire</option>
                      <option value="Cantine Cafétéria">Cantine Cafétéria</option>
                    </select>
                  </div>

                  {/* Context-aware information about selected category */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 flex items-center justify-between font-mono text-[11px]">
                    <div>
                      <span className="text-gray-400 uppercase text-[9px]">Dû Annuel:</span>
                      <p className="font-extrabold text-slate-800">{statusSelected.target.toLocaleString()} {currency}</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 uppercase text-[9px]">Déjà réglé:</span>
                      <p className="font-extrabold text-emerald-600">{statusSelected.paid.toLocaleString()} {currency}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-500 uppercase text-[9px]">Reste à payer:</span>
                      <p className="font-black text-rose-500">{statusSelected.owed.toLocaleString()} {currency}</p>
                    </div>
                  </div>

                  {/* Payment Amount */}
                  <div>
                    <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">Montant à Encaisser ({currency})</label>
                    <input 
                      type="number" 
                      value={financeFormAmount || ''} 
                      onChange={(e) => setFinanceFormAmount(Number(e.target.value))} 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-black font-mono text-base focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                    />
                    
                    {/* Quick shortcuts for ergonomic entry */}
                    {statusSelected.owed > 0 && (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setFinanceFormAmount(statusSelected.owed)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-mono text-[9px] rounded-lg font-bold border border-rose-150 transition-colors"
                        >
                          Solder Reste ({statusSelected.owed.toLocaleString()} FCFA)
                        </button>
                        {statusSelected.owed > 10000 && (
                          <button
                            type="button"
                            onClick={() => setFinanceFormAmount(Math.round(statusSelected.owed / 2))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[9px] rounded-lg font-bold border border-slate-200 transition-colors"
                          >
                            Régler 50% ({Math.round(statusSelected.owed / 2).toLocaleString()} FCFA)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">Moyen de règlement</label>
                    <select 
                      value={financeFormMode} 
                      onChange={(e) => setFinanceFormMode(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-extrabold cursor-pointer focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                    >
                      <option value="Wave">Wave Mobile Money</option>
                      <option value="Orange Money">Orange Money OM</option>
                      <option value="Espèces">Espèces (Liquide)</option>
                      <option value="Virement Bancaire">Virement Bancaire</option>
                      <option value="Chèque">Chèque Bancaire</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-150 mt-4">
                    <button type="button" onClick={() => setShowPaymentModal(null)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-gray-500 hover:bg-gray-50 uppercase tracking-wider text-xs">Annuler</button>
                    <button 
                      type="button" 
                      disabled={saving || financeFormAmount <= 0}
                      onClick={async () => {
                        await handleRecordPayment(activeS.id, {
                          amount: financeFormAmount,
                          category: financeFormCategory,
                          mode: financeFormMode
                        });
                        setShowPaymentModal(null);
                      }}
                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10"
                    >
                      {saving ? 'Validation...' : 'Encaisser & Reçu'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* MODAL 3: DOSSIER COMPTABLE HISTORIQUE (RE-PENSÉ SANS CHANTIER D'ÉCRITURE) */}
        {selectedStudentFinance && (() => {
          const activeStudentFinance = students.find((s: any) => s.id === selectedStudentFinance.id) || selectedStudentFinance;
          
          const currentFeesBreakdown = activeStudentFinance.tuitionFeesBreakdown || {
            inscription: 25000,
            scolarite: 300000,
            uniforme: 40000,
            transport: 60000,
            cantine: 90000
          };

          const detailedCategories = [
            { key: 'inscription', label: "Inscription / Réinscription", defaultVal: 25000, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', formValue: "Inscription / Réinscription" },
            { key: 'scolarite', label: "Scolarité Mensuelle", defaultVal: 300000, icon: DollarSign, color: 'text-sky-600 bg-sky-50 border-sky-100', formValue: "Scolarité Mensuelle" },
            { key: 'uniforme', label: "Uniforme Scolaire", defaultVal: 40000, icon: Package, color: 'text-amber-600 bg-amber-50 border-amber-100', formValue: "Uniforme Scolaire" },
            { key: 'transport', label: "Transport Scolaire", defaultVal: 60000, icon: Car, color: 'text-teal-600 bg-teal-50 border-teal-100', formValue: "Transport Scolaire" },
            { key: 'cantine', label: "Cantine Cafétéria", defaultVal: 90000, icon: Utensils, color: 'text-rose-600 bg-rose-50 border-rose-100', formValue: "Cantine Cafétéria" }
          ];

          // Compute global totals for this student
          let studentTotalTarget = 0;
          let studentTotalPaid = 0;
          
          detailedCategories.forEach(cat => {
            const target = Number(currentFeesBreakdown[cat.key] ?? cat.defaultVal);
            const paid = (activeStudentFinance.tuitionPayments || [])
              .filter((p: any) => p.category === cat.formValue)
              .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
            studentTotalTarget += target;
            studentTotalPaid += paid;
          });

          const studentTotalOwed = Math.max(0, studentTotalTarget - studentTotalPaid);

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 15 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98, y: 15 }}
                className="bg-slate-50 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col font-sans"
              >
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-indigo-50 text-indigo-700 font-extrabold text-sm rounded-2xl flex items-center justify-center border border-indigo-100 uppercase">
                      {activeStudentFinance.firstName?.[0] || 'E'}{activeStudentFinance.lastName?.[0] || 'S'}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-indigo-950 leading-tight">
                        Dossier & Historique : <span className="text-indigo-600">{activeStudentFinance.firstName} {activeStudentFinance.lastName}</span>
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono font-bold">
                        <span>Classe: <span className="text-slate-800 uppercase font-black">{activeStudentFinance.grade || 'N/A'}</span></span>
                        <span>•</span>
                        <span>Matricule: <span className="text-slate-800 font-black">{activeStudentFinance.matricule || 'GEN-2026'}</span></span>
                        <span>•</span>
                        <span>Parent: <span className="text-slate-800">{activeStudentFinance.parentContact || 'N/A'}</span></span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudentFinance(null)} 
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border shadow-sm text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* DOUBLE PANEL LAYOUT */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                  
                  {/* LEFT PANEL: CURRENT FEES BREAKDOWN PROGRESS (7 COLS) */}
                  <div className="lg:col-span-7 p-8 space-y-6 overflow-y-auto bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-650 font-mono">Grand Livre Comptable (Répartition)</h4>
                    </div>

                    {/* KPI Quick Status bar */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-4.5 rounded-2xl border border-black/5 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-mono uppercase font-black">Tarif global</span>
                        <p className="text-base font-black font-mono text-indigo-950 mt-1">{(studentTotalTarget).toLocaleString()} {currency}</p>
                      </div>
                      <div className="bg-white p-4.5 rounded-2xl border border-black/5 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-mono uppercase font-black">Réglé</span>
                        <p className="text-base font-black font-mono text-emerald-600 mt-1">{(studentTotalPaid).toLocaleString()} {currency}</p>
                      </div>
                      <div className="bg-white p-4.5 rounded-2xl border border-black/5 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-mono uppercase font-black font-semibold">Reste</span>
                        <p className={`text-base font-black font-mono mt-1 ${studentTotalOwed > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {(studentTotalOwed).toLocaleString()} {currency}
                        </p>
                      </div>
                    </div>

                    {/* Fee list items */}
                    <div className="space-y-3.5">
                      {detailedCategories.map((cat) => {
                        const target = Number(currentFeesBreakdown[cat.key] ?? cat.defaultVal);
                        const paid = (activeStudentFinance.tuitionPayments || [])
                          .filter((p: any) => p.category === cat.formValue)
                          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                        const owed = Math.max(0, target - paid);
                        const pct = target > 0 ? Math.min(100, Math.round((paid / target) * 100)) : 0;

                        return (
                          <div key={cat.key} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cat.color}`}>
                                  <cat.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="font-extrabold text-indigo-950 text-sm">{cat.label}</h5>
                                  <p className="text-[10px] font-mono text-slate-400">
                                    Dû: <span className="font-extrabold text-slate-750">{target.toLocaleString()} {currency}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                {target === 0 ? (
                                  <span className="px-2 py-0.5 bg-slate-50 text-slate-300 rounded text-[8.5px] font-black uppercase">Non applicable</span>
                                ) : owed === 0 ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8.5px] font-black uppercase inline-flex items-center gap-0.5">
                                    ✓ Soldé
                                  </span>
                                ) : paid > 0 ? (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8.5px] font-black uppercase font-bold">Payé {pct}%</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 rounded text-[8.5px] font-black uppercase">Impayé</span>
                                )}
                              </div>
                            </div>

                            {/* Progress bar info */}
                            {target > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span>Payé: <strong className="text-emerald-650 font-extrabold">{paid.toLocaleString()}</strong> FCFA</span>
                                  <span>Reste: <strong className="text-rose-500 font-extrabold">{owed.toLocaleString()}</strong> FCFA</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT PANEL: PAYMENT HISTORY LOGS & RECEIPT PRINTING (5 COLS) */}
                  <div className="lg:col-span-5 p-8 flex flex-col h-full bg-white overflow-y-auto">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-650 font-mono">Historique des Reçus Certifiés</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Consultez tous les règlements encaissés pour cet étudiant cette année académique. Vous pouvez ré-émettre et imprimer chaque ticket historique.
                      </p>
                    </div>

                    <div className="flex-1 mt-6 overflow-y-auto space-y-3 pr-1">
                      {(activeStudentFinance.tuitionPayments || []).length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed text-gray-450 text-xs">
                          Aucun versement n'a été enregistré pour cet élève.
                        </div>
                      ) : (
                        [...(activeStudentFinance.tuitionPayments || [])].reverse().map((pay: any) => (
                          <div key={pay.id} className="bg-slate-50 hover:bg-slate-100 p-4 rounded-xl border border-gray-150 transition-colors flex items-center justify-between gap-3 shadow-xs">
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-slate-800">{pay.category}</p>
                              <p className="text-[10px] font-mono text-indigo-950 font-bold">
                                {pay.receiptNumber} • Mode: <span className="font-black text-indigo-600">{pay.mode}</span>
                              </p>
                              <p className="text-[9px] font-mono text-slate-400">
                                Encaissé le : {format(new Date(pay.date), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-black font-mono text-emerald-600">+{pay.amount.toLocaleString()} FCFA</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceipt({
                                    ...pay,
                                    studentName: `${activeStudentFinance.firstName} ${activeStudentFinance.lastName}`,
                                    matricule: activeStudentFinance.matricule || 'N/A',
                                    grade: activeStudentFinance.grade || 'N/A'
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:scale-105 transition-all bg-white rounded-lg border border-slate-200 shadow-sm"
                                title="Imprimer le Reçu"
                              >
                                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-6 pt-5 border-t flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentFinance(null)}
                        className="px-5 py-2.5 bg-indigo-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
                      >
                        Fermer le dossier
                      </button>
                    </div>

                  </div>

                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* MODAL 3: DESIGNER RECEIPT FOR PRINT */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950">Aperçu du Reçu</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                    REÇU OFFICIEL DE TRÉSORERIE
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedReceipt(null)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors border shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* PRINTABLE RECEIPT LAYOUT */}
              <div id="school-receipt-print" className="p-8 space-y-6 printable-body font-sans text-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-indigo-950">{merchant.name}</h2>
                    <p className="text-[10px] text-slate-500 font-medium">B.P. 3381 / Dakar, Sénégal</p>
                    <p className="text-[9px] font-mono text-indigo-600">contact@acom-school.sn</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-indigo-950 text-white text-[9px] font-black tracking-widest uppercase rounded">
                      REÇU DE COMMERCE
                    </span>
                    <p className="text-[11px] font-mono font-bold text-indigo-950 mt-2">{selectedReceipt.receiptNumber}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Date: {format(new Date(selectedReceipt.date), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2 text-xs">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Élève :</span>
                    <span className="font-extrabold text-indigo-950 text-right">{selectedReceipt.studentName}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Matricule :</span>
                    <span className="font-mono text-right">{selectedReceipt.matricule}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Niveau d'étude :</span>
                    <span className="font-extrabold text-right">{selectedReceipt.grade}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Rubrique comptable :</span>
                    <span className="font-extrabold text-right text-indigo-950">{selectedReceipt.category}</span>
                  </div>
                </div>

                <div className="py-6 border-y border-dashed border-gray-200 flex justify-between items-center bg-slate-50 border-x rounded-xl px-6">
                  <span className="text-xs font-black uppercase text-indigo-950 tracking-wider">Montant total net perçu</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">{Number(selectedReceipt.amount).toLocaleString()} {currency}</span>
                </div>

                <div className="flex justify-between items-end gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">Mode de versement</p>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded border border-indigo-100">
                      {selectedReceipt.mode}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mb-12">Le Caissier Général</p>
                    <p className="text-[10px] font-extrabold text-indigo-950 underline decoration-indigo-500">SIGNÉ ÉLECTRONIQUEMENT</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex space-x-3">
                <button 
                  onClick={() => window.print()} 
                  className="flex-1 py-3 px-4 bg-indigo-950 text-white rounded-xl text-xs font-bold hover:bg-black flex items-center justify-center space-x-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Reçu</span>
                </button>
                <button 
                  onClick={() => {
                    alert("Reçu transmis avec succès au représentant légal par courrier et WhatsApp !");
                    setSelectedReceipt(null);
                  }} 
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center justify-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer WhatsApp</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL 4: ADD GENERAL CHARGES */}
        {isAddingExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950 font-sans">Enregistrer Dépense</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                    LIVRE JOURNAL DES COMPTES
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddingExpense(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors border shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Désignation de la charge</label>
                  <input 
                    type="text" 
                    required 
                    value={newExpense.title} 
                    onChange={e => setNewExpense({...newExpense, title: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none font-bold text-sm" 
                    placeholder="ex: Facture SENELEC (Electricité), Carburant bus..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Montant décaissé ({currency})</label>
                    <input 
                      type="number" 
                      required 
                      value={newExpense.amount || ''} 
                      onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Catégorie de comptes</label>
                    <select 
                      value={newExpense.category} 
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-bold"
                    >
                      <option value="Salaires">Salaires (Professeurs / Admin)</option>
                      <option value="Électricité / SENELEC">Électricité / SENELEC</option>
                      <option value="Eau / SDE">Eau / SDE</option>
                      <option value="Fournitures Bureau">Fournitures bureau & ramettes</option>
                      <option value="Internet / Orange">Internet / Orange Telecom</option>
                      <option value="Maintenance / Réparations">Maintenance & Chantiers</option>
                      <option value="Carburant / Transport">Carburant Bus Scolaire</option>
                      <option value="Cuisine / Cantine">Approvisionnement Cantine</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Observations / Libellé de liaison</label>
                  <textarea 
                    value={newExpense.description} 
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none text-xs" 
                    placeholder="Informations ou précisions supplémentaires..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddingExpense(false)} className="flex-1 py-4 border rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
                    {saving ? 'Enregistrement...' : 'Valider Décaissement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 5: ADD UNIFORM / BOOKS TO PRODUCT INVENTORY */}
        {isAddingProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950 font-sans">Enregistrer Matériel</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                    DISTRIBUTION SCOLAIRE
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddingProduct(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors border shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom de l'article / Description</label>
                  <input 
                    type="text" 
                    required 
                    value={newProduct.name} 
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none font-bold text-sm" 
                    placeholder="ex: Uniforme d'excellence 6e, Lot Cahiers double..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Prix de vente unitaire ({currency})</label>
                    <input 
                      type="number" 
                      required 
                      value={newProduct.price || ''} 
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Quantité initiale magasin</label>
                    <input 
                      type="number" 
                      required 
                      value={newProduct.stockQuantity || ''} 
                      onChange={e => setNewProduct({...newProduct, stockQuantity: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-mono font-bold" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Catégorie uniforme & fournitures</label>
                  <select 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none font-bold"
                  >
                    <option value="Uniforme">Uniforme complet</option>
                    <option value="Livres">Livres & Manuels scolaires</option>
                    <option value="Cahiers">Lot de cahiers de brouillon/TP</option>
                    <option value="Fournitures">Fournitures généraux d'étude</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 py-4 border rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-indigo-950 text-white rounded-2xl font-bold hover:bg-black transition-all">
                    {saving ? 'Création...' : 'Valider & Mettre en rayon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
