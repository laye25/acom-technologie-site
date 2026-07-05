import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../../context/AuthContext';
import { syncService } from '../../../services/syncService';
import { ScheduleManager } from '../../../components/admin/ScheduleManager';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { 
  Store, Package, ShoppingCart, PieChart, Plus, Trash2, Trash2 as Trash,
  Edit2, Search, Loader2, Save, X, TrendingUp, Download, Eye,
  DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle, Info,
  BarChart3, Settings, User, Phone, Mail, MapPin,
  Calculator, Receipt, CreditCard, Smartphone, Banknote,
  Clock, CheckCircle, TrendingDown, ArrowRight, FileText, Truck,
  Wrench, HardHat, Car, Users, GraduationCap, Stethoscope, Calendar, MessageSquare,
  Briefcase, ClipboardList, ClipboardCheck, UserPlus, Building2, Check, Zap, Minus,
  Printer, HardDrive, Database, RefreshCw, Upload, Cpu, Terminal,
  Lock as LockIcon, GitBranch, Github, Monitor, MonitorUp, Rocket,
  Filter, SlidersHorizontal, ArrowUpDown, Tag, Scissors, Palette, ScanLine, PenTool, BookOpen,
  ShieldAlert, Heart, FileCheck, Fingerprint, Sparkles, LayoutDashboard, Key, Bus, Utensils, WashingMachine, ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import { 
  format, subDays, startOfDay, endOfDay, eachDayOfInterval, 
  startOfYear, eachMonthOfInterval, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, getDay, addDays, startOfWeek, endOfWeek,
  addMonths
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Merchant } from '../../../types';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';

export const TeacherGradePortal = ({ merchant }: { merchant: Merchant }) => {
  const { user } = useAuth();
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState(merchant.academicPeriods?.[0] || 'Trimestre 1');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Read data from IndexedDB
  const classes = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const students = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const teachers = useLiveQuery(() => 
    db.teachers?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const storedGrades = useLiveQuery(() => 
    db.grades?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // Local state map for fast editing
  const [gradesMap, setGradesMap] = useState<Record<string, { devoir1: string, devoir2: string, compo: string }>>({});
  const [hasInitializedTeacher, setHasInitializedTeacher] = useState(false);
  const [isSyncingGrades, setIsSyncingGrades] = useState(false);

  // Pull latest data (classes, students, teachers, grades, etc.) using safe delta sync on mount
  useEffect(() => {
    if (merchant.id) {
      syncService.syncSchoolPortalData(merchant.id, false)
        .catch(err => console.error("Auto-sync school data error:", err));
    }
  }, [merchant.id]);

  const handleForceSync = async () => {
    if (!merchant.id) return;
    setIsSyncingGrades(true);
    try {
      // Force sync true bypasses throttles and retrieves any newly added notes/grades/classes directly from the remote database
      await syncService.syncSchoolPortalData(merchant.id, true);
      toast.success("Synchronisation forcée réussie : Les notes et données existantes sont à jour !");
    } catch (err) {
      console.error("Force sync grades failed:", err);
      toast.error("Erreur de synchronisation à distance.");
    } finally {
      setIsSyncingGrades(false);
    }
  };

  // 1. Resolve selected teacher details
  const selectedTeacherObj = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  // 2. Class options: Always provide all system classes for full offline capability
  const availableClasses = classes;

  // Filtered list of teachers for the selected class (including primary and extra classes)
  const filteredTeachersForClass = useMemo(() => {
    if (!selectedClass) return teachers;
    const currentClassObj = classes.find(c => c.id === selectedClass);
    return teachers.filter(t => {
      const isPrimaryClass = t.classId === selectedClass || 
        (currentClassObj?.name && t.className?.trim().toLowerCase() === currentClassObj.name.trim().toLowerCase());
        
      const isExtraClass = Array.isArray(t.extraClasses) && t.extraClasses.some((cl: any) => {
        if (!cl) return false;
        const clStr = cl.toString().trim().toLowerCase();
        return clStr === selectedClass.trim().toLowerCase() || 
          (currentClassObj?.name && clStr === currentClassObj.name.trim().toLowerCase());
      });

      return isPrimaryClass || isExtraClass;
    });
  }, [teachers, selectedClass, classes]);

  // 3. Subjects list filtered: based on class subjects and selected teacher's focus subject
  const availableSubjects = useMemo(() => {
    if (!selectedClass) return [];
    const currentClassObj = classes.find(c => c.id === selectedClass);
    
    let baseSubjects: string[] = [];
    if (currentClassObj?.subjects && currentClassObj.subjects.length > 0) {
      baseSubjects = currentClassObj.subjects;
    } else {
      baseSubjects = ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Histoire-Géographie', 'Anglais', 'Éducation Physique'];
    }

    if (!selectedTeacherId || !selectedTeacherObj) return baseSubjects;

    if (selectedTeacherObj.subject) {
      const set = new Set<string>();
      set.add(selectedTeacherObj.subject);
      baseSubjects.forEach(s => set.add(s));
      return Array.from(set);
    }
    return baseSubjects;
  }, [classes, selectedClass, selectedTeacherId, selectedTeacherObj]);

  // Format class name beautifully and prevent duplicate "Classe : " prefixes
  const formatClassName = (name: string) => {
    if (!name) return '';
    const clean = name.replace(/^classe\s*:\s*/i, '');
    return `Classe : ${clean}`;
  };

  // Synchronized bidirectional handlers
  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (teacherId) {
      const teacherObj = teachers.find(t => t.id === teacherId);
      if (teacherObj) {
        if (teacherObj.subject) {
          setSelectedSubject(teacherObj.subject);
        }
        // Match a primary or extra class
        const teacherClass = classes.find(c => 
          c.id === teacherObj.classId || 
          c.name === teacherObj.className
        ) || (teacherObj.extraClasses && classes.find(c => teacherObj.extraClasses.includes(c.id) || teacherObj.extraClasses.includes(c.name)));

        if (teacherClass) {
          setSelectedClass(teacherClass.id);
        }
      }
    }
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    if (subject) {
      const classObj = classes.find(c => c.id === selectedClass);
      // Filter teachers by class first
      const classTeachers = teachers.filter(t => {
        const isPrimaryClass = t.classId === selectedClass || 
          (classObj?.name && t.className?.trim().toLowerCase() === classObj.name.trim().toLowerCase());
          
        const isExtraClass = Array.isArray(t.extraClasses) && t.extraClasses.some((cl: any) => {
          if (!cl) return false;
          const clStr = cl.toString().trim().toLowerCase();
          return clStr === selectedClass.trim().toLowerCase() || 
            (classObj?.name && clStr === classObj.name.trim().toLowerCase());
        });

        return isPrimaryClass || isExtraClass;
      });

      // Find teacher teaching this subject in the class
      const matchingTeacher = classTeachers.find(t => 
        (t.subject || '').trim().toLowerCase() === subject.trim().toLowerCase()
      );

      if (matchingTeacher) {
        setSelectedTeacherId(matchingTeacher.id);
      } else {
        setSelectedTeacherId(''); // Non attribué
      }
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    if (classId) {
      const classObj = classes.find(c => c.id === classId);
      
      // Filter teachers by this class first
      const classTeachers = teachers.filter(t => {
        const isPrimaryClass = t.classId === classId || 
          (classObj?.name && t.className?.trim().toLowerCase() === classObj.name.trim().toLowerCase());
          
        const isExtraClass = Array.isArray(t.extraClasses) && t.extraClasses.some((cl: any) => {
          if (!cl) return false;
          const clStr = cl.toString().trim().toLowerCase();
          return clStr === classId.trim().toLowerCase() || 
            (classObj?.name && clStr === classObj.name.trim().toLowerCase());
        });

        return isPrimaryClass || isExtraClass;
      });

      // Find a teacher assigned to this class and preferably teaching the current subject, or any subject
      const matchingTeacher = classTeachers.find(t => 
        selectedSubject && (t.subject || '').trim().toLowerCase() === selectedSubject.trim().toLowerCase()
      ) || classTeachers[0];

      if (matchingTeacher) {
        setSelectedTeacherId(matchingTeacher.id);
        if (matchingTeacher.subject) {
          setSelectedSubject(matchingTeacher.subject);
        }
      } else {
        setSelectedTeacherId(''); // Non attribué
      }
    }
  };

  // Populate dynamic default teacher once on initial load to avoid overriding manual selection of "Saisie Directe Admin"
  useEffect(() => {
    if (teachers.length > 0 && !hasInitializedTeacher) {
      setSelectedTeacherId(teachers[0].id);
      setHasInitializedTeacher(true);
    }
  }, [teachers, hasInitializedTeacher]);

  // Handle cascading dropdown state reset on class change
  useEffect(() => {
    if (availableClasses.length > 0) {
      const isStillAvailable = availableClasses.some(c => c.id === selectedClass);
      if (!selectedClass || !isStillAvailable) {
        setSelectedClass(availableClasses[0].id);
      }
    } else {
      setSelectedClass('');
    }
  }, [availableClasses, selectedClass]);

  // Handle cascading dropdown state reset on subject change
  useEffect(() => {
    if (selectedClass) {
      const isStillAvailable = availableSubjects.includes(selectedSubject);
      if (!selectedSubject || !isStillAvailable) {
        setSelectedSubject(availableSubjects[0] || '');
      }
    } else {
      setSelectedSubject('');
    }
  }, [selectedClass, availableSubjects, selectedSubject]);

  // Filter student records enrolled in the active selected class with highly robust matching
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const currentClassObj = classes.find(c => c.id === selectedClass);
    return students.filter((s: any) => {
      const studentClassVal = (s.classId || s.class_id || s.class || s.grade || '').toString().trim().toLowerCase();
      const selClassId = selectedClass.trim().toLowerCase();
      const selClassName = currentClassObj ? currentClassObj.name.trim().toLowerCase() : '';
      
      const cleanClassVal = studentClassVal.replace(/^classe\s*:\s*/, '');
      const cleanClassName = selClassName.replace(/^classe\s*:\s*/, '');
      
      return studentClassVal === selClassId || 
             (selClassName && studentClassVal === selClassName) ||
             (cleanClassName && cleanClassVal === cleanClassName);
    });
  }, [students, selectedClass, classes]);

  useEffect(() => {
    // Populate form data maps from historical grade inputs synchronised from the database with maximum robustness
    const initial: Record<string, { devoir1: string, devoir2: string, compo: string }> = {};
    classStudents.forEach((s: any) => {
      const existing = storedGrades.find(g => {
        const gStudent = (g.studentId || g.student_id || '').toString().trim().toLowerCase();
        const gSubject = (g.subjectId || g.subject_id || g.subject || '').toString().trim().toLowerCase();
        const gTerm = (g.term || g.periode || '').toString().trim().toLowerCase();
        
        const targetStudent = s.id.toString().trim().toLowerCase();
        const targetSubject = (selectedSubject || '').toString().trim().toLowerCase();
        const targetTerm = (term || '').toString().trim().toLowerCase();
        
        return gStudent === targetStudent && gSubject === targetSubject && gTerm === targetTerm;
      });

      if (existing) {
        initial[s.id] = { 
          devoir1: existing.devoir1 !== undefined && existing.devoir1 !== null ? existing.devoir1.toString() : '', 
          devoir2: existing.devoir2 !== undefined && existing.devoir2 !== null ? existing.devoir2.toString() : '', 
          compo: existing.compo !== undefined && existing.compo !== null ? existing.compo.toString() : '' 
        };
      } else {
        initial[s.id] = { devoir1: '', devoir2: '', compo: '' };
      }
    });
    setGradesMap(initial);
  }, [selectedClass, selectedSubject, term, classStudents, storedGrades]);

  const handleGradeChange = (studentId: string, field: 'devoir1' | 'devoir2' | 'compo', value: string) => {
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20)) {
      toast.error('La note doit être entre 0 et 20');
      return;
    }

    setGradesMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const autoSave = async () => {
    if(!selectedClass || !selectedSubject) return;
    setIsSaving(true);
    try {
      const updates = Object.entries(gradesMap).map(([studentId, scores]) => {
        const existing = storedGrades.find(g => {
          const gStudent = (g.studentId || g.student_id || '').toString().trim().toLowerCase();
          const gSubject = (g.subjectId || g.subject_id || g.subject || '').toString().trim().toLowerCase();
          const gTerm = (g.term || g.periode || '').toString().trim().toLowerCase();
          
          const targetStudent = studentId.toString().trim().toLowerCase();
          const targetSubject = (selectedSubject || '').toString().trim().toLowerCase();
          const targetTerm = (term || '').toString().trim().toLowerCase();
          
          return gStudent === targetStudent && gSubject === targetSubject && gTerm === targetTerm;
        });

        return {
          id: existing ? existing.id : uuidv4(),
          merchantId: merchant.id,
          studentId,
          classId: selectedClass,
          subjectId: selectedSubject,
          teacherId: selectedTeacherId || existing?.teacherId || '',
          term,
          devoir1: scores.devoir1,
          devoir2: scores.devoir2,
          compo: scores.compo,
          updatedAt: new Date().toISOString()
        };
      });

      await db.grades.bulkPut(updates);
      try {
        const { firestoreService } = await import('../../../services/firestoreService');
        for (const up of updates) {
          await firestoreService.save('grades', up);
        }
      } catch(e) {}
      setLastSaved(new Date());
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  // Run periodic automated background sync when values are written by the user
  useEffect(() => {
    const handler = setTimeout(() => {
      const hasData = Object.values(gradesMap).some(g => g.devoir1 || g.devoir2 || g.compo);
      if (hasData) {
        autoSave();
      }
    }, 2000);
    return () => clearTimeout(handler);
  }, [gradesMap]);

  const triggerManualSubmit = async () => {
    await autoSave();
    toast.success("Toutes les notes de ce niveau ont été transmises à la Direction générale !");
  };

  const calculateAverage = (gradeObj: { devoir1: string, devoir2: string, compo: string }) => {
    if(!gradeObj) return '-';
    let dev1 = parseFloat(gradeObj.devoir1);
    let dev2 = parseFloat(gradeObj.devoir2);
    let compo = parseFloat(gradeObj.compo);

    let devAvg = 0;
    let countDev = 0;
    if (!isNaN(dev1)) { devAvg += dev1; countDev++; }
    if (!isNaN(dev2)) { devAvg += dev2; countDev++; }
    
    if (countDev > 0) devAvg = devAvg / countDev;

    if (!isNaN(compo)) {
      if (countDev > 0) return ((devAvg + (compo * 2)) / 3).toFixed(2);
      return compo.toFixed(2);
    }
    
    return countDev > 0 ? devAvg.toFixed(2) : '-';
  };

  const getAppreciation = (avgStr: string) => {
    if (avgStr === '-') return '';
    const avg = parseFloat(avgStr);
    if (avg >= 16) return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1">✨ Excellent</span>;
    if (avg >= 14) return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1">🌸 Très Bien</span>;
    if (avg >= 12) return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1">👍 Assez Bien</span>;
    if (avg >= 10) return <span className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1">Passable</span>;
    if (avg >= 8) return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1">⚠️ Insuffisant</span>;
    return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1">🚨 Médiocre</span>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/30 text-indigo-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-400/30">
                Professeur
              </span>
              <span className="text-indigo-200 text-sm">Mode Hors-ligne Actif</span>
            </div>
            <h2 className="text-2xl font-bold">Saisie des Notes</h2>
            <p className="text-indigo-200 mt-1">Ajoutez vos notes à distance, synchronisation automatique dès le retour de la connexion.</p>
          </div>
          
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 bg-indigo-950/40 p-3 rounded-[1.5rem] border border-indigo-500/15 max-w-lg w-full sm:w-auto">
            {/* 1. SELECTION DE LA CLASSE CONCERNÉE - PREMIÈRE POSITION */}
            <select 
              value={selectedClass} 
              onChange={e => handleClassChange(e.target.value)}
              className="bg-white text-indigo-950 font-black rounded-xl px-4 py-2.5 text-xs cursor-pointer outline-none shadow-sm w-full transition-all hover:bg-slate-50 border border-slate-100"
            >
              <option value="">Sélectionner Classe</option>
              {availableClasses.map((c: any) => (
                <option key={c.id} value={c.id}>{formatClassName(c.name)}</option>
              ))}
            </select>

            {/* 2. SYSTEME DE PERIODE DIRECTE */}
            <select 
              value={term} 
              onChange={e => setTerm(e.target.value)}
              className="bg-white text-indigo-950 font-black rounded-xl px-4 py-2.5 text-xs cursor-pointer outline-none shadow-sm w-full transition-all hover:bg-slate-50 border border-slate-100"
            >
              {(merchant.academicPeriods || ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* 3. SELECTION DE LA MATIÈRE À EVALUATION DE NOTES */}
            <select 
              value={selectedSubject} 
              onChange={e => handleSubjectChange(e.target.value)}
              className="bg-white text-indigo-950 font-black rounded-xl px-4 py-2.5 text-xs cursor-pointer outline-none shadow-sm w-full transition-all hover:bg-slate-50 border border-slate-100"
            >
              <option value="">Sélectionner Matière</option>
              {availableSubjects.map((sub: string) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {/* 4. SELECTION DE L'ENSEIGNANT RECONNU SUR LE DOSSIER */}
            <select 
              value={selectedTeacherId} 
              onChange={e => handleTeacherChange(e.target.value)}
              className="bg-white text-indigo-950 font-black rounded-xl px-4 py-2.5 text-xs cursor-pointer outline-none shadow-sm w-full transition-all hover:bg-slate-50 border border-slate-100"
            >
              <option value="">
                {selectedSubject && !filteredTeachersForClass.some(t => (t.subject || '').trim().toLowerCase() === selectedSubject.trim().toLowerCase())
                  ? "Enseignant non attribué"
                  : "Saisie Directe Admin"}
              </option>
              {filteredTeachersForClass.map(t => (
                <option key={t.id} value={t.id}>
                  Enseignant : {t.firstName} {t.lastName || ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-indigo-50/50 px-6 py-3 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-1.5">
              {isSaving || isSyncingGrades ? (
                <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              )}
              {isSyncingGrades ? 'Synchronisation forcée en cours...' : isSaving ? 'Enregistrement automatique...' : lastSaved ? `Dernière sauvegarde locale : ${lastSaved.toLocaleTimeString()}` : 'Prêt pour la saisie'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleForceSync}
              disabled={isSyncingGrades}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              title="Actualise et récupère toutes les notes déjà sauvegardées sur le serveur"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGrades ? 'animate-spin' : ''}`} />
              Récupérer les notes existantes
            </button>
            <button 
              onClick={triggerManualSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Soumettre à la Direction
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="font-bold text-gray-600 p-4 sticky top-0 bg-gray-50 z-10 w-1/3">Élève</th>
                <th className="font-bold text-gray-600 p-4 text-center sticky top-0 bg-gray-50 z-10">Interrogation 1 (/20)</th>
                <th className="font-bold text-gray-600 p-4 text-center sticky top-0 bg-gray-50 z-10">Interrogation 2 (/20)</th>
                <th className="font-bold text-indigo-800 p-4 text-center sticky top-0 bg-indigo-50 z-10 border-x border-indigo-100">Composition (/20)</th>
                <th className="font-bold text-gray-600 p-4 text-center sticky top-0 bg-gray-50 z-10">Moyenne (/20)</th>
                <th className="font-bold text-gray-600 p-4 sticky top-0 bg-gray-50 z-10">Décision IA / Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-450 font-semibold bg-gray-50/20">
                    <div className="text-2xl mb-2">📁</div>
                    Aucun élève trouvé pour les sélections actuelles.<br />
                    Veuillez ajouter des dossiers d'élèves dans l'onglet Administration ou associer la classe concernée.
                  </td>
                </tr>
              ) : classStudents.map((student: any) => {
                const g = gradesMap[student.id] || { devoir1: '', devoir2: '', compo: '' };
                const avg = calculateAverage(g);
                const appreciation = getAppreciation(avg);

                return (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-850 font-black flex items-center justify-center text-sm shadow-inner uppercase">
                          {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{student.firstName} {student.lastName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">MAT-{student.id.substring(0, 8).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="20"
                        value={g.devoir1}
                        onChange={e => handleGradeChange(student.id, 'devoir1', e.target.value)}
                        className="w-16 h-10 text-center font-mono font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="-"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="20"
                        value={g.devoir2}
                        onChange={e => handleGradeChange(student.id, 'devoir2', e.target.value)}
                        className="w-16 h-10 text-center font-mono font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="-"
                      />
                    </td>
                    <td className="p-4 text-center bg-indigo-50/30 border-x border-indigo-50">
                      <input 
                        type="number" 
                        min="0" max="20"
                        value={g.compo}
                        onChange={e => handleGradeChange(student.id, 'compo', e.target.value)}
                        className="w-20 h-10 text-center font-mono font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="-"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <div className={`font-mono font-black text-base ${avg !== '-' && parseFloat(avg) < 10 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                        {avg}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {appreciation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-500" />
          Les données de saisie rapide sont issues de l'ERP connecté et reliées aux dossiers d'inscription des élèves et des enseignants.
        </div>
      </div>
    </motion.div>
  );
};

export const TeacherDashboardSpace = ({ 
  teacher, 
  merchant, 
  classes, 
  students, 
  storedGrades,
  onClose 
}: { 
  teacher: any; 
  merchant: Merchant; 
  classes: any[]; 
  students: any[]; 
  storedGrades: any[];
  onClose: () => void; 
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(teacher.classId || '');
  const [term, setTerm] = useState<string>(merchant.academicPeriods?.[0] || 'Trimestre 1');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Homework state
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDesc, setHomeworkDesc] = useState('');
  const [homeworkDueDate, setHomeworkDueDate] = useState('');
  const [submittingHomework, setSubmittingHomework] = useState(false);

  // Active view tab inside the portal: grades, homework or parent notifications
  const [teacherTab, setTeacherTab] = useState<'grades' | 'homework' | 'notifications' | 'schedule'>('grades');

  // Notifications & Contacts parents state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [notifType, setNotifType] = useState<'absence' | 'grades' | 'custom'>('absence');
  const [customMsg, setCustomMsg] = useState('');
  const [sendingNotifs, setSendingNotifs] = useState(false);
  const [notifSearchQuery, setNotifSearchQuery] = useState('');
  const [sentLogsExpanded, setSentLogsExpanded] = useState(false);
  const [pendingDispatches, setPendingDispatches] = useState<any[]>([]);

  const dbParents = useLiveQuery(() => 
    db.parents?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = useLiveQuery(() => 
    db.attendance?.where('merchantId').equals(merchant.id).and(a => a.date === todayStr).toArray()
  , [merchant.id, todayStr]) || [];

  const studentAttendanceStatus = useMemo(() => {
    const map: Record<string, string> = {};
    todayAttendances.forEach((a: any) => {
      map[a.studentId] = a.status; // 'absent', 'late', 'present'
    });
    return map;
  }, [todayAttendances]);

  // Dynamic calculation of the active assignment (class, subject, filiere) matching selectedClassId
  const activeAssignment = useMemo(() => {
    if (selectedClassId === teacher.classId) {
      return {
        classId: teacher.classId,
        className: teacher.className,
        filiere: teacher.filiere,
        subject: teacher.subject
      };
    }
    const extras = teacher.extraClasses || [];
    const found = extras.find((ec: any) => ec.classId === selectedClassId);
    if (found) return found;
    return {
      classId: selectedClassId,
      className: '',
      filiere: teacher.filiere,
      subject: teacher.subject
    };
  }, [teacher, selectedClassId]);

  const activeSubject = activeAssignment.subject;
  const activeFiliere = activeAssignment.filiere;

  const getPrebuiltMessage = useCallback((studentName: string, studentAvg: string, type: 'absence' | 'grades' | 'custom') => {
    if (type === 'absence') {
      return `Cher Parent, nous vous informons que votre enfant ${studentName} est absent ce jour en cours de ${activeSubject}. Merci de contacter la Direction de ${merchant.name || 'ACOM Éducation'}. Cordialement, M./Mme ${teacher.lastName}.`;
    }
    if (type === 'grades') {
      const avgFormatted = studentAvg !== '-' ? `${studentAvg}/20` : 'non évaluée';
      return `Cher Parent, nous vous transmettons la moyenne de ${studentName} en ${activeSubject} pour le ${term} : Elle est de ${avgFormatted}. Merci d'encourager ses efforts continus. Cordialement, M./Mme ${teacher.lastName}.`;
    }
    return customMsg || `Cher Parent, message de l'enseignant M./Mme ${teacher.lastName} concernant votre enfant ${studentName} : [votre message]`;
  }, [activeSubject, merchant.name, teacher.lastName, term, customMsg]);

  // The subset of classes that this teacher is actually assigned to
  const assignedClasses = useMemo(() => {
    const list: any[] = [];
    if (teacher.classId) {
      const primaryClState = classes.find((cl: any) => cl.id === teacher.classId);
      if (primaryClState) {
        list.push(primaryClState);
      } else {
        list.push({ id: teacher.classId, name: teacher.className, level: teacher.filiere });
      }
    }
    if (teacher.extraClasses && teacher.extraClasses.length > 0) {
      teacher.extraClasses.forEach((ec: any) => {
        if (!list.some(cl => cl.id === ec.classId)) {
          const matched = classes.find((cl: any) => cl.id === ec.classId);
          if (matched) {
            list.push(matched);
          } else {
            list.push({ id: ec.classId, name: ec.className, level: ec.filiere });
          }
        }
      });
    }
    return list;
  }, [teacher, classes]);

  // Load communications (for homework persistence)
  const classCommunications = useLiveQuery(() => 
    db.communications?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // Load homeworks (for Cahier de Texte)
  const allHomeworks = useLiveQuery(() => 
    db.homeworks?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const homeworkList = useMemo(() => {
    return allHomeworks.filter((h: any) => 
      h.classId === selectedClassId && 
      (h.subjectName === activeSubject || h.subject === activeSubject || h.subjectId === activeSubject)
    );
  }, [allHomeworks, selectedClassId, activeSubject]);

  const activeClassObj = useMemo(() => {
    return assignedClasses.find((c: any) => c.id === selectedClassId) || classes.find((c: any) => c.id === selectedClassId);
  }, [classes, assignedClasses, selectedClassId]);

  // Filter students belonging strictly to the selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s: any) => 
      s.classId === selectedClassId || 
      s.gradeId === selectedClassId || 
      (s.grade && s.grade.toLowerCase() === activeClassObj?.name?.toLowerCase())
    );
  }, [students, selectedClassId, activeClassObj]);

  const [localGradesMap, setLocalGradesMap] = useState<Record<string, { devoir1: string, devoir2: string, compo: string }>>({});

  useEffect(() => {
    if (selectedClassId) {
      const initialGrades: any = {};
      classStudents.forEach((student: any) => {
        const gradeRecord = storedGrades.find(g => 
          g.studentId === student.id && 
          g.classId === selectedClassId && 
          g.subjectId === activeSubject && 
          g.term === term
        );
        initialGrades[student.id] = {
          devoir1: gradeRecord?.devoir1 || '',
          devoir2: gradeRecord?.devoir2 || '',
          compo: gradeRecord?.compo || ''
        };
      });
      setLocalGradesMap(initialGrades);
    }
  }, [selectedClassId, classStudents, storedGrades, term, activeSubject]);

  const updateStudentGrade = (studentId: string, field: 'devoir1' | 'devoir2' | 'compo', val: string) => {
    if (val !== '' && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 20)) {
       toast.error("La note doit être un nombre entre 0 et 20");
       return;
    }
    setLocalGradesMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val
      }
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedClassId) return;
    setIsSaving(true);
    try {
      const updates = Object.entries(localGradesMap).map(([studentId, scores]) => {
        const existing = storedGrades.find(g => 
          g.studentId === studentId && 
          g.classId === selectedClassId && 
          g.subjectId === activeSubject && 
          g.term === term
        );
        return {
          id: existing ? existing.id : uuidv4(),
          merchantId: merchant.id,
          studentId,
          classId: selectedClassId,
          subjectId: activeSubject,
          term,
          devoir1: scores.devoir1,
          devoir2: scores.devoir2,
          compo: scores.compo,
          updatedAt: new Date().toISOString()
        };
      });
      await db.grades.bulkPut(updates);
      try {
        const { firestoreService } = await import('../../../services/firestoreService');
        for (const up of updates) {
          await firestoreService.save('grades', up);
        }
      } catch(e) {}
      setLastSaved(new Date());
      toast.success("Notes de la classe enregistrées avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de sauvegarde des notes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkTitle.trim() || !homeworkDueDate) {
      toast.error("Veuillez remplir le titre et la date d'échéance");
      return;
    }
    setSubmittingHomework(true);
    try {
      const payload = {
        id: uuidv4(),
        merchantId: merchant.id,
        title: homeworkTitle,
        description: homeworkDesc, // mapped appropriately for StudentPortal
        targetAudience: 'students_classes',
        classId: selectedClassId,
        subjectName: activeSubject, // mapped appropriately for StudentPortal
        subjectId: activeSubject,
        dueDate: homeworkDueDate,
        syncStatus: 'synced',
        updatedAt: new Date().toISOString()
      };
      
      await db.homeworks.put(payload);
      
      try {
        const { firestoreService } = await import('../../../services/firestoreService');
        await firestoreService.save('homeworks', payload);
      } catch (fsErr) {
        console.warn("Could not push homework to Firestore", fsErr);
      }

      toast.success("Cahier de Texte programmé et visible des élèves & parents !");
      setHomeworkTitle('');
      setHomeworkDesc('');
      setHomeworkDueDate('');
    } catch (err) {
      toast.error("Erreur de programmation");
    } finally {
      setSubmittingHomework(false);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    try {
      await db.homeworks.delete(id);
      try {
        const { firestoreService } = await import('../../../services/firestoreService');
        await firestoreService.delete('homeworks', id);
      } catch (fsErr) {
        console.warn("Could not delete homework from Firestore", fsErr);
      }
      toast.success("Cahier de Texte retiré");
    } catch (e) {
      toast.error("Erreur de suppression");
    }
  };

  const getPersonalizedMessageForStudent = (student: any) => {
    let template = customMsg || "";
    if (!template) {
      if (notifType === 'absence') {
        template = `Cher Parent, nous vous informons que votre enfant {Nom} est absent ce jour en cours de {Matiere}. Merci de contacter la Direction de ${merchant.name || 'ACOM Éducation'}. Cordialement.`;
      } else if (notifType === 'grades') {
        template = `Cher Parent, nous vous transmettons la moyenne de {Nom} en {Matiere} pour le {Periode} : Elle est de {Note}/20. Merci de suivre ses efforts. Cordialement.`;
      } else {
        template = `Cher Parent, note de l'enseignant M./Mme {Prof} concernant {Nom} : [votre message]`;
      }
    }
    
    const rowScores = localGradesMap[student.id] || { devoir1: '', devoir2: '', compo: '' };
    const studentAvg = calculateStudentAvg(rowScores);
    
    return template
      .replace(/\{Nom\}/g, `${student.firstName} ${student.lastName}`)
      .replace(/\{Matiere\}/g, activeSubject || teacher.subject || "sa matière")
      .replace(/\{Note\}/g, studentAvg !== '-' ? studentAvg : "non évaluée")
      .replace(/\{Periode\}/g, term)
      .replace(/\{Prof\}/g, `${teacher.firstName} ${teacher.lastName}`);
  };

  const handleSendGroupNotifications = async (channel: 'sms' | 'whatsapp') => {
    if (selectedStudentIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un élève.");
      return;
    }
    setSendingNotifs(true);
    let successCount = 0;
    const dispatchesList: any[] = [];
    
    try {
      for (const studentId of selectedStudentIds) {
        const student = classStudents.find(s => s.id === studentId);
        if (!student) continue;
        
        const finalMsg = getPersonalizedMessageForStudent(student);
        const parentObj = dbParents.find(p => p.studentId === student.id);
        const parentChoice = student.primaryParentContact || 'father';
        let resolvedPhone = '';
        if (parentChoice === 'father') resolvedPhone = student.fatherPhone;
        else if (parentChoice === 'mother') resolvedPhone = student.motherPhone;
        else if (parentChoice === 'guardian') resolvedPhone = student.guardianPhone;
        else if (parentChoice === 'emergency') resolvedPhone = student.emergencyPhone;

        const recipientPhone = resolvedPhone || 
                               student.parentContact || 
                               student.fatherPhone || 
                               student.motherPhone || 
                               student.guardianPhone || 
                               student.parentAccountPhone || 
                               parentObj?.phone || 
                               '';
        
        const commId = uuidv4();
        await db.communications.put({
          id: commId,
          merchantId: merchant.id,
          studentId: student.id,
          title: notifType === 'absence' ? 'Alerte Absence Directe' : notifType === 'grades' ? 'Note de Bulletin Directe' : 'Message Enseignant',
          content: finalMsg,
          type: channel,
          recipientPhone: recipientPhone || 'Non configuré',
          date: new Date().toISOString(),
          syncStatus: 'synced',
          updatedAt: new Date().toISOString()
        });
        successCount++;

        if (recipientPhone) {
          dispatchesList.push({
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            phone: recipientPhone,
            message: finalMsg,
            channel,
            sent: false
          });
        }
      }
      
      setPendingDispatches(dispatchesList);
      toast.success(`${successCount} messages préparés ! Utilisez la file de dispatching ci-dessous pour envoyer.`);
      setSelectedStudentIds([]);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de finaliser l'envoi des communications");
    } finally {
      setSendingNotifs(false);
    }
  };

  const sentCommunicationsFiltered = useMemo(() => {
    return classCommunications.filter((c: any) => 
      c.merchantId === merchant.id && 
      (c.title?.includes('Directe') || c.title?.includes('Enseignant') || c.type === 'sms' || c.type === 'whatsapp') &&
      classStudents.some(s => s.id === c.studentId)
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [classCommunications, merchant.id, classStudents]);

  const calculateStudentAvg = (gradeObj: { devoir1: string, devoir2: string, compo: string }) => {
    if(!gradeObj) return '-';
    let dev1 = parseFloat(gradeObj.devoir1);
    let dev2 = parseFloat(gradeObj.devoir2);
    let compo = parseFloat(gradeObj.compo);

    let devAvg = 0;
    let countDev = 0;
    if (!isNaN(dev1)) { devAvg += dev1; countDev++; }
    if (!isNaN(dev2)) { devAvg += dev2; countDev++; }
    
    if (countDev > 0) devAvg = devAvg / countDev;

    if (!isNaN(compo)) {
      if (countDev > 0) return ((devAvg + (compo * 2)) / 3).toFixed(2);
      return compo.toFixed(2);
    }
    
    if (countDev > 0) return devAvg.toFixed(2);
    return '-';
  };

  const getAppreciation = (avgStr: string) => {
    if (avgStr === '-') return '';
    const avg = parseFloat(avgStr);
    if (avg >= 16) return <span className="text-emerald-600 font-bold">Excellent</span>;
    if (avg >= 14) return <span className="text-blue-600 font-semibold">Très Bien</span>;
    if (avg >= 12) return <span className="text-indigo-600 font-medium">Assez Bien</span>;
    if (avg >= 10) return <span className="text-gray-600">Passable</span>;
    if (avg >= 8) return <span className="text-orange-500 font-semibold">Insuffisant</span>;
    return <span className="text-red-600 font-bold">Médiocre</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 bg-indigo-500/30 text-indigo-300 font-bold px-3 py-1 text-[10px] rounded-full uppercase tracking-wider border border-white/5 font-mono">
              🟢 Espace Enseignant Actif
            </span>
            <h1 className="text-3xl font-bold tracking-tight">Bonjour, {teacher.firstName} {teacher.lastName} !</h1>
            <p className="text-slate-400 text-sm">
              Matière : <span className="text-white font-bold">{teacher.subject}</span> &bull; Niveau / Filière : <span className="text-white font-bold">{teacher.filiere}</span>
            </p>
          </div>
          <button 
            id="quit-teacher-portal"
            onClick={onClose}
            className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl transition-all text-xs flex items-center gap-2 border border-white/10"
          >
            <X className="w-4 h-4" />
            <span>Quitter l'Espace</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-2xl max-w-lg gap-1">
        <button
          id="tab-grades"
          onClick={() => setTeacherTab('grades')}
          className={`flex-1 py-2 px-3.5 text-xs font-black rounded-xl transition-all ${teacherTab === 'grades' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Saisie des Notes
        </button>
        <button
          id="tab-homework"
          onClick={() => setTeacherTab('homework')}
          className={`flex-1 py-2 px-3.5 text-xs font-black rounded-xl transition-all ${teacherTab === 'homework' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Cahier de Texte
        </button>
        <button
          id="tab-notifications"
          onClick={() => setTeacherTab('notifications')}
          className={`flex-1 py-2 px-3.5 text-xs font-black rounded-xl transition-all ${teacherTab === 'notifications' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Notifications Parents
        </button>
        <button
          id="tab-schedule"
          onClick={() => setTeacherTab('schedule')}
          className={`flex-1 py-2 px-3.5 text-xs font-black rounded-xl transition-all ${teacherTab === 'schedule' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Emploi du Temps
        </button>
      </div>

      {teacherTab === 'grades' && (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-6 md:p-8 bg-slate-50 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">Calcul du carnet de notes</h3>
              <p className="text-xs text-gray-505">Matière concernée : <span className="font-bold text-indigo-600">{teacher.subject}</span></p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select 
                id="select-active-class"
                value={selectedClassId} 
                onChange={e => setSelectedClassId(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Sélectionner la classe...</option>
                {assignedClasses.map((cl: any) => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>

              <select 
                id="select-active-term"
                value={term} 
                onChange={e => setTerm(e.target.value as any)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
              >
                {(merchant.academicPeriods || ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedClassId ? (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Choisissez une classe affectée</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">Sélectionnez la classe dans le filtre ci-dessus pour charger l'effectif des élèves et saisir les notes.</p>
              </div>
            </div>
          ) : classStudents.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Aucun élève trouvé dans {activeClassObj?.name}</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">Renseignez des étudiants et affectez-les à la classe ou niveau <span className="font-bold">{activeClassObj?.name}</span> dans l'onglet des étudiants.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-4">Élève</th>
                    <th className="px-8 py-4 text-center">Devoir 1 (/20)</th>
                    <th className="px-8 py-4 text-center">Devoir 2 (/20)</th>
                    <th className="px-5 py-4 text-center">Examen / Compo (/20)</th>
                    <th className="px-8 py-4 text-right">Moyenne Générale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classStudents.map((student: any) => {
                    const rowScores = localGradesMap[student.id] || { devoir1: '', devoir2: '', compo: '' };
                    const studentAvg = calculateStudentAvg(rowScores);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-indigo-600 border border-slate-200">
                              {student.firstName?.[0] || '?'}{student.lastName?.[0] || '?'}
                            </div>
                            <div>
                              <span className="block font-bold text-gray-950 text-sm leading-none">{student.firstName} {student.lastName}</span>
                              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1 inline-block">ID: #{student.id?.substring(0, 5)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <input 
                            type="text" 
                            value={rowScores.devoir1}
                            onChange={(e) => updateStudentGrade(student.id, 'devoir1', e.target.value)}
                            placeholder="ND"
                            className="bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 w-16 text-center text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary/10"
                          />
                        </td>
                        <td className="px-8 py-4 text-center">
                          <input 
                            type="text" 
                            value={rowScores.devoir2}
                            onChange={(e) => updateStudentGrade(student.id, 'devoir2', e.target.value)}
                            placeholder="ND"
                            className="bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 w-16 text-center text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary/10"
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input 
                            type="text" 
                            value={rowScores.compo}
                            onChange={(e) => updateStudentGrade(student.id, 'compo', e.target.value)}
                            placeholder="ND"
                            className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 w-16 text-center text-sm font-extrabold text-indigo-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-300/30"
                          />
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-gray-950 leading-none">{studentAvg !== '-' ? studentAvg + ' / 20' : '-'}</span>
                            <span className="text-[10px] mt-1 pr-1 font-semibold">{getAppreciation(studentAvg)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedClassId && classStudents.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
              <span className="text-xs text-gray-500 font-medium">
                {lastSaved ? `Dernière sauvegarde réussie à ${lastSaved.toLocaleTimeString()}` : 'Changements en attente de sauvegarde'}
              </span>
              <button 
                id="save-grades-teacher"
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Enregistrer définitivement</span>
              </button>
            </div>
          )}
        </div>
      )}

      {teacherTab === 'homework' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 md:p-8 space-y-6 self-start">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Enrichir le Cahier de Texte</h3>
              <p className="text-xs text-gray-500">Ajouter les cours ou devoirs effectués, visible par les parents et élèves.</p>
            </div>

            <form onSubmit={handleAddHomework} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Classe Destinataire</label>
                <select 
                  required
                  id="homework-target-class"
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold font-sans h-[46px]"
                >
                  <option value="">Sélectionner la classe...</option>
                  {assignedClasses.map((cl: any) => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Titre du Devoir</label>
                <input 
                  type="text" 
                  required
                  id="homework-title"
                  value={homeworkTitle}
                  onChange={e => setHomeworkTitle(e.target.value)}
                  placeholder="ex: Dissertation de français ou DM 2"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Date Échéance</label>
                <input 
                  type="date" 
                  required
                  id="homework-due-date"
                  value={homeworkDueDate}
                  onChange={e => setHomeworkDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Description & Exercices</label>
                <textarea 
                  rows={4}
                  id="homework-description"
                  value={homeworkDesc}
                  onChange={e => setHomeworkDesc(e.target.value)}
                  placeholder="Saisissez les consignes et les exercices à faire..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-sans resize-none"
                />
              </div>

              <button 
                id="submit-homework-teacher"
                type="submit" 
                disabled={submittingHomework}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:scale-102 transition-all flex items-center justify-center gap-2 text-xs"
              >
                {submittingHomework ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Publier dans le Cahier de Texte</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-gray-900">Agenda Cahier de Texte</h3>
                <p className="text-xs text-gray-400 font-medium">Contenu existant et partagé pour cette classe.</p>
              </div>
              <span className="text-xs bg-slate-55 px-3 py-1.5 rounded-xl border font-bold text-slate-700">
                {homeworkList.length} entrée(s)
              </span>
            </div>

            {homeworkList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Le cahier de texte est vide</h4>
                  <p className="text-xs text-gray-500">Remplissez le formulaire pour y ajouter un devoir ou une leçon.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworkList.map((homework: any) => (
                  <div key={homework.id} className="p-5 border border-gray-100 bg-gray-50/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-indigo-200 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                          {homework.subjectName || homework.subject || 'Général'}
                        </span>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 flex items-center rounded-md border border-rose-100/50">
                          Pour le: {new Date(homework.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-950 text-base">{homework.title}</h4>
                      <p className="text-xs text-gray-600 font-sans whitespace-pre-wrap leading-relaxed max-w-xl pr-4">
                        {homework.description || homework.text || ''}
                      </p>
                    </div>

                    <button 
                      id={`delete-homework-btn-${homework.id}`}
                      onClick={() => handleDeleteHomework(homework.id)}
                      className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {teacherTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 md:p-8 space-y-6">
            {!selectedClassId ? (
              <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-lg">Choisissez une classe pour l'emploi du temps</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">Sélectionnez la classe pour gérer son emploi du temps.</p>
                </div>
              </div>
            ) : (
                <ScheduleManager merchantId={merchant.id} classId={selectedClassId} />
            )}
          </div>
        </div>
      )}

      {teacherTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 md:p-8 space-y-6">
            
            {/* Tab Top Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-905">Centre de Communication Parents</h3>
                <p className="text-xs text-slate-500 font-medium">Contactez directement les parents sans quitter votre espace Enseignant.</p>
              </div>
              
              {/* Class Filter */}
              <div className="flex items-center gap-3">
                <select 
                  id="select-active-class-notif"
                  value={selectedClassId} 
                  onChange={e => {
                    setSelectedClassId(e.target.value);
                    setSelectedStudentIds([]); // clear selection
                  }}
                  className="px-4 py-2.5 bg-slate-55 border border-gray-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sélectionner la classe...</option>
                  {assignedClasses.map((cl: any) => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {!selectedClassId ? (
              <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-lg">Choisissez une classe pour commencer</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">Sélectionnez la classe dans le filtre ci-dessus pour charger les parents d'élèves correspondants.</p>
                </div>
              </div>
            ) : classStudents.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-lg">Aucun élève trouvé dans {activeClassObj?.name}</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">Saisissez des étudiants et affectez-les à la classe ou niveau <span className="font-bold">{activeClassObj?.name}</span> dans l'onglet des étudiants.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Configuration de l'alerte */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* 1. Category Selection Card */}
                  <div className="bg-slate-50 border border-gray-100 rounded-3.5xl p-5 space-y-4">
                    <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest block font-sans">Étape 1 : Type d'alerte</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'absence', label: 'Absence', icon: AlertCircle, color: 'hover:border-red-500', activeBg: 'border-red-500 bg-red-50 text-red-700' },
                        { id: 'grades', label: 'Notes', icon: GraduationCap, color: 'hover:border-indigo-600', activeBg: 'border-indigo-600 bg-indigo-50 text-indigo-700' },
                        { id: 'custom', label: 'Message Libre', icon: MessageSquare, color: 'hover:border-slate-800', activeBg: 'border-slate-800 bg-slate-900 text-white' }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = notifType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setNotifType(item.id as any);
                              setCustomMsg(''); // reset message to let prebuilt apply unless custom is overridden
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${isActive ? item.activeBg : 'bg-white border-gray-200 text-slate-600 ' + item.color}`}
                          >
                            <Icon className="w-5 h-5 mb-1.5 shrink-0" />
                            <span className="text-[11px] font-black leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Message overrides/templates body editing */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Contenu du message</label>
                        <button 
                          type="button" 
                          onClick={() => {
                            const defaultTmp = getPersonalizedMessageForStudent({ firstName: '{Nom}', lastName: '' });
                            setCustomMsg(defaultTmp);
                          }}
                          className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Réinitialiser le modèle
                        </button>
                      </div>
                      <textarea
                        id="notif-custom-edit-area"
                        rows={4}
                        value={customMsg || (
                          notifType === 'absence' ? `Cher Parent, nous vous informons que votre enfant {Nom} est absent ce jour en cours de {Matiere}. Merci de contacter la Direction.` :
                          notifType === 'grades' ? `Cher Parent, la moyenne actuelle de {Nom} en {Matiere} est de {Note}/20 pour ce ${term}. Merci d'encourager ses efforts.` :
                          `Cher Parent, message de l'enseignant M./Mme {Prof} concernant votre enfant {Nom} : [votre message]`
                        )}
                        onChange={(e) => setCustomMsg(e.target.value)}
                        placeholder="Saisissez ou modifiez librement le message..."
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-semibold font-sans resize-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
                      />
                      <span className="text-[9px] text-gray-400 font-sans leading-none block">
                        Balises actives : <strong className="text-slate-650">{`{Nom}`}</strong> (Nom complet), <strong className="text-slate-655">{`{Note}`}</strong> (Moyenne), <strong className="text-slate-655">{`{Matiere}`}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 2. Beautiful Simulated Phone screen live preview */}
                  <div className="bg-slate-900 border border-slate-950 text-white rounded-[2rem] p-6 shadow-inner relative overflow-hidden">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-b-xl z-20" />
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[10px] text-slate-400 font-mono">
                      <span>Passerelle SMS & WA</span>
                      <span className="font-bold text-emerald-400">● Aperçu en direct</span>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#25D366] font-mono font-black block">
                        Message Parent
                      </span>
                      
                      <div className="bg-slate-800 border border-white/5 rounded-2xl p-4 space-y-1 relative font-sans">
                        <span className="text-[9px] font-mono text-indigo-300 block mb-1">Destinataire : Parent de {selectedStudentIds.length > 0 ? (classStudents.find(s => s.id === selectedStudentIds[0])?.firstName || 'Amadou') : 'Amadou'} Diallo</span>
                        <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                          {getPersonalizedMessageForStudent(
                            selectedStudentIds.length > 0 
                              ? classStudents.find(s => s.id === selectedStudentIds[0]) || { firstName: 'Amadou', lastName: 'Diallo' }
                              : { firstName: 'Amadou', lastName: 'Diallo' }
                          )}
                        </p>
                        <span className="text-[9px] text-slate-500 block text-right mt-2 font-mono">
                          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} &bull; Canal Direct
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Students list with checkboxes & search */}
                <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    
                    {/* Search & Actions toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      
                      {/* Search */}
                      <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="Rechercher un élève..."
                          value={notifSearchQuery}
                          onChange={(e) => setNotifSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl outline-none text-xs font-bold focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Select shortcuts bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = classStudents.map(s => s.id);
                            setSelectedStudentIds(allIds);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/30 text-indigo-700 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                        >
                          Tous ({classStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const evaluatedIds = classStudents.filter(s => {
                              const scores = localGradesMap[s.id];
                              return scores && (scores.devoir1 || scores.devoir2 || scores.compo);
                            }).map(s => s.id);
                            setSelectedStudentIds(evaluatedIds);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/30 text-emerald-700 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                        >
                          Évalués seulement
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const absentOrLateIds = classStudents.filter(s => {
                              const status = studentAttendanceStatus[s.id];
                              return status === 'absent' || status === 'late';
                            }).map(s => s.id);
                            setSelectedStudentIds(absentOrLateIds);
                            setNotifType('absence'); // Auto-switch to absence mode
                          }}
                          className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-100/30 text-orange-700 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                        >
                          Retards / Absents
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds([])}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                        >
                          Réinitialiser
                        </button>
                      </div>

                    </div>

                    {/* Scrollable table container */}
                    <div className="border border-gray-200 rounded-2.5xl overflow-hidden max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">
                            <th className="p-3.5 text-center w-12">Sél.</th>
                            <th className="p-3.5">Élève & Moyenne</th>
                            <th className="p-3.5">Parent d'Élève</th>
                            <th className="p-3.5 text-right pr-6">Statut Canal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                          {classStudents
                            .filter(s => {
                              if (!notifSearchQuery) return true;
                              const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
                              return fullName.includes(notifSearchQuery.toLowerCase());
                            })
                            .map((student: any) => {
                              const isChecked = selectedStudentIds.includes(student.id);
                              
                              // Calculate average dynamically on localGradesMap
                              const rowScores = localGradesMap[student.id] || { devoir1: '', devoir2: '', compo: '' };
                              const studentAvg = calculateStudentAvg(rowScores);
                              
                              const parentObj = dbParents.find(p => p.studentId === student.id);
                              const parentChoice = student.primaryParentContact || 'father';
                              
                              let phone = '';
                              let parentName = '';
                              
                              if (parentChoice === 'father') {
                                phone = student.fatherPhone || student.parentContact || '';
                                parentName = student.fatherName || '';
                              } else if (parentChoice === 'mother') {
                                phone = student.motherPhone || '';
                                parentName = student.motherName || '';
                              } else if (parentChoice === 'guardian') {
                                phone = student.guardianPhone || '';
                                parentName = student.guardianName || '';
                              } else if (parentChoice === 'emergency') {
                                phone = student.emergencyPhone || '';
                                parentName = student.emergencyName || '';
                              }
                              
                              // Fallbacks if specified choice didn't contain values
                              if (!phone) {
                                phone = student.parentContact || 
                                        student.fatherPhone || 
                                        student.motherPhone || 
                                        student.guardianPhone || 
                                        student.parentAccountPhone || 
                                        parentObj?.phone || 
                                        '';
                              }
                              if (!parentName) {
                                parentName = student.parentSignName || 
                                             student.fatherName || 
                                             student.motherName || 
                                             student.guardianName || 
                                             student.emergencyName ||
                                             (parentObj ? `${parentObj?.firstName} ${parentObj?.lastName}` : '') || 
                                             'Tuteur parent';
                              }

                              return (
                                <tr 
                                  key={student.id} 
                                  onClick={() => {
                                    setSelectedStudentIds(prev => 
                                      prev.includes(student.id) 
                                        ? prev.filter(id => id !== student.id)
                                        : [...prev, student.id]
                                    );
                                  }}
                                  className={`hover:bg-slate-50/50 transition-all cursor-pointer ${isChecked ? 'bg-indigo-50/25' : ''}`}
                                >
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        setSelectedStudentIds(prev => 
                                          e.target.checked
                                            ? [...prev, student.id]
                                            : prev.filter(id => id !== student.id)
                                        );
                                      }}
                                      className="w-4.5 h-4.5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-8.5 h-8.5 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border transition-colors ${isChecked ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-50 border-slate-200 text-indigo-600 font-sans'}`}>
                                        {student.firstName?.[0] || '?'}{student.lastName?.[0] || '?'}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="block font-black text-gray-950 text-xs truncate leading-none">{student.firstName} {student.lastName}</span>
                                          {studentAttendanceStatus[student.id] && (
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white ${studentAttendanceStatus[student.id] === 'absent' ? 'bg-rose-500' : studentAttendanceStatus[student.id] === 'late' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                                              {studentAttendanceStatus[student.id] === 'absent' ? 'Absent' : studentAttendanceStatus[student.id] === 'late' ? 'Retard' : 'Présent'}
                                            </span>
                                          )}
                                        </div>
                                        <span className={`text-[10px] font-black leading-none ${studentAvg !== '-' ? 'text-indigo-600' : 'text-slate-400 font-medium'}`}>
                                          {studentAvg !== '-' ? `Moyenne actuelle : ${studentAvg}/20` : 'Aucune note dans le carnet'}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="block font-bold text-slate-800 text-xs truncate leading-none mb-1.5">{parentName}</span>
                                    <span className="text-[10px] font-mono text-slate-400 font-bold block">{phone || 'Contact non renseigné'}</span>
                                  </td>
                                  <td className="p-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                      {phone ? (
                                        <>
                                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider">SMS</span>
                                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider">WA</span>
                                        </>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 rounded text-[9px] font-mono font-bold uppercase">Aucun canal</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                  </div>

                  {/* Bulk footer action dock */}
                  <div className="p-4 bg-slate-50 border border-gray-200 rounded-2.5xl flex flex-col md:flex-row items-center justify-between gap-4 font-sans mt-2">
                    <div className="space-y-1 self-start sm:self-center">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Diffusion groupée</span>
                      <p className="text-xs font-black text-gray-950">
                        {selectedStudentIds.length} parent d'élève({selectedStudentIds.length > 1 ? 's' : ''}) sélectionné({selectedStudentIds.length > 1 ? 's' : ''})
                      </p>
                    </div>

                    <div className="flex w-full md:w-auto items-center gap-3">
                      <button
                        type="button"
                        id="notif-send-sms"
                        disabled={selectedStudentIds.length === 0 || sendingNotifs}
                        onClick={() => handleSendGroupNotifications('sms')}
                        className="flex-1 md:flex-none px-6 py-3 h-[45px] text-xs font-black bg-slate-900 hover:bg-slate-950 text-white rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                      >
                        {sendingNotifs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5 text-indigo-300" />}
                        <span>SMS Établissement</span>
                      </button>
                      <button
                        type="button"
                        id="notif-send-whatsapp"
                        disabled={selectedStudentIds.length === 0 || sendingNotifs}
                        onClick={() => handleSendGroupNotifications('whatsapp')}
                        className="flex-1 md:flex-none px-6 py-3 h-[45px] text-xs font-black bg-[#25D366] hover:bg-[#1ebd50] text-white rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                      >
                        {sendingNotifs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        <span>Diffuser WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* File d'envois en cours (Assistant de Dispatching) */}
                  {pendingDispatches.length > 0 && (
                    <div className="mt-4 bg-indigo-950 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4 font-sans">
                      <div className="flex justify-between items-center pb-2 border-b border-indigo-900">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 animate-pulse">
                            📡 File de Transmission Active
                          </span>
                          <h4 className="text-sm font-black text-white uppercase">Assistant de dispatching de messages ({pendingDispatches.filter(d => !d.sent).length} en attente)</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingDispatches([])}
                          className="px-2.5 py-1.5 bg-indigo-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                        >
                          Fermer la file
                        </button>
                      </div>

                      <p className="text-xs text-indigo-200">
                        Les navigateurs bloquent l'envoi simultané automatisé en masse pour éviter le spam. Cliquez sur chaque bouton ci-dessous pour ouvrir l'application (SMS ou WhatsApp) et expédier le message instantanément pré-rempli :
                      </p>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-900">
                        {pendingDispatches.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              item.sent ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-indigo-900/40 border-indigo-800/80'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-black text-white flex items-center gap-2">
                                <span>👤 {item.studentName}</span>
                                <span className="text-[10px] font-mono text-indigo-300">({item.phone})</span>
                                {item.sent && (
                                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-extrabold uppercase px-1.5 py-0.2 rounded border border-emerald-400/40">
                                    Transmis ✔
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-300 font-medium italic select-all">
                                "{item.message}"
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = item.phone.replace(/[^0-9+]/g, '');
                                let target = '';
                                if (item.channel === 'whatsapp') {
                                  target = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(item.message)}`;
                                } else {
                                  target = `sms:${cleanPhone}?body=${encodeURIComponent(item.message)}`;
                                }
                                window.open(target, '_blank');
                                
                                // Mark item as sent
                                setPendingDispatches(prev => 
                                  prev.map((p, i) => i === idx ? { ...p, sent: true } : p)
                                );
                                toast.success("Canal ouvert !");
                              }}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1 min-w-[140px] cursor-pointer ${
                                item.sent 
                                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700' 
                                  : item.channel === 'whatsapp'
                                    ? 'bg-[#25D366] hover:bg-[#1ebd50] text-indigo-950 font-black'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              <span>{item.sent ? 'Renvoyer' : 'Lancer l\'Envoi'}</span>
                              <span>&rarr;</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* Past Communications History Log Drawer */}
            {selectedClassId && (
              <div className="border border-gray-200 rounded-2.5xl overflow-hidden mt-6">
                <button
                  type="button"
                  onClick={() => setSentLogsExpanded(!sentLogsExpanded)}
                  className="w-full p-5 bg-slate-50 border-b border-transparent hover:border-gray-200 flex justify-between items-center transition-all outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans">Historique des messages diffusés ({sentCommunicationsFiltered.length})</span>
                  </div>
                  <span className="text-xs font-black text-slate-400">
                    {sentLogsExpanded ? 'Masquer ▲' : 'Afficher ▼'}
                  </span>
                </button>

                {sentLogsExpanded && (
                  <div className="p-4 bg-white divide-y divide-gray-100 max-h-[250px] overflow-y-auto">
                    {sentCommunicationsFiltered.length === 0 ? (
                      <p className="py-12 text-center text-xs text-slate-400 font-medium">Aucune communication n'a encore été diffusée pour cette classe par votre compte.</p>
                    ) : (
                      sentCommunicationsFiltered.map((c: any) => {
                        const stu = students.find((s: any) => s.id === c.studentId);
                        return (
                          <div key={c.id} className="py-3.5 flex justify-between items-start gap-4 hover:bg-slate-50/30 px-2 transition-colors">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider ${c.type === 'whatsapp' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-slate-900 text-white'}`}>
                                  {c.type === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">{format(new Date(c.date), 'dd/MM/yyyy à HH:mm')}</span>
                                <span className="text-[10px] font-black text-slate-800 truncate">Sujet : {stu ? `${stu.firstName} ${stu.lastName}` : 'Élève'}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-sans">{c.content}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-black uppercase font-mono tracking-wider shrink-0">
                              Distribué ✔
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
