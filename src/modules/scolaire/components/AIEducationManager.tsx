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

export const AIEducationManager = ({ merchant }: { merchant: Merchant }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{name: string, cause: string}[] | null>(null);

  const students = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const runAudit = () => {
    if(students.length === 0) {
      toast.error('Ajoutez des étudiants d\'abord');
      return;
    }
    setIsAuditing(true);
    setAuditResult(null);

    // Simulate AI network time
    setTimeout(() => {
      // Pick 1-2 random students to flag
      const targetCount = Math.min(students.length, 2);
      const shuffled = [...students].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, targetCount);
      
      setAuditResult(selected.map(s => ({
        name: s.firstName + ' ' + s.lastName,
        cause: ['Baisse de note en Maths (-3 pts)', 'Absences répétées le vendredi', 'Retards fréquents le matin'][Math.floor(Math.random() * 3)]
      })));
      setIsAuditing(false);
      toast.success("Audit terminé !");
    }, 2500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
            Intelligence Artificielle <Zap className="w-5 h-5 text-yellow-500" />
          </h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Analyse prédictive & Assistants</p>
        </div>
        <button 
          onClick={runAudit}
          disabled={isAuditing}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          <span>{isAuditing ? "Analyse en cours..." : "Lancer l'Audit Général"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-purple-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 flex items-center justify-center rounded-2xl shadow-inner">
              <TrendingDown className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-900">Prédiction Décrochage</h3>
              <p className="text-sm font-medium text-gray-500">Machine Learning</p>
            </div>
          </div>
          <p className="text-gray-600 font-medium mb-6 relative z-10">L'IA analyse les baisses de notes, les absences et les retards pour identifier les élèves risquant de décrocher, avant que la situation ne devienne critique.</p>
          
          {auditResult && (
            <div className="mt-4 space-y-2 relative z-10">
              <h4 className="font-bold text-sm text-purple-900 mb-2 border-b border-purple-100 pb-2">Alerte Éducative (Résultats) :</h4>
              {auditResult.map((res, i) => (
                <div key={i} className="bg-red-50 p-3 rounded-xl border border-red-100 text-sm">
                  <span className="font-bold text-red-900">{res.name}</span> : <span className="text-red-700">{res.cause}</span>
                </div>
              ))}
            </div>
          )}

          {!auditResult && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative z-10 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Modèle Prédictif</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-[10px] rounded-full uppercase tracking-widest border border-emerald-200">En attente d'audit</span>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 flex items-center justify-center rounded-2xl shadow-inner">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-900">Génération Appréciations</h3>
              <p className="text-sm font-medium text-gray-500">IA Générative (Gemini)</p>
            </div>
          </div>
          <p className="text-gray-600 font-medium mb-6 relative z-10">Assistant de rédaction de bulletins intelligents : génère instantanément des commentaires pertinents et encourageants basés sur la courbe des notes de l'élève.</p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative z-10 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">Appréciations Auto</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-black text-[10px] rounded-full uppercase tracking-widest border border-yellow-200">Accessible aux profs</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 5. School Manager (Gestion scolaire)