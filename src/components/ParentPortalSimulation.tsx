import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  X, LayoutDashboard, FileText, Calendar, 
  Clock, BookOpen, CreditCard, Bell, 
  ShieldAlert, ShieldCheck, Bus, Utensils,
  LogOut, Download, AlertTriangle, CheckCircle2, ChevronRight, EyeOff
} from 'lucide-react';

export const ParentPortalSimulation = ({ parent, merchant, onClose }: { parent: any, merchant: any, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChild, setSelectedChild] = useState(parent?.children?.[0] || null);

  // Auto-select first child if parent's children array is populated/updated dynamically after sync
  React.useEffect(() => {
    if (!selectedChild && parent?.children?.[0]) {
      setSelectedChild(parent.children[0]);
    }
  }, [parent?.children, selectedChild]);
  const [scheduleViewType, setScheduleViewType] = useState<'grid' | 'day' | 'flow'>('grid');
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dName = daysMap[new Date().getDay()];
    return dName === 'Dimanche' ? 'Lundi' : dName;
  });

  const resolvedMerchantId = useMemo(() => {
    return merchant?.id && merchant.id !== 'fallback-id' 
      ? merchant.id 
      : (selectedChild?.merchantId || selectedChild?.merchant_id || localStorage.getItem('merchantId') || '');
  }, [merchant, selectedChild]);

  // Proactive Sync on Portal Session load
  React.useEffect(() => {
    if (resolvedMerchantId) {
      console.log("[ParentPortal] Triggering proactive SaaS collection synchronization with merchant:", resolvedMerchantId);
      import('../services/syncService').then(({ syncService }) => {
        syncService.syncSchoolPortalData(resolvedMerchantId, true);
      }).catch(err => {
        console.error("[ParentPortal] Fail to trigger proactive sync:", err);
      });
    }
  }, [resolvedMerchantId]);

  const attendances = useLiveQuery(() => 
    selectedChild ? db.attendance?.where('studentId').equals(selectedChild.id).reverse().sortBy('date') : []
  , [selectedChild?.id]) || [];

  const homeworks = useLiveQuery(() => 
    resolvedMerchantId ? db.homeworks?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const absences = attendances.filter(a => a.status === 'absent');
  const lates = attendances.filter(a => a.status === 'late');

  const studentClasses = useLiveQuery(() => 
    resolvedMerchantId ? db.classes?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const schedules = useLiveQuery(() => 
    resolvedMerchantId ? db.schedules?.where('merchantId').equals(resolvedMerchantId).toArray() : []
  , [resolvedMerchantId]) || [];

  const selectedChildGrades = useLiveQuery(() => 
    selectedChild?.id ? db.grades?.where('studentId').equals(selectedChild.id).toArray() : []
  , [selectedChild?.id]) || [];

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

  const selectedChildClass = useMemo(() => {
    if (!selectedChild) return null;
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    const childClassId = selectedChild.classId || selectedChild.class_id;
    const childGrade = selectedChild.grade || selectedChild.class;
    return studentClasses.find((c: any) => (childClassId && c.id === childClassId) || isClassNameSimilar(c.name, childGrade));
  }, [studentClasses, selectedChild]);

  const validHomeworks = useMemo(() => {
    if (!homeworks || !selectedChild) return [];
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    return homeworks.filter((h: any) => {
      const classId = h.classId || h.class_id;
      const childClassId = selectedChild.classId || selectedChild.class_id;
      const matchesClassId = childClassId && classId === childClassId;
      
      const matchedClass = studentClasses.find((c: any) => c.id === classId);
      const childGrade = selectedChild.grade || selectedChild.class || '';
      
      const matchesClassName = matchedClass && matchedClass.name && childGrade && isClassNameSimilar(matchedClass.name, childGrade);
      const matchesClassDirect = selectedChildClass && classId === selectedChildClass.id;
      
      const hClassIdStr = (classId || '').toString();
      const matchesDirectNameLike = isClassNameSimilar(hClassIdStr, childGrade);

      return matchesClassId || matchesClassName || matchesClassDirect || matchesDirectNameLike;
    });
  }, [homeworks, selectedChildClass, studentClasses, selectedChild]);

  const classSchedules = useMemo(() => {
    if (!selectedChild) return [];
    const isClassNameSimilar = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const clean = (s: string) => s.toString().toLowerCase().replace(/^(classe\s*:\s*|classe\s*)/gi, '').trim();
      const c1 = clean(name1);
      const c2 = clean(name2);
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };
    const childClassId = selectedChild.classId || selectedChild.class_id;
    const childGrade = selectedChild.grade || selectedChild.class;
    return schedules.filter((s: any) => {
      const matchesClassId = childClassId && s.classId === childClassId;
      const matchedClass = studentClasses.find(c => c.id === s.classId);
      const matchesClassName = matchedClass && isClassNameSimilar(matchedClass.name, childGrade);
      const sClassIdStr = (s.classId || '').toString();
      const matchesDirectNameLike = isClassNameSimilar(sClassIdStr, childGrade);
      return matchesClassId || matchesClassName || matchesDirectNameLike;
    });
  }, [schedules, studentClasses, selectedChild]);

  const tabs = [
    { id: 'dashboard', label: 'Vue Générale', icon: LayoutDashboard },
    { id: 'academics', label: 'Notes & Résultats', icon: FileText },
    { id: 'attendance', label: 'Absences & Retards', icon: Clock },
    { id: 'schedule', label: 'Emploi du Temps', icon: Calendar },
    { id: 'homework', label: 'Cahier de Texte', icon: BookOpen },
    { id: 'finance', label: 'Scolarité & Paiements', icon: CreditCard },
    { id: 'discipline', label: 'Vie Scolaire', icon: ShieldAlert },
    { id: 'transport', label: 'Transport / Cantine', icon: Bus }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'academics':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Bulletins & Notes de {selectedChild?.firstName || selectedChild?.name || 'l\'élève'}</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Télécharger Bulletin</span>
                </button>
              </div>

              {selectedChildGrades.length === 0 ? (
                <div className="text-center py-12 text-slate-450">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-medium">Aucune note n'a encore été saisie pour ce trimestre.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedChildGrades.map((g: any, idx: number) => {
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
                      <div key={g.id || idx} className="p-5 bg-slate-50 rounded-2xl border border-gray-150 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-3 border-b border-gray-150 pb-2">
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 font-extrabold">{subjectName}</span>
                            <p className="text-xs text-slate-500 mt-0.5 font-bold">{g.term || 'Trimestre 1'}</p>
                          </div>
                          {average !== null && (
                            <div className="text-right">
                              <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5">Moyenne</span>
                              <span className="text-xs font-black px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-150">
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
      case 'finance':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-lg">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-200">Total à payer (Année)</span>
                <div className="text-3xl font-black mt-2">850,000 <span className="text-lg opacity-80">{merchant?.currency || 'FCFA'}</span></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Déjà réglé</span>
                <div className="text-3xl font-black text-emerald-600 mt-2">450,000 <span className="text-lg opacity-60 text-slate-400">{merchant?.currency || 'FCFA'}</span></div>
              </div>
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
                <span className="text-[10px] uppercase font-black tracking-widest text-rose-500">Reste à payer</span>
                <div className="text-3xl font-black text-rose-600 mt-2">400,000 <span className="text-lg opacity-60 text-rose-400">{merchant?.currency || 'FCFA'}</span></div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Prochaine Échéance</h3>
              <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-orange-900">Mensualité de Février</h4>
                  <p className="text-sm text-orange-700 mt-1">À régler avant le 05 Février</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-orange-600">85,000 {merchant?.currency || 'FCFA'}</div>
                  <button className="mt-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all">
                    Payer via Mobile Money
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'attendance':
        const filteredAttendances = attendances.filter(a => a.status === 'absent' || a.status === 'late');
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Registre des Présences</h3>
              <div className="space-y-3">
                {filteredAttendances.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-8">Aucune absence ou retard enregistré.</p>
                ) : (
                  filteredAttendances.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.status === 'absent' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                          {a.status === 'absent' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{a.status === 'absent' ? 'Absence - Journée / Cours' : 'Retard'}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Le {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      {a.status === 'absent' && (
                        <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50">
                          Justifier
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
             </div>
          </div>
        );
      case 'homework':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" /> Cahier de Texte
              </h3>
              
              {validHomeworks.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-150 text-center py-10">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-700">Aucun devoir ou leçon n'a été publié pour l'instant.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {validHomeworks.map((h: any, idx: number) => (
                    <div key={h.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{h.subjectName || 'Général'}</span>
                        <span className="text-xs text-rose-500 font-bold">Pour le: {new Date(h.dueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{h.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xl whitespace-pre-wrap">{h.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Emploi du Temps de {selectedChild?.firstName || selectedChild?.name || 'l\'élève'}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Classe : <strong className="text-indigo-600 font-extrabold">{selectedChild?.grade || selectedChild?.class || 'Non spécifiée'}</strong>
                  </p>
                </div>

                {/* Switcher pour le Type de Présentation Calendrier */}
                {(selectedChildClass?.schedulePublished !== false) && classSchedules.length > 0 && (
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-gray-150 inline-flex self-start">
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

              {selectedChildClass?.schedulePublished === false ? (
                <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-amber-200 text-amber-800 font-medium">
                  <EyeOff className="w-12 h-12 mx-auto mb-3 text-amber-500 animate-pulse" />
                  <p className="text-sm font-bold text-amber-900">Emploi du temps non publié</p>
                  <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">L'emploi du temps officiel de cette classe n'a pas encore été publié officiellement par l'administration ou est en cours d'élaboration.</p>
                </div>
              ) : classSchedules.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-gray-150 text-slate-400 font-medium">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
                  <p className="text-sm font-bold text-slate-700">Aucun emploi du temps officiel n'est disponible ou n'a encore été défini pour cette classe.</p>
                  <p className="text-xs text-slate-500 mt-1">L'administration scolaire est chargée de programmer l'emploi du temps.</p>
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
                        if (k.includes('math')) return 'bg-emerald-50 text-emerald-850 border-emerald-250';
                        if (k.includes('fran') || k.includes('lettre')) return 'bg-blue-50 text-blue-800 border-blue-200';
                        if (k.includes('phys') || k.includes('chim')) return 'bg-amber-50 text-amber-850 border-amber-200';
                        if (k.includes('svt') || k.includes('sci')) return 'bg-teal-50 text-teal-800 border-teal-200';
                        if (k.includes('hist') || k.includes('géo') || k.includes('geo')) return 'bg-orange-50 text-orange-850 border-orange-200';
                        if (k.includes('sport') || k.includes('eps')) return 'bg-rose-50 text-rose-800 border-rose-200';
                        return 'bg-slate-50 text-slate-700 border-slate-200';
                      };

                      const badgeColor = getSubjectSubColor(s.subject);

                      return (
                        <div key={s.id || idx} className={`p-3 bg-white rounded-2xl border border-gray-150 shadow-sm transition-all hover:border-indigo-150 relative ${isCanceled ? 'opacity-50' : ''}`}>
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
                              <p className="text-[8px] font-black text-purple-700 uppercase tracking-wider text-center flex items-center justify-center gap-0.5">🔄 Enseignant Remplaçant</p>
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
                                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-gray-150'
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
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-gray-150 max-w-md mx-auto">
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
      case 'dashboard':
      default:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Moyenne Générale</p>
                  <p className="text-2xl font-black text-slate-800">-- <span className="text-sm font-bold text-slate-400">/ 20</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Absences & Retards</p>
                  <p className="text-2xl font-black text-slate-800">{absences.length + lates.length} <span className="text-sm font-bold text-slate-400">fiches</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Scolarité</p>
                  <p className="text-sm font-black text-emerald-600 mt-1">À jour</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Discipline</p>
                  <p className="text-sm font-black text-slate-800 mt-1">Exemplaire</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-500" /> Notifications Récentes</h3>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start border-b border-gray-50 pb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Bulletin du 1er Trimestre disponible</p>
                      <p className="text-xs text-slate-500 mt-1">Le bulletin de {selectedChild?.name || 'l\'élève'} a été publié par l'administration.</p>
                      <button className="mt-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-widest flex items-center gap-1">Télécharger PDF <ChevronRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start border-b border-gray-50 pb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Avis de Réunion Parents-Professeurs</p>
                      <p className="text-xs text-slate-500 mt-1">La réunion du 2ème trimestre est prévue le 15 Février à 14h00.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500" /> Cahier de Texte</h3>
                <div className="space-y-3">
                  {validHomeworks.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 text-center py-6">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-500">Aucun devoir ou leçon n'a été publié pour l'instant.</p>
                    </div>
                  ) : (
                    validHomeworks.slice(0, 3).map((h: any, idx: number) => (
                      <div key={h.id || idx} className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{h.subjectName || 'Général'}</span>
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Pour le {new Date(h.dueDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{h.title}</p>
                      </div>
                    ))
                  )}
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
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-gray-100 bg-indigo-900 text-white relative overflow-hidden shrink-0">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">Portail Parents</h2>
                <p className="text-xs font-medium text-indigo-200">{merchant?.businessName || 'Établissement'}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 shrink-0">
              <p className="text-[9px] uppercase tracking-widest font-black text-indigo-200 mb-2">Compte Connecté</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white shadow-inner">
                  {parent?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{parent?.name || 'Tuteur'}</p>
                  <p className="text-xs text-indigo-200 truncate">{parent?.phone || 'Téléphone non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100 shrink-0">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Dossier Élève</label>
            <div className="space-y-2">
              {parent?.children?.map((child: any, idx: number) => (
                <button
                  key={child.id || idx}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedChild?.id === child.id || (!selectedChild?.id && idx === 0)
                      ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm' 
                      : 'bg-white border border-gray-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    selectedChild?.id === child.id || (!selectedChild?.id && idx === 0) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {(child.name || child.firstName || '?').charAt(0)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{child.name || `${child.firstName} ${child.lastName}`}</p>
                    <p className="text-[10px] font-mono font-bold opacity-70 truncate">Classe: {child.class || 'Non assigné'}</p>
                  </div>
                </button>
              ))}
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
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 shrink-0">
            <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-sm font-bold transition-colors text-slate-600">
              <LogOut className="w-4 h-4" />
              <span>Quitter le simulateur</span>
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
