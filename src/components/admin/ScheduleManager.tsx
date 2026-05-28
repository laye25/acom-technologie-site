import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, Trash2, Clock, Eye, EyeOff, Sparkles, 
  Printer, Download, Bell, AlertTriangle, Check, BookOpen, UserCheck, 
  MapPin, HelpCircle, RefreshCw, X, ShieldCheck, ChevronRight, FileSpreadsheet, Send
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export const ScheduleManager = ({ merchantId, classId }: { merchantId: string, classId: string }) => {
  // Global View settings
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedShift, setSelectedShift] = useState('Régulier'); // Régulier, Matin (Double flux A), Après-midi (Double flux B)
  const [viewType, setViewType] = useState<'grid' | 'cards' | 'timeline'>('grid');
  
  // State for adding a new period (Manual creation)
  const [newPeriod, setNewPeriod] = useState({ 
    day: 'Lundi', 
    startTime: '08:00', 
    endTime: '10:00', 
    subject: '',
    teacherId: '',
    room: '',
    groupType: 'Both' // Both, Groupe A, Groupe B
  });

  // State for interactive modals
  const [isAiOptimizerOpen, setIsAiOptimizerOpen] = useState(false);
  const [aiOptimizingStep, setAiOptimizingStep] = useState<number>(0);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [aiGeneratedSchedules, setAiGeneratedSchedules] = useState<any[]>([]);

  // Replacement / Substitute state
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [selectedScheduleToModify, setSelectedScheduleToModify] = useState<any>(null);
  const [replacementTeacherId, setReplacementTeacherId] = useState('');
  const [replacementReason, setReplacementReason] = useState('Absence maladie');
  const [replacementStatus, setReplacementStatus] = useState<'normal' | 'replaced' | 'canceled'>('replaced');

  // Simulation notification modal state
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationDispatching, setNotificationDispatching] = useState(false);
  const [notificationLog, setNotificationLog] = useState<string[]>([]);

  // DB queries
  const allMerchantSchedules = useLiveQuery(() => 
    db.schedules?.where('merchantId').equals(merchantId).toArray()
  , [merchantId]) || [];

  const dbTeachers = useLiveQuery(() => 
    db.teachers?.where('merchantId').equals(merchantId).toArray()
  , [merchantId]) || [];

  const dbClasses = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchantId).toArray()
  , [merchantId]) || [];

  const subjects = useLiveQuery(() =>
    db.subjects?.where('merchantId').equals(merchantId).toArray()
  , [merchantId]) || [];

  const currentClass = useLiveQuery(() =>
    db.classes?.get(classId)
  , [classId]);

  // Derived properties
  const classSubjects = useMemo(() => {
    if (currentClass?.subjects && currentClass.subjects.length > 0) {
      return currentClass.subjects;
    }
    return [];
  }, [currentClass]);

  const schedules = useMemo(() => {
    return allMerchantSchedules.filter(s => s.classId === classId);
  }, [allMerchantSchedules, classId]);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  // Predefined standard slots based on shift
  const standardTimeSlots = useMemo(() => {
    if (selectedShift === 'Matin') {
      return [
        { label: 'Matinée 1', start: '07:30', end: '09:15' },
        { label: 'Matinée 2', start: '09:15', end: '11:00' },
        { label: 'Pause / Récré', start: '11:00', end: '11:15', isBreak: true },
        { label: 'Matinée 3', start: '11:15', end: '12:45' }
      ];
    } else if (selectedShift === 'Après-midi') {
      return [
        { label: 'Après-midi 1', start: '13:00', end: '14:45' },
        { label: 'Après-midi 2', start: '14:45', end: '16:30' },
        { label: 'Pause / Récré', start: '16:30', end: '16:45', isBreak: true },
        { label: 'Après-midi 3', start: '16:45', end: '18:15' }
      ];
    } else {
      return [
        { label: 'Cours Matin 1', start: '08:00', end: '10:00' },
        { label: 'Cours Matin 2', start: '10:00', end: '12:00' },
        { label: 'Pause Déjeuner', start: '12:00', end: '14:00', isBreak: true },
        { label: 'Cours Après-midi 1', start: '14:00', end: '16:00' },
        { label: 'Cours Après-midi 2', start: '16:00', end: '18:00' }
      ];
    }
  }, [selectedShift]);

  // Align manual inputs automatically when active shift changes
  React.useEffect(() => {
    const firstActive = standardTimeSlots.find(s => !s.isBreak);
    if (firstActive) {
      setNewPeriod(prev => ({
        ...prev,
        startTime: firstActive.start,
        endTime: firstActive.end
      }));
    }
  }, [selectedShift, standardTimeSlots]);

  const suggestedRooms = [
    'Salle 01', 'Salle 02', 'Salle 03', 'Salle 04', 
    'Laboratoire SVT', 'Laboratoire Physique-Chimie', 
    'Salle Informatique', 'Terrain de Sport', 'Bibliothèque'
  ];

  // Colors automatically computed for subjects
  const getSubjectColorStyle = (subjectName: string) => {
    const s = (subjectName || '').toLowerCase().trim();
    if (s.includes('math')) return { bg: 'bg-emerald-50 border-emerald-150', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800', ring: 'ring-emerald-200', textAccent: 'text-emerald-600' };
    if (s.includes('fran') || s.includes('lettre')) return { bg: 'bg-blue-50 border-blue-150', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800', ring: 'ring-blue-200', textAccent: 'text-blue-600' };
    if (s.includes('phys') || s.includes('chim')) return { bg: 'bg-amber-50 border-amber-150', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800', ring: 'ring-amber-200', textAccent: 'text-amber-600' };
    if (s.includes('svt') || s.includes('sci') || s.includes('biol')) return { bg: 'bg-teal-50 border-teal-150', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-800', ring: 'ring-teal-200', textAccent: 'text-teal-600' };
    if (s.includes('hist') || s.includes('géo') || s.includes('geo')) return { bg: 'bg-orange-50 border-orange-150', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800', ring: 'ring-orange-200', textAccent: 'text-orange-600' };
    if (s.includes('ang') || s.includes('all') || s.includes('esp') || s.includes('arabe')) return { bg: 'bg-violet-50 border-violet-150', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-800', ring: 'ring-violet-200', textAccent: 'text-violet-600' };
    if (s.includes('sport') || s.includes('eps')) return { bg: 'bg-rose-50 border-rose-150', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800', ring: 'ring-rose-200', textAccent: 'text-rose-600' };
    if (s.includes('philo')) return { bg: 'bg-sky-50 border-sky-150', text: 'text-sky-800', badge: 'bg-sky-100 text-sky-800', ring: 'ring-sky-200', textAccent: 'text-sky-600' };
    if (s.includes('info') || s.includes('tech')) return { bg: 'bg-indigo-50 border-indigo-150', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-800', ring: 'ring-indigo-200', textAccent: 'text-indigo-600' };
    return { bg: 'bg-slate-50 border-slate-150', text: 'text-slate-800', badge: 'bg-slate-200 text-slate-700', ring: 'ring-slate-300', textAccent: 'text-slate-500' };
  };

  // Turn time to minutes for overlap checking
  const toMins = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Real-time conflict checking
  const checkConflict = (
    day: string, 
    startTime: string, 
    endTime: string, 
    teacherId?: string, 
    room?: string, 
    currentScheduleId?: string
  ) => {
    if (!startTime || !endTime) return null;
    const startMins = toMins(startTime);
    const endMins = toMins(endTime);
    
    if (startMins >= endMins) {
      return { type: 'invalid_time', message: "L'heure de début doit précéder l'heure de fin." };
    }

    for (const s of allMerchantSchedules) {
      if (currentScheduleId && s.id === currentScheduleId) continue;
      if (s.day !== day) continue;

      const sStart = toMins(s.startTime);
      const sEnd = toMins(s.endTime);

      const isOverlapping = startMins < sEnd && endMins > sStart;
      if (isOverlapping) {
        // Teacher conflict check
        if (teacherId && s.teacherId === teacherId && s.status !== 'canceled') {
          const matchedClass = dbClasses.find(c => c.id === s.classId);
          const matchedTeacher = dbTeachers.find(t => t.id === teacherId);
          const name = matchedTeacher ? `${matchedTeacher.firstName} ${matchedTeacher.lastName}` : 'ce prof';
          return {
            type: 'teacher',
            message: `Conflit Enseignant : ${name} est déjà en cours dans la classe [${matchedClass?.name || 'Inconnue'}] de ${s.startTime} à ${s.endTime}.`
          };
        }

        // Room conflict check
        if (room && s.room && s.room.trim().toLowerCase() === room.trim().toLowerCase() && s.status !== 'canceled') {
          const matchedClass = dbClasses.find(c => c.id === s.classId);
          return {
            type: 'room',
            message: `Conflit Salle : La '${room}' est occupée par la classe [${matchedClass?.name || 'Inconnue'}] de ${s.startTime} à ${s.endTime}.`
          };
        }
      }
    }
    return null;
  };

  // Live Conflict Evaluation based on current form inputs
  const currentConflict = useMemo(() => {
    return checkConflict(
      newPeriod.day, 
      newPeriod.startTime, 
      newPeriod.endTime, 
      newPeriod.teacherId, 
      newPeriod.room
    );
  }, [newPeriod, allMerchantSchedules]);

  // Toggle general class schedule publication state
  const handleTogglePublish = async () => {
    if (!classId) return;
    try {
      const isPublishedNow = currentClass?.schedulePublished === true;
      await db.classes.update(classId, {
        schedulePublished: !isPublishedNow,
        updatedAt: new Date().toISOString()
      });
      toast.success(!isPublishedNow ? "Emploi du temps publié avec succès !" : "Emploi du temps masqué avec succès !");
    } catch (error) {
      console.error("Failed to toggle schedule publication state:", error);
      toast.error("Erreur lors de la mise à jour de la publication");
    }
  };

  // Manual save period
  const handleAdd = async () => {
    if (!newPeriod.subject) { toast.error("Matière requise"); return; }
    if (newPeriod.startTime >= newPeriod.endTime) { toast.error("Plage horaire invalide"); return; }

    if (currentConflict) {
      toast.warning(`Attention : ${currentConflict.message}`);
    }

    const matchedTeacher = dbTeachers.find(t => t.id === newPeriod.teacherId);
    await db.schedules.put({
      id: uuidv4(),
      merchantId,
      classId,
      schoolYear: selectedYear,
      shift: selectedShift,
      day: newPeriod.day,
      startTime: newPeriod.startTime,
      endTime: newPeriod.endTime,
      subject: newPeriod.subject,
      teacherId: newPeriod.teacherId || undefined,
      teacherName: matchedTeacher ? `${matchedTeacher.firstName} ${matchedTeacher.lastName}` : undefined,
      room: newPeriod.room || undefined,
      groupType: newPeriod.groupType,
      status: 'normal',
      updatedAt: new Date().toISOString()
    });

    toast.success("Horaire ajouté à l'emploi du temps !");
    setNewPeriod(prev => ({ ...prev, subject: '', teacherId: '', room: '' }));
  };

  const handleRemove = async (id: string) => {
    await db.schedules.delete(id);
    toast.success("Horaire retiré");
  };

  // Remplacement & cancellation popup interactions
  const openReplacementModal = (schedule: any) => {
    setSelectedScheduleToModify(schedule);
    setReplacementTeacherId(schedule.replacementTeacherId || '');
    setReplacementReason(schedule.replacementReason || 'Absence maladie');
    setReplacementStatus(schedule.status || 'replaced');
    setIsReplacementModalOpen(true);
  };

  const handleSaveReplacementRules = async () => {
    if (!selectedScheduleToModify) return;

    try {
      const matchedTeacher = dbTeachers.find(t => t.id === replacementTeacherId);
      
      const updatedData = {
        ...selectedScheduleToModify,
        status: replacementStatus,
        replacementReason: replacementStatus === 'replaced' ? replacementReason : undefined,
        replacementTeacherId: replacementStatus === 'replaced' ? (replacementTeacherId || undefined) : undefined,
        replacementTeacherName: replacementStatus === 'replaced' && matchedTeacher 
          ? `${matchedTeacher.firstName} ${matchedTeacher.lastName}` 
          : undefined,
        updatedAt: new Date().toISOString()
      };

      await db.schedules.put(updatedData);
      toast.success("Modifications enregistrées !");
      setIsReplacementModalOpen(false);

      // Offer to notify parents and teachers instantly
      setTimeout(() => {
        setIsNotificationModalOpen(true);
        prepNotificationLogs(updatedData);
      }, 300);

    } catch (e) {
      toast.error("Échec de l'enregistrement de la réaffectation");
    }
  };

  // Preparation for Simulated Notification Alerts
  const prepNotificationLogs = (updatedItem: any) => {
    const parentNotes: string[] = [];
    const classObj = dbClasses.find(c => c.id === updatedItem.classId);
    const className = classObj?.name || 'votre classe';
    
    if (updatedItem.status === 'canceled') {
      parentNotes.push(`[SMS Parent] "⚠️ Cher Parent, le cours de ${updatedItem.subject} prévu le ${updatedItem.day} à ${updatedItem.startTime} pour la classe ${className} est ANNULÉ. (Motif : Enseignant indisponible)"`);
    } else if (updatedItem.status === 'replaced') {
      parentNotes.push(`[SMS Parent] "ℹ️ Cher Parent, le cours de ${updatedItem.subject} le ${updatedItem.day} à ${updatedItem.startTime} est assuré par un professeur remplaçant : ${updatedItem.replacementTeacherName || 'M. Diop'}."`);
      parentNotes.push(`[WhatsApp Prof] "Bonjour ${updatedItem.replacementTeacherName}, vous êtes affecté en tant que remplaçant pour le cours de ${updatedItem.subject} en classe ${className} ce ${updatedItem.day} de ${updatedItem.startTime} à ${updatedItem.endTime} en ${updatedItem.room || 'Salle régulière'}."`);
    } else {
      parentNotes.push(`[Notification Élève] "L'emploi du temps de votre classe ${className} a été mis à jour par l'administration."`);
    }

    setNotificationLog(parentNotes);
  };

  const executeSimulatedDispatch = () => {
    setNotificationDispatching(true);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < notificationLog.length) {
        toast.info(`Transmission en cours : ${notificationLog[index].substring(0, 45)}...`, { duration: 1500 });
        index++;
      } else {
        clearInterval(interval);
        setNotificationDispatching(false);
        setIsNotificationModalOpen(false);
        toast.success("📱 Toutes les notifications (SMS & Parents) ont été acheminées avec succès via la Passerelle ACOM Mobile !");
      }
    }, 1200);
  };

  // PREMIUM AI TIMETABLE SOLVER SIMULATION
  const triggerAiGenerator = () => {
    if (classSubjects.length === 0 && subjects.length === 0) {
      toast.error("Veuillez d'abord attribuer des matières à cette classe ou en créer des globales.");
      return;
    }

    setAiLogs([
      "🔋 Initialisation du Moteur Intelligent ACOM Scheduler v4.2...",
      "🏫 Analyse des matières de la classe " + (currentClass?.name || "active") + " (Matières prioritaires détectées)...",
      "🕵️ Analyse de la disponibilité des professeurs qualifiés...",
      "📐 Cartographie des salles et vérification des contraintes d'occupation globales..."
    ]);
    setAiOptimizingStep(1);
    setIsAiOptimizerOpen(true);

    // Dynamic constraint generator
    const steps = [
      { text: "⚡ Calcul des priorités : Mathématiques et Sciences de bon matin, matières artistiques/Sport l'après-midi...", duration: 1500 },
      { text: "🤝 Attribution automatique des enseignants partenaires sans provoquer de doubles réservations...", duration: 1800 },
      { text: "🚫 Résolution des contraintes d'occupation de salles en temps réel (Salle Informatique & Labo)...", duration: 1600 },
      { text: "🎯 Création d'une pause obligatoire de 2h pour le bien-être physique des élèves...", duration: 1200 },
      { text: "💎 Finalisation de la répartition hebdomadaire optimale et sans le moindre conflit !", duration: 1400 }
    ];

    let currentStepIndex = 0;
    const runStep = () => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setTimeout(() => {
          setAiLogs(prev => [...prev, step.text]);
          currentStepIndex++;
          runStep();
        }, step.duration);
      } else {
        // Build auto schedule proposals
        const proposals: any[] = [];
        const studySubjects = classSubjects.length > 0 ? classSubjects : subjects.map(s => s.name);
        
        // Days of week
        const daysToFill = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        
        daysToFill.forEach((dayOption) => {
          // Add structured classes per day avoiding break slots
          const slots = standardTimeSlots
            .filter(slot => !slot.isBreak)
            .map((slot, index) => ({
              start: slot.start,
              end: slot.end,
              isMorningSci: index < 2
            }));

          slots.forEach((slot, index) => {
            // Pick a regular subject
            let sub = 'Français';
            if (slot.isMorningSci) {
              const morningSubs = studySubjects.filter((s: string) => 
                s.toLowerCase().includes('math') || 
                s.toLowerCase().includes('phys') || 
                s.toLowerCase().includes('chim') || 
                s.toLowerCase().includes('svt') ||
                s.toLowerCase().includes('science')
              );
              sub = morningSubs.length > 0 ? morningSubs[Math.floor(Math.random() * morningSubs.length)] : studySubjects[index % studySubjects.length];
            } else {
              const afternoonSubs = studySubjects.filter((s: string) => 
                !s.toLowerCase().includes('math') && 
                !s.toLowerCase().includes('phys') && 
                !s.toLowerCase().includes('svt')
              );
              sub = afternoonSubs.length > 0 ? afternoonSubs[Math.floor(Math.random() * afternoonSubs.length)] : studySubjects[(index + 2) % studySubjects.length];
            }

            if (!sub) sub = studySubjects[Math.floor(Math.random() * studySubjects.length)] || "Matière Académique";

            // Find teacher who can teach this or a default one
            const potentialTeacher = dbTeachers.find((t: any) => 
              t.subject?.toLowerCase().trim() === sub.toLowerCase().trim()
            ) || dbTeachers[Math.floor(Math.random() * dbTeachers.length)];

            // Select smart room
            let chosenRoom = suggestedRooms[Math.floor(Math.random() * suggestedRooms.length)];
            if (sub.toLowerCase().includes('svt') || sub.toLowerCase().includes('biol')) chosenRoom = 'Laboratoire SVT';
            if (sub.toLowerCase().includes('sport') || sub.toLowerCase().includes('eps')) chosenRoom = 'Terrain de Sport';
            if (sub.toLowerCase().includes('info') || sub.toLowerCase().includes('tech')) chosenRoom = 'Salle Informatique';

            // Check if this generated item has overlap conflict in other merchant schedules
            const conflictInfo = checkConflict(dayOption, slot.start, slot.end, potentialTeacher?.id, chosenRoom);
            
            // Only add if it does not conflict!
            if (!conflictInfo) {
              proposals.push({
                id: uuidv4(),
                merchantId,
                classId,
                schoolYear: selectedYear,
                shift: selectedShift,
                day: dayOption,
                startTime: slot.start,
                endTime: slot.end,
                subject: sub,
                teacherId: potentialTeacher?.id || undefined,
                teacherName: potentialTeacher ? `${potentialTeacher.firstName} ${potentialTeacher.lastName}` : "Recrutement en Cours",
                room: chosenRoom,
                groupType: 'Both',
                status: 'normal',
                updatedAt: new Date().toISOString()
              });
            }
          });
        });

        setAiGeneratedSchedules(proposals);
        setAiOptimizingStep(2); // Review state
      }
    };

    runStep();
  };

  const applyAiScheduleToDb = async () => {
    try {
      // Clean up previous schedules for this class before copying
      const oldSchedules = allMerchantSchedules.filter(s => s.classId === classId);
      for (const old of oldSchedules) {
        await db.schedules.delete(old.id);
      }

      // Add new ones
      for (const item of aiGeneratedSchedules) {
        await db.schedules.put(item);
      }

      toast.success("🪄 L'emploi du temps généré par l'IA a été enregistré et déployé avec succès !");
      setIsAiOptimizerOpen(false);
    } catch (err) {
      toast.error("Échec du déploiement de la solution IA");
    }
  };

  // CSV Export
  const downloadCsvFormat = () => {
    try {
      let content = "Jour,Debut,Fin,Matiere,Professeur,Salle,Statut,AnneeScolaire\n";
      schedules.forEach(s => {
        content += `"${s.day}","${s.startTime}","${s.endTime}","${s.subject}","${s.teacherName || 'Aucun'}","${s.room || 'Aucune'}","${s.status || 'Active'}","${s.schoolYear || '2025-2026'}"\n`;
      });
      
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Emploi_Du_Temps_${currentClass?.name || 'Classe'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel/CSV exporté avec succès !");
    } catch (e) {
      toast.error("Échec de l'exportation CSV");
    }
  };

  // Printing Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 space-y-8 print:p-0 print:border-none print:shadow-none">
      
      {/* Dynamic inline print styles to keep layout elegant on A4 */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, nav, aside, footer, .mb-6, .bg-slate-50, button, select, input, .no-print {
            display: none !important;
          }
          .print-timetable-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .grid {
            display: grid !important;
          }
        }
      `}</style>

      {/* 1. Header with metadata context */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-100 pb-6 gap-4 no-print">
        <div>
          <span className="text-[10px] font-mono font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full tracking-widest">
            Acom Technologies • Administration Académique
          </span>
          <h3 className="text-2xl font-black text-slate-800 mt-2 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Gestion des Emplois du Temps
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Plannings, salles, professeurs et prévention intelligente des conflits pour la classe.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Published state indicator */}
          <button
            onClick={handleTogglePublish}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all select-none border ${
              currentClass?.schedulePublished
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentClass?.schedulePublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {currentClass?.schedulePublished ? "État : Publié" : "État : Non Publié"}
            {currentClass?.schedulePublished ? <Eye className="w-3.5 h-3.5 ml-1" /> : <EyeOff className="w-3.5 h-3.5 ml-1" />}
          </button>

          {/* AI Generator Trigger */}
          <button
            onClick={triggerAiGenerator}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all hover:scale-105 shadow-md shadow-indigo-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Planification IA (Premium)
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Format A4 / Imprimer
          </button>

          {/* CSV Excel Exporter */}
          <button
            onClick={downloadCsvFormat}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* 2. Global filters panel (School year & Double Flow system) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-3xl border border-gray-100 no-print">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Année Scolaire</label>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-slate-800"
          >
            <option value="2024-2025">2024 - 2025</option>
            <option value="2025-2026">2025 - 2026</option>
            <option value="2026-2027">2026 - 2027</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Système de Flux (Sénégal / Double Flux)</label>
          <select 
            value={selectedShift} 
            onChange={e => setSelectedShift(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-slate-800"
          >
            <option value="Régulier">Régulier (Plein temps)</option>
            <option value="Matin">Double flux : Session Matin (07h30 - 12h45)</option>
            <option value="Après-midi">Double flux : Session Après-midi (13h00 - 18h15)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type de Présentation Calendrier</label>
          <div className="flex bg-white p-1 rounded-xl border border-gray-150">
            <button 
              onClick={() => setViewType('grid')}
              className={`flex-1 text-center py-1 rounded-lg text-xs font-bold ${viewType === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Grille Hebdo
            </button>
            <button 
              onClick={() => setViewType('cards')}
              className={`flex-1 text-center py-1 rounded-lg text-xs font-bold ${viewType === 'cards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Par Jour
            </button>
            <button 
              onClick={() => setViewType('timeline')}
              className={`flex-1 text-center py-1 rounded-lg text-xs font-bold ${viewType === 'timeline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Flux Global
            </button>
          </div>
        </div>
      </div>

      {/* 3. Real-time Conflict Toast alert strip */}
      {currentConflict && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-start gap-3 text-xs animate-shake no-print">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Détection de conflit en cours :</span>
            <p className="font-medium">{currentConflict.message}</p>
          </div>
        </div>
      )}

      {/* 4. Plan Creator Panel (Manual) */}
      <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100/50 space-y-4 no-print">
        <h4 className="text-xs font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-500" />
          Planifier un créneau horaire manuellement
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Jour</label>
            <select 
              value={newPeriod.day} 
              onChange={e => setNewPeriod({...newPeriod, day: e.target.value})} 
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-slate-800"
            >
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Début & Fin</label>
            <div className="flex gap-1">
              <input 
                type="time" 
                value={newPeriod.startTime} 
                onChange={e => setNewPeriod({...newPeriod, startTime: e.target.value})} 
                className="w-1/2 px-2 py-2 bg-white rounded-xl border border-gray-200 text-xs text-center font-semibold"
              />
              <input 
                type="time" 
                value={newPeriod.endTime} 
                onChange={e => setNewPeriod({...newPeriod, endTime: e.target.value})} 
                className="w-1/2 px-2 py-2 bg-white rounded-xl border border-gray-200 text-xs text-center font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Matière</label>
            <select 
              value={newPeriod.subject} 
              onChange={e => setNewPeriod({...newPeriod, subject: e.target.value})} 
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-extrabold text-indigo-900"
            >
              <option value="">-- Choisir --</option>
              {classSubjects.length > 0 ? (
                classSubjects.map((sub: string, idx: number) => <option key={idx} value={sub}>{sub}</option>)
              ) : (
                subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Professeur Chargé</label>
            <select 
              value={newPeriod.teacherId} 
              onChange={e => setNewPeriod({...newPeriod, teacherId: e.target.value})} 
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-slate-800"
            >
              <option value="">Aucun / A affecter</option>
              {dbTeachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.subject || 'Général'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Salle attribuée</label>
            <input 
              type="text" 
              list="salles-suggestions"
              value={newPeriod.room} 
              onChange={e => setNewPeriod({...newPeriod, room: e.target.value})} 
              placeholder="Ex: Salle 01"
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs text-slate-800 font-bold"
            />
            <datalist id="salles-suggestions">
              {suggestedRooms.map((roomOpt, rIdx) => <option key={rIdx} value={roomOpt} />)}
            </datalist>
          </div>

          <button 
            onClick={handleAdd}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 h-[36px]"
          >
            <Plus className="w-4 h-4" />
            Planifier
          </button>
        </div>
      </div>

      {/* 5. Timetable views (The Core Output Area) */}
      <div className="print-timetable-area">
        
        {/* Title metadata for printout layouts */}
        <div className="hidden print:block pb-5 border-b border-gray-300 mb-6">
          <h2 className="text-3xl font-black text-black">ACOM TECHNOLOGIES Académique</h2>
          <h3 className="text-xl font-bold text-gray-700 mt-1">Emploi du Temps Officiel : Classe {currentClass?.name || "Scolaire"}</h3>
          <p className="text-sm text-gray-500 mt-1">Année Scolaire : {selectedYear} | Système : {selectedShift} | Imprimé le {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-gray-150 text-slate-400 no-print">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30 text-indigo-500" />
            <h5 className="text-lg font-bold text-slate-700">Aucun cours planifié pour le moment</h5>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Utilisez le formulaire ci-dessus pour planifier un cours ou cliquez sur "Planification IA" pour générer un emploi du temps intelligent en un clic.
            </p>
          </div>
        ) : viewType === 'grid' ? (
          
          /* VIEW TYPE A: Weekly interactive Grid (Google Calendar style) */
          <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm bg-white">
            <div className="grid grid-cols-7 bg-indigo-900 text-white text-xs font-black uppercase tracking-widest text-center py-4">
              <div className="border-r border-indigo-800/50 py-1">Horaires</div>
              {days.map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            <div className="divide-y divide-gray-100">
              {standardTimeSlots.map((slot, sIdx) => {
                if (slot.isBreak) {
                  return (
                    <div key={sIdx} className="grid grid-cols-7 bg-slate-50 text-slate-400 text-xs font-bold text-center py-3 select-none">
                      <div className="font-mono text-[10px] flex items-center justify-center border-r border-slate-150 py-1">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {slot.start} - {slot.end}
                      </div>
                      <div className="col-span-6 flex items-center justify-center font-black uppercase tracking-widest text-[9px] text-slate-500">
                        ☕ Pause Déjeuner Obligatoire / Temps Mort Éducatif
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={sIdx} className="grid grid-cols-7 items-stretch min-h-[110px]">
                    <div className="bg-slate-50/50 text-slate-500 text-xs font-bold text-center p-3 flex flex-col items-center justify-center border-r border-gray-100 gap-1 select-none">
                      <span className="font-black text-indigo-900 text-[10px] block uppercase">{slot.label}</span>
                      <span className="font-mono text-[9px]">{slot.start} - {slot.end}</span>
                    </div>

                    {days.map(day => {
                      const dayLessons = schedules.filter(s => s.day === day && 
                        toMins(s.startTime) >= toMins(slot.start) && 
                        toMins(s.startTime) < toMins(slot.end)
                      );

                      return (
                        <div key={day} className="border-r border-gray-100 p-2.5 space-y-2 flex flex-col justify-center min-h-[95px] hover:bg-slate-50/40 relative">
                          {dayLessons.map(lesson => {
                            const paint = getSubjectColorStyle(lesson.subject);
                            const isCanceled = lesson.status === 'canceled';
                            const isReplaced = lesson.status === 'replaced';

                            return (
                              <div
                                key={lesson.id}
                                className={`rounded-2xl p-2.5 border text-left transition-all relative ${paint.bg} ${paint.ring} ${isCanceled ? 'opacity-40 border-slate-300 bg-slate-100' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <span className={`text-[10px] font-black uppercase whitespace-nowrap px-1.5 py-0.5 rounded-md ${paint.badge} ${isCanceled ? 'line-through text-slate-400 bg-slate-200' : ''}`}>
                                    {lesson.subject}
                                  </span>
                                  
                                  {/* Delete on click */}
                                  <button
                                    onClick={() => handleRemove(lesson.id)}
                                    className="no-print text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 font-extrabold">
                                  <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span>{lesson.startTime} - {lesson.endTime}</span>
                                </div>

                                <div className="mt-1.5 text-xs font-black text-slate-800 leading-tight">
                                  {isCanceled ? (
                                    <span className="text-rose-600 line-through text-[10px]">COURS ANNULÉ</span>
                                  ) : isReplaced ? (
                                    <span className="text-violet-700 flex items-center gap-0.5 font-bold">
                                      <RefreshCw className="w-3 h-3 text-violet-500 animate-spin" />
                                      {lesson.replacementTeacherName || "Suppléant"}
                                    </span>
                                  ) : (
                                    <span>{lesson.teacherName || "A affecter"}</span>
                                  )}
                                </div>

                                <div className="mt-1 flex flex-wrap gap-1 items-center justify-between">
                                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {lesson.room || "Non spécifiée"}
                                  </span>
                                  
                                  {lesson.groupType && lesson.groupType !== 'Both' && (
                                    <span className="text-[9px] bg-slate-200 text-slate-700 font-black px-1.5 rounded-full select-none">
                                      Gr. {lesson.groupType}
                                    </span>
                                  )}
                                </div>

                                {/* Mini Action Replacement Button */}
                                <div className="mt-2 border-t border-black/5 pt-1.5 flex justify-end no-print">
                                  <button
                                    onClick={() => openReplacementModal(lesson)}
                                    className="text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:underline flex items-center gap-0.5"
                                  >
                                    <UserCheck className="w-2.5 h-2.5" />
                                    Substituer / Remplacement
                                  </button>
                                </div>

                                {isCanceled && (
                                  <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none select-none">
                                    <span className="bg-rose-600/90 text-white font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded-md shadow-sm border border-rose-300">
                                      Indisponible
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {dayLessons.length === 0 && (
                            <div className="h-full flex items-center justify-center text-[10px] text-slate-300 italic select-none">
                              Libre
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

        ) : viewType === 'cards' ? (
          
          /* VIEW TYPE B: Simple Adaptive Card lists per Weekday */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {days.map(day => {
              const daySlots = schedules.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
              return (
                <div key={day} className="bg-slate-50 p-5 rounded-3xl border border-gray-150 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <h5 className="font-extrabold text-slate-800 text-sm uppercase tracking-widest">{day}</h5>
                    <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-xl">
                      {daySlots.length} Cours
                    </span>
                  </div>

                  <div className="space-y-3">
                    {daySlots.map(s => {
                      const paint = getSubjectColorStyle(s.subject);
                      return (
                        <div key={s.id} className={`p-4 rounded-2xl bg-white border ${paint.ring} shadow-sm space-y-2 relative overflow-hidden`}>
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${paint.badge}`}>
                              {s.subject}
                            </span>
                            <button onClick={() => handleRemove(s.id)} className="text-slate-400 hover:text-rose-500 transition-colors no-print">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{s.startTime} - {s.endTime}</span>
                          </div>

                          <div className="text-xs font-black text-slate-700">
                            {s.status === 'canceled' ? (
                              <span className="text-rose-500 line-through">Annulé</span>
                            ) : s.status === 'replaced' ? (
                              <span className="text-violet-700 font-bold">Remplaçant : {s.replacementTeacherName}</span>
                            ) : (
                              <span>Professeur : {s.teacherName || 'Aucun'}</span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{s.room || 'Salle non assignée'}</span>
                          </div>

                          <div className="pt-2 border-t border-black/5 flex justify-end no-print">
                            <button
                              onClick={() => openReplacementModal(s)}
                              className="text-[10px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-0.5"
                            >
                              Substitution / Remplacement
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {daySlots.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400 italic">
                        Aucun cours défini
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          
          /* VIEW TYPE C: Timeline chronological list (Google Calendar list style) */
          <div className="bg-white p-6 border border-gray-150 rounded-[2.5rem] shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Chronologie des enseignements de la classe</h4>
            <div className="space-y-3">
              {days.map(day => {
                const daySlots = schedules.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) return null;

                return (
                  <div key={day} className="flex gap-4">
                    <div className="w-[100px] text-right font-black uppercase text-slate-700 tracking-wider text-xs pt-3.5 shrink-0">
                      {day}
                    </div>
                    
                    <div className="flex-1 divide-y divide-gray-100 bg-slate-50 rounded-2xl p-4 border border-gray-100">
                      {daySlots.map(s => {
                        const paint = getSubjectColorStyle(s.subject);
                        return (
                          <div key={s.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-slate-500 font-bold whitespace-nowrap">{s.startTime} - {s.endTime}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${paint.badge}`}>
                                {s.subject}
                              </span>
                              <span className="text-slate-800 font-black">
                                {s.status === 'canceled' ? (
                                  <span className="text-rose-500 line-through">COURS ANNULÉ</span>
                                ) : s.status === 'replaced' ? (
                                  <span className="text-violet-600">Remplacé: {s.replacementTeacherName}</span>
                                ) : (
                                  s.teacherName || 'Aucun affecté'
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 font-bold">{s.room || 'Salle ?'}</span>
                              <button onClick={() => handleRemove(s.id)} className="text-rose-500 hover:scale-110 transition-transform no-print">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. AI OPTIMIZER & GENERATOR MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAiOptimizerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl max-w-2xl w-full p-8 max-h-[85vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
                    ACOM Premium AI Auto-Scheduler
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Moteur de génération de l'emploi du temps optimal pour la classe {currentClass?.name}.</p>
                </div>
                <button onClick={() => setIsAiOptimizerOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {aiOptimizingStep === 1 ? (
                /* Step 1: Loading Progression logs */
                <div className="space-y-6 text-center py-8">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse" />
                    <div className="absolute inset-x-0 top-0 h-10 w-10 border-4 border-dashed border-indigo-600 rounded-full animate-spin mx-auto mt-5" />
                  </div>

                  <div className="bg-slate-900 text-emerald-400 font-mono text-xs text-left p-5 rounded-2xl max-h-[220px] overflow-y-auto space-y-2 select-none shadow-inner border border-slate-800">
                    {aiLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-1.5 items-start">
                        <span className="text-slate-600 shrink-0 select-none">&gt;</span>
                        <p>{log}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 animate-pulse font-bold">Optimisation matricielle sous des milliers de contraintes réelles...</p>
                </div>
              ) : (
                /* Step 2: Confirmation / Action on Generated Schedules */
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <h5 className="font-extrabold text-indigo-900 text-xs uppercase tracking-wider">Solution d'Optimisation Prête !</h5>
                      <p className="text-xs text-indigo-800 mt-0.5">
                        L'IA a généré un emploi du temps hebdomadaire complet contenant <b>{aiGeneratedSchedules.length} créneaux de cours</b> sans le moindre conflit détecté de professeur ni de salle.
                      </p>
                    </div>
                  </div>

                  <div className="border border-gray-150 rounded-2xl overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-gray-100">
                    {aiGeneratedSchedules.map((item, idx) => (
                      <div key={idx} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50 bg-white">
                        <div className="flex gap-2 items-center">
                          <span className="font-extrabold text-indigo-700 w-16 uppercase">{item.day}</span>
                          <span className="font-mono text-slate-500 px-1">{item.startTime} - {item.endTime}</span>
                          <span className="font-bold bg-slate-100 px-1.5 rounded-md">{item.subject}</span>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-bold">
                          <span>👤 {item.teacherName}</span>
                          <span className="block italic">📍 {item.room}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setIsAiOptimizerOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={applyAiScheduleToDb}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Écraser & Déployer l'Emploi du Temps
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. REMPLACEMENT / SUBSTITUTION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isReplacementModalOpen && selectedScheduleToModify && (
          <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl max-w-md w-full p-8 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-black text-slate-800">Assignation & Remplacement</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Cours de <strong className="text-indigo-600">{selectedScheduleToModify.subject}</strong> du {selectedScheduleToModify.day} à {selectedScheduleToModify.startTime}
                  </p>
                </div>
                <button onClick={() => setIsReplacementModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Toggle */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Statut du Cours</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-gray-150">
                    <button
                      onClick={() => { setReplacementStatus('normal'); }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${replacementStatus === 'normal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                      Régulier
                    </button>
                    <button
                      onClick={() => { setReplacementStatus('replaced'); }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${replacementStatus === 'replaced' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                      Remplacé
                    </button>
                    <button
                      onClick={() => { setReplacementStatus('canceled'); }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${replacementStatus === 'canceled' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                      Annulé
                    </button>
                  </div>
                </div>

                {replacementStatus === 'replaced' && (
                  <>
                    {/* Choose Substitute Teacher */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sélectionner le Remplaçant</label>
                      <select
                        value={replacementTeacherId}
                        onChange={e => setReplacementTeacherId(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-slate-800"
                      >
                        <option value="">-- Choisir un enseignant --</option>
                        {dbTeachers.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.firstName} {t.lastName} ({t.subject || 'Enseignant'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reason for substitution */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Motif du Remplacement</label>
                      <input
                        type="text"
                        value={replacementReason}
                        onChange={e => setReplacementReason(e.target.value)}
                        placeholder="Ex: Absence maladie / Convocation administrative"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-slate-800"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsReplacementModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Fermer
                </button>
                <button
                  onClick={handleSaveReplacementRules}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 8. REAL-TIME PASSENGER NOTIFICATION DISPATCH MODAL (African double-flux/SMS) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isNotificationModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl max-w-lg w-full p-8 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-indigo-50 rounded-2xl">
                    <Bell className="w-5 h-5 text-indigo-600 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800">Passerelle de Notification Scolaire</h4>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">ACOM Push Notification Services</p>
                  </div>
                </div>
                <button onClick={() => setIsNotificationModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Des modifications de planning ont été apportées. Souhaitez-vous diffuser automatiquement et immédiatement ces alertes de remplacement aux tuteurs, élèves et professeurs concernés par SMS & WhatsApp (Acom Mobile Gateway) ?
              </p>

              <div className="bg-slate-50 p-4 border border-gray-100 rounded-2xl shrink-0 space-y-2 max-h-[160px] overflow-y-auto">
                {notificationLog.map((logStr, lIdx) => (
                  <div key={lIdx} className="text-[11px] text-indigo-850 font-bold bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm leading-snug flex items-start gap-2">
                    <Send className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <p>{logStr}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsNotificationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  disabled={notificationDispatching}
                >
                  Ne pas notifier
                </button>
                <button
                  onClick={executeSimulatedDispatch}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                  disabled={notificationDispatching}
                >
                  {notificationDispatching ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-dashed border-white rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Diffuser les alertes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
