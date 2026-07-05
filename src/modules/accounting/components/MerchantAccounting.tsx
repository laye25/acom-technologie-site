import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2, X, Receipt, Check, RefreshCw, Wrench, Truck, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { syncService } from '../../../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant } from '../../../types';
import { SchoolAccountingSaaS } from '../../../components/admin/SchoolAccountingSaaS';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';

interface AccountingOutflow {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  description?: string;
  source: 'general' | 'delivery' | 'maintenance';
  syncStatus?: string;
  sortKey: number;
}

const MerchantAccounting = ({ merchant, subTab }: { merchant: Merchant, subTab?: string }) => {
  if (merchant.type === 'scolaire') {
    return <SchoolAccountingSaaS merchant={merchant as any} subTab={subTab} />;
  }

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseDate, setExpenseDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [newExpense, setNewExpense] = useState({ title: '', amount: 0, category: 'Général', description: '' });
  const [saving, setSaving] = useState(false);
  const [expenseLimit, setExpenseLimit] = useState(10);
  const [filterSource, setFilterSource] = useState('all');

  useEffect(() => {
    syncService.syncExpenses(merchant.id);
  }, [merchant.id]);

  // Live queries for real-time offline-first updates
  const manualExpenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const deliveries = useLiveQuery(() => 
    db.delivery_assignments.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const fleetMaintenances = useLiveQuery(() => 
    db.vehicle_maintenances.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // Calculate stats
  const stats = useMemo(() => {
    let totalGeneral = 0;
    let totalDeliveries = 0;
    let totalMaintenances = 0;

    manualExpenses.forEach(e => {
      totalGeneral += (e.amount || 0);
    });
    deliveries.forEach(d => {
      totalDeliveries += (d.fee || 0);
    });
    fleetMaintenances.forEach(m => {
      totalMaintenances += (m.cost || 0);
    });

    const totalOutflow = totalGeneral + totalDeliveries + totalMaintenances;

    return {
      totalGeneral,
      totalDeliveries,
      totalMaintenances,
      totalOutflow
    };
  }, [manualExpenses, deliveries, fleetMaintenances]);

  // Combine and map into unified list
  const combinedOutflows = useMemo(() => {
    const list: AccountingOutflow[] = [];

    // 1. Manual General Expenses
    manualExpenses.forEach(exp => {
      const dateVal = exp.date || exp.createdAt;
      let dateStr = '';
      let sortKey = 0;
      if (dateVal) {
        try {
          const d = (dateVal as any).seconds ? new Date((dateVal as any).seconds * 1000) : new Date(dateVal);
          dateStr = d.toISOString();
          sortKey = d.getTime();
        } catch {
          dateStr = new Date().toISOString();
          sortKey = Date.now();
        }
      } else {
        dateStr = new Date().toISOString();
        sortKey = Date.now();
      }
      list.push({
        id: exp.id,
        title: exp.title,
        category: exp.category || 'Général',
        date: dateStr,
        amount: exp.amount || 0,
        description: exp.description,
        source: 'general',
        syncStatus: (exp as any).syncStatus,
        sortKey
      });
    });

    // 2. Deliveries (courses / runs)
    deliveries.forEach(del => {
      if (del.fee && del.fee > 0) {
        let sortKey = del.createdAt || Date.now();
        let dateStr = '';
        if (del.date) {
          try {
            const d = new Date(del.date);
            dateStr = d.toISOString();
            sortKey = d.getTime();
          } catch {
            dateStr = new Date(del.createdAt || Date.now()).toISOString();
          }
        } else if (del.createdAt) {
          dateStr = new Date(del.createdAt).toISOString();
        } else {
          dateStr = new Date().toISOString();
        }
        list.push({
          id: del.id,
          title: `Course / Livraison #${del.ticketNumber || del.id.slice(0, 6)}`,
          category: 'Course & Logistique',
          date: dateStr,
          amount: del.fee,
          description: `Livreur : ${del.agentName || 'Non assigné'} | Statut : ${del.status === 'delivered' ? 'Livré' : del.status === 'in_transit' ? 'En cours' : del.status === 'failed' ? 'Échoué' : 'Assigné'} | Client : ${del.clientName || 'N/A'}`,
          source: 'delivery',
          syncStatus: (del as any).syncStatus,
          sortKey
        });
      }
    });

    // 3. Vehicle Maintenance Logs
    fleetMaintenances.forEach(maint => {
      if (maint.cost && maint.cost > 0) {
        let sortKey = maint.updatedAt || Date.now();
        let dateStr = '';
        if (maint.date) {
          try {
            const d = new Date(maint.date);
            dateStr = d.toISOString();
            sortKey = d.getTime();
          } catch {
            dateStr = new Date(maint.updatedAt || Date.now()).toISOString();
          }
        } else if (maint.updatedAt) {
          dateStr = new Date(maint.updatedAt).toISOString();
        } else {
          dateStr = new Date().toISOString();
        }

        const typeLabels: Record<string, string> = {
          vidange: 'Vidange',
          pneus: 'Pneus',
          freins: 'Freins',
          moteur: 'Moteur',
          assurance: 'Assurance',
          controle_technique: 'Contrôle technique',
          autre: 'Autre d’entretien'
        };
        const friendlyType = typeLabels[maint.type] || 'Entretien';

        list.push({
          id: maint.id,
          title: `${friendlyType} (Véhicule : ${maint.vehiclePlate || 'N/A'})`,
          category: 'Maintenance Flotte',
          date: dateStr,
          amount: maint.cost,
          description: `Modèle : ${maint.vehicleModel || 'N/A'} | Garage : ${maint.garage || 'Non spécifié'} ${maint.notes ? `| Note : ${maint.notes}` : ''}`,
          source: 'maintenance',
          syncStatus: (maint as any).syncStatus,
          sortKey
        });
      }
    });

    // Sort descending
    return list.sort((a, b) => b.sortKey - a.sortKey);
  }, [manualExpenses, deliveries, fleetMaintenances]);

  // Filter outcomes
  const filteredOutflows = useMemo(() => {
    if (filterSource === 'all') return combinedOutflows;
    return combinedOutflows.filter(item => item.source === filterSource);
  }, [combinedOutflows, filterSource]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    setSaving(true);
    try {
      await dbService.merchantExpenses.save({
        ...newExpense,
        merchantId: merchant.id,
        date: expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString()
      });
      syncService.syncExpenses(merchant.id);
      setIsAddingExpense(false);
      setNewExpense({ title: '', amount: 0, category: 'Général', description: '' });
      setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
      triggerAcomAlert('Succès', 'Dépense enregistrée avec succès !', 'success', 'SYSTÈME');
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de l\'enregistrement', 'error', 'ALERTE');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Comptabilité</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des flux financiers & dépenses</p>
        </div>
        <button 
          onClick={() => {
            setNewExpense({ title: '', amount: 0, category: 'Général', description: '' });
            setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
            setIsAddingExpense(true);
          }} 
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total outflows */}
        <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Charges Totales</span>
              <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-ink font-mono mt-1">
              {stats.totalOutflow.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
            </p>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-rose-500 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2: General expenses */}
        <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Dépenses Générales</span>
              <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-500 font-mono mt-1">
              {stats.totalGeneral.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
            </p>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-amber-500 h-full" 
              style={{ width: `${stats.totalOutflow > 0 ? (stats.totalGeneral / stats.totalOutflow) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Deliveries costs */}
        <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Coût des Courses</span>
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-500 font-mono mt-1">
              {stats.totalDeliveries.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
            </p>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-full" 
              style={{ width: `${stats.totalOutflow > 0 ? (stats.totalDeliveries / stats.totalOutflow) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Fleet maintenances */}
        <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Entretien de la Flotte</span>
              <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Wrench className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-500 font-mono mt-1">
              {stats.totalMaintenances.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
            </p>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full" 
              style={{ width: `${stats.totalOutflow > 0 ? (stats.totalMaintenances / stats.totalOutflow) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Tout le flux de trésorerie' },
          { id: 'general', label: 'Dépenses Générales' },
          { id: 'delivery', label: 'Courses & Logistique' },
          { id: 'maintenance', label: 'Entretien Véhicules' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterSource(btn.id)}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
              filterSource === btn.id
                ? 'bg-ink text-white border-ink shadow-sm'
                : 'bg-white text-gray-500 border-black/5 hover:bg-gray-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Outflows List Table */}
      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Désignation & Détails</th>
                <th className="px-8 py-5">Catégorie</th>
                <th className="px-8 py-5">Date d'émission</th>
                <th className="px-8 py-5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOutflows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Receipt className="w-6 h-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">Aucune charge enregistrée pour ce filtre</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOutflows.slice(0, expenseLimit).map((outflow) => (
                  <tr key={outflow.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-start gap-4">
                        {outflow.source === 'general' && (
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mt-0.5 shadow-sm border border-amber-100/50">
                            <Receipt className="w-5 h-5" />
                          </div>
                        )}
                        {outflow.source === 'delivery' && (
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mt-0.5 shadow-sm border border-blue-100/50">
                            <Truck className="w-5 h-5" />
                          </div>
                        )}
                        {outflow.source === 'maintenance' && (
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mt-0.5 shadow-sm border border-emerald-100/50">
                            <Wrench className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-ink text-sm leading-tight truncate">{outflow.title}</p>
                          {outflow.description && (
                            <p className="text-xs text-gray-500 mt-1 italic font-medium leading-relaxed">✏️ {outflow.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">REF: {outflow.id.slice(0, 8)}</p>
                            {outflow.syncStatus && (
                              <>
                                <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                                  outflow.syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  outflow.syncStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-gray-50 text-gray-400 border-gray-100'
                                }`}>
                                  {outflow.syncStatus === 'synced' ? <Check className="w-2 h-2" /> : <RefreshCw className="w-2 h-2 animate-spin" />}
                                  <span className="text-[7px] font-black uppercase">{outflow.syncStatus}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {outflow.source === 'general' && (
                        <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {outflow.category}
                        </span>
                      )}
                      {outflow.source === 'delivery' && (
                        <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          🚚 Course
                        </span>
                      )}
                      {outflow.source === 'maintenance' && (
                        <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          🔧 Maintenance
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-ink uppercase">
                        {(() => {
                          if (!outflow.date) return '-';
                          try {
                            const d = new Date(outflow.date);
                            return format(d, 'dd/MM/yyyy');
                          } catch {
                            return '-';
                          }
                        })()}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-rose-600 font-mono">
                        -{outflow.amount.toLocaleString()} <span className="text-[10px] opacity-60">{merchant.currency}</span>
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredOutflows.length > expenseLimit && (
            <div className="p-4 flex justify-center border-t border-gray-100">
              <button 
                onClick={() => setExpenseLimit(prev => prev + 10)}
                className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Voir plus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Nouvelle dépense</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Enregistrement comptable</p>
                </div>
                <button onClick={() => setIsAddingExpense(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Désignation / Titre</label>
                  <input type="text" required value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Montant ({merchant.currency})</label>
                    <input type="number" required value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date de Dépense</label>
                    <input 
                      type="date" 
                      required 
                      value={expenseDate} 
                      onChange={e => setExpenseDate(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 font-mono font-bold text-sm" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie (Sélectionnez ou saisissez)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Approvisionnement', 'Salaires', 'Loyer & Factures', 'Électricité / Eau', 'Machines', 'Divers'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewExpense({ ...newExpense, category: cat })}
                        className={`py-2.5 px-3 text-[10px] font-bold rounded-xl border transition-all ${
                          newExpense.category === cat 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/10 font-bold' 
                            : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Saisir autre catégorie..." 
                    value={newExpense.category} 
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})} 
                    className="w-full mt-3 px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 text-xs font-bold" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Description / Justification (Optionnel)</label>
                  <textarea 
                    rows={2}
                    placeholder="Saisissez des détails supplémentaires sur cette dépense..." 
                    value={newExpense.description} 
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 text-xs font-medium" 
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddingExpense(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer la dépense'}
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

export default MerchantAccounting;
