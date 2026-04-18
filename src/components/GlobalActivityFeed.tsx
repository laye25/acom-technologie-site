import React, { useEffect, useState } from 'react';
import { activityService } from '../services/activityService';
import { Activity } from '../data/repositories/activity.repository';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ShoppingBag, 
  CreditCard, 
  AlertTriangle, 
  MessageSquare, 
  UserPlus, 
  Store,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface GlobalActivityFeedProps {
  merchantId?: string;
  limit?: number;
  className?: string;
}

export const GlobalActivityFeed: React.FC<GlobalActivityFeedProps> = ({ 
  merchantId, 
  limit = 10,
  className = ""
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    let unsubscribe: () => void;
    
    if (merchantId) {
      unsubscribe = activityService.subscribeByMerchant(merchantId, (data) => {
        setActivities(data);
        setLoading(false);
      }, limit);
    } else {
      unsubscribe = activityService.subscribeRecent((data) => {
        setActivities(data);
        setLoading(false);
      }, limit);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [merchantId, limit]);

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'order_created': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'order_updated': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'payment_received': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'stock_alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'message_sent': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'user_joined': return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'merchant_created': return <Store className="w-4 h-4 text-primary" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLink = (activity: Activity) => {
    if (activity.entityType === 'order') return `/admin?tab=orders&orderId=${activity.entityId}`;
    if (activity.entityType === 'merchant') return `/merchant/saas?id=${activity.entityId}`;
    return '#';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <AnimatePresence mode="popLayout">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm italic">
            Aucune activité récente
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-100"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  {activity.userPhoto ? (
                    <img 
                      src={activity.userPhoto} 
                      alt={activity.userName} 
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                      {activity.userName?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  {getIcon(activity.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {activity.userName}
                  </p>
                  <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                    {(() => {
                      const date = activity.createdAt?.toDate ? activity.createdAt.toDate() : (activity.createdAt instanceof Date ? activity.createdAt : new Date(activity.createdAt));
                      if (!date || isNaN(date.getTime())) return '...';
                      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
                    })()}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {activity.message}
                </p>
                
                {activity.entityId && (
                  <Link 
                    to={getLink(activity)}
                    className="inline-flex items-center mt-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
                  >
                    Voir les détails
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};
