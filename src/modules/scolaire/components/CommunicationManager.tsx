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

export const CommunicationManager = ({ merchant }: { merchant: Merchant }) => {
  const [currentMessage, setCurrentMessage] = useState({ title: '', content: '', targetAudience: 'parents' });
  const [saving, setSaving] = useState(false);

  const [activeDispatchAnnounce, setActiveDispatchAnnounce] = useState<any | null>(null);
  const [dispatchList, setDispatchList] = useState<any[]>([]);
  const [dispatchSearch, setDispatchSearch] = useState('');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  // Communications History
  const communications = useLiveQuery(() => 
    db.communications?.where('merchantId').equals(merchant.id).reverse().sortBy('date')
  , [merchant.id]) || [];

  // Students and Teachers for Stakeholder Dispatching
  const students = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const teachers = useLiveQuery(() => 
    db.teachers?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const templates = {
    parents: [
      { title: "Réunion Pédagogique Trimestrielle", content: "Chers parents, vous êtes invités au bilan de fin de trimestre ce samedi à partir de 09h00. Votre présence et vos suggestions sont cruciales pour la réussite des élèves." },
      { title: "Rappel Amical Scolarité", content: "Cher Parent, nous vous sollicitons de bien vouloir procéder à la régularisation de la scolarité de votre enfant pour ce mois-ci. Merci de votre précieuse collaboration d'usage." },
      { title: "Fermeture Exceptionnelle", content: "Chers parents, l'établissement sera fermé la journée du [Date] suite à des impératifs administratifs. Les cours reprendront selon l'emploi habituel le lendemain dès 08h." }
    ],
    teachers: [
      { title: "Réunion de Coordination Pédagogique", content: "Chers collègues, une concertation pédagogique générale est programmée ce mercredi à 14h30 en salle de réunion. Ordre du jour : harmonisation des évaluations et examens." },
      { title: "Saisie des Appréciations", content: "Chers enseignants, merci de bien vouloir compléter les bulletins scolaires et les commentaires sur l'Espace Professeur d'ici le week-end venu. Merci pour votre réactivité." }
    ],
    students: [
      { title: "Rappel de Discipline", content: "Chers élèves, nous vous rappelons l'importance de respecter le règlement intérieur de l'établissement." },
      { title: "Activités Péri-scolaires", content: "Les inscriptions pour les activités sportives et culturelles débutent ce mercredi à la récréation." }
    ],
    all: [
      { title: "Célébration de la Fête de l'Établissement", content: "Chers membres de la communauté scolaire de notre établissement, nous vous attendons samedi prochain à 15h00 pour la grande kermesse de fin d'année. Venez nombreux !" }
    ]
  };

  const handleStartDispatch = (announce: any) => {
    setActiveDispatchAnnounce(announce);
    const audience = announce.targetAudience;
    const list: any[] = [];

    if (audience === 'parents' || audience === 'all') {
      students.forEach((student: any) => {
        const parentChoice = student.primaryParentContact || 'father';
        let resolvedPhone = '';
        let parentName = '';
        
        if (parentChoice === 'father') {
          resolvedPhone = student.fatherPhone;
          parentName = student.fatherName || `Père de ${student.firstName}`;
        } else if (parentChoice === 'mother') {
          resolvedPhone = student.motherPhone;
          parentName = student.motherName || `Mère de ${student.firstName}`;
        } else if (parentChoice === 'guardian') {
          resolvedPhone = student.guardianPhone;
          parentName = student.guardianName || `Tuteur de ${student.firstName}`;
        } else if (parentChoice === 'emergency') {
          resolvedPhone = student.emergencyPhone;
          parentName = student.emergencyName || `Urgence ${student.firstName}`;
        }

        const phone = resolvedPhone || student.parentContact || student.fatherPhone || student.motherPhone || student.guardianPhone || '';
        const name = parentName || student.fatherName || student.motherName || student.guardianName || `Parent de ${student.firstName} ${student.lastName}`;
        
        if (phone) {
          list.push({
            id: `student-${student.id}-${phone}`,
            name,
            role: `Parent (${student.firstName} ${student.lastName} - ${student.grade || 'Sans classe'})`,
            phone,
            sent: false
          });
        }
      });
    }

    if (audience === 'teachers' || audience === 'all') {
      teachers.forEach((t: any) => {
        if (t.phone) {
          list.push({
            id: `teacher-${t.id}-${t.phone}`,
            name: `${t.firstName} ${t.lastName}`,
            role: `Enseignant (${t.subject || 'Général'})`,
            phone: t.phone,
            sent: false
          });
        }
      });
    }

    setDispatchList(list);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.title.trim() || !currentMessage.content.trim()) return;
    setSaving(true);
    try {
      const data = {
        id: uuidv4(),
        merchantId: merchant.id,
        title: currentMessage.title,
        content: currentMessage.content,
        targetAudience: currentMessage.targetAudience,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.communications.put(data);
      toast.success("Annonce enregistrée ! En attente de transmission.");
      setCurrentMessage({ title: '', content: '', targetAudience: 'parents' });
      
      // Auto-open transmission queue immediately
      handleStartDispatch(data);
    } catch (error) {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComm = async (id: string) => {
    if (confirm("Voulez-vous supprimer définitivement ce message de l'historique ?")) {
      try {
        await db.communications.delete(id);
        toast.success("Message historique archivé/supprimé !");
        if (activeDispatchAnnounce?.id === id) {
          setActiveDispatchAnnounce(null);
        }
      } catch (err) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const activeTemplates = (templates as any)[currentMessage.targetAudience] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* 2-Column Responsive Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: COMPOSER & PREVIEW (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* A. Compositing Box */}
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest block font-sans">
                RÉDACTION ADMINISTRATIVE
              </span>
              <h3 className="text-xl font-black text-slate-900">Publier une annonce</h3>
              <p className="text-xs text-slate-500 font-medium">Formulez votre message et sélectionnez les destinataires de l'école.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Target Selector Buttons */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
                  1. Cible de l'annonce
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'parents', label: "Parents d'élèves", icon: Users, activeBg: 'border-indigo-600 bg-indigo-50 text-indigo-700' },
                    { id: 'teachers', label: 'Enseignants', icon: GraduationCap, activeBg: 'border-amber-600 bg-amber-50 text-amber-800' },
                    { id: 'students', label: 'Élèves', icon: BookOpen, activeBg: 'border-emerald-600 bg-emerald-50 text-emerald-800' },
                    { id: 'all', label: 'Global', icon: Store, activeBg: 'border-slate-800 bg-slate-950 text-white' }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = currentMessage.targetAudience === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrentMessage({
                            ...currentMessage,
                            targetAudience: item.id,
                            title: '',
                            content: ''
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isActive ? item.activeBg : 'bg-slate-50 border-gray-100 text-slate-500 hover:border-gray-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1 shrink-0" />
                        <span className="text-[11px] font-black leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template pill shortcuts */}
              {activeTemplates.length > 0 && (
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">
                    Modèles rapides suggérés :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTemplates.map((tmp, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => {
                          setCurrentMessage({
                            ...currentMessage,
                            title: tmp.title,
                            content: tmp.content
                          });
                          toast.success("Modèle appliqué !");
                        }}
                        className="text-[10px] py-1 px-2.5 bg-white border border-gray-200 hover:border-indigo-400 font-bold rounded-lg transition-all text-left truncate max-w-full cursor-pointer"
                      >
                        ⚡ {tmp.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">
                  Sujet / Titre de la diffusion
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Rappel Réunion Rentrée..."
                  value={currentMessage.title}
                  onChange={e => setCurrentMessage({ ...currentMessage, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Content textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">
                  Message principal
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Écrivez le message institutionnel..."
                  value={currentMessage.content}
                  onChange={e => setCurrentMessage({ ...currentMessage, content: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !currentMessage.title.trim() || !currentMessage.content.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer & Préparer la diffusion</span>
              </button>
            </form>
          </div>

          {/* B. Simulated Smartphone Visualizer Preview */}
          <div className="bg-slate-900 border border-slate-950 text-white rounded-[2rem] p-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-b-xl z-20" />
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">📱 Aperçu en direct</span>
              <span>Réseau : ACOM Net</span>
            </div>
            
            <div className="space-y-3">
              <div className="bg-slate-800 border border-white/5 rounded-2xl p-4 space-y-1 relative font-sans">
                <span className="text-[9px] font-mono text-indigo-400 font-bold block mb-1">
                  OFFICIEL - {merchant.name || 'ACOM Éducation'}
                </span>
                <p className="text-xs font-bold text-white mb-1.5 underline">
                  {currentMessage.title || 'Sujet du message'}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {currentMessage.content || 'Saisissez votre texte ci-dessus pour prévisualiser son rendu exact sur mobile...' }
                </p>
                <span className="text-[9px] text-zinc-500 block text-right mt-2 font-mono">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} &bull; Passerelle SMS/WA
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE DISPATCH / HISTORIQUE (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">

          {/* C. Interactive Dispatch Queue Monitor */}
          {activeDispatchAnnounce ? (
            <div className="bg-indigo-950 text-white p-6 rounded-[2rem] border border-indigo-900 shadow-xl space-y-4 font-sans">
              
              <div className="flex justify-between items-start pb-3 border-b border-indigo-900 flex-wrap gap-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 animate-pulse">
                    📡 CONSOLE DE TRANSMISSION ACTIVES ({dispatchList.filter(d => !d.sent).length} EN ATTENTE)
                  </span>
                  <h4 className="text-sm font-black text-white uppercase truncate max-w-xs sm:max-w-md">
                    Transmission : "{activeDispatchAnnounce.title}"
                  </h4>
                  <p className="text-[10px] text-indigo-300">
                    Cible active : <span className="font-bold underline uppercase">{activeDispatchAnnounce.targetAudience === 'parents' ? 'Parents' : activeDispatchAnnounce.targetAudience === 'teachers' ? 'Enseignants' : 'Parents et Enseignants'}</span> &bull; {dispatchList.length} contacts
                  </p>
                </div>
                <button
                  onClick={() => setActiveDispatchAnnounce(null)}
                  className="px-2.5 py-1.5 bg-indigo-900 border border-indigo-800 hover:bg-slate-900 hover:border-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Fermer la console
                </button>
              </div>

              <div className="bg-indigo-900/40 p-3.5 rounded-2xl border border-indigo-805 text-xs text-indigo-200 italic whitespace-pre-wrap max-h-36 overflow-y-auto">
                "{activeDispatchAnnounce.content}"
              </div>

              {/* Progress and Search bar inside Dispatch Queue */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-1">
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Filtrer par nom ou rôle..."
                    value={dispatchSearch}
                    onChange={e => setDispatchSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-indigo-900/60 border border-indigo-805 text-white placeholder-indigo-300 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-550/35"
                  />
                  <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
                </div>
                <div className="text-xs text-indigo-300 font-mono">
                  Progression de Diffusion : {dispatchList.filter(d => d.sent).length} / {dispatchList.length} ({Math.round((dispatchList.filter(d => d.sent).length / (dispatchList.length || 1)) * 100)}%)
                </div>
              </div>

              {dispatchList.length === 0 ? (
                <div className="text-center py-6 text-sm text-indigo-300 bg-indigo-900/20 rounded-2xl border border-indigo-900">
                  Aucun membre trouvé avec un numéro valide pour cette cible dans vos données de l'école.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-800">
                  {dispatchList
                    .filter(item => 
                      item.name.toLowerCase().includes(dispatchSearch.toLowerCase()) || 
                      item.role.toLowerCase().includes(dispatchSearch.toLowerCase()) ||
                      item.phone.includes(dispatchSearch)
                    )
                    .map((item) => (
                      <div 
                        key={item.id}
                        className={`p-3 rounded-2.5xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          item.sent ? 'bg-indigo-950/40 border-indigo-900/50 opacity-55' : 'bg-indigo-900/30 border-indigo-800'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-black text-white flex items-center gap-2 flex-wrap">
                            <span>{item.name}</span>
                            <span className="text-[9px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold leading-none">{item.role}</span>
                            {item.sent && (
                              <span className="text-[8px] bg-emerald-500/25 text-emerald-400 font-extrabold uppercase px-1.5 py-0.2 rounded border border-emerald-400/30 font-mono">
                                Transmis ✔
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-indigo-200 font-mono mt-0.5">
                            📞 {item.phone}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = item.phone.replace(/[^0-9+]/g, '');
                              const target = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeDispatchAnnounce.content)}`;
                              window.open(target, '_blank');
                              setDispatchList(prev => 
                                prev.map(d => d.id === item.id ? { ...d, sent: true } : d)
                              );
                              toast.success(`WhatsApp ouvert pour ${item.name}`);
                            }}
                            className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1ebd50] text-indigo-950 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Phone className="w-3 h-3 fill-indigo-950 text-transparent" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = item.phone.replace(/[^0-9+]/g, '');
                              const target = `sms:${cleanPhone}?body=${encodeURIComponent(activeDispatchAnnounce.content)}`;
                              window.open(target, '_blank');
                              setDispatchList(prev => 
                                prev.map(d => d.id === item.id ? { ...d, sent: true } : d)
                              );
                              toast.success(`SMS ouvert pour ${item.name}`);
                            }}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Smartphone className="w-3 h-3 text-white" />
                            <span>SMS</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : null}

          {/* D. Communications History List card */}
          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 md:p-8 space-y-6">
            
            {/* Toolbar row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-905">Historique des Messages et Alertes</h3>
                <p className="text-xs text-slate-500 font-medium">Historique des diffusions officielles enregistrées dans l'établissement.</p>
              </div>

              {/* History Search */}
              <div className="relative w-full sm:max-w-[240px]">
                <input
                  type="text"
                  placeholder="Rechercher une annonce..."
                  value={searchHistoryQuery}
                  onChange={e => setSearchHistoryQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Main Stream */}
            {communications.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-lg">Aucun message envoyé</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">
                    Utilisez le panneau d'administration sur le côté gauche pour rédiger et enregistrer vos premières communications scolaires.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {communications
                  .filter(c => 
                    !searchHistoryQuery.trim() ||
                    (c.title || '').toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
                    (c.content || '').toLowerCase().includes(searchHistoryQuery.toLowerCase())
                  )
                  .map((c: any) => {
                    const isTargetParents = c.targetAudience === 'parents';
                    const isTargetTeachers = c.targetAudience === 'teachers';
                    return (
                      <div 
                        key={c.id} 
                        className="bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2.5xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-start transition-all"
                      >
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              {isTargetParents ? (
                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100/60 text-indigo-700 text-[9px] font-black rounded-md uppercase font-sans">
                                  Parents
                                </span>
                              ) : isTargetTeachers ? (
                                <span className="px-2 py-0.5 bg-amber-50 border border-amber-100/60 text-amber-800 text-[9px] font-black rounded-md uppercase font-sans">
                                  Profs
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-md uppercase font-sans">
                                  Établissement
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 font-bold font-mono">
                                {new Date(c.date).toLocaleString()}
                              </span>
                            </div>

                            {/* Actions shortcuts */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartDispatch(c)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all shadow-sm active:scale-97 cursor-pointer"
                              >
                                <Rocket className="w-3 h-3" />
                                <span>Diffuser</span>
                              </button>
                              <button
                                onClick={() => handleDeleteComm(c.id)}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Supprimer de l'historique"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-sm font-black text-slate-900">
                            {c.title || 'Annonce Scolaire'}
                          </h4>
                          <p className="text-xs text-slate-600 font-sans whitespace-pre-wrap leading-relaxed">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>

      </div>
    </motion.div>
  );
};
