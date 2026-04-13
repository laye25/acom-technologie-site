import { BaseRepository } from './base.repository';
import { MerchantSupplier } from '../../types';

class MerchantSupplierRepository extends BaseRepository<MerchantSupplier> {
  protected collectionName = 'merchant_suppliers';
}

export const merchantSupplierRepository = new MerchantSupplierRepository();
