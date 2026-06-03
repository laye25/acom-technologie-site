import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Save, AlertTriangle, Layers, Library, User, Info, Calculator, CreditCard, CalendarDays, CheckCircle, Search, Filter, Sliders } from 'lucide-react';
import { Merchant } from '../../types';
import { dbService } from '../../services/dbService';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'react-hot-toast';

export const SchoolPricingSaaS = ({ merchant }: { merchant: any }) => {
  const [saving, setSaving] = useState(false);
  const [pricingMode, setPricingMode] = useState<'NIVEAU' | 'CLASSE' | 'PERSONNALISE'>('NIVEAU');
  
  const LEVELS = ['Maternelle', 'Primaire', 'Collège', 'Lycée', 'Formation Professionnelle'];
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[1]); // Default to Primaire
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearchValue, setStudentSearchValue] = useState('');
  const [filterSource, setFilterSource] = useState<'ALL' | 'CLASSE' | 'NIVEAU' | 'DEFAUT'>('ALL');
  const [classPricingSearch, setClassPricingSearch] = useState('');

  const getClassLevelKey = (className: string) => {
    const classNameLower = (className || '').toLowerCase();
    if (classNameLower.includes('mat') || classNameLower.includes('crech') || classNameLower.includes('garde') || classNameLower.includes('maternelle')) {
      return 'Maternelle';
    } else if (classNameLower.includes('ci') || classNameLower.includes('cp') || classNameLower.includes('ce1') || classNameLower.includes('ce2') || classNameLower.includes('cm1') || classNameLower.includes('cm2') || classNameLower.includes('prim')) {
      return 'Primaire';
    } else if (classNameLower.includes('6e') || classNameLower.includes('5e') || classNameLower.includes('4e') || classNameLower.includes('3e') || classNameLower.includes('colleg')) {
      return 'Collège';
    } else if (classNameLower.includes('second') || classNameLower.includes('premier') || classNameLower.includes('terminal') || classNameLower.includes('lyce') || classNameLower.includes('2nd') || classNameLower.includes('1er') || classNameLower.includes('tle') || classNameLower.includes('l2')) {
      return 'Lycée';
    } else if (classNameLower.includes('pro') || classNameLower.includes('format')) {
      return 'Formation Professionnelle';
    }
    return '';
  };
  
  // States corresponding to user's form (aligning standard default fallbacks)
  const [formData, setFormData] = useState<any>({
    monthsDuration: '9',
    registrationFee: '25000',
    annualTuition: '300000',
    monthlyTuition: '33333',
    uniformFee: '40000',
    annualTransport: '60000',
    monthlyTransport: '6667',
    annualCanteen: '90000',
    monthlyCanteen: '10000',
    annualCanteenInterne: '90000',
    monthlyCanteenInterne: '10000',
    annualInternat: '0',
    monthlyInternat: '0',
    hasTransport: true,
    hasCanteen: true,
    hasInternat: false,
    regime: 'externe'
  });

  const [options, setOptions] = useState({
    applyToAllStudents: true,
    applyToAllClasses: true,
    keepCustomPricing: true,
    autoRecalculate: true
  });

  const dbClasses = useLiveQuery(() => db.classes?.where('merchantId').equals(merchant.id).toArray() || [], [merchant.id]);
  const dbStudents = useLiveQuery(() => db.students?.where('merchantId').equals(merchant.id).toArray() || [], [merchant.id]);

  const filteredStudents = (dbStudents || []).filter(s => {
    if (!studentSearchValue) return false;
    const term = studentSearchValue.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName} ${s.name}`.toLowerCase();
    return fullName.includes(term) || s.matricule?.toLowerCase().includes(term);
  });

  // Calculate monthly automatically
  useEffect(() => {
    const months = parseInt(formData.monthsDuration || '9') || 9;
    const annualT = parseInt((formData.annualTuition || '').toString().replace(/\D/g, '')) || 0;
    const annualTr = parseInt((formData.annualTransport || '').toString().replace(/\D/g, '')) || 0;
    const annualC = parseInt((formData.annualCanteen || '').toString().replace(/\D/g, '')) || 0;
    const annualCI = parseInt((formData.annualCanteenInterne !== undefined ? formData.annualCanteenInterne : formData.annualCanteen || '').toString().replace(/\D/g, '')) || 0;
    const annualInt = parseInt((formData.annualInternat || '').toString().replace(/\D/g, '')) || 0;
    
    const isInterne = formData.hasInternat === true;
    const isDemi = formData.hasCanteen !== false && !isInterne;
    const computedRegime = isInterne ? 'interne' : (isDemi ? 'demi-pension' : 'externe');

    setFormData(prev => ({
      ...prev,
      monthlyTuition: months > 0 ? Math.round(annualT / months).toString() : '0',
      monthlyTransport: months > 0 ? Math.round(annualTr / months).toString() : '0',
      monthlyCanteen: months > 0 ? Math.round(annualC / months).toString() : '0',
      monthlyCanteenInterne: months > 0 ? Math.round(annualCI / months).toString() : '0',
      monthlyInternat: months > 0 ? Math.round(annualInt / months).toString() : '0',
      regime: computedRegime
    }));
  }, [formData.annualTuition, formData.annualTransport, formData.annualCanteen, formData.annualCanteenInterne, formData.annualInternat, formData.monthsDuration, formData.hasCanteen, formData.hasInternat]);

  const handleRegimeChange = (rg: 'externe' | 'demi-pension' | 'interne') => {
    setFormData(prev => ({
      ...prev,
      regime: rg,
      hasCanteen: rg !== 'externe',
      hasInternat: rg === 'interne'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedMerchant = { ...merchant };
      if (!updatedMerchant.schoolPricing) updatedMerchant.schoolPricing = { levels: {}, classes: {}, exceptions: {} };
      
      const breakdown = {
        inscription: Number(formData.registrationFee.toString().replace(/\D/g, '')) || 0,
        scolarite: Number(formData.annualTuition.toString().replace(/\D/g, '')) || 0,
        uniforme: Number(formData.uniformFee.toString().replace(/\D/g, '')) || 0,
        transport: formData.hasTransport !== false ? (Number(formData.annualTransport.toString().replace(/\D/g, '')) || 0) : 0,
        cantine: formData.hasCanteen !== false ? (Number(formData.annualCanteen.toString().replace(/\D/g, '')) || 0) : 0,
        cantineInterne: formData.hasInternat !== false ? (Number((formData.annualCanteenInterne !== undefined ? formData.annualCanteenInterne : formData.annualCanteen).toString().replace(/\D/g, '')) || 0) : 0,
        annualCanteenInterne: formData.hasInternat !== false ? (formData.annualCanteenInterne || formData.annualCanteen || '0').toString() : '0',
        internat: formData.hasInternat !== false ? (Number(formData.annualInternat.toString().replace(/\D/g, '')) || 0) : 0,
        hasTransport: formData.hasTransport !== false,
        hasCanteen: formData.hasCanteen !== false,
        hasInternat: formData.hasInternat !== false,
        regime: formData.regime || 'externe',
        monthsDuration: Number(formData.monthsDuration || 9)
      };

      if (pricingMode === 'NIVEAU') {
        updatedMerchant.schoolPricing.levels[selectedLevel] = formData;
      } else if (pricingMode === 'CLASSE') {
        if (!selectedClass) throw new Error("Veuillez sélectionner une classe.");
        updatedMerchant.schoolPricing.classes[selectedClass] = formData;
      } else {
        if (!selectedStudent) throw new Error("Veuillez sélectionner un élève.");
        updatedMerchant.schoolPricing.exceptions[selectedStudent.id] = formData;
        
        // Also sync to the student's direct attributes
        await db.students.update(selectedStudent.id, {
          regime: formData.regime || 'externe',
          hasTransport: formData.hasTransport,
          hasCanteen: formData.hasCanteen,
          hasInternat: formData.hasInternat,
          annualTransport: formData.hasTransport ? String(formData.annualTransport) : '0',
          annualCanteen: formData.hasCanteen ? String(formData.annualCanteen) : '0',
          annualInternat: formData.hasInternat ? String(formData.annualInternat) : '0',
          updatedAt: new Date()
        });
      }

      await dbService.merchants.save(updatedMerchant as any);

      // Now propagate to students if options are selected
      let updatedCount = 0;
      const allStudentsList = dbStudents || [];
      
      if (pricingMode === 'NIVEAU' && options.applyToAllStudents) {
        for (const st of allStudentsList) {
          const gradeStr = (st.grade || st.class || '').toLowerCase();
          let levelKey = '';
          if (gradeStr.includes('mat') || gradeStr.includes('creche') || gradeStr.includes('garderie') || gradeStr.includes('maternelle')) {
            levelKey = 'Maternelle';
          } else if (gradeStr.includes('ci') || gradeStr.includes('cp') || gradeStr.includes('ce1') || gradeStr.includes('ce2') || gradeStr.includes('cm1') || gradeStr.includes('cm2') || gradeStr.includes('primaire')) {
            levelKey = 'Primaire';
          } else if (gradeStr.includes('6e') || gradeStr.includes('5e') || gradeStr.includes('4e') || gradeStr.includes('3e') || gradeStr.includes('college')) {
            levelKey = 'Collège';
          } else if (gradeStr.includes('seconde') || gradeStr.includes('premiere') || gradeStr.includes('terminale') || gradeStr.includes('lycee') || gradeStr.includes('2nde') || gradeStr.includes('1ere') || gradeStr.includes('tled') || gradeStr.includes('tle') || gradeStr.includes('l2')) {
            levelKey = 'Lycée';
          } else if (gradeStr.includes('pro') || gradeStr.includes('formation')) {
            levelKey = 'Formation Professionnelle';
          }

          if (levelKey === selectedLevel) {
            // Apply if keepCustomPricing is false, or if student doesn't have custom pricing yet
            if (!options.keepCustomPricing || !st.tuitionFeesBreakdown || !st.tuitionFeesBreakdown.isCustom) {
              const defaultCanteenForRegime = (breakdown.regime === 'interne')
                ? String(formData.annualCanteenInterne !== undefined ? formData.annualCanteenInterne : formData.annualCanteen || '0')
                : (breakdown.hasCanteen ? String(formData.annualCanteen) : '0');
              await db.students.update(st.id, {
                tuitionFeesBreakdown: breakdown,
                regime: breakdown.regime || st.regime || 'externe',
                hasTransport: breakdown.hasTransport,
                hasCanteen: breakdown.hasCanteen,
                hasInternat: breakdown.hasInternat,
                annualTransport: breakdown.hasTransport ? String(formData.annualTransport) : '0',
                annualCanteen: defaultCanteenForRegime,
                annualInternat: breakdown.hasInternat ? String(formData.annualInternat) : '0',
                updatedAt: new Date()
              });
              updatedCount++;
            }
          }
        }
      } else if (pricingMode === 'CLASSE' && options.applyToAllStudents) {
        const selectedClassObject = dbClasses?.find(c => c.id === selectedClass);
        for (const st of allStudentsList) {
          const classKey = st.classId || st.class_id || st.class || st.grade;
          if (classKey === selectedClass || (selectedClassObject && classKey === selectedClassObject.name)) {
            if (!options.keepCustomPricing || !st.tuitionFeesBreakdown || !st.tuitionFeesBreakdown.isCustom) {
              const defaultCanteenForRegime = (breakdown.regime === 'interne')
                ? String(formData.annualCanteenInterne !== undefined ? formData.annualCanteenInterne : formData.annualCanteen || '0')
                : (breakdown.hasCanteen ? String(formData.annualCanteen) : '0');
              await db.students.update(st.id, {
                tuitionFeesBreakdown: breakdown,
                regime: breakdown.regime || st.regime || 'externe',
                hasTransport: breakdown.hasTransport,
                hasCanteen: breakdown.hasCanteen,
                hasInternat: breakdown.hasInternat,
                annualTransport: breakdown.hasTransport ? String(formData.annualTransport) : '0',
                annualCanteen: defaultCanteenForRegime,
                annualInternat: breakdown.hasInternat ? String(formData.annualInternat) : '0',
                updatedAt: new Date()
              });
              updatedCount++;
            }
          }
        }
      } else if (pricingMode === 'PERSONNALISE' && selectedStudent) {
        const defaultCanteenForRegime = (breakdown.regime === 'interne')
          ? String(formData.annualCanteenInterne !== undefined ? formData.annualCanteenInterne : formData.annualCanteen || '0')
          : (breakdown.hasCanteen ? String(formData.annualCanteen) : '0');
        await db.students.update(selectedStudent.id, {
          tuitionFeesBreakdown: breakdown,
          regime: breakdown.regime || selectedStudent.regime || 'externe',
          hasTransport: breakdown.hasTransport,
          hasCanteen: breakdown.hasCanteen,
          hasInternat: breakdown.hasInternat,
          annualTransport: breakdown.hasTransport ? String(formData.annualTransport) : '0',
          annualCanteen: defaultCanteenForRegime,
          annualInternat: breakdown.hasInternat ? String(formData.annualInternat) : '0',
          updatedAt: new Date()
        });
        updatedCount = 1;
      }
      
      toast.success(
        updatedCount > 0 
          ? `Paramètres de facturation mis à jour. ${updatedCount} élève(s) mis à jour.`
          : 'Paramètres de facturation mis à jour avec succès.', 
        {
          icon: '💵',
          duration: 4000
        }
      );
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadExisting = () => {
    const pricing = merchant.schoolPricing || { levels: {}, classes: {}, exceptions: {} };

    const DEFAULT_FALLBACK = {
      monthsDuration: '9',
      registrationFee: '25000',
      annualTuition: '300000',
      uniformFee: '40000',
      annualTransport: '60000',
      annualCanteen: '90000',
      annualCanteenInterne: '90000',
      annualInternat: '0',
      hasTransport: true,
      hasCanteen: true,
      hasInternat: false,
      regime: 'externe'
    };

    let existing = null;
    if (pricingMode === 'NIVEAU') {
      existing = pricing.levels?.[selectedLevel];
    } else if (pricingMode === 'CLASSE' && selectedClass) {
      existing = pricing.classes?.[selectedClass];
      if (!existing) {
        // Fall back to level config if defined
        const clsObj = dbClasses?.find((c: any) => c.id === selectedClass || String(c.id) === String(selectedClass));
        const levelKey = clsObj ? getClassLevelKey(clsObj.name) : '';
        existing = levelKey ? pricing.levels?.[levelKey] : null;
      }
    } else if (pricingMode === 'PERSONNALISE' && selectedStudent) {
      existing = pricing.exceptions?.[selectedStudent.id];
      if (!existing) {
        // Fall back to class config, then level config
        const classKey = selectedStudent.classId || selectedStudent.class_id || selectedStudent.class || selectedStudent.grade;
        if (classKey) {
          existing = pricing.classes?.[classKey];
          if (!existing) {
            const clsObj = dbClasses?.find((c: any) => c.id === classKey || c.name === classKey || String(c.id) === String(classKey));
            const levelKey = clsObj ? getClassLevelKey(clsObj.name) : (selectedStudent.grade ? getClassLevelKey(selectedStudent.grade) : '');
            existing = levelKey ? pricing.levels?.[levelKey] : null;
          }
        }
      }
    }

    const baseData = existing ? { ...DEFAULT_FALLBACK, ...existing } : { ...DEFAULT_FALLBACK };

    setFormData({
      ...baseData,
      monthsDuration: (baseData.monthsDuration || '9').toString(),
      registrationFee: (baseData.registrationFee || '25000').toString(),
      annualTuition: (baseData.annualTuition || '300000').toString(),
      uniformFee: (baseData.uniformFee || '40000').toString(),
      annualTransport: (baseData.annualTransport || '60000').toString(),
      annualCanteen: (baseData.annualCanteen || '90000').toString(),
      annualCanteenInterne: (baseData.annualCanteenInterne || baseData.annualCanteen || '90000').toString(),
      annualInternat: (baseData.annualInternat || '0').toString(),
      hasTransport: baseData.hasTransport !== undefined ? !!baseData.hasTransport : (Number(baseData.annualTransport || 0) > 0),
      hasCanteen: baseData.hasCanteen !== undefined ? !!baseData.hasCanteen : (Number(baseData.annualCanteen || 0) > 0),
      hasInternat: baseData.hasInternat !== undefined ? !!baseData.hasInternat : (Number(baseData.annualInternat || 0) > 0),
      regime: baseData.regime || (selectedStudent?.regime || 'externe'),
    });
  };
  
  useEffect(() => {
    handleLoadExisting();
  }, [pricingMode, selectedLevel, selectedClass, selectedStudent]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-8 rounded-[2rem] border border-black/5 shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-white/10 text-blue-100 text-[10px] font-black uppercase tracking-widest rounded-md border border-white/10 mb-2 inline-block">Architecture Financière</span>
          <h3 className="text-2xl font-black text-white">Paramètres de Facturation</h3>
          <p className="text-sm text-blue-200 font-medium mt-1">Gérez la tarification hiérarchique : par Niveau, par Classe ou Personnalisée.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-white text-indigo-950 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            {saving ? <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL : Settings config */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SEC 1: Mode Selection */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Mode de tarification</h4>
            <div className="space-y-3">
              {[
                { id: 'NIVEAU', label: 'Tarif du niveau', icon: Layers },
                { id: 'CLASSE', label: 'Tarif de la classe', icon: Library },
                { id: 'PERSONNALISE', label: 'Tarif personnalisé pour cet élève', icon: User },
              ].map(mode => (
                <label key={mode.id} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${pricingMode === mode.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="pricingMode" 
                    className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    checked={pricingMode === mode.id}
                    onChange={() => setPricingMode(mode.id as any)}
                  />
                  <div className="flex items-center gap-2">
                    <mode.icon className={`w-5 h-5 ${pricingMode === mode.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`font-bold ${pricingMode === mode.id ? 'text-indigo-950' : 'text-slate-600'}`}>{mode.label}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Sub-selection based on active mode */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              {pricingMode === 'NIVEAU' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Niveau scolaire</label>
                  <select 
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-indigo-950 font-bold p-4 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              {pricingMode === 'CLASSE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Classe spécifique</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-indigo-950 font-bold p-4 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value="">-- Sélectionnez une classe --</option>
                    {dbClasses?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {pricingMode === 'PERSONNALISE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Rechercher un élève</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Nom, prénom ou matricule..." 
                      className="w-full bg-slate-50 border border-slate-200 text-indigo-950 font-medium pl-10 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                      value={studentSearchValue}
                      onChange={(e) => setStudentSearchValue(e.target.value)}
                    />
                  </div>
                  {studentSearchValue && !selectedStudent && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <p className="p-3 text-sm text-slate-500 italic text-center">Aucun élève trouvé.</p>
                      ) : (
                        filteredStudents.map((s: any) => (
                           <button 
                             key={s.id} 
                             onClick={() => { setSelectedStudent(s); setStudentSearchValue(''); }}
                             className="w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 text-sm"
                           >
                             <span className="font-bold text-indigo-950">{s.firstName} {s.lastName}</span>
                             <span className="text-xs text-slate-400 block break-all">Matricule: {s.matricule || s.id} - Classe: {s.grade}</span>
                           </button>
                        ))
                      )}
                    </div>
                  )}

                  {selectedStudent && (
                    <div className="mt-3 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-black text-indigo-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                        <p className="text-xs font-mono text-indigo-600">Sélectionné pour la tarification</p>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="text-xs font-bold text-indigo-600 hover:underline">Changer</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SEC 2: Tarifs Form */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            
            {/* Title & Introduction */}
            <div className="pb-5 border-b border-slate-100">
              <h4 className="text-xl font-sans font-black text-indigo-950 flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </span>
                Tarifs de la Classe
              </h4>
              <p className="text-xs font-semibold text-slate-500 mt-2">
                Saisissez les montants en devise de base ({merchant.currency || 'FCFA'}).
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                Les mensualités sont calculées automatiquement à partir des montants annuels et de la durée de la formation.
              </p>
            </div>

            {/* Régimes Applicables & Durée Formation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              
              {/* Régimes Applicables Checkboxes */}
              <div className="space-y-2.5">
                <label className="block text-xs font-mono font-black text-slate-500 uppercase tracking-widest">
                  Régimes Applicables
                </label>
                <div className="space-y-2.5">
                  {/* Externe Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={formData.hasExterne !== false}
                      onChange={(e) => setFormData({ ...formData, hasExterne: e.target.checked })}
                      className="w-4.5 h-4.5 rounded text-indigo-650 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      {formData.hasExterne !== false ? '☑' : '☐'} Externe
                    </span>
                  </label>

                  {/* Demi-pension Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={formData.hasCanteen !== false}
                      onChange={(e) => setFormData({ ...formData, hasCanteen: e.target.checked })}
                      className="w-4.5 h-4.5 rounded text-indigo-650 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      {formData.hasCanteen !== false ? '☑' : '☐'} Demi-pension
                    </span>
                  </label>

                  {/* Interne Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={formData.hasInternat === true}
                      onChange={(e) => setFormData({ ...formData, hasInternat: e.target.checked })}
                      className="w-4.5 h-4.5 rounded text-indigo-650 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      {formData.hasInternat === true ? '☑' : '☐'} Interne
                    </span>
                  </label>
                </div>
              </div>

              {/* Durée de la formation */}
              <div className="space-y-3">
                <label className="block text-xs font-mono font-black text-slate-500 uppercase tracking-widest">
                  Durée de la Formation
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Nombre de mois :</span>
                  <input 
                    type="number"
                    min="1"
                    max="12"
                    className="w-20 font-bold p-2 text-center rounded-xl border border-slate-200 bg-white text-indigo-950 focus:ring-2 focus:ring-indigo-600 outline-none"
                    value={formData.monthsDuration}
                    onChange={(e) => setFormData({ ...formData, monthsDuration: e.target.value })}
                  />
                </div>
              </div>

            </div>

            {/* Price Cards Hierarchy */}
            <div className="space-y-6">

              {/* RÉGIME EXTERNE */}
              <div id="regime-externe-card" className={`rounded-3xl p-6 border transition-all space-y-4 ${
                formData.hasExterne !== false 
                  ? 'bg-blue-50/10 border-blue-100 shadow-xs' 
                  : 'bg-slate-50/20 border-slate-100 opacity-80'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-emoji">📖</span>
                    <h5 className="text-sm font-sans font-black text-indigo-950 uppercase tracking-wider">
                      Régime Externe
                    </h5>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-black uppercase tracking-wider ${
                    formData.hasExterne !== false ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {formData.hasExterne !== false ? 'Option active' : 'Option inactive'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-extrabold text-indigo-950">Description :</p>
                  <p className="font-medium text-slate-500">L'élève fréquente uniquement les cours. Les frais de cantine et d'internat ne sont pas appliqués.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <h6 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Tarifs</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      id="fee-reg"
                      label="Frais d'inscription" 
                      value={formData.registrationFee} 
                      onChange={(v) => setFormData({...formData, registrationFee: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-tuition"
                      label="Scolarité annuelle" 
                      value={formData.annualTuition} 
                      onChange={(v) => setFormData({...formData, annualTuition: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-tuition-m"
                      label="Scolarité mensuelle (calculée)" 
                      value={formData.monthlyTuition} 
                      readOnly 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-uniform"
                      label="Uniforme scolaire" 
                      value={formData.uniformFee} 
                      onChange={(v) => setFormData({...formData, uniformFee: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                  </div>
                </div>
              </div>

              {/* RÉGIME DEMI-PENSION */}
              <div id="regime-demi-pension-card" className={`rounded-3xl p-6 border transition-all space-y-4 ${
                formData.hasCanteen !== false 
                  ? 'bg-emerald-50/10 border-emerald-100 shadow-xs' 
                  : 'bg-slate-50/20 border-slate-100 opacity-80'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-emoji">🍱</span>
                    <h5 className="text-sm font-sans font-black text-indigo-950 uppercase tracking-wider">
                      Régime Demi-pension
                    </h5>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-black uppercase tracking-wider ${
                    formData.hasCanteen !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {formData.hasCanteen !== false ? 'Option active' : 'Option inactive'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-extrabold text-indigo-950">Description :</p>
                  <p className="font-medium text-slate-550 text-slate-500">L'élève bénéficie du service de restauration scolaire (cantine).</p>
                </div>

                <div className="space-y-4 pt-2">
                  <h6 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Tarifs</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      id="fee-reg-demi"
                      label="Frais d'inscription" 
                      value={formData.registrationFee} 
                      onChange={(v) => setFormData({...formData, registrationFee: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-tuition-demi"
                      label="Scolarité annuelle" 
                      value={formData.annualTuition} 
                      onChange={(v) => setFormData({...formData, annualTuition: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-tuition-m-demi"
                      label="Scolarité mensuelle (calculée)" 
                      value={formData.monthlyTuition} 
                      readOnly 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-uniform-demi"
                      label="Uniforme scolaire" 
                      value={formData.uniformFee} 
                      onChange={(v) => setFormData({...formData, uniformFee: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-canteen"
                      label="Cantine annuelle" 
                      value={formData.annualCanteen} 
                      onChange={(v) => setFormData({...formData, annualCanteen: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-canteen-m"
                      label="Cantine mensuelle (calculée)" 
                      value={formData.monthlyCanteen} 
                      readOnly 
                      suffix={merchant.currency || 'FCFA'}
                    />
                  </div>
                </div>
              </div>

              {/* RÉGIME INTERNE */}
              <div id="regime-interne-card" className={`rounded-3xl p-6 border transition-all space-y-4 ${
                formData.hasInternat === true 
                  ? 'bg-purple-50/10 border-purple-100 shadow-xs' 
                  : 'bg-slate-50/20 border-slate-100 opacity-80'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-emoji">🏠</span>
                    <h5 className="text-sm font-sans font-black text-indigo-950 uppercase tracking-wider">
                      Régime Interne
                    </h5>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-black uppercase tracking-wider ${
                    formData.hasInternat === true ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {formData.hasInternat === true ? 'Option active' : 'Option inactive'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-extrabold text-indigo-950">Description :</p>
                  <p className="font-medium text-slate-500">L'élève est hébergé dans l'établissement et bénéficie de la restauration ainsi que des services d'internat.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <h6 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Tarifs</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      id="fee-reg-interne"
                      label="Frais d'inscription" 
                      value={formData.registrationFee} 
                      onChange={(v) => setFormData({...formData, registrationFee: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-tuition-interne"
                      label="Scolarité annuelle" 
                      value={formData.annualTuition} 
                      onChange={(v) => setFormData({...formData, annualTuition: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-tuition-m-interne"
                      label="Scolarité mensuelle (calculée)" 
                      value={formData.monthlyTuition} 
                      readOnly 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-uniform-interne"
                      label="Uniforme scolaire" 
                      value={formData.uniformFee} 
                      onChange={(v) => setFormData({...formData, uniformFee: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-canteen-interne"
                      label="Cantine annuelle" 
                      value={formData.annualCanteenInterne !== undefined ? formData.annualCanteenInterne : formData.annualCanteen} 
                      onChange={(v) => setFormData({...formData, annualCanteenInterne: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-canteen-m-interne"
                      label="Cantine mensuelle (calculée)" 
                      value={formData.monthlyCanteenInterne || formData.monthlyCanteen} 
                      readOnly 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-internat"
                      label="Frais d'internat annuels" 
                      value={formData.annualInternat} 
                      onChange={(v) => setFormData({...formData, annualInternat: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-internat-m"
                      label="Frais d'internat mensuels (calculés)" 
                      value={formData.monthlyInternat} 
                      readOnly 
                      suffix={merchant.currency || 'FCFA'}
                    />
                  </div>
                </div>
              </div>

              {/* TRANSPORT SCOLAIRE */}
              <div id="transport-scolaire-card" className={`rounded-3xl p-6 border transition-all space-y-4 ${
                formData.hasTransport !== false 
                  ? 'bg-amber-50/10 border-amber-100 shadow-xs' 
                  : 'bg-slate-50/20 border-slate-100 opacity-80'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      id="hasTransport" 
                      className="w-4.5 h-4.5 rounded text-indigo-650 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      checked={formData.hasTransport !== false} 
                      onChange={(e) => setFormData({...formData, hasTransport: e.target.checked})} 
                    />
                    <label htmlFor="hasTransport" className="text-sm font-sans font-black text-indigo-950 uppercase tracking-wider cursor-pointer select-none">
                      Transport Scolaire
                    </label>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-black uppercase tracking-wider ${
                    formData.hasTransport !== false ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {formData.hasTransport !== false ? 'Option active' : 'Option inactive'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-extrabold text-indigo-950">Description :</p>
                  <p className="font-medium text-slate-550 text-slate-500">L'élève bénéficie du service de transport scolaire.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <h6 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Tarifs</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      id="fee-transport"
                      label="Transport annuel" 
                      value={formData.annualTransport} 
                      onChange={(v) => setFormData({...formData, annualTransport: v})} 
                      suffix={merchant.currency || 'FCFA'}
                    />
                    <InputField 
                      id="fee-transport-m"
                      label="Transport mensuel (calculé)" 
                      value={formData.monthlyTransport} 
                      readOnly 
                      suffix={merchant.currency || 'FCFA'}
                    />
                  </div>
                </div>
              </div>

              {/* CALCULS AUTOMATIQUES */}
              <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-[1.75rem] space-y-4">
                <div className="flex items-center gap-2 text-indigo-950">
                  <span className="text-base text-indigo-600 font-bold">🧮</span>
                  <h5 className="text-xs font-mono font-black uppercase tracking-widest">Calculs Automatiques</h5>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Le système calcule automatiquement :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[11px] font-mono text-indigo-900 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-extrabold">•</span>
                    <span>Scolarité mensuelle = Scolarité annuelle ÷ {formData.monthsDuration || 9} mois</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-extrabold">•</span>
                    <span>Cantine mensuelle = Cantine annuelle ÷ {formData.monthsDuration || 9} mois</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-extrabold">•</span>
                    <span>Internat mensuel = Internat annuel ÷ {formData.monthsDuration || 9} mois</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-extrabold">•</span>
                    <span>Transport mensuel = Transport annuel ÷ {formData.monthsDuration || 9} mois</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION INTERACTIVE DES TARIFS PAR CLASSE / FILTRE DÉTAILLÉ */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sliders className="w-5 h-5 animate-pulse" />
                  </span>
                  <h4 className="text-lg font-black text-indigo-950">Visualisation des configurations déjà faites</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Filtrez et visualisez en temps réel les tarifs de facturation appliqués à chaque classe (configurés ou hérités).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Recherche textuelle */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer par nom de classe..."
                    className="w-full bg-slate-50 border border-slate-200 text-indigo-950 font-bold text-xs pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                    value={classPricingSearch}
                    onChange={(e) => setClassPricingSearch(e.target.value)}
                  />
                </div>

                {/* Filtre sur la provenance du tarif */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {(['ALL', 'CLASSE', 'NIVEAU', 'DEFAUT'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFilterSource(mode)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        filterSource === mode
                          ? 'bg-white text-indigo-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode === 'ALL' ? 'Tous' : mode === 'CLASSE' ? 'Spécifique' : mode === 'NIVEAU' ? 'Hérité' : 'Standard'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grille des tarifs par classe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const list = (dbClasses || []).map(cls => {
                  // Déterminer la clé du niveau avec notre helper centralisé
                  const levelKey = getClassLevelKey(cls.name);

                  const pricing = merchant.schoolPricing || { levels: {}, classes: {}, exceptions: {} };
                  let source: 'CLASSE' | 'NIVEAU' | 'DEFAUT' = 'DEFAUT';
                  
                  const fallback = {
                    monthsDuration: '9',
                    registrationFee: '25000',
                    annualTuition: '300000',
                    uniformFee: '40000',
                    annualTransport: '60000',
                    annualCanteen: '90000',
                  };

                  let data = { ...fallback };

                  if (pricing.classes?.[cls.id]) {
                    data = pricing.classes[cls.id];
                    source = 'CLASSE';
                  } else if (levelKey && pricing.levels?.[levelKey]) {
                    data = pricing.levels[levelKey];
                    source = 'NIVEAU';
                  }

                  return {
                    classId: cls.id,
                    className: cls.name,
                    levelKey,
                    source,
                    data,
                  };
                });

                const filteredList = list.filter(item => {
                  if (classPricingSearch && !item.className.toLowerCase().includes(classPricingSearch.toLowerCase())) {
                    return false;
                  }
                  if (filterSource !== 'ALL' && item.source !== filterSource) {
                    return false;
                  }
                  return true;
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-slate-500 font-bold text-sm">Aucune classe ne correspond aux critères de filtre sélectionnés.</p>
                    </div>
                  );
                }

                return filteredList.map((item) => {
                  const data: any = item.data;
                  const months = parseInt(data.monthsDuration || '9') || 9;
                  const annTuition = parseInt(String(data.annualTuition || '0').replace(/\D/g, '')) || 0;
                  
                  const hasTransport = data.hasTransport !== false;
                  const hasCanteen = data.hasCanteen !== false;
                  const hasInternat = data.hasInternat !== undefined ? !!data.hasInternat : (Number(data.annualInternat || 0) > 0);

                  const annCanteen = hasCanteen ? (parseInt(String(data.annualCanteen || '0').replace(/\D/g, '')) || 0) : 0;
                  const annTransport = hasTransport ? (parseInt(String(data.annualTransport || '0').replace(/\D/g, '')) || 0) : 0;
                  const annInternat = hasInternat ? (parseInt(String(data.annualInternat || '0').replace(/\D/g, '')) || 0) : 0;

                  const monTuition = months > 0 ? Math.round(annTuition / months) : 0;
                  const monCanteen = months > 0 ? Math.round(annCanteen / months) : 0;
                  const monTransport = months > 0 ? Math.round(annTransport / months) : 0;
                  const monInternat = months > 0 ? Math.round(annInternat / months) : 0;
                  const currency = merchant.currency || 'FCFA';

                  return (
                      <div 
                        key={item.classId} 
                        className={`p-7 rounded-[2rem] border transition-all duration-300 hover:shadow-md ${
                          item.source === 'CLASSE' 
                            ? 'border-emerald-400/35 bg-white' 
                            : item.source === 'NIVEAU' 
                              ? 'border-indigo-200/50 bg-white' 
                              : 'border-slate-200/50 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h5 className="font-extrabold text-indigo-950 text-base">Classe : {item.className}</h5>
                            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.levelKey || 'Niveau Général'}</p>
                          </div>

                          {item.source === 'CLASSE' && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-mono tracking-wider font-extrabold uppercase rounded border border-emerald-100/60 shadow-xs">
                              SPÉCIFIQUE CLASSE
                            </span>
                          )}
                          {item.source === 'NIVEAU' && (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-mono tracking-wider font-extrabold uppercase rounded border border-indigo-100/60 shadow-xs">
                              HÉRITÉ DU NIVEAU
                            </span>
                          )}
                          {item.source === 'DEFAUT' && (
                            <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[9px] font-mono tracking-wider font-extrabold uppercase rounded border border-slate-250 shadow-xs">
                              PAR DÉFAUT
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 mt-4 text-xs font-bold text-slate-700 border-t border-dashed border-slate-100 pt-4">
                          
                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50">
                            <span className="text-slate-500 font-medium flex items-center gap-2">
                              <span>📅</span> Durée de la formation (mois) :
                            </span>
                            <span className="text-indigo-950 font-black">{months} mois</span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50">
                            <span className="text-slate-500 font-medium flex items-center gap-2">
                              <span>🪙</span> Frais d'inscription :
                            </span>
                            <span className="text-indigo-950 font-black">{Number(item.data.registrationFee || 0).toLocaleString()} {currency}</span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50">
                            <span className="text-slate-500 font-medium flex items-center gap-2">
                              <span>🎓</span> Scolarité annuelle :
                            </span>
                            <span className="text-indigo-950 font-black">{Number(item.data.annualTuition || 0).toLocaleString()} {currency}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-50">
                            <span className="text-indigo-600 font-bold flex items-center gap-2">
                              <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">➡</span> Scolarité mensuelle (calculée) :
                            </span>
                            <span className="text-indigo-700 font-extrabold text-sm">{Number(monTuition).toLocaleString()} {currency}</span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50">
                            <span className="text-slate-500 font-medium flex items-center gap-2">
                              <span>👕</span> Uniforme scolaire :
                            </span>
                            <span className="text-indigo-950 font-black">{Number(item.data.uniformFee || 0).toLocaleString()} {currency}</span>
                          </div>

                          {hasTransport ? (
                            <>
                              <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50">
                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                  <span>🚌</span> Transport annuel :
                                </span>
                                <span className="text-indigo-950 font-black">{Number(annTransport).toLocaleString()} {currency}</span>
                              </div>
                              <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-50">
                                <span className="text-indigo-600 font-bold flex items-center gap-2">
                                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">➡</span> Transport mensuel (calculé) :
                                </span>
                                <span className="text-indigo-700 font-extrabold text-sm">{Number(monTransport).toLocaleString()} {currency}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50 text-slate-405">
                              <span className="font-medium flex items-center gap-2 text-slate-400">
                                <span>🚌</span> Transport scolaire :
                              </span>
                              <span className="font-bold italic text-slate-400">Désactivé / Non proposé</span>
                            </div>
                          )}

                          {hasCanteen ? (
                            <>
                              <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50">
                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                  <span>🍱</span> Cantine annuelle :
                                </span>
                                <span className="text-indigo-950 font-black">{Number(annCanteen).toLocaleString()} {currency}</span>
                              </div>
                              <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-50">
                                <span className="text-indigo-600 font-bold flex items-center gap-2">
                                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">➡</span> Cantine mensuelle (calculée) :
                                </span>
                                <span className="text-indigo-700 font-extrabold text-sm">{Number(monCanteen).toLocaleString()} {currency}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50 text-slate-405">
                              <span className="font-medium flex items-center gap-2 text-slate-400">
                                <span>🍱</span> Cantine cafétéria :
                              </span>
                              <span className="font-bold italic text-slate-400">Désactivé / Non proposé</span>
                            </div>
                          )}

                          {hasInternat ? (
                            <>
                              <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-50">
                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                  <span>🏠</span> Internat annuel :
                                </span>
                                <span className="text-indigo-950 font-black">{Number(annInternat).toLocaleString()} {currency}</span>
                              </div>
                              <div className="flex justify-between items-center py-1.5">
                                <span className="text-indigo-600 font-bold flex items-center gap-2">
                                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">➡</span> Internat mensuel (calculé) :
                                </span>
                                <span className="text-indigo-700 font-extrabold text-sm">{Number(monInternat).toLocaleString()} {currency}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center py-1 text-slate-405">
                              <span className="font-medium flex items-center gap-2 text-slate-400">
                                <span>🏠</span> Services d'internat :
                              </span>
                              <span className="font-bold italic text-slate-400">Désactivé / Non proposé</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => {
                              setPricingMode('CLASSE');
                              setSelectedClass(String(item.classId));
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                              toast.success(`Tarifs de la classe ${item.className} chargés dans l'éditeur`, { duration: 3000 });
                            }}
                            className="px-5 py-2.5 bg-indigo-950 text-white hover:bg-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                          >
                            ✏️ MODIFIER
                          </button>
                        </div>
                      </div>
                    );
                  });
          })()}
        </div>
      </div>
          
        </div>

        {/* RIGHT PANEL : Options & Summary */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
             
             <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Options</h4>
             
             <div className="space-y-4">
                <Checkbox setting={options.applyToAllStudents} onChange={(v) => setOptions({...options, applyToAllStudents: v})} label="Appliquer les modifications à tous les élèves du niveau" />
                <Checkbox setting={options.applyToAllClasses} onChange={(v) => setOptions({...options, applyToAllClasses: v})} label="Appliquer les modifications à toutes les classes du niveau" />
                <Checkbox setting={options.keepCustomPricing} onChange={(v) => setOptions({...options, keepCustomPricing: v})} label="Conserver les tarifs personnalisés existants" />
                <Checkbox setting={options.autoRecalculate} onChange={(v) => setOptions({...options, autoRecalculate: v})} label="Recalculer automatiquement les échéances" />
             </div>

           </div>

           <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
             <Info className="w-5 h-5 text-amber-600 shrink-0" />
             <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
               <strong className="font-black">Ordre de priorité :</strong><br/>
               Le système applique toujours le tarif le plus spécifique attribué à un élève. (1) Personnalisé {'>'} (2) Classe {'>'} (3) Niveau.
             </p>
           </div>
        </div>

      </div>
    </div>
  );
};

// -- Helpers --
const InputField = ({ label, value, onChange, readOnly = false, suffix = 'FCFA' }: any) => (
  <div>
    <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
    <div className="relative flex items-center">
      <input 
        type="text" 
        readOnly={readOnly}
        className={`w-full font-bold pl-3 pr-14 py-3 rounded-xl border outline-none transition-all ${
          readOnly 
            ? 'bg-slate-50 border-slate-200/60 text-slate-500 cursor-not-allowed font-mono' 
            : 'bg-white border-slate-200 text-indigo-950 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600'
        }`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      {suffix && (
        <span className="absolute right-3 text-[9px] font-mono font-black text-slate-400 bg-slate-100/80 px-2 py-1 rounded border border-slate-200/80 uppercase">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const Checkbox = ({ label, setting, onChange }: any) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center shrink-0 transition-colors ${setting ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-2 border-slate-300 bg-white group-hover:border-indigo-400'}`}>
      {setting && <CheckCircle className="w-3.5 h-3.5" />}
    </div>
    <span className="text-[11px] font-bold text-slate-700 leading-tight">{label}</span>
    {/* Hidden native input */}
    <input type="checkbox" className="hidden" checked={setting} onChange={(e) => onChange(e.target.checked)} />
  </label>
);
