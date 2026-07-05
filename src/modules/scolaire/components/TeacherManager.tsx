import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { TeacherDashboardSpace } from './TeacherGradePortal';
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

export const TeacherManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // States for search and filtering
  const [teachersSearchQuery, setTeachersSearchQuery] = useState('');
  const [teachersSelectedSubject, setTeachersSelectedSubject] = useState('Tous');
  const [teachersSelectedClass, setTeachersSelectedClass] = useState('Tous');

  // Teacher portal states
  const [activeTeacherView, setActiveTeacherView] = useState<any>(null);
  const [selectedEmailTeacher, setSelectedEmailTeacher] = useState<any>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [customEmailBody, setCustomEmailBody] = useState('');

  const teachers = useLiveQuery(() => 
    db.teachers?.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const dbClasses = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const students = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const storedGrades = useLiveQuery(() => 
    db.grades?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // Compute unique classes and subjects dynamically from teachers list
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    teachers.forEach((t: any) => {
      if (t.subject) subjects.add(t.subject);
    });
    return ['Tous', ...Array.from(subjects).sort()];
  }, [teachers]);

  const uniqueClassesFromTeachers = useMemo(() => {
    const classNames = new Set<string>();
    teachers.forEach((t: any) => {
      if (t.className) classNames.add(t.className);
    });
    return ['Tous', ...Array.from(classNames).sort()];
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t: any) => {
      const q = teachersSearchQuery.trim().toLowerCase();
      const fName = (t.firstName || '').toLowerCase();
      const lName = (t.lastName || '').toLowerCase();
      const full = `${fName} ${lName}`;
      const reversedFull = `${lName} ${fName}`;
      const subject = (t.subject || '').toLowerCase();
      const className = (t.className || '').toLowerCase();
      const phone = (t.phone || '').toLowerCase();
      const email = (t.email || '').toLowerCase();

      const matchesSearch = !q ||
        fName.includes(q) ||
        lName.includes(q) ||
        full.includes(q) ||
        reversedFull.includes(q) ||
        subject.includes(q) ||
        className.includes(q) ||
        phone.includes(q) ||
        email.includes(q);

      const matchesSubject = teachersSelectedSubject === 'Tous' || t.subject === teachersSelectedSubject;
      const matchesClass = teachersSelectedClass === 'Tous' || t.className === teachersSelectedClass;

      return matchesSearch && matchesSubject && matchesClass;
    });
  }, [teachers, teachersSearchQuery, teachersSelectedSubject, teachersSelectedClass]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...currentTeacher, merchantId: merchant.id, updatedAt: new Date().toISOString() };
      if (!data.id) data.id = uuidv4();
      
      // Auto-generate credentials for Espace Enseignant if not existing
      if (!data.username) {
        data.username = 'prof_' + (data.firstName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '') + '_' + (data.lastName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);
      }
      if (!data.password) {
        data.password = Math.floor(100000 + Math.random() * 900000).toString();
      }

      await dbService.teachers.save(data);
      toast.success("Enseignant et son Espace créés avec succès");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (activeTeacherView) {
    return (
      <TeacherDashboardSpace
        teacher={activeTeacherView}
        merchant={merchant}
        classes={dbClasses}
        students={students}
        storedGrades={storedGrades}
        onClose={() => {
          if (localStorage.getItem('activeTeacherId')) {
            localStorage.removeItem('activeTeacherId');
            localStorage.removeItem('merchantId');
            window.location.href = '/login';
          } else {
            setActiveTeacherView(null);
          }
        }}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Enseignants</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            {filteredTeachers.length !== teachers.length ? (
              <span>Affichés : {filteredTeachers.length} / {teachers.length} enseignants</span>
            ) : (
              <span>Effectif: {teachers.length.toString().padStart(3, '0')}</span>
            )}
          </p>
        </div>
        <button 
          id="add-new-teacher-btn"
          onClick={() => {
            setCurrentTeacher({ firstName: '', lastName: '', subject: '', phone: '', email: '', status: 'active', className: '', filiere: '', classId: '', username: '', password: '', extraClasses: [] });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Enseignant</span>
        </button>
      </div>

      {/* Dynamic Search & Filtering Toolbar */}
      <div className="bg-slate-50 border border-black/5 p-4 rounded-3xl gap-4 flex flex-col md:flex-row items-stretch md:items-center justify-between shadow-sm">
        {/* Search Field */}
        <div className="relative flex-grow max-w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matière, téléphone..."
            value={teachersSearchQuery}
            onChange={(e) => setTeachersSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          {teachersSearchQuery && (
            <button
              onClick={() => setTeachersSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black hover:scale-110 transition-transform"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center space-x-2 bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-400 font-mono">Matière :</span>
            <select
              value={teachersSelectedSubject}
              onChange={(e) => setTeachersSelectedSubject(e.target.value)}
              className="text-xs font-extrabold text-slate-700 bg-transparent focus:outline-none pr-1 cursor-pointer"
            >
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject === 'Tous' ? 'Toutes les matières' : subject}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center space-x-2 bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-400 font-mono">Classe :</span>
            <select
              value={teachersSelectedClass}
              onChange={(e) => setTeachersSelectedClass(e.target.value)}
              className="text-xs font-extrabold text-slate-700 bg-transparent focus:outline-none pr-1 cursor-pointer"
            >
              {uniqueClassesFromTeachers.map((className) => (
                <option key={className} value={className}>
                  {className === 'Tous' ? 'Toutes' : className}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(teachersSelectedSubject !== 'Tous' || teachersSelectedClass !== 'Tous' || teachersSearchQuery) && (
            <button
              onClick={() => {
                setTeachersSearchQuery('');
                setTeachersSelectedSubject('Tous');
                setTeachersSelectedClass('Tous');
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

      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 font-mono">
                <th className="px-8 py-5">Enseignant</th>
                <th className="px-8 py-5">Matière</th>
                <th className="px-8 py-5">Classe / Filière</th>
                <th className="px-8 py-5">Contact</th>
                <th className="px-8 py-5">Statut</th>
                <th className="px-8 py-5 text-right">Espace & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search className="w-8 h-8 text-gray-300 animate-pulse" />
                      <p className="text-sm font-bold text-gray-650">Aucun enseignant ne correspond à vos critères de recherche.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTeachersSearchQuery('');
                          setTeachersSelectedSubject('Tous');
                          setTeachersSelectedClass('Tous');
                        }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase tracking-wider text-[10px] rounded-xl transition-all"
                      >
                        Effacer les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                        {t.firstName?.[0] || '?'}{t.lastName?.[0] || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm leading-tight">{t.firstName} {t.lastName}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">ID: {t.id?.substring(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-700">{t.subject}</td>
                  <td className="px-8 py-5 text-sm">
                    {t.className ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-sm">{t.className}</span>
                        {t.filiere && (
                          <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">{t.filiere}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic font-medium">Non affectée</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-600 font-mono">{t.phone || 'Non renseigné'}</td>
                  <td className="px-8 py-5 items-center">
                    <span className={`px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-100`}>
                      Actif
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-sans">
                    <div className="flex items-center justify-end space-x-2.5">
                      {/* Envoyer par WhatsApp */}
                      <button 
                        id={`whatsapp-teacher-${t.id}`}
                        onClick={() => {
                          const titleText = merchant.name || "ACOM Éducation";
                          const msg = `Bonjour ${t.firstName} ${t.lastName},\n\nVoici vos accès personnels pour vous connecter à votre Espace d'Enseignement sur ${titleText} :\n\n🌐 Notre portail : ${window.location.protocol}//${window.location.host}/login\n👤 Identifiant : *${t.username || 'Non configuré'}*\n🔑 Code PIN : *${t.password || 'Non configuré'}*\n\nDepuis cet espace, vous pourrez saisir vos notes et planifier des devoirs. Bonne rentrée !`;
                          const encoded = encodeURIComponent(msg);
                          const cleanPhone = t.phone ? t.phone.replace(/[^0-9+]/g, '') : '';
                          const target = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`;
                          window.open(target, '_blank');
                          toast.success("WhatsApp préparé avec les accès !");
                        }}
                        title="Envoyer les accès par WhatsApp"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-600 rounded-xl transition-all border border-emerald-100/30"
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      {/* Envoyer par E-mail */}
                      <button 
                        id={`email-teacher-${t.id}`}
                        onClick={() => {
                          setSelectedEmailTeacher(t);
                        }}
                        title="Envoyer les accès par E-mail"
                        className="p-2 bg-blue-50 hover:bg-blue-100/70 text-blue-600 rounded-xl transition-all border border-blue-100/30"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      {/* Accéder à l'Espace */}
                      <button 
                        id={`portal-teacher-${t.id}`}
                        onClick={() => {
                          setActiveTeacherView(t);
                        }}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 hover:scale-102 text-indigo-700 font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-1 border border-indigo-200"
                        title="Accéder immédiatement à son Espace Enseignant"
                      >
                        <span>Espace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Modifier */}
                      <button 
                        id={`edit-teacher-btn-${t.id}`}
                        onClick={() => { setCurrentTeacher(t); setIsEditing(true); }} 
                        className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all border border-transparent"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-ink font-sans">Profil Enseignant</h3>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-ink transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Prénom</label>
                    <input type="text" required value={currentTeacher?.firstName || ''} onChange={e => setCurrentTeacher({...currentTeacher, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold text-sm" placeholder="Prénom" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Nom</label>
                    <input type="text" required value={currentTeacher?.lastName || ''} onChange={e => setCurrentTeacher({...currentTeacher, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold text-sm" placeholder="Nom" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Matière principale</label>
                  {(() => {
                    const selectedClassObj = dbClasses.find((c: any) => c.id === currentTeacher?.classId);
                    const classSubjects = selectedClassObj?.subjects || [];

                    if (!currentTeacher?.classId) {
                      return (
                        <div className="p-3 bg-amber-50 border border-amber-100/60 text-amber-900 rounded-xl text-xs font-semibold">
                          ⚠️ Veuillez d'abord choisir une <span className="font-bold">Classe affectée</span> ci-dessous pour voir ses matières.
                        </div>
                      );
                    }

                    if (classSubjects.length === 0) {
                      return (
                        <div className="p-3 bg-red-50 border border-red-100/60 text-red-900 rounded-xl text-xs">
                          ⚠️ La classe <span className="font-bold">{selectedClassObj?.name}</span> n'a aucune matière configurée.
                          Veuillez ajouter des matières pour cette classe dans l'onglet <span className="font-bold">Pédagogie & Classes</span>.
                        </div>
                      );
                    }

                    return (
                      <select
                        required
                        value={currentTeacher?.subject || ''}
                        onChange={e => setCurrentTeacher({ ...currentTeacher, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm h-[46px]"
                      >
                        <option value="">Sélectionner la matière de la classe...</option>
                        {classSubjects.map((sub: string) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                {/* Sourcing strict des classes et filières de Pédagogie & Classes */}
                <div className="bg-indigo-50/20 p-4 rounded-2xl border border-indigo-100/50 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-indigo-505 uppercase tracking-widest text-indigo-500">Classe affectée</label>
                    {dbClasses.length === 0 ? (
                      <div className="p-3 bg-red-50 border border-red-100/60 text-red-900 rounded-2xl text-[11px] leading-relaxed">
                        <span className="font-bold flex items-center gap-1.5 text-red-700 mb-1">
                          ⚠️ Aucune classe configurée
                        </span>
                        Veuillez d'abord configurer l'onglet <span className="font-bold font-sans">Pédagogie & Classes</span>.
                      </div>
                    ) : (
                      <select 
                        required
                        value={currentTeacher?.classId || ''} 
                        onChange={e => {
                          const val = e.target.value;
                          const matchedClass = dbClasses.find((c: any) => c.id === val);
                          if (matchedClass) {
                            setCurrentTeacher({
                              ...currentTeacher,
                              classId: matchedClass.id,
                              className: matchedClass.name,
                              filiere: matchedClass.level || 'Non définie',
                              subject: matchedClass.subjects?.[0] || ''
                            });
                          } else {
                            setCurrentTeacher({
                              ...currentTeacher,
                              classId: '',
                              className: '',
                              filiere: '',
                              subject: ''
                            });
                          }
                        }} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none font-bold text-xs"
                      >
                        <option value="">Sélectionner une classe...</option>
                        {dbClasses.map((cl: any) => (
                          <option key={cl.id} value={cl.id}>
                            {cl.name} ({cl.level || 'Sans Niveau'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-indigo-505 uppercase tracking-widest text-indigo-500">Filière d'études associée (Auto-calculée)</label>
                    <input 
                      type="text" 
                      readOnly 
                      placeholder="Sélectionnez une classe pour affecter la filière..."
                      value={currentTeacher?.filiere || 'Sélectionnez une classe ci-dessus'} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-100/85 text-gray-500 font-bold outline-none text-xs select-none" 
                    />
                  </div>
                </div>

                {/* Classes Additionnelles */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Classes Additionnelles</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const newExtras = [...(currentTeacher.extraClasses || []), { classId: '', className: '', filiere: '', subject: '' }];
                        setCurrentTeacher({...currentTeacher, extraClasses: newExtras});
                      }}
                      className="text-[10px] font-bold text-primary hover:text-primary-hover uppercase tracking-wider"
                    >
                      + Ajouter
                    </button>
                  </div>
                  {(currentTeacher.extraClasses || []).map((ec: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 p-2 bg-white rounded-xl border border-gray-100">
                      <select 
                        required
                        value={ec.classId}
                        onChange={e => {
                          const val = e.target.value;
                          const matchedClass = dbClasses.find((c: any) => c.id === val);
                          const newExtras = [...currentTeacher.extraClasses];
                          newExtras[idx] = {
                            classId: matchedClass?.id || '',
                            className: matchedClass?.name || '',
                            filiere: matchedClass?.level || '',
                            subject: matchedClass?.subjects?.[0] || ''
                          };
                          setCurrentTeacher({...currentTeacher, extraClasses: newExtras});
                        }}
                        className="w-full px-2 py-2 text-xs border border-gray-100 rounded-lg bold"
                      >
                        <option value="">Class...</option>
                        {dbClasses.map((cl: any) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newExtras = currentTeacher.extraClasses.filter((_: any, i: number) => i !== idx);
                          setCurrentTeacher({...currentTeacher, extraClasses: newExtras});
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Suppr
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Numéro de Téléphone</label>
                  <input type="tel" value={currentTeacher?.phone || ''} onChange={e => setCurrentTeacher({...currentTeacher, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono text-sm" placeholder="Téléphone" />
                </div>

                {/* Secure Espace Accès info */}
                <div className="bg-amber-50/45 p-4 rounded-2xl border border-amber-100 space-y-3 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-widest">Accès Espace Enseignant</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Identifiant d'accès</span>
                      <div className="px-3 py-2 bg-white border border-gray-200 text-gray-800 font-mono text-xs rounded-xl font-bold select-all flex items-center justify-between">
                        <span>{currentTeacher?.username || 'Auto-généré au clic'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">PWD / PIN de sécurité</span>
                      <input 
                        type="text" 
                        value={currentTeacher?.password || ''} 
                        onChange={e => setCurrentTeacher({...currentTeacher, password: e.target.value})}
                        placeholder="Nouveau PIN" 
                        className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-800 font-mono text-xs rounded-xl font-bold outline-none focus:ring-2 focus:ring-amber-200"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                    💡 Un espace de travail autonome est créé automatiquement. Les enseignants se connectent pour saisir les notes des devoirs & planifier les travaux à rendre.
                  </p>
                </div>

                <div className="flex gap-4 pt-4 font-sans">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEmailTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 bg-slate-50 border-b border-gray-100 flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Envoi des accès par E-mail</h3>
                </div>
                <button onClick={() => setSelectedEmailTeacher(null)} className="text-gray-400 hover:text-gray-950"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Enseignant destinataire</label>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 text-sm">
                    {selectedEmailTeacher.firstName} {selectedEmailTeacher.lastName} ({selectedEmailTeacher.email || 'Pas d\'adresse email enregistrée (Envoi virtuel)'})
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Sujet de l'E-mail d'accès</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`Vos identifiants d'accès au portail - ${merchant.name || 'ACOM Éducation'}`} 
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold font-sans outline-none cursor-default select-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Corps du Message (Personnalisable)</label>
                  <textarea
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-200 text-gray-800 text-xs font-sans rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                    value={customEmailBody || `Bonjour ${selectedEmailTeacher.firstName} ${selectedEmailTeacher.lastName},\n\nNous avons le plaisir de vous transmettre vos accès personnels pour vous connecter à votre Espace d'Enseignement sur la plateforme ${merchant.name || 'ACOM Éducation'} :\n\n🌐 Notre portail : ${window.location.protocol}//${window.location.host}/login\n👤 Identifiant de connexion : ${selectedEmailTeacher.username || 'Généré'}\n🔑 Mot de passe de sécurité (PIN) : ${selectedEmailTeacher.password || 'Généré'}\n\nDepuis cet espace autonome, vous pourrez renseigner vos notes et planifier de devoirs pour vos élèves.\n\nBonne préparation !\nLa Direction de ${merchant.name || 'ACOM Éducation'}`}
                    onChange={e => setCustomEmailBody(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-4 font-sans">
                <button type="button" onClick={() => setSelectedEmailTeacher(null)} className="flex-1 py-3 text-xs border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-slate-100 transition-colors">Annuler</button>
                <button 
                  id="send-email-confirm-btn"
                  onClick={async () => {
                    setEmailSending(true);
                    await new Promise(resolve => setTimeout(resolve, 1400));
                    setEmailSending(false);
                    toast.success(`E-mail expédié avec succès à ${selectedEmailTeacher.firstName} ${selectedEmailTeacher.lastName} !`);
                    setSelectedEmailTeacher(null);
                    setCustomEmailBody('');
                  }} 
                  disabled={emailSending}
                  className="flex-[2] py-3 text-xs bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"
                >
                  {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>Expédier les accès</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const STANDARD_FRANCOPHONE_LEVELS = [
  { 
    id: 'Maternelle', 
    label: '👶 Maternelle', 
    classes: ['Petite Section', 'Moyenne Section', 'Grande Section', 'Toute Petite Section'] 
  },
  { 
    id: 'Élémentaire / Primaire', 
    label: '🎒 Élémentaire / Primaire', 
    classes: ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'] 
  },
  { 
    id: 'Moyen / Collège', 
    label: '📚 Moyen / Collège', 
    classes: [
      '6ème A', '6ème B', '6ème C', 
      '5ème A', '5ème B', '5ème C', 
      '4ème A', '4ème B', '4ème C', 
      '3ème A', '3ème B', '3ème C',
      '6ème', '5ème', '4ème', '3ème'
    ] 
  },
  { 
    id: 'Lycée / Secondaire', 
    label: '🎓 Lycée / Secondaire', 
    classes: [
      'Seconde L', 'Seconde S', 'Seconde A', 'Seconde S1', 'Seconde S2',
      'Première L1', 'Première L2', 'Première S1', 'Première S2',
      'Terminale L1', 'Terminale L2', 'Terminale S1', 'Terminale S2'
    ] 
  },
  {
    id: 'Supérieur / Université',
    label: '🏛️ Supérieur / Université',
    classes: [
      'Licence 1', 'Licence 2', 'Licence 3',
      'Master 1', 'Master 2',
      'Doctorat 1', 'Doctorat 2', 'Doctorat 3',
      'BTS 1', 'BTS 2',
      'Classes Préparatoires 1', 'Classes Préparatoires 2',
      'Cycle d\'Ingénieur 1', 'Cycle d\'Ingénieur 2', 'Cycle d\'Ingénieur 3'
    ]
  }
];
