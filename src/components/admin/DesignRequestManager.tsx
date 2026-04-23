import React from 'react';
import { useFirestoreData } from '../../hooks/useFirestoreData';
import { motion } from 'motion/react';
import { Clock, CheckCircle, XCircle, Eye, User, Mail, Calendar, Palette, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { firestoreService } from '../../services/firestoreService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '../OptimizedImage';

interface DesignRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  sides: any;
  previewUrl: string;
  status: string;
  createdAt: any;
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

const DesignRequestManager = () => {
  const navigate = useNavigate();
  const { data: requests, loading: loadingRequests, refresh: refreshRequests } = useFirestoreData<DesignRequest>({
    tableName: 'design_requests',
    order: { column: 'createdAt', direction: 'desc' }
  });

  const { data: studioOrders, loading: loadingOrders, refresh: refreshOrders } = useFirestoreData<any>({
    tableName: 'orders',
    where: [['pillar', '==', 'studio']]
  });

  const loading = loadingRequests || loadingOrders;

  const allRequests = [
    ...requests.map(r => ({ ...r, origin: 'design_request' })),
    ...studioOrders
      .map((o: any) => ({
        id: o.id,
        userId: o.userId,
        userEmail: o.clientEmail,
        userName: o.clientName,
        sides: o.details?.customOptions?.sides || {},
        previewUrl: o.details?.designThumbnail || o.serviceImage || '',
        status: ORDER_TO_DESIGN_STATUS[o.status] || 'pending',
        createdAt: o.createdAt || o.updatedAt,
        origin: 'studio_order'
      }))
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const refresh = () => { refreshRequests(); refreshOrders(); };

  const updateStatus = async (id: string, status: string, origin: 'design_request' | 'studio_order') => {
    try {
      if (origin === 'design_request') {
        await firestoreService.update('design_requests', id, { status });
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
        <div className="bg-primary/10 px-4 py-2 rounded-xl">
          <span className="text-primary font-bold">{allRequests.length} demandes</span>
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
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="aspect-[1.7/1] bg-gray-100 relative overflow-hidden">
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

              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-none">{request.userName}</h4>
                    <p className="text-xs text-gray-500 mt-1">{request.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-400 mb-6">
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

                <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
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
    </div>
  );
};

export default DesignRequestManager;
