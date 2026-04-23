import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Service, UserProfile } from '../../types';
import { dbService } from '../../services/dbService';
import { notificationService } from '../../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, Package, Truck, CheckCircle, Clock, Search, 
  FileText, Upload, ExternalLink, Filter, ChevronDown,
  AlertCircle, MoreVertical, Download, Send, User,
  Globe, MapPin, Hash, Loader2, Settings, Check, X as XIcon, Banknote
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getOrderDiscountedTotal } from '../../lib/promotions';

interface PrintingManagerProps {
  orders: Order[];
  services: Service[];
  users: UserProfile[];
}

export const PrintingManager: React.FC<PrintingManagerProps> = ({ orders, services, users }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter orders that are likely printing products
  const printingOrders = useMemo(() => {
    return orders.filter(order => {
      const service = services.find(s => s.id === order.serviceId);
      const isPrintingService = service?.category === 'Impression' || 
                               ['business-cards', 'flyers', 'posters', 'stickers'].includes(order.serviceId) ||
                               order.pillar === 'studio';
      
      // En impression, on ne gère que ce qui a été approuvé/payé (pas les pending Studio)
      if (order.pillar === 'studio' && order.status === 'pending') {
        return false;
      }
      
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
                           order.clientName?.toLowerCase().includes(search.toLowerCase()) ||
                           order.details?.fullName?.toLowerCase().includes(search.toLowerCase());
      
      const mappedStatus = order.status === 'confirmed' ? 'pending' 
                         : order.status === 'in_progress' ? 'in_production'
                         : order.status === 'completed' ? 'shipped'
                         : order.status === 'delivered' ? 'delivered'
                         : 'pending';

      const matchesStatus = statusFilter === 'Tous' || mappedStatus === statusFilter;

      return isPrintingService && matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const getMs = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        if (val._seconds) return val._seconds * 1000;
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      const dateA = getMs(a.updatedAt || a.createdAt);
      const dateB = getMs(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
  }, [orders, services, search, statusFilter]);

  const handleUpdateSupplierStatus = async (orderId: string, status: string, tracking?: string) => {
    setIsUpdating(true);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const newOrderStatus = status === 'pending' ? 'confirmed' :
                             status === 'in_production' ? 'in_progress' :
                             status === 'shipped' ? 'completed' :
                             status === 'delivered' ? 'delivered' :
                             order.status;

      const typedStatus = status as 'pending' | 'in_production' | 'shipped' | 'delivered';

      await dbService.orders.save({
        id: orderId,
        status: newOrderStatus,
        supplierStatus: typedStatus, // Keeping this for backwards compatibility if needed
        trackingNumber: tracking || undefined,
        updatedAt: new Date()
      });

      // Trigger notification if status changed
      if (order.status !== newOrderStatus) {
        const client = users.find(u => u.uid === order.userId || u.uid === order.user_id) || null;
        await notificationService.notifyPrintingStatusChange(
          { ...order, status: newOrderStatus, supplierStatus: typedStatus, trackingNumber: tracking }, 
          newOrderStatus, 
          client
        );
      }

      toast.success('Statut mis à jour et client notifié');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newOrderStatus, trackingNumber: tracking } : null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePartnerInvoiceStatus = async (orderId: string, status: 'paid' | 'rejected') => {
    setIsUpdating(true);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await dbService.orders.save({
        id: orderId,
        partnerInvoiceStatus: status,
        isPartnerPaid: status === 'paid',
        partnerPaidAt: status === 'paid' ? new Date() : null,
        updatedAt: new Date()
      });

      if (status === 'paid') {
        toast.success('Facture validée et marquée comme payée !');
      } else {
        toast.success('Facture rejetée. Le partenaire en sera informé.');
      }

      // Notify Partner
      const partner = users.find(u => u.uid === order.partnerId || u.uid === order.userId) || null;
      await notificationService.notifyPartnerInvoiceStatusChange(order, status, partner);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la validation de la facture');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGeneratePDF = async (orderId: string) => {
    setIsUpdating(true);
    try {
      // Simulation d'une génération de PDF haute définition
      const mockPdfUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
      await dbService.orders.save({
        id: orderId,
        printPdfUrl: mockPdfUrl,
        updatedAt: new Date()
      });
      toast.success('PDF Haute Définition généré !');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, printPdfUrl: mockPdfUrl } : null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsUpdating(false);
    }
  };

  const getSupplierStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_production': return 'En production';
      case 'shipped': return 'Expédié';
      case 'delivered': return 'Livré';
      default: return 'Non défini';
    }
  };

  const getSupplierStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'in_production': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-gray-500">À traiter</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {printingOrders.filter(o => o.status === 'confirmed' || (o.status !== 'in_progress' && o.status !== 'completed' && o.status !== 'delivered' && o.status !== 'cancelled' && o.pillar !== 'studio')).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Printer className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-gray-500">En production</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {printingOrders.filter(o => o.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-bold text-gray-500">En transit</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {printingOrders.filter(o => o.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-gray-500">Livrée</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {printingOrders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-black/5 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une commande ou un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400 mr-2" />
          {['Tous', 'pending', 'in_production', 'shipped', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {status === 'Tous' ? 'Tous' : getSupplierStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Commande</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Client</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Produit</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Statut Imprimeur</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Facture Partenaire</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {printingOrders.map((order) => {
                const service = services.find(s => s.id === order.serviceId);
                const client = users.find(u => u.uid === order.userId || u.uid === order.user_id);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {(() => {
                            let d: Date | null = null;
                            const dt = order.createdAt;
                            if (!dt) return '-';
                            if (dt.toDate) d = dt.toDate();
                            else if (dt.seconds) d = new Date(dt.seconds * 1000);
                            else if (dt._seconds) d = new Date(dt._seconds * 1000);
                            else {
                              const parsed = new Date(dt);
                              if (!isNaN(parsed.getTime())) d = parsed;
                            }
                            return d ? format(d, 'dd MMM yyyy', { locale: fr }) : 'Inconnu';
                          })()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm">{client?.displayName || order.details?.fullName || 'Client'}</span>
                          <span className="text-[10px] text-gray-400">{client?.email || order.details?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{service?.name || order.details?.projectType}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                          {order.details?.quantity || 100} exemplaires
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getSupplierStatusColor(order.supplierStatus)}`}>
                        {getSupplierStatusLabel(order.supplierStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.partnerInvoiceUrl ? (
                         <div className="flex flex-col gap-1.5">
                            <a 
                               href={order.partnerInvoiceUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               className="flex items-center gap-1.5 text-primary hover:text-primary-hover transition-colors"
                            >
                               <div className="p-1 bg-primary/5 rounded-lg">
                                  <FileText size={14} className="text-primary" />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest underline italic">Facture Officielle</span>
                            </a>
                            <div className="flex items-center gap-2">
                               <button
                                  onClick={() => handleUpdatePartnerInvoiceStatus(order.id, 'paid')}
                                  disabled={isUpdating || order.partnerInvoiceStatus === 'paid'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                     order.partnerInvoiceStatus === 'paid' 
                                     ? 'bg-emerald-50 text-emerald-300' 
                                     : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                  title="Valider et Marquer Payé"
                               >
                                  <Check size={14} />
                               </button>
                               <button
                                  onClick={() => handleUpdatePartnerInvoiceStatus(order.id, 'rejected')}
                                  disabled={isUpdating || order.partnerInvoiceStatus === 'paid'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                     order.partnerInvoiceStatus === 'paid'
                                     ? 'bg-red-50 text-red-200'
                                     : 'bg-red-50 text-red-600 hover:bg-red-100'
                                  }`}
                                  title="Rejeter"
                               >
                                  <XIcon size={14} />
                               </button>
                               <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  order.partnerInvoiceStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                  order.partnerInvoiceStatus === 'rejected' ? 'bg-red-100 text-red-700' : 
                                  'bg-blue-100 text-blue-700'
                               }`}>
                                  {order.partnerInvoiceStatus === 'paid' ? 'Réglée' : order.partnerInvoiceStatus === 'rejected' ? 'Rejetée' : 'Reçue'}
                               </span>
                            </div>
                         </div>
                      ) : (
                         <div className="flex items-center gap-2 text-gray-300">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase italic">En attente partenaire</span>
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-primary-light hover:text-primary transition-all"
                          title="Gérer la production"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        {order.printPdfUrl && (
                          <a
                            href={order.printPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                            title="Voir le PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {printingOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Printer className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucune commande d'impression trouvée.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
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
                  <h2 className="text-2xl font-bold text-gray-900">Gestion Production</h2>
                  <p className="text-sm text-gray-500 mt-1">Commande #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm border border-gray-200"
                >
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                {/* Status Update */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Mettre à jour le statut</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['pending', 'in_production', 'shipped', 'delivered'] as const).map((status) => (
                      <motion.button
                        layout
                        key={status}
                        onClick={() => handleUpdateSupplierStatus(selectedOrder.id, status)}
                        disabled={isUpdating}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          selectedOrder.supplierStatus === status
                            ? 'border-primary bg-primary-light/10 text-primary'
                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {status === 'pending' && <Clock className="w-5 h-5" />}
                        {status === 'in_production' && <Printer className="w-5 h-5" />}
                        {status === 'shipped' && <Truck className="w-5 h-5" />}
                        {status === 'delivered' && <CheckCircle className="w-5 h-5" />}
                        <span className="text-[10px] font-bold uppercase">{getSupplierStatusLabel(status)}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tracking Number */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Numéro de suivi (Tracking)</h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ex: DHL-123456789"
                        defaultValue={selectedOrder.trackingNumber}
                        onBlur={(e) => handleUpdateSupplierStatus(selectedOrder.id, selectedOrder.supplierStatus || 'pending', e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Print PDF */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Fichier d'impression (PDF)</h3>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">PDF Haute Qualité</p>
                        <p className="text-xs text-indigo-600 font-medium">Prêt pour l'imprimeur</p>
                      </div>
                    </div>
                    {selectedOrder.printPdfUrl ? (
                      <div className="flex gap-2">
                        <a
                          href={selectedOrder.printPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </a>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleGeneratePDF(selectedOrder.id)}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Générer / Uploader
                      </button>
                    )}
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Informations de livraison</h3>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Adresse</p>
                        <p className="text-sm font-bold text-gray-900">{selectedOrder.details?.address || 'Non renseignée'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pays / Ville</p>
                        <p className="text-sm font-bold text-gray-900">{selectedOrder.details?.country || 'Sénégal'} / {selectedOrder.details?.city || 'Dakar'}</p>
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
                <button
                  onClick={async () => {
                    const client = users.find(u => u.uid === selectedOrder.userId || u.uid === selectedOrder.user_id) || null;
                    await notificationService.notifyPrintingStatusChange(selectedOrder, selectedOrder.supplierStatus || 'pending', client);
                    toast.success('Notification renvoyée au client');
                    setSelectedOrder(null);
                  }}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Renvoyer la notification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
