import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { STANDARD_FRANCOPHONE_LEVELS } from './TeacherManager';
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

export const AcademicManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // States for search and filtering
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [classSelectedLevel, setClassSelectedLevel] = useState('Tous');

  const [isManualLevel, setIsManualLevel] = useState(false);
  const [isManualName, setIsManualName] = useState(false);

  useEffect(() => {
    if (isEditing && currentClass) {
      const hasLevel = !!currentClass.level;
      const levelMatches = STANDARD_FRANCOPHONE_LEVELS.some(l => l.id === currentClass.level);
      
      setIsManualLevel(hasLevel && !levelMatches);
      
      const matchLevel = STANDARD_FRANCOPHONE_LEVELS.find(l => l.id === currentClass.level);
      if (matchLevel) {
        setIsManualName(!!currentClass.name && !matchLevel.classes.includes(currentClass.name));
      } else {
        setIsManualName(!!currentClass.name);
      }
    }
  }, [isEditing, currentClass?.id]);

  const classes = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const teachers = useLiveQuery(() => 
    db.teachers?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // Compute unique levels directly from classes
  const uniqueLevels = useMemo(() => {
    const levels = new Set<string>();
    classes.forEach((c: any) => {
      if (c.level) levels.add(c.level);
    });
    return ['Tous', ...Array.from(levels).sort()];
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c: any) => {
      const q = classSearchQuery.trim().toLowerCase();
      const name = (c.name || '').toLowerCase();
      const level = (c.level || '').toLowerCase();
      const tutor = (c.tutor || '').toLowerCase();
      
      // Concat subjects names to search in them
      const subjectsStr = (c.subjects || []).map((s: any) => {
        if (typeof s === 'string') return s;
        if (s && typeof s === 'object') return s.name || s.subject || '';
        return '';
      }).join(' ').toLowerCase();

      const matchesSearch = !q ||
        name.includes(q) ||
        level.includes(q) ||
        tutor.includes(q) ||
        subjectsStr.includes(q);

      const matchesLevel = classSelectedLevel === 'Tous' || c.level === classSelectedLevel;

      return matchesSearch && matchesLevel;
    });
  }, [classes, classSearchQuery, classSelectedLevel]);

  const getSmartDefaultCoef = (subName: string, grade: string) => {
    const s = subName.toLowerCase();
    const g = (grade || '').toLowerCase();
    const isSci = g.includes('s') || g.includes('agro') || g.includes('sc') || g.includes('seconde');
    const isLit = g.includes('l') || g.includes('liter');
    if (s.includes('math')) return isSci ? 5 : 2;
    if (s.includes('physique') || s.includes('chimie') || s.includes('science ph')) return isSci ? 5 : 2;
    if (s.includes('svt') || s.includes('biologie') || s.includes('vie')) return isSci ? 5 : 2;
    if (s.includes('fran') || s.includes('lett')) return isLit ? 5 : 3;
    if (s.includes('anglais')) return isLit ? 4 : 3;
    if (s.includes('hist') || s.includes('géo') || s.includes('geo')) return isLit ? 4 : 3;
    if (s.includes('philosoph')) return isLit ? 6 : 2;
    if (s.includes('eps') || s.includes('physique et spor') || s.includes('sport')) return 1;
    return 2;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...currentClass, merchantId: merchant.id, updatedAt: new Date().toISOString() };
      if (!data.id) data.id = uuidv4();
      await db.classes.put(data);

      try {
        const { firestoreService } = await import('../../../services/firestoreService');
        await firestoreService.save('classes', data);
      } catch (fsErr) {
        console.warn("Could not push class to Firestore", fsErr);
      }

      toast.success("Classe enregistrée");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Pédagogie & Classes</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Salles: {classes.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentClass({ name: '', level: 'Moyen / Collège', capacity: 30, tutor: '', subjects: [] });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Classe</span>
        </button>
      </div>

      {/* Dynamic Search & Filtering Toolbar */}
      <div className="bg-slate-50 border border-black/5 p-4 rounded-3xl gap-4 flex flex-col md:flex-row items-stretch md:items-center justify-between shadow-sm">
        {/* Search Field */}
        <div className="relative flex-grow max-w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par classe, tuteur, matière..."
            value={classSearchQuery}
            onChange={(e) => setClassSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          {classSearchQuery && (
            <button
              onClick={() => setClassSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black hover:scale-110 transition-transform"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter */}
          <div className="flex items-center space-x-2 bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-400 font-mono">Niveau :</span>
            <select
              value={classSelectedLevel}
              onChange={(e) => setClassSelectedLevel(e.target.value)}
              className="text-xs font-extrabold text-slate-700 bg-transparent focus:outline-none pr-1 cursor-pointer"
            >
              {uniqueLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === 'Tous' ? 'Tous les niveaux' : lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(classSelectedLevel !== 'Tous' || classSearchQuery) && (
            <button
              onClick={() => {
                setClassSearchQuery('');
                setClassSelectedLevel('Tous');
              }}
              className="px-3 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
              title="Réinitialiser tous les filtres"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-black/5 p-16 text-center text-gray-400 font-medium">
          <div className="flex flex-col items-center justify-center space-y-3 p-4">
            <BookOpen className="w-10 h-10 text-gray-300 animate-pulse" />
            <p className="text-sm font-bold text-gray-650">Aucune classe ne correspond à vos critères de recherche.</p>
            <button
              type="button"
              onClick={() => {
                setClassSearchQuery('');
                setClassSelectedLevel('Tous');
              }}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-sm"
            >
              Effacer les filtres
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((c: any) => (
            <div key={c.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
               <button onClick={() => { setCurrentClass(c); setIsEditing(true); }} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
               <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
                 <BookOpen className="w-6 h-6" />
               </div>
               <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-1">{c.level || 'Niveau'}</div>
               <h3 className="text-xl font-black text-gray-900 leading-tight mb-4">{c.name}</h3>
               
               <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-xl mb-4">
                 <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Capacité</div>
                 <span className="font-mono font-bold text-gray-900">{c.capacity} places</span>
               </div>
  
               {/* Affichage intelligent des matières affectées à la classe */}
               <div className="border-t border-gray-100/80 pt-4">
                 <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                   <span>Matières ({c.subjects?.length || 0})</span>
                 </div>
                 {c.subjects && c.subjects.length > 0 ? (
                   <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                     {c.subjects.map((sub: string, index: number) => {
                       // Filter teachers for this class and this subject
                       const classTeachers = (teachers || []).filter((t: any) => {
                         const isPrimaryClass = t.classId === c.id || 
                           (c.name && t.className?.trim().toLowerCase() === c.name.trim().toLowerCase());
                           
                         const isExtraClass = Array.isArray(t.extraClasses) && t.extraClasses.some((cl: any) => {
                           if (!cl) return false;
                           const clStr = cl.toString().trim().toLowerCase();
                           return clStr === c.id.trim().toLowerCase() || 
                             (c.name && clStr === c.name.trim().toLowerCase());
                         });

                         const isAssigned = isPrimaryClass || isExtraClass;
                         const isTeachingSubject = (t.subject || '').trim().toLowerCase() === sub.trim().toLowerCase();
                         return isAssigned && isTeachingSubject;
                       });

                       const hasTeacher = classTeachers.length > 0;

                       return (
                         <div key={index} className="flex justify-between items-center text-[11px] py-1 border-b border-gray-50 last:border-0">
                           <span className="font-bold text-gray-800">{sub}</span>
                           {hasTeacher ? (
                             <span className="text-gray-500 font-medium">
                               Prof: <span className="text-indigo-600 font-bold">{classTeachers.map((t: any) => `${t.firstName || ''} ${t.lastName || ''}`.trim()).join(', ')}</span>
                             </span>
                           ) : (
                             <span className="text-amber-650 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                               (Enseignants Non attribué)
                             </span>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 ) : (
                   <p className="text-[11px] text-gray-400 italic">Aucune matière affectée. Veuillez en ajouter.</p>
                 )}
               </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-ink">Détails de la Classe</h3>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-ink transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Niveau Scolaire d'Appartenance</label>
                    {isManualLevel ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required 
                          value={currentClass?.level || ''} 
                          onChange={e => setCurrentClass({...currentClass, level: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" 
                          placeholder="Saisir un niveau personnalisé..." 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualLevel(false);
                            setCurrentClass({...currentClass, level: 'Moyen / Collège'});
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all whitespace-nowrap border border-gray-200"
                        >
                          Liste standard
                        </button>
                      </div>
                    ) : (
                      <select
                        required
                        value={currentClass?.level || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsManualLevel(true);
                            setCurrentClass({...currentClass, level: '', name: ''});
                          } else {
                            const matchLevelObj = STANDARD_FRANCOPHONE_LEVELS.find(l => l.id === val);
                            const firstClass = matchLevelObj?.classes[0] || '';
                            setCurrentClass({...currentClass, level: val, name: firstClass});
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 font-bold outline-none text-sm"
                      >
                        <option value="">Sélectionner un niveau standard</option>
                        {STANDARD_FRANCOPHONE_LEVELS.map(l => (
                          <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                        <option value="__custom__" className="text-primary font-bold">✨ Saisir un niveau personnalisé...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nom / Intitulé de la Classe</label>
                    {isManualName || isManualLevel || !currentClass?.level ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required 
                          placeholder="Nom de la classe (ex: Terminale S2, CM1 B)" 
                          value={currentClass?.name || ''} 
                          onChange={e => setCurrentClass({...currentClass, name: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" 
                        />
                        {!isManualLevel && currentClass?.level && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualName(false);
                              const matchLevelObj = STANDARD_FRANCOPHONE_LEVELS.find(l => l.id === currentClass.level);
                              setCurrentClass({...currentClass, name: matchLevelObj?.classes[0] || ''});
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all whitespace-nowrap border border-gray-200"
                          >
                            Liste standard
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        required
                        value={currentClass?.name || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsManualName(true);
                            setCurrentClass({...currentClass, name: ''});
                          } else {
                            setCurrentClass({...currentClass, name: val});
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 font-bold outline-none text-sm"
                      >
                        <option value="">Sélectionner une classe</option>
                        {(STANDARD_FRANCOPHONE_LEVELS.find(l => l.id === currentClass.level)?.classes || []).map((cName) => (
                          <option key={cName} value={cName}>{cName}</option>
                        ))}
                        <option value="__custom__" className="text-primary font-bold">✨ Saisir un nom personnalisé...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Professeur Principal / Tuteur de la classe</label>
                    <input 
                      type="text" 
                      placeholder="Nom du Professeur Principal (ex: M. NDIAYE, Mme SALL)" 
                      value={currentClass?.tutor || ''} 
                      onChange={e => setCurrentClass({...currentClass, tutor: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 font-bold text-sm text-gray-800" 
                    />
                  </div>

                  {/* Nouveau gestionnaire dynamique et intelligent des matières de la classe */}
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Matières Choisies ({currentClass?.subjects?.length || 0})
                      </label>
                      
                      {/* Visualisation des badges des matières actives */}
                      <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2.5 rounded-xl bg-white border border-gray-200/60 font-medium">
                        {currentClass?.subjects && currentClass.subjects.length > 0 ? (
                          currentClass.subjects.map((sub: string, index: number) => (
                            <span 
                              key={index}
                              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-primary/15"
                            >
                              {sub}
                              <button 
                                type="button" 
                                onClick={() => {
                                  const updated = currentClass.subjects.filter((s: string) => s !== sub);
                                  const coefs = { ...(currentClass.subjectCoefs || {}) };
                                  delete coefs[sub];
                                  setCurrentClass({ ...currentClass, subjects: updated, subjectCoefs: coefs });
                                }}
                                className="w-3.5 h-3.5 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary text-[9px] font-black transition-colors"
                                title="Supprimer cette matière"
                              >
                                ✕
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-gray-400 my-auto italic">Aucune matière sélectionnée. Cliquez sur les suggestions rapides ci-dessous ou saisissez-la.</span>
                        )}
                      </div>
                    </div>

                    {/* Champ de saisie personnalisée */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ex: Informatique, Droit, Philosophie..." 
                        id="new-class-subject-input"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              const existing = currentClass?.subjects || [];
                              if (!existing.includes(val)) {
                                const coefs = currentClass.subjectCoefs || {};
                                const smartCoef = getSmartDefaultCoef(val, currentClass.name || currentClass.level);
                                setCurrentClass({ 
                                  ...currentClass, 
                                  subjects: [...existing, val],
                                  subjectCoefs: { ...coefs, [val]: smartCoef }
                                });
                              }
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 font-bold placeholder-gray-300 text-xs" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const inputEl = document.getElementById('new-class-subject-input') as HTMLInputElement;
                          const val = inputEl?.value.trim();
                          if (val) {
                            const existing = currentClass?.subjects || [];
                            if (!existing.includes(val)) {
                              const coefs = currentClass.subjectCoefs || {};
                              const smartCoef = getSmartDefaultCoef(val, currentClass.name || currentClass.level);
                              setCurrentClass({ 
                                ...currentClass, 
                                subjects: [...existing, val],
                                  subjectCoefs: { ...coefs, [val]: smartCoef }
                              });
                            }
                            inputEl.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                      >
                        Ajouter
                      </button>
                    </div>

                    {/* Configuration des coefficients par matière */}
                    {currentClass?.subjects && currentClass.subjects.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-2 max-h-[160px] overflow-y-auto">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Ajuster les Coefficients (bulletin) :</span>
                        {currentClass.subjects.map((sub: string) => {
                          const currentCoef = currentClass.subjectCoefs?.[sub] ?? getSmartDefaultCoef(sub, currentClass.name || currentClass.level);
                          return (
                            <div key={sub} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                              <span className="font-bold text-gray-700 truncate max-w-[180px]">{sub}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-gray-400">Coeff:</span>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="10" 
                                  value={currentCoef} 
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 2;
                                    const coefs = currentClass.subjectCoefs || {};
                                    setCurrentClass({
                                      ...currentClass,
                                      subjectCoefs: {
                                        ...coefs,
                                        [sub]: val
                                      }
                                    });
                                  }}
                                  className="w-12 px-1.5 py-1 text-center font-mono font-bold border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary text-gray-800"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Suggestions rapides en fonction du niveau */}
                    <div>
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Suggestions rapides en fonction du niveau :</span>
                      <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto pr-1">
                        {(() => {
                          const level = currentClass?.level || '';
                          let suggestedList: string[] = [];
                          
                          if (level.includes('Lycée') || level.includes('Secondaire')) {
                            suggestedList = ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Histoire-Géographie', 'Anglais', 'Philosophie', 'Arabe', 'Espagnol', 'Arts Plastiques', 'EPS', 'Sciences Économiques'];
                          } else if (level.includes('Moyen') || level.includes('Collège')) {
                            suggestedList = ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Histoire-Géographie', 'Anglais', 'Arabe', 'EPS', 'Technologie', 'Arts Plastiques'];
                          } else if (level.includes('Élémentaire') || level.includes('Primaire')) {
                            suggestedList = ['Mathématiques', 'Français', 'Éveil Scientifique', 'Histoire-Géographie', 'Anglais', 'Arabe', 'Arts Visuels', 'Éducation Physique', 'Instruction Civique'];
                          } else if (level.includes('Maternelle')) {
                            suggestedList = ['Graphisme', 'Lecture / Ecriture', 'Activités Physiques', 'Découverte du Monde', 'Activités Artistiques', 'Vie Collective'];
                          } else {
                            // Supérieur / Université et autres
                            suggestedList = ['Algorithmique', 'Bases de Données', 'Programmation Web', 'Management', 'Droit des Affaires', 'Comptabilité', 'Réseaux & Système', 'Anglais Professionnel', 'Statistiques', 'Économie'];
                          }

                          const active = currentClass?.subjects || [];
                          return suggestedList.map((sub: string) => {
                            const isSelected = active.includes(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    const coefs = { ...(currentClass.subjectCoefs || {}) };
                                    delete coefs[sub];
                                    setCurrentClass({ 
                                      ...currentClass, 
                                      subjects: active.filter((s: string) => s !== sub),
                                      subjectCoefs: coefs
                                    });
                                  } else {
                                    const coefs = currentClass.subjectCoefs || {};
                                    const smartCoef = getSmartDefaultCoef(sub, currentClass.name || currentClass.level);
                                    setCurrentClass({ 
                                      ...currentClass, 
                                      subjects: [...active, sub],
                                      subjectCoefs: { ...coefs, [sub]: smartCoef }
                                    });
                                  }
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                                  isSelected 
                                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10' 
                                    : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                              >
                                {isSelected ? '✓ ' : ''}{sub}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-1/3 text-sm font-medium text-gray-600">Capacité max :</div>
                  <input type="number" required value={currentClass?.capacity || ''} onChange={e => setCurrentClass({...currentClass, capacity: Number(e.target.value)})} className="w-2/3 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
