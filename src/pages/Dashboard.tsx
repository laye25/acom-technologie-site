import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { Order, Service, UserProfile, OrderStatus, Design } from '../types';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { motion } from 'motion/react';
import { ShoppingBag, Clock, CheckCircle, Package, Send, FileText, MessageSquare, User, Sparkles, Palette, Trash2, ExternalLink, Plus } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { firestoreService } from '../services/firestoreService';
import { NotificationCenter } from '../components/NotificationCenter';
import { getOrderDiscountedTotal } from '../lib/promotions';
import { OptimizedImage } from '../components/OptimizedImage';

const Dashboard = () => {
  const { user, profile, loading: authLoading, resetPassword, signOut, isManager, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'orders' | 'messages' | 'designs' | 'profile') || 'orders';
  const [activeTab, setActiveTab] = React.useState<'orders' | 'messages' | 'designs' | 'profile'>(initialTab);
  const navigate = useNavigate();
  const [resetSent, setResetSent] = React.useState(false);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'messages' || tab === 'orders' || tab === 'profile') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);
  
  const filter = useMemo(() => {
    if (!user) return undefined;
    if (isManager || isAdmin) return undefined; // Managers and admins see all orders
    return { column: 'user_id', value: user.uid };
  }, [user, isManager, isAdmin]);
  
  const { data: rawOrders, loading, error: ordersError } = useFirestoreData<Order>({
    tableName: 'orders',
    where: (isManager || isAdmin) ? undefined : [['user_id', '==', user?.uid]],
    order: (isManager || isAdmin) ? { column: 'created_at', direction: 'desc' } : undefined,
    limit: 50,
    realtime: true,
    skip: !user
  });

  const { data: dynamicServices, loading: servicesLoading } = useFirestoreData<Service>({
    tableName: 'services',
    limit: 50,
    realtime: true
  });

  const allServices = useMemo(() => {
    const combined = [...STATIC_SERVICES];
    dynamicServices.forEach(ds => {
      if (!combined.find(s => s.id === ds.id)) {
        combined.push(ds);
      }
    });
    return combined;
  }, [dynamicServices]);

  const orders = useMemo(() => {
    if (!rawOrders || rawOrders.length === 0) return [];
    return [...rawOrders].sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'string') return new Date(val).getTime();
        if (typeof val.toMillis === 'function') return val.toMillis();
        if (val instanceof Date) return val.getTime();
        return 0;
      };
      
      const timeA = getTime(a.updated_at || a.created_at || a.updatedAt || a.createdAt);
      const timeB = getTime(b.updated_at || b.created_at || b.updatedAt || b.createdAt);
      return timeB - timeA;
    });
  }, [rawOrders]);

  const { data: users } = useFirestoreData<UserProfile>({
    tableName: 'users',
    limit: 50,
    realtime: true,
    skip: !(isManager || isAdmin)
  });

  const { data: userDesigns, loading: designsLoading } = useFirestoreData<Design>({
    tableName: 'designs',
    where: [['user_id', '==', user?.uid]],
    limit: 50,
    realtime: true,
    skip: !user
  });

  const getStatusLabel = (status: string, clientAccepted?: boolean, type?: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return (clientAccepted || type === 'pos') ? 'Confirmée' : 'Attente Client';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-primary-light text-primary';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'delivered': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'in_progress': return Package;
      case 'completed': return CheckCircle;
      case 'delivered': return Send;
      default: return Clock;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '...';
    const d = typeof date === 'string' ? new Date(date) : (date.toDate ? date.toDate() : date);
    return format(d, 'dd MMMM yyyy', { locale: fr });
  };

  if (authLoading || (loading && orders.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Clock className="animate-spin text-primary w-10 h-10 mb-4" />
        <p className="text-gray-500 font-medium">Chargement de votre session...</p>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-12 inline-block max-w-lg">
          <Clock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-8">
            Nous n'avons pas pu récupérer vos commandes. Cela peut être dû à un problème de connexion ou de permissions.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-32 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex items-center justify-between w-full md:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isAdmin ? 'Espace Administrateur' : isManager ? 'Espace Gestionnaire' : 'Mon Espace Client'}
          </h1>
          <div className="md:hidden">
            <NotificationCenter />
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="hidden md:block">
            <NotificationCenter />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-2xl flex-grow md:flex-grow-0 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('orders')}
            className={`flex-1 md:flex-none flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'orders' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Commandes
          </button>
          <button
            onClick={() => setActiveTab('designs')}
            className={`flex-1 md:flex-none flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'designs' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Palette className="w-4 h-4 mr-2" />
            Mes Designs
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 md:flex-none flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'messages' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 md:flex-none flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'profile' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Profil
          </button>
        </div>
      </div>
    </div>

    {activeTab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/5 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune commande pour le moment</h2>
            <p className="text-gray-500 mb-8">Découvrez nos services et lancez votre premier projet.</p>
            <Link to="/" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-all">
              Voir les services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => {
              const service = allServices.find(s => s.id === order.serviceId);
              const client = users.find(u => u.uid === order.userId || u.uid === order.user_id);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden"
                >
                  <div className="p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center space-x-4 sm:space-x-6">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {service?.image ? (
                          <OptimizedImage 
                            src={service.image} 
                            alt="" 
                            width={200}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">{service?.name || order.details?.projectType || 'Service Inconnu'}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status, order.clientAccepted, order.details?.type)}
                          </span>
                          {order.paid ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-100 text-emerald-700">
                              Payé
                            </span>
                          ) : order.depositPaid ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-amber-100 text-amber-700">
                              Acompte Payé
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-gray-400">
                            Commandé le {formatDate(order.created_at || order.createdAt)}
                          </p>
                          { (isManager || isAdmin) && (
                            <p className="text-xs font-bold text-primary flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              Client: {client?.displayName || 'Inconnu'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-4">
                      <div className="text-left md:text-right md:mr-4">
                        <span className="text-xs text-gray-400 block uppercase font-bold tracking-tighter">Total</span>
                        <div className="flex flex-col items-start md:items-end">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">{(order.totalPrice || 0).toLocaleString()}</span>
                            <span className="text-lg font-black text-gray-900">
                              {getOrderDiscountedTotal(order).toLocaleString()} FCFA
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-primary bg-primary-light/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              -{order.discountPercentage || 0}% Offre
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              Acompte 50%
                            </span>
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              Solde 50%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/chat/${order.id}`}
                          className={`p-3 rounded-2xl transition-all relative ${order.unreadByClient ? 'bg-primary-light text-primary' : 'bg-gray-50 text-gray-600 hover:bg-primary-light hover:text-primary'}`}
                          title="Discuter"
                        >
                          <MessageSquare className="w-5 h-5" />
                          {order.unreadByClient && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                          )}
                        </Link>
                        <Link
                          to={`/quote/${order.id}`}
                          className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-primary-light hover:text-primary transition-all"
                          title="Voir le devis"
                        >
                          <FileText className="w-5 h-5" />
                        </Link>
                        {(order.aiDraft || order.serviceId === 'custom') && (
                          <Link
                            to={`/order-details/${order.id}#draft`}
                            className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"
                            title="Projet"
                          >
                            <Sparkles className="w-5 h-5" />
                          </Link>
                        )}
                        <Link
                          to={`/order-details/${order.id}`}
                          className="px-4 sm:px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-sm text-sm sm:text-base"
                        >
                          Détails
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-1.5 bg-gray-50 w-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: order.status === 'delivered' ? '100%' : order.status === 'completed' ? '80%' : order.status === 'in_progress' ? '50%' : '20%' }}
                      className="h-full bg-primary"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : activeTab === 'designs' ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Mes Créations</h2>
            <Link 
              to="/design-editor" 
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Design
            </Link>
          </div>

          {designsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Clock className="animate-spin text-primary w-8 h-8 mb-4" />
              <p className="text-gray-500">Chargement de vos designs...</p>
            </div>
          ) : userDesigns.length === 0 ? (
            <div className="bg-white rounded-3xl border border-black/5 p-12 text-center">
              <Palette className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun design enregistré</h2>
              <p className="text-gray-500 mb-8">Commencez à créer vos propres supports de communication.</p>
              <Link to="/design-editor" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-all">
                Ouvrir l'éditeur
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDesigns.map((design) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden group hover:shadow-xl transition-all"
                >
                  <div className="aspect-[600/350] bg-gray-50 relative overflow-hidden">
                    {design.preview ? (
                      <OptimizedImage src={design.preview} alt={design.name} width={600} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Palette className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                      <button 
                        onClick={() => navigate('/design-editor', { state: { design } })}
                        className="p-3 bg-white text-primary rounded-full hover:scale-110 transition-transform shadow-lg"
                        title="Modifier"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate max-w-[150px]">{design.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                        Modifié le {formatDate(design.updated_at || design.updatedAt)}
                      </p>
                    </div>
                    <button 
                      onClick={async () => {
                        if (window.confirm('Supprimer ce design ?')) {
                          try {
                            await firestoreService.delete('designs', design.id);
                            toast.success('Design supprimé');
                          } catch (err) {
                            console.error(err);
                            toast.error('Erreur lors de la suppression');
                          }
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'messages' ? (
        <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => {
              const service = allServices.find(s => s.id === order.serviceId);
              
              return (
                <Link
                  key={order.id}
                  to={`/chat/${order.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md hover:ring-1 hover:ring-black/5 transition-all gap-4"
                >
                    <div className="flex items-start sm:items-center space-x-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative">
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        {order.unreadByClient && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">{service?.name || order.details?.projectType || 'Service Inconnu'}</h3>
                          <div className="flex flex-wrap gap-1">
                            {order.unreadByClient && (
                              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                                Nouveau
                              </span>
                            )}
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                              #{order.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center text-xs text-gray-400 gap-x-3 gap-y-1">
                          <span className="flex items-center whitespace-nowrap">
                            <User className="w-3 h-3 mr-1" />
                            Support Acom
                          </span>
                          <span className="flex items-center whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(order.updated_at || order.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  
                  <div className="flex items-center text-primary font-bold text-sm sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                    Ouvrir
                    <Send className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              );
            })}

            {orders.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">Aucune discussion active pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl border border-black/5 p-8 sm:p-12 shadow-sm">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-24 h-24 bg-primary-light rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                {profile?.photoURL ? (
                  <OptimizedImage src={profile.photoURL} alt="" width={200} className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.displayName || 'Utilisateur'}</h2>
              <p className="text-gray-500 font-medium">{user?.email}</p>
              <div className="mt-4 px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                {profile?.role === 'admin' ? 'Administrateur' : 'Client'}
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-2xl border border-black/5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Sécurité du compte</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Mot de passe</p>
                    <p className="text-xs text-gray-500 mt-1">Réinitialisez votre mot de passe par email</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (user?.email) {
                        try {
                          await resetPassword(user.email);
                          setResetSent(true);
                          setTimeout(() => setResetSent(false), 5000);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                    disabled={resetSent}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      resetSent 
                        ? 'bg-emerald-100 text-emerald-600 cursor-default' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {resetSent ? 'Email envoyé !' : 'Réinitialiser'}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4">Zone de danger</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-red-900">Déconnexion</p>
                    <p className="text-xs text-red-600/60 mt-1">Fermer votre session actuelle</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
