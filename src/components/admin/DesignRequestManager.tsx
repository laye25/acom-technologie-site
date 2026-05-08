import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle, XCircle, Eye, User, Mail, Calendar, Palette, ExternalLink, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { db as dexieDb } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { syncService } from '../../services/syncService';
import { firestoreService } from '../../services/firestoreService';
import { dbService } from '../../services/dbService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '../OptimizedImage';
import { UserProfile } from '../../types';

interface DesignRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  sides: any;
  previewUrl: string;
  status: string;
  createdAt: any;
  partnerId?: string;
  supplierStatus?: string;
  orderId?: string;
}

const DESIGN_STATUSES = [
  { id: 'pending', label: 'En attente', color: 'bg-amber-100 text-amber-600' },
  { id: 'approved', label: 'Approuvé', color: 'bg-blue-100 text-blue-600' },
  { id: 'in_progress', label: 'En production', color: 'bg-purple-100 text-purple-600' },
  { id: 'shipped', label: 'Expédié', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'delivered', label: 'Livré', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'rejected', label: 'Rejeté', color: 'bg-red-100 text-red-600' }
];

const ORDER_TO_DESIGN_STATUS: Record<string, string> = {
  'pending': 'pending',
  'confirmed': 'approved',
  'in_progress': 'in_progress',
  'completed': 'shipped',
  'delivered': 'delivered',
  'cancelled': 'rejected'
};

const DESIGN_TO_ORDER_STATUS: Record<string, string> = {
  'pending': 'pending',
  'approved': 'confirmed',
  'in_progress': 'in_progress',
  'shipped': 'completed',
  'delivered': 'delivered',
  'rejected': 'cancelled'
};

import { useAuth } from '../../context/AuthContext';

const DesignRequestManager = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const [selectedRequestForPartner, setSelectedRequestForPartner] = useState<any>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync on mount - optimized to avoid excessive polling
  const refresh = async (force: boolean = false) => { 
    setIsRefreshing(true);
    const quotaExceeded = localStorage.getItem('firebase_quota_exceeded');
    if (quotaExceeded && !force) {
       const exceededAt = parseInt(quotaExceeded, 10);
       if (Date.now() - exceededAt < 3600000) {
         toast.error("Synchronisation impossible : Quota Firestore épuisé. Réessayez plus tard.");
         setIsRefreshing(false);
         return;
       }
    }

    try {
      if (force) toast.loading("Force la synchronisation...", { id: 'sync-force' });
      await syncService.syncStudioAcomData(user?.uid, isAdmin || isManager, force);
      await syncService.syncOrders('global', force);
      await syncService.syncUsers('global', force);
      localStorage.setItem('last_sync_design_dashboard', Date.now().toString());
      if (force) toast.success("Synchronisation forcée réussie !", { id: 'sync-force' });
    } catch (error) {
      console.error("Manual refresh failed:", error);
      if (force) toast.error("La synchronisation forcée a échoué.", { id: 'sync-force' });
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    // Check if synced recently
    const lastSync = localStorage.getItem('last_sync_design_dashboard');
    if (!lastSync || Date.now() - parseInt(lastSync, 10) > 120000) { // 2 minute threshold for admin dashboard
      console.log('Performing necessary sync for Design Dashboard...');
      refresh();
    } else {
      console.log('Sync skipped - used recent cache');
    }
  }, [user, isAdmin, isManager]);

  const requests = useLiveQuery(() => dexieDb.design_requests.toArray()) || [];
  const studioOrders = useLiveQuery(() => dexieDb.orders.filter(o => o.pillar === 'studio').toArray()) || [];
  const allPartners = useLiveQuery(() => dexieDb.users.filter(u => u.role === 'printer' && u.partnerStatus === 'approved').toArray()) || [];
  
  React.useEffect(() => {
    console.log("DEBUG DesignRequestManager - allPartners:", allPartners);
  }, [allPartners]);

  const loading = false;

  const allRequests = [
    ...requests.map(r => ({ 
      ...r, 
      createdAt: r.createdAt || r.created_at, // Handle both formats
      origin: 'design_request' 
    })),
    ...studioOrders
      .map((o: any) => ({
        id: o.id,
        userId: o.userId,
        userEmail: o.clientEmail,
        userName: o.clientName,
        sides: o.details?.customOptions?.sides || {},
        previewUrl: o.details?.designThumbnail || o.serviceImage || '',
        status: ORDER_TO_DESIGN_STATUS[o.status] || 'pending',
        createdAt: o.createdAt || o.created_at || o.updatedAt || o.updated_at,
        origin: 'studio_order',
        partnerId: o.partnerId,
        supplierStatus: o.supplierStatus
      }))
  ].sort((a: any, b: any) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
    return timeB - timeA;
  });

  const updateStatus = async (id: string, status: string, origin: 'design_request' | 'studio_order') => {
    try {
      if (origin === 'design_request') {
        const req = requests.find(r => r.id === id);
        await firestoreService.update('design_requests', id, { status });
        
        // Sync with the generated order if the admin also changes status
        if (req && req.orderId) {
            const orderStatus = DESIGN_TO_ORDER_STATUS[status] || 'pending';
            await firestoreService.update('orders', req.orderId, { status: orderStatus });
        }
      } else {
        const orderStatus = DESIGN_TO_ORDER_STATUS[status] || 'pending';
        await firestoreService.update('orders', id, { status: orderStatus });
      }
      toast.success(`Statut mis à jour !`);
      refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de l'envoi du statut.");
    }
  };

  const openInEditor = (request: DesignRequest) => {
    navigate('/design-editor', { state: { design: { sides: request.sides } } });
  };

  const assignPartner = async (partnerId: string) => {
    console.log("DEBUG DesignRequestManager - assignPartner called with:", { partnerId, selectedRequestForPartner });
    if (!selectedRequestForPartner) return;
    try {
      if (selectedRequestForPartner.origin === 'studio_order') {
        const orderStatus = selectedRequestForPartner.status === 'pending' || selectedRequestForPartner.status === 'approved' ? 'in_progress' : selectedRequestForPartner.status;
        await firestoreService.update('orders', selectedRequestForPartner.id, {
          partnerId,
          status: DESIGN_TO_ORDER_STATUS[orderStatus] || 'in_progress',
          supplierStatus: 'pending' // Initial status for printer
        });
      } else {
        // It's a pure design_request. 
        if (selectedRequestForPartner.orderId) {
          // An order was already generated, just update the partner
          await firestoreService.update('orders', selectedRequestForPartner.orderId, {
            partnerId,
            supplierStatus: 'pending'
          });
          await firestoreService.update('design_requests', selectedRequestForPartner.id, { 
            partnerId
          });
        } else {
          // We must create an 'Order' document so it shows up in the Partner's Kanban
          const newOrder = {
            userId: selectedRequestForPartner.userId,
            status: 'in_progress' as const, // Internal status
            supplierStatus: 'pending' as const, // Partner status
            partnerId: partnerId,
            serviceId: 'custom_design',
            serviceName: 'Impression Design Personnalisé',
            serviceImage: selectedRequestForPartner.previewUrl,
            clientName: selectedRequestForPartner.userName,
            clientEmail: selectedRequestForPartner.userEmail,
            totalPrice: 0, // Admin must adjust
            partnerEarnings: 0,
            printPdfUrl: selectedRequestForPartner.previewUrl,
            files: [selectedRequestForPartner.previewUrl].filter(Boolean),
            details: {
              isCustomDesign: true,
              designRequestId: selectedRequestForPartner.id,
              origin: 'design_request'
            },
            pillar: 'studio' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const newId = await dbService.orders.save(newOrder as any);

          // Update the design request to point to the order and mark as in progress
          await firestoreService.update('design_requests', selectedRequestForPartner.id, { 
            partnerId,
            status: 'in_progress',
            orderId: newId
          });
        }
      }
      toast.success("Partenaire assigné avec succès !");
      setSelectedRequestForPartner(null);
      refresh();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'assignation");
    }
  };

  const getPartnerName = (partnerId?: string) => {
    if (!partnerId || !allPartners) return null;
    const partner = allPartners.find(p => p.uid === partnerId || p.id === partnerId);
    return partner ? partner.displayName : 'Partenaire Inconnu';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900">Demandes de Design</h2>
          <p className="text-gray-500 mt-1">Gérez les personnalisations envoyées par les clients pour tirage.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => refresh(true)}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 shadow-sm hover:shadow-md transition-all active:scale-95 ${isRefreshing ? 'opacity-50' : ''}`}
          >
            <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            {isRefreshing ? 'Mise à jour...' : 'Rafraîchir'}
          </button>
          <div className="bg-primary/10 px-4 py-2.5 rounded-2xl">
            <span className="text-primary font-bold">{allRequests.length} demandes</span>
          </div>
        </div>
      </div>

      {allRequests.length === 0 ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Palette className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune demande</h3>
          <p className="text-gray-500">Les designs envoyés par les clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allRequests.map((request: any) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col"
            >
              <div className="aspect-[1.7/1] bg-gray-100 relative overflow-hidden flex-shrink-0">
                <OptimizedImage 
                  src={request.previewUrl} 
                  alt="Preview" 
                  width={600}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    request.origin === 'studio_order' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {request.origin === 'studio_order' ? 'Studio' : 'Design'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    DESIGN_STATUSES.find(s => s.id === request.status)?.color || 'bg-gray-100 text-gray-600'
                  }`}>
                    {DESIGN_STATUSES.find(s => s.id === request.status)?.label || 'Inconnu'}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-none">{request.userName}</h4>
                    <p className="text-xs text-gray-500 mt-1">{request.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {(() => {
                      let d: Date | null = null;
                      if (request.createdAt?.toDate) d = request.createdAt.toDate();
                      else if (request.createdAt) {
                        const parsed = new Date(request.createdAt);
                        if (!isNaN(parsed.getTime())) d = parsed;
                      }
                      return d ? format(d, 'dd MMMM yyyy HH:mm', { locale: fr }) : 'Date invalide';
                    })()}
                  </div>
                </div>
                
                {/* Imprimeur Assignation Area */}
                <div className="mb-6">
                  {request.partnerId ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 bg-blue-100/50 rounded-lg flex items-center justify-center">
                        <Printer className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">Assigné à</p>
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {getPartnerName(request.partnerId)}
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedRequestForPartner(request)}
                        className="text-[10px] font-bold text-primary hover:underline px-2"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedRequestForPartner(request)}
                      className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all flex items-center justify-center border border-gray-100 border-dashed"
                    >
                      <Printer className="w-4 h-4 mr-2 text-gray-400" />
                      Assigner un Imprimeur
                    </button>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
                  <div className="flex-1">
                    <select
                      value={request.status}
                      onChange={(e) => updateStatus(request.id, e.target.value, request.origin)}
                      className="w-full text-xs font-bold bg-gray-50 text-gray-700 py-2.5 px-3 rounded-xl border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    >
                      {DESIGN_STATUSES.map(status => (
                        <option key={status.id} value={status.id}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => openInEditor(request)}
                    className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                    title="Ouvrir dans l'éditeur"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pop-up Modal Assignation Partenaire */}
      <AnimatePresence>
        {selectedRequestForPartner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedRequestForPartner(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedRequestForPartner(null)}
                className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
              >
                <XCircle size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Printer size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Assigner Partenaire</h3>
                  <p className="text-sm font-medium text-gray-500">Choisissez un imprimeur disponible</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {allPartners && allPartners.length > 0 ? (
                  allPartners.map(partner => (
                    <button
                      key={partner.uid}
                      onClick={() => assignPartner(partner.uid!)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                        selectedRequestForPartner.partnerId === partner.uid
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100">
                          {partner.photoURL ? (
                            <img src={partner.photoURL} alt={partner.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <User size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm ${selectedRequestForPartner.partnerId === partner.uid ? 'text-primary' : 'text-gray-900'}`}>
                              {partner.displayName}
                            </h4>
                            {selectedRequestForPartner.partnerId === partner.uid && (
                              <span className="px-2 py-0.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                                Actuel
                              </span>
                            )}
                          </div>
                          {partner.partnerDetails?.companyName && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {partner.partnerDetails.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border-primary text-white bg-primary">
                        <CheckCircle size={12} />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Printer className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucun imprimeur validé disponible.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesignRequestManager;
