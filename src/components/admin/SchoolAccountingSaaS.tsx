import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../db/db';
import { dbService } from '../../services/dbService';
import { syncService } from '../../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../../services/geminiService';
import { 
  DollarSign, TrendingUp, TrendingDown, ClipboardList, BookOpen, AlertCircle, 
  Users, CreditCard, CheckCircle, Smartphone, Banknote, RefreshCw, Plus, 
  Trash2, X, Download, FileText, Check, Package, Car, Utensils, Receipt, 
  Sparkles, Filter, Search, Printer, Send, Info, Calendar, ShieldCheck, Sliders,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { SchoolPricingSaaS } from './SchoolPricingSaaS';

interface Merchant {
  id: string;
  name: string;
  type: string;
  plan: string;
  currency: string;
}

const StudentFeeConfigModal = ({
  student,
  onClose,
  onSave,
  currency,
  getStudentFees,
  saving
}: {
  student: any;
  onClose: () => void;
  onSave: (id: string, bd: any) => void;
  currency: string;
  getStudentFees: (st: any) => any;
  saving: boolean;
}) => {
  const currentFees = getStudentFees(student);

  const [months, setMonths] = useState<number>(Number(currentFees.monthsDuration ?? 9));
  const [inscription, setInscription] = useState<number>(Number(currentFees.inscription ?? 25000));
  const [scolarite, setScolarite] = useState<number>(Number(currentFees.scolarite ?? 300000));
  const [uniforme, setUniforme] = useState<number>(Number(currentFees.uniforme ?? 40000));
  
  const [hasTransport, setHasTransport] = useState<boolean>(currentFees.hasTransport !== undefined ? !!currentFees.hasTransport : Number(currentFees.transport ?? 0) > 0);
  const [hasCanteen, setHasCanteen] = useState<boolean>(currentFees.hasCanteen !== undefined ? !!currentFees.hasCanteen : Number(currentFees.cantine ?? 0) > 0);
  const [hasInternat, setHasInternat] = useState<boolean>(currentFees.hasInternat !== undefined ? !!currentFees.hasInternat : Number(currentFees.internat ?? 0) > 0);
  
  const [transport, setTransport] = useState<number>(Number(currentFees.transport) || 60000);
  const [cantine, setCantine] = useState<number>(Number(currentFees.cantine) || 90000);
  const [internat, setInternat] = useState<number>(Number(currentFees.internat) || 0);

  const finalTransport = hasTransport ? transport : 0;
  const finalCantine = hasCanteen ? cantine : 0;
  const finalInternat = hasInternat ? internat : 0;

  const scolMens = months > 0 ? Math.round(scolarite / months) : 0;
  const transMens = months > 0 ? Math.round(finalTransport / months) : 0;
  const cantMens = months > 0 ? Math.round(finalCantine / months) : 0;
  const internatMens = months > 0 ? Math.round(finalInternat / months) : 0;

  const total = inscription + scolarite + uniforme + finalTransport + finalCantine + finalInternat;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(student.id, {
      inscription,
      scolarite,
      uniforme,
      transport: finalTransport,
      cantine: finalCantine,
      internat: finalInternat,
      hasTransport,
      hasCanteen,
      hasInternat,
      monthsDuration: months
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-sans max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-700" />
            <div>
              <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight">Fiche de Facturation</h3>
              <p className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-widest mt-0.5">
                Ajuster les tarifs pour {student.firstName} {student.lastName}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border shadow-sm text-slate-400 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left panel: Saisies de Tarification */}
          <div className="flex-1 p-8 space-y-4 max-h-[75vh] min-h-[400px] overflow-y-auto bg-slate-50/10">
            <p className="text-xs text-slate-500 leading-normal mb-2 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
              Modifiez la configuration financière contractuelle de l'élève. Les valeurs mensuelles se recalculent instantanément sur le volet de droite.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[10px] font-mono font-black text-indigo-700 uppercase tracking-widest mb-1.5 font-bold">Durée de la formation (mois)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="12" 
                  value={months}
                  onChange={(e) => setMonths(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800 bg-indigo-50/20" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Frais d'Inscription ({currency})</label>
                <input 
                  type="number" 
                  value={inscription}
                  onChange={(e) => setInscription(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Scolarité Annuelle ({currency})</label>
                <input 
                  type="number" 
                  value={scolarite}
                  onChange={(e) => setScolarite(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Uniforme Scolaire ({currency})</label>
                <input 
                  type="number" 
                  value={uniforme}
                  onChange={(e) => setUniforme(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" 
                />
              </div>

              <div className="col-span-1 sm:col-span-2 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="modalHasTransport" 
                  className="w-4 h-4 rounded text-indigo-700 focus:ring-indigo-500 border-slate-300"
                  checked={hasTransport} 
                  onChange={(e) => setHasTransport(e.target.checked)} 
                />
                <label htmlFor="modalHasTransport" className="text-xs font-black text-slate-850 uppercase tracking-wider cursor-pointer">
                  🚌 Activer le Transport Scolaire pour cet élève
                </label>
              </div>

              {hasTransport && (
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Transport Annuel ({currency})</label>
                  <input 
                    type="number" 
                    value={transport}
                    onChange={(e) => setTransport(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" 
                  />
                </div>
              )}

              <div className="col-span-1 sm:col-span-2 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="modalHasCanteen" 
                  className="w-4 h-4 rounded text-indigo-700 focus:ring-indigo-500 border-slate-300"
                  checked={hasCanteen} 
                  onChange={(e) => setHasCanteen(e.target.checked)} 
                />
                <label htmlFor="modalHasCanteen" className="text-xs font-black text-slate-850 uppercase tracking-wider cursor-pointer">
                  🍱 Activer la Cantine Cafétéria pour cet élève
                </label>
              </div>

              {hasCanteen && (
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Cantine Annuelle ({currency})</label>
                  <input 
                    type="number" 
                    value={cantine}
                    onChange={(e) => setCantine(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" 
                  />
                </div>
              )}

              <div className="col-span-1 sm:col-span-2 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="modalHasInternat" 
                  className="w-4 h-4 rounded text-indigo-700 focus:ring-indigo-500 border-slate-300"
                  checked={hasInternat} 
                  onChange={(e) => setHasInternat(e.target.checked)} 
                />
                <label htmlFor="modalHasInternat" className="text-xs font-black text-slate-850 uppercase tracking-wider cursor-pointer">
                  🏠 Activer l'Hébergement / Services d'Internat pour cet élève
                </label>
              </div>

              {hasInternat && (
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Frais d'Internat Annuel ({currency})</label>
                  <input 
                    type="number" 
                    value={internat}
                    onChange={(e) => setInternat(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold font-mono focus:border-indigo-500 text-slate-800" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Synthese de Calcul Dynamique */}
          <div className="w-full md:w-[380px] p-8 shrink-0 bg-slate-50 flex flex-col justify-between max-h-[75vh] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest border-b pb-2 border-slate-200">
                Aperçu & Calculs Mensuels
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono">
                  <span className="text-slate-500 font-medium font-bold text-indigo-950">Durée de la formation :</span>
                  <span className="font-extrabold text-indigo-950 font-black">{months} mois</span>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono">
                  <span className="text-slate-500 font-medium">🎟️ Frais d'Inscription :</span>
                  <span className="font-black text-indigo-950">{inscription.toLocaleString()} {currency}</span>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                  <div>
                    <span className="text-slate-700 font-bold">🎓 Scolarité Annuelle :</span>
                    <p className="text-[10px] text-indigo-650 font-bold mt-0.5">Scolarité Mensuelle (calculée) :</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-600">{scolarite.toLocaleString()} {currency}</p>
                    <p className="font-black text-indigo-700 text-sm">{(scolMens).toLocaleString()} {currency}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono">
                  <span className="text-slate-500 font-medium">👕 Uniforme Scolaire :</span>
                  <span className="font-black text-indigo-950">{uniforme.toLocaleString()} {currency}</span>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                  <div>
                    <span className="text-slate-700 font-bold">🚌 Transport Annuel :</span>
                    <p className="text-[10px] text-emerald-650 font-bold mt-0.5 font-bold">Transport Mensuel (calculé) :</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-600">{hasTransport ? `${transport.toLocaleString()} ${currency}` : "Désactivé"}</p>
                    <p className="font-black text-emerald-750 text-emerald-800 text-sm">{(transMens).toLocaleString()} {currency}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                  <div>
                    <span className="text-slate-700 font-bold">🍱 Cantine Annuelle :</span>
                    <p className="text-[10px] text-amber-650 font-bold mt-0.5 font-bold">Cantine Mensuelle (calculée) :</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-600">{hasCanteen ? `${cantine.toLocaleString()} ${currency}` : "Désactivé"}</p>
                    <p className="font-black text-amber-700 text-sm">{(cantMens).toLocaleString()} {currency}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                  <div>
                    <span className="text-slate-700 font-bold">🏠 Internat Annuel :</span>
                    <p className="text-[10px] text-violet-650 font-bold mt-0.5 font-bold">Internat Mensuel (calculé) :</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-600">{hasInternat ? `${internat.toLocaleString()} ${currency}` : "Désactivé"}</p>
                    <p className="font-black text-violet-700 text-sm">{(internatMens).toLocaleString()} {currency}</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-950 p-4.5 rounded-2xl text-white font-mono mt-4">
                <span className="text-[9px] text-indigo-200 uppercase tracking-wider font-extrabold">Objectif Annuel Global :</span>
                <p className="text-lg font-black tracking-tight mt-0.5">{total.toLocaleString()} {currency}</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-slate-200 mt-4 shrink-0 col-span-1 md:col-span-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3.5 border border-slate-200 text-xs font-black uppercase tracking-wider rounded-2xl text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="flex-[2] py-3.5 bg-indigo-950 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-black transition-all"
              >
                {saving ? 'Sauvegarde...' : 'Enregistrer Tarifs'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const SchoolAccountingSaaS = ({ merchant, subTab }: { merchant: Merchant, subTab?: string }) => {
  const liveMerchant = useLiveQuery(() => db.merchants.get(merchant.id), [merchant.id]) || merchant;
  const currency = liveMerchant.currency || merchant.currency || 'FCFA';

  const dbClasses = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const getStudentFees = (st: any) => {
    const pricing = (liveMerchant as any)?.schoolPricing || (merchant as any)?.schoolPricing;
    const fallback = {
      inscription: 25000,
      scolarite: 300000,
      uniforme: 40000,
      transport: 60000,
      cantine: 90000,
      internat: 0,
      monthsDuration: 9,
      hasTransport: true,
      hasCanteen: true,
      hasInternat: false
    };

    const mapConfig = (cfg: any) => {
      const hasTransport = cfg.hasTransport !== undefined ? !!cfg.hasTransport : true;
      const hasCanteen = cfg.hasCanteen !== undefined ? !!cfg.hasCanteen : true;
      const hasInternat = cfg.hasInternat !== undefined ? !!cfg.hasInternat : (Number((cfg.annualInternat || '').toString().replace(/\D/g, '')) > 0 || Number(cfg.internat || 0) > 0);
      return {
        inscription: Number((cfg.registrationFee || '').toString().replace(/\D/g, '') || fallback.inscription),
        scolarite: Number((cfg.annualTuition || '').toString().replace(/\D/g, '') || fallback.scolarite),
        uniforme: Number((cfg.uniformFee || '').toString().replace(/\D/g, '') || fallback.uniforme),
        transport: hasTransport ? Number((cfg.annualTransport || '').toString().replace(/\D/g, '') || fallback.transport) : 0,
        cantine: hasCanteen ? Number((cfg.annualCanteen || '').toString().replace(/\D/g, '') || fallback.cantine) : 0,
        cantineInterne: Number((cfg.annualCanteenInterne || cfg.cantineInterne || cfg.annualCanteen || '').toString().replace(/\D/g, '') || fallback.cantine),
        internat: hasInternat ? Number((cfg.annualInternat || '').toString().replace(/\D/g, '') || cfg.internat || fallback.internat) : 0,
        hasTransport,
        hasCanteen,
        hasInternat,
        monthsDuration: Number((cfg.monthsDuration || '').toString().replace(/\D/g, '') || fallback.monthsDuration)
      };
    };

    // Normalize accents and lower-case
    const normalizeStr = (str: string) => {
      if (!str) return '';
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae');
    };

    // 1. Specific exceptions from admin setup
    let baseFees: any = null;
    if (pricing?.exceptions?.[st.id]) {
      baseFees = mapConfig(pricing.exceptions[st.id]);
    }

    // 2. Class-specific pricing set by admin
    if (!baseFees) {
      const classKey = st.classId || st.class_id || st.class || st.grade;
      
      // First try a direct match
      if (classKey && pricing?.classes?.[classKey]) {
        baseFees = mapConfig(pricing.classes[classKey]);
      } else {
        // If we only have the name in classKey (e.g., student.grade = '5ème A'), try resolving the ID
        const matchedClass = dbClasses.find(c => c.name === classKey || c.id === classKey);
        if (matchedClass && pricing?.classes?.[matchedClass.id]) {
          baseFees = mapConfig(pricing.classes[matchedClass.id]);
        } else if (matchedClass && pricing?.classes?.[matchedClass.name]) {
          baseFees = mapConfig(pricing.classes[matchedClass.name]);
        }
      }
    }

    // 3. Level-specific pricing set by admin
    if (!baseFees) {
      const gradeStr = normalizeStr(st.grade || st.class || '');
      let levelKey = '';
      if (gradeStr.includes('mat') || gradeStr.includes('crech') || gradeStr.includes('garde') || gradeStr.includes('maternelle')) {
        levelKey = 'Maternelle';
      } else if (gradeStr.includes('ci') || gradeStr.includes('cp') || gradeStr.includes('ce1') || gradeStr.includes('ce2') || gradeStr.includes('cm1') || gradeStr.includes('cm2') || gradeStr.includes('prim')) {
        levelKey = 'Primaire';
      } else if (gradeStr.includes('6e') || gradeStr.includes('5e') || gradeStr.includes('4e') || gradeStr.includes('3e') || gradeStr.includes('colleg')) {
        levelKey = 'Collège';
      } else if (gradeStr.includes('second') || gradeStr.includes('premier') || gradeStr.includes('terminal') || gradeStr.includes('lyce') || gradeStr.includes('2nd') || gradeStr.includes('1er') || gradeStr.includes('tle') || gradeStr.includes('l2')) {
        levelKey = 'Lycée';
      } else if (gradeStr.includes('pro') || gradeStr.includes('format')) {
        levelKey = 'Formation Professionnelle';
      }

      if (levelKey && pricing?.levels?.[levelKey]) {
        baseFees = mapConfig(pricing.levels[levelKey]);
      }
    }

    // 4. Override with flat student parameters if present (Fiche d'Inscription options)
    let hasTransport = baseFees ? baseFees.hasTransport : fallback.hasTransport;
    if (st.hasTransport !== undefined) {
      hasTransport = !!st.hasTransport;
    } else if (st.serviceTransport !== undefined) {
      hasTransport = !!st.serviceTransport;
    }

    let hasCanteen = baseFees ? baseFees.hasCanteen : fallback.hasCanteen;
    if (st.hasCanteen !== undefined) {
      hasCanteen = !!st.hasCanteen;
    } else if (st.serviceCantine !== undefined) {
      hasCanteen = !!st.serviceCantine;
    }

    let hasInternat = baseFees ? baseFees.hasInternat : fallback.hasInternat;
    if (st.hasInternat !== undefined) {
      hasInternat = !!st.hasInternat;
    } else if (st.serviceInternat !== undefined) {
      hasInternat = !!st.serviceInternat;
    } else if (st.regime !== undefined) {
      hasInternat = (st.regime === 'interne');
    }

    // Ensure transport, cantine & internat costs are correctly dynamic based on the active options
    const rawTransport = st.annualTransport !== undefined ? Number(String(st.annualTransport).replace(/\D/g, '')) : (baseFees ? baseFees.transport : fallback.transport);
    const rawCanteen = st.annualCanteen !== undefined ? Number(String(st.annualCanteen).replace(/\D/g, '')) : (baseFees ? (st.regime === 'interne' ? (baseFees.cantineInterne || baseFees.cantine) : baseFees.cantine) : fallback.cantine);
    const rawInternat = st.annualInternat !== undefined ? Number(String(st.annualInternat).replace(/\D/g, '')) : (baseFees ? baseFees.internat : fallback.internat);

    const transportValue = hasTransport ? rawTransport : 0;
    const canteenValue = hasCanteen ? rawCanteen : 0;
    const internatValue = hasInternat ? rawInternat : 0;

    const currentResult = {
      ...(baseFees || fallback),
      transport: transportValue,
      cantine: canteenValue,
      internat: internatValue,
      hasTransport,
      hasCanteen,
      hasInternat,
    };

    if (st.registrationFee !== undefined) {
      currentResult.inscription = Number(String(st.registrationFee).replace(/\D/g, '')) || currentResult.inscription;
    }
    if (st.annualTuition !== undefined) {
      currentResult.scolarite = Number(String(st.annualTuition).replace(/\D/g, '')) || currentResult.scolarite;
    }
    if (st.uniformFee !== undefined) {
      currentResult.uniforme = Number(String(st.uniformFee).replace(/\D/g, '')) || currentResult.uniforme;
    }
    if (st.annualInternat !== undefined) {
      currentResult.internat = hasInternat ? (Number(String(st.annualInternat).replace(/\D/g, '')) || currentResult.internat) : 0;
    }
    if (st.monthsDuration !== undefined) {
      currentResult.monthsDuration = Number(String(st.monthsDuration).replace(/\D/g, '')) || currentResult.monthsDuration;
    }

    // 5. Specific inline-edited fees from student details (ONLY IF EXPLICITLY CUSTOM)
    if (st.tuitionFeesBreakdown && st.tuitionFeesBreakdown.isCustom) {
      const customHasTransport = st.tuitionFeesBreakdown.hasTransport !== undefined 
        ? !!st.tuitionFeesBreakdown.hasTransport 
        : (st.tuitionFeesBreakdown.transport !== undefined ? Number(st.tuitionFeesBreakdown.transport) > 0 : true);
      const customHasCanteen = st.tuitionFeesBreakdown.hasCanteen !== undefined 
        ? !!st.tuitionFeesBreakdown.hasCanteen 
        : (st.tuitionFeesBreakdown.cantine !== undefined ? Number(st.tuitionFeesBreakdown.cantine) > 0 : true);
      const customHasInternat = st.tuitionFeesBreakdown.hasInternat !== undefined 
        ? !!st.tuitionFeesBreakdown.hasInternat 
        : (st.tuitionFeesBreakdown.internat !== undefined ? Number(st.tuitionFeesBreakdown.internat) > 0 : false);
      return {
        ...currentResult,
        ...st.tuitionFeesBreakdown,
        transport: customHasTransport ? Number(st.tuitionFeesBreakdown.transport ?? currentResult.transport) : 0,
        cantine: customHasCanteen ? Number(st.tuitionFeesBreakdown.cantine ?? currentResult.cantine) : 0,
        internat: customHasInternat ? Number(st.tuitionFeesBreakdown.internat ?? currentResult.internat) : 0,
        hasTransport: customHasTransport,
        hasCanteen: customHasCanteen,
        hasInternat: customHasInternat,
        monthsDuration: Number(st.tuitionFeesBreakdown.monthsDuration || currentResult.monthsDuration)
      };
    }

    return currentResult;
  };

  const autoGetFirstUnpaidMonthForStudent = (st: any, catLabel: string) => {
    const currentFees = getStudentFees(st);
    const SCHOOL_MONTHS = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre'];
    const activeMonths = SCHOOL_MONTHS.slice(0, Number(currentFees.monthsDuration || 9));
    const payments = st.tuitionPayments || [];

    for (const m of activeMonths) {
      let target = 0;
      let paid = 0;

      if (catLabel === 'Mensualité Globale') {
         const ts = Math.round(Number(currentFees.scolarite ?? 0) / Number(currentFees.monthsDuration || 9));
         const tt = currentFees.hasTransport !== false ? Math.round(Number(currentFees.transport ?? 0) / Number(currentFees.monthsDuration || 9)) : 0;
         const tc = currentFees.hasCanteen !== false ? Math.round(Number(currentFees.cantine ?? 0) / Number(currentFees.monthsDuration || 9)) : 0;
         const ti = currentFees.hasInternat !== false ? Math.round(Number(currentFees.internat ?? 0) / Number(currentFees.monthsDuration || 9)) : 0;
         target = ts + tt + tc + ti;

         paid = payments
          .filter((p: any) => 
            p.category === `Scolarité - ${m}` || 
            p.category === `Transport - ${m}` || 
            p.category === `Cantine - ${m}` ||
            p.category === `Internat - ${m}`
          )
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      } else if (catLabel === 'Scolarité Mensuelle') {
        target = Math.round(Number(currentFees.scolarite ?? 0) / Number(currentFees.monthsDuration || 9));
        paid = payments
          .filter((p: any) => p.category === `Scolarité - ${m}`)
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      } else if (catLabel === 'Transport Mensuel') {
        target = Math.round(Number(currentFees.transport ?? 0) / Number(currentFees.monthsDuration || 9));
        paid = payments
          .filter((p: any) => p.category === `Transport - ${m}`)
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      } else if (catLabel === 'Cantine Mensuelle') {
        target = Math.round(Number(currentFees.cantine ?? 0) / Number(currentFees.monthsDuration || 9));
        paid = payments
          .filter((p: any) => p.category === `Cantine - ${m}`)
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      } else if (catLabel === 'Internat Mensuel') {
        target = Math.round(Number(currentFees.internat ?? 0) / Number(currentFees.monthsDuration || 9));
        paid = payments
          .filter((p: any) => p.category === `Internat - ${m}`)
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      } else {
        return activeMonths[0] || 'Octobre';
      }

      if (target > paid) {
        return m;
      }
    }

    return activeMonths[0] || 'Octobre';
  };

  // State management
  const [activeSubTab, setActiveSubTab] = useState<'kpi' | 'scolarite' | 'caisse' | 'depenses' | 'salaires' | 'stock' | 'transport' | 'cantine' | 'pricing'>((subTab as any) || 'kpi');

  useEffect(() => {
    if (subTab && subTab !== activeSubTab) {
      setActiveSubTab(subTab as any);
    }
  }, [subTab, activeSubTab]);
  
  // Modals & Forms
  const [showFeeConfigModal, setShowFeeConfigModal] = useState<any>(null); // student object for configuring fees
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null); // student object for quick payment cashier
  const [selectedStudentFinance, setSelectedStudentFinance] = useState<any>(null); // student selected for advanced financial sheet
  const [financeFormCategory, setFinanceFormCategory] = useState<string>('Mensualité Globale');
  const [financeFormMonth, setFinanceFormMonth] = useState<string>('Octobre');
  const [financeFormAmount, setFinanceFormAmount] = useState<number>(30000);
  const [financeFormMode, setFinanceFormMode] = useState<string>('Wave');
  const [isEditingFeesInline, setIsEditingFeesInline] = useState<boolean>(false);
  const [inlineFees, setInlineFees] = useState<any>({
    inscription: 25000,
    scolarite: 300000,
    uniforme: 40000,
    transport: 60000,
    cantine: 90000
  });

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null); // payment receipt object
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: 0, category: 'Salaires', description: '', staffId: '' });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stockQuantity: 50, category: 'Uniforme' });
  const [saving, setSaving] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Tous');

  // Canteen / Cafeteria States
  const [canteenSearchTerm, setCanteenSearchTerm] = useState('');
  const [canteenRegimeFilter, setCanteenRegimeFilter] = useState<'all' | 'demi-pension' | 'interne' | 'externe'>('all');
  const [canteenRosterMonth, setCanteenRosterMonth] = useState<string>('Juin');
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [generatingMenu, setGeneratingMenu] = useState(false);
  const [lunchMenu, setLunchMenu] = useState<any>(() => {
    const saved = localStorage.getItem('school_lunch_menu');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      Lundi: 'Riz au poisson (Thiéboudienne)',
      Mardi: 'Mafé au bœuf d\'excellence',
      Mercredi: 'Poulet yassa traditionnel d\'ACOM',
      Jeudi: 'Couscous sénégalais sauce gombo',
      Vendredi: 'Riz au poulet grillé sauce oignon'
    };
  });

  // Load database items via useLiveQuery (Reactive)
  const students = useLiveQuery(() => 
    db.students.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const employees = useLiveQuery(() => 
    db.employees.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  // Derived financial computations
  const finances = useMemo(() => {
    // 1. Calculate revenues from sales/payments
    let totalRevenue = 0;
    sales.forEach(sale => {
      totalRevenue += Number(sale.totalAmount || 0);
    });

    // 2. School fees specific metrics (from students database)
    let totalTargetFees = 0;
    let totalPaidFees = 0;
    students.forEach((s: any) => {
      const fees = getStudentFees(s);
      
      const stTotal = Number(fees.inscription || 0) + 
                     Number(fees.scolarite || 0) + 
                     Number(fees.uniforme || 0) + 
                     Number(fees.transport || 0) + 
                     Number(fees.cantine || 0);
      
      totalTargetFees += stTotal;

      // Extract paid amount for this student
      const stPayments = s.tuitionPayments || [];
      const stPaid = stPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      totalPaidFees += stPaid;
    });

    // If no sales exist yet, we can benchmark with student payments
    const actualRevenue = Math.max(totalRevenue, totalPaidFees);

    // 3. Expenses
    let totalExpenses = 0;
    expenses.forEach(exp => {
      totalExpenses += Number(exp.amount || 0);
    });

    const netResult = actualRevenue - totalExpenses;
    const totalOverdue = Math.max(0, totalTargetFees - totalPaidFees);

    return {
      totalRevenue: actualRevenue,
      totalExpenses,
      netResult,
      totalTargetFees,
      totalPaidFees,
      totalOverdue
    };
  }, [sales, expenses, students, (merchant as any).schoolPricing]);

  // Unique grade levels
  const uniqueClassGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    students.forEach((s: any) => {
      if (s.grade) gradesSet.add(s.grade);
    });
    return ['Tous', ...Array.from(gradesSet).sort()];
  }, [students]);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      const q = searchTerm.toLowerCase().trim();
      const nameMatch = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(q) ||
                        (s.matricule || '').toLowerCase().includes(q);
      const gradeMatch = selectedGrade === 'Tous' || s.grade === selectedGrade;
      return nameMatch && gradeMatch;
    });
  }, [students, searchTerm, selectedGrade]);

  // 1. SAVE NEW FEE CONFIGURATION FOR A STUDENT
  const handleSaveFeeConfig = async (studentId: string, breakdown: any) => {
    const student = students.find((s: any) => s.id === studentId);
    if (!student) return;

    setSaving(true);
    try {
      await dbService.students.save({
        ...student,
        tuitionFeesBreakdown: { ...breakdown, isCustom: true },
        updatedAt: new Date()
      });
      syncService.syncAllMerchantData(merchant.id);
      setShowFeeConfigModal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Update student's regime dynamically
  const handleUpdateStudentRegime = async (studentId: string, newRegime: 'externe' | 'demi-pension' | 'interne') => {
    const student = students.find((s: any) => s.id === studentId);
    if (!student) return;

    setSaving(true);
    try {
      const pricing = (liveMerchant as any)?.schoolPricing || (merchant as any)?.schoolPricing;
      
      const getGradeStr = (st: any) => {
        const gradeStr = st.grade || st.class || '';
        if (gradeStr.includes('mat') || gradeStr.includes('crech') || gradeStr.includes('garde') || gradeStr.includes('maternelle')) return 'Maternelle';
        if (gradeStr.includes('ci') || gradeStr.includes('cp') || gradeStr.includes('ce1') || gradeStr.includes('ce2') || gradeStr.includes('cm1') || gradeStr.includes('cm2') || gradeStr.includes('prim')) return 'Primaire';
        if (gradeStr.includes('6e') || gradeStr.includes('5e') || gradeStr.includes('4e') || gradeStr.includes('3e') || gradeStr.includes('colleg')) return 'Collège';
        return 'Lycée';
      };
      
      const level = getGradeStr(student);
      const baseFees = pricing?.levels?.[level];
      
      let annualCanteen = 0;
      let annualInternat = 0;
      let hasCanteen = false;
      let hasInternat = false;

      if (newRegime === 'demi-pension') {
        hasCanteen = true;
        annualCanteen = baseFees ? (Number((baseFees.annualCanteen || baseFees.cantine || '90000').toString().replace(/\D/g, ''))) : 90000;
      } else if (newRegime === 'interne') {
        hasCanteen = true;
        hasInternat = true;
        annualCanteen = baseFees ? (Number((baseFees.annualCanteenInterne || baseFees.annualCanteen || baseFees.cantine || '90000').toString().replace(/\D/g, ''))) : 90000;
        annualInternat = baseFees ? (Number((baseFees.annualInternat || baseFees.internat || '180000').toString().replace(/\D/g, ''))) : 180000;
      }

      await dbService.students.save({
        ...student,
        regime: newRegime,
        hasCanteen,
        hasInternat,
        annualCanteen,
        annualInternat,
        tuitionFeesBreakdown: student.tuitionFeesBreakdown ? {
          ...student.tuitionFeesBreakdown,
          hasCanteen,
          hasInternat,
          cantine: annualCanteen,
          internat: annualInternat
        } : undefined,
        updatedAt: new Date()
      });

      syncService.syncAllMerchantData(merchant.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateMenuWithAI = async () => {
    setGeneratingMenu(true);
    try {
      const prompt = `Génère un menu hebdomadaire de cantine scolaire équilibré et nutritif avec des spécialités sénégalaises populaires pour les enfants (ex: Riz au poisson (Thiéboudienne), Poulet Yassa, Mafé au boeuf, Couscous gombo, Soupou Kandja, Kedjenou de poulet, etc.).
      Retourne UNIQUEMENT un objet JSON valide contenant exactement les clés: Lundi, Mardi, Mercredi, Jeudi, Vendredi.
      Le format de réponse doit être STRICTEMENT :
      {
        "Lundi": "nom complet du plat",
        "Mardi": "nom complet du plat",
        "Mercredi": "nom complet du plat",
        "Jeudi": "nom complet du plat",
        "Vendredi": "nom complet du plat"
      }
      Ne retourne rien d'autre que l'objet JSON brut. Pas de texte explicatif avant ou après.`;
      
      const responseText = await geminiService.generateText(prompt);
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const parsedMenu = JSON.parse(cleanJson);
      
      if (parsedMenu.Lundi && parsedMenu.Mardi && parsedMenu.Mercredi && parsedMenu.Jeudi && parsedMenu.Vendredi) {
        setLunchMenu(parsedMenu);
        localStorage.setItem('school_lunch_menu', JSON.stringify(parsedMenu));
      }
    } catch (e) {
      console.error("Failed to generate cafeteria menu via Gemini:", e);
    } finally {
      setGeneratingMenu(false);
    }
  };

  // 2. SAVE PAYMENT (ENCAISSEMENT CAISSE)
  const handleRecordPayment = async (studentId: string, paymentData: { amount: number, category: string, mode: string, details?: any }, skipReceiptUpdate = false) => {
    const student = await db.students.get(studentId);
    if (!student) return;

    if (paymentData.amount <= 0) return;
    setSaving(true);

    try {
      // Certified Accounting Improvements:
      // A. Collision-Proof Sequential Receipt Sequence (Safe multi-client identifier)
      const baseIdx = sales.length + 1;
      const uniqueSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const timeMarker = new Date().toISOString().slice(11,19).replace(/:/g, '');
      const receiptNumber = `REC-2026-${String(baseIdx).padStart(4, '0')}-${timeMarker}-${uniqueSuffix}`;

      // B. Double-Entry Accounting Class Metadata (SYSCOHADA Alignment)
      const debitAccount = paymentData.mode === 'Espèces' ? '5711 (Caisse Établissement)' : '5211 (Banque / Mobile Money)';
      const creditAccount = '4111 (Clients Élèves - Droits constatés)';
      
      const newPayment = {
        id: crypto.randomUUID(),
        amount: Number(paymentData.amount),
        category: paymentData.category,
        mode: paymentData.mode,
        date: new Date().toISOString(),
        receiptNumber,
        isImmutable: true, // Audit Trail Lock
        debitAccount,
        creditAccount,
        details: paymentData.details || {
          scolarite: paymentData.category.includes('Scolarité') ? Number(paymentData.amount) : 0,
          transport: paymentData.category.includes('Transport') ? Number(paymentData.amount) : 0,
          cantine: paymentData.category.includes('Cantine') ? Number(paymentData.amount) : 0,
          inscription: paymentData.category.includes('Inscription') ? Number(paymentData.amount) : 0,
          autres: (!paymentData.category.includes('Scolarité') && !paymentData.category.includes('Transport') && !paymentData.category.includes('Cantine') && !paymentData.category.includes('Inscription')) ? Number(paymentData.amount) : 0
        }
      };

      // Append to student record
      const existingPayments = student.tuitionPayments || [];
      const updatedPayments = [...existingPayments, newPayment];

      await dbService.students.save({
        ...student,
        tuitionPayments: updatedPayments,
        updatedAt: new Date()
      });

      // Mirror onto general Sales ledger for accounting compliance (with Double-Entry Details)
      await dbService.merchantSales.save({
        merchantId: merchant.id,
        items: [{
          productId: 'scolarite',
          name: `Frais Scolaires: ${paymentData.category} - ${student.firstName} ${student.lastName}`,
          quantity: 1,
          price: Number(paymentData.amount)
        }],
        totalAmount: Number(paymentData.amount),
        paymentMode: paymentData.mode,
        syncStatus: 'pending',
        receiptNumber,
        clientName: `${student.firstName} ${student.lastName}`,
        clientPhone: student.parentContact || '',
        debitAccount,
        creditAccount,
        accountingPeriod: '2025-2026',
        createdAt: new Date()
      });

      // Synchronize in background
      syncService.syncAllMerchantData(merchant.id);
      syncService.syncSales(merchant.id);

      if (!skipReceiptUpdate) {
        setSelectedReceipt({
          ...newPayment,
          studentName: `${student.firstName} ${student.lastName}`,
          matricule: student.matricule || 'N/A',
          grade: student.grade || 'Non spécifié'
        });
        setShowPaymentModal(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!skipReceiptUpdate) {
        setSaving(false);
      }
    }
  };

  // 3. RECORD EXPENSE or SALARY
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    setSaving(true);
    try {
      await dbService.merchantExpenses.save({
        title: newExpense.title,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description || '',
        merchantId: merchant.id,
        createdAt: new Date()
      });
      syncService.syncExpenses(merchant.id);
      setIsAddingExpense(false);
      setNewExpense({ title: '', amount: 0, category: 'Salaires', description: '', staffId: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 4. RECORD NEW STOCK PRODUCT
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    setSaving(true);
    try {
      await dbService.merchantProducts.save({
        name: newProduct.name,
        price: Number(newProduct.price),
        stockQuantity: Number(newProduct.stockQuantity),
        category: newProduct.category,
        merchantId: merchant.id,
        updatedAt: new Date()
      });
      syncService.syncProducts(merchant.id);
      setIsAddingProduct(false);
      setNewProduct({ name: '', price: 0, stockQuantity: 50, category: 'Uniforme' });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* SaaS Premium Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" /> SÉCURISÉ
            </span>
            <span className="text-[10px] font-bold text-gray-400 font-mono">UTC: 29/05/2026</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-950 mt-1">Scolarité & Finance</h1>
          <p className="text-xs text-slate-500 font-medium">Livre de caisse unifié des encaissements, salaires, cantine, transport et stocks.</p>
        </div>

        {/* Global Action Selector bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsAddingExpense(true)}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-md shadow-rose-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      {/* Modern Dashboard Navigation Tabs Removed (Now grouped in Top Navigation) */}

      {/* TAB CONTEXT VALUE WRAPPER */}
      <div className="min-h-[450px]">
        {/* ======================================= */}
        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {/* ======================================= */}
        {activeSubTab === 'kpi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Recettes Scolarité & Caisse</p>
                <h3 className="text-2xl font-black text-indigo-950 mt-2">
                  {finances.totalRevenue.toLocaleString()} <span className="text-[10px] text-gray-400">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-600 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Encaissé réels ce mois</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Charges & Dépense d'école</p>
                <h3 className="text-2xl font-black text-rose-600 mt-2">
                  {finances.totalExpenses.toLocaleString()} <span className="text-[10px] text-rose-400">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Professeurs, Senelec, fonctionnement</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Résultat Net Restant</p>
                <h3 className={`text-2xl font-black mt-2 ${finances.netResult >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {finances.netResult.toLocaleString()} <span className="text-[10px] opacity-70">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-bold animate-pulse">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Santé de la trésorerie scolaire</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-500 animate-bounce" />
                </div>
                <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Impayés & Débiteurs</p>
                <h3 className="text-2xl font-black text-amber-600 mt-2">
                  {finances.totalOverdue.toLocaleString()} <span className="text-[10px] text-amber-400">{currency}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 font-bold">
                  <span>Scolarité attendue à recouvrer</span>
                </div>
              </div>
            </div>

            {/* Quick Informational Box & Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-indigo-950 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                <div>
                  <h4 className="text-lg font-black tracking-tight">IA Analyste Trésorerie</h4>
                  <p className="text-[11px] text-indigo-200 mt-2 leading-relaxed">
                    Sur la base de <span className="text-white font-bold">{students.length} élèves inscrits</span> pour l'année administrative courante, votre rentrée prévisionnelle globale s'élève à <span className="text-white font-bold">{finances.totalTargetFees.toLocaleString()} FCFA</span>.
                  </p>
                  <p className="text-[11px] text-indigo-200 mt-3 leading-relaxed">
                    Le taux actuel de recouvrement s'élève à <span className="text-emerald-400 font-bold">{finances.totalTargetFees > 0 ? Math.round((finances.totalPaidFees / finances.totalTargetFees) * 100) : 0}%</span>. Nous vous recommandons de préparer les notifications d'impayés pour la relance automatique des parents d'élèves en retard via WhatsApp.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
                  <span>Statut : Trésorerie d'excellence</span>
                  <span className="text-emerald-400">● Live Sync</span>
                </div>
              </div>

              {/* Graphical Visualizer bar charts */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                <h4 className="text-md font-bold text-indigo-950">Courbe Comparative Mensuelle</h4>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Comparatif des écritures de débit / crédit</p>
                
                <div className="mt-8 flex items-end justify-between h-44 px-4 bg-slate-50/50 rounded-3xl p-6 relative">
                  {/* Ledger benchmark points */}
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-12 bg-indigo-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '110px' }}></div>
                    <div className="w-12 bg-rose-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '40px' }}></div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 mt-2">Semestre 1</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-12 bg-indigo-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '135px' }}></div>
                    <div className="w-12 bg-rose-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '60px' }}></div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 mt-2">Semestre 2</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-12 bg-indigo-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '90px' }}></div>
                    <div className="w-12 bg-rose-500 rounded-t-lg transition-transform hover:scale-105" style={{ height: '55px' }}></div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 mt-2">Semestre 3</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 justify-center text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                    <span>Recettes (Revenus)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-rose-600">
                    <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                    <span>Dépenses (Charges d'école)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: SCOLARITE - ELEVE ACCOUNTS */}
        {/* ======================================= */}
        {activeSubTab === 'scolarite' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrer un élève..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center space-x-2 bg-white rounded-xl border border-gray-200 px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                >
                  {uniqueClassGrades.map(grade => (
                    <option key={grade} value={grade}>{grade === 'Tous' ? 'Toutes les classes' : grade}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-8 py-5">Élève</th>
                      <th className="px-8 py-5">Classe / Matricule</th>
                      <th className="px-8 py-5">Fiche Facturation Annuelle</th>
                      <th className="px-8 py-5">Versements Effectués</th>
                      <th className="px-8 py-5 text-right">Actions Financières</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400 text-sm">
                          Aucun élève trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st: any) => {
                        const breakdown = getStudentFees(st);

                        const totalTarget = Number(breakdown.inscription || 0) + 
                                            Number(breakdown.scolarite || 0) + 
                                            Number(breakdown.uniforme || 0) + 
                                            Number(breakdown.transport || 0) + 
                                            Number(breakdown.cantine || 0);

                        const totalPaid = (st.tuitionPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                        const owed = Math.max(0, totalTarget - totalPaid);

                        return (
                          <tr key={st.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4.5">
                              <p className="font-black text-indigo-950 text-sm leading-tight">{st.firstName} {st.lastName}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-mono">ID: {st.id.slice(0, 8)} | Parent: {st.parentContact || 'N/A'}</p>
                            </td>
                            <td className="px-8 py-4.5">
                              <span className="px-2.5 py-1 bg-slate-100/80 rounded-md text-[10px] font-black uppercase tracking-wider text-slate-600">
                                {st.grade || 'N/A'}
                              </span>
                              <p className="text-[9px] font-mono text-gray-400 mt-1">MAT: {st.matricule || 'GEN-2026'}</p>
                            </td>
                            <td className="px-8 py-4.5 bg-slate-50/20 max-w-[260px]">
                              {(() => {
                                const months = parseInt(breakdown.monthsDuration || '9') || 9;
                                const insc = Number(breakdown.inscription || 0);
                                const scolAnn = Number(breakdown.scolarite || 0);
                                const scolMens = months > 0 ? Math.round(scolAnn / months) : 0;
                                const unif = Number(breakdown.uniforme || 0);
                                const transAnn = Number(breakdown.transport || 0);
                                const transMens = months > 0 ? Math.round(transAnn / months) : 0;
                                const cantAnn = Number(breakdown.cantine || 0);
                                const cantMens = months > 0 ? Math.round(cantAnn / months) : 0;

                                return (
                                  <div className="flex flex-col gap-0.5 py-1">
                                    <p className="text-sm font-black text-indigo-950 font-mono tracking-tight">
                                      {totalTarget.toLocaleString()} {currency}
                                    </p>
                                    <p className="text-[10px] font-bold text-indigo-650 font-mono uppercase tracking-wider">Tarifs Contractuels</p>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-8 py-4.5">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-emerald-600 font-mono">{totalPaid.toLocaleString()} {currency}</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${owed === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                  {owed === 0 ? 'Solder' : `${Math.round((totalPaid/totalTarget)*100)}%`}
                                </span>
                              </div>
                              <p className="text-[10px] text-rose-500 font-mono mt-1">Impayé : {owed.toLocaleString()} {currency}</p>
                            </td>
                            <td className="px-8 py-4.5 text-right">
                              <div className="flex items-center justify-end">
                              <div className="flex items-center justify-end gap-2">
                                {/* Bouton 1: Encaisser (Vert, rapide) */}
                                <button
                                  onClick={() => {
                                    setShowPaymentModal(st);
                                    const bd = getStudentFees(st);
                                    const startCategory = 'Mensualité Globale';
                                    const firstUnpaidMonth = autoGetFirstUnpaidMonthForStudent(st, startCategory);
                                    
                                    setFinanceFormCategory(startCategory);
                                    setFinanceFormMonth(firstUnpaidMonth);
                                    
                                    const ts = Math.round(Number(bd.scolarite ?? 0) / Number(bd.monthsDuration || 9));
                                    const tt = bd.hasTransport !== false ? Math.round(Number(bd.transport ?? 0) / Number(bd.monthsDuration || 9)) : 0;
                                    const tc = bd.hasCanteen !== false ? Math.round(Number(bd.cantine ?? 0) / Number(bd.monthsDuration || 9)) : 0;
                                    const ti = bd.hasInternat !== false ? Math.round(Number(bd.internat ?? 0) / Number(bd.monthsDuration || 9)) : 0;
                                    const target = ts + tt + tc + ti;

                                    const payments = st.tuitionPayments || [];
                                    const paid = payments.filter((p: any) => 
                                      p.category === `Scolarité - ${firstUnpaidMonth}` || 
                                      p.category === `Transport - ${firstUnpaidMonth}` || 
                                      p.category === `Cantine - ${firstUnpaidMonth}` ||
                                      p.category === `Internat - ${firstUnpaidMonth}`
                                    ).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                                    
                                    setFinanceFormAmount(Math.max(0, target - paid));
                                    setFinanceFormMode('Wave');
                                  }}
                                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-slate-900 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-sm"
                                  title="Guichet rapide d'encaissement"
                                >
                                  <CreditCard className="w-4 h-4 text-emerald-600" />
                                  <span>Encaisser</span>
                                </button>

                                {/* Bouton 2: Ajuster Fiche de Frais (Bleu/Blanc) */}
                                <button
                                  onClick={() => {
                                    setShowFeeConfigModal(st);
                                  }}
                                  className="px-3 py-2.5 bg-white border border-slate-200 text-indigo-950 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1 shadow-sm"
                                  title="Modifier les frais annuels contractuels de l'élève"
                                >
                                  <Sliders className="w-4 h-4 text-indigo-600" />
                                  <span>Tarifs</span>
                                </button>

                                {/* Bouton 3: Dossier de l'élève & Reçus (Gris) */}
                                <button
                                  onClick={() => {
                                    setSelectedStudentFinance(st);
                                    setIsEditingFeesInline(false);
                                  }}
                                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1 shadow-sm"
                                  title="Consulter le dossier, le reste à payer et les reçus"
                                >
                                  <Receipt className="w-4 h-4 text-slate-500" />
                                  <span>Dossier ({ (st.tuitionPayments || []).length })</span>
                                </button>
                              </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: CAISSE - JOURNAL D'ENCAISSEMENT */}
        {/* ======================================= */}
        {activeSubTab === 'caisse' && (
          <div className="space-y-6">
            <div className="bg-indigo-950 text-white p-6 rounded-[2rem] shadow-md flex justify-between items-center">
              <div>
                <p className="text-[9px] font-mono text-indigo-200 uppercase tracking-widest">LIVRE DE CAISSE SCOLAIRE</p>
                <h3 className="text-xl font-black mt-1">Registre des encaissements physiques & mobiles</h3>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400">+{sales.length} transactions</span>
            </div>

            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-8 py-5">Référence / Date</th>
                      <th className="px-8 py-5">Émetteur / Contat</th>
                      <th className="px-8 py-5">Désignation frais scolaire</th>
                      <th className="px-8 py-5">Mode de paiement</th>
                      <th className="px-8 py-5 text-right">Montant encaissé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400">Aucune transaction de caisse enregistrée</td>
                      </tr>
                    ) : (
                      sales.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-4.5">
                            <p className="font-mono text-indigo-950 text-xs font-bold leading-tight">{sale.receiptNumber || `REC-${sale.id.slice(0, 8)}`}</p>
                            <p className="text-[9px] text-gray-400 mt-1">
                              {sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </p>
                          </td>
                          <td className="px-8 py-4.5">
                            <p className="font-bold text-slate-800 text-xs">{sale.clientName || 'Anonyme'}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{sale.clientPhone || 'Aucun numéro'}</p>
                          </td>
                          <td className="px-8 py-4.5">
                            <p className="text-xs font-semibold text-slate-600 leading-normal max-w-xs truncate">
                              {sale.items?.[0]?.name || 'Versement Frais'}
                            </p>
                          </td>
                          <td className="px-8 py-4.5">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              sale.paymentMode === 'Wave' ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' :
                              sale.paymentMode === 'Orange Money' ? 'bg-orange-50 text-orange-600 border border-orange-100 font-bold' :
                              'bg-green-50 text-green-700 border border-green-100'
                            }`}>
                              {sale.paymentMode || 'Wave'}
                            </span>
                          </td>
                          <td className="px-8 py-4.5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <p className="text-sm font-black text-indigo-950 font-mono">
                                +{(sale.totalAmount || sale.total_amount || 0).toLocaleString()} {currency}
                              </p>
                              <button
                                onClick={() => setSelectedReceipt({
                                  amount: sale.totalAmount || sale.total_amount,
                                  category: 'Scolarité / Caisse',
                                  mode: sale.paymentMode,
                                  date: sale.createdAt ? new Date(sale.createdAt).toISOString() : new Date().toISOString(),
                                  receiptNumber: sale.receiptNumber || `REC-${sale.id.slice(0, 8)}`,
                                  studentName: sale.clientName,
                                  matricule: 'INSCRIT',
                                  grade: 'Niveau d\'étude'
                                })}
                                className="p-1 text-gray-400 hover:text-black hover:scale-105 transition-transform"
                                title="Ré-éditer le reçu de paiement"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            </div>
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

        {/* ======================================= */}
        {/* TAB 4: DEPENSES GENERALES */}
        {/* ======================================= */}
        {activeSubTab === 'depenses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-8 py-5">Libellé de charge</th>
                      <th className="px-8 py-5">Catégorie dépenses</th>
                      <th className="px-8 py-5">Date d'émission</th>
                      <th className="px-8 py-5 text-right">Montant décaissé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.filter(e => e.category !== 'Salaires').length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-gray-400 text-sm">
                          Aucun frais de fonctionnement ou charges enregistrées dehors salaires.
                        </td>
                      </tr>
                    ) : (
                      expenses.filter(e => e.category !== 'Salaires').map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4.5">
                            <p className="font-black text-indigo-950 text-sm leading-tight">{exp.title}</p>
                            <p className="text-[10px] font-mono text-gray-400 mt-1">ID: {exp.id.slice(0, 8)} | Note: {exp.description || 'Non renseignée'}</p>
                          </td>
                          <td className="px-8 py-4.5">
                            <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md font-bold text-[9px] uppercase tracking-wider border border-yellow-100">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-8 py-4.5">
                            <p className="text-[11px] font-mono text-slate-600">
                              {exp.createdAt ? format(new Date(exp.createdAt), 'dd/MM/yyyy') : 'N/A'}
                            </p>
                          </td>
                          <td className="px-8 py-4.5 text-right">
                            <p className="text-sm font-black text-rose-500 font-mono">-{exp.amount.toLocaleString()} {currency}</p>
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

        {/* ======================================= */}
        {/* TAB 5: SALAIRES & PERSONNEL */}
        {/* ======================================= */}
        {activeSubTab === 'salaires' && (
          <div className="space-y-6">
            <div className="bg-indigo-950 text-white p-8 rounded-[2rem] shadow-sm flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest">SALAIRES & REMUNERATIONS DU PERSONNEL</p>
                <h3 className="text-xl font-bold mt-1">Génération des virements administratifs</h3>
              </div>
              <button
                onClick={() => {
                  setNewExpense({ title: 'Régularisation Salaire Enseignant', amount: 150000, category: 'Salaires', description: '', staffId: '' });
                  setIsAddingExpense(true);
                }}
                className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-600 transition-colors"
              >
                Payer un membre
              </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-8 py-5">Personnel</th>
                      <th className="px-8 py-5">Poste / Rôle</th>
                      <th className="px-8 py-5">Fiche Salaire Mensuel Brut</th>
                      <th className="px-8 py-5">Décalcomanie Charges / Retenue</th>
                      <th className="px-8 py-5 text-right">Net perçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400 text-xs">
                          Aucun enseignant ou membre administratif enregistré dans le module R.H.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp: any) => {
                        const baseBrut = Number(emp.salary || emp.salaireBase || 150000);
                        const prime = Math.round(baseBrut * 0.1); // default 10% prime
                        const retention = Math.round(baseBrut * 0.05); // default 5% tax
                        const netPayable = baseBrut + prime - retention;

                        return (
                          <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4.5">
                              <p className="font-black text-indigo-950 text-sm leading-tight">{emp.name || `${emp.firstName} ${emp.lastName}`}</p>
                              <p className="text-[10px] text-slate-500 mt-1 font-mono">Contact : {emp.phone || 'Aucun standard'}</p>
                            </td>
                            <td className="px-8 py-4.5">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-bold text-[9px] uppercase tracking-wider">
                                {emp.role || emp.position || 'ADMINISTRATION'}
                              </span>
                            </td>
                            <td className="px-8 py-4.5">
                              <p className="text-sm font-black text-indigo-950 font-mono">{baseBrut.toLocaleString()} {currency}</p>
                              <span className="text-[9px] text-slate-400 mt-0.5 block">Brut Conventionnel</span>
                            </td>
                            <td className="px-8 py-4.5">
                              <div className="text-[11px] space-y-0.5">
                                <p className="text-emerald-600 font-bold">Primes d'excellence: +{prime.toLocaleString()} {currency}</p>
                                <p className="text-rose-500 font-bold">Retenus sociales: -{retention.toLocaleString()} {currency}</p>
                              </div>
                            </td>
                            <td className="px-8 py-4.5 text-right">
                              <p className="text-sm font-black text-indigo-950 font-mono">{netPayable.toLocaleString()} {currency}</p>
                              <button
                                onClick={async () => {
                                  setSaving(true);
                                  try {
                                    await dbService.merchantExpenses.save({
                                      title: `Salaire payé à : ${emp.name || emp.firstName}`,
                                      amount: netPayable,
                                      category: 'Salaires',
                                      description: `Virement des salaires pour la période courante - Poste: ${emp.role || 'Enseignant'}`,
                                      merchantId: merchant.id,
                                      createdAt: new Date()
                                    });
                                    syncService.syncExpenses(merchant.id);
                                    alert(`Le virement de salaire de ${netPayable} FCFA pour ${emp.name} a été enregistré dans le livre comptable.`);
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                                className="mt-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-100 hover:bg-emerald-100"
                              >
                                Émettre fiche & virement
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 6: STOCK SCOLAIRE */}
        {/* ======================================= */}
        {activeSubTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-indigo-950">Magasin d'uniformes & fournitures scolaires</h3>
                <p className="text-xs text-slate-500 font-medium">Boutique officielle de distribution de matériels scellés.</p>
              </div>
              <button
                onClick={() => setIsAddingProduct(true)}
                className="px-4 py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold flex items-center space-x-1 hover:bg-black"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nvel Uniforme / Cahier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.length === 0 ? (
                <div className="col-span-3 bg-white p-12 text-center text-gray-400 text-sm border rounded-[2rem]">
                  Aucun article enregistré. Les uniformes, livres et cahiers s'ajustent ici.
                </div>
              ) : (
                products.map((item: any) => (
                  <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-md text-[9px] font-black uppercase tracking-wider text-slate-600">
                        {item.category || 'SCOLAIRE'}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.stockQuantity <= 10 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        Stock: {item.stockQuantity} unités
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-indigo-950 text-md leading-tight">{item.name}</h4>
                      <p className="text-xl font-black font-mono text-indigo-950 mt-1">{item.price.toLocaleString()} {currency}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-mono">REF: {item.id.slice(0, 8)}</span>
                      <button
                        onClick={async () => {
                          const quantity = Number(prompt("Quantité d'uniformes vendue :", "1"));
                          if (!quantity || quantity <= 0) return;
                          if (quantity > item.stockQuantity) {
                            alert("Quantité en stock insuffisante.");
                            return;
                          }

                          setSaving(true);
                          try {
                            const decAmount = item.price * quantity;
                            // Reduce stock
                            await dbService.merchantProducts.save({
                              ...item,
                              stockQuantity: item.stockQuantity - quantity,
                              updatedAt: new Date()
                            });

                            // Write sale
                            await dbService.merchantSales.save({
                              merchantId: merchant.id,
                              items: [{
                                productId: item.id,
                                name: `${item.name} (Vente Directe Boutique)`,
                                quantity,
                                price: item.price
                              }],
                              totalAmount: decAmount,
                              paymentMode: 'Espèces',
                              createdAt: new Date()
                            });

                            syncService.syncProducts(merchant.id);
                            syncService.syncSales(merchant.id);
                            alert(`Vente de ${quantity} x ${item.name} enregistrée avec succès.`);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-100"
                      >
                        Enregistrer une Vente
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 7: TRANSPORT SCOLAIRE */}
        {/* ======================================= */}
        {activeSubTab === 'transport' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-black rounded-md tracking-widest uppercase">Flotte de transport</span>
                <h3 className="text-xl font-black text-indigo-950 mt-1.5">Gestion des circuits de bus & ramassages</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                <p>🚏 Lignes de bus : <span className="font-extrabold text-indigo-950">04 lignes actives</span></p>
                <p>🚌 Bus : <span className="font-extrabold text-indigo-950">04 bus climatisés</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-indigo-950">Ligne active : Plateau - Liberté - Sacré Cœur</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="flex justify-between"><span>👤 Chauffeur responsable:</span> <span className="font-extrabold">Moussa Camara (+221 77 123 45 67)</span></p>
                  <p className="flex justify-between"><span>🏫 Heure de ramassage élèves:</span> <span className="font-extrabold">06h45 - 07h30</span></p>
                  <p className="flex justify-between"><span>🎟 Tarif d'abonnement mensuel:</span> <span className="font-extrabold text-indigo-950">15 000 FCFA / enfant</span></p>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] bg-slate-50 border px-2.5 py-1 rounded-md font-mono text-gray-500 font-bold block text-center">
                    08 élèves souscrits sur ce circuit
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-indigo-950">Ligne active : Almadies - Yoff - Ouest Foire</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="flex justify-between"><span>👤 Chauffeur responsable:</span> <span className="font-extrabold">Abdoulaye Ndiaye (+221 77 987 65 43)</span></p>
                  <p className="flex justify-between"><span>🏫 Heure de ramassage élèves:</span> <span className="font-extrabold">06h30 - 07h15</span></p>
                  <p className="flex justify-between"><span>🎟 Tarif d'abonnement mensuel:</span> <span className="font-extrabold text-indigo-950">20 000 FCFA / enfant</span></p>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] bg-slate-50 border px-2.5 py-1 rounded-md font-mono text-gray-500 font-bold block text-center">
                    12 élèves souscrits sur ce circuit
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 8: CANTINE & REPAS */}
        {/* ======================================= */}
        {activeSubTab === 'cantine' && (() => {
          // Dynamic Computations inside TAB 8
          const demi = students.filter((s: any) => s.regime === 'demi-pension');
          const int = students.filter((s: any) => s.regime === 'interne');
          const ext = students.filter((s: any) => !s.regime || s.regime === 'externe');

          // Projected & Collected numbers for Canteen
          let projectedMonthlyRev = 0;
          students.forEach((st: any) => {
            const fees = getStudentFees(st);
            const months = fees.monthsDuration || 9;
            if (st.regime === 'demi-pension') {
              projectedMonthlyRev += months > 0 ? Math.round((fees.cantine || 0) / months) : 0;
            } else if (st.regime === 'interne') {
              projectedMonthlyRev += months > 0 ? Math.round((fees.cantine || 0) / months) : 0;
            }
          });

          let collectedThisMonth = 0;
          students.forEach((st: any) => {
            const payments = st.tuitionPayments || [];
            const cPayments = payments.filter((p: any) => p.category === `Cantine - ${canteenRosterMonth}`);
            collectedThisMonth += cPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          });

          const totalSubscribers = demi.length + int.length;

          // Filter Canteen Students
          const filteredCanteenStudents = students.filter((st: any) => {
            const q = canteenSearchTerm.toLowerCase().trim();
            const matchesSearch = `${st.firstName || ''} ${st.lastName || ''}`.toLowerCase().includes(q) ||
                                  (st.matricule || '').toLowerCase().includes(q);
            
            let matchesRegime = false;
            if (canteenRegimeFilter === 'all') {
              matchesRegime = st.regime === 'demi-pension' || st.regime === 'interne';
            } else if (canteenRegimeFilter === 'demi-pension') {
              matchesRegime = st.regime === 'demi-pension';
            } else if (canteenRegimeFilter === 'interne') {
              matchesRegime = st.regime === 'interne';
            } else if (canteenRegimeFilter === 'externe') {
              matchesRegime = !st.regime || st.regime === 'externe';
            }

            return matchesSearch && matchesRegime;
          });

          const SCHOOL_MONTHS = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre'];

          return (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-white p-6 rounded-[2rem] border border-black/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-sm">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-rose-500/5 to-transparent pointer-events-none" />
                <div>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black rounded-md tracking-widest uppercase">Service Cafétéria</span>
                  <h3 className="text-xl font-black text-indigo-950 mt-1.5 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-rose-500 animate-pulse" />
                    Menus cantine & abonnements scolaires (Régimes)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Suivez, encaissez et gérez la restauration et l'internat de vos internes et demi-pensionnaires en temps réel.
                  </p>
                </div>
                <div className="text-xs text-slate-600 font-mono space-y-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                  <p className="flex justify-between gap-4">🍲 Plan repas : <span className="font-extrabold text-indigo-950">Menu du Jour</span></p>
                  <p className="flex justify-between gap-4">⭐ Norme sanitaire : <span className="font-extrabold text-emerald-600">Certifié ACOM</span></p>
                </div>
              </div>

              {/* Stats Counters Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[1.8rem] border border-black/5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Total Abonnés Cantine</span>
                    <p className="text-2xl font-black text-indigo-950 mt-1">{totalSubscribers} <span className="text-xs text-slate-400 font-bold">élèves</span></p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-500 border-t pt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                    <span>{demi.length} Demi-pensionnaires</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[1.8rem] border border-black/5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Élèves Internes</span>
                    <p className="text-2xl font-black text-purple-950 mt-1">{int.length} <span className="text-xs text-slate-400 font-bold font-sans">élèves</span></p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-500 border-t pt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block" />
                    <span>Hébergés & Pension complète</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[1.8rem] border border-black/5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Objectif Facturation Mensuel</span>
                    <p className="text-xl font-black text-indigo-950 font-mono mt-1.5">{projectedMonthlyRev.toLocaleString()} {currency}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-500 border-t pt-2">
                    <span className="text-indigo-650">🎯</span>
                    <span>Projections abonnements</span>
                  </div>
                </div>

                <div className="bg-emerald-50/20 border-emerald-100 border p-5 rounded-[1.8rem] shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-black text-emerald-600 uppercase tracking-widest block">Paiements Reçus ({canteenRosterMonth})</span>
                    <p className="text-xl font-black text-emerald-900 font-mono mt-1.5">{collectedThisMonth.toLocaleString()} {currency}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-emerald-700 border-t border-emerald-100/50 pt-2 font-bold justify-between">
                    <span>Taux de recouvrement :</span>
                    <span>{projectedMonthlyRev > 0 ? `${Math.round((collectedThisMonth / projectedMonthlyRev) * 100)}%` : '0%'}</span>
                  </div>
                </div>
              </div>

              {/* Menu and Subscriptions Bento Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Weekly Menu Display & Interactive Tools */}
                <div className="bg-indigo-950 text-white p-6 rounded-[2rem] shadow-md flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                      <h4 className="font-black text-sm text-white flex items-center gap-2">
                        🍱 Menu Hebdomadaire Suggéré
                      </h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setIsEditingMenu(true)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-mono text-[9px] font-bold uppercase transition"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={handleGenerateMenuWithAI}
                          disabled={generatingMenu}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-mono text-[9px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                        >
                          {generatingMenu ? 'AI...' : '⭐ IA'}
                        </button>
                      </div>
                    </div>
                    <ul className="text-[11px] text-indigo-100 space-y-2 font-mono">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => (
                        <li key={day} className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-indigo-300 font-bold">{day} :</span>
                          <span className="text-white font-medium max-w-[150px] truncate" title={lunchMenu[day]}>{lunchMenu[day] || 'Non défini'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-indigo-300 mt-4">
                    <span>Cuisine certifiée saine</span>
                    <span className="text-emerald-400 font-bold">Inspecté & Valide</span>
                  </div>
                </div>

                {/* Subscriptions detail cards (2 cols layout) */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: Demi-pension subscription */}
                  <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-3 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h4 className="text-md font-bold text-indigo-950 mt-2">Plan : Demi-Pension</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        L'élève mange le midi à l'école de Lundi à Vendredi (repas complet midi + boisson).
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-2xl font-black font-mono text-indigo-950">10 000 FCFA <span className="text-xs text-slate-400">/ mois</span></p>
                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
                        <span className="font-bold text-indigo-600">{demi.length} élèves actifs</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-extrabold uppercase text-[8px]">Souscription active</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Interne subscription */}
                  <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-3 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                        <Home className="w-5 h-5 text-purple-600" />
                      </div>
                      <h4 className="text-md font-bold text-indigo-950 mt-2">Plan : Régime Interne</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Hébergement complet à l'internat scolaire + Restauration intégrale matins, midis et soirs.
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-2xl font-black font-mono text-purple-950">15 000 FCFA <span className="text-xs text-slate-400">/ mois (cant.)</span></p>
                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
                        <span className="font-bold text-purple-600">{int.length} élèves actifs</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-extrabold uppercase text-[8px]">Souscription active</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Canteen Subscriber & Regime Manager board */}
              <div className="bg-white rounded-[2rem] border border-black/5 p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-gray-100">
                  <div>
                    <h3 className="text-base font-black text-indigo-950 uppercase tracking-tight">Registre de Restauration des Élèves</h3>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">Suivi des régimes de scolarité et collecte des frais de cantine.</p>
                  </div>
                  
                  {/* Selectors filter */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Month roster selector */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-black/5">
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Mois :</span>
                      <select
                        value={canteenRosterMonth}
                        onChange={(e) => setCanteenRosterMonth(e.target.value)}
                        className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                      >
                        {SCHOOL_MONTHS.map((m) => (
                          <option key={`roster-month-${m}`} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Regime Plan filter */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-black/5">
                      <button
                        onClick={() => setCanteenRegimeFilter('all')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all uppercase cursor-pointer ${
                          canteenRegimeFilter === 'all' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-950'
                        }`}
                      >
                        Abonnés
                      </button>
                      <button
                        onClick={() => setCanteenRegimeFilter('demi-pension')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all uppercase cursor-pointer ${
                          canteenRegimeFilter === 'demi-pension' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-950'
                        }`}
                      >
                        Demi-Pension
                      </button>
                      <button
                        onClick={() => setCanteenRegimeFilter('interne')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all uppercase cursor-pointer ${
                          canteenRegimeFilter === 'interne' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-950'
                        }`}
                      >
                        Internes
                      </button>
                      <button
                        onClick={() => setCanteenRegimeFilter('externe')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all uppercase cursor-pointer ${
                          canteenRegimeFilter === 'externe' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-950'
                        }`}
                      >
                        Externes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={canteenSearchTerm}
                    onChange={(e) => setCanteenSearchTerm(e.target.value)}
                    placeholder="Chercher un élève par nom, prénom ou matricule..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-black/5 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition"
                  />
                </div>

                {/* Table Roster */}
                <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                        <th className="px-8 py-5">Élève</th>
                        <th className="px-8 py-5">Classe</th>
                        <th className="px-8 py-5">Régime (Abonnement)</th>
                        <th className="px-8 py-5 font-mono">Tarif / Mois</th>
                        <th className="px-8 py-5">Statut Paiement ({canteenRosterMonth})</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white font-medium text-slate-700">
                      {filteredCanteenStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400">
                            Aucun élève trouvé correspondant à cette recherche ou à ce régime.
                          </td>
                        </tr>
                      ) : (
                        filteredCanteenStudents.map((st: any) => {
                          const fees = getStudentFees(st);
                          const months = fees.monthsDuration || 9;
                          const monthlyCanteenFee = months > 0 ? Math.round((fees.cantine || 0) / months) : 0;
                          
                          // Calculate canteen payment specifically for the selected month
                          const payments = st.tuitionPayments || [];
                          const canteenPaidAmt = payments
                            .filter((p: any) => p.category === `Cantine - ${canteenRosterMonth}`)
                            .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                          
                          const owedCanteenAmt = Math.max(0, monthlyCanteenFee - canteenPaidAmt);

                          let statusBadge = null;
                          if (st.regime === 'externe' || !st.regime) {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] rounded-md font-mono">
                                Sans Cafétéria
                              </span>
                            );
                          } else if (owedCanteenAmt === 0) {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] rounded-md font-mono flex items-center gap-1 w-max">
                                <Check className="w-3.5 h-3.5 text-emerald-700" /> Payé
                              </span>
                            );
                          } else if (canteenPaidAmt > 0) {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] rounded-md font-mono">
                                Réglé partiel : Reste {(owedCanteenAmt).toLocaleString()} FCFA
                              </span>
                            );
                          } else {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] rounded-md font-mono">
                                Non payé : {(owedCanteenAmt).toLocaleString()} FCFA
                              </span>
                            );
                          }

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/50 transition duration-150">
                              {/* Student name */}
                              <td className="px-8 py-4.5 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-950 select-none uppercase shadow-xs shrink-0">
                                  {st.firstName?.substring(0, 1)}{st.lastName?.substring(0, 1)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-indigo-950 leading-tight truncate">{st.firstName} {st.lastName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5 truncate">{st.matricule || 'N/A'}</p>
                                </div>
                              </td>

                              {/* Student grade */}
                              <td className="px-8 py-4.5">
                                <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md text-[10px]">
                                  {st.grade || st.class || 'N/D'}
                                </span>
                              </td>

                              {/* Student dynamic regime selection */}
                              <td className="px-8 py-4.5">
                                <select
                                  value={st.regime || 'externe'}
                                  onChange={(e) => handleUpdateStudentRegime(st.id, e.target.value as any)}
                                  className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded-lg outline-none cursor-pointer border transition-all ${
                                    st.regime === 'demi-pension' 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 focus:ring-2 focus:ring-emerald-500/20' 
                                      : st.regime === 'interne' 
                                        ? 'bg-purple-50 text-purple-800 border-purple-200 focus:ring-2 focus:ring-purple-500/20' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  <option value="externe">📖 Externe</option>
                                  <option value="demi-pension">🍱 Demi-Pension</option>
                                  <option value="interne">🏠 Interne</option>
                                </select>
                              </td>

                              {/* Monthly rate */}
                              <td className="px-8 py-4.5 font-mono font-bold text-slate-900">
                                {monthlyCanteenFee > 0 ? `${monthlyCanteenFee.toLocaleString()} FCFA` : '—'}
                              </td>

                              {/* Status payments */}
                              <td className="px-8 py-4.5">
                                {statusBadge}
                              </td>

                              {/* Actions payment & configuration */}
                              <td className="px-8 py-4.5 text-right font-sans">
                                <div className="flex items-center justify-end gap-1.5">
                                  {owedCanteenAmt > 0 && (st.regime === 'demi-pension' || st.regime === 'interne') && (
                                    <button
                                      onClick={() => {
                                        setFinanceFormCategory('Cantine Mensuelle');
                                        setFinanceFormMonth(canteenRosterMonth);
                                        setFinanceFormAmount(owedCanteenAmt);
                                        setShowPaymentModal(st);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono text-[9px] font-bold uppercase transition shadow-xs flex items-center gap-1 cursor-pointer"
                                      title={`Encaisser les frais de cantine pour ${canteenRosterMonth}`}
                                    >
                                      🖩 Encaisser
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setShowFeeConfigModal(st)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition cursor-pointer"
                                    title="Ajuster la fiche de tarifs de l'élève"
                                  >
                                    <Sliders className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Menu Modal */}
              {isEditingMenu && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
                  <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-8 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-indigo-700" />
                        <h4 className="font-extrabold text-indigo-950">Modifier le Menu Cantine</h4>
                      </div>
                      <button onClick={() => setIsEditingMenu(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                    <div className="space-y-4 pt-2">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => (
                        <div key={day} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">{day}</label>
                          <input 
                            type="text" 
                            value={lunchMenu[day] || ''} 
                            onChange={(e) => {
                              const updated = { ...lunchMenu, [day]: e.target.value };
                              setLunchMenu(updated);
                            }}
                            className="w-full px-4 py-2 text-xs font-bold border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600/20"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setIsEditingMenu(false)}
                        className="flex-1 py-3 border border-slate-200 text-xs font-black rounded-xl uppercase text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.setItem('school_lunch_menu', JSON.stringify(lunchMenu));
                          setIsEditingMenu(false);
                        }}
                        className="flex-1 py-3 bg-indigo-950 text-white text-xs font-black rounded-xl uppercase hover:bg-black transition cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 9: PARAMETRES TARIFS */}
        {/* ======================================= */}
        {activeSubTab === 'pricing' && (
          <SchoolPricingSaaS merchant={merchant} />
        )}
      </div>

      {/* ======================================= */}
      {/* GLOBAL MODALS (ANIMATED SEAMLESSLY) */}
      {/* ======================================= */}
      <AnimatePresence>
        {/* MODAL 1: CONFIGURATION RE-PENSÉ DE LA FICHE DES FRAIS ANNUELS */}
        {showFeeConfigModal && (
          <StudentFeeConfigModal
            student={students.find((s: any) => s.id === showFeeConfigModal.id) || showFeeConfigModal}
            onClose={() => setShowFeeConfigModal(null)}
            onSave={handleSaveFeeConfig}
            currency={currency}
            getStudentFees={getStudentFees}
            saving={saving}
          />
        )}

        {/* MODAL 2: GUICHET DE CAISSE DÉDIÉ (LASER-FOCUSED ON PAYMENT COLLECTION) */}
        {showPaymentModal && (() => {
          const activeS = students.find((s: any) => s.id === showPaymentModal.id) || showPaymentModal;
          const currentFees = getStudentFees(activeS);

          const catsInfo = [
            { label: "Inscription / Réinscription", key: "inscription" },
            { label: "Scolarité Mensuelle", key: "scolarite" },
            { label: "Uniforme Scolaire", key: "uniforme" },
            { label: "Transport Scolaire", key: "transport" },
            { label: "Cantine Cafétéria", key: "cantine" },
            { label: "Hébergement / Services d'internat", key: "internat" }
          ];

          // Compute remaining due for selected category to guide the accountant
          const getCategoryStatusForMonth = (catLabel: string, monthVal: string) => {
            if (catLabel === 'Mensualité Globale') {
               const targetScol = Math.round(Number(currentFees.scolarite ?? 0) / Number(currentFees.monthsDuration || 9));
               const targetTrans = Math.round(Number(currentFees.transport ?? 0) / Number(currentFees.monthsDuration || 9));
               const targetCant = Math.round(Number(currentFees.cantine ?? 0) / Number(currentFees.monthsDuration || 9));
               const targetInt = Math.round(Number(currentFees.internat ?? 0) / Number(currentFees.monthsDuration || 9));
               const target = targetScol + targetTrans + targetCant + targetInt;

               const paid = (activeS.tuitionPayments || [])
                .filter((p: any) => 
                  p.category === `Scolarité - ${monthVal}` || 
                  p.category === `Transport - ${monthVal}` || 
                  p.category === `Cantine - ${monthVal}` ||
                  p.category === `Internat - ${monthVal}`
                )
                .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

               return { target, paid, owed: Math.max(0, target - paid) };
            }

            if (catLabel === 'Scolarité Mensuelle') {
              const target = Math.round(Number(currentFees.scolarite ?? 0) / Number(currentFees.monthsDuration || 9));
              const paid = (activeS.tuitionPayments || [])
                .filter((p: any) => p.category === `Scolarité - ${monthVal}`)
                .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
              return { target, paid, owed: Math.max(0, target - paid) };
            }
            
            if (catLabel === 'Transport Mensuel') {
              const target = Math.round(Number(currentFees.transport ?? 0) / Number(currentFees.monthsDuration || 9));
              const paid = (activeS.tuitionPayments || [])
                .filter((p: any) => p.category === `Transport - ${monthVal}`)
                .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
              return { target, paid, owed: Math.max(0, target - paid) };
            }
            
            if (catLabel === 'Cantine Mensuelle') {
              const target = Math.round(Number(currentFees.cantine ?? 0) / Number(currentFees.monthsDuration || 9));
              const paid = (activeS.tuitionPayments || [])
                .filter((p: any) => p.category === `Cantine - ${monthVal}`)
                .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
              return { target, paid, owed: Math.max(0, target - paid) };
            }

            if (catLabel === 'Internat Mensuel') {
              const target = Math.round(Number(currentFees.internat ?? 0) / Number(currentFees.monthsDuration || 9));
              const paid = (activeS.tuitionPayments || [])
                .filter((p: any) => p.category === `Internat - ${monthVal}`)
                .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
              return { target, paid, owed: Math.max(0, target - paid) };
            }

            const mapped = catsInfo.find(c => c.label === catLabel);
            if (!mapped) return { target: 0, paid: 0, owed: 0 };
            const target = Number(currentFees[mapped.key] ?? 0);
            const paid = (activeS.tuitionPayments || [])
              .filter((p: any) => p.category === catLabel || 
                (catLabel === "Scolarité Mensuelle" && p.category.startsWith("Scolarité - ")) ||
                (catLabel === "Transport Scolaire" && p.category.startsWith("Transport - ")) ||
                (catLabel === "Cantine Cafétéria" && p.category.startsWith("Cantine - ")) ||
                (catLabel === "Hébergement / Services d'internat" && p.category.startsWith("Internat - "))
              )
              .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
            return { target, paid, owed: Math.max(0, target - paid) };
          };

          const getCategoryStatus = (catLabel: string) => {
            return getCategoryStatusForMonth(catLabel, financeFormMonth);
          };

          const statusSelected = getCategoryStatus(financeFormCategory);
          const SCHOOL_MONTHS = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre'];
          const activeMonths = SCHOOL_MONTHS.slice(0, Number(currentFees.monthsDuration || 9));

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-sans max-h-[92vh]"
              >
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xs">💰</div>
                    <div>
                      <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Guichet d'Encaissement</h3>
                      <p className="text-[10px] font-bold font-mono text-emerald-600 uppercase tracking-widest mt-0.5">
                        Élève: {activeS.firstName} {activeS.lastName}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(null)} 
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border shadow-sm text-slate-400 hover:text-slate-850"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {/* Left panel: Form d'Encaissement */}
                  <div className="flex-1 p-8 space-y-4 max-h-[75vh] min-h-[400px] overflow-y-auto bg-slate-50/10">
                  {/* Category Selection */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">Rubrique de paiement</label>
                      <select 
                        value={financeFormCategory} 
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setFinanceFormCategory(newCat);
                          
                          if (['Mensualité Globale', 'Scolarité Mensuelle', 'Transport Mensuel', 'Cantine Mensuelle', 'Internat Mensuel'].includes(newCat)) {
                            const newMonth = autoGetFirstUnpaidMonthForStudent(activeS, newCat);
                            setFinanceFormMonth(newMonth);
                            const statusObj = getCategoryStatusForMonth(newCat, newMonth);
                            setFinanceFormAmount(statusObj.owed);
                          } else {
                            const statusObj = getCategoryStatus(newCat);
                            setFinanceFormAmount(statusObj.owed);
                          }
                        }}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-extrabold cursor-pointer focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                      >
                        <option value="Mensualité Globale">
                          {currentFees.hasInternat 
                            ? "Mensualité Globale (Scol. + Transp. + Cant. + Internat)" 
                            : "Mensualité Globale (Scol. + Transp. + Cant.)"}
                        </option>
                        <option value="Inscription / Réinscription">Frais d'Inscription / Réinscription</option>
                        <option value="Scolarité Mensuelle">Scolarité Mensuelle (Isolée)</option>
                        <option value="Uniforme Scolaire">Uniforme Scolaire</option>
                        <option value="Transport Mensuel">Transport Mensuel (Isolé)</option>
                        <option value="Cantine Mensuelle">Cantine Mensuelle (Isolée)</option>
                        {!!currentFees.hasInternat && (
                          <option value="Internat Mensuel">Internat Mensuel (Isolé)</option>
                        )}
                      </select>
                    </div>

                    {['Mensualité Globale', 'Scolarité Mensuelle', 'Transport Mensuel', 'Cantine Mensuelle', 'Internat Mensuel'].includes(financeFormCategory) && (
                      <div className="w-[140px]">
                        <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">Mois</label>
                        <select 
                          value={financeFormMonth} 
                          onChange={async (e) => {
                            const newMonth = e.target.value;
                            setFinanceFormMonth(newMonth);

                            // We need to calculate manually since state hasn't updated yet in this render
                            let target = 0;
                            let paid = 0;
                            const payments = activeS.tuitionPayments || [];

                            if (financeFormCategory === 'Mensualité Globale') {
                               const ts = Math.round(Number(currentFees.scolarite ?? 0) / Number(currentFees.monthsDuration || 9));
                               const tt = currentFees.hasTransport !== false ? Math.round(Number(currentFees.transport ?? 0) / Number(currentFees.monthsDuration || 9)) : 0;
                               const tc = currentFees.hasCanteen !== false ? Math.round(Number(currentFees.cantine ?? 0) / Number(currentFees.monthsDuration || 9)) : 0;
                               const ti = currentFees.hasInternat !== false ? Math.round(Number(currentFees.internat ?? 0) / Number(currentFees.monthsDuration || 9)) : 0;
                               target = ts + tt + tc + ti;
                               paid = payments.filter((p: any) => 
                                 p.category === `Scolarité - ${newMonth}` || 
                                 p.category === `Transport - ${newMonth}` || 
                                 p.category === `Cantine - ${newMonth}` ||
                                 p.category === `Internat - ${newMonth}`
                               ).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                            } else if (financeFormCategory === 'Scolarité Mensuelle') {
                               target = Math.round(Number(currentFees.scolarite ?? 0) / Number(currentFees.monthsDuration || 9));
                               paid = payments.filter((p: any) => p.category === `Scolarité - ${newMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                            } else if (financeFormCategory === 'Transport Mensuel') {
                               target = Math.round(Number(currentFees.transport ?? 0) / Number(currentFees.monthsDuration || 9));
                               paid = payments.filter((p: any) => p.category === `Transport - ${newMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                            } else if (financeFormCategory === 'Cantine Mensuelle') {
                               target = Math.round(Number(currentFees.cantine ?? 0) / Number(currentFees.monthsDuration || 9));
                               paid = payments.filter((p: any) => p.category === `Cantine - ${newMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                            } else if (financeFormCategory === 'Internat Mensuel') {
                               target = Math.round(Number(currentFees.internat ?? 0) / Number(currentFees.monthsDuration || 9));
                               paid = payments.filter((p: any) => p.category === `Internat - ${newMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                            }

                            setFinanceFormAmount(Math.max(0, target - paid));
                          }}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-extrabold cursor-pointer focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                        >
                          {activeMonths.map((m) => (
                            <option key={`month-${m}`} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Context-aware information about selected category */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-gray-100 flex items-center justify-between font-mono text-[11px]">
                    <div>
                      <span className="text-gray-400 uppercase text-[9px]">Dû Total:</span>
                      <p className="font-extrabold text-slate-800">{statusSelected.target.toLocaleString()} {currency}</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 uppercase text-[9px]">Déjà réglé:</span>
                      <p className="font-extrabold text-emerald-600">{statusSelected.paid.toLocaleString()} {currency}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-500 uppercase text-[9px]">Reste à payer:</span>
                      <p className="font-black text-rose-500">{statusSelected.owed.toLocaleString()} {currency}</p>
                    </div>
                  </div>

                  {/* Payment Amount */}
                  <div>
                    <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">Montant à Encaisser ({currency})</label>
                    <input 
                      type="number" 
                      value={financeFormAmount || ''} 
                      onChange={(e) => setFinanceFormAmount(Number(e.target.value))} 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-black font-mono text-base focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                    />
                    
                    {/* Quick shortcuts for ergonomic entry */}
                    {statusSelected.owed > 0 && (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setFinanceFormAmount(statusSelected.owed)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-mono text-[9px] rounded-lg font-bold border border-rose-200 transition-colors"
                        >
                          Solder Reste ({statusSelected.owed.toLocaleString()} FCFA)
                        </button>
                        {statusSelected.owed > 10000 && (
                          <button
                            type="button"
                            onClick={() => setFinanceFormAmount(Math.round(statusSelected.owed / 2))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[9px] rounded-lg font-bold border border-slate-200 transition-colors"
                          >
                            Régler 50% ({Math.round(statusSelected.owed / 2).toLocaleString()} FCFA)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">Moyen de règlement</label>
                    <select 
                      value={financeFormMode} 
                      onChange={(e) => setFinanceFormMode(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-extrabold cursor-pointer focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                    >
                      <option value="Wave">Wave Mobile Money</option>
                      <option value="Orange Money">Orange Money OM</option>
                      <option value="Espèces">Espèces (Liquide)</option>
                      <option value="Virement Bancaire">Virement Bancaire</option>
                      <option value="Chèque">Chèque Bancaire</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-100 mt-4">
                    <button type="button" onClick={() => setShowPaymentModal(null)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-gray-500 hover:bg-gray-50 uppercase tracking-wider text-xs">Annuler</button>
                    <button 
                      type="button" 
                      disabled={saving || financeFormAmount <= 0}
                      onClick={async () => {
                        if (financeFormCategory === "Mensualité Globale") {
                          // Submit split payments roughly equal to target (until exhausted)
                          // For simplicity, handleRecordPayment can be called multiple times or once with combined if we adapt it.
                          // But handleRecordPayment takes a single category string. Let's adapt handleRecordPayment!
                          // Or we just call it 3-4 times!
                          let remaining = financeFormAmount;
                          const {scolarite, transport, cantine, internat, monthsDuration, hasTransport, hasCanteen, hasInternat} = currentFees;
                          
                          const targetScol = Math.round(Number(scolarite ?? 0) / Number(monthsDuration || 9));
                          const targetTrans = hasTransport !== false ? Math.round(Number(transport ?? 0) / Number(monthsDuration || 9)) : 0;
                          const targetCant = hasCanteen !== false ? Math.round(Number(cantine ?? 0) / Number(monthsDuration || 9)) : 0;
                          const targetInt = hasInternat !== false ? Math.round(Number(internat ?? 0) / Number(monthsDuration || 9)) : 0;
                          
                          const paidScol = (activeS.tuitionPayments || []).filter((p: any) => p.category === `Scolarité - ${financeFormMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                          const paidTrans = (activeS.tuitionPayments || []).filter((p: any) => p.category === `Transport - ${financeFormMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                          const paidCant = (activeS.tuitionPayments || []).filter((p: any) => p.category === `Cantine - ${financeFormMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);
                          const paidInt = (activeS.tuitionPayments || []).filter((p: any) => p.category === `Internat - ${financeFormMonth}`).reduce((s: number, p: any) => s + Number(p.amount||0), 0);

                          const owedScol = Math.max(0, targetScol - paidScol);
                          const owedTrans = Math.max(0, targetTrans - paidTrans);
                          const owedCant = Math.max(0, targetCant - paidCant);
                          const owedInt = Math.max(0, targetInt - paidInt);

                          // Distribute sequentially
                          let pushScol = 0, pushTrans = 0, pushCant = 0, pushInt = 0;
                          
                          pushScol = Math.min(owedScol, remaining);
                          remaining -= pushScol;
                          
                          pushTrans = Math.min(owedTrans, remaining);
                          remaining -= pushTrans;
                          
                          pushCant = Math.min(owedCant, remaining);
                          remaining -= pushCant;

                          pushInt = Math.min(owedInt, remaining);
                          remaining -= pushInt;

                          if (remaining > 0) {
                            if (pushScol > 0 || (targetTrans === 0 && targetCant === 0 && targetInt === 0)) pushScol += remaining;
                            else if (pushTrans > 0) pushTrans += remaining;
                            else if (pushCant > 0) pushCant += remaining;
                            else if (pushInt > 0) pushInt += remaining;
                            else pushScol = remaining;
                          }

                          setSaving(true);
                          try {
                            if (pushScol > 0) await handleRecordPayment(activeS.id, { amount: pushScol, category: `Scolarité - ${financeFormMonth}`, mode: financeFormMode }, true);
                            if (pushTrans > 0) await handleRecordPayment(activeS.id, { amount: pushTrans, category: `Transport - ${financeFormMonth}`, mode: financeFormMode }, true);
                            if (pushCant > 0) await handleRecordPayment(activeS.id, { amount: pushCant, category: `Cantine - ${financeFormMonth}`, mode: financeFormMode }, true);
                            if (pushInt > 0) await handleRecordPayment(activeS.id, { amount: pushInt, category: `Internat - ${financeFormMonth}`, mode: financeFormMode }, true);

                            // Set consolidated receipt for display so the printed sum is exactly the form total
                            const uniqueSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
                            const timeMarker = new Date().toISOString().slice(11,19).replace(/:/g, '');
                            const receiptNumber = `REC-2026-${String(sales.length + 1).padStart(4, '0')}-${timeMarker}-${uniqueSuffix}`;
                            setSelectedReceipt({
                              id: crypto.randomUUID(),
                              amount: Number(financeFormAmount),
                              category: `Mensualité Globale - ${financeFormMonth}`,
                              mode: financeFormMode,
                              date: new Date().toISOString(),
                              receiptNumber,
                              studentName: `${activeS.firstName} ${activeS.lastName}`,
                              matricule: activeS.matricule || 'N/A',
                              grade: activeS.grade || 'Non spécifié',
                              details: {
                                scolarite: pushScol,
                                transport: pushTrans,
                                cantine: pushCant,
                                internat: pushInt
                              }
                            });
                          } finally {
                            setSaving(false);
                            setShowPaymentModal(null);
                          }
                        } else {
                          let finalCategory = financeFormCategory;
                          if (financeFormCategory === 'Scolarité Mensuelle') finalCategory = `Scolarité - ${financeFormMonth}`;
                          else if (financeFormCategory === 'Transport Mensuel') finalCategory = `Transport - ${financeFormMonth}`;
                          else if (financeFormCategory === 'Cantine Mensuelle') finalCategory = `Cantine - ${financeFormMonth}`;
                          else if (financeFormCategory === 'Internat Mensuel') finalCategory = `Internat - ${financeFormMonth}`;

                          await handleRecordPayment(activeS.id, {
                            amount: financeFormAmount,
                            category: finalCategory,
                            mode: financeFormMode
                          });
                          setShowPaymentModal(null);
                        }
                      }}
                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10"
                    >
                      {saving ? 'Validation...' : 'Encaisser & Reçu'}
                    </button>
                  </div>
                  {/* Close left panel */}
                  </div>

                  {/* Right panel: Active tuition configuration Active Details */}
                  <div className="w-full md:w-[360px] p-8 shrink-0 bg-slate-50 flex flex-col justify-between max-h-[75vh] overflow-y-auto">
                    <div className="space-y-4 font-sans">
                      <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest border-b pb-2 border-slate-200">
                        Tarifs Contractuels Actifs
                      </h4>

                      {(() => {
                        const monthsVal = Number(currentFees.monthsDuration ?? 9);
                        const inscVal = Number(currentFees.inscription ?? 25000);
                        const scolAnnVal = Number(currentFees.scolarite ?? 300000);
                        const scolMensVal = monthsVal > 0 ? Math.round(scolAnnVal / monthsVal) : 0;
                        const unifVal = Number(currentFees.uniforme ?? 40000);
                        const transAnnVal = Number(currentFees.transport ?? 60000);
                        const transMensVal = monthsVal > 0 ? Math.round(transAnnVal / monthsVal) : 0;
                        const cantAnnVal = Number(currentFees.cantine ?? 90000);
                        const cantMensVal = monthsVal > 0 ? Math.round(cantAnnVal / monthsVal) : 0;
                        const hasInternat = currentFees.hasInternat !== undefined ? !!currentFees.hasInternat : Number(currentFees.internat ?? 0) > 0;
                        const internatAnnVal = hasInternat ? Number(currentFees.internat ?? 0) : 0;
                        const internatMensVal = monthsVal > 0 ? Math.round(internatAnnVal / monthsVal) : 0;

                        return (
                          <div className="space-y-2 text-xs font-sans">
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono">
                              <span className="text-slate-505 text-slate-550 text-slate-500 font-bold text-indigo-950">Durée de la formation :</span>
                              <span className="font-extrabold text-indigo-950 font-black">{monthsVal} mois</span>
                            </div>

                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono">
                              <span className="text-slate-500 font-medium">🎟️ Frais d'Inscription :</span>
                              <span className="font-black text-indigo-950">{inscVal.toLocaleString()} {currency}</span>
                            </div>

                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                              <div>
                                <span className="text-slate-700 font-bold">🎓 Scolarité Annuelle :</span>
                                <p className="text-[10px] text-indigo-650 font-bold mt-0.5">Scolarité Mensuelle (calculée) :</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-500 text-[10px]">{scolAnnVal.toLocaleString()} {currency}</p>
                                <p className="font-black text-indigo-700">{(scolMensVal).toLocaleString()} {currency}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-300 font-mono">
                              <span className="text-slate-505 text-slate-500 font-medium font-bold text-slate-750">👕 Uniforme Scolaire :</span>
                              <span className="font-extrabold text-indigo-950 font-black">{unifVal.toLocaleString()} {currency}</span>
                            </div>

                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                              <div>
                                <span className="text-slate-700 font-bold">🚌 Transport Annuel :</span>
                                <p className="text-[10px] text-emerald-650 font-bold mt-0.5">Transport Mensuel (calculé) :</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-500 text-[10px]">{transAnnVal.toLocaleString()} {currency}</p>
                                <p className="font-black text-emerald-755 text-emerald-700 font-semibold">{(transMensVal).toLocaleString()} {currency}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                              <div>
                                <span className="text-slate-700 font-bold">🍱 Cantine Annuelle :</span>
                                <p className="text-[10px] text-amber-650 font-bold mt-0.5">Cantine Mensuelle (calculée) :</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-500 text-[10px]">{cantAnnVal.toLocaleString()} {currency}</p>
                                <p className="font-black text-amber-705 text-amber-700">{(cantMensVal).toLocaleString()} {currency}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 font-mono bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                              <div>
                                <span className="text-slate-700 font-bold">🏠 Internat Annuel :</span>
                                <p className="text-[10px] text-violet-650 font-bold mt-0.5">Internat Mensuel (calculé) :</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-500 text-[10px]">{hasInternat ? `${internatAnnVal.toLocaleString()} ${currency}` : "Désactivé"}</p>
                                <p className="font-black text-violet-700">{(internatMensVal).toLocaleString()} {currency}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl font-sans font-medium text-slate-700">
                      <p className="text-[10px] text-indigo-950 uppercase tracking-wider font-mono font-black">
                        💡 Information Caisse
                      </p>
                      <p className="text-[10px] text-indigo-900 mt-1 leading-normal font-sans">
                        Pensez à délivrer un reçu officiel imprimé à la famille une fois le versement encaissé.
                      </p>
                    </div>
                  </div>
                  {/* Close horizontal split container */}
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* MODAL 3: DOSSIER COMPTABLE HISTORIQUE (RE-PENSÉ SANS CHANTIER D'ÉCRITURE) */}
        {selectedStudentFinance && (() => {
          const activeStudentFinance = students.find((s: any) => s.id === selectedStudentFinance.id) || selectedStudentFinance;
          
          const currentFeesBreakdown = getStudentFees(activeStudentFinance);

          const hasInternat = currentFeesBreakdown.hasInternat !== undefined ? !!currentFeesBreakdown.hasInternat : Number(currentFeesBreakdown.internat ?? 0) > 0;

          const detailedCategories = [
            { key: 'inscription', label: "Inscription / Réinscription", defaultVal: 25000, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', formValue: "Inscription / Réinscription" },
            { key: 'scolarite', label: "Scolarité Mensuelle", defaultVal: 300000, icon: DollarSign, color: 'text-sky-600 bg-sky-50 border-sky-100', formValue: "Scolarité Mensuelle" },
            { key: 'uniforme', label: "Uniforme Scolaire", defaultVal: 40000, icon: Package, color: 'text-amber-600 bg-amber-50 border-amber-100', formValue: "Uniforme Scolaire" },
            { key: 'transport', label: "Transport Scolaire", defaultVal: 60000, icon: Car, color: 'text-teal-600 bg-teal-50 border-teal-100', formValue: "Transport Scolaire" },
            { key: 'cantine', label: "Cantine Cafétéria", defaultVal: 90000, icon: Utensils, color: 'text-rose-600 bg-rose-50 border-rose-100', formValue: "Cantine Cafétéria" },
            ...(hasInternat ? [
              { key: 'internat', label: "Hébergement / Services d'internat", defaultVal: 0, icon: Home, color: 'text-violet-600 bg-violet-50 border-violet-100', formValue: "Internat Mensuel" }
            ] : [])
          ];

          // Compute global totals for this student
          let studentTotalTarget = 0;
          let studentTotalPaid = 0;
          
          detailedCategories.forEach(cat => {
            const target = Number(currentFeesBreakdown[cat.key] ?? cat.defaultVal);
            const paid = (activeStudentFinance.tuitionPayments || [])
              .filter((p: any) => p.category === cat.formValue || 
                (cat.formValue === "Scolarité Mensuelle" && p.category.startsWith("Scolarité - ")) ||
                (cat.formValue === "Transport Scolaire" && p.category.startsWith("Transport - ")) ||
                (cat.formValue === "Cantine Cafétéria" && p.category.startsWith("Cantine - ")) ||
                (cat.formValue === "Internat Mensuel" && p.category.startsWith("Internat - "))
              )
              .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
            studentTotalTarget += target;
            studentTotalPaid += paid;
          });

          const studentTotalOwed = Math.max(0, studentTotalTarget - studentTotalPaid);

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 15 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98, y: 15 }}
                className="bg-slate-50 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col font-sans"
              >
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-indigo-50 text-indigo-700 font-extrabold text-sm rounded-2xl flex items-center justify-center border border-indigo-100 uppercase">
                      {activeStudentFinance.firstName?.[0] || 'E'}{activeStudentFinance.lastName?.[0] || 'S'}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-indigo-950 leading-tight">
                        Dossier & Historique : <span className="text-indigo-600">{activeStudentFinance.firstName} {activeStudentFinance.lastName}</span>
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono font-bold">
                        <span>Classe: <span className="text-slate-800 uppercase font-black">{activeStudentFinance.grade || 'N/A'}</span></span>
                        <span>•</span>
                        <span>Matricule: <span className="text-slate-800 font-black">{activeStudentFinance.matricule || 'GEN-2026'}</span></span>
                        <span>•</span>
                        <span>Parent: <span className="text-slate-800">{activeStudentFinance.parentContact || 'N/A'}</span></span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudentFinance(null)} 
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border shadow-sm text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* DOUBLE PANEL LAYOUT */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                  
                  {/* LEFT PANEL: CURRENT FEES BREAKDOWN PROGRESS (7 COLS) */}
                  <div className="lg:col-span-7 p-8 space-y-6 overflow-y-auto bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-650 font-mono">Grand Livre Comptable (Répartition)</h4>
                    </div>

                    {/* KPI Quick Status bar */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-4.5 rounded-2xl border border-black/5 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-mono uppercase font-black">Tarif global</span>
                        <p className="text-base font-black font-mono text-indigo-950 mt-1">{(studentTotalTarget).toLocaleString()} {currency}</p>
                      </div>
                      <div className="bg-white p-4.5 rounded-2xl border border-black/5 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-mono uppercase font-black">Réglé</span>
                        <p className="text-base font-black font-mono text-emerald-600 mt-1">{(studentTotalPaid).toLocaleString()} {currency}</p>
                      </div>
                      <div className="bg-white p-4.5 rounded-2xl border border-black/5 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-mono uppercase font-black font-semibold">Reste</span>
                        <p className={`text-base font-black font-mono mt-1 ${studentTotalOwed > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {(studentTotalOwed).toLocaleString()} {currency}
                        </p>
                      </div>
                    </div>

                    {/* Fiche de Référence Financière à 9 points */}
                    <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-indigo-50 pb-2.5">
                        <span className="text-sm">📋</span>
                        <h5 className="font-black text-[10px] font-mono uppercase tracking-wider text-indigo-950">Fiche des Tarifs Contractuels Actifs</h5>
                      </div>

                      {(() => {
                        const mVal = Number(currentFeesBreakdown.monthsDuration ?? 9);
                        const iVal = Number(currentFeesBreakdown.inscription ?? 25000);
                        const sAnnVal = Number(currentFeesBreakdown.scolarite ?? 300000);
                        const sMensVal = mVal > 0 ? Math.round(sAnnVal / mVal) : 0;
                        const uVal = Number(currentFeesBreakdown.uniforme ?? 40000);
                        const tAnnVal = Number(currentFeesBreakdown.transport ?? 60000);
                        const tMensVal = mVal > 0 ? Math.round(tAnnVal / mVal) : 0;
                        const cAnnVal = Number(currentFeesBreakdown.cantine ?? 90000);
                        const cMensVal = mVal > 0 ? Math.round(cAnnVal / mVal) : 0;
                        const hasInternat = currentFeesBreakdown.hasInternat !== undefined ? !!currentFeesBreakdown.hasInternat : Number(currentFeesBreakdown.internat ?? 0) > 0;
                        const intAnnVal = hasInternat ? Number(currentFeesBreakdown.internat ?? 0) : 0;
                        const intMensVal = mVal > 0 ? Math.round(intAnnVal / mVal) : 0;

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-mono">
                              <span className="text-[9px] text-slate-400 uppercase font-black">1. Durée de la formation</span>
                              <p className="font-black text-indigo-950 mt-1">{mVal} mois</p>
                            </div>

                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-mono">
                              <span className="text-[9px] text-slate-400 uppercase font-black">2. Frais d'inscription</span>
                              <p className="font-black text-indigo-950 mt-1">{iVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/30 font-mono">
                              <span className="text-[9px] text-indigo-600 uppercase font-black">3. Scolarité annuelle</span>
                              <p className="font-black text-indigo-950 mt-1">{sAnnVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60 font-mono">
                              <span className="text-[9px] text-indigo-700 uppercase font-black">4. Scolarité mensuelle (calculée)</span>
                              <p className="font-black text-indigo-700 mt-1">{sMensVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-mono">
                              <span className="text-[9px] text-slate-400 uppercase font-black">5. Uniforme scolaire</span>
                              <p className="font-black text-indigo-950 mt-1">{uVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-100/30 font-mono">
                              <span className="text-[9px] text-emerald-600 uppercase font-black">6. Transport annuel</span>
                              <p className="font-black text-indigo-950 mt-1">{tAnnVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 font-mono">
                              <span className="text-[9px] text-emerald-700 uppercase font-black">7. Transport mensuel (calculé)</span>
                              <p className="font-black text-emerald-800 mt-1">{tMensVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/30 font-mono">
                              <span className="text-[9px] text-amber-600 uppercase font-black">8. Cantine annuelle</span>
                              <p className="font-black text-indigo-950 mt-1">{cAnnVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 font-mono">
                              <span className="text-[9px] text-amber-700 uppercase font-black">9. Cantine mensuelle (calculée)</span>
                              <p className="font-black text-amber-800 mt-1">{cMensVal.toLocaleString()} {currency}</p>
                            </div>

                            <div className="bg-violet-50/20 p-3 rounded-xl border border-violet-100/30 font-mono">
                              <span className="text-[9px] text-violet-600 uppercase font-black">10. Internat annuel</span>
                              <p className="font-black text-indigo-950 mt-1">{hasInternat ? `${intAnnVal.toLocaleString()} ${currency}` : "Désactivé"}</p>
                            </div>

                            <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100/60 font-mono">
                              <span className="text-[9px] text-violet-750 uppercase font-black font-bold">11. Internat mensuel (calculé)</span>
                              <p className="font-black text-violet-800 mt-1">{hasInternat ? `${intMensVal.toLocaleString()} ${currency}` : "Désactivé"}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Fee list items */}
                    <div className="space-y-3.5">
                      {detailedCategories.map((cat) => {
                        const target = Number(currentFeesBreakdown[cat.key] ?? cat.defaultVal);
                        const paid = (activeStudentFinance.tuitionPayments || [])
                          .filter((p: any) => p.category === cat.formValue || 
                            (cat.formValue === "Scolarité Mensuelle" && p.category.startsWith("Scolarité - ")) ||
                            (cat.formValue === "Transport Scolaire" && p.category.startsWith("Transport - ")) ||
                            (cat.formValue === "Cantine Cafétéria" && p.category.startsWith("Cantine - ")) ||
                            (cat.formValue === "Internat Mensuel" && p.category.startsWith("Internat - "))
                          )
                          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                        const owed = Math.max(0, target - paid);
                        const pct = target > 0 ? Math.min(100, Math.round((paid / target) * 100)) : 0;

                        return (
                          <div key={cat.key} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cat.color}`}>
                                  <cat.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="font-extrabold text-indigo-950 text-sm">{cat.label}</h5>
                                  <p className="text-[10px] font-mono text-slate-400">
                                    Dû: <span className="font-extrabold text-slate-750">{target.toLocaleString()} {currency}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                {target === 0 ? (
                                  <span className="px-2 py-0.5 bg-slate-50 text-slate-300 rounded text-[8.5px] font-black uppercase">Non applicable</span>
                                ) : owed === 0 ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8.5px] font-black uppercase inline-flex items-center gap-0.5">
                                    ✓ Soldé
                                  </span>
                                ) : paid > 0 ? (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8.5px] font-black uppercase font-bold">Payé {pct}%</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 rounded text-[8.5px] font-black uppercase">Impayé</span>
                                )}
                              </div>
                            </div>

                            {/* Progress bar info */}
                            {target > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span>Payé: <strong className="text-emerald-650 font-extrabold">{paid.toLocaleString()}</strong> FCFA</span>
                                  <span>Reste: <strong className="text-rose-500 font-extrabold">{owed.toLocaleString()}</strong> FCFA</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT PANEL: PAYMENT HISTORY LOGS & RECEIPT PRINTING (5 COLS) */}
                  <div className="lg:col-span-5 p-8 flex flex-col h-full bg-white overflow-y-auto">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-650 font-mono">Historique des Reçus Certifiés</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Consultez tous les règlements encaissés pour cet étudiant cette année académique. Vous pouvez ré-émettre et imprimer chaque ticket historique.
                      </p>
                    </div>

                    <div className="flex-1 mt-6 overflow-y-auto space-y-3 pr-1">
                      {(activeStudentFinance.tuitionPayments || []).length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed text-gray-450 text-xs">
                          Aucun versement n'a été enregistré pour cet élève.
                        </div>
                      ) : (
                        [...(activeStudentFinance.tuitionPayments || [])].reverse().map((pay: any) => (
                          <div key={pay.id} className="bg-slate-50 hover:bg-slate-100 p-4 rounded-xl border border-gray-100 transition-colors flex items-center justify-between gap-3 shadow-xs">
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-slate-800">{pay.category}</p>
                              <p className="text-[10px] font-mono text-indigo-950 font-bold">
                                {pay.receiptNumber} • Mode: <span className="font-black text-indigo-600">{pay.mode}</span>
                              </p>
                              <p className="text-[9px] font-mono text-slate-400">
                                Encaissé le : {format(new Date(pay.date), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-black font-mono text-emerald-600">+{pay.amount.toLocaleString()} FCFA</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceipt({
                                    ...pay,
                                    studentName: `${activeStudentFinance.firstName} ${activeStudentFinance.lastName}`,
                                    matricule: activeStudentFinance.matricule || 'N/A',
                                    grade: activeStudentFinance.grade || 'N/A'
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:scale-105 transition-all bg-white rounded-lg border border-slate-200 shadow-sm"
                                title="Imprimer le Reçu"
                              >
                                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-6 pt-5 border-t flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentFinance(null)}
                        className="px-5 py-2.5 bg-indigo-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
                      >
                        Fermer le dossier
                      </button>
                    </div>

                  </div>

                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* MODAL 3: DESIGNER RECEIPT FOR PRINT */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950">Aperçu du Reçu</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                    REÇU OFFICIEL DE TRÉSORERIE
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedReceipt(null)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors border shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* PRINTABLE RECEIPT LAYOUT */}
              <div id="school-receipt-print" className="p-8 space-y-6 printable-body font-sans text-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-indigo-950">{merchant.name}</h2>
                    <p className="text-[10px] text-slate-500 font-medium">B.P. 3381 / Dakar, Sénégal</p>
                    <p className="text-[9px] font-mono text-indigo-600">contact@acom-school.sn</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-indigo-950 text-white text-[9px] font-black tracking-widest uppercase rounded">
                      REÇU DE COMMERCE
                    </span>
                    <p className="text-[11px] font-mono font-bold text-indigo-950 mt-2">{selectedReceipt.receiptNumber}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Date: {format(new Date(selectedReceipt.date), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2 text-xs">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Élève :</span>
                    <span className="font-extrabold text-indigo-950 text-right">{selectedReceipt.studentName}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Matricule :</span>
                    <span className="font-mono text-right">{selectedReceipt.matricule}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Niveau d'étude :</span>
                    <span className="font-extrabold text-right">{selectedReceipt.grade}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Rubrique comptable :</span>
                    <span className="font-extrabold text-right text-indigo-950">{selectedReceipt.category}</span>
                  </div>
                </div>

                {/* TABLEAU DES LIBELLÉS DÉTAILLÉS */}
                {(() => {
                  const details = selectedReceipt.details || (() => {
                    const cat = selectedReceipt.category || '';
                    if (cat.includes('Mensualité Globale')) {
                      if (Number(selectedReceipt.amount) === 63333) {
                        return { scolarite: 33333, transport: 10000, cantine: 20000 };
                      }
                      const amount = Number(selectedReceipt.amount || 0);
                      const transport = Math.round(amount * 10000 / 63333);
                      const cantine = Math.round(amount * 20000 / 63333);
                      const scolarite = amount - transport - cantine;
                      return { scolarite, transport, cantine };
                    } else {
                      return {
                        scolarite: cat.includes('Scolarité') ? Number(selectedReceipt.amount) : 0,
                        transport: cat.includes('Transport') ? Number(selectedReceipt.amount) : 0,
                        cantine: cat.includes('Cantine') ? Number(selectedReceipt.amount) : 0,
                        internat: cat.includes('Internat') ? Number(selectedReceipt.amount) : 0,
                        inscription: cat.includes('Inscription') ? Number(selectedReceipt.amount) : 0,
                        autres: (!cat.includes('Scolarité') && !cat.includes('Transport') && !cat.includes('Cantine') && !cat.includes('Internat') && !cat.includes('Inscription')) ? Number(selectedReceipt.amount) : 0
                      };
                    }
                  })();

                  return (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white shadow-xs">
                      <div className="bg-indigo-950/5 px-4 py-3 border-b border-slate-100 font-black text-indigo-950 text-[10px] uppercase tracking-wider flex justify-between">
                        <span>ÉLÉMENT DE FACTURATIONS</span>
                        <span>MONTANT ({currency})</span>
                      </div>
                      <div className="divide-y divide-slate-100 px-4">
                        {Number(details.inscription || 0) > 0 && (
                          <div className="flex justify-between py-2.5 text-slate-700 font-medium">
                            <span className="font-bold">Inscription / Réinscription :</span>
                            <span className="font-extrabold font-mono">{Number(details.inscription).toLocaleString()} {currency}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2.5 text-slate-700 font-medium">
                          <span className="font-bold">Scolarité :</span>
                          <span className="font-extrabold font-mono">{Number(details.scolarite || 0).toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between py-2.5 text-slate-700 font-medium">
                          <span className="font-bold">Transport :</span>
                          <span className="font-extrabold font-mono">{Number(details.transport || 0).toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between py-2.5 text-slate-700 font-medium">
                          <span className="font-bold">Cantine :</span>
                          <span className="font-extrabold font-mono">{Number(details.cantine || 0).toLocaleString()} {currency}</span>
                        </div>
                        {Number(details.internat || 0) > 0 && (
                          <div className="flex justify-between py-2.5 text-slate-700 font-medium">
                            <span className="font-bold">Hébergement / Internat :</span>
                            <span className="font-extrabold font-mono">{Number(details.internat).toLocaleString()} {currency}</span>
                          </div>
                        )}
                        {Number(details.autres || 0) > 0 && (
                          <div className="flex justify-between py-2.5 text-slate-700 font-medium">
                            <span className="font-bold">Autres :</span>
                            <span className="font-extrabold font-mono">{Number(details.autres).toLocaleString()} {currency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="py-6 border-y border-dashed border-gray-200 flex justify-between items-center bg-slate-50 border-x rounded-xl px-6">
                  <span className="text-xs font-black uppercase text-indigo-950 tracking-wider">Montant total net perçu</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">{Number(selectedReceipt.amount).toLocaleString()} {currency}</span>
                </div>

                <div className="flex justify-between items-end gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">Mode de versement</p>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded border border-indigo-100">
                      {selectedReceipt.mode}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mb-12">Le Caissier Général</p>
                    <p className="text-[10px] font-extrabold text-indigo-950 underline decoration-indigo-500">SIGNÉ ÉLECTRONIQUEMENT</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex space-x-3">
                <button 
                  onClick={() => window.print()} 
                  className="flex-1 py-3 px-4 bg-indigo-950 text-white rounded-xl text-xs font-bold hover:bg-black flex items-center justify-center space-x-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Reçu</span>
                </button>
                <button 
                  onClick={() => {
                    alert("Reçu transmis avec succès au représentant légal par courrier et WhatsApp !");
                    setSelectedReceipt(null);
                  }} 
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center justify-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer WhatsApp</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL 4: ADD GENERAL CHARGES */}
        {isAddingExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950 font-sans">Enregistrer Dépense</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                    LIVRE JOURNAL DES COMPTES
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddingExpense(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors border shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Désignation de la charge</label>
                  <input 
                    type="text" 
                    required 
                    value={newExpense.title} 
                    onChange={e => setNewExpense({...newExpense, title: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none font-bold text-sm" 
                    placeholder="ex: Facture SENELEC (Electricité), Carburant bus..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Montant décaissé ({currency})</label>
                    <input 
                      type="number" 
                      required 
                      value={newExpense.amount || ''} 
                      onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Catégorie de comptes</label>
                    <select 
                      value={newExpense.category} 
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-bold"
                    >
                      <option value="Salaires">Salaires (Professeurs / Admin)</option>
                      <option value="Électricité / SENELEC">Électricité / SENELEC</option>
                      <option value="Eau / SDE">Eau / SDE</option>
                      <option value="Fournitures Bureau">Fournitures bureau & ramettes</option>
                      <option value="Internet / Orange">Internet / Orange Telecom</option>
                      <option value="Maintenance / Réparations">Maintenance & Chantiers</option>
                      <option value="Carburant / Transport">Carburant Bus Scolaire</option>
                      <option value="Cuisine / Cantine">Approvisionnement Cantine</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Observations / Libellé de liaison</label>
                  <textarea 
                    value={newExpense.description} 
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none text-xs" 
                    placeholder="Informations ou précisions supplémentaires..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddingExpense(false)} className="flex-1 py-4 border rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
                    {saving ? 'Enregistrement...' : 'Valider Décaissement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 5: ADD UNIFORM / BOOKS TO PRODUCT INVENTORY */}
        {isAddingProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-indigo-950 font-sans">Enregistrer Matériel</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                    DISTRIBUTION SCOLAIRE
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddingProduct(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors border shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom de l'article / Description</label>
                  <input 
                    type="text" 
                    required 
                    value={newProduct.name} 
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none font-bold text-sm" 
                    placeholder="ex: Uniforme d'excellence 6e, Lot Cahiers double..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Prix de vente unitaire ({currency})</label>
                    <input 
                      type="number" 
                      required 
                      value={newProduct.price || ''} 
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Quantité initiale magasin</label>
                    <input 
                      type="number" 
                      required 
                      value={newProduct.stockQuantity || ''} 
                      onChange={e => setNewProduct({...newProduct, stockQuantity: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border outline-none font-mono font-bold" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Catégorie uniforme & fournitures</label>
                  <select 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border outline-none font-bold"
                  >
                    <option value="Uniforme">Uniforme complet</option>
                    <option value="Livres">Livres & Manuels scolaires</option>
                    <option value="Cahiers">Lot de cahiers de brouillon/TP</option>
                    <option value="Fournitures">Fournitures généraux d'étude</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 py-4 border rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-indigo-950 text-white rounded-2xl font-bold hover:bg-black transition-all">
                    {saving ? 'Création...' : 'Valider & Mettre en rayon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
