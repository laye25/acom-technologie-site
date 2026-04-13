import { BaseRepository } from './base.repository';
import { MedicalAppointment } from '../../types';

class AppointmentRepository extends BaseRepository<MedicalAppointment> {
  protected collectionName = 'appointments';
}

export const appointmentRepository = new AppointmentRepository();
