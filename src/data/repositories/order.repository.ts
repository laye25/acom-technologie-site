import { BaseRepository } from './base.repository';
import { Order } from '../../types';

class OrderRepository extends BaseRepository<Order> {
  protected collectionName = 'orders';
}

export const orderRepository = new OrderRepository();
