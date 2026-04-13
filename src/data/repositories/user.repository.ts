import { BaseRepository } from './base.repository';
import { UserProfile } from '../../types';

class UserRepository extends BaseRepository<UserProfile> {
  protected collectionName = 'users';
}

export const userRepository = new UserRepository();
