import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { Student, SchoolClass, Grade, Attendance } from '../types';

export function useSchoolSaaS(merchantId: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load students, classes, and grades from Dexie
  const loadData = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const localStudents = await db.table('students')
        .where('merchantId')
        .equals(merchantId)
        .toArray();

      const localClasses = await db.table('classes')
        .where('merchantId')
        .equals(merchantId)
        .toArray();

      const localGrades = await db.table('grades')
        .where('merchantId')
        .equals(merchantId)
        .toArray();

      setStudents(
        (localStudents as Student[]).sort((a, b) => a.fullName.localeCompare(b.fullName))
      );
      setClasses(
        (localClasses as SchoolClass[]).sort((a, b) => a.name.localeCompare(b.name))
      );
      setGrades(
        (localGrades as Grade[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      setError(null);
    } catch (err: any) {
      console.error('[useSchoolSaaS] Error loading school Dexie data:', err);
      setError('Erreur lors du chargement des données scolaires locales.');
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save or update student record
  const saveStudent = useCallback(async (studentData: Partial<Student> & { id: string }) => {
    if (!merchantId) throw new Error('Merchant ID is required');

    const now = new Date().toISOString();
    const studentRecord: Student = {
      fullName: '',
      classId: '',
      createdAt: now,
      ...studentData,
      merchantId,
      updatedAt: now,
      syncStatus: 'pending'
    } as Student;

    try {
      await db.table('students').put(studentRecord);

      setStudents(prev => {
        const index = prev.findIndex(s => s.id === studentRecord.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = studentRecord;
          return updated.sort((a, b) => a.fullName.localeCompare(b.fullName));
        } else {
          return [...prev, studentRecord].sort((a, b) => a.fullName.localeCompare(b.fullName));
        }
      });

      return studentRecord;
    } catch (err) {
      console.error('[useSchoolSaaS] Failed to save student:', err);
      throw err;
    }
  }, [merchantId]);

  // Save or update class record
  const saveClass = useCallback(async (classData: Partial<SchoolClass> & { id: string }) => {
    if (!merchantId) throw new Error('Merchant ID is required');

    const now = new Date().toISOString();
    const classRecord: SchoolClass = {
      name: '',
      createdAt: now,
      ...classData,
      merchantId,
      updatedAt: now,
      syncStatus: 'pending'
    } as SchoolClass;

    try {
      await db.table('classes').put(classRecord);

      setClasses(prev => {
        const index = prev.findIndex(c => c.id === classRecord.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = classRecord;
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          return [...prev, classRecord].sort((a, b) => a.name.localeCompare(b.name));
        }
      });

      return classRecord;
    } catch (err) {
      console.error('[useSchoolSaaS] Failed to save class:', err);
      throw err;
    }
  }, [merchantId]);

  // Save or update student grades
  const saveGrade = useCallback(async (gradeData: Partial<Grade> & { id: string }) => {
    if (!merchantId) throw new Error('Merchant ID is required');

    const now = new Date().toISOString();
    const gradeRecord: Grade = {
      studentId: '',
      classId: '',
      subjectId: '',
      teacherId: '',
      value: 0,
      term: 'Trimestre 1',
      date: now.split('T')[0],
      createdAt: now,
      ...gradeData,
      merchantId,
      updatedAt: now,
      syncStatus: 'pending'
    } as Grade;

    try {
      await db.table('grades').put(gradeRecord);

      setGrades(prev => {
        const index = prev.findIndex(g => g.id === gradeRecord.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = gradeRecord;
          return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else {
          return [...prev, gradeRecord].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      });

      return gradeRecord;
    } catch (err) {
      console.error('[useSchoolSaaS] Failed to save grade:', err);
      throw err;
    }
  }, [merchantId]);

  return {
    students,
    classes,
    grades,
    loading,
    error,
    saveStudent,
    saveClass,
    saveGrade,
    refetch: loadData
  };
}

export function useSchoolLiveTeacherData(merchantId: string) {
  const dbClasses = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchantId || '').toArray()
  , [merchantId]) || [];

  const dbStudents = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchantId || '').toArray()
  , [merchantId]) || [];

  const storedGrades = useLiveQuery(() => 
    db.grades?.where('merchantId').equals(merchantId || '').toArray()
  , [merchantId]) || [];

  return {
    classes: dbClasses as SchoolClass[],
    students: dbStudents as Student[],
    grades: storedGrades as Grade[]
  };
}

export function useSchoolLiveStudentProfile(activeStudentId: string | null) {
  return useLiveQuery(async () => {
    if (!activeStudentId) return null;
    const student = await db.students?.where('id').equals(activeStudentId).first();
    if (!student) return null;
    return {
      id: student.id,
      name: `${student.firstName || ''} ${student.lastName || ''}`,
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      phone: student.phone || '',
      studentUsername: student.studentUsername || student.username || '',
      studentPassword: student.studentPassword || student.password || '',
      student: student
    };
  }, [activeStudentId]);
}

export function useSchoolLiveParentProfile(activeParentId: string | null) {
  return useLiveQuery(async () => {
    if (!activeParentId) return null;
    const allStudents = await db.students?.toArray() || [];
    const matchingStudents = allStudents.filter((student: any) => {
      const cleanActiveParent = activeParentId.replace(/[^0-9]/g, '');
      if (!cleanActiveParent) return false;

      const phonesToCheck = [
        student.fatherPhone,
        student.motherPhone,
        student.guardianPhone,
        student.parentContact
      ].filter(Boolean);

      return phonesToCheck.some((phone: string) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (!cleanPhone) return false;
        if (cleanPhone === cleanActiveParent) return true;
        if (cleanPhone.slice(-9) === cleanActiveParent.slice(-9) && cleanActiveParent.slice(-9).length >= 8) return true;
        return false;
      });
    });

    let parentName = '';
    let customUsername = activeParentId;
    let customPassword = '';
    let dbParent = await db.parents?.where('phone').equals(activeParentId).first();
    if (!dbParent) {
      dbParent = await db.parents?.where('username').equals(activeParentId).first();
    }
    if (!dbParent) {
      dbParent = await db.parents?.where('id').equals(activeParentId).first();
    }

    if (dbParent) {
      parentName = dbParent.name || '';
      customUsername = dbParent.username || activeParentId;
      customPassword = dbParent.password || dbParent.pin || '';
    }

    if (!parentName && matchingStudents.length > 0) {
      const exemplar = matchingStudents[0];
      const parentChoice = exemplar.primaryParentContact || 'father';
      if (parentChoice === 'father') parentName = exemplar.fatherName || `Père de ${exemplar.firstName}`;
      else if (parentChoice === 'mother') parentName = exemplar.motherName || `Mère de ${exemplar.firstName}`;
      else parentName = exemplar.guardianName || `Tuteur de ${exemplar.firstName}`;
    }

    if (!parentName) {
      parentName = "Parent d'élève";
    }

    const parts = parentName.trim().split(' ');
    const firstStudent = matchingStudents[0];

    return {
      id: activeParentId,
      name: parentName,
      firstName: parts[0] || '?',
      lastName: parts.slice(1).join(' ') || '',
      phone: dbParent?.phone || (firstStudent?.parentContact || firstStudent?.fatherPhone || activeParentId),
      username: customUsername,
      password: customPassword,
      studentsAmount: matchingStudents.length,
      childrenNames: matchingStudents.map(s => `${s.firstName || s.name} ${s.lastName || ''}`),
      children: matchingStudents
    };
  }, [activeParentId]);
}
