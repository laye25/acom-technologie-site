import { BaseRepository } from './base.repository';

export class DesignRequestRepository extends BaseRepository<any> {
  protected collectionName = 'design_requests';
}

export const designRequestRepository = new DesignRequestRepository();
