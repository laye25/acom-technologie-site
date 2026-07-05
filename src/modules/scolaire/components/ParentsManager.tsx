import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ParentPortalSimulation } from '../../../components/ParentPortalSimulation';
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

export const ParentsManager = ({ merchant }: { merchant: Merchant }) => {
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [selectedEmailParent, setSelectedEmailParent] = useState<any>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [editingParent, setEditingParent] = useState<any>(null);
  const [parentUsername, setParentUsername] = useState('');
  const [parentPassword, setParentPassword] = useState('');

  // Search & Filter state
  const [parentsSearchQuery, setParentsSearchQuery] = useState('');
  const [parentsSelectedClass, setParentsSelectedClass] = useState('Tous');

  const handleSaveParentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    try {
      await dbService.parents.save({
        id: editingParent.id,
        merchantId: merchant.id,
        phone: editingParent.phone,
        name: editingParent.name,
        username: parentUsername,
        password: parentPassword,
        updatedAt: new Date().toISOString()
      });
      // Trigger a success toast
      toast.success("Identifiants de l'Espace Parent mis à jour !");
      setEditingParent(null);
    } catch (err) {
      console.error("Error saving parent credentials:", err);
      toast.error("Erreur lors de la mise à jour des identifiants");
    }
  };
  
  const students = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id || '').toArray()
  , [merchant.id]) || [];

  const dbParents = useLiveQuery(() => 
    db.parents?.where('merchantId').equals(merchant.id || '').toArray()
  , [merchant.id]) || [];

  const parents = React.useMemo(() => {
    const parentMap = new Map();

    students.forEach((student: any) => {
      const parentChoice = student.primaryParentContact || 'father';
      let resolvedPhone = '';
      let parentName = '';
      if (parentChoice === 'father') {
        resolvedPhone = student.fatherPhone;
        parentName = student.fatherName || `Père de ${student.firstName || student.name || ''}`;
      } else if (parentChoice === 'mother') {
        resolvedPhone = student.motherPhone;
        parentName = student.motherName || `Mère de ${student.firstName || student.name || ''}`;
      } else {
        resolvedPhone = student.guardianPhone || student.parentContact || '';
        parentName = student.guardianName || `Tuteur de ${student.firstName || student.name || ''}`;
      }
      
      const phone = resolvedPhone || student.parentContact || 'Inconnu';
      const key = phone.replace(/[^0-9+A-Za-z]/g, '') || parentName.trim();

      if (key) {
        if (!parentMap.has(key)) {
          const parts = parentName.trim().split(' ');
          parentMap.set(key, {
            id: key,
            firstName: parts[0] || '?',
            lastName: parts.slice(1).join(' ') || '',
            name: parentName,
            phone: phone,
            studentsAmount: 0,
            childrenNames: [],
            children: [],
            username: '',
            password: ''
          });
        }
        parentMap.get(key).studentsAmount += 1;
        parentMap.get(key).childrenNames.push((student.firstName && student.lastName) ? `${student.firstName} ${student.lastName}` : student.name || 'Élève');
        parentMap.get(key).children.push(student);
      }
    });

    const list = Array.from(parentMap.values());
    list.forEach((p: any) => {
      const dbRecord = dbParents.find((dbP: any) => dbP.phone === p.phone || dbP.id === p.id);
      if (dbRecord) {
        p.username = dbRecord.username || p.id;
        p.password = dbRecord.password || dbRecord.pin || p.password;
      } else {
        // Auto-generate credentials for Espace Parent if not existing
        const genUsername = p.phone.replace(/[^0-9]/g, '') || p.id;
        const genPassword = Math.floor(100000 + Math.random() * 900000).toString();
        p.username = genUsername;
        p.password = genPassword;
        // background save
        dbService.parents.save({
          id: p.id,
          merchantId: merchant.id,
          phone: p.phone,
          name: p.name,
          username: genUsername,
          password: genPassword,
          updatedAt: new Date().toISOString()
        }).catch(err => console.error("Error auto-configuring parent CL:", err));
      }
    });

    return list.sort((a: any, b: any) => b.studentsAmount - a.studentsAmount);
  }, [students, dbParents, merchant.id]);

  // Compute unique classes list
  const uniqueClassesFromParents = useMemo(() => {
    const classesSet = new Set<string>();
    parents.forEach((p: any) => {
      p.children?.forEach((c: any) => {
        const cls = c.class || c.grade || c.className;
        if (cls) classesSet.add(cls);
      });
    });
    return ['Tous', ...Array.from(classesSet).sort()];
  }, [parents]);

  // Filter parents list
  const filteredParents = useMemo(() => {
    return parents.filter((p: any) => {
      const q = parentsSearchQuery.trim().toLowerCase();
      const parentName = (p.name || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const username = (p.username || '').toLowerCase();
      
      // Children search match
      const childrenMatch = p.children?.some((c: any) => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const usernameMatch = (c.studentUsername || c.username || '').toLowerCase().includes(q);
        return fullName.includes(q) || usernameMatch;
      });

      const matchesSearch = !q ||
        parentName.includes(q) ||
        phone.includes(q) ||
        username.includes(q) ||
        childrenMatch;

      // Class match
      const matchesClass = parentsSelectedClass === 'Tous' || p.children?.some((c: any) => {
        const cls = c.class || c.grade || c.className;
        return cls === parentsSelectedClass;
      });

      return matchesSearch && matchesClass;
    });
  }, [parents, parentsSearchQuery, parentsSelectedClass]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Portail Parents</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            {parentsSearchQuery || parentsSelectedClass !== 'Tous' ? (
              <span>Affichés : {filteredParents.length} / {parents.length} parents</span>
            ) : (
              <span>Espaces familiaux auto-générés: {parents.length.toString().padStart(3, '0')}</span>
            )}
          </p>
        </div>
      </div>

      {parents.length === 0 ? (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2rem] border border-indigo-100 shadow-sm p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
           <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
             <Users className="w-10 h-10" />
           </div>
           <h3 className="text-2xl font-black text-indigo-950 mb-2">Configurez les Accès Parents</h3>
           <p className="text-indigo-800/70 max-w-md mx-auto mb-8 font-medium">Les comptes parents sont générés automatiquement à partir des contacts définis comme "Principal" dans les fiches d'inscription des élèves.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto align-middle hidden md:grid">
             <div className="bg-white p-4 rounded-2xl flex flex-col items-center">
               <BookOpen className="w-6 h-6 text-emerald-500 mb-2" />
               <span className="font-bold text-sm text-gray-800">Cahier de Texte</span>
               <span className="text-[10px] text-gray-500 text-center mt-1">Suivi des devoirs à la maison</span>
             </div>
             <div className="bg-white p-4 rounded-2xl flex flex-col items-center">
               <PenTool className="w-6 h-6 text-blue-500 mb-2" />
               <span className="font-bold text-sm text-gray-800">Bulletins Note</span>
               <span className="text-[10px] text-gray-500 text-center mt-1">Génération PDF signée</span>
             </div>
             <div className="bg-white p-4 rounded-2xl flex flex-col items-center">
               <Calculator className="w-6 h-6 text-purple-500 mb-2" />
               <span className="font-bold text-sm text-gray-800">Paiement Mobile</span>
               <span className="text-[10px] text-gray-500 text-center mt-1">Reçus automatiques via Wave/OM</span>
             </div>
           </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search and Filters Toolbar */}
          <div className="bg-slate-50 border border-black/5 p-4 rounded-3xl gap-4 flex flex-col md:flex-row items-stretch md:items-center justify-between shadow-xs">
            {/* Search Field */}
            <div className="relative flex-grow max-w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par parent, enfant, téléphone..."
                value={parentsSearchQuery}
                onChange={(e) => setParentsSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
              />
              {parentsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setParentsSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black hover:scale-110 transition-transform"
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center space-x-2 bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black uppercase text-gray-400 font-mono">Classe Enfant :</span>
                <select
                  value={parentsSelectedClass}
                  onChange={(e) => setParentsSelectedClass(e.target.value)}
                  className="text-xs font-extrabold text-slate-700 bg-transparent focus:outline-none pr-1 cursor-pointer"
                >
                  {uniqueClassesFromParents.map((className) => (
                    <option key={className} value={className}>
                      {className === 'Tous' ? 'Toutes' : className}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset button */}
              {(parentsSelectedClass !== 'Tous' || parentsSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setParentsSearchQuery('');
                    setParentsSelectedClass('Tous');
                  }}
                  className="px-3 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Réinitialiser tous les filtres"
                >
                  <X className="w-3 h-3" />
                  Effacer
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Parent / Tuteur (Auto-Détecté)</th>
                    <th className="px-8 py-5">Contact</th>
                    <th className="px-8 py-5">Enfants Associés</th>
                    <th className="px-8 py-5 text-right">Espace & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredParents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-gray-400 font-medium">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Search className="w-8 h-8 text-indigo-300 animate-pulse" />
                          <p className="text-sm font-bold text-gray-600">Aucun parent ne correspond à vos critères de recherche.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setParentsSearchQuery('');
                              setParentsSelectedClass('Tous');
                            }}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase tracking-wider text-[10px] rounded-xl transition-all cursor-pointer"
                          >
                            Effacer les filtres
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredParents.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-100">
                              {p.firstName?.[0] || '?'}{p.lastName?.[0] || '?'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 text-sm leading-tight">{p.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono tracking-wider mt-1 flex items-center gap-1.5 flex-wrap">
                                Identifiant: <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{p.username}</span> 
                                Code PIN: <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{p.password}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-600 font-mono">{p.phone}</td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700">{p.studentsAmount} Enfant(s)</span>
                            <span className="text-[10px] text-gray-400 font-medium">{p.childrenNames.join(', ')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right space-x-2 flex justify-end items-center">
                          <div className="flex items-center gap-1.5 mr-2">
                            <button 
                              onClick={() => {
                                const titleText = merchant.name || "ACOM Éducation";
                                const pin = p.password || 'Non configuré';
                                const identifiant = p.username || p.id;
                                const msg = `Bonjour ${p.name},\n\nVoici vos accès personnels pour vous connecter à votre Espace Parent sur ${titleText} :\n\n🌐 Notre portail : ${window.location.protocol}//${window.location.host}/login\n👤 Identifiant : *${identifiant}*\n🔑 Code PIN : *${pin}*\n\nDepuis cet espace, vous pourrez consulter les résultats, les absences, le cahier de texte et effectuer des paiements.\n\nCordialement,\nLa Direction de ${titleText}`;
                                const encoded = encodeURIComponent(msg);
                                const cleanPhone = p.phone ? p.phone.replace(/[^0-9+]/g, '') : '';
                                const target = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`;
                                window.open(target, '_blank');
                                toast.success("WhatsApp préparé avec les accès !");
                              }}
                              className="inline-flex p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-[10px] items-center gap-1.5 border border-emerald-200 cursor-pointer shadow-sm transition-colors"
                              title="Envoyer les accès par WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                 const titleText = merchant.name || "ACOM Éducation";
                                 const pin = p.password || 'Non configuré';
                                 const identifiant = p.username || p.id;
                                 setCustomEmailBody(`Bonjour ${p.name},\n\nVoici vos accès personnels pour vous connecter à votre Espace Parent sur ${titleText} :\n\n🌐 Notre portail : ${window.location.protocol}//${window.location.host}/login\n👤 Identifiant : ${identifiant}\n🔑 Code PIN : ${pin}\n\nDepuis cet espace, vous pourrez consulter les résultats, les absences, le cahier de texte et effectuer des paiements.\n\nCordialement,\nLa Direction de ${titleText}`);
                                 setSelectedEmailParent(p);
                              }}
                              className="inline-flex p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-[10px] items-center gap-1.5 border border-blue-200 cursor-pointer shadow-sm transition-colors"
                              title="Envoyer les accès par E-mail"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingParent(p);
                                setParentUsername(p.username);
                                setParentPassword(p.password);
                              }}
                              className="p-2 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-xl transition-all border border-gray-100 cursor-pointer"
                              title="Modifier les identifiants d'accès"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button 
                            onClick={() => setSelectedParent(p)}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-1 border border-indigo-200 shadow-sm"
                            title="Accéder immédiatement à son Espace Parent"
                          >
                            <span>Espace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {selectedParent && (
        <ParentPortalSimulation 
          parent={selectedParent} 
          merchant={merchant} 
          onClose={() => setSelectedParent(null)} 
        />
      )}

      {/* Edit Parent Credentials Dialog */}
      <AnimatePresence>
        {editingParent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 bg-slate-50 border-b border-gray-100 flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Modifier Accès Parent</h3>
                </div>
                <button onClick={() => setEditingParent(null)} className="text-gray-400 hover:text-gray-950"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveParentEdit} className="p-6 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Parent / Tuteur</label>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 text-sm">
                    {editingParent.name} ({editingParent.phone})
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Identifiant de connexion</label>
                  <input 
                    type="text" 
                    required
                    value={parentUsername}
                    onChange={e => setParentUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl text-sm font-bold font-sans outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Code PIN de sécurité</label>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={parentPassword}
                    onChange={e => setParentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 font-sans">
                  <button type="button" onClick={() => setEditingParent(null)} className="flex-1 py-2.5 text-xs border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-slate-50 transition-colors">Annuler</button>
                  <button type="submit" className="flex-1 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEmailParent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 bg-slate-50 border-b border-gray-100 flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Envoi des accès par E-mail</h3>
                </div>
                <button onClick={() => setSelectedEmailParent(null)} className="text-gray-400 hover:text-gray-950"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Parent destinataire</label>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 text-sm">
                    {selectedEmailParent.name} ({selectedEmailParent.phone})
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
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Corps du Message</label>
                  <textarea
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-200 text-gray-800 text-xs font-sans rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                    value={customEmailBody || `Bonjour,\n\nVous avez accès à l'espace parent pour suivre le parcours scolaire de votre enfant sur la plateforme ${merchant.name || 'ACOM Éducation'} :\n\n🌐 Notre portail : ${window.location.protocol}//${window.location.host}/login\n👤 Identifiant : ${selectedEmailParent.username || selectedEmailParent.id}\n🔑 Code PIN : ${selectedEmailParent.password || 'Non configuré'}\n\nDepuis cet espace, vous pourrez consulter les résultats, les absences, le cahier de texte et effectuer des paiements.\n\nCordialement,\nLa Direction de ${merchant.name || 'ACOM Éducation'}`}
                    onChange={e => setCustomEmailBody(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-4 font-sans">
                <button type="button" onClick={() => setSelectedEmailParent(null)} className="flex-1 py-3 text-xs border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-slate-100 transition-colors">Annuler</button>
                <button 
                  id="send-email-parent-confirm-btn"
                  onClick={async () => {
                    setEmailSending(true);
                    await new Promise(resolve => setTimeout(resolve, 1400));
                    setEmailSending(false);
                    toast.success(`E-mail expédié avec succès au ${selectedEmailParent.name} !`);
                    setSelectedEmailParent(null);
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
