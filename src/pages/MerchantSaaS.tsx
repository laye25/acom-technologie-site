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
  Briefcase, ClipboardList, UserPlus, Building2, Check, Zap
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
        const m = await db.merchants.getByOwner(user.id);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
              <p className="text-sm text-gray-500">
                {merchant.type === 'entreprise' ? 'Tableau de bord entreprise' :
                 merchant.type === 'chantier' ? 'Tableau de bord chantier / BTP' :
                 merchant.type === 'transport' ? 'Tableau de bord flotte / transport' :
                 merchant.type === 'rh' ? 'Tableau de bord RH' :
                 merchant.type === 'scolaire' ? 'Tableau de bord établissement scolaire' :
                 merchant.type === 'medical' ? 'Tableau de bord établissement médical' :
                 'Tableau de bord commerçant'}
              </p>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl border border-black/5 shadow-sm overflow-x-auto scrollbar-hide">
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
    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
      active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-4 h-4" />
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
    } catch (error) {
      toast.error('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-black/5"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Store className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Bienvenue sur Acom SaaS</h2>
        <p className="text-gray-500 text-center mb-8">
          Configurez {label} pour commencer à gérer votre activité.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nom de {label}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder={placeholder}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Forfait</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as MerchantPlan)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="FREE">FREE (0 FCFA/mois)</option>
              <option value="BASIC">BASIC (10 000 FCFA/mois)</option>
              <option value="STANDARD">STANDARD (25 000 FCFA/mois)</option>
              <option value="PREMIUM">PREMIUM (45 000 FCFA/mois)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Créer ${label}`}
          </button>
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
    where: [['merchantId', '==', merchant.id]]
  }), [merchant.id]);

  const saleOptions = useMemo(() => ({
    tableName: 'merchant_sales' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const },
    limit: 500
  }), [merchant.id]);

  const expenseOptions = useMemo(() => ({
    tableName: 'merchant_expenses' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const },
    limit: 500
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
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Transactions Récentes</h3>
            <button className="text-sm font-bold text-primary hover:underline flex items-center">
              Voir tout <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucune transaction enregistrée</p>
            ) : (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'sale' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">
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
                      <p className="text-xs text-gray-400">
                        {format(new Date(tx.date), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${tx.type === 'sale' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'sale' ? '+' : '-'}{tx.type === 'sale' ? tx.totalAmount.toLocaleString() : tx.amount.toLocaleString()} {merchant.currency}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                      {tx.paymentMethod || tx.category || 'Général'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Alerts / Quick View */}
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          {merchant.type === 'scolaire' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Dernières Inscriptions</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-full">
                  {students.length} élèves
                </span>
              </div>
              <div className="space-y-4">
                {students.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucun élève inscrit</p>
                ) : (
                  students.slice(0, 5).map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">Classe: {student.class}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{student.enrollmentDate}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'medical' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Prochains Rendez-vous</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                  {appointments.length} RDV
                </span>
              </div>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucun rendez-vous prévu</p>
                ) : (
                  appointments.slice(0, 5).map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Calendar className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{apt.patientName}</p>
                          <p className="text-xs text-gray-500">{apt.time} - {apt.reason}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{apt.date}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'chantier' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">État des Projets</h3>
                <span className="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-full">
                  {projects.length} projets
                </span>
              </div>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucun projet en cours</p>
                ) : (
                  projects.slice(0, 5).map((project: any) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <HardHat className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500">Avancement: {project.progress}%</p>
                        </div>
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'transport' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">État de la Flotte</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                  {vehicles.length} véhicules
                </span>
              </div>
              <div className="space-y-4">
                {vehicles.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucun véhicule enregistré</p>
                ) : (
                  vehicles.slice(0, 5).map((vehicle: any) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Car className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{vehicle.model}</p>
                          <p className="text-xs text-gray-500">{vehicle.plateNumber}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        vehicle.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'rh' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Derniers Recrutements</h3>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full">
                  {employees.length} employés
                </span>
              </div>
              <div className="space-y-4">
                {employees.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucun employé enregistré</p>
                ) : (
                  employees.slice(0, 5).map((emp: any) => (
                    <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.position}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{emp.joinDate}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'entreprise' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Interventions Récentes</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                  {interventions.length} interventions
                </span>
              </div>
              <div className="space-y-4">
                {interventions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucune intervention enregistrée</p>
                ) : (
                  interventions.slice(0, 5).map((inter: any) => (
                    <div key={inter.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Wrench className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{inter.customerName}</p>
                          <p className="text-xs text-gray-500">{inter.serviceType}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        inter.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {inter.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Alertes Stock</h3>
                <span className="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-full">
                  {stats.lowStockCount} alertes
                </span>
              </div>
              <div className="space-y-4">
                {products.filter(p => p.stockQuantity <= (p.minStockLevel || 5)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-emerald-600 font-bold">Tout est en stock !</p>
                    <p className="text-sm text-gray-400 mt-1">Vos niveaux de stock sont optimaux.</p>
                  </div>
                ) : (
                  products.filter(p => p.stockQuantity <= (p.minStockLevel || 5)).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Package className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{product.name}</p>
                          <p className="text-xs text-amber-600 font-bold">
                            Stock actuel: {product.stockQuantity} (Min: {product.minStockLevel || 5})
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-amber-600 bg-white px-3 py-1 rounded-full border border-amber-200 shadow-sm mb-2">
                          CRITIQUE
                        </span>
                        <button className="text-xs font-bold text-primary hover:underline">Réapprovisionner</button>
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
  <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
    <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-7 h-7 ${color}`} />
    </div>
    <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">{title}</p>
    <div className="flex items-baseline space-x-1">
      <p className="text-3xl font-black text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {currency && <span className="text-sm font-bold text-gray-400">{currency}</span>}
    </div>
    {description && <p className="text-xs text-gray-400 mt-2 font-medium">{description}</p>}
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
    where: [['merchantId', '==', merchant.id]]
  }), [merchant.id]);

  const { data: products, loading } = useSupabaseData<MerchantProduct>(productOptions);

  const movementOptions = useMemo(() => ({
    tableName: 'stock_movements' as TableName,
    where: [['merchantId', '==', merchant.id]],
    order: { column: 'createdAt' as const, direction: 'desc' as const },
    limit: 20
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
        <button
          onClick={() => {
            setCurrentProduct({ name: '', price: 0, stockQuantity: 0, category: 'Général', minStockLevel: 5 });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau produit</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Prix</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                          {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300" />}
                        </div>
                        <span className="font-bold text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{product.sku || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{product.price.toLocaleString()} {merchant.currency}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          product.stockQuantity <= (product.minStockLevel || 5) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {product.stockQuantity}
                        </span>
                        <button 
                          onClick={() => { setCurrentProduct(product); setIsRestocking(true); }}
                          className="p-1 hover:bg-primary/10 text-primary rounded-md"
                          title="Réapprovisionner"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setCurrentProduct(product); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(product.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Mouvements de stock récents
          </h3>
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Quantité</th>
                  <th className="px-6 py-3">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m: any) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="text-xs">
                      <td className="px-6 py-3 text-gray-500">
                        {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd/MM HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-3 font-bold text-gray-900">{product?.name || 'Produit supprimé'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 
                          m.type === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {m.type === 'in' ? 'Entrée' : m.type === 'sale' ? 'Vente' : m.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-bold">
                        {m.type === 'in' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{m.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      <AnimatePresence>
        {isRestocking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Réapprovisionner</h3>
                <button onClick={() => setIsRestocking(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-6">Produit: <span className="font-bold text-gray-900">{currentProduct?.name}</span></p>
              <form onSubmit={handleRestock} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Quantité à ajouter</label>
                  <input type="number" required min="1" value={restockData.quantity || ''} onChange={e => setRestockData({...restockData, quantity: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Coût total d'achat (Optionnel)</label>
                  <p className="text-[10px] text-gray-400 mb-1">Si renseigné, une dépense sera créée automatiquement.</p>
                  <input type="number" min="0" value={restockData.cost || ''} onChange={e => setRestockData({...restockData, cost: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Raison / Note</label>
                  <input type="text" value={restockData.reason} onChange={e => setRestockData({...restockData, reason: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmer l\'ajout'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{currentProduct?.id ? 'Modifier le produit' : 'Nouveau produit'}</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom du produit</label>
                    <input type="text" required value={currentProduct?.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prix de vente</label>
                    <input type="number" required value={currentProduct?.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prix d'achat (Optionnel)</label>
                    <input type="number" value={currentProduct?.costPrice || ''} onChange={e => setCurrentProduct({...currentProduct, costPrice: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Stock actuel</label>
                    <input type="number" required value={currentProduct?.stockQuantity || ''} onChange={e => setCurrentProduct({...currentProduct, stockQuantity: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Alerte stock bas</label>
                    <input type="number" value={currentProduct?.minStockLevel || ''} onChange={e => setCurrentProduct({...currentProduct, minStockLevel: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                    <input type="text" value={currentProduct?.category || ''} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </form>
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-left group"
            >
              <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-300" />}
              </div>
              <h4 className="font-bold text-sm text-gray-900 truncate">{product.name}</h4>
              <p className="text-xs text-primary font-bold">{product.price.toLocaleString()} {merchant.currency}</p>
              <p className="text-[10px] text-gray-400 mt-1">Stock: {product.stockQuantity}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96">
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-lg sticky top-32">
          <h3 className="text-lg font-bold mb-6 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-primary" /> Panier</h3>
          <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2">
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">Panier vide</p>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} x {item.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-6">
            <div className="space-y-2">
              <input type="text" placeholder="Nom client" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm" />
              <input type="tel" placeholder="Téléphone client" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <PaymentMethodBtn active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} label="Espèces" />
              <PaymentMethodBtn active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} label="Carte" />
              <PaymentMethodBtn active={paymentMethod === 'mobile_money'} onClick={() => setPaymentMethod('mobile_money')} label="Mobile" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()} {merchant.currency}</span>
            </div>
            <button onClick={handleCheckout} disabled={cart.length === 0 || isSubmitting} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Valider la vente'}
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
  <button onClick={onClick} className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${active ? 'bg-primary border-primary text-white' : 'bg-white border-gray-100 text-gray-500'}`}>{label}</button>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Journal d'Audit des Stocks</h2>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Quantité</th>
                  <th className="px-6 py-4">Stock Précédent</th>
                  <th className="px-6 py-4">Nouveau Stock</th>
                  <th className="px-6 py-4">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m: any) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                        {product?.name || 'Produit supprimé'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          m.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 
                          m.type === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {m.type === 'in' ? 'Réapprovisionnement' : m.type === 'sale' ? 'Vente' : m.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">
                        {m.type === 'in' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{m.previousQuantity}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{m.newQuantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{m.reason}</td>
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
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Comptabilité & Dépenses</h3>
        <button onClick={() => setIsAddingExpense(true)} className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
          <Plus className="w-4 h-4" />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-4">Titre</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{expense.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{expense.category}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(expense.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right font-bold text-red-600">-{expense.amount.toLocaleString()} {merchant.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddingExpense && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Nouvelle dépense</h3>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Titre</label>
                <input type="text" required value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Montant</label>
                <input type="number" required value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                <input type="text" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsAddingExpense(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Historique des Ventes</h2>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Articles</th>
                  <th className="px-6 py-4">Paiement</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sale.createdAt?.seconds ? format(new Date(sale.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{sale.customerName || 'Client POS'}</p>
                      {sale.customerPhone && <p className="text-xs text-gray-400">{sale.customerPhone}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {sale.items.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-50 rounded text-[10px] text-gray-600">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase text-gray-500">
                        {sale.paymentMethod === 'cash' ? 'Espèces' : 
                         sale.paymentMethod === 'card' ? 'Carte' : 'Mobile'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {sale.totalAmount.toLocaleString()} {merchant.currency}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => generateReceiptPDF(merchant, sale)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        title="Réimprimer la facture"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
    where: [['merchantId', '==', merchant.id]]
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Fournisseurs</h2>
        <button
          onClick={() => {
            setCurrentSupplier({ name: '', contactName: '', email: '', phone: '', category: 'Général' });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setCurrentSupplier(supplier); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{supplier.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{supplier.category}</p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2 opacity-40" />
                  {supplier.contactName || 'N/A'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 opacity-40" />
                  {supplier.phone || 'N/A'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 opacity-40" />
                  {supplier.email || 'N/A'}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">{currentSupplier?.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'entreprise</label>
                    <input type="text" required value={currentSupplier?.name || ''} onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Personne de contact</label>
                    <input type="text" value={currentSupplier?.contactName || ''} onChange={e => setCurrentSupplier({...currentSupplier, contactName: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
                    <input type="tel" value={currentSupplier?.phone || ''} onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input type="email" value={currentSupplier?.email || ''} onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                    <input type="text" value={currentSupplier?.category || ''} onChange={e => setCurrentSupplier({...currentSupplier, category: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Enregistrer le fournisseur'}
                </button>
              </form>
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
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
        <h3 className="text-xl font-bold mb-8">Réglages de la boutique</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type de SaaS</p>
                <p className="font-bold text-gray-900 capitalize">{merchant.type}</p>
              </div>
            </div>
            <div className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
              <AlertCircle className="w-3 h-3 mr-1" />
              Fixe
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Forfait</p>
                <p className="font-bold text-gray-900">{merchant.plan || 'FREE'}</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="text-[10px] font-bold text-primary hover:underline bg-primary/5 px-2 py-1 rounded-full"
            >
              Améliorer
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nom de la boutique</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Adresse</label>
              <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Enregistrer les modifications</>}
          </button>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Interventions</h2>
        <button 
          onClick={() => {
            setCurrentIntervention({ customerName: '', serviceType: '', status: 'pending', date: new Date().toISOString().split('T')[0], price: 0 });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Intervention</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Prix</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interventions.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.serviceType}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      item.status === 'in-progress' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">{item.price.toLocaleString()} {merchant.currency}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setCurrentIntervention(item); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Détails de l'Intervention</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du Client</label>
                <input type="text" required value={currentIntervention.customerName} onChange={e => setCurrentIntervention({...currentIntervention, customerName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type de Service</label>
                <input type="text" required value={currentIntervention.serviceType} onChange={e => setCurrentIntervention({...currentIntervention, serviceType: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input type="date" required value={currentIntervention.date} onChange={e => setCurrentIntervention({...currentIntervention, date: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prix</label>
                  <input type="number" required value={currentIntervention.price} onChange={e => setCurrentIntervention({...currentIntervention, price: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                <select value={currentIntervention.status} onChange={e => setCurrentIntervention({...currentIntervention, status: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="pending">En attente</option>
                  <option value="in-progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Chantiers</h2>
        <button 
          onClick={() => {
            setCurrentProject({ name: '', location: '', status: 'planned', budget: 0, startDate: '', endDate: '' });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <div key={project.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group/card">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <HardHat className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center space-x-2 transition-opacity">
                  <button onClick={() => { setCurrentProject(project); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <div onClick={() => setDeleteConfirm(project.id)} className="p-2 cursor-pointer hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
              <p className="text-sm text-gray-500 mb-4 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {project.location}</p>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  project.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                  project.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {project.status}
                </span>
                <span className="font-bold text-sm">{project.budget.toLocaleString()} {merchant.currency}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Détails du Projet</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du Projet</label>
                <input type="text" required value={currentProject.name} onChange={e => setCurrentProject({...currentProject, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Localisation</label>
                <input type="text" required value={currentProject.location} onChange={e => setCurrentProject({...currentProject, location: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Budget</label>
                  <input type="number" required value={currentProject.budget} onChange={e => setCurrentProject({...currentProject, budget: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                  <select value={currentProject.status} onChange={e => setCurrentProject({...currentProject, status: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="planned">Planifié</option>
                    <option value="active">En cours</option>
                    <option value="on-hold">En pause</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion de la Flotte</h2>
        <button 
          onClick={() => {
            setCurrentVehicle({ plateNumber: '', model: '', type: 'car', status: 'active', lastMaintenance: '' });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Véhicule</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v: any) => (
            <div key={v.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <button onClick={() => { setCurrentVehicle(v); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{v.model}</h3>
              <p className="text-sm font-mono text-gray-500 mb-4">{v.plateNumber}</p>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  v.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                  v.status === 'maintenance' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                }`}>
                  {v.status}
                </span>
                <span className="text-xs text-gray-400">Type: {v.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Détails du Véhicule</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Plaque d'immatriculation</label>
                  <input type="text" required value={currentVehicle.plateNumber} onChange={e => setCurrentVehicle({...currentVehicle, plateNumber: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Modèle</label>
                  <input type="text" required value={currentVehicle.model} onChange={e => setCurrentVehicle({...currentVehicle, model: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                  <select value={currentVehicle.type} onChange={e => setCurrentVehicle({...currentVehicle, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="car">Voiture</option>
                    <option value="truck">Camion</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                  <select value={currentVehicle.status} onChange={e => setCurrentVehicle({...currentVehicle, status: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="active">Actif</option>
                    <option value="maintenance">En maintenance</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion du Personnel</h2>
        <button 
          onClick={() => {
            setCurrentEmployee({ firstName: '', lastName: '', position: '', department: '', salary: 0, hireDate: new Date().toISOString().split('T')[0] });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Employé</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Poste</th>
                <th className="px-6 py-4">Département</th>
                <th className="px-6 py-4">Date d'embauche</th>
                <th className="px-6 py-4 text-right">Salaire</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-primary font-bold">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <span className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{emp.position}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{emp.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{emp.hireDate}</td>
                  <td className="px-6 py-4 text-right font-bold">{emp.salary.toLocaleString()} {merchant.currency}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setCurrentEmployee(emp); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Détails de l'Employé</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
                  <input type="text" required value={currentEmployee.firstName} onChange={e => setCurrentEmployee({...currentEmployee, firstName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
                  <input type="text" required value={currentEmployee.lastName} onChange={e => setCurrentEmployee({...currentEmployee, lastName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Poste</label>
                <input type="text" required value={currentEmployee.position} onChange={e => setCurrentEmployee({...currentEmployee, position: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Salaire</label>
                  <input type="number" required value={currentEmployee.salary} onChange={e => setCurrentEmployee({...currentEmployee, salary: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date d'embauche</label>
                  <input type="date" required value={currentEmployee.hireDate} onChange={e => setCurrentEmployee({...currentEmployee, hireDate: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Étudiants</h2>
        <button 
          onClick={() => {
            setCurrentStudent({ firstName: '', lastName: '', grade: '', parentContact: '', status: 'active' });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Étudiant</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Classe / Niveau</th>
                <th className="px-6 py-4">Contact Parent</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-primary font-bold">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <span className="font-bold text-gray-900">{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{s.grade}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{s.parentContact}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      s.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setCurrentStudent(s); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Détails de l'Étudiant</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
                  <input type="text" required value={currentStudent.firstName} onChange={e => setCurrentStudent({...currentStudent, firstName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
                  <input type="text" required value={currentStudent.lastName} onChange={e => setCurrentStudent({...currentStudent, lastName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Classe / Niveau</label>
                <input type="text" required value={currentStudent.grade} onChange={e => setCurrentStudent({...currentStudent, grade: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contact Parent</label>
                <input type="text" required value={currentStudent.parentContact} onChange={e => setCurrentStudent({...currentStudent, parentContact: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Patients</h2>
        <button 
          onClick={() => {
            setCurrentPatient({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', bloodType: '', phone: '' });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Patient</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Date de Naissance</th>
                <th className="px-6 py-4">Sexe</th>
                <th className="px-6 py-4">Groupe Sanguin</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-primary font-bold">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <span className="font-bold text-gray-900">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.dateOfBirth}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.gender}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.bloodType}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setCurrentPatient(p); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Détails du Patient</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
                  <input type="text" required value={currentPatient.firstName} onChange={e => setCurrentPatient({...currentPatient, firstName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
                  <input type="text" required value={currentPatient.lastName} onChange={e => setCurrentPatient({...currentPatient, lastName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date de Naissance</label>
                  <input type="date" required value={currentPatient.dateOfBirth} onChange={e => setCurrentPatient({...currentPatient, dateOfBirth: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sexe</label>
                  <select value={currentPatient.gender} onChange={e => setCurrentPatient({...currentPatient, gender: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Groupe Sanguin</label>
                  <input type="text" value={currentPatient.bloodType} onChange={e => setCurrentPatient({...currentPatient, bloodType: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone</label>
                  <input type="text" required value={currentPatient.phone} onChange={e => setCurrentPatient({...currentPatient, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Rendez-vous</h2>
        <button 
          onClick={() => {
            setCurrentAppointment({ patientName: '', doctorName: '', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'scheduled', type: 'consultation' });
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Rendez-vous</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Patient / Client</th>
                <th className="px-6 py-4">Praticien / Ressource</th>
                <th className="px-6 py-4">Date & Heure</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((app: any) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-900">{app.patientName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.doctorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.date} à {app.time}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      app.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setCurrentAppointment(app); setIsEditing(true); }} className="p-2 hover:bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Détails du Rendez-vous</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du Patient / Client</label>
                <input type="text" required value={currentAppointment.patientName} onChange={e => setCurrentAppointment({...currentAppointment, patientName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Praticien / Ressource</label>
                <input type="text" required value={currentAppointment.doctorName} onChange={e => setCurrentAppointment({...currentAppointment, doctorName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input type="date" required value={currentAppointment.date} onChange={e => setCurrentAppointment({...currentAppointment, date: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Heure</label>
                  <input type="time" required value={currentAppointment.time} onChange={e => setCurrentAppointment({...currentAppointment, time: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                  <input type="text" required value={currentAppointment.type} onChange={e => setCurrentAppointment({...currentAppointment, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                  <select value={currentAppointment.status} onChange={e => setCurrentAppointment({...currentAppointment, status: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="scheduled">Programmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                    <option value="no-show">Absent</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default MerchantSaaS;
