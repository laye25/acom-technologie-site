import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { dbService } from '../services/dbService';
import { syncService } from '../services/syncService';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { 
  Store, Package, ShoppingCart, PieChart, Plus, Trash2, Trash2 as Trash,
  Edit2, Search, Loader2, Save, X, TrendingUp, Download, Eye,
  DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle, Info,
  BarChart3, Settings, User, Phone, Mail, MapPin,
  Calculator, Receipt, CreditCard, Smartphone, Banknote,
  Clock, CheckCircle, TrendingDown, ArrowRight, FileText, Truck,
  Wrench, HardHat, Car, Users, GraduationCap, Stethoscope, Calendar, MessageSquare,
  Briefcase, ClipboardList, ClipboardCheck, UserPlus, Building2, Check, Zap, Minus,
  Printer, HardDrive, Database, RefreshCw, Upload, Cpu, Terminal,
  Lock as LockIcon, GitBranch, Github, Monitor, MonitorUp, Rocket,
  Filter, SlidersHorizontal, ArrowUpDown, Tag, Scissors, Palette, ScanLine, PenTool, BookOpen,
  ShieldAlert, Heart, FileCheck, Fingerprint, Sparkles, LayoutDashboard, Key, Bus, Utensils, WashingMachine, ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import { 
  format, subDays, startOfDay, endOfDay, eachDayOfInterval, 
  startOfYear, eachMonthOfInterval, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, getDay, addDays, startOfWeek, endOfWeek,
  addMonths
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Merchant, MerchantSale, MerchantExpense } from '../types';
import { triggerAcomAlert } from './AcomAlertEventProvider';
import { sendEmailDirectlyOrViaBackend } from '../lib/api';
import { GlobalActivityFeed } from './GlobalActivityFeed';
import { DailyBriefing } from './DailyBriefing';
import { PlanUpgradeModal } from './PlanUpgradeModal';
import { OptimizedImage } from './OptimizedImage';

const isDesktop = typeof window !== 'undefined' && 
  (window.navigator.userAgent.includes('Electron') || 
   window.navigator.userAgent.includes('AcomDesktop') || 
   (window as any).ipcRenderer !== undefined);

// Define type references
import { PressingTicket } from '../modules/pressing/types';

export const MerchantDashboard = ({ 
  merchant, 
  onUpdate,
  showUpgradeModal,
  setShowUpgradeModal,
  setActiveTab
}: { 
  merchant: Merchant, 
  onUpdate: (m: Merchant) => void,
  showUpgradeModal: boolean,
  setShowUpgradeModal: (val: boolean) => void,
  setActiveTab?: (tab: string) => void
}) => {
  const [desktopOS, setDesktopOS] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [fileToRestore, setFileToRestore] = useState<File | null>(null);
  const [dashboardSelectedMonth, setDashboardSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Load tailleur-specific data if merchant type is tailleur
  const tailleurClients = useMemo<any[]>(() => {
    if (merchant.type !== 'tailleur') return [];
    try {
      const saved = localStorage.getItem(`tailleur_clients_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, merchant.type]);

  const tailleurOrders = useMemo<any[]>(() => {
    if (merchant.type !== 'tailleur') return [];
    try {
      const saved = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, merchant.type]);

  const tailleurTissus = useMemo<any[]>(() => {
    if (merchant.type !== 'tailleur') return [];
    try {
      const saved = localStorage.getItem(`tailleur_tissus_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, merchant.type]);

  const tailleurDashboardStats = useMemo(() => {
    if (merchant.type !== 'tailleur') return null;

    const filteredOrders = dashboardSelectedMonth
      ? tailleurOrders.filter(o => o.createdAt && o.createdAt.startsWith(dashboardSelectedMonth))
      : tailleurOrders;

    const ordersCount = filteredOrders.length;
    const totalOrdersAmount = filteredOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    const totalAdvances = filteredOrders.reduce((sum, o) => sum + (Number(o.advance) || 0), 0);
    const totalPaid = filteredOrders.filter(o => o.status === 'livre').length;
    const activeOrders = filteredOrders.filter(o => o.status !== 'livre').length;

    return {
      ordersCount,
      totalOrdersAmount,
      totalAdvances,
      totalPaid,
      activeOrders,
      clientsCount: tailleurClients.length,
      tissusCount: tailleurTissus.length
    };
  }, [tailleurClients, tailleurOrders, tailleurTissus, merchant.type, dashboardSelectedMonth]);

  // Load pressing-specific data if merchant type is pressing
  const pressingTickets = useMemo<PressingTicket[]>(() => {
    if (merchant.type !== 'pressing') return [];
    try {
      const saved = localStorage.getItem(`pressing_tickets_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, merchant.type]);

  const pressingProductSales = useMemo<any[]>(() => {
    if (merchant.type !== 'pressing') return [];
    try {
      const saved = localStorage.getItem(`pressing_stock_sales_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, merchant.type]);

  const pressingDashboardTarifs = useMemo(() => {
    if (merchant.type !== 'pressing') return null;
    try {
      const saved = localStorage.getItem(`pressing_tarifs_${merchant.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [merchant.id, merchant.type]);

  const pressingDashboardStats = useMemo(() => {
    if (merchant.type !== 'pressing') return null;

    const filteredTickets = (dashboardSelectedMonth 
      ? pressingTickets.filter(t => t.depositDate && t.depositDate.startsWith(dashboardSelectedMonth))
      : pressingTickets).filter(t => t.status !== 'quotation');
      
    const filteredProductSales = dashboardSelectedMonth
      ? pressingProductSales.filter(s => s.date && s.date.startsWith(dashboardSelectedMonth))
      : pressingProductSales;

    const totalTicketsAmount = filteredTickets.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalTicketsPaid = filteredTickets.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
    const totalTicketsDue = Math.max(0, totalTicketsAmount - totalTicketsPaid);
    
    const totalTicketsCost = filteredTickets.reduce((sum, t) => {
      if (typeof t.totalCost === 'number') return sum + t.totalCost;
      
      let retroCost = 0;
      const aCosts = pressingDashboardTarifs?.articles_costs || {};
      const pCosts = pressingDashboardTarifs?.poids_costs || {};
      const sCosts = pressingDashboardTarifs?.supplements_costs || {};

      if (t.billingType === 'article' && t.articles) {
        retroCost += Object.keys(t.articles).reduce((acc, key) => {
           let defaultCost = 0;
           if (key === 'chemise') defaultCost = 100;
           if (key === 'pantalon') defaultCost = 150;
           if (key === 'costume') defaultCost = 300;
           if (key === 'robe') defaultCost = 200;
           if (key === 'drap') defaultCost = 150;
           if (key === 'couverture') defaultCost = 400;
           if (key === 'rideau') defaultCost = 300;
           if (key === 'autre') defaultCost = 100;
           return acc + (t.articles[key] * (aCosts[key] !== undefined ? aCosts[key] : defaultCost));
        }, 0);
      } else if (t.billingType === 'poids' && t.weightKg) {
         let defaultCost = 0;
         if (t.weightService === 'standard') defaultCost = 200;
         if (t.weightService === 'premium') defaultCost = 300;
         if (t.weightService === 'express') defaultCost = 400;
         retroCost += t.weightKg * (pCosts[t.weightService] !== undefined ? pCosts[t.weightService] : defaultCost);
      }

      if (t.supplements) {
        retroCost += Object.keys(t.supplements).reduce((acc, key) => {
           if (!t.supplements[key]) return acc;
           let defaultCost = 0;
           if (key === 'repassage') defaultCost = 100;
           if (key === 'express') defaultCost = 200;
           if (key === 'detachage') defaultCost = 150;
           if (key === 'livraison') defaultCost = 400;
           if (key === 'premiumPack') defaultCost = 100;
           return acc + (sCosts[key] !== undefined ? sCosts[key] : defaultCost);
        }, 0);
      }
      return sum + retroCost;
    }, 0);
    
    const totalProductsAmount = filteredProductSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalProductsCost = filteredProductSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    
    const totalRevenue = totalTicketsAmount + totalProductsAmount;
    const totalCost = totalTicketsCost + totalProductsCost;
    const totalProfit = totalRevenue - totalCost;
    const totalEncashed = totalTicketsPaid + totalProductsAmount;
    
    return {
      totalTicketsAmount,
      totalTicketsPaid,
      totalTicketsDue,
      totalTicketsCost,
      totalProductsAmount,
      totalProductsCost,
      totalRevenue,
      totalCost,
      totalProfit,
      totalEncashed,
      ticketsCount: filteredTickets.length,
      salesCount: filteredProductSales.length
    };
  }, [pressingTickets, pressingProductSales, merchant.type, dashboardSelectedMonth, pressingDashboardTarifs]);

  // States for Smart School Multi-Send communication hub on dashboard
  const [dashboardSchoolTab, setDashboardSchoolTab] = useState<'inscriptions' | 'broadcast'>('inscriptions');
  const [broadcastSelectedStudents, setBroadcastSelectedStudents] = useState<string[]>([]);
  const [broadcastCategory, setBroadcastCategory] = useState<'absence' | 'delay' | 'remind_payment' | 'grade_report' | 'custom'>('absence');
  const [broadcastCustomTitle, setBroadcastCustomTitle] = useState('Message Officiel Administration');
  const [broadcastCustomBody, setBroadcastCustomBody] = useState('');
  const [broadcastSearchQuery, setBroadcastSearchQuery] = useState('');
  const [broadcastClassFilter, setBroadcastClassFilter] = useState('');
  const [broadcastSentStatus, setBroadcastSentStatus] = useState<Record<string, 'pending' | 'whatsapp' | 'sms'>>({});
  const [dashboardDispatchModal, setDashboardDispatchModal] = useState<{
    phone: string;
    studentName: string;
    parentName: string;
    message: string;
    title: string;
  } | null>(null);

  // Read from Dexie (Offline-first)
  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];
  
  const [siteSettings, setSiteSettings] = useState<any>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const globalSettings = await dbService.settings.get('global');
        setSiteSettings(globalSettings);
      } catch (error) {
        console.error('Error fetching global settings:', error);
      }
    };
    fetchSettings();
  }, []);
  
  // Point 6: Aggregation - Global merchant stats (On-demand/Offline)
  const [merchantStats, setMerchantStats] = useState<any>(null);
  useEffect(() => {
    const fetchStats = async () => {
      // Pour les stats, on peut soit les calculer localement, soit les synchroniser
      // Ici on les cherche dans Dexie (nécessite une table merchant_stats si on veut faire comme avant)
      // Mais on peut aussi les calculer à la volée pour plus de précision
    };
    fetchStats();
  }, [merchant.id]);

  // Specialized data for stats
  const isAuto = merchant.type === 'auto';
  const isBeauty = merchant.type === 'beauty';
  const isConstruction = merchant.type === 'construction';
  const isHR = merchant.type === 'hr';
  const isLogistics = merchant.type === 'logistics';
  const isSchool = merchant.type === 'school' || merchant.type === 'scolaire';
  const isMedical = merchant.type === 'medical';

  // Sync SaaS data
  useEffect(() => {
    if (merchant?.id) {
      syncService.syncAllMerchantData(merchant.id);
    }
  }, [merchant?.id]);

  const interventions = useLiveQuery(() => 
    (isAuto || isBeauty) ? db.interventions.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isAuto, isBeauty]) || [];
  
  const projects = useLiveQuery(() => 
    (isConstruction) ? db.projects.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isConstruction]) || [];

  const vehicles = useLiveQuery(() => 
    (isLogistics) ? db.vehicles.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isLogistics]) || [];

  const employees = useLiveQuery(() => 
    (isHR) ? db.employees.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isHR]) || [];

  const students = useLiveQuery(() => 
    (isSchool) ? db.students.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isSchool]) || [];

  const classes = useLiveQuery(() => 
    (isSchool) ? db.classes?.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isSchool]) || [];

  const patients = useLiveQuery(() => 
    (isMedical) ? db.patients.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isMedical]) || [];

  const appointments = useLiveQuery(() => 
    (isMedical) ? db.appointments.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isMedical]) || [];

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = dashboardSelectedMonth || now.toISOString().slice(0, 7);
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
    const sumCOGS = (list: MerchantSale[]) => list.reduce((acc, sale) => {
      return acc + (sale.items || []).reduce((itemAcc, item) => {
        const product = products.find(p => p.id === item.productId);
        const cost = (item as any).costPrice || (product?.costPrice || 0);
        return itemAcc + ((item.quantity || 0) * cost);
      }, 0);
    }, 0);

    // Point 6: Aggregation - Use aggregated stats if available, otherwise fallback to in-memory calculation
    const revenue = merchantStats?.revenue ? {
      today: merchantStats.lastUpdate === today ? merchantStats.revenue.today : sumSales(salesToday),
      month: merchantStats.lastMonth === thisMonth ? merchantStats.revenue.month : sumSales(salesMonth),
      year: merchantStats.lastYear === thisYear ? merchantStats.revenue.year : sumSales(salesYear),
      total: merchantStats.revenue.total
    } : {
      today: sumSales(salesToday),
      month: sumSales(salesMonth),
      year: sumSales(salesYear),
      total: sumSales(sales)
    };

    const expensesStats = merchantStats?.expenses ? {
      today: merchantStats.lastUpdate === today ? merchantStats.expenses.today : sumExpenses(expensesToday),
      month: merchantStats.lastMonth === thisMonth ? merchantStats.expenses.month : sumExpenses(expensesMonth),
      year: merchantStats.lastYear === thisYear ? merchantStats.expenses.year : sumExpenses(expensesYear),
      total: merchantStats.expenses.total
    } : {
      today: sumExpenses(expensesToday),
      month: sumExpenses(expensesMonth),
      year: sumExpenses(expensesYear),
      total: sumExpenses(expenses)
    };

    const cogsTotal = merchantStats?.cogs?.total ? merchantStats.cogs.total : sumCOGS(sales);
    const cogsMonth = merchantStats?.cogs?.month && merchantStats.lastMonth === thisMonth ? merchantStats.cogs.month : sumCOGS(salesMonth);

    const netProfit = revenue.total - cogsTotal - expensesStats.total;
    const netProfitMonth = revenue.month - cogsMonth - expensesStats.month;

    // Specialized counts
    const activeInterventions = interventions.filter((i: any) => i.status !== 'completed').length;
    const activeProjects = projects.filter((p: any) => p.status === 'active').length;
    const activeVehicles = vehicles.filter((v: any) => v.status === 'active').length;
    const totalEmployees = employees.length;
    const totalStudents = students.length;
    const totalPatients = patients.length;
    const appointmentsToday = appointments.filter((a: any) => getIsoDate(a.createdAt).startsWith(today)).length;

    const totalStockValue = products.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.stockQuantity || 0)), 0);
    const totalStockProfit = products.reduce((acc, p) => acc + ((Number(p.price || 0) - Number(p.costPrice || 0)) * Number(p.stockQuantity || 0)), 0);

    const cashFlowMonth = revenue.month - expensesStats.month;
    const totalSalesCountMonth = salesMonth.length;
    const averageOrderValueMonth = salesMonth.length > 0 ? revenue.month / salesMonth.length : 0;

    return {
      revenue,
      expenses: expensesStats,
      netProfit,
      netProfitMonth,
      grossProfitMonth: revenue.month - cogsMonth,
      totalStockValue,
      totalStockProfit,
      cashFlowMonth,
      totalSalesCountMonth,
      averageOrderValueMonth,
      lowStockCount: products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length,
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
  }, [sales, expenses, products, interventions, projects, vehicles, employees, students, patients, appointments, merchantStats, dashboardSelectedMonth]);

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
      {fileToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 text-rose-600 mb-6">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">Restauration de Base de Données</h3>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mt-1">Étape de validation requise</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-800 leading-relaxed font-semibold">
                ⚠️ ATTENTION : Restaurer cette base de données SQLite écrasera définitivement toutes vos données locales actuelles (ventes, dépenses, stocks, produits) par celles du fichier téléversé. Cette action est irréversible !
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Fichier importé :</span>
                  <span className="font-bold text-gray-950 font-mono text-right truncate max-w-[200px]">{fileToRestore.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Taille :</span>
                  <span className="font-extrabold text-gray-950">{(fileToRestore.size / 1024 / 1024).toFixed(2)} Mo</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setFileToRestore(null)}
                className="flex-1 px-6 py-4 border border-gray-100 hover:border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-all cursor-pointer text-center"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const file = fileToRestore;
                  setFileToRestore(null);
                  const toastId = toast.loading('Restauration et importation en cours...');
                  try {
                    const { restoreSQLiteDB } = await import('../services/sqliteService');
                    const success = await restoreSQLiteDB(file);
                    if (success) {
                      toast.success('Restauration réussie ! Chargement des nouvelles données...', { id: toastId });
                    } else {
                      toast.error('Échec de la restauration (format .sqlite3 invalide)', { id: toastId });
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error('Restauration impossible', { id: toastId });
                  }
                }}
                className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-[0.98] cursor-pointer text-center"
              >
                Confirmer l'import
              </button>
            </div>
          </div>
        </div>
      )}

      {dashboardDispatchModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm z-[99999]">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Aperçu Dépêche Parent</h4>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">{dashboardDispatchModal.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDashboardDispatchModal(null)}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase transition-colors"
              >
                Fermer
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/60 divide-y divide-gray-100">
                <div className="pb-2.5">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Destinataire (Tuteur)</span>
                  <span className="text-xs font-black text-slate-800">{dashboardDispatchModal.parentName}</span>
                </div>
                <div className="py-2.5">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Élève Associé</span>
                  <span className="text-xs font-black text-slate-800">{dashboardDispatchModal.studentName}</span>
                </div>
                <div className="py-2.5">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Numéro Tuteur</span>
                  <span className="text-xs font-mono font-black text-slate-800">{dashboardDispatchModal.phone}</span>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <span className="text-[9px] font-mono font-black text-indigo-600 uppercase tracking-widest block mb-1">Message de la dépêche personnalisé</span>
                <p className="text-xs text-indigo-950 font-semibold leading-relaxed whitespace-pre-wrap">
                  "{dashboardDispatchModal.message}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href={`https://wa.me/${dashboardDispatchModal.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(dashboardDispatchModal.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl text-center shadow-md flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ouvrir WhatsApp</span>
                </a>
                <a
                  href={`sms:${dashboardDispatchModal.phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(dashboardDispatchModal.message)}`}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl text-center shadow-md flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Ouvrir SMS</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <DailyBriefing 
        merchantId={merchant.id} 
        data={{ sales, products, expenses }} 
      />

      {/* Sync Control Bar - Phase 2 */}
      {merchant.id && (
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 md:p-6 bg-white rounded-[2rem] border border-black/5 shadow-sm gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full">
            <div className={`p-3 shrink-0 rounded-2xl ${navigator.onLine && (merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
              {navigator.onLine && (merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') ? <Database className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 truncate">État du Moteur de Synchronisation</p>
              <h4 className="text-sm font-black text-ink uppercase tracking-tight truncate">
                {(merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') 
                  ? (navigator.onLine ? 'Mode Hybride (Local + Cloud)' : 'Mode Local (Hors ligne)') 
                  : `Mode Local (Plan: ${merchant.plan || 'TESTE'})`}
              </h4>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <button 
              onClick={async () => {
                const toastId = toast.loading('Génération du fichier de base de données SQLite...');
                try {
                  const { exportSQLiteDB } = await import('../services/sqliteService');
                  const file = await exportSQLiteDB(merchant.id);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `acom_studio_${new Date().toISOString().split('T')[0]}.sqlite3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success('Base de données SQLite exportée !', { id: toastId });
                  } else {
                    toast.error('Échec de l\'exportation SQLite (base de données introuvable)', { id: toastId });
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Échec de l\'exportation SQLite', { id: toastId });
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 transition-all group cursor-pointer"
              title="Exporter la base de données SQLite pour une utilisation Desktop"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter (.sqlite3)
            </button>
            
            <label className="flex items-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-ink hover:border-primary/30 transition-all cursor-pointer group">
              <Upload className="w-3.5 h-3.5" />
              Restaurer
              <input 
                type="file" 
                accept=".sqlite3" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFileToRestore(file);
                  // Clear value so the same file can be selected again
                  e.target.value = '';
                }}
              />
            </label>

            {!(merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') ? (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
              >
                <Zap className="w-3.5 h-3.5" />
                Activer Sync Cloud
              </button>
            ) : (
              <button 
                onClick={async () => {
                  const toastId = toast.loading('Synchronisation des données vers le cloud...');
                  try {
                    await syncService.forceUploadAllLocalData(merchant.id!);
                    await syncService.pushPendingData(merchant.id!);
                    await syncService.syncProducts(merchant.id!);
                    await syncService.syncSales(merchant.id!);
                    await syncService.syncExpenses(merchant.id!);
                    if (merchant.type === 'scolaire') {
                      await (syncService as any).pushSchoolPortalData(merchant.id!);
                      await syncService.syncSchoolPortalData(merchant.id!, true);
                    }
                    toast.success('Données synchronisées avec succès !', { id: toastId });
                  } catch (e) {
                    toast.error('Échec de la synchronisation', { id: toastId });
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary/30 transition-all group"
              >
                <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                Forcer la Synchronisation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Download Center & Build Dashboard for LOCAL Plan */}
      {merchant.plan === 'LOCAL' && !isDesktop && (
        <div className="hidden md:block bg-gradient-to-br from-gray-900 to-black rounded-[2rem] border border-gray-800 shadow-2xl overflow-hidden relative mt-8">
          <div className="p-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Architecture / OS Features Col */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-gray-900 rounded-[14px] flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Acom Desktop</h3>
                  <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                    <Github className="w-3 h-3" /> Tauri Native Build
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <MonitorUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Intégration OS Native</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Création de raccourcis sur le bureau, ajout au Menu Démarrer avec le logo personnalisé Acom, et support du mode hors-ligne natif.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <Rocket className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Démarrage Automatique</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">L'application démarre en arrière-plan avec Windows (System Tray) pour une ouverture instantanée au clic sur le logo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Moteur SQLite Intégré</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">La base de données SQLite est embarquée. Performances d'écriture instantanées et conservation garanties sur votre disque dur local.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <LockIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Sécurité & Isolation</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Le frontend React communique avec le système via des IPC sécurisés en Rust. Aucune dépendance matérielle sur le cloud requise.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Actions Pipeline Col */}
            <div className="lg:col-span-1 bg-black/60 rounded-2xl border border-gray-800 p-6 font-mono text-sm relative shadow-inner">
              <div className="absolute top-0 right-8 w-px h-full bg-gray-800/50"></div>
              <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-700">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="text-xs">main</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Build Successful</span>
                </div>
              </div>
              
              {/* Build Steps */}
              <div className="space-y-4 text-[11px] relative z-10">
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Checkout repository</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 0.5s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Install & build React frontend (Vite)</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 12s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Compile Rust Backend (`cargo build --release`)</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 3m 42s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Bundle embedded SQLite binaries</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 1.2s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300 text-emerald-400">Generate Windows Artifact (`.msi` / `.exe`)</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 45s</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Col & Desktop Preview */}
            <div className="lg:col-span-1 flex flex-col justify-between bg-gray-800/30 rounded-[1.5rem] border border-gray-700/50 overflow-hidden relative group">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-500 pointer-events-none"></div>
              
              <div className="relative p-8 flex flex-col items-center justify-center border-b border-gray-700/50 bg-black/20">
                <div className="w-[72px] h-[72px] flex items-center justify-center rounded-none shadow-lg overflow-hidden bg-white mb-4">
                  <img src={siteSettings?.desktopLogo || siteSettings?.logoUrl || "/logo.svg"} className="w-full h-full object-contain p-1" alt="Acom Desktop Logo" />
                </div>
                <h4 className="text-white font-black tracking-tight text-center text-sm">
                  Acom Gestion<br/>Desktop
                </h4>
              </div>

              <div className="relative z-10 flex-1 flex flex-col bg-transparent">
                {/* OS Toggle */}
                <div className="flex border-b border-gray-700/50 bg-black/40">
                  <button 
                    onClick={() => setDesktopOS('windows')}
                    className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${desktopOS === 'windows' ? 'border-cyan-400 text-cyan-400 bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
                  >
                    <svg viewBox="0 0 88 88" fill="currentColor" className="w-4 h-4"><path d="M0,12.4L37.6,7.1v33H0V12.4z M42.4,6.4L88,0v39.3H42.4V6.4z M0,44.9h37.6v33.4L0,73.1V44.9z M42.4,44.9H88V88L42.4,81.4V44.9z"/></svg>
                  </button>
                  <button 
                    onClick={() => setDesktopOS('mac')}
                    className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${desktopOS === 'mac' ? 'border-white text-white bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
                  >
                    <svg viewBox="0 0 384 512" fill="currentColor" className="w-4 h-4"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  </button>
                  <button 
                    onClick={() => setDesktopOS('linux')}
                    className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${desktopOS === 'linux' ? 'border-amber-400 text-amber-400 bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
                  >
                   <Terminal className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 pt-6 text-center flex-1 flex flex-col justify-end">
                  <h4 className="text-[17px] font-black text-white mb-2 tracking-tight">Télécharger l'Installateur</h4>
                  <p className="text-[11px] text-gray-400 mb-6 px-1 leading-relaxed">
                    {desktopOS === 'windows' ? "L'icône personnalisée sera automatiquement ajoutée à votre bureau Windows après l'installation." :
                     desktopOS === 'mac' ? "Déplacez l'application dans le dossier Applications après l'ouverture de l'image disque." :
                     "Le build Linux sera bientôt disponible pour les distributions basées sur Debian/Ubuntu."}
                  </p>
                  
                  <button 
                    onClick={() => {
                      if (desktopOS === 'windows') {
                        window.open("https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop.Setup.1.0.0.exe", '_blank');
                        triggerAcomAlert('Succès', 'Démarrage du téléchargement Windows...', 'success', 'SYSTÈME');
                      } else if (desktopOS === 'mac') {
                        window.open("https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop-1.0.0-arm64.dmg", '_blank');
                        triggerAcomAlert('Succès', 'Démarrage du téléchargement MacOS...', 'success', 'SYSTÈME');
                      } else {
                        triggerAcomAlert('Erreur', 'Version Linux non disponible pour le moment.', 'error', 'ALERTE');
                      }
                    }}
                    className={`w-full relative group/btn overflow-hidden px-5 py-3.5 ${desktopOS === 'linux' ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]'} rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2.5`}
                    disabled={desktopOS === 'linux'}
                  >
                    {desktopOS !== 'linux' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>}
                    <Download className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 pt-0.5">
                      {desktopOS === 'windows' ? 'ACOM_GESTION_SETUP.EXE' :
                       desktopOS === 'mac' ? 'ACOM_GESTION_MAC.DMG' :
                       'ACOM_GESTION_LINUX'}
                    </span>
                  </button>
                  <div className="mt-4 flex justify-center items-center gap-2 text-[9px] uppercase font-mono text-gray-500 font-bold">
                    <span className="bg-gray-800/80 px-2 py-1 rounded">V1.0.0</span>
                    <span>•</span>
                    <span className="bg-gray-800/80 px-2 py-1 rounded">
                      {desktopOS === 'windows' ? 'SETUP NSIS (12 MB)' :
                       desktopOS === 'mac' ? 'IMAGE DISQUE (15 MB)' :
                       'NON DISPONIBLE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Plan Upgrade Banner */}
      {merchant.plan !== 'PREMIUM' && merchant.plan !== 'LOCAL' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-hover rounded-3xl sm:rounded-[2rem] p-6 lg:p-10 text-white shadow-xl shadow-primary/20">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 text-center lg:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight mb-2">Passez au forfait supérieur</h2>
                <p className="text-white/80 text-xs sm:text-sm max-w-md lg:max-w-lg font-medium">
                  Débloquez toutes les fonctionnalités premium et propulsez votre activité vers de nouveaux sommets.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="w-full lg:w-auto px-10 py-4 lg:py-5 bg-white text-primary font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl hover:bg-gray-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              Voir les forfaits
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-black/10 rounded-full blur-2xl opacity-30" />
        </div>
      )}

      {showUpgradeModal && (
        <PlanUpgradeModal 
          merchant={merchant} 
          onClose={() => setShowUpgradeModal(false)} 
          onUpdate={onUpdate}
        />
      )}
      <>
        {(merchant.type === 'boutique' || !merchant.type) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <StatCard title="La Somme Totale du Stock" value={stats.totalStockValue} currency={merchant.currency} icon={Package} color="text-indigo-600" bgColor="bg-indigo-50" description="Valeur estimée à la vente" isLarge={true} />
            <StatCard title="Bénéfice Total du Stock" value={stats.totalStockProfit} currency={merchant.currency} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" description="Bénéfice estimé sur le stock actuel" isLarge={true} />
          </div>
        )}
          
        {(merchant.type === 'boutique' || !merchant.type || merchant.type === 'pressing') && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-violet-600 font-bold">
              <Calendar className="w-5 h-5 text-violet-600" />
              <span>Période des statistiques de vente</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="month"
                value={dashboardSelectedMonth}
                onChange={(e) => setDashboardSelectedMonth(e.target.value)}
                className="relative pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer font-medium text-slate-700 bg-slate-50 hover:bg-white transition-all text-sm outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10 z-0"
                max={new Date().toISOString().slice(0, 7)}
              />
              <Calendar className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none z-0" />
            </div>
          </div>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${(merchant.type === 'boutique' || !merchant.type) ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-4'}`}>

        {merchant.type === 'boutique' || !merchant.type ? (
          <>
            <StatCard title="Chiffre d'Affaires" value={stats.revenue.month} currency={merchant.currency} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" description={dashboardSelectedMonth === new Date().toISOString().slice(0, 7) ? "Ce mois-ci" : `Pour ${format(new Date(dashboardSelectedMonth + '-01'), 'MMMM yyyy', { locale: fr })}`} />
            <StatCard title="Flux de Trésorerie" value={stats.cashFlowMonth} currency={merchant.currency} icon={Banknote} color={stats.cashFlowMonth >= 0 ? "text-indigo-600" : "text-rose-600"} bgColor={stats.cashFlowMonth >= 0 ? "bg-indigo-50" : "bg-rose-50"} description="Entrées - Sorties" />
            <StatCard title="Dépenses Opérationnelles" value={stats.expenses.month} currency={merchant.currency} icon={TrendingDown} color="text-red-600" bgColor="bg-red-50" description={dashboardSelectedMonth === new Date().toISOString().slice(0, 7) ? "Ce mois-ci" : `Pour ${format(new Date(dashboardSelectedMonth + '-01'), 'MMMM yyyy', { locale: fr })}`} />
            <StatCard title="Bénéfice Net" value={stats.netProfitMonth} currency={merchant.currency} icon={DollarSign} color="text-purple-600" bgColor="bg-purple-50" description={dashboardSelectedMonth === new Date().toISOString().slice(0, 7) ? "Ce mois-ci" : `Pour ${format(new Date(dashboardSelectedMonth + '-01'), 'MMMM yyyy', { locale: fr })}`} />
            <StatCard title="Volume des Ventes" value={stats.totalSalesCountMonth} icon={CreditCard} color="text-blue-600" bgColor="bg-blue-50" description={dashboardSelectedMonth === new Date().toISOString().slice(0, 7) ? "Transactions réalisées ce mois" : "Transactions sur la période"} />
            <StatCard title="Panier Moyen" value={stats.averageOrderValueMonth} currency={merchant.currency} icon={ShoppingCart} color="text-teal-600" bgColor="bg-teal-50" description="Valeur moyenne par achat" />
            <StatCard title="Bénéfice de Vente" value={stats.grossProfitMonth} currency={merchant.currency} icon={BarChart3} color="text-cyan-600" bgColor="bg-cyan-50" description="Marge brute globale sur la période" />
            <StatCard title="Alertes Stock" value={stats.lowStockCount} icon={AlertCircle} color={stats.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"} bgColor={stats.lowStockCount > 0 ? "bg-amber-50" : "bg-emerald-50"} description={`${stats.totalProducts} produits au total`} />
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
            {merchant.type === 'pressing' && (
              <>
                <StatCard 
                  title="Recettes Pressing" 
                  value={pressingDashboardStats?.totalTicketsAmount || 0} 
                  currency={merchant.currency} 
                  icon={ClipboardList} 
                  color="text-indigo-600" 
                  bgColor="bg-indigo-50" 
                  description={`${pressingDashboardStats?.ticketsCount || 0} fiches de dépôts`} 
                  profitDetails={{ value: (pressingDashboardStats?.totalTicketsAmount || 0) - (pressingDashboardStats?.totalTicketsCost || 0) }}
                />
                <StatCard 
                  title="Ventes Produits" 
                  value={pressingDashboardStats?.totalProductsAmount || 0} 
                  currency={merchant.currency} 
                  icon={Package} 
                  color="text-emerald-600" 
                  bgColor="bg-emerald-50" 
                  description={`${pressingDashboardStats?.salesCount || 0} ventes détergents`} 
                  profitDetails={{ value: (pressingDashboardStats?.totalProductsAmount || 0) - (pressingDashboardStats?.totalProductsCost || 0) }}
                />
              </>
            )}
            {merchant.type === 'tailleur' && (
              <>
                <StatCard 
                  title="Commandes Couture" 
                  value={tailleurDashboardStats?.totalOrdersAmount || 0} 
                  currency={merchant.currency} 
                  icon={Scissors} 
                  color="text-violet-600" 
                  bgColor="bg-violet-50" 
                  description={`${tailleurDashboardStats?.ordersCount || 0} fiches de mesures`} 
                />
                <StatCard 
                  title="Total Acomptes" 
                  value={tailleurDashboardStats?.totalAdvances || 0} 
                  currency={merchant.currency} 
                  icon={CreditCard} 
                  color="text-emerald-600" 
                  bgColor="bg-emerald-50" 
                  description={`${tailleurDashboardStats?.totalPaid || 0} commandes livrées`} 
                />
              </>
            )}
            <StatCard title="Dépenses" value={stats.expenses.total} currency={merchant.currency} icon={BarChart3} color="text-red-600" bgColor="bg-red-50" description="Total cumulé" />
            <StatCard title="Bénéfice Net" value={stats.netProfit} currency={merchant.currency} icon={DollarSign} color="text-purple-600" bgColor="bg-purple-50" description="Total cumulé" />
          </>
        )}
      </div>

      {/* Stock Health Summary (for Inventory based businesses) */}
      {(merchant.type === 'boutique' || merchant.type === 'chantier' || !merchant.type) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-ink">Alertes de Stock</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Articles nécessitant une attention</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black rounded-lg border border-rose-100">{stats.lowStockCount} ALERTES</span>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length === 0 ? (
                <div className="py-12 text-center opacity-30 flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 mb-3 text-emerald-500" />
                  <p className="text-xs font-black uppercase tracking-widest">Tout est en ordre</p>
                </div>
              ) : (
                products
                  .filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5))
                  .sort((a, b) => Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0))
                  .slice(0, 5)
                  .map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-black/5 shrink-0 overflow-hidden">
                          {product.image ? (
                            <OptimizedImage src={product.image} alt={product.name} width={100} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest">MIN: {product.minStockLevel || 5}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black font-mono ${Number(product.stockQuantity || 0) <= 0 ? 'text-rose-600' : 'text-orange-500'}`}>
                          {product.stockQuantity || 0} UNITÉS
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{Number(product.stockQuantity || 0) <= 0 ? 'RUPTURE' : 'STOCK BAS'}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
            {products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length > 5 && (
              <p className="text-center text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest">
                + {products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length - 5} autres alertes
              </p>
            )}
          </div>

          <div className="bg-ink p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <PieChart className="w-48 h-48 text-white" />
            </div>
            <div className="relative h-full flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Valorisation Globale</h3>
              <p className="text-white/50 text-[11px] leading-relaxed mb-8 uppercase tracking-widest font-black">
                Répartition financière de vos actifs
              </p>
              
              <div className="mt-auto space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Valeur Marchande</span>
                    <span className="text-2xl font-black text-white">
                      {products.reduce((acc, p) => acc + (p.price * Number(p.stockQuantity || 0)), 0).toLocaleString()} <span className="text-xs font-mono opacity-50">{merchant.currency}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/30 uppercase font-black mb-1 tracking-widest">Rentabilité Est.</p>
                    <p className="text-lg font-black text-emerald-400">+24.5%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/30 uppercase font-black mb-1 tracking-widest">Rotation Moy.</p>
                    <p className="text-lg font-black text-blue-400">12 Jours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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

        {/* Accounting & Activity */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Résumé Comptable</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Revenu (Mois)</span>
                <span className="text-lg font-black text-emerald-600">
                  {stats.revenue.month.toLocaleString()} {merchant.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Dépenses (Mois)</span>
                <span className="text-lg font-black text-rose-600">
                  {stats.expenses.month.toLocaleString()} {merchant.currency}
                </span>
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Marge Nette (Total)</span>
                <span className={`text-xl font-black ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.netProfit.toLocaleString()} {merchant.currency}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Activité Récente</h3>
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
            </div>
            <GlobalActivityFeed merchantId={merchant.id} limit={5} />
          </div>
        </div>
      </div>

      {merchant.type === 'pressing' ? (
        <div className="space-y-8">
          {/* 1. Récapitulatif Général de l'Activité (General Summary Card/Grid) */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-ink">📊 Récapitulatif Général</h3>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Bilan d'activité Pressing & Ventes de produits
                </p>
              </div>
              <div className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl">
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  MODE HYBRIDE ACTIF
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pressing Activity Column */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">🧺 Prestations Pressing</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-ink">{(pressingDashboardStats?.totalTicketsAmount || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-mono font-bold text-gray-400">{merchant.currency || 'FCFA'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 font-medium">Nombre de fiches : <strong>{pressingDashboardStats?.ticketsCount}</strong></p>
                </div>
                <div className="border-t border-slate-200/50 mt-4 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Montant encaissé :</span>
                    <span className="font-mono">{(pressingDashboardStats?.totalTicketsPaid || 0).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-500 font-semibold">
                    <span>Reste à payer :</span>
                    <span className="font-mono">{(pressingDashboardStats?.totalTicketsDue || 0).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-bold mt-1.5 pt-1.5 border-t border-slate-200/50">
                    <span>Marge Nette (Encaissé) :</span>
                    <span className="font-mono">{((pressingDashboardStats?.totalTicketsPaid || 0) - (pressingDashboardStats?.totalTicketsCost || 0)).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                  </div>
                </div>
              </div>

              {/* Product Sales Column */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">🛒 Vente de Produits</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-ink">{(pressingDashboardStats?.totalProductsAmount || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-mono font-bold text-gray-400">{merchant.currency || 'FCFA'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 font-medium">Nombre de ventes : <strong>{pressingDashboardStats?.salesCount}</strong></p>
                </div>
                <div className="border-t border-slate-200/50 mt-4 pt-3 space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between items-center">
                    <span>Boutique détergents :</span>
                    <span className="font-semibold text-slate-700 font-mono">{(pressingDashboardStats?.totalProductsAmount || 0).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Encaissé Direct :</span>
                    <span>100%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-bold mt-1.5 pt-1.5 border-t border-slate-200/50">
                    <span>Marge Nette (Encaissé) :</span>
                    <span className="font-mono">{((pressingDashboardStats?.totalProductsAmount || 0) - (pressingDashboardStats?.totalProductsCost || 0)).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                  </div>
                </div>
              </div>

              {/* Financial Summary Column */}
              <div className="bg-primary/[0.02] border border-primary/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest block mb-1">💰 Recettes Globales</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-primary">{(pressingDashboardStats?.totalRevenue || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-mono font-bold text-primary">{merchant.currency || 'FCFA'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 font-medium">Somme cumulée estimée (Services + Ventes)</p>
                </div>
                <div className="border-t border-primary/10 mt-4 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-indigo-600 font-semibold">
                    <span>Total Encaissé Réel :</span>
                    <span className="font-mono">{(pressingDashboardStats?.totalEncashed || 0).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-bold">
                    <span>Marge Nette (Encaissé) :</span>
                    <span className="font-mono">{((pressingDashboardStats?.totalEncashed || 0) - (pressingDashboardStats?.totalCost || 0) - stats.expenses.total).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 2. Tableau distinct : Informations Pressing (Dépôts / Tickets) */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-ink">🧺 Suivi des Prestations Pressing</h3>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mt-1">Dernières fiches de réception client</p>
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100">
                  {pressingTickets.length} DÉPÔTS
                </span>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {pressingTickets.length === 0 ? (
                  <div className="py-12 text-center opacity-30 flex flex-col items-center justify-center">
                    <ClipboardList className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-xs font-black uppercase tracking-widest">Aucune fiche enregistrée</p>
                  </div>
                ) : (
                  [...pressingTickets].slice(0, 15).map((ticket: PressingTicket) => (
                    <div key={ticket.id} className="p-4 bg-gray-50 hover:bg-white border border-gray-100/70 hover:border-gray-200 transition-all rounded-2xl flex flex-col sm:flex-row justify-between items-baseline sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center font-mono font-black text-xs text-primary shrink-0">
                          #{ticket.ticketNumber}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 truncate">{ticket.clientName}</p>
                          <p className="text-[9px] font-mono text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                            Dépôt: {format(new Date(ticket.depositDate), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          ticket.paymentStatus === 'paid' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : (ticket.paymentStatus === 'partial' && (ticket.amountPaid || 0) > 0)
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {ticket.paymentStatus === 'paid' ? 'Payé' : (ticket.paymentStatus === 'partial' && (ticket.amountPaid || 0) > 0) ? 'Acompte' : 'Impayé'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          ticket.status === 'delivered' 
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                            : ticket.status === 'ready'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse'
                              : ticket.status === 'in_progress'
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {ticket.status === 'delivered' ? 'Livré' : ticket.status === 'ready' ? 'Prêt' : ticket.status === 'in_progress' ? 'Encours' : 'Déposé'}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs font-mono font-black text-ink">{ticket.total.toLocaleString()} {merchant.currency || 'FCFA'}</p>
                        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">{ticket.billingType === 'article' ? 'Unitaire' : 'Par Kg'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Tableau distinct : Ventes de Produits (Boutique détergents) */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-ink">🛒 Vente de Produits Directe</h3>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mt-1">Détails des ventes boutique détergents</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                  {pressingProductSales.length} VENTES
                </span>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {pressingProductSales.length === 0 ? (
                  <div className="py-12 text-center opacity-30 flex flex-col items-center justify-center">
                    <Package className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-xs font-black uppercase tracking-widest">Aucune vente enregistrée</p>
                  </div>
                ) : (
                  [...pressingProductSales].slice(0, 15).map((sale: any) => (
                    <div key={sale.id} className="p-4 bg-gray-50 hover:bg-white border border-gray-100/70 hover:border-gray-200 transition-all rounded-2xl flex flex-col sm:flex-row justify-between items-baseline sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center font-mono font-bold text-xs text-emerald-600 shrink-0">
                          SL
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 truncate">{sale.customerName || 'Client de Passage'}</p>
                          <p className="text-[9px] font-mono text-gray-400 font-bold uppercase mt-0.5">
                            {format(new Date(sale.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>

                      <div className="max-w-[150px] truncate block text-[9px] font-mono font-bold text-gray-500 bg-white border border-gray-100 px-2.5 py-1 rounded-lg">
                        {sale.items?.map((it: any) => `${it.productName} (x${it.quantity})`).join(', ') || 'Produits divers'}
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs font-mono font-black text-emerald-600">+{sale.total.toLocaleString()} {merchant.currency || 'FCFA'}</p>
                        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5 font-bold">Payé</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
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
                  <div key={tx.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 hover:bg-gray-50/50 rounded-[1.5rem] transition-all border border-transparent hover:border-gray-100 group gap-4">
                    <div className="flex items-center space-x-4 md:space-x-5 flex-1 min-w-0 w-full sm:w-auto">
                      <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${
                        tx.type === 'sale' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {tx.type === 'sale' ? <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-ink text-sm md:text-base leading-tight truncate">
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
                        <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mt-1 truncate">
                          {format(new Date(tx.date), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto shrink-0 pl-16 sm:pl-0 mt-2 sm:mt-0 min-w-0">
                      <p className={`font-mono font-black text-base truncate ${tx.type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'sale' ? '+' : '-'}{tx.type === 'sale' ? tx.totalAmount.toLocaleString() : tx.amount.toLocaleString()} 
                        <span className="text-[10px] ml-1 opacity-60">{merchant.currency}</span>
                      </p>
                      <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1 truncate">
                        {tx.paymentMethod || tx.category || 'Général'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dynamic Alerts / Quick View */}
          <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
            {merchant.type === 'scolaire' ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-ink">Dernières Inscriptions</h3>
                    <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Suivi des effectifs de l'établissement</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                    {students.length.toString().padStart(3, '0')} ÉLÈVES
                  </span>
                </div>
                <div className="space-y-4">
                  {students.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <GraduationCap className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">Aucun élève inscrit</p>
                    </div>
                  ) : (
                    students.slice(0, 5).map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-[1.25rem] border border-gray-100 hover:bg-white hover:shadow-lg transition-all group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-black text-ink text-sm leading-tight">{student.name}</p>
                            <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Classe: {student.class || student.grade || student.class_id || student.classId || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-black text-gray-400 uppercase">{student.enrollmentDate}</span>
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
            ) : merchant.type === 'tailleur' ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-ink">Dernières Commandes Couture</h3>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Avancement des conceptions en atelier</p>
                  </div>
                  <span className="px-4 py-1.5 bg-violet-150 text-violet-600 text-[10px] font-black rounded-full border border-violet-100 shadow-sm">
                    {tailleurOrders.length.toString().padStart(2, '0')} FICHES
                  </span>
                </div>
                <div className="space-y-4">
                  {tailleurOrders.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-[2rem] border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-black/5">
                        <Scissors className="w-10 h-10 text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Aucune commande en attente</p>
                    </div>
                  ) : (
                    tailleurOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-black/5 hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex items-center space-x-5">
                          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-150 group-hover:scale-110 transition-transform">
                            <Scissors className="w-7 h-7 text-violet-600" />
                          </div>
                          <div>
                            <p className="font-black text-base text-ink leading-tight">{order.clientName}</p>
                            <p className="text-[10px] font-mono text-gray-450 mt-0.5">{order.description || order.model} — {Number(order.price).toLocaleString()} {merchant.currency}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                          order.status === 'livre' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          order.status === 'pret' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          order.status === 'retouche' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                          order.status === 'coupe' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {order.status === 'livre' ? 'LIVRÉ' :
                           order.status === 'pret' ? 'PRÊT / ESSAYAGE' :
                           order.status === 'retouche' ? 'RETOUCHE' :
                           order.status === 'coupe' ? 'COUPE & COUTURE' :
                           'PRISE MESURES'}
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
                    <h3 className="text-xl font-black text-ink">Articles en Rupture</h3>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Stock actuellement épuisé</p>
                  </div>
                  <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 shadow-sm">
                    {products.filter(p => Number(p.stockQuantity || 0) <= 0).length.toString().padStart(2, '0')} RUPTURES
                  </span>
                </div>
                <div className="space-y-4">
                  {products.filter(p => Number(p.stockQuantity || 0) <= 0).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-emerald-50/30 rounded-[2rem] border border-dashed border-emerald-200">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      </div>
                      <p className="text-emerald-600 font-black uppercase tracking-widest">Aucune Rupture !</p>
                      <p className="text-xs text-emerald-500/60 mt-2 font-mono font-bold">Stocks disponibles</p>
                    </div>
                  ) : (
                    products.filter(p => Number(p.stockQuantity || 0) <= 0).slice(0, 5).map((product) => (
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
                                STOCK: {product.stockQuantity || 0}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                                MIN: {product.minStockLevel || 5}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-sm mb-3 uppercase tracking-[0.2em]">
                            ÉPUISÉ
                          </span>
                          {setActiveTab && (
                            <button 
                              onClick={() => setActiveTab('inventory')} 
                              className="text-[10px] font-black text-primary hover:text-primary-hover uppercase tracking-[0.2em] transition-colors whitespace-nowrap"
                            >
                              Réapprovisionner
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </>
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

const StatCard = ({ title, value, currency, icon: Icon, color, bgColor, description, isLarge, profitDetails }: any) => {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : String(value || '0');
  const textLength = formattedValue.length + (currency ? currency.length : 0);
  
  // Decide responsive style based on content density and card layout size
  let fontSizeClass = 'text-3xl sm:text-4xl';
  if (isLarge) {
    if (textLength > 18) {
      fontSizeClass = 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
    } else if (textLength > 14) {
      fontSizeClass = 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
    } else {
      fontSizeClass = 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
    }
  } else {
    if (textLength > 16) {
      fontSizeClass = 'text-sm sm:text-base md:text-lg lg:text-base min-[1400px]:text-lg';
    } else if (textLength > 12) {
      fontSizeClass = 'text-lg sm:text-xl md:text-2xl lg:text-xl min-[1400px]:text-2xl';
    } else if (textLength > 9) {
      fontSizeClass = 'text-xl sm:text-2xl md:text-3xl lg:text-2xl min-[1400px]:text-3xl';
    }
  }

  return (
    <div className={`bg-white p-6 sm:p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full ${isLarge ? 'min-h-[200px] sm:min-h-[260px]' : 'min-h-[220px]'}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
      
      <div>
        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform relative z-10 border border-black/5`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${color}`} />
        </div>
        <p className="text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-[0.2em] relative z-10 line-clamp-1">{title}</p>
      </div>

      <div className="mt-auto relative z-10">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 items-end">
          <span className={`${fontSizeClass} font-black text-ink tracking-tighter block break-all leading-none`}>
            {formattedValue}
          </span>
          {currency && (
            <span className={`${isLarge ? 'text-xs sm:text-sm md:text-base' : 'text-[10px] sm:text-xs'} font-black text-gray-400 uppercase tracking-widest break-keep`}>
              {currency}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[9px] sm:text-[10px] text-gray-400 mt-3 font-mono font-bold uppercase tracking-widest relative z-10 line-clamp-2">
            {description}
          </p>
        )}
        {profitDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-gray-500 uppercase tracking-widest">{profitDetails.label || 'Bénéfice Net'}</span>
            <span className={`${profitDetails.value >= 0 ? 'text-primary' : 'text-rose-500'} font-mono`}>
              {profitDetails.value >= 0 ? '+' : ''}{profitDetails.value.toLocaleString()} {currency}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Inventory Manager ---
// --- Inventory Sub-components ---
export const StockStatCard = ({ label, value, suffix, icon: Icon, color, warning, danger }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg bg-white ${warning ? 'ring-2 ring-orange-200' : danger ? 'ring-2 ring-rose-200 animate-pulse' : 'border-black/5'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color] || 'bg-gray-50'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {(warning || danger) && (
          <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${warning ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
            {warning ? 'Alerte' : 'Critique'}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">{label}</h4>
        <div className="flex items-baseline mt-1">
          <span className="text-2xl font-black text-ink">{value}</span>
          <span className="text-[9px] font-mono font-bold text-gray-400 ml-1.5 uppercase">{suffix}</span>
        </div>
      </div>
    </div>
  );
};

export const HealthIndicator = ({ label, value, color }: { label: string, value: string, color: string }) => {
  const colors: any = {
    primary: 'bg-primary',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/60 uppercase font-black tracking-widest">{label}</span>
        <span className="text-[10px] text-white font-mono font-black">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${colors[color] || 'bg-white'}`}
        />
      </div>
    </div>
  );
};
