import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSupabaseData, TableName } from '../../hooks/useSupabase';
import { Order, UserProfile, Service } from '../../types';
import { dbService as db } from '../../services/firebaseDbService';
import { Link } from 'react-router-dom';
import { MessageSquare, User, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SERVICES as STATIC_SERVICES } from '../../constants';

const MessageManager = () => {
  const { isAdmin, isManager } = useAuth();
  const hasAccess = isAdmin || isManager;
  
  const orderOptions = useMemo(() => ({
    tableName: 'orders' as TableName,
    order: { column: 'updatedAt' as const, ascending: false },
    skip: !hasAccess
  }), [hasAccess]);

  const serviceOptions = useMemo(() => ({
    tableName: 'services' as TableName,
    skip: !hasAccess
  }), [hasAccess]);

  const userOptions = useMemo(() => ({
    tableName: 'users' as TableName,
    skip: !hasAccess
  }), [hasAccess]);

  const { data: orders, loading: ordersLoading } = useSupabaseData<Order>(orderOptions);
  const { data: dynamicServices } = useSupabaseData<Service>(serviceOptions);
  const { data: users } = useSupabaseData<UserProfile>(userOptions);

  const allServices = useMemo(() => {
    const combined = [...STATIC_SERVICES];
    dynamicServices.forEach(ds => {
      if (!combined.find(s => s.id === ds.id)) {
        combined.push(ds);
      }
    });
    return combined;
  }, [dynamicServices]);

  if (ordersLoading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des conversations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Messagerie Client</h2>
            <p className="text-gray-500 mt-1">Gérez vos discussions par projet</p>
          </div>
          <div className="bg-primary-light text-primary px-4 py-2 rounded-full text-sm font-bold">
            {orders.length} Conversations
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => {
            const service = allServices.find(s => s.id === order.serviceId);
            const client = users.find(u => u.uid === order.userId);
            
            return (
              <Link
                key={order.id}
                to={`/chat/${order.id}`}
                className="group flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md hover:ring-1 hover:ring-black/5 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    {order.unreadByAdmin && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-gray-900">{service?.name || order.details?.projectType || 'Service Inconnu'}</h3>
                      {order.unreadByAdmin && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Nouveau
                        </span>
                      )}
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 space-x-3">
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        Client: {client?.displayName || 'Client Inconnu'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Dernière activité: {order.updatedAt?.toDate ? format(order.updatedAt.toDate(), 'dd/MM HH:mm', { locale: fr }) : '...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Ouvrir le chat
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            );
          })}

          {orders.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">Aucune conversation active pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageManager;
