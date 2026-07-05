export interface Student {
  id: string;
  merchantId: string;
  fullName: string;
  classId: string;
  className?: string;
  birthDate?: string;
  gender?: 'M' | 'F';
  address?: string;
  parentPhone?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface SchoolClass {
  id: string;
  merchantId: string;
  name: string;
  level?: string;
  teacherId?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface Subject {
  id: string;
  merchantId: string;
  name: string;
  coefficient?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  merchantId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  subjects?: string[]; // list of subject IDs
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  merchantId: string;
  studentId: string;
  studentName?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  value: number; // grade value (e.g. out of 20)
  term: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3' | 'Semestre 1' | 'Semestre 2';
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface Attendance {
  id: string;
  merchantId: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  reason?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending';
}
