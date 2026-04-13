import { BaseRepository } from './base.repository';
import { MedicalPatient } from '../../types';

class PatientRepository extends BaseRepository<MedicalPatient> {
  protected collectionName = 'patients';
}

export const patientRepository = new PatientRepository();
