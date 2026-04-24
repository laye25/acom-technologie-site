import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { db } from '../db/db';
import { dbService } from '../services/dbService';
import { syncService } from '../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, CheckCircle, MessageSquare, CreditCard, Clock, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Sync notifications
  useEffect(() => {
    if (user?.uid) {
      syncService.syncNotifications(user.uid);
    }
  }, [user?.uid]);

  // Read from Dexie
  const rawNotifications = useLiveQuery(() => 
    user ? db.notifications.where('userId').equals(user.uid).toArray() : []
  , [user?.uid]);

  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    return [...rawNotifications].sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'string') return new Date(val).getTime();
        if (typeof val.toMillis === 'function') return val.toMillis();
        if (val instanceof Date) return val.getTime();
        return 0;
      };
      const timeA = getTime(a.createdAt || a.created_at);
      const timeB = getTime(b.createdAt || b.created_at);
      return timeB - timeA;
    });
  }, [rawNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await dbService.notifications.markAsRead(id);
    // Local update for immediate feedback
    await db.notifications.update(id, { read: true });
  };

  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkAsRead(notification.id);
    if (notification.orderId) {
      navigate(`/orders/${notification.orderId}`);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_status': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'new_message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-xl transition-all"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-black/5 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-gray-200" />
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/5">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 ${!notification.read ? 'bg-primary-light/30' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          !notification.read ? 'bg-white shadow-sm' : 'bg-gray-50'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-xs font-black uppercase tracking-tight truncate ${
                              !notification.read ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {notification.title}
                            </p>
                            <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap ml-2">
                              {(() => {
                                let rawDate = notification.createdAt || notification.created_at;
                                const date = rawDate?.toDate ? rawDate.toDate() : (rawDate instanceof Date ? rawDate : new Date(rawDate));
                                if (!date || isNaN(date.getTime())) return '...';
                                return format(date, 'HH:mm', { locale: fr });
                              })()}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed line-clamp-2 ${
                            !notification.read ? 'text-gray-700 font-medium' : 'text-gray-400'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50/50 border-t border-black/5 text-center">
                  <button 
                    onClick={() => {
                      notifications.forEach(n => !n.read && handleMarkAsRead(n.id));
                    }}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
