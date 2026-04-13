import { BaseRepository } from './base.repository';

export interface Activity {
  id: string;
  userId?: string;
  userName?: string;
  userPhoto?: string;
  type: 'order_created' | 'order_updated' | 'payment_received' | 'stock_alert' | 'message_sent' | 'user_joined' | 'merchant_created';
  entityId?: string;
  entityType?: string;
  merchantId?: string;
  message?: string;
  metadata?: any;
  createdAt: any;
}

class ActivityRepository extends BaseRepository<Activity> {
  protected collectionName = 'activities';
}

export const activityRepository = new ActivityRepository();
