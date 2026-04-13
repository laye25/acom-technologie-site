import { BaseRepository } from './base.repository';
import { Merchant } from '../../types';

class MerchantRepository extends BaseRepository<Merchant> {
  protected collectionName = 'merchants';
}

export const merchantRepository = new MerchantRepository();
