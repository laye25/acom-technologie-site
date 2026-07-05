import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

import { StudentAcademicRecord } from './StudentAcademicRecord';
import { StudentRegisterFormModal } from './StudentRegisterFormModal';
export const SchoolManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [studentLimit, setStudentLimit] = useState(10);
  const [showAcademicRecord, setShowAcademicRecord] = useState<any>(null);

  // States for search and filters
  const [studentsSearchQuery, setStudentsSearchQuery] = useState('');
  const [studentsSelectedGrade, setStudentsSelectedGrade] = useState('Tous');
  const [studentsSelectedStatus, setStudentsSelectedStatus] = useState('Tous');

  const students = useLiveQuery(() => 
    db.students.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  // Extract unique classes dynamically
  const uniqueClassGrades = useMemo(() => {
    const grades = new Set<string>();
    students.forEach((s: any) => {
      if (s.grade) {
        grades.add(s.grade);
      }
    });
    return ['Tous', ...Array.from(grades).sort()];
  }, [students]);

  // Combined search and filter logic
  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      // 1. Search Query filter (matches first name, last name, matricule, parent contact, parents names)
      const q = studentsSearchQuery.trim().toLowerCase();
      const fName = (s.firstName || '').toLowerCase();
      const lName = (s.lastName || '').toLowerCase();
      const full = `${fName} ${lName}`;
      const reversedFull = `${lName} ${fName}`;
      const mat = (s.matricule || '').toLowerCase();
      const contact = (s.parentContact || '').toLowerCase();
      const father = (s.fatherName || '').toLowerCase();
      const mother = (s.motherName || '').toLowerCase();
      const guardian = (s.guardianName || '').toLowerCase();

      const matchesSearch = !q || 
        fName.includes(q) || 
        lName.includes(q) || 
        full.includes(q) ||
        reversedFull.includes(q) ||
        mat.includes(q) || 
        contact.includes(q) ||
        father.includes(q) ||
        mother.includes(q) ||
        guardian.includes(q);

      // 2. Class / Grade filter
      const matchesGrade = studentsSelectedGrade === 'Tous' || s.grade === studentsSelectedGrade;

      // 3. Status filter ('active' or 'inactive')
      const matchesStatus = studentsSelectedStatus === 'Tous' || s.status === studentsSelectedStatus;

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [students, studentsSearchQuery, studentsSelectedGrade, studentsSelectedStatus]);

  const handleSave = async (updatedStudent: any) => {
    setSaving(true);
    try {
      await dbService.students.save({
        ...updatedStudent,
        merchantId: merchant.id
      });
      toast.success('Étudiant enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Étudiants</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            {filteredStudents.length !== students.length ? (
              <span>Affichés : {filteredStudents.length} / {students.length} inscrits</span>
            ) : (
              <span>Effectif total : {students.length.toString().padStart(3, '0')}</span>
            )}
          </p>
        </div>
        <button 
          onClick={() => {
            setCurrentStudent({ firstName: '', lastName: '', grade: '', parentContact: '', status: 'active', email: '', phone: '', address: '', birthDate: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Étudiant</span>
        </button>
      </div>

      {/* Dynamic Search & Filtering Toolbar */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl gap-4 flex flex-col md:flex-row items-stretch md:items-center justify-between shadow-sm">
        {/* Search Field */}
        <div className="relative flex-grow max-w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, parent..."
            value={studentsSearchQuery}
            onChange={(e) => setStudentsSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          {studentsSearchQuery && (
            <button
              onClick={() => setStudentsSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black hover:scale-110 transition-transform"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class / Grade filter selection */}
          <div className="flex items-center space-x-2 bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-400">Niveau :</span>
            <select
              value={studentsSelectedGrade}
              onChange={(e) => setStudentsSelectedGrade(e.target.value)}
              className="text-xs font-extrabold text-slate-700 bg-transparent focus:outline-none pr-1 cursor-pointer"
            >
              {uniqueClassGrades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade === 'Tous' ? 'Tous les niveaux' : grade}
                </option>
              ))}
            </select>
          </div>

          {/* Registration Status filter selection */}
          <div className="flex items-center space-x-2 bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-400">Statut :</span>
            <select
              value={studentsSelectedStatus}
              onChange={(e) => setStudentsSelectedStatus(e.target.value)}
              className="text-xs font-extrabold text-slate-700 bg-transparent focus:outline-none pr-1 cursor-pointer"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="active">Actif (Inscrit)</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          {/* Clear Filters Indicator Button */}
          {(studentsSelectedGrade !== 'Tous' || studentsSelectedStatus !== 'Tous' || studentsSearchQuery) && (
            <button
              onClick={() => {
                setStudentsSearchQuery('');
                setStudentsSelectedGrade('Tous');
                setStudentsSelectedStatus('Tous');
              }}
              className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
              title="Réinitialiser tous les filtres"
            >
              <X className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/50 flex flex-col items-center justify-center p-6 border-b border-gray-100">
                <span className="text-3xl mb-3">🔍</span>
                <p className="font-extrabold text-slate-700 text-sm">Aucun étudiant trouvé</p>
                <p className="text-xs text-gray-450 mt-1 max-w-sm">
                  Essayez d'ajuster votre recherche ou filtrez par une autre classe ou un autre statut pour trouver le profil recherché.
                </p>
                {(studentsSelectedGrade !== 'Tous' || studentsSelectedStatus !== 'Tous' || studentsSearchQuery) && (
                  <button
                    onClick={() => {
                      setStudentsSearchQuery('');
                      setStudentsSelectedGrade('Tous');
                      setStudentsSelectedStatus('Tous');
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Effacer les filtres et recommencer
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Étudiant</th>
                    <th className="px-8 py-5">Classe / Niveau</th>
                    <th className="px-8 py-5">Contact Parent</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.slice(0, studentLimit).map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-sm border border-blue-100 group-hover:scale-110 transition-transform">
                            {(s.firstName || '?')[0]}{(s.lastName || '?')[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm leading-tight">{s.firstName || ''} {s.lastName || ''}</span>
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">MAT: {s.matricule || s.id?.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-200">
                          {s.grade || 'Non spécifié'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center text-[10px] font-black text-ink">
                          <Phone className="w-3 h-3 mr-2 opacity-40 text-primary" /> 
                          {s.parentContact || '---'}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          s.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}>
                          {s.status === 'active' ? 'INSCRIT' : 'INACTIF'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => setShowAcademicRecord(s)} title="Dossier Académique" className="p-2.5 hover:bg-indigo-50 text-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-indigo-100">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setCurrentStudent(s); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {filteredStudents.length > studentLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setStudentLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAcademicRecord && (
          <StudentAcademicRecord student={showAcademicRecord} merchant={merchant} onClose={() => setShowAcademicRecord(null)} />
        )}
      </AnimatePresence>

      {isEditing && (
        <StudentRegisterFormModal
          student={currentStudent}
          merchant={merchant}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </motion.div>
  );
};
