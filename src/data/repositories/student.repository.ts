import { BaseRepository } from './base.repository';
import { SchoolStudent } from '../../types';

class StudentRepository extends BaseRepository<SchoolStudent> {
  protected collectionName = 'students';
}

export const studentRepository = new StudentRepository();
