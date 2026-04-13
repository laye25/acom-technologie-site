import { BaseRepository } from './base.repository';
import { Service } from '../../types';

class ServiceRepository extends BaseRepository<Service> {
  protected collectionName = 'services';
}

export const serviceRepository = new ServiceRepository();
