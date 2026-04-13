import { BaseRepository } from './base.repository';
import { Design } from '../../types';

class DesignRepository extends BaseRepository<Design> {
  protected collectionName = 'designs';
}

export const designRepository = new DesignRepository();
