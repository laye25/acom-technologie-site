import { BaseRepository } from './base.repository';

class TeacherRepository extends BaseRepository<any> {
  protected collectionName = 'teachers';
}

export const teacherRepository = new TeacherRepository();
