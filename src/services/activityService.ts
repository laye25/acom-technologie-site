import { activityRepository, Activity } from '../data/repositories/activity.repository';
import { notificationRepository } from '../data/repositories/notification.repository';
import { orderRepository } from '../data/repositories/order.repository';
import { merchantRepository } from '../data/repositories/merchant.repository';
import { auth } from '../firebase';
import { orderBy, limit, where } from 'firebase/firestore';

export const activityService = {
  async log(activity: Omit<Activity, 'id' | 'createdAt'>) {
    try {
      const user = auth.currentUser;
      const id = await activityRepository.create({
        ...activity,
        userId: activity.userId || user?.uid,
        userName: activity.userName || user?.displayName || 'Système',
        userPhoto: activity.userPhoto || user?.photoURL || '',
        createdAt: new Date()
      } as Activity);

      // Trigger notifications for specific events
      if (activity.type === 'order_updated' && activity.entityId) {
        const order = await orderRepository.getById(activity.entityId);
        if (order && order.userId && order.userId !== user?.uid) {
          await notificationRepository.create({
            userId: order.userId,
            title: 'Mise à jour de commande',
            message: activity.message || `Votre commande #${order.id.slice(0, 8)} a été mise à jour.`,
            type: 'order_status',
            read: false,
            orderId: order.id,
            createdAt: new Date()
          } as any);
        }
      }

      if (activity.type === 'stock_alert' && activity.merchantId) {
        const merchant = await merchantRepository.getById(activity.merchantId);
        if (merchant && merchant.ownerId) {
          await notificationRepository.create({
            userId: merchant.ownerId,
            title: 'Alerte de Stock',
            message: activity.message || 'Un de vos produits est en rupture de stock ou presque.',
            type: 'order_status', // Using order_status icon for now as it's a clock/alert
            read: false,
            createdAt: new Date()
          } as any);
        }
      }

      if (activity.type === 'message_sent' && activity.entityId) {
        const order = await orderRepository.getById(activity.entityId);
        if (order) {
          // If admin sent message, notify user. If user sent, notify admin (handled elsewhere or by specific logic)
          const targetUserId = user?.uid === order.userId ? 'admin' : order.userId; 
          // Note: 'admin' notification is usually handled by a global feed, but we can target specific admins if needed
          if (targetUserId !== 'admin' && targetUserId !== user?.uid) {
            await notificationRepository.create({
              userId: targetUserId,
              title: 'Nouveau message',
              message: activity.message || 'Vous avez reçu un nouveau message concernant votre commande.',
              type: 'new_message',
              read: false,
              orderId: order.id,
              createdAt: new Date()
            } as any);
          }
        }
      }

      return id;
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  async getRecent(limitCount = 20) {
    return activityRepository.getAll([
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  },

  async getByMerchant(merchantId: string, limitCount = 20) {
    return activityRepository.getAll([
      where('merchantId', '==', merchantId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  },

  subscribeRecent(callback: (activities: Activity[]) => void, limitCount = 20) {
    return activityRepository.subscribe('recent_activities', [
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ], callback);
  },

  subscribeByMerchant(merchantId: string, callback: (activities: Activity[]) => void, limitCount = 20) {
    return activityRepository.subscribe(`merchant_activities_${merchantId}`, [
      where('merchantId', '==', merchantId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ], callback);
  }
};
