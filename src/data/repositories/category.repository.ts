import { BaseRepository } from './base.repository';
import { Category } from '../models/category.model';

class CategoryRepository extends BaseRepository<Category> {
  protected collectionName = 'studio_acom_categories';
}

export const categoryRepository = new CategoryRepository();
