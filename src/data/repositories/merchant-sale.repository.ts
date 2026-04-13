import { BaseRepository } from './base.repository';
import { MerchantSale } from '../../types';

class MerchantSaleRepository extends BaseRepository<MerchantSale> {
  protected collectionName = 'merchant_sales';
}

export const merchantSaleRepository = new MerchantSaleRepository();
