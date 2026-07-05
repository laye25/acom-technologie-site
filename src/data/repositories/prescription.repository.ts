import { BaseRepository } from './base.repository';
import { MedicalPrescription } from '../../types';

class PrescriptionRepository extends BaseRepository<MedicalPrescription> {
  protected collectionName = 'prescriptions';
}

export const prescriptionRepository = new PrescriptionRepository();
