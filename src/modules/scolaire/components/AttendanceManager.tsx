import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
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

export const AttendanceManager = ({ merchant }: { merchant: Merchant }) => {
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
  const [currentClass, setCurrentClass] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // Track attendance state for students: { studentId: 'present' | 'absent' | 'late' }
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  // We fetch classes to select from
  const classes = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const students = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // Fetch attendances
  const attendances = useLiveQuery(() => 
    db.attendance?.where('merchantId').equals(merchant.id).reverse().sortBy('date')
  , [merchant.id]) || [];

  const studentsByClass = React.useMemo(() => {
    const acc: Record<string, any[]> = {};
    students.forEach((student: any) => {
      const clsId = student.class || student.grade || 'non-assigne';
      if (!acc[clsId]) acc[clsId] = [];
      acc[clsId].push(student);
    });
    return acc;
  }, [students]);

  // When class changes, initialize all students as present
  React.useEffect(() => {
    if (currentClass) {
      const c = classes.find(c => c.id === currentClass);
      const classStudents = c ? (studentsByClass[c.id] || studentsByClass[c.name] || []) : [];
      const init: Record<string, 'present' | 'absent' | 'late'> = {};
      classStudents.forEach(s => {
        init[s.id] = 'present';
      });
      setAttendanceRecords(init);
    } else {
      setAttendanceRecords({});
    }
  }, [currentClass, studentsByClass, classes]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;
    setSaving(true);
    
    try {
      const c = classes.find(c => c.id === currentClass);
      const classStudents = c ? (studentsByClass[c.id] || studentsByClass[c.name] || []) : [];
      
      const recordsToSave = classStudents.map(student => ({
        id: uuidv4(),
        merchantId: merchant.id,
        studentId: student.id,
        classId: currentClass,
        date: currentDate,
        status: attendanceRecords[student.id] || 'present',
        updatedAt: new Date().toISOString()
      }));

      // In real scenario we might bulk put, but we can do it one by one or via bulkPut if dexie has it
      if (recordsToSave.length > 0) {
        await db.attendance.bulkPut(recordsToSave);
        
        try {
          const { firestoreService } = await import('../../../services/firestoreService');
          for (const rec of recordsToSave) {
            await firestoreService.save('attendance', rec);
          }
        } catch (fsErr) {
          console.warn("Could not push attendance to Firestore", fsErr);
        }
      }
      
      toast.success("Appel enregistré avec succès");
      setIsTakingAttendance(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Pointage & Présences</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Appel numérique dynamique</p>
        </div>
        <button 
          onClick={() => setIsTakingAttendance(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 hover:scale-105 transition-transform"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Faire l'appel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {classes.map((cls) => {
          const classStudents = studentsByClass[cls.id] || studentsByClass[cls.name] || [];
          return (
            <div key={cls.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
               <div>
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="text-lg font-black text-slate-800">{cls.name}</h3>
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-widest">{classStudents.length} Élève{classStudents.length !== 1 ? 's' : ''}</span>
                 </div>
                 <p className="text-xs text-slate-500 font-medium mb-4">{cls.level || 'Niveau non défini'}</p>
               </div>
               <button 
                 onClick={() => {
                   setCurrentClass(cls.id);
                   setIsTakingAttendance(true);
                 }}
                 className="w-full py-3 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex justify-center items-center gap-2 border border-slate-200 hover:border-red-200"
               >
                 <ClipboardCheck className="w-4 h-4" />
                 Appel Rapide
               </button>
            </div>
          );
        })}
      </div>

      {attendances.length === 0 ? (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-[2rem] border border-red-100 shadow-sm p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
           <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
             <ClipboardCheck className="w-10 h-10" />
           </div>
           <h3 className="text-2xl font-black text-red-950 mb-2">Suivi des Abscences</h3>
           <p className="text-red-800/70 max-w-md mx-auto mb-8 font-medium">Déclarez les retards, signalez les absences et notifiez automatiquement les parents par SMS/WhatsApp.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Classe</th>
                  <th className="px-8 py-5">Élève</th>
                  <th className="px-8 py-5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendances.map((a: any) => {
                  const c = classes.find(cl => cl.id === a.classId);
                  const st = students.find(s => s.id === a.studentId);
                  // backward compatibility with older format
                  const studentName = st ? `${st.firstName} ${st.lastName}` : (a.studentId ? 'Élève inconnu' : 'Enregistrement Global');
                  
                  return (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm">{new Date(a.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-700">{c ? c.name : 'Classe inconnue'}</td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-700">{studentName}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${
                        a.status === 'absent' ? 'bg-red-50 text-red-600 border-red-100' :
                        a.status === 'late' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        a.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {a.status === 'absent' ? 'Absent' : a.status === 'late' ? 'Retard' : a.status === 'present' ? 'Présent' : 'Terminé'}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isTakingAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-ink">Nouvel Appel</h3>
                <button onClick={() => setIsTakingAttendance(false)} className="text-gray-400 hover:text-ink transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Classe</label>
                  <select required value={currentClass} onChange={e => setCurrentClass(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Date</label>
                  <input type="date" required value={currentDate} onChange={e => setCurrentDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                
                {currentClass && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700">Liste des élèves ({Object.keys(attendanceRecords).length})</label>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {(() => {
                        const c = classes.find(c => c.id === currentClass);
                        const classStudents = c ? (studentsByClass[c.id] || studentsByClass[c.name] || []) : [];
                        if (classStudents.length === 0) return <p className="text-sm text-gray-500 italic p-4 text-center">Aucun élève dans cette classe</p>;
                        return classStudents.map(student => (
                          <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-3">
                            <span className="font-bold text-sm text-gray-900">{student.firstName} {student.lastName}</span>
                            <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden shrink-0">
                              <button type="button" onClick={() => setAttendanceRecords(prev => ({...prev, [student.id]: 'present'}))} className={`px-3 py-2 text-xs font-bold transition-colors ${attendanceRecords[student.id] === 'present' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Présent</button>
                              <button type="button" onClick={() => setAttendanceRecords(prev => ({...prev, [student.id]: 'late'}))} className={`px-3 py-2 text-xs font-bold border-l border-r border-gray-200 transition-colors ${attendanceRecords[student.id] === 'late' ? 'bg-orange-500 text-white border-transparent' : 'text-gray-500 hover:bg-gray-50'}`}>Retard</button>
                              <button type="button" onClick={() => setAttendanceRecords(prev => ({...prev, [student.id]: 'absent'}))} className={`px-3 py-2 text-xs font-bold transition-colors ${attendanceRecords[student.id] === 'absent' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Absent</button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsTakingAttendance(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving || !currentClass} className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
