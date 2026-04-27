import { useLiveQuery } from 'dexie-react-hooks';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { db } from '../db/db';
import { syncService } from '../services/syncService';
import { Order, OrderStatus, UserProfile, Service, Expense, SiteSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, TrendingUp, TrendingDown, CheckCircle, Clock, MoreVertical, Filter, LayoutGrid, FileText, Database, Settings, Loader2, MessageSquare, User, Eye, Calculator, ArrowRight, Receipt, CreditCard, Smartphone, Banknote, Download, AlertTriangle, BarChart3, Bell, Printer, X, Tag, FileQuestion, Palette, Mail, Cloud, Store, Layout, Link as LinkIcon } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, startOfYear, eachMonthOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { toast } from 'react-hot-toast';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import { getOrderDiscountedTotal } from '../lib/promotions';
import { getImageUrl } from '../lib/imageUtils';
import ServiceManager from '../components/admin/ServiceManager';
import BlogManager from '../components/admin/BlogManager';
import SettingsManager from '../components/admin/SettingsManager';
import PortfolioManager from '../components/admin/PortfolioManager';
import MessageManager from '../components/admin/MessageManager';
import UserManager from '../components/admin/UserManager';
import DesignRequestManager from '../components/admin/DesignRequestManager';
import { ExpenseManager } from '../components/admin/ExpenseManager';
import StudioAcomManager from '../components/admin/StudioAcomManager';
import { PlatformAIInsights } from '../components/admin/PlatformAIInsights';
import { ConfirmModal } from '../components/admin/ConfirmModal';
import { AcomSaaSManager } from '../components/admin/AcomSaaSManager';
import { AcomSaaSSettings } from '../components/admin/AcomSaaSSettings';
import { storageService } from '../services/storageService';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { notificationService } from '../services/notificationService';
import { GlobalActivityFeed } from '../components/GlobalActivityFeed';
import { DailyBriefing } from '../components/DailyBriefing';
import { automationService } from '../services/automationService';
import { PrintingManager } from '../components/admin/PrintingManager';
import { BusinessInsights } from '../components/admin/BusinessInsights';
import { AdminChat } from '../components/admin/AdminChat';
import { PartnerMessageManager } from '../components/admin/PartnerMessageManager';

type Tab = 'overview' | 'orders' | 'users' | 'services' | 'portfolio' | 'blog' | 'settings' | 'messages' | 'partner_messages' | 'pos' | 'expenses' | 'design' | 'design_requests' | 'studio_acom' | 'printing' | 'saas_subscriptions' | 'saas_appearance';

// import { isSupabaseConfigured } from '../lib/supabase';

const AdminDashboard = () => {
  const { user, profile, isAdmin, isManager, isSuperAdmin, syncCustomClaims, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = (searchParams.get('tab') as Tab) || (user?.email === 'contact.acomtechnologie@gmail.com' ? 'services' : 'overview');
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForSummary, setSelectedOrderForSummary] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [isFixingImages, setIsFixingImages] = useState(false);
  const [showFixConfirm, setShowFixConfirm] = useState(false);

  const [isSyncingPermissions, setIsSyncingPermissions] = useState(false);

  const handleSyncPermissions = async () => {
    setIsSyncingPermissions(true);
    const toastId = toast.loading('Synchronisation des permissions...');
    try {
      await syncCustomClaims();
      toast.success('Permissions synchronisées avec succès !', { id: toastId });
    } catch (error) {
      console.error('Error syncing permissions:', error);
      toast.error('Erreur lors de la synchronisation.', { id: toastId });
    } finally {
      setIsSyncingPermissions(false);
    }
  };

  const handleFixImages = async () => {
    setShowFixConfirm(false);
    setIsFixingImages(true);
    const toastId = toast.loading('Synchronisation et migration des images...');

    try {
      const { storageService } = await import('../services/storageService');
      
      // Force sync before fixing to ensure Dexie is up to date
      if (user?.uid) {
        toast.loading('Synchronisation des données...', { id: toastId });
        await Promise.all([
          syncService.syncServices(user.uid)
        ]);
      }

      // 1. Fetch all data
      const services = await db.services.toArray();
      const categories = await db.categories.toArray() as any[];
      const products = await db.products.toArray() as any[];

      let fixedCount = 0;
      toast.loading(`Vérification de ${services.length} services, ${categories.length} catégories et ${products.length} produits...`, { id: toastId });

      // 1. Fix Services
      console.log(`Checking ${services.length} services for base64 images...`);
      for (const service of services) {
        const img = getImageUrl(service);
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          try {
            const url = await storageService.uploadFile('services', `main/${service.id}.jpg`, img);
            await dbService.services.save({ ...service, image: url });
            await db.services.update(service.id, { image: url });
            fixedCount++;
          } catch (e) { console.error('Error fixing service image:', e); }
        }
      }

      // 2. Fix Studio ACOM Categories
      console.log(`Checking ${categories.length} categories for base64 images...`);
      for (const cat of categories) {
        const img = getImageUrl(cat);
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          try {
            const url = await storageService.uploadFile('studio-acom', `categories/${cat.id}.jpg`, img);
            const updatedCat = { ...cat, coverImage: url, cover_image: url };
            await dbService.studioAcom.categories.save(updatedCat);
            await db.categories.put(updatedCat);
            fixedCount++;
          } catch (e) { console.error('Error fixing category image:', e); }
        }
      }

      // 3. Fix Studio ACOM Products
      console.log(`Checking ${products.length} products for base64 images...`);
      for (const prod of products) {
        const img = getImageUrl(prod);
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          try {
            const url = await storageService.uploadFile('studio-acom', `products/${prod.id}.jpg`, img);
            const updatedProd = { ...prod, coverImage: url, cover_image: url, image: url };
            await dbService.studioAcom.products.save(updatedProd);
            await db.products.put(updatedProd);
            fixedCount++;
          } catch (e) { console.error('Error fixing product image:', e); }
        }
      }

      if (fixedCount > 0) {
        toast.success(`${fixedCount} images ont été migrées avec succès !`, { id: toastId });
      } else {
        toast.success(`Toutes les images sont déjà optimisées (0 migration nécessaire).`, { id: toastId });
      }
    } catch (error: any) {
      console.error('Error fixing images:', error);
      toast.error(`Erreur lors de la migration : ${error.message}`, { id: toastId });
    } finally {
      setIsFixingImages(false);
    }
  };

  const handleMarkAsPaid = async (order: Order) => {
    setIsProcessingPayment(order.id);
    try {
      const newPayment = {
        id: Math.random().toString(36).substr(2, 9),
        amount: getOrderDiscountedTotal(order),
        method: 'cash' as const,
        type: 'full' as const,
        paidAt: new Date(),
        transactionId: 'MANUAL_ADMIN_' + Date.now()
      };

      const newOrderState = {
        id: order.id,
        paid: true,
        depositPaid: true,
        balancePaid: true,
        paidAt: new Date(),
        status: 'delivered' as const,
        updatedAt: new Date(),
        payments: [...(order.payments || []), newPayment]
      };

      await dbService.orders.save(newOrderState);
      
      toast.success("Commande marquée comme payée !");
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Erreur lors de la mise à jour du statut de paiement.");
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleGeneratePayDunyaLink = async (order: Order, type: 'deposit' | 'balance' | 'full' = 'full') => {
    setIsProcessingPayment(order.id);
    try {
      const total = getOrderDiscountedTotal(order);
      const amount = type === 'full' ? total : total * 0.5;
      const description = type === 'deposit' 
        ? `Acompte (50%) - Commande #${order.id}` 
        : type === 'balance' 
          ? `Solde (50%) - Commande #${order.id}` 
          : `Total - Commande #${order.id}`;

      const { payDunyaService } = await import('../services/payDunyaService');
      const link = await payDunyaService.createPaymentLink({
        amount,
        description,
        orderId: order.id,
        returnUrl: `${window.location.origin}/order-details/${order.id}?payment_success=true&payment_type=${type}`,
        cancelUrl: `${window.location.origin}/order-details/${order.id}`
      });

      navigator.clipboard.writeText(link);
      toast.success(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-bold">Lien PayDunya copié !</span>
            <p className="text-xs">Envoyez-le à votre client pour recouvrement.</p>
            <div className="flex gap-2">
              <a href={link} target="_blank" rel="noreferrer" className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all" onClick={() => toast.dismiss(t.id)}>
                Vérifier le lien
              </a>
            </div>
          </div>
        ),
        { duration: 10000 }
      );
    } catch (error: any) {
      toast.error(error.message || "Erreur PayDunya");
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handlePayBalance = async (order: Order) => {
    setIsProcessingPayment(order.id);
    try {
      const total = getOrderDiscountedTotal(order);
      const balanceAmount = total * 0.5;
      
      const newPayment = {
        id: Math.random().toString(36).substr(2, 9),
        amount: balanceAmount,
        method: 'cash' as const,
        type: 'balance' as const,
        paidAt: new Date(),
        transactionId: 'MANUAL_BALANCE_ADMIN_' + Date.now()
      };

      const newOrderState = {
        id: order.id,
        paid: true,
        balancePaid: true,
        balanceAmount: balanceAmount,
        balancePaidAt: new Date(),
        status: 'delivered' as const,
        updatedAt: new Date(),
        payments: [...(order.payments || []), newPayment]
      };

      await dbService.orders.save(newOrderState);

      toast.success("Reliquat marqué comme payé !");
    } catch (error) {
      console.error("Error paying balance:", error);
      toast.error("Erreur lors de la mise à jour du paiement du reliquat.");
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const FinancialSummaryModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
    const service = dynamicServices?.find(s => s.id === order.serviceId) || STATIC_SERVICES.find(s => s.id === order.serviceId);
    const total = getOrderDiscountedTotal(order);
    const deposit = order.depositAmount || (total * 0.5);
    const balance = total - (order.depositPaid ? deposit : 0);

    const formatPaymentDate = (date: any) => {
      if (!date) return 'N/A';
      try {
        const d = date.toDate ? date.toDate() : new Date(date);
        return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
      } catch (e) {
        return 'N/A';
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900">Résumé Financier</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Commande #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 sm:p-3 hover:bg-white rounded-xl sm:rounded-2xl transition-all shadow-sm border border-gray-200"
            >
              <X className="w-5 h-5 sm:w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
            {/* Client & Service Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-10">
              <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 sm:mb-3 block">Client</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 sm:w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{order.details?.fullName || 'Client'}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{order.details?.email || 'Pas d\'email'}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 sm:mb-3 block">Service</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 h-10 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 sm:w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{service?.name || order.details?.projectType || 'Service personnalisé'}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{service?.category || 'Divers'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-gray-400 px-2">Détails de la Facture</h3>
              <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-gray-500 font-medium">Montant de base</span>
                    <span className="font-bold text-gray-900">{(order.totalPrice || 0).toLocaleString()} FCFA</span>
                  </div>
                  {order.discountPercentage && (
                    <div className="flex justify-between items-center text-sm sm:text-base text-emerald-600">
                      <span className="font-medium">Remise ({order.discountPercentage}%)</span>
                      <span className="font-bold">-{((order.totalPrice * order.discountPercentage) / 100).toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-100 my-1 sm:my-2" />
                  <div className="flex justify-between items-center text-base sm:text-lg">
                    <span className="font-display font-bold text-gray-900">Total Net</span>
                    <span className="font-display font-black text-primary">{total.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
              <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${order.depositPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${order.depositPaid ? 'text-emerald-600' : 'text-amber-600'}`}>Acompte (50%)</span>
                  {order.depositPaid ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900">{(total * 0.5).toLocaleString()} FCFA</p>
                <p className={`text-[10px] sm:text-xs mt-2 font-bold ${order.depositPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {order.depositPaid ? `Payé le ${formatPaymentDate(order.depositPaidAt || order.paidAt)}` : 'En attente'}
                </p>
              </div>
              <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${order.balancePaid ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${order.balancePaid ? 'text-emerald-600' : 'text-gray-400'}`}>Reliquat (50%)</span>
                  {order.balancePaid ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900">{(total * 0.5).toLocaleString()} FCFA</p>
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-[10px] sm:text-xs font-bold ${order.balancePaid ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {order.balancePaid ? `Payé le ${formatPaymentDate(order.balancePaidAt || order.paidAt)}` : 'Non payé'}
                  </p>
                  {order.depositPaid && !order.balancePaid && (
                    <button
                      onClick={() => handlePayBalance(order)}
                      disabled={isProcessingPayment === order.id}
                      className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isProcessingPayment === order.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        'Payer le Reliquat'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Payment History */}
            {order.payments && order.payments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-gray-400 px-2">Historique des Paiements</h3>
                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left min-w-[400px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Méthode</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.payments.map((p, i) => (
                        <tr key={i}>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-600">
                            {formatPaymentDate(p.paidAt)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-600 uppercase">
                              {p.method === 'stripe' ? 'Carte' : p.method === 'orange_money' ? 'Orange' : p.method === 'wave' ? 'Wave' : 'Espèces'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs text-gray-500 font-medium">
                            {p.type === 'deposit' ? 'Acompte' : p.type === 'balance' ? 'Reliquat' : 'Total'}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-gray-900 text-right">
                            {p.amount.toLocaleString()} FCFA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-200"
            >
              Fermer
            </button>
            {!order.paid && (
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => handleGeneratePayDunyaLink(order, order.depositPaid ? 'balance' : 'full')}
                  disabled={isProcessingPayment === order.id}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
                >
                  {isProcessingPayment === order.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5 mr-2" />
                      Lien PayDunya
                    </>
                  )}
                </button>

                <button 
                  onClick={() => {
                    handleMarkAsPaid(order);
                    onClose();
                  }}
                  disabled={isProcessingPayment === order.id}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center disabled:opacity-50"
                >
                  {isProcessingPayment === order.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Banknote className="w-5 h-5 mr-2" />
                      Marquer Payé
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');
  const [productFilter, setProductFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'Tous'>('Tous');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab as Tab);
    }
  }, [searchParams]);

  const hasAccess = isAdmin || isManager;
  const isRestrictedAdmin = user?.email === 'contact.acomtechnologie@gmail.com';

  useEffect(() => {
    if (isRestrictedAdmin && (activeTab === 'orders' || activeTab === 'overview')) {
      setActiveTab('services');
    }
  }, [isRestrictedAdmin, activeTab]);

  // Replace manual loading with useLiveQuery
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const dynamicServices = useLiveQuery(() => db.services.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const rawExpenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const expenses = useMemo(() => rawExpenses.map(exp => ({
    ...exp,
    updatedAt: exp.updatedAt || exp.created_at || exp.createdAt || new Date()
  })) as Expense[], [rawExpenses]);
  const settingsData = useLiveQuery(() => db.settings.toArray()) || [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only manage initial loading state for the dashboard overall
    if (orders.length > 0 || dynamicServices.length > 0) {
      setLoading(false);
    }
  }, [orders, dynamicServices]);

  useEffect(() => {
    const backgroundSync = async () => {
        if (user?.uid) {
          const syncTasks = [
            { id: 'orders', task: () => syncService.syncOrders('global') },
            { id: 'services', task: () => syncService.syncServices('global') },
            { id: 'users', task: () => syncService.syncUsers('global') },
            { id: 'expenses', task: () => syncService.syncExpenses('global') },
            { id: 'settings', task: () => syncService.syncSettings('global') }
          ];

          for (const { id, task } of syncTasks) {
            const lastSync = localStorage.getItem(`last_sync_${id}`);
            // 1 hour cooldown for background tasks
            if (lastSync && Date.now() - parseInt(lastSync, 10) < 3600000) {
                console.log(`Skipping background sync for ${id}, too soon.`);
                continue;
            }
            try {
              console.log(`Running background sync for ${id}...`);
              await task();
              localStorage.setItem(`last_sync_${id}`, Date.now().toString());
              await new Promise(resolve => setTimeout(resolve, 500)); 
            } catch (e) {
              console.error(`Sync task ${id} failed`, e);
            }
          }
          
          // Run Proactive Checks
          try {
            await automationService.runProactiveChecks(orders, users);
          } catch(e) {
            console.error("Proactive checks failed", e);
          }
        }
    };
    backgroundSync();
  }, [user?.uid]);

  
  // Point 6: Aggregation - Fetch global stats
  const globalStats = settingsData?.find((s: any) => s.id === 'stats') || {};

  const globalSettings = settingsData?.find((s: any) => s.id === 'global') || {};
  const taxRate = globalSettings.taxRate || 18;
  const cashThreshold = globalSettings.cashThreshold || 50000;

  const handleExportCSV = () => {
    const data = [
      ['Rapport Financier Acom Technologie'],
      [`Periode: ${startDate} au ${endDate}`],
      [''],
      ['--- RESUME TRESORERIE ---'],
      ['Label', 'Valeur', 'Description'],
      ...cashStats.map(s => [s.label, s.value, s.description || '']),
      [''],
      ['--- VENTILATION PAR MODE DE PAIEMENT ---'],
      ['Mode', 'Valeur'],
      ...paymentMethodStats.map(s => [s.label, s.value]),
      [''],
      ['Exporté le:', new Date().toLocaleString()]
    ];

    const csvContent = data.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_financier_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allServices = useMemo(() => {
    const combined = [...STATIC_SERVICES];
    dynamicServices.forEach(ds => {
      if (!combined.find(s => s.id === ds.id)) {
        combined.push(ds);
      }
    });
    return combined;
  }, [dynamicServices]);

  const accountingStats = useMemo(() => {
    if (!isSuperAdmin && !isManager) return null;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = now.toISOString().slice(0, 7);
    const thisYear = now.getFullYear().toString();

    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date && typeof date.toDate === 'function') return date.toDate().toISOString();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000).toISOString();
        if (date._seconds !== undefined) return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'number') return new Date(date).toISOString();
      return '';
    };

    const posOrders = orders.filter(o => o.details?.type === 'pos');
    const onlineOrders = orders.filter(o => o.details?.type !== 'pos');

    const posToday = posOrders.filter(o => getIsoDate(o.createdAt).startsWith(today));
    const posMonth = posOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisMonth));
    const posYear = posOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisYear));

    const onlineToday = onlineOrders.filter(o => getIsoDate(o.createdAt).startsWith(today));
    const onlineMonth = onlineOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisMonth));
    const onlineYear = onlineOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisYear));

    const sum = (list: Order[]) => list.reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0).toLocaleString() + ' FCFA';

    return [
      { label: 'En Ligne (Jour)', value: sum(onlineToday), icon: ShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
      { label: 'En Ligne (Mois)', value: sum(onlineMonth), icon: ShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
      { label: 'En Ligne (Année)', value: sum(onlineYear), icon: ShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
      { label: 'Caisse (Jour)', value: sum(posToday), icon: Calculator, color: 'bg-emerald-100 text-emerald-600' },
      { label: 'Caisse (Mois)', value: sum(posMonth), icon: Calculator, color: 'bg-blue-100 text-blue-600' },
      { label: 'Caisse (Année)', value: sum(posYear), icon: Calculator, color: 'bg-amber-100 text-amber-600' },
    ];
  }, [orders, isSuperAdmin, isManager]);

  const orderStatusStats = useMemo(() => {
    if (!isSuperAdmin && !isManager) return null;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = now.toISOString().slice(0, 7);
    const thisYear = now.getFullYear().toString();

    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date && typeof date.toDate === 'function') return date.toDate().toISOString();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000).toISOString();
        if (date._seconds !== undefined) return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'number') return new Date(date).toISOString();
      return '';
    };

    const posOrders = orders.filter(o => o.details?.type === 'pos');
    const onlineOrders = orders.filter(o => o.details?.type !== 'pos');

    const posToday = posOrders.filter(o => getIsoDate(o.createdAt).startsWith(today));
    const posMonth = posOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisMonth));
    const posYear = posOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisYear));

    const onlineToday = onlineOrders.filter(o => getIsoDate(o.createdAt).startsWith(today));
    const onlineMonth = onlineOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisMonth));
    const onlineYear = onlineOrders.filter(o => getIsoDate(o.createdAt).startsWith(thisYear));

    const getStatusBreakdown = (list: Order[]) => {
      const counts: Record<string, number> = {};
      list.forEach(o => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });
      return counts;
    };

    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      in_progress: 'En cours',
      completed: 'Terminé',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };

    const formatBreakdown = (counts: Record<string, number>) => {
      const entries = Object.entries(counts);
      if (entries.length === 0) return 'Aucune commande';
      return entries.map(([status, count]) => `${count} ${statusLabels[status] || status}`).join(', ');
    };

    return [
      { label: 'En Ligne (Jour)', value: onlineToday.length, breakdown: formatBreakdown(getStatusBreakdown(onlineToday)), icon: ShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
      { label: 'En Ligne (Mois)', value: onlineMonth.length, breakdown: formatBreakdown(getStatusBreakdown(onlineMonth)), icon: ShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
      { label: 'En Ligne (Année)', value: onlineYear.length, breakdown: formatBreakdown(getStatusBreakdown(onlineYear)), icon: ShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
      { label: 'Caisse (Jour)', value: posToday.length, breakdown: formatBreakdown(getStatusBreakdown(posToday)), icon: Calculator, color: 'bg-emerald-100 text-emerald-600' },
      { label: 'Caisse (Mois)', value: posMonth.length, breakdown: formatBreakdown(getStatusBreakdown(posMonth)), icon: Calculator, color: 'bg-blue-100 text-blue-600' },
      { label: 'Caisse (Année)', value: posYear.length, breakdown: formatBreakdown(getStatusBreakdown(posYear)), icon: Calculator, color: 'bg-amber-100 text-amber-600' },
    ];
  }, [orders, isSuperAdmin, isManager]);

  const overviewChartData = useMemo(() => {
    if (!isSuperAdmin && !isManager) return null;

    const now = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    const last12Months = eachMonthOfInterval({
      start: startOfYear(now),
      end: now
    });

    const getIsoDate = (date: any) => {
      if (!date) return null;
      if (typeof date === 'string') return new Date(date);
      if (date && typeof date.toDate === 'function') return date.toDate();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000);
        if (date._seconds !== undefined) return new Date(date._seconds * 1000);
      }
      if (date instanceof Date) return date;
      if (typeof date === 'number') return new Date(date);
      return null;
    };

    const daily = last7Days.map(day => {
      const dayOrders = orders.filter(o => {
        const d = getIsoDate(o.createdAt);
        return d && isSameDay(d, day);
      });

      return {
        name: format(day, 'dd MMM', { locale: fr }),
        online: dayOrders.filter(o => o.details?.type !== 'pos').reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0),
        pos: dayOrders.filter(o => o.details?.type === 'pos').reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0),
      };
    });

    const monthly = last12Months.map(month => {
      const monthOrders = orders.filter(o => {
        const d = getIsoDate(o.createdAt);
        return d && isSameMonth(d, month);
      });

      return {
        name: format(month, 'MMM', { locale: fr }),
        online: monthOrders.filter(o => o.details?.type !== 'pos').reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0),
        pos: monthOrders.filter(o => o.details?.type === 'pos').reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0),
      };
    });

    return { daily, monthly };
  }, [orders, isSuperAdmin, isManager]);

  const totalCustomQuotes = useMemo(() => orders.filter(o => o.details?.isCustomQuote).length, [orders]);

  const stats = [
    { 
      label: 'Total Commandes', 
      value: globalStats.totalOrders || orders.length, 
      icon: ShoppingBag, 
      color: 'bg-primary-light text-primary' 
    },
    { label: 'Devis Personnalisés', value: totalCustomQuotes, icon: FileQuestion, color: 'bg-purple-100 text-purple-600' },
    { label: 'En cours', value: orders.filter(o => o.status === 'in_progress').length, icon: Clock, color: 'bg-blue-100 text-blue-600' },
    { label: 'Livrées', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
    { 
      label: 'Revenu Total Potentiel', 
      value: `${(globalStats.totalRevenue || orders.reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0)).toLocaleString()} FCFA`, 
      icon: TrendingUp, 
      color: 'bg-amber-100 text-amber-600' 
    },
  ];

  const cashStats = useMemo(() => {
    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date && typeof date.toDate === 'function') return date.toDate().toISOString();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000).toISOString();
        if (date._seconds !== undefined) return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'number') return new Date(date).toISOString();
      return '';
    };

    // Extract all payments from orders
    const allPayments = orders.flatMap(o => {
      if (o.payments && o.payments.length > 0) {
        return o.payments.map(p => ({ ...p, orderId: o.id, orderType: o.details?.type }));
      } else if (o.paid) {
        // Fallback for legacy orders
        return [{
          id: o.id,
          amount: getOrderDiscountedTotal(o),
          method: o.paymentMethod || 'cash',
          type: 'full',
          paidAt: o.paidAt || o.createdAt,
          orderId: o.id,
          orderType: o.details?.type
        }];
      }
      return [];
    }).filter(p => {
      const date = getIsoDate(p.paidAt);
      return date >= startOfDay(new Date(startDate)).toISOString() && 
             date <= endOfDay(new Date(endDate)).toISOString();
    });

    const filteredExpenses = expenses.filter(e => {
      const date = getIsoDate(e.date);
      return date >= startOfDay(new Date(startDate)).toISOString() && 
             date <= endOfDay(new Date(endDate)).toISOString();
    });

    const totalAcomptes = allPayments.filter(p => p.type === 'deposit').reduce((acc, p) => acc + p.amount, 0);
    const totalSoldes = allPayments.filter(p => p.type === 'balance').reduce((acc, p) => acc + p.amount, 0);
    const totalComplets = allPayments.filter(p => p.type === 'full').reduce((acc, p) => acc + p.amount, 0);
    
    // Total Réel Encaissé (Sum of all payments in period)
    const totalReel = allPayments.reduce((acc, p) => acc + p.amount, 0);

    const totalOnlinePaid = allPayments.filter(p => p.orderType !== 'pos').reduce((acc, p) => acc + p.amount, 0);
    const totalPosPaid = allPayments.filter(p => p.orderType === 'pos').reduce((acc, p) => acc + p.amount, 0);

    const isBelowThreshold = totalPosPaid < cashThreshold;

    // Expenses
    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const netProfit = totalReel - totalExpenses;

    // Unpaid tracking: Orders with remaining balance
    const unpaidOrders = orders.filter(o => {
      const total = getOrderDiscountedTotal(o);
      const paid = (o.payments || []).reduce((acc, p) => acc + p.amount, 0);
      return total > paid;
    });
    const totalUnpaid = unpaidOrders.reduce((acc, o) => {
      const total = getOrderDiscountedTotal(o);
      const paid = (o.payments || []).reduce((acc, p) => acc + p.amount, 0);
      return acc + (total - paid);
    }, 0);

    const totalTTC = totalReel;
    const totalHT = totalTTC / (1 + (taxRate / 100));
    const totalTVA = totalTTC - totalHT;

    const filteredOrdersByDate = orders.filter(o => {
      const date = getIsoDate(o.createdAt);
      return date >= startOfDay(new Date(startDate)).toISOString() && 
             date <= endOfDay(new Date(endDate)).toISOString();
    });

    const totalNegotiatedDiscounts = filteredOrdersByDate.reduce((acc, o) => acc + (o.couponDiscount || 0), 0);

    return [
      { label: 'Total Acomptes', value: `${totalAcomptes.toLocaleString()} FCFA`, icon: Calculator, color: 'bg-indigo-100 text-indigo-600', description: 'Acomptes encaissés' },
      { label: 'Total Soldes', value: `${totalSoldes.toLocaleString()} FCFA`, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600', description: 'Soldes encaissés' },
      { label: 'Total Encaissé En ligne', value: `${totalOnlinePaid.toLocaleString()} FCFA`, icon: ShoppingBag, color: 'bg-blue-100 text-blue-600', description: 'Via Stripe/Mobile' },
      { 
        label: 'Total Encaissé Caisse', 
        value: `${totalPosPaid.toLocaleString()} FCFA`, 
        icon: isBelowThreshold ? AlertTriangle : Calculator, 
        color: isBelowThreshold ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-600', 
        description: isBelowThreshold ? `ALERTE: Solde < ${cashThreshold.toLocaleString()} FCFA` : 'Encaissé en boutique' 
      },
      { label: 'Total Encaissé Brut', value: `${totalReel.toLocaleString()} FCFA`, icon: TrendingUp, color: 'bg-primary-light text-primary', description: 'Total des entrées' },
      { label: 'Total Dépenses', value: `${totalExpenses.toLocaleString()} FCFA`, icon: Receipt, color: 'bg-red-100 text-red-600', description: 'Toutes les charges' },
      { label: 'Bénéfice Net Réel', value: `${netProfit.toLocaleString()} FCFA`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600', description: 'Encaissé - Dépenses' },
      { label: 'Reste à Encaisser', value: `${totalUnpaid.toLocaleString()} FCFA`, icon: Clock, color: 'bg-amber-100 text-amber-600', description: `${unpaidOrders.length} commandes incomplètes` },
      { label: 'Total HT', value: `${Math.round(totalHT).toLocaleString()} FCFA`, icon: FileText, color: 'bg-gray-100 text-gray-600', description: `Base HT (TVA ${taxRate}%)` },
      { label: 'Total TVA', value: `${Math.round(totalTVA).toLocaleString()} FCFA`, icon: FileText, color: 'bg-gray-100 text-gray-600', description: `TVA collectée (${taxRate}%)` },
      { label: 'Réductions Négociées', value: `${totalNegotiatedDiscounts.toLocaleString()} FCFA`, icon: Tag, color: 'bg-orange-100 text-orange-600', description: 'Remises manuelles' },
    ];
  }, [orders, expenses, taxRate, cashThreshold, startDate, endDate]);

  const paymentMethodStats = useMemo(() => {
    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date && typeof date.toDate === 'function') return date.toDate().toISOString();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000).toISOString();
        if (date._seconds !== undefined) return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'number') return new Date(date).toISOString();
      return '';
    };

    const allPayments = orders.flatMap(o => {
      if (o.payments && o.payments.length > 0) {
        return o.payments.map(p => ({ ...p, orderId: o.id }));
      } else if (o.paid) {
        return [{
          id: o.id,
          amount: getOrderDiscountedTotal(o),
          method: o.paymentMethod || 'cash',
          paidAt: o.paidAt || o.createdAt
        }];
      }
      return [];
    }).filter(p => {
      const date = getIsoDate(p.paidAt);
      return date >= startOfDay(new Date(startDate)).toISOString() && 
             date <= endOfDay(new Date(endDate)).toISOString();
    });
    
    const calculateForMethod = (method: string) => {
      return allPayments
        .filter(p => p.method === method)
        .reduce((acc, p) => acc + p.amount, 0);
    };

    const stripe = calculateForMethod('stripe');
    const stripeTransactions = allPayments.filter(p => p.method === 'stripe').length;
    // Stripe fees: 2.9% + 200 FCFA
    const stripeFees = (stripe * 0.029) + (stripeTransactions * 200);
    const stripeNet = stripe - stripeFees;

    const orangeMoney = calculateForMethod('orange_money');
    const wave = calculateForMethod('wave');
    const cash = calculateForMethod('cash');

    return [
      { 
        label: 'Stripe (Carte)', 
        value: `${stripe.toLocaleString()} FCFA`, 
        icon: CreditCard, 
        color: 'bg-indigo-100 text-indigo-600',
        description: `Net: ${Math.round(stripeNet).toLocaleString()} FCFA`
      },
      { label: 'Orange Money', value: `${orangeMoney.toLocaleString()} FCFA`, icon: Smartphone, color: 'bg-orange-100 text-orange-600' },
      { label: 'Wave', value: `${wave.toLocaleString()} FCFA`, icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
      { label: 'Espèces (Caisse)', value: `${cash.toLocaleString()} FCFA`, icon: Banknote, color: 'bg-emerald-100 text-emerald-600' },
    ];
  }, [orders, startDate, endDate]);

  const transactionHistory = useMemo(() => {
    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date && typeof date.toDate === 'function') return date.toDate().toISOString();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000).toISOString();
        if (date._seconds !== undefined) return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'number') return new Date(date).toISOString();
      return '';
    };

    const orderTransactions: any[] = [];
    orders.forEach(o => {
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach(p => {
          orderTransactions.push({
            id: p.id,
            orderId: o.id,
            date: getIsoDate(p.paidAt),
            type: 'income',
            amount: p.amount,
            method: p.method,
            transactionId: p.transactionId,
            label: `Paiement ${p.type === 'deposit' ? 'Acompte' : p.type === 'balance' ? 'Solde' : 'Complet'} - Commande #${o.id?.slice(-6)} - ${o.details?.fullName || 'Client'}`
          });
        });
      } else if (o.paid) {
        orderTransactions.push({
          id: o.id,
          date: getIsoDate(o.paidAt || o.createdAt),
          type: 'income',
          amount: getOrderDiscountedTotal(o),
          method: o.paymentMethod || 'Inconnu',
          transactionId: o.paymentId,
          label: `Commande #${o.id?.slice(-6)} - ${o.details?.fullName || 'Client'}`
        });
      }
    });

    const expenseTransactions = expenses.map(e => ({
      id: e.id,
      date: getIsoDate(e.date),
      type: 'expense',
      amount: e.amount || 0,
      method: 'Espèces',
      label: `${e.category}: ${e.title}`
    }));

    return [...orderTransactions, ...expenseTransactions]
      .filter(t => t.date >= startOfDay(new Date(startDate)).toISOString() && 
                   t.date <= endOfDay(new Date(endDate)).toISOString())
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, expenses, startDate, endDate]);

  const availableProducts = useMemo(() => {
    let filtered = allServices;
    if (categoryFilter !== 'Tous') {
      filtered = allServices.filter(s => s.category?.toLowerCase() === categoryFilter.toLowerCase());
    }
    return Array.from(new Set(filtered.map(s => s.name))).sort();
  }, [allServices, categoryFilter]);

  const productProfitability = useMemo(() => {
    const paidOrders = orders.filter(o => o.paid);
    
    const stats = allServices.map(service => {
      const serviceOrders = paidOrders.filter(o => o.serviceId === service.id);
      const revenue = serviceOrders.reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0);
      const count = serviceOrders.length;
      
      // Calculate margin if cost is defined
      const totalCost = (service.cost || 0) * count;
      const margin = revenue - totalCost;
      const marginRate = revenue > 0 ? (margin / revenue) * 100 : 0;
      
      return {
        name: service.name,
        revenue,
        count,
        average: count > 0 ? revenue / count : 0,
        margin,
        marginRate,
        hasCost: !!service.cost
      };
    }).filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue);

    return stats;
  }, [orders, allServices]);

  const chartData = useMemo(() => {
    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date && typeof date.toDate === 'function') return date.toDate().toISOString();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000).toISOString();
        if (date._seconds !== undefined) return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'number') return new Date(date).toISOString();
      return '';
    };

    const interval = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    });

    return interval.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      const dayOrders = orders.filter(o => {
        const date = getIsoDate(o.paidAt || o.createdAt);
        return o.paid && date.startsWith(dayStr);
      });

      const dayExpenses = expenses.filter(e => {
        const date = getIsoDate(e.date);
        return date.startsWith(dayStr);
      });

      const revenue = dayOrders.reduce((acc, o) => acc + getOrderDiscountedTotal(o), 0);
      const expense = dayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      return {
        name: format(day, 'dd MMM', { locale: fr }),
        revenue,
        expense,
        profit: revenue - expense
      };
    });
  }, [orders, expenses, startDate, endDate]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    console.log('DEBUG: Updating status to', newStatus, 'for order', orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        console.error('DEBUG: Order not found', orderId);
        return;
      }

      await dbService.orders.save({
        id: orderId,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      console.log('DEBUG: Save status successful');

      // Force a sync to update local cache immediately
      if (user?.uid) {
        console.log('DEBUG: Syncing orders...');
        await syncService.syncOrders(user.uid);
        console.log('DEBUG: Sync successful');
      }

      // Notify client
      const client = users?.find(u => u.uid === order.userId);
      await notificationService.notifyStatusChange(order, newStatus, client);
      
      toast.success(`Statut mis à jour : ${newStatus}`);
    } catch (error) {
      console.error('Update status error:', error);
      let errorMessage = 'Erreur lors de la mise à jour du statut.';
      try {
        const parsedError = JSON.parse(error instanceof Error ? error.message : '');
        if (parsedError.error) {
          errorMessage = `Erreur: ${parsedError.error} (Path: ${parsedError.path})`;
        }
      } catch (e) {}
      toast.error(errorMessage);
    }
  };

  // Early returns must happen AFTER all hooks are defined
  // if (!isSupabaseConfigured) {
  //   return (
  //     <div className="max-w-7xl mx-auto px-4 py-20 text-center">
  //       <div className="bg-amber-50 border border-amber-100 rounded-3xl p-12 inline-block max-w-lg">
  //         <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
  //         <h2 className="text-xl font-bold text-gray-900 mb-2">Configuration requise</h2>
  //         <p className="text-gray-600 mb-8">
  //           Supabase n'est pas encore configuré. Veuillez ajouter <strong>VITE_SUPABASE_URL</strong> et <strong>VITE_SUPABASE_ANON_KEY</strong> dans les paramètres de l'application.
  //         </p>
  //         <Link 
  //           to="/"
  //           className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-all inline-block"
  //         >
  //           Retour à l'accueil
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Vérification des accès...</div>;
  if (!hasAccess) return <div className="p-20 text-center font-bold text-red-500">Accès refusé</div>;

  if (error) {
    let errorMessage = "Nous n'avons pas pu récupérer les données du tableau de bord.";
    let errorDetails = "";
    let errorHint = "";
    
    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.message) {
        errorDetails = parsedError.message;
        if (errorDetails.includes('insufficient permissions') || parsedError.code === '42501') {
          errorMessage = "Permissions insuffisantes (RLS). Veuillez vérifier vos politiques de sécurité sur Supabase.";
        } else if (errorDetails.includes('relation') && errorDetails.includes('does not exist')) {
          errorMessage = `La table '${parsedError.tableName}' n'existe pas. Avez-vous exécuté le script SQL ?`;
        }
        errorHint = parsedError.hint || "";
      }
    } catch (e) {
      errorDetails = error.message;
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-12 inline-block max-w-lg">
          <TrendingUp className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">
            {errorMessage}
          </p>
          {errorDetails && (
            <div className="text-left bg-white/50 p-4 rounded-xl border border-red-100 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Détails techniques</p>
              <p className="text-xs text-red-600 font-mono break-all">{errorDetails}</p>
              {errorHint && <p className="text-[10px] text-amber-600 mt-2 font-medium italic">Astuce : {errorHint}</p>}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
            >
              Réessayer
            </button>
            <Link 
              to="/"
              className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categories = ['Tous', 'Digital', 'Marketing', 'Design'];
  
  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3, adminOnly: true, superAdminOnly: false, allowManager: true },
    { id: 'orders', label: 'Commandes', icon: ShoppingBag, adminOnly: false, superAdminOnly: false, allowManager: true },
    { id: 'users', label: 'Clients', icon: User, adminOnly: true, superAdminOnly: false, allowManager: true },
    { id: 'services', label: 'Services', icon: LayoutGrid, adminOnly: true, superAdminOnly: false, allowManager: false },
    { id: 'portfolio', label: 'Portfolio', icon: Database, adminOnly: true, superAdminOnly: false, allowManager: false },
    { id: 'blog', label: 'Blog', icon: FileText, adminOnly: true, superAdminOnly: false, allowManager: false },
    { id: 'settings', label: 'Réglages', icon: Settings, adminOnly: true, superAdminOnly: false, allowManager: false },
    { id: 'messages', label: 'Messages', icon: MessageSquare, adminOnly: false, superAdminOnly: false, allowManager: true },
    { id: 'partner_messages', label: 'Messages Partenaires', icon: MessageSquare, adminOnly: true, superAdminOnly: false, allowManager: true },
    { id: 'pos', label: 'Caisse', icon: Calculator, adminOnly: false, superAdminOnly: false, allowManager: true },
    { id: 'expenses', label: 'Dépenses', icon: Receipt, adminOnly: false, superAdminOnly: false, allowManager: true },
    { id: 'design_requests', label: 'Demandes Design', icon: Palette, adminOnly: true, superAdminOnly: false, allowManager: true, allowRole: 'designer' },
    { id: 'printing', label: 'Impression', icon: Printer, adminOnly: true, superAdminOnly: false, allowManager: true, allowRole: 'printer' },
    // { id: 'studio_acom', label: 'Studio ACOM', icon: Palette, adminOnly: true, superAdminOnly: false, allowManager: false },
    { id: 'saas_subscriptions', label: 'Souscriptions', icon: Store, adminOnly: true, superAdminOnly: false, allowManager: false },
    { id: 'saas_appearance', label: 'Apparence', icon: Layout, adminOnly: true, superAdminOnly: false, allowManager: false },
    { id: 'design', label: 'Éditeur Design', icon: LayoutGrid, adminOnly: true, superAdminOnly: false, allowManager: false },
  ].filter(tab => {
    if (tab.superAdminOnly && !isSuperAdmin) return false;
    if (tab.adminOnly && !isAdmin && !(tab.allowManager && isManager) && !(tab.allowRole && profile?.role === tab.allowRole)) return false;
    if (!tab.adminOnly && !isAdmin && !isManager && tab.id !== 'messages' && !(tab.allowRole && profile?.role === tab.allowRole)) return false; 
    if ((tab.id === 'orders' || tab.id === 'overview') && isRestrictedAdmin) return false;
    return true;
  });

  const tabGroups = [
    {
      title: "Statistiques & Commercial",
      tabs: ['overview', 'orders', 'users', 'messages', 'partner_messages']
    },
    {
      title: "Gestion du Site",
      tabs: ['services', 'portfolio', 'blog', 'settings']
    },
    {
      title: "Finances",
      tabs: ['pos', 'expenses']
    },
    {
      title: "Studio ACOM",
      tabs: ['design_requests', 'printing', 'design']
    },
    {
      title: "Acom SaaS",
      tabs: ['saas_subscriptions', 'saas_appearance']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 md:pt-44">
      <div className="flex flex-col items-center justify-center mb-12 gap-8">
        <h1 className="text-3xl md:text-5xl lg:text-5xl font-bold text-gray-900 text-center tracking-tight">Dashboard Administrateur</h1>
        
        <div className="w-full max-w-6xl bg-gray-50 p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {tabGroups.map((group, groupIdx) => {
              const groupTabs = tabs.filter(t => group.tabs.includes(t.id));
              if (groupTabs.length === 0) return null;
              
              return (
                <div key={groupIdx} className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 mb-1">{group.title}</h3>
                  <div className="flex flex-col gap-2">
                    {groupTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === 'design') {
                            navigate('/design-editor');
                          } else {
                            setActiveTab(tab.id as Tab);
                          }
                        }}
                        className={`flex items-center justify-start px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
                          activeTab === tab.id 
                            ? 'bg-white text-primary shadow border border-primary/10' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                        }`}
                      >
                        <tab.icon className={`w-4 h-4 mr-3 shrink-0 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showFixConfirm}
        title="Réparer les images"
        message="Cette opération va migrer toutes les images encodées en base64 vers Supabase Storage. Cela peut prendre quelques minutes."
        confirmLabel={isFixingImages ? "Migration..." : "Démarrer la migration"}
        onConfirm={handleFixImages}
        onCancel={() => setShowFixConfirm(false)}
        type="warning"
      />

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {loading ? (
              <div className="p-20 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Chargement des commandes...</p>
              </div>
            ) : (
              <>
                <DailyBriefing 
                  data={{ 
                    sales: orders.filter(o => o.status === 'completed'), 
                    products: dynamicServices, 
                    expenses: expenses 
                  }} 
                />
                <PlatformAIInsights 
                  orders={orders}
                  services={dynamicServices}
                  expenses={expenses}
                />
                <BusinessInsights />
                <AdminChat />
                {/* Maintenance & Tools */}
              {(isSuperAdmin || isManager) && (
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-display font-bold text-gray-900">Maintenance & Outils</h3>
                      <p className="text-sm text-gray-500 mt-1">Gérez l'intégrité des données et les ressources</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Database className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Migration des Images</h4>
                      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                        Si les images ne s'affichent pas pour les clients, elles sont probablement stockées en base64. 
                        Cet outil les déplace vers Supabase Storage pour une meilleure performance.
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowFixConfirm(true);
                        }}
                        disabled={isFixingImages}
                        className="w-full py-3 bg-white text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isFixingImages ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Migration...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Réparer les images
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Settings className="w-5 h-5 text-indigo-600" />
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Configuration Storage</h4>
                      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                        Assurez-vous que les buckets "services" et "studio-acom" sont créés et configurés en mode PUBLIC dans votre console Supabase.
                      </p>
                      <a
                        href="https://supabase.com/dashboard/project/_/storage/buckets"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Console Supabase
                      </a>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Mail className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Prévisualisation Emails</h4>
                      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                        Visualisez le rendu réel des emails de suivi d'impression envoyés à vos clients (Production, Expédition, Livraison).
                      </p>
                      <Link
                        to="/admin/email-preview"
                        className="w-full py-3 bg-white text-emerald-600 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Tester les emails
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Insights Section */}
                <PlatformAIInsights orders={orders} services={allServices} expenses={expenses} />

                {/* Level 1: Global KPIs */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                  <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {stats.map((stat, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                          <p className="text-2xl font-display font-bold text-gray-900 mt-1">{stat.value}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-display font-bold text-gray-900">Activité Récente</h3>
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bell className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <GlobalActivityFeed limit={8} />
                    </div>
                  </div>
                </div>

                {/* Level 1.5: Trésorerie Réelle */}
                <div className="mb-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-black/5 shadow-sm mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest flex items-center">
                        <Database className="w-6 h-6 mr-3 text-primary" />
                        Analyse de la Trésorerie
                      </h2>
                      <p className="text-gray-400 font-medium mt-1">Période du {format(new Date(startDate), 'dd MMM yyyy', { locale: fr })} au {format(new Date(endDate), 'dd MMM yyyy', { locale: fr })}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-gray-50 p-1.5 md:p-2 rounded-2xl border border-gray-100 w-full sm:w-auto">
                        <div className="px-4 py-2 flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Du</label>
                          <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer w-full"
                          />
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-gray-200" />
                        <div className="sm:hidden h-px w-full bg-gray-200 my-1" />
                        <div className="px-4 py-2 flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Au</label>
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => {
                            setStartDate(format(startOfDay(new Date()), 'yyyy-MM-dd'));
                            setEndDate(format(endOfDay(new Date()), 'yyyy-MM-dd'));
                          }}
                          className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold text-gray-500 hover:text-primary transition-colors"
                        >
                          Aujourd'hui
                        </button>
                        <button 
                          onClick={() => {
                            setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                            setEndDate(format(new Date(), 'yyyy-MM-dd'));
                          }}
                          className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold text-gray-500 hover:text-primary transition-colors"
                        >
                          7 Jours
                        </button>
                        <button 
                          onClick={() => {
                            setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                            setEndDate(format(new Date(), 'yyyy-MM-dd'));
                          }}
                          className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold text-gray-500 hover:text-primary transition-colors"
                        >
                          30 Jours
                        </button>
                      </div>

                      <button 
                        onClick={handleExportCSV}
                        className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter CSV
                      </button>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Tag className="w-5 h-5 text-indigo-600" />
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Permissions & Sécurité</h4>
                      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                        Mettez à jour vos permissions d'accès (Custom Claims) pour garantir une sécurité optimale 
                        et des performances accrues lors de la navigation.
                      </p>
                      <button
                        onClick={handleSyncPermissions}
                        disabled={isSyncingPermissions}
                        className="w-full py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSyncingPermissions ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Synchronisation...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            Synchroniser les permissions
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
                    <Database className="w-5 h-5 mr-2 text-primary" />
                    Trésorerie Réelle (Caisse)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
                    {cashStats.map((stat, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className={`p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${
                          stat.label === 'Bénéfice Net Réel' ? 'bg-emerald-50 border-emerald-100 lg:col-span-2 xl:col-span-1' : 'bg-white'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                          <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                          <p className={`text-2xl font-bold mt-1 ${stat.label === 'Bénéfice Net Réel' ? 'text-emerald-700' : 'text-gray-900'}`}>{stat.value}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">{stat.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-primary" />
                    Ventilation par Mode de Paiement
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {paymentMethodStats.map((stat, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                          <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          {stat.description && (
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">{stat.description}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                    <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm p-8">
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                        Évolution Financière
                      </h2>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ fontWeight: 700 }}
                            />
                            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              name="Revenus"
                              stroke="#7c3aed" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorRevenue)" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="expense" 
                              name="Dépenses"
                              stroke="#ef4444" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorExpense)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm p-8">
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                        Répartition des Revenus
                      </h2>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                          <BarChart data={paymentMethodStats.map(s => ({ name: s.label, value: parseInt(s.value.replace(/\D/g, '')) }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ fontWeight: 700 }}
                            />
                            <Bar dataKey="value" name="Montant" radius={[8, 8, 0, 0]}>
                              {paymentMethodStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#4f46e5', '#ea580c', '#2563eb', '#10b981'][index % 4]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden mt-12">
                    <div className="p-8 border-b border-gray-50">
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                        Rentabilité par Service
                      </h2>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productProfitability.map((p, i) => (
                          <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-2 truncate" title={p.name}>{p.name}</h3>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chiffre d'Affaires</p>
                                <p className="text-xl font-black text-primary">{p.revenue.toLocaleString()} FCFA</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marge Est. {p.hasCost && `(${Math.round(p.marginRate)}%)`}</p>
                                <p className={`text-lg font-bold ${p.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {p.hasCost ? `${p.margin.toLocaleString()} FCFA` : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Panier Moyen</p>
                                <p className="text-sm font-bold text-gray-600">{Math.round(p.average).toLocaleString()} FCFA</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventes</p>
                                <p className="text-sm font-bold text-gray-900">{p.count}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden mt-12">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-primary" />
                        Historique des Transactions
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Libellé</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</th>
                            <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">TVA</th>
                            <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {transactionHistory.length > 0 ? (
                            transactionHistory.map((t, i) => (
                              <tr key={t.id || i} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                  {format(new Date(t.date), 'dd/MM/yyyy HH:mm')}
                                </td>
                                <td className="px-8 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{t.label}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {t.type === 'income' ? 'Revenu' : 'Dépense'}
                                      </span>
                                      {t.transactionId && (
                                        <span className="text-[8px] font-mono text-gray-300 uppercase tracking-tighter truncate max-w-[100px]">
                                          ID: {t.transactionId}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-4">
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.method}</span>
                                </td>
                                <td className="px-8 py-4 text-right text-xs font-bold text-gray-400">
                                  {t.type === 'income' ? `${Math.round(t.amount * (taxRate / (100 + taxRate))).toLocaleString()} FCFA` : '-'}
                                </td>
                                <td className={`px-8 py-4 text-right font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} FCFA
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">
                                Aucune transaction sur cette période.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Level 2: Operational & Financial Analysis (Grouped by Period) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  {['Jour', 'Mois', 'Année'].map((period, idx) => {
                    const onlineStat = orderStatusStats?.find(s => s.label.includes(`Ligne (${period})`));
                    const posStat = orderStatusStats?.find(s => s.label.includes(`Caisse (${period})`));
                    const onlineAcc = accountingStats?.find(s => s.label.includes(`Ligne (${period})`));
                    const posAcc = accountingStats?.find(s => s.label.includes(`Caisse (${period})`));

                    return (
                      <div key={idx} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-primary" />
                            Performance {period}
                          </h3>
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase">Global</span>
                        </div>

                        <div className="space-y-6">
                          {/* Online Section */}
                          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-indigo-600 uppercase">En Ligne</span>
                              <span className="text-lg font-bold text-indigo-900">{onlineAcc?.value}</span>
                            </div>
                            <p className="text-[11px] text-indigo-400 font-medium italic leading-tight">
                              {onlineStat?.value} {onlineStat?.value && onlineStat.value > 1 ? 'commandes' : 'commande'} : {onlineStat?.breakdown}
                            </p>
                          </div>

                          {/* POS Section */}
                          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-emerald-600 uppercase">Caisse</span>
                              <span className="text-lg font-bold text-emerald-900">{posAcc?.value}</span>
                            </div>
                            <p className="text-[11px] text-emerald-400 font-medium italic leading-tight">
                              {posStat?.value} {posStat?.value && posStat.value > 1 ? 'commandes' : 'commande'} : {posStat?.breakdown}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Level 2.5: Visual Trends */}
                {overviewChartData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Évolution Quotidienne (7j)</h3>
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                          <AreaChart data={overviewChartData.daily}>
                            <defs>
                              <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(value) => `${value / 1000}k`} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: number) => [value.toLocaleString() + ' FCFA', '']}
                            />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                            <Area name="En Ligne" type="monotone" dataKey="online" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOnline)" />
                            <Area name="Caisse" type="monotone" dataKey="pos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPos)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Évolution Mensuelle (Année)</h3>
                        <LayoutGrid className="w-4 h-4 text-primary" />
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                          <AreaChart data={overviewChartData.monthly}>
                            <defs>
                              <linearGradient id="colorOnlineM" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPosM" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(value) => `${value / 1000}k`} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: number) => [value.toLocaleString() + ' FCFA', '']}
                            />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                            <Area name="En Ligne" type="monotone" dataKey="online" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOnlineM)" />
                            <Area name="Caisse" type="monotone" dataKey="pos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPosM)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'printing' && (
          <motion.div
            key="printing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PrintingManager 
              orders={orders} 
              services={allServices} 
              users={users} 
            />
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {loading ? (
              <div className="p-20 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Chargement des commandes...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Level 3: Active Management */}
                <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden mb-12">
                  <div className="p-6 border-b border-gray-50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <h2 className="text-xl font-bold text-gray-900">Gestion des Commandes</h2>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Category Tabs */}
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setCategoryFilter(cat);
                                setProductFilter('Tous');
                              }}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                categoryFilter === cat
                                  ? 'bg-white text-primary shadow-sm'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Product Dropdown */}
                        <div className="relative">
                          <select
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                          >
                            <option value="Tous">Tous les produits</option>
                            {availableProducts.map((prod) => (
                              <option key={prod} value={prod}>{prod}</option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="appearance-none pl-4 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                          >
                            <option value="Tous">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmé</option>
                            <option value="in_progress">En cours</option>
                            <option value="completed">Terminé</option>
                            <option value="delivered">Livré</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Clock className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                          <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Client / Projet</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Statut</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[...orders]
                          .sort((a, b) => {
                            const getTime = (val: any) => {
                              if (!val) return Date.now(); // Fallback to now
                              if (typeof val === 'object') {
                                if (val.seconds !== undefined) return val.seconds * 1000;
                                if (val._seconds !== undefined) return val._seconds * 1000;
                              }
                              if (typeof val.toMillis === 'function') return val.toMillis();
                              if (typeof val === 'string' || typeof val === 'number') {
                                const d = new Date(val);
                                if (!isNaN(d.getTime())) return d.getTime();
                              }
                              if (val instanceof Date) return val.getTime();
                              return Date.now(); // Fallback to now
                            };
                            const timeA = getTime(a.createdAt || a.created_at || a.updated_at || a.updatedAt);
                            const timeB = getTime(b.createdAt || b.created_at || b.updated_at || b.updatedAt);
                            return timeB - timeA;
                          })
                          .filter(order => {
                            const service = allServices.find(s => s.id === order.serviceId);
                            
                            // Category filter
                            if (categoryFilter !== 'Tous') {
                              if (service?.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
                            }

                            // Studio ACOM filter: exclude from general orders list
                            if (service?.pillar === 'studio') return false;
                            
                            // Product filter
                            if (productFilter !== 'Tous') {
                              if (service?.name !== productFilter) return false;
                            }

                            // Status filter
                            if (statusFilter !== 'Tous') {
                              if (order.status !== statusFilter) return false;
                            }

                            const search = orderSearch.toLowerCase();
                            const clientName = (order.details?.clientName || order.details?.fullName || '').toLowerCase();
                            const serviceName = (order.details?.serviceName || '').toLowerCase();
                            const phone = (order.details?.phone || '').toLowerCase();
                            const address = (order.details?.address || '').toLowerCase();
                            const orderId = (order.id || '').toLowerCase();
                            return clientName.includes(search) || 
                                   serviceName.includes(search) || 
                                   orderId.includes(search) || 
                                   phone.includes(search) || 
                                   address.includes(search);
                          })
                          .map((order) => {
                          const service = allServices.find(s => s.id === order.serviceId);
                          const client = users.find(u => u.id === order.userId);
                          const isPos = order.details?.type === 'pos';
                          
                          return (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 ${isPos ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'} rounded-xl flex items-center justify-center`}>
                                    {isPos ? <Calculator className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-gray-900">
                                        {order.clientName || order.details?.clientName || order.details?.fullName || client?.displayName || 'Client Inconnu'}
                                      </p>
                                      {isPos && (
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-100">
                                          Caisse
                                        </span>
                                      )}
                                    </div>
                                    <Link to={`/order-details/${order.id}`} className="text-xs text-gray-400 hover:text-primary transition-colors">
                                    {service?.name || order.serviceName || order.details?.serviceName || order.details?.projectType || 'Service Inconnu'}
                                    </Link>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {(() => {
                                  const cDate = order.createdAt || order.created_at || order.updated_at || order.updatedAt;
                                  
                                  const getTime = (val: any) => {
                                    if (!val) return null;
                                    if (typeof val === 'object') {
                                      if (val.seconds !== undefined) return val.seconds * 1000;
                                      if (val._seconds !== undefined) return val._seconds * 1000;
                                      // Attempt JSON stringify salvage
                                      try {
                                        const parsed = JSON.parse(JSON.stringify(val));
                                        if (parsed.seconds) return parsed.seconds * 1000;
                                        if (parsed._seconds) return parsed._seconds * 1000;
                                      } catch(e) {}
                                    }
                                    if (typeof val.toMillis === 'function') return val.toMillis();
                                    if (typeof val === 'string' || typeof val === 'number') {
                                      const d = new Date(val);
                                      if (!isNaN(d.getTime())) return d.getTime();
                                    }
                                    if (val instanceof Date) return val.getTime();
                                    return null;
                                  };
                                  
                                  const time = getTime(cDate);
                                  try {
                                    if (time && !isNaN(time)) {
                                      const d = new Date(time);
                                      if (!isNaN(d.getTime())) {
                                        const formatted = format(d, 'dd/MM/yyyy', { locale: fr });
                                        if (formatted.toLowerCase().includes('invalid')) {
                                          return format(new Date(), 'dd/MM/yyyy', { locale: fr });
                                        }
                                        return formatted;
                                      }
                                    }
                                  } catch (e) {
                                    console.error("FORMAT ERROR FOR DATE", cDate, e);
                                  }
                                  
                                  // Fallback absolu si la donnée a été complètement effacée par IndexedDB
                                  return format(new Date(), 'dd/MM/yyyy', { locale: fr });
                                })()}
                              </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <select
                                  value={order.status}
                                  onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                                  className={`text-xs font-bold bg-gray-50 border-none rounded-full px-3 py-1 focus:ring-2 focus:ring-primary/20 ${
                                    order.status === 'confirmed' && !order.clientAccepted ? 'text-amber-600 bg-amber-50' : ''
                                  }`}
                                >
                                  <option value="pending">En attente</option>
                                  <option value="confirmed">Confirmé</option>
                                  <option value="in_progress">En cours</option>
                                  <option value="completed">Terminé</option>
                                  <option value="delivered">Livré</option>
                                </select>
                                {order.status === 'confirmed' && !order.clientAccepted && order.details?.type !== 'pos' && (
                                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1 ml-2">
                                    Attente Client
                                  </span>
                                )}
                                {order.clientAccepted && order.details?.type !== 'pos' && (
                                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter mt-1 ml-2">
                                    Client a accepté
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500 text-[10px]">{(order.totalPrice || 0).toLocaleString()}</span>
                                  <span>{getOrderDiscountedTotal(order).toLocaleString()} FCFA</span>
                                  <span className="text-[8px] font-black text-primary bg-primary-light/30 px-1 rounded uppercase tracking-tighter">
                                    -{order.discountPercentage || 0}%
                                  </span>
                                </div>
                                 {order.paid ? (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                                      Payé
                                    </span>
                                  </div>
                                ) : order.depositPaid ? (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">
                                      Acompte Payé
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">
                                      Non Payé
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  to={`/order-details/${order.id}`}
                                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                                  title="Détails de la commande"
                                >
                                  <Eye className="w-5 h-5" />
                                </Link>
                                <Link
                                  to={`/chat/${order.id}`}
                                  className={`p-2 transition-colors relative ${order.unreadByAdmin ? 'text-primary bg-primary-light rounded-xl' : 'text-gray-400 hover:text-primary'}`}
                                  title="Discuter"
                                >
                                  <MessageSquare className="w-5 h-5" />
                                  {order.unreadByAdmin && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-white rounded-full animate-pulse" />
                                  )}
                                </Link>
                                {order.status === 'delivered' && !order.paid && (
                                  <button 
                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                    title="Relancer le client (Reliquat)"
                                    onClick={() => {
                                      // In a real app, this would send an email/notification
                                      toast.success(`Relance envoyée à ${order.details?.fullName || 'Client'} pour le reliquat.`);
                                    }}
                                  >
                                    <Bell className="w-5 h-5" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => setSelectedOrderForSummary(order)}
                                  className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Résumé Financier"
                                >
                                  <Banknote className="w-5 h-5" />
                                </button>
                                <Link 
                                  to={`/invoice/${order.id}`}
                                  className="p-2 text-gray-400 hover:text-primary" 
                                  title="Générer Facture"
                                >
                                  <FileText className="w-5 h-5" />
                                </Link>
                                <button className="p-2 text-gray-400 hover:text-primary" title="Plus d'actions">
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </div>
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
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <UserManager />
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ServiceManager />
          </motion.div>
        )}

        {activeTab === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PortfolioManager />
          </motion.div>
        )}

        {activeTab === 'blog' && (
          <motion.div
            key="blog"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BlogManager />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SettingsManager />
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MessageManager />
          </motion.div>
        )}

        {activeTab === 'partner_messages' && (
          <motion.div
            key="partner_messages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PartnerMessageManager />
          </motion.div>
        )}

        {activeTab === 'pos' && (
          <motion.div
            key="pos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-12 rounded-[2.5rem] border border-black/5 shadow-sm text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calculator className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold text-ink mb-4">Comptabilité (Caisse)</h2>
            <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
              Accédez à l'interface de vente en présence pour enregistrer de nouvelles transactions et gérer la caisse.
            </p>
            <Link 
              to="/manager/pos"
              className="inline-flex items-center px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
            >
              Ouvrir la Caisse
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        )}

        {activeTab === 'expenses' && (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <ExpenseManager />
            </div>
          </motion.div>
        )}

        {activeTab === 'design_requests' && (
          <motion.div
            key="design_requests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <DesignRequestManager />
            </div>
          </motion.div>
        )}

        {activeTab === 'studio_acom' && (
          <motion.div
            key="studio_acom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <StudioAcomManager />
            </div>
          </motion.div>
        )}

        {activeTab === 'saas_subscriptions' && (
          <motion.div
            key="saas_subscriptions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <AcomSaaSManager />
            </div>
          </motion.div>
        )}
        
        {activeTab === 'saas_appearance' && (
          <motion.div
            key="saas_appearance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <AcomSaaSSettings />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrderForSummary && (
          <FinancialSummaryModal 
            order={selectedOrderForSummary} 
            onClose={() => setSelectedOrderForSummary(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
