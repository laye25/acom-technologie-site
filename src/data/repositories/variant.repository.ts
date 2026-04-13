import { BaseRepository } from './base.repository';

class VariantRepository extends BaseRepository<any> {
  protected collectionName = 'variants';
}

export const variantRepository = new VariantRepository();
