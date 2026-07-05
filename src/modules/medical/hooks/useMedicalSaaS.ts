import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../db/db';
import { Patient, Appointment } from '../types';

export function useMedicalSaaS(merchantId: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load patients and appointments for the merchant
  const loadData = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      // Query patients from Dexie local database filtered by merchantId
      const localPatients = await db.table('patients')
        .where('merchantId')
        .equals(merchantId)
        .toArray();

      // Query appointments from Dexie local database filtered by merchantId
      const localAppointments = await db.table('appointments')
        .where('merchantId')
        .equals(merchantId)
        .toArray();

      // Sort patients by name and appointments by date
      setPatients(
        (localPatients as Patient[]).sort((a, b) => a.fullName.localeCompare(b.fullName))
      );
      setAppointments(
        (localAppointments as Appointment[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      setError(null);
    } catch (err: any) {
      console.error('[useMedicalSaaS] Error loading local Dexie data:', err);
      setError('Erreur lors du chargement des données médicales locales.');
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save or update a patient record
  const savePatient = useCallback(async (patientData: Partial<Patient> & { id: string }) => {
    if (!merchantId) throw new Error('Merchant ID is required');

    const now = new Date().toISOString();
    const patientRecord: Patient = {
      fullName: '',
      createdAt: now,
      ...patientData,
      merchantId,
      updatedAt: now,
      syncStatus: 'pending' // Flagged for offline synchronization
    } as Patient;

    try {
      await db.table('patients').put(patientRecord);
      
      // Update local state instantly (Optimistic UI)
      setPatients(prev => {
        const index = prev.findIndex(p => p.id === patientRecord.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = patientRecord;
          return updated.sort((a, b) => a.fullName.localeCompare(b.fullName));
        } else {
          return [...prev, patientRecord].sort((a, b) => a.fullName.localeCompare(b.fullName));
        }
      });
      
      return patientRecord;
    } catch (err) {
      console.error('[useMedicalSaaS] Failed to save patient:', err);
      throw err;
    }
  }, [merchantId]);

  // Delete a patient record (soft delete pattern recommended)
  const deletePatient = useCallback(async (patientId: string) => {
    try {
      await db.table('patients').delete(patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
    } catch (err) {
      console.error('[useMedicalSaaS] Failed to delete patient:', err);
      throw err;
    }
  }, []);

  // Save or update an appointment
  const saveAppointment = useCallback(async (appointmentData: Partial<Appointment> & { id: string }) => {
    if (!merchantId) throw new Error('Merchant ID is required');

    const now = new Date().toISOString();
    const appointmentRecord: Appointment = {
      patientId: '',
      patientName: '',
      date: now.split('T')[0],
      time: '09:00',
      reason: '',
      status: 'scheduled',
      createdAt: now,
      ...appointmentData,
      merchantId,
      updatedAt: now,
      syncStatus: 'pending' // Flagged for offline synchronization
    } as Appointment;

    try {
      await db.table('appointments').put(appointmentRecord);

      // Update local state instantly (Optimistic UI)
      setAppointments(prev => {
        const index = prev.findIndex(a => a.id === appointmentRecord.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = appointmentRecord;
          return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else {
          return [...prev, appointmentRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      });

      return appointmentRecord;
    } catch (err) {
      console.error('[useMedicalSaaS] Failed to save appointment:', err);
      throw err;
    }
  }, [merchantId]);

  return {
    patients,
    appointments,
    loading,
    error,
    savePatient,
    deletePatient,
    saveAppointment,
    refetch: loadData
  };
}
