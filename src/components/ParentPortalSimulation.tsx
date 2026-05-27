import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  X, LayoutDashboard, FileText, Calendar, 
  Clock, BookOpen, CreditCard, Bell, 
  ShieldAlert, ShieldCheck, Bus, Utensils,
  LogOut, Download, AlertTriangle, CheckCircle2, ChevronRight
} from 'lucide-react';

export const ParentPortalSimulation = ({ parent, merchant, onClose }: { parent: any, merchant: any, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChild, setSelectedChild] = useState(parent?.children?.[0] || null);

  const attendances = useLiveQuery(() => 
    selectedChild ? db.attendance?.where('studentId').equals(selectedChild.id).reverse().sortBy('date') : []
  , [selectedChild?.id]) || [];

  const absences = attendances.filter(a => a.status === 'absent');
  const lates = attendances.filter(a => a.status === 'late');

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
                <h3 className="text-xl font-black text-slate-800">Bulletins & Notes de {selectedChild?.name || 'l\'élève'}</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Télécharger Bulletin</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200/60">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Mathématiques</span>
                  <div className="flex items-end gap-3 mt-2">
                    <span className="text-3xl font-black text-emerald-600">16.5</span>
                    <span className="text-sm font-bold text-slate-500 pb-1">/ 20</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Examen Semestriel - Excellents résultats</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200/60">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Français</span>
                  <div className="flex items-end gap-3 mt-2">
                    <span className="text-3xl font-black text-blue-600">14.0</span>
                    <span className="text-sm font-bold text-slate-500 pb-1">/ 20</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Devoir sur table - En progression</p>
                </div>
              </div>
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
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500" /> Cahier de Texte (Aujourd'hui)</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mathématiques</span>
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Pour Demain</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">Faire les exercices 12 et 13 page 45.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Histoire-Géo</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Pour Lundi</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">Apprendre la leçon sur la Révolution Industrielle.</p>
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
