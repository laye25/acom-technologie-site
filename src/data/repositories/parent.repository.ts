import { BaseRepository } from './base.repository';

class ParentRepository extends BaseRepository<any> {
  protected collectionName = 'parents';
}

export const parentRepository = new ParentRepository();
