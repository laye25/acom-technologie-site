import { BaseRepository } from './base.repository';
import { MerchantProduct } from '../../types';

class MerchantProductRepository extends BaseRepository<MerchantProduct> {
  protected collectionName = 'merchant_products';
}

export const merchantProductRepository = new MerchantProductRepository();
