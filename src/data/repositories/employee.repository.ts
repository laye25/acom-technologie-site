import { BaseRepository } from './base.repository';
import { HREmployee } from '../../types';

class EmployeeRepository extends BaseRepository<HREmployee> {
  protected collectionName = 'employees';
}

export const employeeRepository = new EmployeeRepository();
