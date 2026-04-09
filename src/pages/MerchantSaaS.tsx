import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { dbService as db } from '../services/dbService';
import { Merchant, MerchantProduct, MerchantSale, MerchantExpense, MerchantSupplier, MerchantPlan } from '../types';
import { useSupabaseData, TableName } from '../hooks/useSupabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Package, ShoppingCart, PieChart, Plus, Trash2, 
  Edit2, Search, Loader2, Save, X, TrendingUp, 
  DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle,
  BarChart3, Settings, User, Phone, Mail, MapPin,
  Calculator, Receipt, CreditCard, Smartphone, Banknote,
  Clock, CheckCircle, TrendingDown, ArrowRight, FileText, Truck,
  Wrench, HardHat, Car, Users, GraduationCap, Stethoscope, Calendar,
  Briefcase, ClipboardList, UserPlus, Building2, Check, Zap, Minus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import { 
  format, subDays, startOfDay, endOfDay, eachDayOfInterval, 
  startOfYear, eachMonthOfInterval, isSameDay, isSameMonth 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { OptimizedImage } from '../components/OptimizedImage';

const generateReceiptPDF = (merchant: Merchant, sale: any) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // Receipt printer format
  });

  const margin = 5;
  let y = 10;

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(merchant.name, 40, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (merchant.address) {
    doc.text(merchant.address, 40, y, { align: 'center' });
    y += 4;
  }
  if (merchant.phone) {
    doc.text(`Tel: ${merchant.phone}`, 40, y, { align: 'center' });
    y += 4;
  }
  
  doc.line(margin, y, 80 - margin, y);
  y += 5;

  // Sale Info
  const saleDate = sale.createdAt?.seconds 
    ? new Date(sale.createdAt.seconds * 1000) 
    : sale.createdAt instanceof Date 
      ? sale.createdAt 
      : new Date();
      
  doc.text(`Date: ${format(saleDate, 'dd/MM/yyyy HH:mm')}`, margin, y);
  y += 4;
  doc.text(`Client: ${sale.customerName || 'Client POS'}`, margin, y);
  y += 6;

  // Items Header
  doc.setFont('helvetica', 'bold');
  doc.text('Article', margin, y);
  doc.text('Qté', 45, y);
  doc.text('Total', 75, y, { align: 'right' });
  y += 3;
  doc.line(margin, y, 80 - margin, y);
  y += 5;

  // Items
  doc.setFont('helvetica', 'normal');
  sale.items.forEach((item: any) => {
    doc.text(item.name.substring(0, 20), margin, y);
    doc.text(item.quantity.toString(), 45, y);
    doc.text(`${(item.price * item.quantity).toLocaleString()}`, 75, y, { align: 'right' });
    y += 4;
  });

  y += 2;
  doc.line(margin, y, 80 - margin, y);
  y += 6;

  // Total
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin, y);
  doc.text(`${sale.totalAmount.toLocaleString()} ${merchant.currency}`, 75, y, { align: 'right' });
  y += 8;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Merci de votre visite !', 40, y, { align: 'center' });

  doc.save(`recu_${sale.id || Date.now()}.pdf`);
};

const MerchantSaaS = () => {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Fetch merchant profile
  useEffect(() => {
    const fetchMerchant = async () => {
      if (!user) return;
      try {
        setLoadingMerchant(true);
        // Try to get from Dexie first
        let m = await db.merchants.where('ownerId').equals(user.id).first();
        
        // If not found, try to fetch from Supabase and save to Dexie
        if (!m) {
          m = await dbService.merchants.getByOwner(user.id);
          if (m) {
            await db.merchants.put(m);
          }
        }
        setMerchant(m);
      } catch (error) {
        console.error('Error fetching merchant:', error);
      } finally {
        setLoadingMerchant(false);
      }
    };
    fetchMerchant();
  }, [user]);

  const getTabs = (type: string) => {
    const commonTabs = [
      { id: 'dashboard', label: 'Aperçu', icon: PieChart },
      { id: 'accounting', label: 'Compta', icon: BarChart3 },
      { id: 'settings', label: 'Réglages', icon: Settings },
    ];

    switch (type) {
      case 'entreprise':
        return [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'interventions', label: 'Interventions', icon: Wrench },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
      case 'chantier':
        return [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'projects', label: 'Projets', icon: HardHat },
          { id: 'inventory', label: 'Matériel', icon: Package },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
      case 'transport':
        return [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'vehicles', label: 'Véhicules', icon: Car },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
      case 'rh':
        return [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'employees', label: 'Employés', icon: Users },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
      case 'scolaire':
        return [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'students', label: 'Élèves', icon: GraduationCap },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
      case 'medical':
        return [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'patients', label: 'Patients', icon: Stethoscope },
          { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
      default: // boutique
        return [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'inventory', label: 'Stock', icon: Package },
          { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
          { id: 'pos', label: 'Vente', icon: ShoppingCart },
          { id: 'sales', label: 'Ventes', icon: Receipt },
          { id: 'audit', label: 'Audit', icon: Clock },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
    }
  };

  if (loadingMerchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!merchant) {
    return <MerchantOnboarding onComplete={(m) => setMerchant(m)} />;
  }

  const tabs = getTabs(merchant.type || 'boutique');

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/10 shadow-inner">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-ink tracking-tight">{merchant.name}</h1>
              <div className="flex items-center mt-1.5">
                <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">
                  {merchant.type === 'entreprise' ? 'Management Entreprise' :
                   merchant.type === 'chantier' ? 'Management BTP / Chantier' :
                   merchant.type === 'transport' ? 'Management Flotte' :
                   merchant.type === 'rh' ? 'Management RH' :
                   merchant.type === 'scolaire' ? 'Management Scolaire' :
                   merchant.type === 'medical' ? 'Management Médical' :
                   'Management Commerce'}
                </span>
                <span className="mx-3 w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">
                  Plan {merchant.plan}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-black/5 shadow-sm overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <TabButton 
                key={tab.id}
                active={activeTab === tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                icon={tab.icon} 
                label={tab.label} 
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <MerchantDashboard key="dashboard" merchant={merchant} onUpdate={setMerchant} />}
          {activeTab === 'inventory' && <InventoryManager key="inventory" merchant={merchant} />}
          {activeTab === 'suppliers' && <SupplierManager key="suppliers" merchant={merchant} />}
          {activeTab === 'pos' && <MerchantPOS key="pos" merchant={merchant} />}
          {activeTab === 'sales' && <MerchantSalesHistory key="sales" merchant={merchant} />}
          {activeTab === 'audit' && <MerchantAuditLog key="audit" merchant={merchant} />}
          {activeTab === 'accounting' && <MerchantAccounting key="accounting" merchant={merchant} />}
          {activeTab === 'settings' && <MerchantSettings key="settings" merchant={merchant} onUpdate={(m) => setMerchant(m)} setActiveTab={setActiveTab} />}
          
          {/* Specialized SaaS Tabs */}
          {activeTab === 'interventions' && <ServiceManager key="interventions" merchant={merchant} />}
          {activeTab === 'projects' && <ProjectManager key="projects" merchant={merchant} />}
          {activeTab === 'vehicles' && <FleetManager key="vehicles" merchant={merchant} />}
          {activeTab === 'employees' && <HRManager key="employees" merchant={merchant} />}
          {activeTab === 'students' && <SchoolManager key="students" merchant={merchant} />}
          {activeTab === 'patients' && <MedicalManager key="patients" merchant={merchant} />}
          {activeTab === 'appointments' && <AppointmentManager key="appointments" merchant={merchant} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
      active 
        ? 'bg-ink text-white shadow-xl shadow-ink/20 scale-105' 
        : 'text-gray-400 hover:text-ink hover:bg-gray-50'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-primary' : ''}`} />
    <span>{label}</span>
  </button>
);



// --- Onboarding ---
const MerchantOnboarding = ({ onComplete }: { onComplete: (m: Merchant) => void }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'boutique';
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('FCFA');
  const [plan, setPlan] = useState<MerchantPlan>('FREE');
  const [loading, setLoading] = useState(false);

  const getSaaSConfig = (type: string) => {
    switch (type) {
      case 'entreprise':
        return { label: "l'entreprise", placeholder: "ex: Mon Entreprise de Services" };
      case 'chantier':
        return { label: "le chantier / BTP", placeholder: "ex: Chantier Résidence Horizon" };
      case 'transport':
        return { label: "la flotte / transport", placeholder: "ex: Transports Express" };
      case 'rh':
        return { label: "l'organisation RH", placeholder: "ex: Ma Structure RH" };
      case 'scolaire':
        return { label: "l'établissement scolaire", placeholder: "ex: École Excellence" };
      case 'medical':
        return { label: "l'établissement médical", placeholder: "ex: Clinique du Parc" };
      default:
        return { label: "la boutique", placeholder: "ex: Ma Boutique Tech" };
    }
  };

  const { label, placeholder } = getSaaSConfig(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const merchantData = {
        ownerId: user.id,
        name,
        currency,
        type, // Store the type in the merchant profile
        plan, // Store the selected plan
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const id = await db.merchants.save(merchantData);
      onComplete({ ...merchantData, id } as Merchant);
      toast.success(`Votre ${label} a été créée !`);
    } catch (error: any) {
      console.error('Erreur lors de la création du marchand:', error);
      
      // Check for missing table error from Supabase
      if (error.message?.includes("Could not find the table 'public.merchants'")) {
        toast.error("Base de données non configurée. Veuillez exécuter le script SQL dans votre console Supabase.");
      } else {
        toast.error(`Erreur lors de la création: ${error.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-black/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-ink to-primary opacity-20"></div>
        
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/10 shadow-inner">
          <Store className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-3xl font-black text-center text-ink mb-2 tracking-tight">Acom SaaS</h2>
        <p className="text-gray-400 text-center mb-10 text-sm font-medium">
          Configurez <span className="text-ink font-bold">{label}</span> pour commencer à gérer votre activité avec précision.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nom de {label}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-ink placeholder:text-gray-300"
              placeholder={placeholder}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Devise</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-ink appearance-none bg-white"
              >
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Forfait</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as MerchantPlan)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-ink appearance-none bg-white"
              >
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="STANDARD">STANDARD</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-ink text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-ink/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Lancer mon activité</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Dashboard ---
const PlanUpgradeModal = ({ 
  merchant, 
  onClose, 
  onUpdate 
}: { 
  merchant: Merchant, 
  onClose: () => void, 
  onUpdate: (m: Merchant) => void 
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'FREE',
      name: 'FREE',
      price: '0',
      description: 'Pour débuter votre activité',
      features: ['Gestion de stock basique', '10 ventes par jour', '1 utilisateur'],
      color: 'bg-gray-100 text-gray-600'
    },
    {
      id: 'BASIC',
      name: 'BASIC',
      price: '10 000',
      description: 'Pour les petites boutiques',
      features: ['Ventes illimitées', '3 utilisateurs', 'Facturation PDF'],
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'STANDARD',
      name: 'STANDARD',
      price: '25 000',
      recommended: true,
      description: 'Pour les commerces en croissance',
      features: ['Multi-boutiques', 'Analytique avancée', 'Support prioritaire'],
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'PREMIUM',
      name: 'PREMIUM',
      price: '45 000',
      description: 'La solution complète',
      features: ['Boutiques illimitées', 'API personnalisée', 'Account Manager'],
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    try {
      const updatedMerchant = { ...merchant, plan: planId as any, updatedAt: new Date() };
      await db.merchants.save(updatedMerchant);
      onUpdate(updatedMerchant);
      toast.success(`Plan mis à jour vers ${planId}`);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du plan');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Passer au forfait supérieur</h2>
            <p className="text-sm text-gray-500">Choisissez le plan qui correspond à vos besoins actuels.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-6 rounded-3xl border-2 transition-all ${
                merchant.plan === plan.id 
                  ? 'border-primary bg-primary/5' 
                  : plan.recommended 
                    ? 'border-primary/20 bg-white' 
                    : 'border-gray-100 bg-white'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full">
                  RECOMMANDÉ
                </div>
              )}
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.color}`}>
                <Zap className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                <span className="text-xs font-bold text-gray-400">FCFA/mois</span>
              </div>

              <p className="text-xs text-gray-500 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                    <Check className="w-3 h-3 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={merchant.plan === plan.id || !!loading}
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${
                  merchant.plan === plan.id
                    ? 'bg-emerald-50 text-emerald-600 cursor-default'
                    : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
                }`}
              >
                {loading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : merchant.plan === plan.id ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Actuel</>
                ) : (
                  'Choisir ce plan'
                )}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const MerchantDashboard = ({ merchant, onUpdate }: { merchant: Merchant, onUpdate: (m: Merchant) => void }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const productOptions = useMemo(() => ({
    tableName: 'merchant_products' as TableName,
    where: [['merchantId', '==', merchant.id]],
    mapper: (data: any) => ({
      ...data,
      merchantId: data.merchant_id,
      costPrice: data.cost_price,
      stockQuantity: data.stock_quantity,
      minStockLevel: data.min_stock_level,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }), [merchant.id]);

  const saleOptions = useMemo(() => ({
    tableName: 'merchant_sales' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const },
    limit: 500,
    mapper: (data: any) => ({
      ...data,
      merchantId: data.merchant_id,
      totalAmount: data.total_amount,
      paymentMethod: data.payment_method,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      processedBy: data.processed_by,
      createdAt: data.created_at
    })
  }), [merchant.id]);

  const expenseOptions = useMemo(() => ({
    tableName: 'merchant_expenses' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const },
    limit: 500,
    mapper: (data: any) => ({
      ...data,
      merchantId: data.merchant_id,
      createdAt: data.created_at
    })
  }), [merchant.id]);

  const { data: products } = useSupabaseData<MerchantProduct>(productOptions);
  const { data: sales } = useSupabaseData<MerchantSale>(saleOptions);
  const { data: expenses } = useSupabaseData<MerchantExpense>(expenseOptions);
  
  // Point 6: Aggregation - Fetch global merchant stats
  const { data: merchantStatsData } = useSupabaseData<any>(useMemo(() => ({ 
    tableName: 'merchant_stats', 
    filter: { column: 'id', value: merchant.id } 
  }), [merchant.id]));
  const merchantStats = merchantStatsData?.[0];

  // Specialized data for stats
  const { data: interventions } = useSupabaseData<any>(useMemo(() => ({ tableName: 'interventions', where: [['merchantId', '==', merchant.id]], limit: 100 }), [merchant.id]));
  const { data: projects } = useSupabaseData<any>(useMemo(() => ({ tableName: 'projects', where: [['merchantId', '==', merchant.id]], limit: 100 }), [merchant.id]));
  const { data: vehicles } = useSupabaseData<any>(useMemo(() => ({ tableName: 'vehicles', where: [['merchantId', '==', merchant.id]], limit: 100 }), [merchant.id]));
  const { data: employees } = useSupabaseData<any>(useMemo(() => ({ tableName: 'employees', where: [['merchantId', '==', merchant.id]], limit: 100 }), [merchant.id]));
  const { data: students } = useSupabaseData<any>(useMemo(() => ({ tableName: 'students', where: [['merchantId', '==', merchant.id]], limit: 100 }), [merchant.id]));
  const { data: patients } = useSupabaseData<any>(useMemo(() => ({ tableName: 'patients', where: [['merchantId', '==', merchant.id]], limit: 100 }), [merchant.id]));
  const { data: appointments } = useSupabaseData<any>(useMemo(() => ({ tableName: 'appointments', where: [['merchantId', '==', merchant.id]], limit: 100 }), [merchant.id]));

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = now.toISOString().slice(0, 7);
    const thisYear = now.getFullYear().toString();

    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date.toDate) return date.toDate().toISOString();
      if (date.seconds) return new Date(date.seconds * 1000).toISOString();
      if (date instanceof Date) return date.toISOString();
      return '';
    };

    const salesToday = sales.filter(s => getIsoDate(s.createdAt || s.created_at).startsWith(today));
    const salesMonth = sales.filter(s => getIsoDate(s.createdAt || s.created_at).startsWith(thisMonth));
    const salesYear = sales.filter(s => getIsoDate(s.createdAt || s.created_at).startsWith(thisYear));

    const expensesToday = expenses.filter(e => getIsoDate(e.createdAt || e.created_at).startsWith(today));
    const expensesMonth = expenses.filter(e => getIsoDate(e.createdAt || e.created_at).startsWith(thisMonth));
    const expensesYear = expenses.filter(e => getIsoDate(e.createdAt || e.created_at).startsWith(thisYear));

    const sumSales = (list: MerchantSale[]) => list.reduce((acc, s) => acc + s.totalAmount, 0);
    const sumExpenses = (list: MerchantExpense[]) => list.reduce((acc, e) => acc + e.amount, 0);

    // Point 6: Aggregation - Use aggregated stats if available, otherwise fallback to in-memory calculation
    const revenue = merchantStats?.revenue ? {
      today: merchantStats.lastUpdate === today ? merchantStats.revenue.today : 0,
      month: merchantStats.lastMonth === thisMonth ? merchantStats.revenue.month : 0,
      year: merchantStats.lastYear === thisYear ? merchantStats.revenue.year : 0,
      total: merchantStats.revenue.total
    } : {
      today: sumSales(salesToday),
      month: sumSales(salesMonth),
      year: sumSales(salesYear),
      total: sumSales(sales)
    };

    const expensesStats = merchantStats?.expenses ? {
      today: merchantStats.lastUpdate === today ? merchantStats.expenses.today : 0,
      month: merchantStats.lastMonth === thisMonth ? merchantStats.expenses.month : 0,
      year: merchantStats.lastYear === thisYear ? merchantStats.expenses.year : 0,
      total: merchantStats.expenses.total
    } : {
      today: sumExpenses(expensesToday),
      month: sumExpenses(expensesMonth),
      year: sumExpenses(expensesYear),
      total: sumExpenses(expenses)
    };

    const netProfit = revenue.total - expensesStats.total;

    // Specialized counts
    const activeInterventions = interventions.filter((i: any) => i.status !== 'completed').length;
    const activeProjects = projects.filter((p: any) => p.status === 'active').length;
    const activeVehicles = vehicles.filter((v: any) => v.status === 'active').length;
    const totalEmployees = employees.length;
    const totalStudents = students.length;
    const totalPatients = patients.length;
    const appointmentsToday = appointments.filter((a: any) => getIsoDate(a.createdAt).startsWith(today)).length;

    return {
      revenue,
      expenses: expensesStats,
      netProfit,
      lowStockCount: products.filter(p => p.stockQuantity <= (p.minStockLevel || 5)).length,
      totalProducts: products.length,
      specialized: {
        interventions: activeInterventions,
        projects: activeProjects,
        vehicles: activeVehicles,
        employees: totalEmployees,
        students: totalStudents,
        patients: totalPatients,
        appointmentsToday
      }
    };
  }, [sales, expenses, products, interventions, projects, vehicles, employees, students, patients, appointments, merchantStats]);

  const chartData = useMemo(() => {
    const now = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    const getIsoDate = (date: any) => {
      if (!date) return null;
      if (typeof date === 'string') return new Date(date);
      if (date.toDate) return date.toDate();
      if (date.seconds) return new Date(date.seconds * 1000);
      if (date instanceof Date) return date;
      return null;
    };

    return last7Days.map(day => {
      const daySales = sales.filter(s => {
        const d = getIsoDate(s.createdAt || s.created_at);
        return d && isSameDay(d, day);
      });
      const dayExpenses = expenses.filter(e => {
        const d = getIsoDate(e.createdAt || e.created_at);
        return d && isSameDay(d, day);
      });

      return {
        name: format(day, 'dd MMM', { locale: fr }),
        ventes: daySales.reduce((acc, s) => acc + s.totalAmount, 0),
        depenses: dayExpenses.reduce((acc, e) => acc + e.amount, 0),
      };
    });
  }, [sales, expenses]);

  const recentTransactions = useMemo(() => {
    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date.toDate) return date.toDate().toISOString();
      if (date.seconds) return new Date(date.seconds * 1000).toISOString();
      if (date instanceof Date) return date.toISOString();
      return '';
    };

    const combined = [
      ...sales.map(s => ({ ...s, type: 'sale' as const, date: getIsoDate(s.createdAt || s.created_at) })),
      ...expenses.map(e => ({ ...e, type: 'expense' as const, date: getIsoDate(e.createdAt || e.created_at) }))
    ];

    return combined.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [sales, expenses]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Plan Upgrade Banner */}
      {merchant.plan !== 'PREMIUM' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-hover rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Passez au forfait supérieur</h2>
                <p className="text-white/80 text-sm max-w-md">
                  Débloquez toutes les fonctionnalités premium et propulsez votre activité vers de nouveaux sommets.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="px-8 py-4 bg-white text-primary font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              Voir les forfaits
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
        </div>
      )}

      {showUpgradeModal && (
        <PlanUpgradeModal 
          merchant={merchant} 
          onClose={() => setShowUpgradeModal(false)} 
          onUpdate={onUpdate}
        />
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {merchant.type === 'boutique' || !merchant.type ? (
          <>
            <StatCard title="Chiffre d'Affaires" value={stats.revenue.month} currency={merchant.currency} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" description="Ce mois-ci" />
            <StatCard title="Dépenses" value={stats.expenses.month} currency={merchant.currency} icon={TrendingDown} color="text-red-600" bgColor="bg-red-50" description="Ce mois-ci" />
            <StatCard title="Bénéfice Net" value={stats.netProfit} currency={merchant.currency} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" description="Total cumulé" />
            <StatCard title="Stock Faible" value={stats.lowStockCount} icon={AlertCircle} color={stats.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"} bgColor={stats.lowStockCount > 0 ? "bg-amber-50" : "bg-emerald-50"} description={`${stats.totalProducts} produits au total`} />
          </>
        ) : (
          <>
            {merchant.type === 'chantier' && (
              <>
                <StatCard title="Chantiers Actifs" value={stats.specialized.projects} icon={HardHat} color="text-amber-600" bgColor="bg-amber-50" description="En cours" />
                <StatCard title="Budget Total" value={projects.reduce((acc: number, p: any) => acc + p.budget, 0)} currency={merchant.currency} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-50" description="Tous projets" />
              </>
            )}
            {merchant.type === 'transport' && (
              <>
                <StatCard title="Véhicules Actifs" value={stats.specialized.vehicles} icon={Car} color="text-blue-600" bgColor="bg-blue-50" description="En service" />
                <StatCard title="Revenu Total" value={stats.revenue.total} currency={merchant.currency} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" description="Cumulé" />
              </>
            )}
            {merchant.type === 'rh' && (
              <>
                <StatCard title="Total Employés" value={stats.specialized.employees} icon={Users} color="text-indigo-600" bgColor="bg-indigo-50" description="Effectif total" />
                <StatCard title="Masse Salariale" value={employees.reduce((acc: number, e: any) => acc + e.salary, 0)} currency={merchant.currency} icon={BarChart3} color="text-red-600" bgColor="bg-red-50" description="Mensuel estimé" />
              </>
            )}
            {merchant.type === 'scolaire' && (
              <>
                <StatCard title="Total Élèves" value={stats.specialized.students} icon={GraduationCap} color="text-emerald-600" bgColor="bg-emerald-50" description="Inscrits" />
                <StatCard title="Frais Scolarité" value={stats.revenue.total} currency={merchant.currency} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-50" description="Revenu total" />
              </>
            )}
            {merchant.type === 'medical' && (
              <>
                <StatCard title="Total Patients" value={stats.specialized.patients} icon={Stethoscope} color="text-rose-600" bgColor="bg-rose-50" description="Dossiers" />
                <StatCard title="RDV Aujourd'hui" value={stats.specialized.appointmentsToday} icon={Calendar} color="text-blue-600" bgColor="bg-blue-50" description="Prévus" />
              </>
            )}
            {merchant.type === 'entreprise' && (
              <>
                <StatCard title="Interventions" value={stats.specialized.interventions} icon={Wrench} color="text-blue-600" bgColor="bg-blue-50" description="En cours" />
                <StatCard title="Revenu Total" value={stats.revenue.total} currency={merchant.currency} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" description="Cumulé" />
              </>
            )}
            <StatCard title="Dépenses" value={stats.expenses.total} currency={merchant.currency} icon={BarChart3} color="text-red-600" bgColor="bg-red-50" description="Total cumulé" />
            <StatCard title="Bénéfice Net" value={stats.netProfit} currency={merchant.currency} icon={DollarSign} color="text-purple-600" bgColor="bg-purple-50" description="Total cumulé" />
          </>
        )}
      </div>

      {/* Charts & Detailed Accounting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Performance Financière</h3>
              <p className="text-sm text-gray-500">7 derniers jours</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-xs font-medium text-gray-500">
                  {merchant.type === 'scolaire' ? 'Frais' : 
                   merchant.type === 'medical' ? 'Consultations' :
                   merchant.type === 'chantier' ? 'Facturation' :
                   merchant.type === 'transport' ? 'Recettes' :
                   merchant.type === 'rh' ? 'Budget' :
                   merchant.type === 'entreprise' ? 'Interventions' : 'Ventes'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <span className="text-xs font-medium text-gray-500">Dépenses</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="#7c3aed" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="depenses" 
                  stroke="#f87171" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accounting Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Résumé Comptable</h3>
          <div className="space-y-6">
            <AccountingRow 
              label={`${merchant.type === 'scolaire' ? 'Frais' : 
                        merchant.type === 'medical' ? 'Consultations' :
                        merchant.type === 'chantier' ? 'Facturation' :
                        merchant.type === 'transport' ? 'Recettes' :
                        merchant.type === 'rh' ? 'Budget' :
                        merchant.type === 'entreprise' ? 'Interventions' : 'Ventes'} (Jour)`} 
              value={stats.revenue.today} 
              currency={merchant.currency} 
              icon={ArrowUpRight} 
              color="text-emerald-600" 
            />
            <AccountingRow 
              label={`${merchant.type === 'scolaire' ? 'Frais' : 
                        merchant.type === 'medical' ? 'Consultations' :
                        merchant.type === 'chantier' ? 'Facturation' :
                        merchant.type === 'transport' ? 'Recettes' :
                        merchant.type === 'rh' ? 'Budget' :
                        merchant.type === 'entreprise' ? 'Interventions' : 'Ventes'} (Mois)`} 
              value={stats.revenue.month} 
              currency={merchant.currency} 
              icon={TrendingUp} 
              color="text-emerald-600" 
            />
            <AccountingRow 
              label={`${merchant.type === 'scolaire' ? 'Frais' : 
                        merchant.type === 'medical' ? 'Consultations' :
                        merchant.type === 'chantier' ? 'Facturation' :
                        merchant.type === 'transport' ? 'Recettes' :
                        merchant.type === 'rh' ? 'Budget' :
                        merchant.type === 'entreprise' ? 'Interventions' : 'Ventes'} (Année)`} 
              value={stats.revenue.year} 
              currency={merchant.currency} 
              icon={BarChart3} 
              color="text-emerald-600" 
            />
            <div className="h-px bg-gray-100 my-4" />
            <AccountingRow label="Dépenses (Jour)" value={stats.expenses.today} currency={merchant.currency} icon={ArrowDownRight} color="text-red-600" />
            <AccountingRow label="Dépenses (Mois)" value={stats.expenses.month} currency={merchant.currency} icon={TrendingDown} color="text-red-600" />
            <AccountingRow label="Dépenses (Année)" value={stats.expenses.year} currency={merchant.currency} icon={Receipt} color="text-red-600" />
          </div>
          
          <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">Bénéfice Net</span>
              <span className={`text-lg font-black ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.netProfit.toLocaleString()} {merchant.currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-ink">Flux Financiers</h3>
              <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Dernières opérations</p>
            </div>
            <button className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-black/5 group">
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          </div>
          <div className="space-y-5">
            {recentTransactions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ArrowUpRight className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Aucune transaction enregistrée</p>
              </div>
            ) : (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 rounded-[1.5rem] transition-all border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${
                      tx.type === 'sale' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {tx.type === 'sale' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-black text-ink text-base leading-tight">
                        {tx.type === 'sale' ? (tx.customerName || (
                          merchant.type === 'scolaire' ? 'Paiement Frais' :
                          merchant.type === 'medical' ? 'Consultation' :
                          merchant.type === 'chantier' ? 'Facture Travaux' :
                          merchant.type === 'transport' ? 'Course/Trajet' :
                          merchant.type === 'rh' ? 'Opération RH' :
                          merchant.type === 'entreprise' ? 'Intervention' :
                          'Vente POS'
                        )) : tx.title}
                      </p>
                      <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mt-1">
                        {format(new Date(tx.date), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-black text-base ${tx.type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'sale' ? '+' : '-'}{tx.type === 'sale' ? tx.totalAmount.toLocaleString() : tx.amount.toLocaleString()} 
                      <span className="text-[10px] ml-1 opacity-60">{merchant.currency}</span>
                    </p>
                    <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                      {tx.paymentMethod || tx.category || 'Général'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Alerts / Quick View */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
          {merchant.type === 'scolaire' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">Dernières Inscriptions</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Suivi des effectifs scolaires</p>
                </div>
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                  {students.length.toString().padStart(3, '0')} ÉLÈVES
                </span>
              </div>
              <div className="space-y-5">
                {students.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <GraduationCap className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun élève inscrit</p>
                  </div>
                ) : (
                  students.slice(0, 5).map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <GraduationCap className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{student.name}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Classe: {student.class}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black text-gray-400 uppercase">{student.enrollmentDate}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'medical' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">Prochains Rendez-vous</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Planification des consultations</p>
                </div>
                <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-widest">
                  {appointments.length.toString().padStart(3, '0')} RDV
                </span>
              </div>
              <div className="space-y-5">
                {appointments.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun rendez-vous prévu</p>
                  </div>
                ) : (
                  appointments.slice(0, 5).map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <Calendar className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{apt.patientName}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{apt.time} - {apt.reason}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black text-gray-400 uppercase">{apt.date}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'chantier' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">État des Projets</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Suivi de l'avancement BTP</p>
                </div>
                <span className="px-4 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-widest">
                  {projects.length.toString().padStart(2, '0')} PROJETS
                </span>
              </div>
              <div className="space-y-6">
                {projects.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <HardHat className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun projet en cours</p>
                  </div>
                ) : (
                  projects.slice(0, 5).map((project: any) => (
                    <div key={project.id} className="flex flex-col p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center space-x-5">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5">
                            <HardHat className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-black text-ink text-base leading-tight">{project.name}</p>
                            <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Budget: {project.budget.toLocaleString()} {merchant.currency}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-amber-600">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          className="h-full bg-amber-500" 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'transport' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">État de la Flotte</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Disponibilité des véhicules</p>
                </div>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">
                  {vehicles.length.toString().padStart(2, '0')} VÉHICULES
                </span>
              </div>
              <div className="space-y-5">
                {vehicles.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Car className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun véhicule enregistré</p>
                  </div>
                ) : (
                  vehicles.slice(0, 5).map((vehicle: any) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <Car className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{vehicle.model}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{vehicle.plateNumber}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        vehicle.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {vehicle.status === 'active' ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'rh' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">Derniers Recrutements</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Gestion du capital humain</p>
                </div>
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
                  {employees.length.toString().padStart(2, '0')} EMPLOYÉS
                </span>
              </div>
              <div className="space-y-5">
                {employees.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun employé enregistré</p>
                  </div>
                ) : (
                  employees.slice(0, 5).map((emp: any) => (
                    <div key={emp.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <User className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{emp.position}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black text-gray-400 uppercase">{emp.hireDate}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'entreprise' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-ink">Interventions Récentes</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Suivi des prestations de service</p>
                </div>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 shadow-sm">
                  {interventions.length.toString().padStart(3, '0')} ACTES
                </span>
              </div>
              <div className="space-y-4">
                {interventions.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-[2rem] border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-black/5">
                      <Wrench className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Aucune intervention</p>
                  </div>
                ) : (
                  interventions.slice(0, 5).map((inter: any) => (
                    <div key={inter.id} className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-black/5 hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                          <Wrench className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-base text-ink leading-tight">{inter.customerName}</p>
                          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-0.5">{inter.serviceType}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        inter.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {inter.status === 'completed' ? 'TERMINÉ' : 'EN COURS'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-ink">Alertes Stock</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Niveaux critiques détectés</p>
                </div>
                <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 shadow-sm">
                  {stats.lowStockCount.toString().padStart(2, '0')} ALERTES
                </span>
              </div>
              <div className="space-y-4">
                {products.filter(p => p.stockQuantity <= (p.minStockLevel || 5)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-emerald-50/30 rounded-[2rem] border border-dashed border-emerald-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-emerald-600 font-black uppercase tracking-widest">Tout est en stock !</p>
                    <p className="text-xs text-emerald-500/60 mt-2 font-mono font-bold">Niveaux optimaux</p>
                  </div>
                ) : (
                  products.filter(p => p.stockQuantity <= (p.minStockLevel || 5)).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-rose-100 hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1 bg-rose-500"></div>
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
                          <Package className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-black text-base text-ink leading-tight">{product.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-mono text-rose-600 font-black uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md">
                              STOCK: {product.stockQuantity}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                              MIN: {product.minStockLevel || 5}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-sm mb-3 uppercase tracking-[0.2em]">
                          CRITIQUE
                        </span>
                        <button className="text-[10px] font-black text-primary hover:text-primary-hover uppercase tracking-[0.2em] transition-colors">Réapprovisionner</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AccountingRow = ({ label, value, currency, icon: Icon, color }: any) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center space-x-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
    <span className={`text-sm font-bold text-gray-900`}>
      {value.toLocaleString()} {currency}
    </span>
  </div>
);

const StatCard = ({ title, value, currency, icon: Icon, color, bgColor, description }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
    <div className={`w-16 h-16 ${bgColor} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform relative z-10 border border-black/5`}>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
    <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] relative z-10">{title}</p>
    <div className="flex items-baseline space-x-2 relative z-10">
      <p className="text-4xl font-black text-ink tracking-tighter">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {currency && <span className="text-sm font-black text-gray-400 uppercase tracking-widest">{currency}</span>}
    </div>
    {description && <p className="text-[10px] text-gray-400 mt-4 font-mono font-bold uppercase tracking-widest relative z-10">{description}</p>}
  </div>
);

// --- Inventory Manager ---
const InventoryManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<MerchantProduct> | null>(null);
  const [restockData, setRestockData] = useState({ quantity: 0, cost: 0, reason: 'Réapprovisionnement standard' });
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const productOptions = useMemo(() => ({
    tableName: 'merchant_products' as TableName,
    where: [['merchantId', '==', merchant.id]],
    mapper: (data: any) => ({
      ...data,
      merchantId: data.merchant_id,
      costPrice: data.cost_price,
      stockQuantity: data.stock_quantity,
      minStockLevel: data.min_stock_level,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }), [merchant.id]);

  const { data: products, loading } = useSupabaseData<MerchantProduct>(productOptions);

  const movementOptions = useMemo(() => ({
    tableName: 'stock_movements' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const },
    limit: 20,
    mapper: (data: any) => ({
      ...data,
      merchantId: data.merchant_id,
      productId: data.product_id,
      previousQuantity: data.previous_quantity,
      newQuantity: data.new_quantity,
      referenceId: data.reference_id,
      performedBy: data.performed_by,
      createdAt: data.created_at
    })
  }), [merchant.id]);

  const { data: movements } = useSupabaseData<any>(movementOptions);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.name || currentProduct.price === undefined) return;
    setSaving(true);
    try {
      await db.merchantProducts.save({
        ...currentProduct,
        merchantId: merchant.id,
        updatedAt: new Date()
      });
      toast.success(currentProduct.id ? 'Produit mis à jour' : 'Produit ajouté');
      setIsEditing(false);
      setCurrentProduct(null);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.id || restockData.quantity <= 0) return;
    setSaving(true);
    try {
      await db.stockMovements.addStock(
        merchant.id,
        currentProduct.id,
        restockData.quantity,
        restockData.reason,
        merchant.ownerId,
        restockData.cost
      );
      toast.success('Stock mis à jour');
      setIsRestocking(false);
      setRestockData({ quantity: 0, cost: 0, reason: 'Réapprovisionnement standard' });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await db.merchantProducts.delete(id);
      toast.success('Produit supprimé');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="hidden md:flex items-center px-4 py-2 bg-white border border-black/5 rounded-xl shadow-sm">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">Total Valeur</span>
              <span className="text-xs font-mono font-bold text-ink">
                {products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0).toLocaleString()} {merchant.currency}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentProduct({ name: '', price: 0, stockQuantity: 0, category: 'Général', minStockLevel: 5 });
              setIsEditing(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau produit</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Produit / SKU</th>
                  <th className="px-8 py-5">Prix Unitaire</th>
                  <th className="px-8 py-5">Niveau Stock</th>
                  <th className="px-8 py-5">Catégorie</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-black/5 group-hover:scale-110 transition-transform shadow-inner">
                          {product.image ? (
                            <OptimizedImage src={product.image} alt={product.name} width={150} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-7 h-7 text-gray-200" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-ink text-sm leading-tight tracking-tight">{product.name}</span>
                          <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">
                            {product.sku || 'SANS SKU'} • ID: {product.id?.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-mono font-black text-ink text-sm">
                        {product.price.toLocaleString()} <span className="text-[10px] opacity-60">{merchant.currency}</span>
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-black border tracking-widest ${
                          product.stockQuantity <= (product.minStockLevel || 5) 
                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {product.stockQuantity.toString().padStart(2, '0')} UNITÉS
                        </div>
                        <button 
                          onClick={() => { setCurrentProduct(product); setIsRestocking(true); }}
                          className="p-2.5 hover:bg-primary/10 text-primary rounded-xl transition-all shadow-sm border border-transparent hover:border-primary/20"
                          title="Réapprovisionner"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-100">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setCurrentProduct(product); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl transition-colors border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(product.id)} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors border border-transparent hover:border-rose-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Movements History */}
      {!loading && movements.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-ink flex items-center">
              <Clock className="w-6 h-6 mr-3 text-primary" />
              Historique des flux
            </h3>
            <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">Derniers 20 mouvements</span>
          </div>
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Date & Heure</th>
                    <th className="px-8 py-5">Produit</th>
                    <th className="px-8 py-5">Type de flux</th>
                    <th className="px-8 py-5 text-right">Quantité</th>
                    <th className="px-8 py-5">Raison / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((m: any) => {
                    const product = products.find(p => p.id === m.productId);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <span className="text-[11px] font-mono font-black text-ink uppercase">
                            {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd/MM HH:mm') : '-'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-ink">{product?.name || 'Produit supprimé'}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {m.type === 'in' ? 'ENTRÉE' : m.type === 'sale' ? 'VENTE' : m.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`font-mono font-black text-sm ${m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[11px] font-medium text-gray-500">{m.reason}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      <AnimatePresence>
        {isRestocking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Réapprovisionner</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Mise à jour des stocks</p>
                </div>
                <button onClick={() => setIsRestocking(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Produit sélectionné</p>
                    <p className="font-bold text-ink">{currentProduct?.name}</p>
                  </div>
                </div>

                <form onSubmit={handleRestock} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Quantité à ajouter</label>
                      <input type="number" required min="1" value={restockData.quantity || ''} onChange={e => setRestockData({...restockData, quantity: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Coût d'achat ({merchant.currency})</label>
                      <input type="number" min="0" value={restockData.cost || ''} onChange={e => setRestockData({...restockData, cost: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Motif / Note</label>
                    <input type="text" value={restockData.reason} onChange={e => setRestockData({...restockData, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-medium" placeholder="ex: Arrivage fournisseur..." />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={() => setIsRestocking(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmer l\'ajout'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Détails du Produit</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Configuration technique de l'article</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du produit</label>
                      <input 
                        type="text" 
                        required 
                        value={currentProduct?.name || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, name: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" 
                        placeholder="ex: Laptop Pro 15"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">SKU / Code interne</label>
                      <input 
                        type="text" 
                        value={currentProduct?.sku || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, sku: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono text-sm" 
                        placeholder="ex: LP-15-2024"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">URL de l'image</label>
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={currentProduct?.image || ''} 
                          onChange={e => setCurrentProduct({...currentProduct!, image: e.target.value})} 
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-xs" 
                          placeholder="https://..."
                        />
                        {currentProduct?.image && (
                          <div className="w-12 h-12 rounded-xl border border-black/5 overflow-hidden bg-gray-100 flex-shrink-0">
                            <OptimizedImage src={currentProduct.image} alt={currentProduct.name} width={100} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                      <select 
                        value={currentProduct?.category || 'Général'} 
                        onChange={e => setCurrentProduct({...currentProduct!, category: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold"
                      >
                        <option value="Général">Général</option>
                        <option value="Électronique">Électronique</option>
                        <option value="Mobilier">Mobilier</option>
                        <option value="Fournitures">Fournitures</option>
                        <option value="Services">Services</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix de vente</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        required 
                        value={currentProduct?.price || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, price: Number(e.target.value)})} 
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Stock actuel</label>
                    <input 
                      type="number" 
                      required 
                      value={currentProduct?.stockQuantity || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, stockQuantity: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Seuil d'alerte</label>
                    <input 
                      type="number" 
                      required 
                      value={currentProduct?.minStockLevel || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, minStockLevel: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                    />
                  </div>
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le produit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le produit ?</h3>
              <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={saving}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Merchant POS ---
const MerchantPOS = ({ merchant }: { merchant: Merchant }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<{ productId: string, name: string, quantity: number, price: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState<{ show: boolean, saleData: any } | null>(null);

  const productOptions = useMemo(() => ({
    tableName: 'merchant_products' as TableName,
    where: [['merchantId', '==', merchant.id]]
  }), [merchant.id]);

  const { data: products } = useSupabaseData<MerchantProduct>(productOptions);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stockQuantity > 0);
  }, [products, searchTerm]);

  const addToCart = (product: MerchantProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error('Stock insuffisant');
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, price: product.price }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.productId !== productId));

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    setIsSubmitting(true);
    try {
      const saleData: Partial<MerchantSale> = {
        merchantId: merchant.id,
        items: cart.map(item => ({ ...item, total: item.price * item.quantity })),
        totalAmount: total,
        paymentMethod,
        customerName,
        customerPhone,
        processedBy: user.id,
        createdAt: new Date()
      };
      
      // Save the sale (service handles stock update)
      const saleId = await db.merchantSales.save(saleData);

      setShowReceiptModal({ show: true, saleData: { ...saleData, id: saleId } });

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Vente enregistrée !');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erreur lors de la vente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col lg:flex-row gap-8"
    >
      <div className="flex-1 space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un produit par nom ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-primary/10 shadow-sm outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all text-left group relative overflow-hidden"
            >
              <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-3 flex items-center justify-center overflow-hidden border border-black/5 group-hover:scale-105 transition-transform">
                {product.image ? (
                  <OptimizedImage src={product.image} alt={product.name} width={300} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-200" />
                )}
              </div>
              <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{product.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-primary font-black">{product.price.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span></p>
                <div className="px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[9px] font-mono font-bold text-gray-400">STOCK: {product.stockQuantity}</p>
                </div>
              </div>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-[400px]">
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl sticky top-32">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-ink flex items-center">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-3">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              Panier
            </h3>
            <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full border border-gray-100">
              {cart.length.toString().padStart(2, '0')} ARTICLES
            </span>
          </div>

          <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Panier vide</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                      {item.quantity} x {item.price.toLocaleString()} {merchant.currency}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-black text-ink">{(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-6 border-t border-gray-100 pt-8">
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="text" placeholder="Nom du client (optionnel)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="tel" placeholder="Téléphone client" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <PaymentMethodBtn active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} label="ESPÈCES" />
              <PaymentMethodBtn active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} label="CARTE" />
              <PaymentMethodBtn active={paymentMethod === 'mobile_money'} onClick={() => setPaymentMethod('mobile_money')} label="MOBILE" />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
              <span className="text-gray-400 text-[10px] font-mono font-black uppercase tracking-widest">Total à payer</span>
              <div className="text-right">
                <span className="text-3xl font-black text-ink">{total.toLocaleString()}</span>
                <span className="text-xs font-mono font-bold text-gray-400 ml-1 uppercase">{merchant.currency}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isSubmitting} 
              className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-hover transition-all disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-[0.98]"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Valider la vente'}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal?.show && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Vente Réussie !</h3>
              <p className="text-gray-500 mb-8">La transaction a été enregistrée avec succès.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    generateReceiptPDF(merchant, showReceiptModal.saleData);
                    setShowReceiptModal(null);
                  }}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>Imprimer le Reçu</span>
                </button>
                <button 
                  onClick={() => setShowReceiptModal(null)}
                  className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PaymentMethodBtn = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick} 
    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
      active 
        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
    }`}
  >
    {label}
  </button>
);

// --- Merchant Audit Log ---
const MerchantAuditLog = ({ merchant }: { merchant: Merchant }) => {
  const productOptions = useMemo(() => ({
    tableName: 'merchant_products' as TableName,
    where: [['merchantId', '==', merchant.id]]
  }), [merchant.id]);

  const { data: products } = useSupabaseData<MerchantProduct>(productOptions);

  const movementOptions = useMemo(() => ({
    tableName: 'stock_movements' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: movements, loading } = useSupabaseData<any>(movementOptions);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Journal d'Audit</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Traçabilité complète des flux de stock</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-black/5 rounded-xl shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Temps Réel</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Horodatage</th>
                  <th className="px-8 py-5">Produit</th>
                  <th className="px-8 py-5">Type de Flux</th>
                  <th className="px-8 py-5">Quantité</th>
                  <th className="px-8 py-5">Delta Stock</th>
                  <th className="px-8 py-5">Motif / Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m: any) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-[11px] font-mono font-bold text-gray-400">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd.MM.yyyy') : '--'}
                        </p>
                        <p className="text-[10px] font-mono text-gray-300">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'HH:mm:ss') : '--'}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900 text-sm leading-tight">{product?.name || 'Produit supprimé'}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter mt-0.5">ID: {m.productId.slice(0, 8)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                          {m.type === 'in' ? 'ENTRÉE' : m.type === 'sale' ? 'VENTE' : m.type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`flex items-center font-mono font-black text-sm ${m.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {m.type === 'in' ? <Plus className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                          {m.quantity}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-mono text-gray-400">{m.previousQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <span className="text-[11px] font-mono font-black text-ink">{m.newQuantity}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs text-gray-500 italic leading-relaxed max-w-xs">{m.reason || 'Aucune raison spécifiée'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Merchant Accounting ---
const MerchantAccounting = ({ merchant }: { merchant: Merchant }) => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: 0, category: 'Général', description: '' });
  const [saving, setSaving] = useState(false);

  const expenseOptions = useMemo(() => ({
    tableName: 'merchant_expenses' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: expenses, loading } = useSupabaseData<MerchantExpense>(expenseOptions);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    setSaving(true);
    try {
      await db.merchantExpenses.save({
        ...newExpense,
        merchantId: merchant.id,
        date: new Date()
      });
      toast.success('Dépense enregistrée');
      setIsAddingExpense(false);
      setNewExpense({ title: '', amount: 0, category: 'Général', description: '' });
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Comptabilité</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des flux financiers & dépenses</p>
        </div>
        <button 
          onClick={() => setIsAddingExpense(true)} 
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Désignation</th>
                <th className="px-8 py-5">Catégorie</th>
                <th className="px-8 py-5">Date d'émission</th>
                <th className="px-8 py-5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Receipt className="w-6 h-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">Aucune dépense enregistrée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-black text-ink text-sm leading-tight">{expense.title}</p>
                      <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">REF: {expense.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 border border-gray-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-ink uppercase">
                        {expense.createdAt?.seconds ? format(new Date(expense.createdAt.seconds * 1000), 'dd/MM/yyyy') : '-'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-rose-600 font-mono">
                        -{expense.amount.toLocaleString()} <span className="text-[10px] opacity-60">{merchant.currency}</span>
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
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
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                    <input type="text" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 font-bold" />
                  </div>
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

// --- Merchant Sales History ---
const MerchantSalesHistory = ({ merchant }: { merchant: Merchant }) => {
  const saleOptions = useMemo(() => ({
    tableName: 'merchant_sales' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: sales, loading } = useSupabaseData<MerchantSale>(saleOptions);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Historique des Ventes</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Registre complet des transactions POS</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-black/5 rounded-xl shadow-sm">
          <Receipt className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">{sales.length.toString().padStart(3, '0')} Ventes</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Date & Heure</th>
                  <th className="px-8 py-5">Client / Contact</th>
                  <th className="px-8 py-5">Détail Articles</th>
                  <th className="px-8 py-5">Mode Paiement</th>
                  <th className="px-8 py-5 text-right">Total TTC</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-gray-400 italic text-sm">Aucune vente enregistrée</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono font-black text-ink uppercase">
                            {sale.createdAt?.seconds ? format(new Date(sale.createdAt.seconds * 1000), 'dd/MM/yyyy') : '-'}
                          </span>
                          <span className="text-[10px] font-mono font-black text-gray-400 uppercase mt-1">
                            {sale.createdAt?.seconds ? format(new Date(sale.createdAt.seconds * 1000), 'HH:mm') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-ink text-sm leading-tight">{sale.customerName || 'Client de passage'}</p>
                        <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">ID: {sale.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1.5">
                          {sale.items.map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-50 rounded-lg text-[9px] font-bold text-gray-500 border border-gray-100">
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          sale.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          sale.paymentMethod === 'card' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {sale.paymentMethod === 'cash' ? 'ESPÈCES' : 
                           sale.paymentMethod === 'card' ? 'CARTE' : 'MOBILE'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-sm font-black text-ink">
                          {sale.totalAmount.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => generateReceiptPDF(merchant, sale)}
                          className="p-3 hover:bg-primary/10 text-primary rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-primary/20"
                          title="Réimprimer la facture"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Supplier Manager ---
const SupplierManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<MerchantSupplier> | null>(null);
  const [saving, setSaving] = useState(false);

  const supplierOptions = useMemo(() => ({
    tableName: 'merchant_suppliers' as TableName,
    where: [['merchantId', '==', merchant.id]],
    mapper: (data: any) => ({
      ...data,
      merchantId: data.merchant_id,
      contactName: data.contact_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }), [merchant.id]);

  const { data: suppliers, loading } = useSupabaseData<MerchantSupplier>(supplierOptions);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier?.name) return;
    setSaving(true);
    try {
      await db.merchantSuppliers.save({
        ...currentSupplier,
        merchantId: merchant.id
      });
      toast.success(currentSupplier.id ? 'Fournisseur mis à jour' : 'Fournisseur ajouté');
      setIsEditing(false);
      setCurrentSupplier(null);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce fournisseur ?')) return;
    try {
      await db.merchantSuppliers.delete(id);
      toast.success('Fournisseur supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Partenaires Logistiques</h2>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Fournisseurs actifs: {suppliers.length.toString().padStart(2, '0')}</p>
        </div>
        <button
          onClick={() => {
            setCurrentSupplier({ name: '', contactName: '', email: '', phone: '', category: 'Général' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setCurrentSupplier(supplier); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl border border-transparent hover:border-rose-200 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-ink mb-1 leading-tight">{supplier.name}</h3>
              <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mb-6">{supplier.category}</p>
              
              <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <User className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="font-black text-ink">{supplier.contactName || '---'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <Phone className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="font-mono font-bold">{supplier.phone || '---'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <Mail className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="truncate font-medium text-gray-500">{supplier.email || '---'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">{currentSupplier?.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des partenaires logistiques</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom de l'entreprise</label>
                    <input type="text" required value={currentSupplier?.name || ''} onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Personne de contact</label>
                    <input type="text" value={currentSupplier?.contactName || ''} onChange={e => setCurrentSupplier({...currentSupplier, contactName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                    <input type="tel" value={currentSupplier?.phone || ''} onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                    <input type="email" value={currentSupplier?.email || ''} onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                    <input type="text" value={currentSupplier?.category || ''} onChange={e => setCurrentSupplier({...currentSupplier, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le fournisseur'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Merchant Settings ---
const MerchantSettings = ({ 
  merchant, 
  onUpdate, 
  setActiveTab 
}: { 
  merchant: Merchant, 
  onUpdate: (m: Merchant) => void, 
  setActiveTab: (tab: string) => void 
}) => {
  const [formData, setFormData] = useState(merchant);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.merchants.save({ ...formData, updatedAt: new Date() });
      onUpdate(formData);
      toast.success('Réglages mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black text-ink">Réglages Business</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Configuration de l'identité commerciale</p>
          </div>
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-black/5">
            <Settings className="w-7 h-7 text-gray-300" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Type de SaaS</p>
                <p className="font-black text-ink capitalize text-lg">{merchant.type}</p>
              </div>
            </div>
            <div className="flex items-center text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest">
              <AlertCircle className="w-3 h-3 mr-1.5" />
              Fixe
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Forfait Actuel</p>
                <p className="font-black text-ink text-lg">{merchant.plan || 'FREE'}</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="text-[9px] font-black text-primary hover:bg-primary hover:text-white transition-all bg-primary/10 px-4 py-2 rounded-full uppercase tracking-widest"
            >
              Améliorer
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Nom de l'établissement / Boutique</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-bold text-lg" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Téléphone Professionnel</label>
              <input type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-mono font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Email de Contact</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-bold" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Adresse Physique</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-medium" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Description / Slogan</label>
              <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 resize-none font-medium leading-relaxed" placeholder="Décrivez votre activité en quelques mots..." />
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving} 
              className="w-full py-5 bg-ink text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center shadow-2xl shadow-black/20 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 mr-3" /> Enregistrer les modifications</>}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// --- Specialized SaaS Managers ---

// 1. Service Manager (Gestion des services)
const ServiceManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => ({
    tableName: 'interventions' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: interventions, loading } = useSupabaseData<any>(options);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.interventions.save({
        ...currentIntervention,
        merchantId: merchant.id
      });
      toast.success('Intervention enregistrée');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Interventions</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Total: {interventions.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentIntervention({ customerName: '', serviceType: '', status: 'pending', date: new Date().toISOString().split('T')[0], price: 0 });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Intervention</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Client / Prestation</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Montant TTC</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interventions.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                          <Wrench className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-ink text-sm leading-tight">{item.customerName}</span>
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">{item.serviceType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-ink uppercase">{item.date}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        item.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.status === 'pending' ? 'EN ATTENTE' : item.status === 'in-progress' ? 'EN COURS' : 'TERMINÉ'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-mono font-black text-ink text-sm">
                        {item.price.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentIntervention(item); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails de l'Intervention</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Configuration technique du service</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Client</label>
                  <input type="text" required value={currentIntervention.customerName} onChange={e => setCurrentIntervention({...currentIntervention, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de Service</label>
                  <input type="text" required value={currentIntervention.serviceType} onChange={e => setCurrentIntervention({...currentIntervention, serviceType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'intervention</label>
                  <input type="date" required value={currentIntervention.date} onChange={e => setCurrentIntervention({...currentIntervention, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Montant de la prestation</label>
                  <div className="relative">
                    <input type="number" required value={currentIntervention.price} onChange={e => setCurrentIntervention({...currentIntervention, price: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut de l'intervention</label>
                <div className="flex flex-wrap gap-3">
                  {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentIntervention({...currentIntervention, status})}
                      className={`flex-1 min-w-[120px] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentIntervention.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'pending' ? 'En attente' : status === 'in-progress' ? 'En cours' : status === 'completed' ? 'Terminé' : 'Annulé'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer l\'intervention'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 2. Project Manager (Gestion de chantier)
const ProjectManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const options = useMemo(() => ({
    tableName: 'projects' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: projects, loading } = useSupabaseData<any>(options);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.projects.save({
        ...currentProject,
        merchantId: merchant.id
      });
      toast.success('Projet enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await db.projects.delete(id);
      toast.success('Projet supprimé');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Chantiers</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Projets actifs: {projects.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentProject({ name: '', location: '', status: 'planned', budget: 0, startDate: '', endDate: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project: any) => (
            <div key={project.id} className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-2xl transition-all group/card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover/card:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover/card:scale-110 transition-transform">
                  <HardHat className="w-8 h-8 text-primary" />
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover/card:opacity-100 transition-all">
                  <button onClick={() => { setCurrentProject(project); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteConfirm(project.id)} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl border border-transparent hover:border-rose-200 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-ink mb-2 leading-tight relative z-10 tracking-tight">{project.name}</h3>
              <div className="flex items-center text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mb-8 relative z-10">
                <MapPin className="w-3.5 h-3.5 mr-2 text-primary" /> 
                {project.location}
              </div>
              
              <div className="flex justify-between items-center pt-8 border-t border-dashed border-gray-100 relative z-10">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                  project.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  project.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {project.status === 'planned' ? 'PLANIFIÉ' : project.status === 'active' ? 'EN COURS' : project.status === 'on-hold' ? 'EN PAUSE' : 'TERMINÉ'}
                </span>
                <div className="text-right">
                  <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Budget</p>
                  <p className="font-black text-xl text-ink tracking-tighter">
                    {project.budget.toLocaleString()} 
                    <span className="text-[10px] text-gray-400 font-mono ml-1 uppercase">{merchant.currency}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails du Projet</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion de chantier BTP</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Projet</label>
                  <input type="text" required value={currentProject.name} onChange={e => setCurrentProject({...currentProject, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Localisation</label>
                  <input type="text" required value={currentProject.location} onChange={e => setCurrentProject({...currentProject, location: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Budget Prévisionnel</label>
                  <div className="relative">
                    <input type="number" required value={currentProject.budget} onChange={e => setCurrentProject({...currentProject, budget: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut du Projet</label>
                  <select value={currentProject.status} onChange={e => setCurrentProject({...currentProject, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="planned">Planifié</option>
                    <option value="active">En cours</option>
                    <option value="on-hold">En pause</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le projet'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le projet ?</h3>
              <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 3. Fleet Manager (Gestion de transport et de flotte)
const FleetManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => ({
    tableName: 'vehicles' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: vehicles, loading } = useSupabaseData<any>(options);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.vehicles.save({
        ...currentVehicle,
        merchantId: merchant.id
      });
      toast.success('Véhicule enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion de la Flotte</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Véhicules: {vehicles.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentVehicle({ plateNumber: '', model: '', type: 'car', status: 'active', lastMaintenance: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Véhicule</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Véhicule / Plaque</th>
                  <th className="px-8 py-5">Modèle / Type</th>
                  <th className="px-8 py-5">Dernier Entretien</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-ink bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 inline-block w-fit text-sm shadow-sm tracking-widest">
                          {v.plateNumber}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-2">ID: {v.id?.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ink leading-tight">{v.model}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mt-1">{v.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-gray-400 uppercase">{v.lastMaintenance || '---'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        v.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        v.status === 'maintenance' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {v.status === 'active' ? 'DISPONIBLE' : v.status === 'maintenance' ? 'MAINTENANCE' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentVehicle(v); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Fiche Véhicule</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion de la flotte logistique</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Immatriculation</label>
                  <input type="text" required value={currentVehicle.plateNumber} onChange={e => setCurrentVehicle({...currentVehicle, plateNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" placeholder="AA-000-AA" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Modèle / Marque</label>
                  <input type="text" required value={currentVehicle.model} onChange={e => setCurrentVehicle({...currentVehicle, model: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de véhicule</label>
                  <select value={currentVehicle.type} onChange={e => setCurrentVehicle({...currentVehicle, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="car">Voiture</option>
                    <option value="truck">Camion</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date du dernier entretien</label>
                  <input type="date" required value={currentVehicle.lastMaintenance} onChange={e => setCurrentVehicle({...currentVehicle, lastMaintenance: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut opérationnel</label>
                <div className="flex gap-4">
                  {['active', 'maintenance', 'inactive'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentVehicle({...currentVehicle, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentVehicle.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Actif' : status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le véhicule'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 4. HR Manager (Gestion des ressources humaines)
const HRManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => ({
    tableName: 'employees' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: employees, loading } = useSupabaseData<any>(options);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.employees.save({
        ...currentEmployee,
        merchantId: merchant.id
      });
      toast.success('Employé enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion du Personnel</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Effectif total: {employees.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentEmployee({ firstName: '', lastName: '', position: '', department: '', salary: 0, hireDate: new Date().toISOString().split('T')[0], status: 'active', email: '', phone: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Employé</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Collaborateur</th>
                  <th className="px-8 py-5">Poste / Dept</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Embauche</th>
                  <th className="px-8 py-5 text-right">Salaire Mensuel</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:scale-110 transition-transform">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-ink text-base leading-tight">{emp.firstName} {emp.lastName}</span>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${emp.status === 'active' ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {emp.status === 'active' ? 'EN POSTE' : emp.status === 'on_leave' ? 'EN CONGÉ' : 'SORTI'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ink leading-tight">{emp.position}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mt-1">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1.5">
                        <span className="flex items-center text-[10px] font-black text-ink tracking-tight"><Mail className="w-3 h-3 mr-2 opacity-40 text-primary" /> {emp.email || '---'}</span>
                        <span className="flex items-center text-[10px] font-black text-ink tracking-tight"><Phone className="w-3 h-3 mr-2 opacity-40 text-primary" /> {emp.phone || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-gray-400 uppercase">{emp.hireDate}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-mono font-black text-ink text-sm">
                        {emp.salary.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentEmployee(emp); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Fiche Collaborateur</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des ressources humaines</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentEmployee.firstName} onChange={e => setCurrentEmployee({...currentEmployee, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentEmployee.lastName} onChange={e => setCurrentEmployee({...currentEmployee, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email Professionnel</label>
                  <input type="email" value={currentEmployee.email} onChange={e => setCurrentEmployee({...currentEmployee, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="email@entreprise.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                  <input type="text" value={currentEmployee.phone} onChange={e => setCurrentEmployee({...currentEmployee, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="+221 ..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Poste / Fonction</label>
                  <input type="text" required value={currentEmployee.position} onChange={e => setCurrentEmployee({...currentEmployee, position: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Département</label>
                  <select value={currentEmployee.department} onChange={e => setCurrentEmployee({...currentEmployee, department: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="">Sélectionner...</option>
                    <option value="Direction">Direction</option>
                    <option value="Ventes">Ventes</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Technique">Technique</option>
                    <option value="RH">RH</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Salaire Mensuel</label>
                  <div className="relative">
                    <input type="number" required value={currentEmployee.salary} onChange={e => setCurrentEmployee({...currentEmployee, salary: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'embauche</label>
                  <input type="date" required value={currentEmployee.hireDate} onChange={e => setCurrentEmployee({...currentEmployee, hireDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</label>
                <div className="flex gap-4">
                  {['active', 'on_leave', 'terminated'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentEmployee({...currentEmployee, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentEmployee.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Actif' : status === 'on_leave' ? 'Congé' : 'Sorti'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le collaborateur'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 5. School Manager (Gestion scolaire)
const SchoolManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => ({
    tableName: 'students' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: students, loading } = useSupabaseData<any>(options);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.students.save({
        ...currentStudent,
        merchantId: merchant.id
      });
      toast.success('Étudiant enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Étudiants</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Effectif: {students.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentStudent({ firstName: '', lastName: '', grade: '', parentContact: '', status: 'active', email: '', phone: '', address: '', birthDate: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Étudiant</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Étudiant</th>
                  <th className="px-8 py-5">Classe / Niveau</th>
                  <th className="px-8 py-5">Contact Parent</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-sm border border-blue-100 group-hover:scale-110 transition-transform">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm leading-tight">{s.firstName} {s.lastName}</span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">MAT: {s.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-200">
                        {s.grade}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center text-[10px] font-black text-ink">
                        <Phone className="w-3 h-3 mr-2 opacity-40 text-primary" /> 
                        {s.parentContact || '---'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {s.status === 'active' ? 'INSCRIT' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentStudent(s); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails de l'Étudiant</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Dossier académique</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentStudent.firstName} onChange={e => setCurrentStudent({...currentStudent, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentStudent.lastName} onChange={e => setCurrentStudent({...currentStudent, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Classe / Niveau</label>
                  <input type="text" required value={currentStudent.grade} onChange={e => setCurrentStudent({...currentStudent, grade: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="ex: Terminale S" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Parent</label>
                  <input type="text" required value={currentStudent.parentContact} onChange={e => setCurrentStudent({...currentStudent, parentContact: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="+221 ..." />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut d'inscription</label>
                <div className="flex gap-4">
                  {['active', 'inactive'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentStudent({...currentStudent, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentStudent.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Inscrit' : 'Inactif'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer l\'étudiant'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 6. Medical Manager (Gestion médicale)
const MedicalManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => ({
    tableName: 'patients' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: patients, loading } = useSupabaseData<any>(options);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.patients.save({
        ...currentPatient,
        merchantId: merchant.id
      });
      toast.success('Patient enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Patients</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Dossiers actifs: {patients.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentPatient({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', bloodType: '', phone: '', email: '', address: '', allergies: '', medicalHistory: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Patient</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Patient</th>
                  <th className="px-8 py-5">Infos Vitales</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Dernière Visite</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 font-black text-sm border border-rose-100 group-hover:scale-110 transition-transform">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm leading-tight">{p.firstName} {p.lastName}</span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">REF: {p.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-ink uppercase tracking-tighter">{p.gender === 'M' ? 'MASCULIN' : 'FÉMININ'}</span>
                          <span className="text-[10px] font-mono text-gray-400 font-bold">{p.dateOfBirth || '---'}</span>
                        </div>
                        {p.bloodType && (
                          <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg shadow-sm shadow-rose-200">
                            {p.bloodType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1">
                        <span className="flex items-center text-[10px] font-black text-ink"><Phone className="w-3 h-3 mr-1.5 opacity-40 text-primary" /> {p.phone || '---'}</span>
                        <span className="flex items-center text-[10px] font-medium text-gray-500"><Mail className="w-3 h-3 mr-1.5 opacity-40" /> {p.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-bold text-gray-400">
                        {p.updatedAt ? format(new Date(p.updatedAt), 'dd/MM/yyyy') : '---'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentPatient(p); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Dossier Médical Patient</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Confidentialité & Suivi médical</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentPatient.firstName} onChange={e => setCurrentPatient({...currentPatient, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentPatient.lastName} onChange={e => setCurrentPatient({...currentPatient, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date de Naissance</label>
                  <input type="date" required value={currentPatient.dateOfBirth} onChange={e => setCurrentPatient({...currentPatient, dateOfBirth: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Sexe</label>
                  <select value={currentPatient.gender} onChange={e => setCurrentPatient({...currentPatient, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="O">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Groupe Sanguin</label>
                  <select value={currentPatient.bloodType} onChange={e => setCurrentPatient({...currentPatient, bloodType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="">Inconnu</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                  <input type="text" required value={currentPatient.phone} onChange={e => setCurrentPatient({...currentPatient, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={currentPatient.email} onChange={e => setCurrentPatient({...currentPatient, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Allergies connues</label>
                <textarea value={currentPatient.allergies} onChange={e => setCurrentPatient({...currentPatient, allergies: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-rose-50/30 text-rose-700 text-sm min-h-[60px]" placeholder="Liste des allergies..." />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Antécédents Médicaux</label>
                <textarea value={currentPatient.medicalHistory} onChange={e => setCurrentPatient({...currentPatient, medicalHistory: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm min-h-[100px]" placeholder="Historique des pathologies, chirurgies..." />
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le dossier'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 7. Appointment Manager (Gestion des rendez-vous)
const AppointmentManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => ({
    tableName: 'appointments' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const }
  }), [merchant.id]);

  const { data: appointments, loading } = useSupabaseData<any>(options);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.appointments.save({
        ...currentAppointment,
        merchantId: merchant.id
      });
      toast.success('Rendez-vous enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Rendez-vous</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Total: {appointments.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentAppointment({ patientName: '', doctorName: '', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'scheduled', type: 'consultation' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Rendez-vous</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Patient / Client</th>
                  <th className="px-8 py-5">Praticien / Ressource</th>
                  <th className="px-8 py-5">Date & Heure</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((app: any) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-ink text-sm leading-tight">{app.patientName}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">ID: {app.id?.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                          {app.doctorName?.[0]}
                        </div>
                        <span className="text-sm font-black text-ink">{app.doctorName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-black text-ink uppercase">{app.date}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">à {app.time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-200">
                        {app.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        app.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {app.status === 'scheduled' ? 'PROGRAMMÉ' : app.status === 'completed' ? 'TERMINÉ' : 'ANNULÉ'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentAppointment(app); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails du Rendez-vous</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Planification & Ressources</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Patient / Client</label>
                  <input type="text" required value={currentAppointment.patientName} onChange={e => setCurrentAppointment({...currentAppointment, patientName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Praticien / Ressource</label>
                  <input type="text" required value={currentAppointment.doctorName} onChange={e => setCurrentAppointment({...currentAppointment, doctorName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date du rendez-vous</label>
                  <input type="date" required value={currentAppointment.date} onChange={e => setCurrentAppointment({...currentAppointment, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Heure</label>
                  <input type="time" required value={currentAppointment.time} onChange={e => setCurrentAppointment({...currentAppointment, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de prestation</label>
                  <input type="text" required value={currentAppointment.type} onChange={e => setCurrentAppointment({...currentAppointment, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="ex: Consultation" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</label>
                  <select value={currentAppointment.status} onChange={e => setCurrentAppointment({...currentAppointment, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="scheduled">Programmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                    <option value="no-show">Absent</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le rendez-vous'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default MerchantSaaS;
