import { db, setRemoteSyncState } from '../db/db';
import { toast } from 'react-hot-toast';

export const injectMockDataForTesting = async (merchantId: string, studentId: string, classId: string, className: string) => {
  try {
    setRemoteSyncState(true);
    
    const dirtyClassId = `  ${classId.toUpperCase()}  `;
    const dirtyClassName = `Classe : ${className} `;
    const dirtyStudentId = ` ${studentId} `;

    // Create Mock Subject
    const mockSubjectId1 = crypto.randomUUID();
    const mockSubjectId2 = crypto.randomUUID();

    await db.subjects.put({
      id: mockSubjectId1,
      merchantId,
      name: 'Littérature Moderne',
      updatedAt: new Date().toISOString()
    });

    await db.subjects.put({
      id: mockSubjectId2,
      merchantId,
      name: 'Mathématiques Appliquées',
      updatedAt: new Date().toISOString()
    });

    // Create Grade
    await db.grades.put({
      id: crypto.randomUUID(),
      merchantId,
      studentId: dirtyStudentId,
      classId: dirtyClassId,
      subjectId: mockSubjectId1,
      term: 'Trimestre 1',
      devoir1: 15,
      devoir2: 17,
      compo: 16,
      updatedAt: new Date().toISOString()
    });

    await db.grades.put({
      id: crypto.randomUUID(),
      merchantId,
      studentId: dirtyStudentId,
      classId: dirtyClassId,
      subjectId: mockSubjectId2,
      term: 'Trimestre 1',
      devoir1: 18,
      compo: 19,
      updatedAt: new Date().toISOString()
    });

    // Create Attendance
    await db.attendance.put({
      id: crypto.randomUUID(),
      merchantId,
      studentId: dirtyStudentId,
      classId: dirtyClassId,
      date: new Date().toISOString().split('T')[0],
      status: 'Retard',
      duration: 15,
      reason: 'Bouchons sur la route',
      updatedAt: new Date().toISOString()
    });

    // Create Homeworks
    await db.homeworks.put({
      id: crypto.randomUUID(),
      merchantId,
      classId: dirtyClassId,
      class: dirtyClassName,
      subjectId: mockSubjectId1,
      title: 'Lecture du chapitre 5 et résumé de 2 pages',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // +2 days
      updatedAt: new Date().toISOString()
    });

    // Create Schedules (One for today, one for tomorrow)
    const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const today = new Date().getDay();
    const dNameToday = daysMap[today] === 'Dimanche' ? 'Lundi' : daysMap[today];
    
    await db.schedules.put({
      id: crypto.randomUUID(),
      merchantId,
      classId: dirtyClassId,
      class: dirtyClassName,
      dayOfWeek: dNameToday,
      subjectId: mockSubjectId2,
      startTime: '08:00',
      endTime: '10:00',
      room: 'Salle B12',
      updatedAt: new Date().toISOString()
    });

    await db.schedules.put({
      id: crypto.randomUUID(),
      merchantId,
      classId: dirtyClassId,
      class: dirtyClassName,
      dayOfWeek: dNameToday,
      subjectId: mockSubjectId1,
      startTime: '10:30',
      endTime: '12:30',
      room: 'Salle C1',
      updatedAt: new Date().toISOString()
    });

    toast.success('Données locales (dirty mocks) injectées !', { icon: "🧪", duration: 4000 });

  } catch(e) {
    console.error('Failed to inject mock data:', e);
    toast.error('Erreur lors de l\'injection des données de test.');
  } finally {
    setRemoteSyncState(false);
  }
}
