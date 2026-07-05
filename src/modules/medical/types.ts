export interface Patient {
  id: string;
  merchantId: string;
  fullName: string;
  birthDate?: string;
  gender?: 'M' | 'F' | 'O';
  phoneNumber?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface Appointment {
  id: string;
  merchantId: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  duration?: number; // in minutes
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface Prescription {
  id: string;
  merchantId: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  date: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface MedicalKPIs {
  totalPatients: number;
  appointmentsToday: number;
  occupancyRate: number;
  monthlyRevenue: number;
}
