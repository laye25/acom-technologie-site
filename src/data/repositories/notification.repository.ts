import { BaseRepository } from './base.repository';
import { Notification } from '../../types';

class NotificationRepository extends BaseRepository<Notification> {
  protected collectionName = 'notifications';
}

export const notificationRepository = new NotificationRepository();
