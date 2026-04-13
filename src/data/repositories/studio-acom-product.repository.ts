import { BaseRepository } from './base.repository';

class StudioAcomProductRepository extends BaseRepository<any> {
  protected collectionName = 'studio_acom_products';
}

export const studioAcomProductRepository = new StudioAcomProductRepository();
