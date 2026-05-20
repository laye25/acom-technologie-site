import { BaseRepository } from './base.repository';
import { Category } from '../../types';

class MerchantCategoryRepository extends BaseRepository<Category> {
  protected collectionName = 'merchant_categories';
}

export const merchantCategoryRepository = new MerchantCategoryRepository();
