import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { geminiService } from '../../../services/geminiService';
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

export const AlertParentsManager = ({ merchant }: { merchant: Merchant }) => {
  const [broadcastSelectedStudents, setBroadcastSelectedStudents] = useState<string[]>([]);
  const [broadcastCategory, setBroadcastCategory] = useState<'absence' | 'delay' | 'remind_payment' | 'grade_report' | 'custom'>('absence');
  const [broadcastCustomBody, setBroadcastCustomBody] = useState("Chers Parents, nous vous informons que l'élève [Élève] en classe de [Classe] est absent ce jour sans motif communiqué. Merci de prendre contact avec l'administration.");
  const [broadcastSearchQuery, setBroadcastSearchQuery] = useState('');
  const [broadcastClassFilter, setBroadcastClassFilter] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [broadcastTargetDate, setBroadcastTargetDate] = useState(today);
  const [broadcastAttendanceFilter, setBroadcastAttendanceFilter] = useState('');

  const [broadcastSentStatus, setBroadcastSentStatus] = useState<Record<string, 'pending' | 'whatsapp' | 'sms'>>({});
  const [dashboardDispatchModal, setDashboardDispatchModal] = useState<{
    phone: string;
    studentName: string;
    parentName: string;
    message: string;
    title: string;
  } | null>(null);

  const students = useLiveQuery(() => 
    db.students.where('merchantId').equals(merchant.id || '').toArray()
  , [merchant.id]) || [];

  const classes = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id || '').toArray()
  , [merchant.id]) || [];

  const attendances = useLiveQuery(() => 
    db.attendance?.where('merchantId').equals(merchant.id || '')
      .and(a => a.date === broadcastTargetDate)
      .toArray()
  , [merchant.id, broadcastTargetDate]) || [];

  const attendanceStatusByStudent = React.useMemo(() => {
    const map: Record<string, string> = {};
    attendances.forEach((a: any) => {
      map[a.studentId] = a.status; // 'absent', 'late', 'present'
    });
    return map;
  }, [attendances]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {dashboardDispatchModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm z-[99999]">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Aperçu Dépêche Parent</h4>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">{dashboardDispatchModal.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDashboardDispatchModal(null)}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase transition-colors"
              >
                Fermer
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/60 divide-y divide-gray-100">
                <div className="pb-2.5">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Destinataire (Tuteur)</span>
                  <span className="text-xs font-black text-slate-800">{dashboardDispatchModal.parentName}</span>
                </div>
                <div className="py-2.5">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Élève Associé</span>
                  <span className="text-xs font-black text-slate-800">{dashboardDispatchModal.studentName}</span>
                </div>
                <div className="py-2.5">
                  <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest block">Numéro Tuteur</span>
                  <span className="text-xs font-mono font-black text-slate-800">{dashboardDispatchModal.phone}</span>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <span className="text-[9px] font-mono font-black text-indigo-600 uppercase tracking-widest block mb-1">Message de la dépêche personnalisé</span>
                <p className="text-xs text-indigo-950 font-semibold leading-relaxed whitespace-pre-wrap">
                  "{dashboardDispatchModal.message}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href={`https://wa.me/${dashboardDispatchModal.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(dashboardDispatchModal.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl text-center shadow-md flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ouvrir WhatsApp</span>
                </a>
                <a
                  href={`sms:${dashboardDispatchModal.phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(dashboardDispatchModal.message)}`}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl text-center shadow-md flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Ouvrir SMS</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
          <Zap className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-black uppercase tracking-widest rounded-md border border-indigo-400/20 inline-block">
            COCKPIT DE BROADCAST SMART
          </span>
          <h4 className="text-3xl font-black tracking-tight text-white">Alerte Parents (Multi-Diffusion)</h4>
          <p className="text-sm text-indigo-200 font-semibold leading-relaxed max-w-2xl">
            Ciblez les parents d'élèves par classe ou nom, puis rédigez ou optimisez un message à l'aide de l'I.A. pour diffraction rapide par WhatsApp / SMS.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
        {/* 1. Filtering & Smart Selection */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2.5xl border border-gray-200/60">
          <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block">
            🔎 1. CILBLAGE DES ÉLÈVES & TUTEURS ({students.length} disponibles)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={broadcastSearchQuery}
                onChange={(e) => setBroadcastSearchQuery(e.target.value)}
                placeholder="Rechercher élève ou tuteur..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-sm rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={broadcastClassFilter}
                onChange={(e) => setBroadcastClassFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-sm rounded-xl font-bold text-gray-900 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="">Toutes les classes</option>
                {classes.map((cls: any) => (
                  <option key={cls.id || cls.name} value={cls.name || cls.id}>{cls.name || cls.id}</option>
                ))}
                {classes.length === 0 && Array.from(new Set(students.map((s: any) => s.class))).filter(Boolean).map((className: any) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <input
                type="date"
                value={broadcastTargetDate}
                onChange={(e) => setBroadcastTargetDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 text-sm rounded-xl font-bold text-gray-900 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              />
            </div>

            <div className="relative">
              <select
                value={broadcastAttendanceFilter}
                onChange={(e) => setBroadcastAttendanceFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 text-sm rounded-xl font-bold text-gray-900 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="">Présence (Toutes)</option>
                <option value="absent">Absents</option>
                <option value="late">En Retard</option>
                <option value="present">Présents</option>
                <option value="missing">Appel non fait</option>
              </select>
            </div>
          </div>

          {/* Pre-select helpers */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between pt-1">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const filteredIds = students
                    .filter((student: any) => {
                      const matchesSearch = (student.name || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase()) || 
                                            (student.fatherName || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase()) ||
                                            (student.motherName || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase()) ||
                                            (student.guardianName || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase());
                      const matchesClass = !broadcastClassFilter || student.class === broadcastClassFilter;
                      
                      const status = attendanceStatusByStudent[student.id];
                      const matchesAttendance = !broadcastAttendanceFilter || (broadcastAttendanceFilter === 'missing' ? !status : status === broadcastAttendanceFilter);
                      
                      return matchesSearch && matchesClass && matchesAttendance;
                    })
                    .map((s: any) => s.id);
                  
                  setBroadcastSelectedStudents(prev => {
                    const next = [...prev];
                    filteredIds.forEach(id => {
                      if (!next.includes(id)) next.push(id);
                    });
                    return next;
                  });
                }}
                className="px-4 py-2 bg-indigo-55 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Tout Sélectionner Ciblés
              </button>
              <button
                type="button"
                onClick={() => setBroadcastSelectedStudents([])}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Désélectionner Tout
              </button>
            </div>
            <span className="text-xs font-mono font-black text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-100">
              {broadcastSelectedStudents.length} sélectionné(s)
            </span>
          </div>

          {/* Compact Scrollable List */}
          <div className="max-h-[250px] overflow-y-auto border border-gray-100 rounded-xl bg-white space-y-1 p-2 custom-scrollbar">
            {(() => {
              const filtered = students.filter((student: any) => {
                const matchesSearch = (student.name || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase()) || 
                                      (student.fatherName || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase()) ||
                                      (student.motherName || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase()) ||
                                      (student.guardianName || '').toLowerCase().includes(broadcastSearchQuery.toLowerCase());
                const matchesClass = !broadcastClassFilter || student.class === broadcastClassFilter;
                
                const status = attendanceStatusByStudent[student.id];
                const matchesAttendance = !broadcastAttendanceFilter || (broadcastAttendanceFilter === 'missing' ? !status : status === broadcastAttendanceFilter);
                
                return matchesSearch && matchesClass && matchesAttendance;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-400 text-sm font-medium">
                    Aucun élève ne correspond aux filtres.
                  </div>
                );
              }

              return filtered.map((student: any) => {
                const isChecked = broadcastSelectedStudents.includes(student.id);
                
                // Resolve parent phone and name
                const parentChoice = student.primaryParentContact || 'father';
                let resolvedPhone = '';
                let parentName = '';
                if (parentChoice === 'father') {
                  resolvedPhone = student.fatherPhone;
                  parentName = student.fatherName || `Père de ${student.firstName}`;
                } else if (parentChoice === 'mother') {
                  resolvedPhone = student.motherPhone;
                  parentName = student.motherName || `Mère de ${student.firstName}`;
                } else {
                  resolvedPhone = student.guardianPhone || student.parentContact || '';
                  parentName = student.guardianName || `Tuteur de ${student.firstName}`;
                }
                const phone = resolvedPhone || student.parentContact || '';
                
                const status = attendanceStatusByStudent[student.id];

                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      if (isChecked) {
                        setBroadcastSelectedStudents(prev => prev.filter(id => id !== student.id));
                      } else {
                        setBroadcastSelectedStudents(prev => [...prev, student.id]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      isChecked ? 'bg-indigo-50/50 border-l-4 border-indigo-600 pl-3' : 'hover:bg-gray-50 border-l-4 border-transparent pl-3'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 leading-tight truncate">{student.name || `${student.firstName} ${student.lastName}`}</p>
                        <p className="text-[10px] font-mono font-bold text-gray-400 mt-0.5 flex flex-wrap gap-2 items-center">
                          <span>Classe: {student.class || student.grade || 'N/A'}</span>
                          <span>|</span>
                          <span>{parentName} ({phone || 'Non renseigné'})</span>
                          {status && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${status === 'absent' ? 'bg-red-500' : status === 'late' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                              {status === 'absent' ? 'Absent' : status === 'late' ? 'Retard' : 'Présent'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {broadcastSentStatus[student.id] && (
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                        broadcastSentStatus[student.id] === 'whatsapp' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        broadcastSentStatus[student.id] === 'sms' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-500'
                      }`}>
                        ✓ {broadcastSentStatus[student.id]}
                      </span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* 2. Message Template Hub & Intelligent Generation */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2.5xl border border-gray-200/60">
          <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest block">
            ✨ 2. INTERFACE INTELLIGENTE DE RÉDACTION ({broadcastCategory.toUpperCase()})
          </span>

          {/* Pre-templated quick switches */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[
              { id: 'absence', label: '🚨 Absence', defaultText: "Chers Parents, nous vous informons que l'élève [Élève] en classe de [Classe] est absent ce jour sans motif communiqué. Merci de prendre contact avec l'administration." },
              { id: 'delay', label: '⏰ Retard', defaultText: "À l'attention des parents de [Élève] en classe de [Classe] : votre enfant est arrivé en retard à l'établissement ce matin. Merci de veiller à sa ponctualité." },
              { id: 'grade_report', label: '📊 Évaluation', defaultText: "Cher Parent, nous vous informons que les notes d'évaluation de [Élève] en classe de [Classe] ont été publiées. Merci de consulter le livret de notes." },
              { id: 'remind_payment', label: '💰 Écolage', defaultText: "Cher Parent, afin d'éviter toute suspension de cours, nous vous prions de régulariser tout reliquat de frais d'écolage pour l'élève [Élève] ([Classe])." },
              { id: 'custom', label: '✏️ Libre', defaultText: "Information administrative de l'établissement : Chers parents d'élèves, veuillez prendre connaissance de l'annonce suivante concernant [Élève] ([Classe]) : " }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setBroadcastCategory(item.id as any);
                  setBroadcastCustomBody(item.defaultText);
                }}
                className={`py-2 px-2 bg-white border rounded-xl text-xs font-bold text-center transition-all cursor-pointer truncate shadow-sm hover:shadow active:scale-95 ${
                  broadcastCategory === item.id
                    ? 'border-indigo-600 ring-4 ring-indigo-100 text-indigo-700 bg-indigo-50/50'
                    : 'border-gray-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 mt-4">
              <label className="text-[10px] font-bold text-slate-500 block">
                Gabarit du message (Utilisez le jeton <code className="font-semibold text-indigo-600 px-1 bg-indigo-50 rounded">[Élève]</code> ou <code className="font-semibold text-indigo-600 px-1 bg-indigo-50 rounded">[Classe]</code>)
              </label>
              
              {/* Intelligent IA Assistant integration and rewriting */}
              <button
                type="button"
                disabled={!broadcastCustomBody || broadcastCustomBody.trim().length < 5}
                onClick={async () => {
                  const currentTxt = broadcastCustomBody.trim();
                  const toastId = toast.loading("Optimisation IA du style en cours (ERP)... ✨");
                  try {
                    const prompt = `Assume le rôle d'un secrétariat d'école d'excellence. Réécris ce message destiné aux parents d'élèves de manière extrêmement soignée, professionnelle, cordiale, chaleureuse et percutante en français. Tu DEVES IMPÉRATIVEMENT préserver les mots-clés de fusion entre crochets comme [Élève], [Tuteur] ou [Classe] sans les altérer. Reste concis.
Message d'origine: "${currentTxt}"`;
                    const responseText = await geminiService.generateText(prompt);
                    if (responseText) {
                      setBroadcastCustomBody(responseText.trim());
                      toast.success("Message embelli par l'I.A. ! 🎉", { id: toastId });
                    } else {
                      toast.error("La génération I.A. a retourné une réponse vide.", { id: toastId });
                    }
                  } catch (e) {
                    console.error(e);
                    toast.error("Échec de la réécriture IA, utilisation de la version actuelle.", { id: toastId });
                  }
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 hover:scale-105 shadow-md shadow-indigo-500/20"
              >
                <Sparkles className="w-3 h-3" />
                <span>Embellir avec I.A. ✨</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={broadcastCustomBody}
              onChange={(e) => setBroadcastCustomBody(e.target.value)}
              placeholder="Rédigez le message de groupe..."
              className="w-full px-4 py-3 bg-white border border-gray-200 text-sm rounded-xl font-medium text-slate-800 outline-none resize-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>
        </div>

        {/* 3. Action Dispatch Deck / Sequential transmission list */}
        {broadcastSelectedStudents.length > 0 && (
          <div className="space-y-4 bg-indigo-50/50 p-6 rounded-2.5xl border border-indigo-200/60 animate-fade-in shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest block">
                  🛰️ 3. COCKPIT DE DIFFUSION MULTIPLE EN ACTION
                </span>
                <h5 className="font-bold text-sm text-indigo-950 mt-1">
                  Dispatchez individuellement ou confirmez l'envoi groupé
                </h5>
              </div>

              {/* Simulate bulk validation for quick offline state simulation */}
              <button
                type="button"
                onClick={() => {
                  const newStatus: Record<string, 'pending' | 'whatsapp' | 'sms'> = { ...broadcastSentStatus };
                  broadcastSelectedStudents.forEach(id => {
                    newStatus[id] = 'whatsapp';
                  });
                  setBroadcastSentStatus(newStatus);
                  toast.success("Succès ! Tous les messages groupés ont été marqués comme diffusés.");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg cursor-pointer shrink-0 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Valider tout comme Envoyé</span>
              </button>
            </div>

            <p className="text-[11px] text-indigo-800/80 font-medium leading-relaxed max-w-3xl">
              Afin de respecter la protection de l'opérateur mobile et la conformité anti-spam, lancez la transmission vers les numéros ci-dessous. Le message sera prérempli avec les variables de fusion injectées en temps réel.
            </p>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 select-none custom-scrollbar bg-white p-4 rounded-2xl border border-indigo-100 shadow-inner">
              {broadcastSelectedStudents.map((studentId, idx) => {
                const student = students.find((s: any) => s.id === studentId);
                if (!student) return null;

                // Resolve parent phone and name
                const parentChoice = student.primaryParentContact || 'father';
                let resolvedPhone = '';
                let parentName = '';
                if (parentChoice === 'father') {
                  resolvedPhone = student.fatherPhone;
                  parentName = student.fatherName || `Mère de ${student.firstName}`;
                } else if (parentChoice === 'mother') {
                  resolvedPhone = student.motherPhone;
                  parentName = student.motherName || `Mère de ${student.firstName}`;
                } else {
                  resolvedPhone = student.guardianPhone || student.parentContact || '';
                  parentName = student.guardianName || `Tuteur de ${student.firstName}`;
                }
                const phone = resolvedPhone || student.parentContact || '';

                // Personalize templates
                const mergeText = (template: string) => {
                  let text = template;
                  text = text.replace(/\[Élève\]/g, `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || "l'élève");
                  text = text.replace(/\[Classe\]/g, student.class || 'CM1');
                  text = text.replace(/\[Tuteur\]/g, parentName);
                  return text;
                };

                const personalizedText = mergeText(broadcastCustomBody || 'Absent');

                const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(personalizedText)}`;
                const smsUrl = `sms:${phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(personalizedText)}`;

                return (
                  <div key={studentId} className="p-4 bg-slate-50 border border-gray-200/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-indigo-50/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 text-[10px] rounded-full flex items-center justify-center font-black shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-black text-slate-800 truncate">
                          {parentName} (Tuteur de {student.name || `${student.firstName} ${student.lastName}`})
                        </p>
                      </div>
                      <div className="mt-2 p-3 bg-white rounded-lg text-[11px] text-gray-500 font-medium border border-gray-200 whitespace-pre-line shadow-sm relative">
                        {personalizedText}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 self-end sm:self-center">
                      {/* Preview / Details Button */}
                      <button
                        type="button"
                        onClick={() => setDashboardDispatchModal({
                          phone,
                          studentName: student.name || `${student.firstName} ${student.lastName}`,
                          parentName,
                          message: personalizedText,
                          title: broadcastCategory === 'absence' ? 'Absence' :
                                 broadcastCategory === 'delay' ? 'Retard' :
                                 broadcastCategory === 'grade_report' ? 'Évaluation' :
                                 broadcastCategory === 'remind_payment' ? 'Écolage' : 'Annonce Libre'
                        })}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        🔎 Aperçu
                      </button>

                      {/* WhatsApp Send */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setBroadcastSentStatus(prev => ({ ...prev, [studentId]: 'whatsapp' }));
                          toast.success(`Redirection WhatsApp préparée pour ${parentName}`);
                        }}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* SMS Send */}
                      <a
                        href={smsUrl}
                        onClick={() => {
                          setBroadcastSentStatus(prev => ({ ...prev, [studentId]: 'sms' }));
                          toast.success(`Lien SMS préparé pour ${parentName}`);
                        }}
                        className="py-2 px-3 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 border border-blue-200 cursor-pointer shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {broadcastSelectedStudents.length === 0 && (
          <div className="p-10 border-2 border-dashed border-gray-200 rounded-3xl text-center bg-slate-50 text-gray-400">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <Zap className="w-8 h-8 text-indigo-300 animate-pulse" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-indigo-950">Sélectionnez des parents et tuteurs ci-dessus</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">Cochez les tuteurs à qui diffuser le message intelligent pour déverrouiller le cockpit d'envoi.</p>
          </div>
        )}
      </div>
    </div>
  );
};
