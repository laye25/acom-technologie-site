import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Order } from '../types';
import { db } from '../db/db';
import { db as firestoreDb } from '../firebase';
import { collection, query, where } from 'firebase/firestore';
import { subscriptionEngine } from '../data/services/subscription.engine';
import { dbService } from '../services/dbService';
import { syncService } from '../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, Clock, Truck, CheckCircle, Search, 
  MapPin, Loader2, FileText, Download, Hash, Globe, X,
  ExternalLink, Package, Printer as PrinterIcon, XCircle,
  ShieldAlert, Facebook, Instagram, Linkedin, Image as ImageIcon,
  Camera, Trash2, Plus, Palette, Flame, BarChart3, AlertTriangle,
  TrendingUp, TrendingDown, Award, ArrowRight, Upload, MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PartnerChat } from '../components/chat/PartnerChat';

import { notificationService } from '../services/notificationService';
import { userRepository } from '../data/repositories/user.repository';
import { storageService } from '../services/storageService';

export const PartnerPortal: React.FC = () => {
  const { user, profile, isPartner, isAdmin, isManager, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'invoices' | 'messages'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    managerName: '',
    address: ''
  });

  // Sync data handled by BackgroundSyncManager
  useEffect(() => {
    // Only perform an initial sync if the data is completely missing in Dexie
    const initialSync = async () => {
      if (user?.uid) {
         // Rely on BackgroundSyncManager for background updates
         // Just a one-time check or just trust the Dexie local-first state
         // If necessary, call manual sync here ONLY if data is missing, 
         // but that logic is better handled by syncManager.
      }
    };
    initialSync();
  }, [user?.uid]);

  // Read from Dexie
  const myOrders = useLiveQuery(async () => {
    if (!user) return [];
    if (!isAdmin && !isManager) {
      // Need to query both fields and merge results
      const allOrders = await db.orders.toArray();
      console.log('[PartnerPortal] Total orders in Dexie:', allOrders.length);
      console.log('[PartnerPortal] Partner UID:', user.uid);
      
      const orders1 = await db.orders.where('partnerId').equals(user.uid).toArray();
      const orders2 = await db.orders.where('partner_id').equals(user.uid).toArray();
      
      console.log('[PartnerPortal] Orders matched by partnerId:', orders1.length);
      console.log('[PartnerPortal] Orders matched by partner_id:', orders2.length);
      
      // Merge and remove duplicates
      const orderMap = new Map();
      [...orders1, ...orders2].forEach(o => orderMap.set(o.id, o));
      const orders = Array.from(orderMap.values());
      
      console.log('[PartnerPortal] Dexie orders for partner (final):', orders);
      return orders;
    }
    const orders = await db.orders.toArray();
    console.log('[PartnerPortal] Dexie orders for admin:', orders);
    return orders;
  }, [user, isAdmin, isManager]) || [];

  // Real-time synchronization for printers
  useEffect(() => {
    if (!user || isAdmin || isManager) return;
    
    // Subscribe to Firestore orders for this partner (support both partnerId and partner_id)
    const colRef = collection(firestoreDb, 'orders');
    const q1 = query(colRef, where('partnerId', '==', user.uid));
    const q2 = query(colRef, where('partner_id', '==', user.uid));
    
    // Initial sync
    syncService.syncPartnerOrders(user.uid).then(() => {
        console.log('[PartnerPortal] Initial sync for partner complete');
    });

    // We can't easily perform an OR query in a single Firestore `query` object for simple indexing.
    // However, we can subscribe to both if necessary, but this might duplicate data in Dexie.
    // Let's just create a subscription for each to make sure.    
    const unsubscribe1 = subscriptionEngine.subscribe('partner_orders_realtime_1', q1, async (snapshot) => {
        console.log('[PartnerPortal] Snapshot (partnerId) received. Documents:', snapshot.docs.length);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await db.orders.bulkPut(orders as any);
        console.log('[PartnerPortal] Real-time order update synced to Dexie (partnerId). Found:', orders.length);
    });

    const unsubscribe2 = subscriptionEngine.subscribe('partner_orders_realtime_2', q2, async (snapshot) => {
        console.log('[PartnerPortal] Snapshot (partner_id) received. Documents:', snapshot.docs.length);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await db.orders.bulkPut(orders as any);
        console.log('[PartnerPortal] Real-time order update synced to Dexie (partner_id). Found:', orders.length);
    });

    return () => {
        unsubscribe1();
        unsubscribe2();
    };
  }, [user, isAdmin, isManager]);

  const ratings = useLiveQuery(() => 
    user ? db.partner_ratings.where('partnerId').equals(user.uid).toArray() : []
  , [user?.uid]) || [];

  const admins = useLiveQuery(() => 
    db.users.where('role').equals('admin').limit(1).toArray()
  , []) || [];

  const loading = myOrders === undefined;
  
  // Initialize profile form when entering edit mode
  const startEditing = () => {
    setProfileForm({
      phone: profile?.partnerDetails?.phone || '',
      website: profile?.partnerDetails?.website || '',
      facebook: profile?.partnerDetails?.facebook || '',
      instagram: profile?.partnerDetails?.instagram || '',
      linkedin: profile?.partnerDetails?.linkedin || '',
      managerName: profile?.partnerDetails?.managerName || '',
      address: profile?.partnerDetails?.address || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      if (!user?.uid) return;
      
      const updatedDetails = {
        ...(profile?.partnerDetails || {}),
        phone: profileForm.phone,
        website: profileForm.website,
        facebook: profileForm.facebook,
        instagram: profileForm.instagram,
        linkedin: profileForm.linkedin,
        managerName: profileForm.managerName,
        address: profileForm.address
      };

      const updateData = {
        partnerDetails: updatedDetails as any
      };

      await dbService.users.update(user.uid, updateData);
      // Update local cache
      await db.users.update(user.uid, updateData);

      toast.success('Profil mis à jour avec succès');
      setIsEditingProfile(false);
    } catch (e) {
      console.error('Update failed:', e);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUpdating(true);
    try {
      const path = `partners/${user.uid}/workshop_${Date.now()}`;
      const url = await storageService.uploadFile('assets', path, file);
      
      const currentPhotos = profile?.partnerDetails?.workshopPhotos || [];
      const updatedData = {
        partnerDetails: {
          ...(profile?.partnerDetails || {}),
          workshopPhotos: [...currentPhotos, url]
        } as any
      };

      await dbService.users.update(user.uid, updatedData);
      await db.users.update(user.uid, updatedData);
      
      toast.success('Photo ajoutée à votre galerie');
    } catch (e) {
      console.error('Upload failed:', e);
      toast.error('Erreur lors de l\'envoi de la photo');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!user?.uid || !window.confirm('Supprimer cette photo ?')) return;

    setIsUpdating(true);
    try {
      const currentPhotos = profile?.partnerDetails?.workshopPhotos || [];
      const updatedPhotos = currentPhotos.filter(p => p !== photoUrl);
      
      const updatedData = {
        partnerDetails: {
          ...(profile?.partnerDetails || {}),
          workshopPhotos: updatedPhotos
        } as any
      };

      await dbService.users.update(user.uid, updatedData);
      await db.users.update(user.uid, updatedData);

      toast.success('Photo supprimée');
    } catch (e) {
      console.error('Delete failed:', e);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Statistics Calculation
  const stats = useMemo(() => {
    if (!myOrders || myOrders.length === 0) return {
      total: 0, completed: 0, active: 0, late: 0, avgDays: 0, reliability: 100
    };

    const completed = myOrders.filter(o => o.supplierStatus === 'delivered');
    const active = myOrders.filter(o => o.supplierStatus === 'in_production' || o.supplierStatus === 'pending');
    const late = myOrders.filter(o => {
      if (o.supplierStatus === 'delivered' || o.supplierStatus === 'shipped') return false;
      if (!o.productionDeadline) return false;
      const deadline = o.productionDeadline.toDate ? o.productionDeadline.toDate() : new Date(o.productionDeadline);
      return deadline < new Date();
    });

    // Calculate Average Production Time (for delivered orders)
    let totalProdTime = 0;
    let prodCount = 0;
    completed.forEach(o => {
      const start = o.acceptedAt?.toDate ? o.acceptedAt.toDate() : (o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt));
      const end = o.updatedAt?.toDate ? o.updatedAt.toDate() : new Date(o.updatedAt);
      if (start && end) {
        totalProdTime += (end.getTime() - start.getTime());
        prodCount++;
      }
    });
    const avgDays = prodCount > 0 ? Math.round(totalProdTime / (1000 * 60 * 60 * 24) / prodCount) : 0;

    // Reliability: % on time (delivered before or on deadline)
    let onTimeCount = 0;
    let deliveredWithDeadline = 0;
    completed.forEach(o => {
      if (o.productionDeadline) {
        deliveredWithDeadline++;
        const deadline = o.productionDeadline.toDate ? o.productionDeadline.toDate() : new Date(o.productionDeadline);
        const deliveredAt = o.updatedAt?.toDate ? o.updatedAt.toDate() : new Date(o.updatedAt);
        if (deliveredAt <= deadline) onTimeCount++;
      }
    });
    const reliability = deliveredWithDeadline > 0 ? Math.round((onTimeCount / deliveredWithDeadline) * 100) : 100;

    return {
      total: myOrders.length,
      completed: completed.length,
      active: active.length,
      late: late.length,
      avgDays,
      reliability
    };
  }, [myOrders]);

  const averageRating = useMemo(() => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + (r.score || 0), 0);
    return (sum / ratings.length).toFixed(1);
  }, [ratings]);

  const supportAdmin = admins?.[0];

  // 5. Automatic Deadline Monitoring
  useEffect(() => {
    if (!myOrders || myOrders.length === 0 || !profile) return;

    const checkDeadlines = async () => {
      // 1. Check for Weekly Recap (Every Monday)
      const now = new Date();
      const isMonday = now.getDay() === 1;
      
      if (isMonday && profile) {
        const lastRecap = profile.lastWeeklyRecapSent?.toDate ? profile.lastWeeklyRecapSent.toDate() : (profile.lastWeeklyRecapSent ? new Date(profile.lastWeeklyRecapSent) : null);
        const hasSentToday = lastRecap && 
                           lastRecap.getDate() === now.getDate() && 
                           lastRecap.getMonth() === now.getMonth() && 
                           lastRecap.getFullYear() === now.getFullYear();

        if (!hasSentToday) {
          try {
            await notificationService.sendWeeklyScheduleRecap(profile, myOrders);
            await dbService.users.save({
              uid: profile.uid,
              lastWeeklyRecapSent: new Date()
            });
            console.log('Weekly recap sent successfully');
          } catch (e) {
            console.error('Failed to send weekly recap:', e);
          }
        }
      }

      // 2. Check for Approaching Deadlines
      const approachingOrders = myOrders.filter(o => {
        if (o.supplierStatus === 'delivered' || o.supplierStatus === 'shipped') return false;
        if (!o.productionDeadline || o.deadlineAlertSent) return false;

        const deadline = o.productionDeadline.toDate ? o.productionDeadline.toDate() : new Date(o.productionDeadline);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return diffDays >= 0 && diffDays <= 3; // Notify if <= 3 days left
      });

      for (const order of approachingOrders) {
        try {
          const now = new Date();
          const deadline = order.productionDeadline.toDate ? order.productionDeadline.toDate() : new Date(order.productionDeadline);
          const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          await notificationService.notifyDeadlineAlert(order, profile, diffDays);
          await dbService.orders.save({
            id: order.id,
            deadlineAlertSent: true,
            updatedAt: new Date()
          });
          console.log(`Deadline alert sent for order ${order.id}`);
        } catch (e) {
          console.error(`Failed to send deadline alert for order ${order.id}:`, e);
        }
      }
    };

    checkDeadlines();
  }, [myOrders, profile]);

  const isAdminOrManager = isAdmin || isManager;

  // 2. Kanban Logic
  const kanbanColumns = [
    { id: 'pending', label: 'À Valider', icon: Clock, color: 'border-l-amber-400' },
    { id: 'in_production', label: 'En Production', icon: Printer, color: 'border-l-primary' },
    { id: 'shipped', label: 'Expédié', icon: Truck, color: 'border-l-purple-500' },
    { id: 'delivered', label: 'Livré', icon: CheckCircle, color: 'border-l-emerald-500' },
  ];

  const handleUpdateStatus = async (orderId: string, newStatus: string, tracking?: string) => {
    setIsUpdating(true);
    try {
      const order = myOrders.find(o => o.id === orderId);
      if (!order) return;

      const updateData = {
        id: orderId,
        supplierStatus: newStatus as any,
        trackingNumber: tracking || order.trackingNumber,
        status: newStatus === 'delivered' ? 'delivered' : 
                newStatus === 'shipped' ? 'completed' : 
                newStatus === 'in_production' ? 'in_progress' : 'confirmed',
        updatedAt: new Date()
      };

      // Update Firestore
      await dbService.orders.save(updateData as any);
      
      // Update Local Dexie for immediate feedback
      await db.orders.update(orderId, updateData);

      // Notify Client
      const clientUid = order.userId || order.user_id;
      if (clientUid) {
        const clientProfile = await userRepository.getById(clientUid);
        if (clientProfile) {
          await notificationService.notifyPrintingStatusChange(
            { ...order, supplierStatus: newStatus as any, trackingNumber: tracking || order.trackingNumber },
            newStatus,
            clientProfile
          );
        }
      }

      toast.success('Statut mis à jour et client notifié');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, supplierStatus: newStatus as any, trackingNumber: tracking } : null);
      }
    } catch (e) {
      console.error('Update failed:', e);
      toast.error('Erreur de mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = myOrders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin w-12 h-12 text-primary" /></div>;

  const isApproved = profile?.partnerStatus === 'approved';
  const isPending = profile?.partnerStatus === 'pending';
  const isRejected = profile?.partnerStatus === 'rejected';

  if (!isAdminOrManager && (!isPartner || !isApproved)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center">
          {isPending ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-12 rounded-[3rem] border border-blue-100 shadow-2xl shadow-blue-500/5"
            >
              <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Clock size={48} className="animate-pulse" />
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-6 uppercase tracking-tight">Candidature en cours</h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10">
                Merci {profile?.displayName}. Vos informations ont bien été reçues. 
                Acom Technologie examine actuellement votre dossier pour valider votre {profile?.role === 'printer' ? 'atelier' : 'studio design'}.
              </p>
              <div className="bg-gray-50 rounded-3xl p-6 text-left mb-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Résumé de votre dossier</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Manager</span>
                    <span className="text-gray-900 font-bold">{profile?.partnerDetails?.managerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Entreprise</span>
                    <span className="text-gray-900 font-bold">{profile?.partnerDetails?.companyName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Statut</span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-black text-[10px] uppercase">En attente d'approbation</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-5 bg-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-ink/10"
              >
                Retour à l'accueil
              </button>
            </motion.div>
          ) : isRejected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-12 rounded-[3rem] border border-red-100 shadow-2xl shadow-red-500/5"
            >
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <XCircle size={48} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-6 uppercase tracking-tight">Candidature non retenue</h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10">
                Désolé, votre candidature pour devenir partenaire n'a pas été acceptée pour le moment. 
                Contactez notre support pour plus de détails.
              </p>
              <button 
                onClick={() => window.location.href = '/devenir-partenaire'}
                className="w-full py-5 bg-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all"
              >
                Revoir le programme
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-12 rounded-[3rem] border border-amber-100 shadow-2xl shadow-amber-500/5"
            >
              <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-6 uppercase tracking-tight">Accès Restreint</h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10">
                Vous n'avez pas encore postulé pour devenir partenaire ou votre compte n'est pas autorisé à accéder à cet espace.
              </p>
              <Link 
                to="/devenir-partenaire"
                className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-ink transition-all shadow-xl shadow-primary/10 block mt-4"
              >
                Devenir Partenaire
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-[120px]">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-[90px] md:top-[100px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <PrinterIcon className="text-primary w-6 h-6" />
                </div>
                Portail Production
              </h1>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Vue d'ensemble
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Atelier (Kanban)
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Mon Profil
              </button>
              <button 
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'invoices' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Factures
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'messages' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Messagerie
              </button>
            </div>
            
            {activeTab === 'orders' && (
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-10">
        {activeTab === 'overview' ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Package className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Commandes</p>
                    <p className="text-2xl font-black text-gray-900">{stats?.total || 0}</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <Clock className="text-amber-500 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">En Cours / Attente</p>
                    <p className="text-2xl font-black text-gray-900">{stats?.active || 0}</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <Flame className="text-red-500 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Retards Critiques</p>
                    <p className="text-2xl font-black text-red-600">{stats?.late || 0}</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="text-emerald-500 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Indice de Fiabilité</p>
                    <div className="flex items-baseline gap-1">
                      <p className={`text-2xl font-black ${stats.reliability >= 90 ? 'text-emerald-600' : stats.reliability >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                        {stats.reliability}%
                      </p>
                      {stats.reliability >= 95 && <Award size={14} className="text-emerald-500" />}
                    </div>
                  </div>
               </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                 {/* Production Performance Card */}
                 <div className="bg-ink rounded-[2.5rem] p-8 text-white shadow-2xl shadow-ink/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                       <div>
                          <h3 className="text-2xl font-black mb-2">Performance de Production</h3>
                          <p className="text-white/50 text-sm font-medium">Votre efficacité moyenne sur les 30 derniers jours.</p>
                       </div>
                       <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Délai Moyen</p>
                          <p className="text-3xl font-black">{stats?.avgDays || 0} Jours</p>
                       </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Capacité Actuelle</p>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mb-2">
                             <div 
                               className="bg-primary h-full rounded-full transition-all duration-1000" 
                               style={{ width: `${Math.min(((stats?.active || 0) / 10) * 100, 100)}%` }} 
                             />
                          </div>
                          <p className="text-xs font-bold">{stats?.active || 0} unités en flux</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Commandes Livrées</p>
                          <p className="text-lg font-bold">{stats?.completed || 0}</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Satisfaction Admin</p>
                          <div className="flex items-center gap-1">
                             <CheckCircle className="w-4 h-4 text-emerald-400" />
                             <p className="text-lg font-bold">Excellent</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Urgency List */}
                 {stats?.late > 0 && (
                   <div className="bg-white rounded-[2rem] border border-red-100 p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-red-50 rounded-xl text-red-500">
                              <AlertTriangle size={20} />
                           </div>
                           <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Alertes de Production (Retards)</h4>
                        </div>
                        <button 
                          onClick={() => setActiveTab('orders')}
                          className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          Voir tout l'atelier
                        </button>
                      </div>

                      <div className="space-y-4">
                        {myOrders
                          .filter(o => {
                            if (o.supplierStatus === 'delivered' || o.supplierStatus === 'shipped') return false;
                            if (!o.productionDeadline) return false;
                            const deadline = o.productionDeadline.toDate ? o.productionDeadline.toDate() : new Date(o.productionDeadline);
                            return deadline < new Date();
                          })
                          .slice(0, 3)
                          .map(order => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-50">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm font-black text-xs">
                                     #{order.id.slice(0,4)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-gray-900">{order.serviceName}</p>
                                     <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={10} /> 
                                        En retard de {Math.abs(Math.round((new Date().getTime() - (order.productionDeadline?.toDate ? order.productionDeadline.toDate().getTime() : new Date(order.productionDeadline).getTime())) / (1000 * 60 * 60 * 24)))} jours
                                     </p>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => setSelectedOrder(order)}
                                 className="p-2 bg-white text-gray-400 rounded-xl hover:text-red-500 transition-all border border-gray-100"
                               >
                                  <ArrowRight size={16} />
                               </button>
                            </div>
                          ))
                        }
                      </div>
                   </div>
                 )}
               </div>

               {/* Production Tips/Health */}
               <div className="space-y-6">
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                     <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Santé de l'Atelier</h4>
                     <div className="space-y-6">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Respect des Délais</p>
                              <p className={`text-xl font-bold ${stats.reliability >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>{stats.reliability}% à l'heure</p>
                           </div>
                           {stats.reliability >= 80 ? <TrendingUp className="text-emerald-500 w-5 h-5" /> : <TrendingDown className="text-red-500 w-5 h-5" />}
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Délai de Réponse</p>
                              <p className="text-xl font-bold text-gray-900">{stats.avgDays > 0 ? stats.avgDays : '--'} Jours Moy.</p>
                           </div>
                           <Clock className="text-primary w-5 h-5" />
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Note de Réputation</p>
                              <p className="text-xl font-bold text-gray-900">{Number(averageRating) > 0 ? averageRating : '5.0'}/5</p>
                           </div>
                           <Award className="text-amber-500 w-5 h-5" />
                        </div>
                        <div className="pt-6 border-t border-gray-50">
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Conseil de Production</p>
                           <p className="text-xs text-gray-500 leading-relaxed italic">
                             "Optimisez vos temps de séchage pour les commandes Offset afin de réduire le délai moyen de 0.5 jours."
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10">
                     <div className="flex items-center gap-3 mb-4">
                        <Award className="text-primary w-5 h-5" />
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest">Grade Partenaire</h4>
                     </div>
                     <p className="text-lg font-black text-gray-900 mb-2">Partenaire Argent</p>
                     <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Vous êtes à 12 commandes livrées du grade <strong>Or</strong> (Accès aux paiements anticipés).
                     </p>
                  </div>
               </div>
            </div>
          </motion.div>
        ) : activeTab === 'orders' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {kanbanColumns.map(col => (
              <div key={col.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-white shadow-sm border border-gray-100`}>
                      <col.icon size={16} className="text-gray-600" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">{col.label}</h3>
                  </div>
                  <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredOrders.filter(o => (o.supplierStatus || 'pending') === col.id).length}
                  </span>
                </div>

                <div className="bg-gray-100/50 p-3 rounded-2xl border border-dashed border-gray-300 min-h-[500px] flex flex-col gap-3">
                {filteredOrders
                  .filter(o => (o.supplierStatus || 'pending') === col.id)
                    .map(order => {
                      const deadlineDate = order.productionDeadline ? (order.productionDeadline.toDate ? order.productionDeadline.toDate() : new Date(order.productionDeadline)) : null;
                      const now = new Date();
                      const isLate = deadlineDate && (order.supplierStatus !== 'delivered' && order.supplierStatus !== 'shipped') && deadlineDate < now;
                      const diffDays = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      const isApproaching = diffDays !== null && diffDays >= 0 && diffDays <= 2;

                      return (
                        <div key={order.id} className={`p-4 bg-white rounded-xl border border-gray-200 border-l-4 ${col.color} shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${isApproaching && col.id !== 'delivered' && !isLate ? 'border-amber-300 ring-2 ring-amber-500/10' : ''}`}>
                          {isLate && col.id !== 'delivered' && (
                            <div className="absolute top-0 right-0 p-1">
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            </div>
                          )}
                          {!isLate && isApproaching && col.id !== 'delivered' && (
                            <div className="absolute top-0 right-0 p-1">
                              <span className="flex h-2 w-2">
                                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-sm text-gray-900 leading-none">#{order.id.slice(0,8).toUpperCase()}</p>
                            <span className={`${isLate ? 'text-red-500' : isApproaching ? 'text-amber-600' : 'text-gray-400'} text-[9px] font-black uppercase tracking-tighter truncate max-w-[100px]`}>
                              {order.serviceName}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-4 space-y-1">
                            <p className="font-semibold text-gray-800 truncate">{order.clientName || order.details?.fullName || 'Client Inconnu'}</p>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                <span>Qté: {order.details?.quantity || (order.details as any)?.copies || 100}</span>
                                <span>{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '-'}</span>
                              </div>
                              {deadlineDate && (
                                <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest p-1.5 rounded-lg ${isLate ? 'bg-red-50 text-red-600' : isApproaching ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                                  <Clock size={10} />
                                  {isLate ? 'En Retard' : isApproaching ? 'Échéance Imminente' : 'Délai'} : {deadlineDate.toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>

                        {order.printPdfUrl && (
                          <a 
                            href={order.printPdfUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 w-full p-2 mb-3 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                          >
                            <FileText size={14} />
                            Fichier HD
                            <Download size={12} className="ml-auto" />
                          </a>
                        )}

                        <div className="flex items-center gap-2">
                          {col.id === 'pending' && (
                               <button 
                               onClick={() => handleUpdateStatus(order.id, 'in_production')}
                               className="flex-1 text-[10px] font-black uppercase tracking-widest bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                            >
                             Lancer Prod
                            </button>
                          )}
                          {col.id === 'in_production' && (
                              <button 
                                  onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                  className="flex-1 text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all shadow-sm"
                              >
                              Expédier
                              </button>
                          )}
                           <button 
                               onClick={() => setSelectedOrder(order)}
                               className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 group-hover:text-primary transition-all border border-gray-100"
                               title="Détails"
                            >
                             <ExternalLink size={14} />
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'profile' ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-10 pb-10 border-b border-gray-50">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center border border-primary/10">
                        {profile?.role === 'printer' ? <PrinterIcon size={48} className="text-primary" /> : <Palette size={48} className="text-primary" />}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{profile?.partnerDetails?.companyName}</h2>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500" /> Partenaire Acom Technologie Certifié
                          </p>
                          {!isEditingProfile && (
                            <button 
                              onClick={startEditing}
                              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                            >
                              Modifier le profil
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-4xl font-black text-gray-900">{averageRating}</div>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <div key={star} className={`w-3 h-3 rounded-full ${star <= Number(averageRating) ? 'bg-amber-400' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{ratings?.length || 0} évaluations</p>
                    </div>
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gérant d'établissement</label>
                          <input 
                            type="text"
                            value={profileForm.managerName}
                            onChange={(e) => setProfileForm({ ...profileForm, managerName: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone Professionnel</label>
                          <input 
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adresse du Siège</label>
                          <input 
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Site Web (URL)</label>
                          <input 
                            type="url"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facebook (Nom/URL)</label>
                          <input 
                            type="text"
                            value={profileForm.facebook}
                            onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-4 pt-6 border-t border-gray-50">
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleSaveProfile}
                          disabled={isUpdating}
                          className="flex-1 py-4 bg-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-ink/10 flex items-center justify-center"
                        >
                          {isUpdating ? <Loader2 className="animate-spin w-5 h-5" /> : 'Enregistrer les modifications'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Gérant d'établissement</p>
                          <p className="text-lg font-bold text-gray-900">{profile?.partnerDetails?.managerName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Contact Professionnel</p>
                          <p className="text-lg font-bold text-gray-900">{profile?.partnerDetails?.phone}</p>
                          <p className="text-sm text-gray-500 font-medium">{profile?.email}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Localisation Siège</p>
                          <p className="text-lg font-bold text-gray-900">{profile?.partnerDetails?.address}</p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Taux de Commission Négocié</p>
                          <p className="text-xl font-black text-gray-900">{profile?.partnerDetails?.commissionPercentage || 80}% <span className="text-[10px] text-gray-400">(Votre Part Net)</span></p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liens & Présence Digitale</p>
                          <div className="flex flex-wrap gap-3">
                            {profile?.partnerDetails?.website && (
                              <a href={profile.partnerDetails.website} target="_blank" className="p-3 bg-gray-50 rounded-2xl hover:bg-primary/5 text-gray-600 hover:text-primary transition-all">
                                <Globe size={20} />
                              </a>
                            )}
                            {profile?.partnerDetails?.facebook && (
                              <div className="p-3 bg-gray-50 rounded-2xl text-gray-600">
                                <Facebook size={20} />
                              </div>
                            )}
                            {profile?.partnerDetails?.instagram && (
                              <div className="p-3 bg-gray-50 rounded-2xl text-gray-600">
                                <Instagram size={20} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 mb-4">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Statut de Partenariat</p>
                          <p className="text-sm font-bold text-emerald-900 leading-snug">Votre atelier est actif et reçoit des commandes d'impression en temps réel.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Documents Légaux</p>
                          <Link 
                            to="/conditions-partenaires" 
                            target="_blank"
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-primary/30 transition-all group mb-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                <FileText size={16} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">Contrat de Partenariat (CGP)</span>
                            </div>
                            <ExternalLink size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                          </Link>

                          {profile?.partnerDetails?.signatureInfo && (
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Signé numériquement</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] text-gray-500">
                                  <strong>Date :</strong> {profile.partnerDetails.signatureInfo.signedAt?.toDate ? profile.partnerDetails.signatureInfo.signedAt.toDate().toLocaleString() : new Date(profile.partnerDetails.signatureInfo.signedAt).toLocaleString()}
                                </p>
                                <p className="text-[9px] text-gray-500">
                                  <strong>IP :</strong> {profile.partnerDetails.signatureInfo.ip}
                                </p>
                                <p className="text-[9px] text-gray-500 truncate">
                                  <strong>ID Preuve :</strong> {profile.partnerDetails.signatureInfo.version}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">Expertise & Filiation</h3>
                  <div className="prose prose-sm text-gray-600 font-medium leading-relaxed italic bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    "{profile?.partnerDetails?.companyFiliations || 'Aucun détail de filiation fourni.'}"
                  </div>
                </div>

                {/* Workshop Gallery Section */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Galerie de l'Atelier</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Présentez vos infrastructures aux clients</p>
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all cursor-pointer shadow-lg shadow-primary/20">
                      <Plus size={14} />
                      Ajouter une photo
                      <input type="file" className="hidden" accept="image/*" onChange={handleUploadPhoto} />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {profile?.partnerDetails?.workshopPhotos?.map((photo, idx) => (
                      <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group border border-gray-100 bg-gray-50">
                        <img src={photo} alt={`Atelier ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <button 
                             onClick={() => handleDeletePhoto(photo)}
                             className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                    {(!profile?.partnerDetails?.workshopPhotos || profile?.partnerDetails?.workshopPhotos.length === 0) && (
                      <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-sm">
                          <Camera size={24} />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Votre galerie est vide</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="bg-ink text-white rounded-[2.5rem] p-8 shadow-xl shadow-ink/10">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Production Globale</p>
                  <div className="space-y-6">
                    <div>
                      <p className="text-4xl font-black">{myOrders.length}</p>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Commandes gérées</p>
                    </div>
                    <div className="h-px bg-white/10 w-full" />
                    <div>
                      <p className="text-4xl font-black text-emerald-400">{myOrders.filter(o => o.supplierStatus === 'delivered').length}</p>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Livraisons réussies</p>
                    </div>
                  </div>
                </div>

                {/* Performance Card */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Derniers Avis</h3>
                   <div className="space-y-4">
                     {ratings?.slice(0, 3).map((r: any) => (
                       <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className="flex justify-between items-center mb-2">
                           <div className="flex gap-0.5">
                             {[1,2,3,4,5].map(s => (
                               <div key={s} className={`w-2 h-2 rounded-full ${s <= r.score ? 'bg-amber-400' : 'bg-gray-200'}`} />
                             ))}
                           </div>
                           <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(r.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                         </div>
                         <p className="text-xs font-bold text-gray-700 italic">"{r.comment || 'Sans commentaire'}"</p>
                       </div>
                     ))}
                     {(!ratings || ratings.length === 0) && (
                       <p className="text-xs text-gray-400 font-bold italic text-center py-4">Pas encore d'évaluations</p>
                     )}
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'invoices' || activeTab === 'messages' ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {activeTab === 'invoices' ? (
              <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-gray-50 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Gestion des Revenus</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Suivi de vos gains et règlements Acom</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <div className="bg-ink text-white p-6 rounded-[2rem] shadow-xl shadow-ink/10 flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 text-center">Solde à Percevoir</p>
                    <p className="text-2xl font-black text-center text-amber-400">
                      {myOrders.filter(o => !o.isPartnerPaid).reduce((acc, o) => acc + (o.partnerEarnings || 0), 0).toLocaleString()} <span className="text-[10px]">CFA</span>
                    </p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-900 p-6 rounded-[2rem] border border-emerald-100 flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2 text-center">Déjà Réglé par Acom</p>
                    <p className="text-2xl font-black text-center text-emerald-600">
                      {myOrders.filter(o => o.isPartnerPaid).reduce((acc, o) => acc + (o.partnerEarnings || 0), 0).toLocaleString()} <span className="text-[10px]">CFA</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Réf Order</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Service</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Votre Part</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Paiement Acom</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Facture Officielle</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 leading-none">#{order.id.slice(0,8).toUpperCase()}</span>
                            <span className="text-[10px] font-bold text-gray-400 mt-2">
                               {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                          <span className="text-xs font-black text-gray-600 uppercase">{order.serviceName}</span>
                        </td>
                      <td className="px-10 py-8 text-center">
                        <p className="font-black text-gray-900">
                          {order.partnerEarnings ? `${order.partnerEarnings.toLocaleString()} CFA` : '--'}
                        </p>
                        {order.partnerEarnings && <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Montant Net</p>}
                      </td>
                      <td className="px-10 py-8 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.isPartnerPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.isPartnerPaid ? 'Réglé' : 'À percevoir'}
                        </span>
                        {order.isPartnerPaid && order.partnerPaidAt && (
                          <p className="text-[8px] text-emerald-600 font-bold mt-1 uppercase">Le {new Date(order.partnerPaidAt.seconds * 1000).toLocaleDateString()}</p>
                        )}
                      </td>
                      <td className="px-10 py-8 text-center" key={`invoice-upload-${order.id}`}>
                        {order.partnerInvoiceUrl ? (
                          <div className="flex flex-col items-center gap-1">
                            <a 
                              href={order.partnerInvoiceUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <FileText size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest underline italic">Voir Invoice</span>
                            </a>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              order.partnerInvoiceStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                              order.partnerInvoiceStatus === 'rejected' ? 'bg-red-100 text-red-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.partnerInvoiceStatus === 'paid' ? 'Validée' : order.partnerInvoiceStatus === 'rejected' ? 'Refusée' : 'En examen'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <label className="cursor-pointer group">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !user?.uid) return;
                                  
                                  setIsUpdating(true);
                                  const toastId = toast.loading('Téléchargement de votre facture...');
                                  try {
                                    const path = `partner_invoices/${user.uid}/${order.id}_signed`;
                                    const url = await storageService.uploadFile('assets', path, file);
                                    
                                    await dbService.orders.save({
                                      id: order.id,
                                      partnerInvoiceUrl: url,
                                      partnerInvoiceStatus: 'pending',
                                      updatedAt: new Date()
                                    });
                                    
                                    toast.success('Facture officielle transmise !', { id: toastId });
                                  } catch (err) {
                                    console.error(err);
                                    toast.error('Erreur lors de l\'envoi', { id: toastId });
                                  } finally {
                                    setIsUpdating(false);
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <Upload size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Uploader Signée</span>
                              </div>
                            </label>
                            <p className="text-[8px] text-gray-400 font-bold uppercase italic">PDF/JPG Tamponné</p>
                          </div>
                        )}
                      </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => setSelectedInvoiceOrder(order)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                            >
                               <FileText size={14} /> Facture de Prod.
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {myOrders.length === 0 && (
                      <tr>
                         <td colSpan={6} className="px-10 py-20 text-center">
                            <div className="max-w-xs mx-auto space-y-4">
                               <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                                  <FileText size={32} />
                               </div>
                               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucune commande facturable</p>
                            </div>
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-8">
                  <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-4">
                    <MessageCircle size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic text-primary">Support Direct</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Échangez avec l'équipe technique d'Acom Technologie</p>
                </div>
                
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                  {supportAdmin ? (
                    <PartnerChat 
                      partnerId={user?.uid || ''} 
                      adminId={supportAdmin.uid}
                      partnerName={profile?.partnerDetails?.companyName || 'Partenaire'}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Connexion au support en cours...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </div>

      <AnimatePresence>
        {selectedInvoiceOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <FileText size={20} />
                  </div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">Facture de Production</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
                  >
                    <Printer size={14} /> Imprimer
                  </button>
                  <button onClick={() => setSelectedInvoiceOrder(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 print:p-0 bg-white" id="production-invoice">
                <div className="flex justify-between mb-16">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prestataire</h4>
                    <div className="space-y-1">
                      <p className="text-xl font-black text-gray-900 uppercase tracking-tighter">{profile?.partnerDetails?.companyName}</p>
                      <p className="text-sm font-bold text-gray-500">{profile?.partnerDetails?.address}</p>
                      <p className="text-sm font-bold text-gray-500">Tél: {profile?.partnerDetails?.phone}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</h4>
                    <div className="space-y-1">
                      <p className="text-xl font-black text-primary uppercase tracking-tighter">Acom Technologie</p>
                      <p className="text-sm font-bold text-gray-500">Dakar, Sénégal</p>
                      <p className="text-sm font-bold text-gray-500">contact@acomtechnologie.com</p>
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Facture Pro-Forma</h1>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">N° PRD-{selectedInvoiceOrder.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-[10px] font-black text-gray-400 mt-2">Générée le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>

                <table className="w-full mb-12">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Prestation de Production</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qté</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">P.U Client</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="py-8">
                        <p className="font-bold text-gray-900">{selectedInvoiceOrder.serviceName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Ref Commande: #{selectedInvoiceOrder.id}</p>
                      </td>
                      <td className="py-8 text-center font-bold text-gray-900">1</td>
                      <td className="py-8 text-right font-bold text-gray-900">{(selectedInvoiceOrder.totalPrice || 0).toLocaleString()} FCFA</td>
                      <td className="py-8 text-right font-black text-gray-900">{(selectedInvoiceOrder.totalPrice || 0).toLocaleString()} FCFA</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end pt-8 border-t border-gray-100">
                  <div className="w-80 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold">Total Chiffre d'Affaires</span>
                      <span className="text-gray-900 font-bold">{(selectedInvoiceOrder.totalPrice || 0).toLocaleString()} FCFA</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Montant Net Partenaire</span>
                      <span className="text-2xl font-black text-primary">
                         {selectedInvoiceOrder.partnerEarnings ? `${selectedInvoiceOrder.partnerEarnings.toLocaleString()} FCFA` : 'À calculer *'}
                      </span>
                    </div>
                    {selectedInvoiceOrder.partnerEarnings ? (
                      <div className={`p-4 rounded-2xl border ${selectedInvoiceOrder.isPartnerPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-center">
                           Paiement: {selectedInvoiceOrder.isPartnerPaid ? 'Réglé par virement' : 'En attente de virement'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[9px] text-primary font-bold leading-relaxed italic">
                          * Le montant exact à vous reverser (Prix de production négocié) sera validé par Acom Technologie après inspection de la qualité et confirmation de livraison finale.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-20 flex justify-between items-end">
                   <div className="space-y-8">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cachet du Partenaire</p>
                      <div className="w-40 h-40 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center text-gray-300 text-[10px] font-black uppercase text-center p-4">
                         Zone de cachet humide
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-medium italic">Document généré automatiquement via le Portail Partenaire Acom.</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Détails Commande</h2>
                  <p className="text-sm text-gray-500 mt-1"># {selectedOrder.id.toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm border border-gray-200"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                {/* Product Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Produit</p>
                    <p className="font-bold text-gray-900 text-sm">{selectedOrder.serviceName}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantité</p>
                    <p className="font-bold text-gray-900 text-sm">{selectedOrder.details?.quantity || (selectedOrder.details as any)?.copies || 100} ex.</p>
                  </div>
                </div>

                {/* Tracking Input if Shipped or In Prod */}
                {(selectedOrder.supplierStatus === 'in_production' || selectedOrder.supplierStatus === 'shipped') && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Suivi Logistique</h3>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Numéro de suivi (ex: DHL-123456)"
                        defaultValue={selectedOrder.trackingNumber}
                        onBlur={(e) => handleUpdateStatus(selectedOrder.id, selectedOrder.supplierStatus || 'pending', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900"
                      />
                    </div>
                  </div>
                )}

                {/* Print Files */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Fichiers Client</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedOrder.printPdfUrl ? (
                       <a
                       href={selectedOrder.printPdfUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between group hover:bg-indigo-100 transition-all"
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                           <FileText className="text-indigo-600" size={20} />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-gray-900">PDF de Production HD</p>
                           <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Prêt pour impression</p>
                         </div>
                       </div>
                       <Download size={20} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                     </a>
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <Package className="text-amber-600" size={20} />
                        <div>
                          <p className="text-sm font-bold text-amber-900">Aucun fichier HD généré</p>
                          <p className="text-xs text-amber-700">L'administrateur doit fournir le fichier HD.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Livraison</h3>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <MapPin size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Adresse de livraison</p>
                        <p className="text-sm font-bold text-gray-900 leading-relaxed">
                          {selectedOrder.details?.address || 'Adresse non renseignée'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 border-t border-gray-100 pt-6">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <Globe size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Secteur / Lieu</p>
                        <p className="text-sm font-bold text-gray-900 uppercase">
                          {selectedOrder.details?.city || 'Dakar'}, {selectedOrder.details?.country || 'Sénégal'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-200"
                >
                  Fermer
                </button>
                {selectedOrder.supplierStatus !== 'delivered' && (
                  <button
                    onClick={() => {
                       const nextStatus = selectedOrder.supplierStatus === 'pending' ? 'in_production' 
                                      : selectedOrder.supplierStatus === 'in_production' ? 'shipped' 
                                      : 'delivered';
                       handleUpdateStatus(selectedOrder.id, nextStatus);
                       setSelectedOrder(null);
                    }}
                    disabled={isUpdating}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="animate-spin w-5 h-5" /> : 'Faire progresser'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
