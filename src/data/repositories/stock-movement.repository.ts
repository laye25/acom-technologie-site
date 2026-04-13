import { BaseRepository } from './base.repository';
import { StockMovement } from '../../types';

class StockMovementRepository extends BaseRepository<StockMovement> {
  protected collectionName = 'stock_movements';
}

export const stockMovementRepository = new StockMovementRepository();
