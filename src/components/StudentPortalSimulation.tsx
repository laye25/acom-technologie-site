import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  X, LayoutDashboard, FileText, Calendar, 
  Clock, BookOpen, Bell, ShieldAlert,
  LogOut, Download, AlertTriangle, CheckCircle2, ChevronRight, User, Key, Users, Share2, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const StudentPortalSimulation = ({ student, merchant, onClose }: { student: any, merchant: any, onClose: () => void }) => {
  const [activeTab, setActiveTab ] = useState('dashboard');
  const [scheduleViewType, setScheduleViewType] = useState<'grid' | 'day' | 'flow'>('grid');
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dName = daysMap[new Date().getDay()];
    return dName === 'Dimanche' ? 'Lundi' : dName;
  });
  const studentData = student?.student || student;

  const resolvedMerchantId = useMemo(() => {
    return merchant?.id && merchant.id !== 'fallback-id' 
      ? merchant.id 
      : (studentData?.merchantId || studentData?.merchant_id || localStorage.getItem('merchantId') || '');
  }, [merchant, studentData]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Proactive Sync on Portal Session load
  React.useEffect(() => {
    if (resolvedMerchantId && studentData?.id) {
      console.log("[StudentPortal] Triggering proactive SaaS collection synchronization with merchant:", resolvedMerchantId);
      setIsSyncing(true);
      import('../services/syncService').then(({ syncService }) => {
        syncService.syncStudentData(resolvedMerchantId, studentData.id).finally(() => {
          setIsSyncing(false);
          toast.success("Espace personnel synchronisé", { icon: "🔄", id: "sync" });
        });
      }).catch(err => {
        console.error("[StudentPortal] Fail to trigger proactive sync:", err);
        setIsSyncing(false);
      });
    }
  }, [resolvedMerchantId, studentData?.id]);

  const studentClasses = useLiveQuery(() => 
    resolvedMerchantId ? db.classes?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const subjects = useLiveQuery(() => 
    resolvedMerchantId ? db.subjects?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const subjectsMap = useMemo(() => {
    const m = new Map<string, string>();
    subjects.forEach((s: any) => {
      m.set(s.id, s.name);
    });
    return m;
  }, [subjects]);

  const schedules = useLiveQuery(() => 
    resolvedMerchantId ? db.schedules?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const studentClassObj = useMemo(() => {
    if (!studentData) return null;
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    const studentGrade = studentData.grade || studentData.class;
    const studentClassId = studentData.classId || studentData.class_id;
    return studentClasses.find((c: any) => 
      (studentClassId && c.id === studentClassId) || 
      isClassNameSimilar(c.name, studentGrade)
    );
  }, [studentClasses, studentData]);

  const classSchedules = useMemo(() => {
    if (!studentData?.classId && !studentData?.class_id && !studentData?.grade && !studentData?.class) return [];
    const studentGrade = studentData.grade || studentData.class;
    const studentClassId = studentData.classId || studentData.class_id;
    
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };

    return schedules.filter((s: any) => {
      const matchesClassId = studentClassId && s.classId === studentClassId;
      const matchedClass = studentClasses.find(c => c.id === s.classId);
      const matchesClassName = matchedClass && isClassNameSimilar(matchedClass.name, studentGrade);
      const sClassIdStr = (s.classId || '').toString();
      const matchesDirectNameLike = isClassNameSimilar(sClassIdStr, studentGrade);
      return matchesClassId || matchesClassName || matchesDirectNameLike;
    });
  }, [schedules, studentClasses, studentData]);

  const attendances = useLiveQuery(() => 
    studentData?.id ? db.attendance?.where('studentId').equals(studentData.id).reverse().sortBy('date') : []
  , [studentData?.id]) || [];

  const homeworks = useLiveQuery(() => 
    resolvedMerchantId ? db.homeworks?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const validHomeworks = useMemo(() => {
    if (!homeworks) return [];
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    return homeworks.filter((h: any) => {
      const matchesClassId = studentClassObj && h.classId === studentClassObj.id;
      const studentClassId = studentData?.classId || studentData?.class_id;
      const matchesStudentClassId = studentClassId && h.classId === studentClassId;
      
      const studentGrade = studentData?.grade || studentData?.class;
      const hClassIdStr = (h.classId || '').toString();
      const matchesStudentGrade = studentGrade && (
        isClassNameSimilar(studentGrade, h.grade) || 
        isClassNameSimilar(studentGrade, h.class) || 
        isClassNameSimilar(studentGrade, hClassIdStr)
      );
      
      return matchesClassId || matchesStudentClassId || matchesStudentGrade;
    });
  }, [homeworks, studentClassObj, studentData]);

  const studentGrades = useLiveQuery(() => 
    studentData?.id ? db.grades?.where('studentId').equals(studentData.id).toArray() : []
  , [studentData?.id]) || [];

  const parentCredentials = useLiveQuery(async () => {
    const parentPhone = studentData?.fatherPhone || studentData?.motherPhone || studentData?.guardianPhone || studentData?.parentContact || '';
    if (!parentPhone) return null;
    return await db.parents?.where('phone').equals(parentPhone).first();
  }, [studentData]) || null;

  const absences = attendances.filter(a => a.status === 'absent');
  const lates = attendances.filter(a => a.status === 'late');

  const tabs = [
    { id: 'dashboard', label: 'Espace Accueil', icon: LayoutDashboard },
    { id: 'academics', label: 'Mes Notes & Résultats', icon: FileText },
    { id: 'attendance', label: 'Feuille d\'Absence', icon: Clock },
    { id: 'schedule', label: 'Emploi du Temps', icon: Calendar },
    { id: 'homework', label: 'Cahier de Texte', icon: BookOpen },
    { id: 'parent-access', label: 'Accès Mes Parents', icon: Users }
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié !`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'academics':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Mon Relevé de Notes</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Imprimer le Relevé</span>
                </button>
              </div>

              {studentGrades.length === 0 ? (
                <div className="text-center py-12 text-slate-450">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-medium">Aucune note n'a encore été saisie pour ce trimestre.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {studentGrades.map((g: any, idx: number) => {
                    const subjectName = subjectsMap.get(g.subjectId) || g.subjectId || 'Matière';
                    
                    const scoreD1 = g.devoir1 !== undefined && g.devoir1 !== '' ? Number(g.devoir1) : null;
                    const scoreD2 = g.devoir2 !== undefined && g.devoir2 !== '' ? Number(g.devoir2) : null;
                    const scoreCompo = g.compo !== undefined && g.compo !== '' ? Number(g.compo) : null;
                    
                    const devSum = (scoreD1 !== null ? scoreD1 : 0) + (scoreD2 !== null ? scoreD2 : 0);
                    const devCount = (scoreD1 !== null ? 1 : 0) + (scoreD2 !== null ? 1 : 0);
                    const devAvg = devCount > 0 ? devSum / devCount : null;
                    
                    let average: number | null = null;
                    if (devAvg !== null && scoreCompo !== null) {
                      average = (devAvg + scoreCompo * 2) / 3;
                    } else if (devAvg !== null) {
                      average = devAvg;
                    } else if (scoreCompo !== null) {
                      average = scoreCompo;
                    }

                    return (
                      <div key={g.id || idx} className="p-5 bg-slate-50 rounded-2xl border border-gray-200 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 font-extrabold">{subjectName}</span>
                            <p className="text-xs text-slate-500 mt-0.5 font-bold">{g.term || 'Trimestre 1'}</p>
                          </div>
                          {average !== null && (
                            <div className="text-right">
                              <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5">Moyenne</span>
                              <span className="text-xs font-black px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                {average.toFixed(2)} / 20
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-2 rounded-xl border border-gray-100 text-center shadow-xs">
                            <span className="text-[8px] uppercase font-bold text-slate-400 block">Devoir 1</span>
                            <span className="text-xs font-black text-slate-700">{scoreD1 !== null ? scoreD1.toFixed(1) : '-'}</span>
                            <span className="text-[8px] text-slate-500 font-bold block">/20</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-100 text-center shadow-xs">
                            <span className="text-[8px] uppercase font-bold text-slate-400 block">Devoir 2</span>
                            <span className="text-xs font-black text-slate-700">{scoreD2 !== null ? scoreD2.toFixed(1) : '-'}</span>
                            <span className="text-[8px] text-slate-500 font-bold block">/20</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-100 text-center shadow-xs border-indigo-100 bg-indigo-50/20">
                            <span className="text-[8px] uppercase font-bold text-indigo-600 block">Comp.</span>
                            <span className="text-xs font-black text-indigo-700">{scoreCompo !== null ? scoreCompo.toFixed(1) : '-'}</span>
                            <span className="text-[8px] text-indigo-500 font-bold block">/20</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'attendance':
        const filteredAttendances = attendances.filter(a => a.status === 'absent' || a.status === 'late');
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Mon Registre de Présence</h3>
              <div className="space-y-3">
                {filteredAttendances.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-8">Assiduité parfaite ! Aucune absence ni retard enregistré.</p>
                ) : (
                  filteredAttendances.map((a: any, idx: number) => (
                    <div key={a.id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.status === 'absent' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                          {a.status === 'absent' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{a.status === 'absent' ? 'Absence Signalée' : 'Retard Noté'}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Le {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${a.isJustified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {a.isJustified ? 'Justifié' : 'Injustified'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Mon Emploi du Temps</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Classe : <strong className="text-indigo-600 font-extrabold">{studentData?.grade || 'Non spécifiée'}</strong>
                  </p>
                </div>

                {/* Switcher pour le Type de Présentation Calendrier */}
                {(studentClassObj?.schedulePublished !== false) && classSchedules.length > 0 && (
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-gray-100 inline-flex self-start">
                    <button 
                      onClick={() => setScheduleViewType('grid')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${scheduleViewType === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Grille Hebdo
                    </button>
                    <button 
                      onClick={() => setScheduleViewType('day')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${scheduleViewType === 'day' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Par Jour
                    </button>
                    <button 
                      onClick={() => setScheduleViewType('flow')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${scheduleViewType === 'flow' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Flux Global
                    </button>
                  </div>
                )}
              </div>
              
              {studentClassObj?.schedulePublished === false ? (
                <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-amber-200 text-amber-800">
                  <EyeOff className="w-12 h-12 mx-auto mb-3 text-amber-500 animate-pulse" />
                  <p className="text-sm font-bold text-amber-900">Emploi du temps non publié</p>
                  <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">L'emploi du temps officiel de votre classe n'a pas encore été publié officiellement par l'administration ou est en cours d'élaboration.</p>
                </div>
              ) : classSchedules.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-gray-100 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
                  <p className="text-sm font-bold text-slate-700">Aucun emploi du temps officiel n'est disponible ou n'a encore été défini pour la classe {studentData?.grade || 'de l\'élève'}.</p>
                  <p className="text-xs text-slate-500 mt-1">Veuillez contacter l'administration de l'établissement pour la programmation horologique.</p>
                </div>
              ) : (
                <div>
                  {/* HELPER FONCTIONS POUR CARTES D'EMPLOI DU TEMPS */}
                  {(() => {
                    const renderClassCard = (s: any, idx: number) => {
                      const isCanceled = s.status === 'canceled';
                      const isReplaced = s.status === 'replaced';
                      
                      const getSubjectSubColor = (n: string) => {
                        const k = (n || '').toLowerCase();
                        if (k.includes('math')) return 'bg-emerald-50 text-emerald-800 border-emerald-250';
                        if (k.includes('fran') || k.includes('lettre')) return 'bg-blue-50 text-blue-800 border-blue-200';
                        if (k.includes('phys') || k.includes('chim')) return 'bg-amber-50 text-amber-850 border-amber-200';
                        if (k.includes('svt') || k.includes('sci')) return 'bg-teal-50 text-teal-800 border-teal-200';
                        if (k.includes('hist') || k.includes('géo') || k.includes('geo')) return 'bg-orange-50 text-orange-850 border-orange-200';
                        if (k.includes('sport') || k.includes('eps')) return 'bg-rose-50 text-rose-800 border-rose-200';
                        return 'bg-slate-50 text-slate-700 border-slate-200';
                      };

                      const badgeColor = getSubjectSubColor(s.subject);

                      return (
                        <div key={s.id || idx} className={`p-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-indigo-200 relative ${isCanceled ? 'opacity-50' : ''}`}>
                          <p className="text-[9px] font-bold text-indigo-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {s.startTime} - {s.endTime}
                          </p>
                          
                          <p className={`font-black text-slate-800 text-xs mt-1.5 inline-block px-2 py-0.5 rounded-lg border ${badgeColor}`}>
                            {s.subject}
                          </p>

                          {isCanceled ? (
                            <p className="text-[9px] font-black text-rose-600 uppercase mt-2 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg text-center">❌ Cours Annulé</p>
                          ) : isReplaced ? (
                            <div className="mt-2 space-y-0.5 bg-purple-50/50 border border-purple-100 p-1.5 rounded-xl">
                              <p className="text-[8px] font-black text-purple-700 uppercase tracking-wider text-center flex items-center justify-center gap-0.5">🔄 Remplaçant Assigné</p>
                              <p className="text-[10px] text-purple-900 font-black text-center mt-0.5">{s.replacementTeacherName || 'M. Diop'}</p>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600 font-extrabold mt-1.5 flex items-center gap-1">
                              <span>👤</span>
                              {s.teacherName || 'Enseignant'}
                            </p>
                          )}

                          {s.room && (
                            <p className="text-[9px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                              <span>📍</span>
                              {s.room}
                            </p>
                          )}
                        </div>
                      );
                    };

                    {/* RENDU DES DIFFERENTS TYPES DE PRESENTATIONS */}
                    if (scheduleViewType === 'grid') {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                            const daySlots = classSchedules
                              .filter((s: any) => s.day === day)
                              .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
                            
                            return (
                              <div key={day} className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex flex-col h-full min-h-[250px] space-y-3">
                                <h4 className="font-extrabold text-indigo-700 text-xs uppercase tracking-wider text-center border-b border-indigo-200 pb-2 bg-indigo-50/50 py-1 rounded-md">
                                  {day}
                                </h4>
                                <div className="space-y-2 flex-grow">
                                  {daySlots.length === 0 ? (
                                    <div className="h-full flex flex-col justify-center items-center py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-100/20">
                                      <span className="text-base opacity-40">☕</span>
                                      <p className="text-[10px] font-bold text-slate-400 mt-1">Pas de cours</p>
                                    </div>
                                  ) : (
                                    daySlots.map((s: any, idx: number) => renderClassCard(s, idx))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else if (scheduleViewType === 'day') {
                      return (
                        <div className="space-y-6">
                          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                              const hasClasses = classSchedules.some((s: any) => s.day === day);
                              const isActive = selectedDay === day;
                              return (
                                <button
                                  key={day}
                                  onClick={() => setSelectedDay(day)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-gray-200'
                                  }`}
                                >
                                  <span>{day}</span>
                                  {hasClasses && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-indigo-500'}`} />}
                                </button>
                              );
                            })}
                          </div>
                          {(() => {
                            const daySlots = classSchedules
                              .filter((s: any) => s.day === selectedDay)
                              .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

                            if (daySlots.length === 0) {
                              return (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-gray-100 max-w-md mx-auto">
                                  <span className="text-3xl">☕</span>
                                  <h4 className="font-extrabold text-slate-700 text-xs mt-3">Pas de cours programmé</h4>
                                  <p className="text-[11px] text-slate-500 mt-1">Profitez de ce moment de repos ou d'étude personnelle !</p>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {daySlots.map((s: any, idx: number) => renderClassCard(s, idx))}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    } else {
                      // FLUX GLOBAL (Flow)
                      return (
                        <div className="space-y-8 pl-2">
                          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                            const daySlots = classSchedules
                              .filter((s: any) => s.day === day)
                              .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

                            if (daySlots.length === 0) return null;

                            return (
                              <div key={day} className="relative pl-6 border-l-2 border-indigo-100 ml-2">
                                {/* Chrono Timeline Dot */}
                                <div className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                                
                                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <span>📅</span>
                                  <span>{day}</span>
                                  <span className="text-[10px] text-gray-400 lowercase font-medium">({daySlots.length} cours)</span>
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {daySlots.map((s: any, idx: number) => renderClassCard(s, idx))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        );

      case 'homework':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm col-span-1">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Mon Cahier de Texte
              </h3>
              
              {validHomeworks.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 text-center py-10">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3 animate-pulse" />
                    <p className="text-sm font-bold text-slate-700">Aucun devoir ou leçon n'a été publié pour l'instant.</p>
                    <p className="text-xs text-slate-500 mt-1">Consulte régulièrement cet espace pour suivre tes leçons.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {validHomeworks.map((h: any, idx: number) => (
                    <div key={h.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{h.subjectName || 'Général'}</span>
                        <span className="text-xs text-rose-500 font-bold">À rendre pour le: {new Date(h.dueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{h.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">{h.description || h.text || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'parent-access':
        const parentPhone = studentData?.fatherPhone || studentData?.motherPhone || studentData?.guardianPhone || studentData?.parentContact || 'Non renseigné';
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                Accès de mes Parents
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Chaque élève possède son propre accès tuteur associé. Partagez ces clés de connexion avec vos parents pour qu'ils se connectent à leur espace de suivi dédié.
              </p>

              <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-slate-400">Nom du Parent</span>
                  <p className="font-black text-slate-800 text-sm">{studentData?.fatherName || studentData?.motherName || studentData?.guardianName || "Tuteur Académique"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-indigo-50">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Identifiant Tuteur</span>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-mono text-xs font-black">
                      <span className="truncate">{parentCredentials?.username || parentPhone.replace(/[^0-9]/g, '') || parentPhone}</span>
                      <button onClick={() => handleCopy(parentCredentials?.username || parentPhone.replace(/[^0-9]/g, '') || parentPhone, "Identifiant")} className="text-indigo-600 hover:text-indigo-800 text-[10px] uppercase font-bold tracking-wider shrink-0 ml-2">Copier</button>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-indigo-50">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Code PIN d'Accès</span>
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-mono text-xs font-black">
                      <span>{parentCredentials?.password || "Aucun configuré"}</span>
                      {parentCredentials?.password && (
                        <button onClick={() => handleCopy(parentCredentials.password, "Code PIN")} className="text-indigo-600 hover:text-indigo-800 text-[10px] uppercase font-bold tracking-wider shrink-0 ml-2">Copier</button>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const id = parentCredentials?.username || parentPhone.replace(/[^0-9]/g, '') || parentPhone;
                    const pin = parentCredentials?.password || "---";
                    const shareText = `Bonjour parent de ${studentData.firstName}. Voici tes codes de connexion pour suivre mon dossier scolaire sur le Portail Parents : \nIdentifiant: ${id}\nCode PIN: ${pin}\nLien: ${window.location.origin}/login`;
                    handleCopy(shareText, "Message de partage");
                  }} 
                  className="w-full py-3 bg-indigo-600 hover:bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Préparer le partage WhatsApp de mes Parents</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ma Moyenne Générale</p>
                  <p className="text-2xl font-black text-slate-800">-- <span className="text-sm font-bold text-slate-400">/ 20</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Mes Absences/Retards</p>
                  <p className="text-2xl font-black text-slate-800">{absences.length + lates.length} <span className="text-sm font-bold text-slate-400">fiches</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cahier de Texte</p>
                  <p className="text-2xl font-black text-slate-800">{validHomeworks.length} <span className="text-sm font-bold text-slate-400">tâches</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Conduite/Discipline</p>
                  <p className="text-sm font-black text-slate-800 mt-1">Excellente</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-500" /> Notifications & Infos Établissement</h3>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start border-b border-gray-50 pb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Bienvenue sur ton Espace Portail Élève</p>
                      <p className="text-xs text-slate-500 mt-1">Accède à tes notes, cahier de texte et absences en temps réel. Partage tes codes tuteurs en cliquant sur "Accès Mes Parents".</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start border-b border-gray-50 pb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Cahier de texte à jour</p>
                      <p className="text-xs text-slate-500 mt-1">Consulte tes devoirs réguliers affectés par tes professeurs.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-indigo-500" /> Vos Clés de Connexion</h3>
                <div className="space-y-4 text-xs">
                  <p className="text-slate-500">Conservez précieusement ces identifiants pour vos prochains accès scolaires depuis n'importe quel écran :</p>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-gray-100">
                    <div className="flex justify-between items-center"><span className="font-bold text-slate-500">Type de Compte :</span> <strong className="text-slate-800 uppercase text-[10px] bg-slate-200 px-2 rounded">Élève</strong></div>
                    <div className="flex justify-between items-center"><span className="font-bold text-slate-500">Identifiant Unique :</span> <strong className="text-indigo-600 font-mono mt-0.5">{studentData?.studentUsername || studentData?.username || 'Inconnu'}</strong></div>
                    <div className="flex justify-between items-center"><span className="font-bold text-slate-500">Code PIN :</span> <strong className="text-slate-900 font-mono mt-0.5">{studentData?.studentPassword || studentData?.password || '---'}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-100/80 backdrop-blur-md overflow-hidden">
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full h-full bg-slate-50 flex flex-col md:flex-row relative shadow-2xl"
      >
        <div className="w-full md:w-80 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0 text-white">
          <div className="p-6 border-b border-slate-800 bg-indigo-950 text-white relative overflow-hidden shrink-0">
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">Portail Élèves</h2>
                <p className="text-xs font-medium text-indigo-200">{merchant?.businessName || 'Espace Élève'}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 shrink-0">
              <p className="text-[9px] uppercase tracking-widest font-black text-indigo-300 mb-2">Mon Profil Scolaire</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white shadow-inner">
                  {studentData?.firstName?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{studentData?.firstName} {studentData?.lastName}</p>
                  <p className="text-xs text-indigo-200 truncate">Classe: {studentData?.grade || studentData?.class || studentData?.class_id || studentData?.classId || 'Non assigné'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
             {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-900 shrink-0">
            <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 rounded-xl text-sm font-bold transition-colors text-slate-400">
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

        <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
