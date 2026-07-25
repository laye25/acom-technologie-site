import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  Ruler, Search, Scissors, AlertCircle, Sparkles, 
  Check, RotateCcw, Save, Layers, History, Eye, CheckCircle2
} from 'lucide-react';
import { 
  MeasurementLibraryService, 
  MeasurementDefinition, 
  GenderType 
} from '../services/MeasurementLibraryService';
import { 
  GarmentLibraryService, 
  GarmentDefinition 
} from '../services/GarmentLibraryService';
import { GarmentVectorIcon } from './GarmentVectorIcon';
import { 
  MeasurementValidationService, 
  ValidationResult 
} from '../services/MeasurementValidationService';
import { GarmentSelector } from './GarmentSelector';
import { MeasurementValidator } from './MeasurementValidator';
import { MeasurementHistoryViewer } from './MeasurementHistoryViewer';

interface MeasurementFormProps {
  merchantId: string;
  clientId?: string;
  clientName?: string;
  initialGender?: GenderType;
  initialMeasurements?: Record<string, number | string>;
  selectedGarment?: GarmentDefinition;
  onSelectGarment?: (garment: GarmentDefinition) => void;
  onChangeGarmentRequested?: () => void;
  onMeasurementsChange?: (measurements: Record<string, number | string>, garmentName?: string) => void;
  onActiveFieldChange?: (fieldKey: string | null) => void;
  activeMeasurementKey?: string | null;
}

export const MeasurementForm: React.FC<MeasurementFormProps> = ({
  merchantId,
  clientId = 'client-anon',
  clientName = 'Client Sur-Mesure',
  initialGender = 'Homme',
  initialMeasurements = {},
  selectedGarment: externalGarment,
  onSelectGarment,
  onChangeGarmentRequested,
  onMeasurementsChange,
  onActiveFieldChange,
  activeMeasurementKey = null
}) => {
  const [gender, setGender] = useState<GenderType>(initialGender);
  const [internalGarment, setInternalGarment] = useState<GarmentDefinition>(() => {
    const list = GarmentLibraryService.getGarments(merchantId);
    return list[0];
  });

  const selectedGarment = externalGarment || internalGarment;

  const handleSelectGarment = (garment: GarmentDefinition) => {
    if (onSelectGarment) {
      onSelectGarment(garment);
    } else {
      setInternalGarment(garment);
    }
    toast.success(`Modèle sélectionné : ${garment.name}`);
  };

  const [values, setValues] = useState<Record<string, number | string>>(initialMeasurements);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Sync initial measurements if props change
  useEffect(() => {
    if (initialMeasurements && Object.keys(initialMeasurements).length > 0) {
      setValues(initialMeasurements);
    }
  }, [initialMeasurements]);

  // Tous les vêtements & toutes les définitions
  const allDefinitions = useMemo(() => {
    return MeasurementLibraryService.getByGender(gender);
  }, [gender]);

  // Filtrer les définitions selon le vêtement sélectionné
  const mandatoryDefinitions = useMemo(() => {
    return selectedGarment.mandatoryMeasurements
      .map((key) => MeasurementLibraryService.getByKey(key))
      .filter((m): m is MeasurementDefinition => m !== undefined);
  }, [selectedGarment]);

  const optionalDefinitions = useMemo(() => {
    return selectedGarment.optionalMeasurements
      .map((key) => MeasurementLibraryService.getByKey(key))
      .filter((m): m is MeasurementDefinition => m !== undefined);
  }, [selectedGarment]);

  // Autres mesures hors vêtement (accessibles via recherche ou toggle)
  const otherDefinitions = useMemo(() => {
    const usedKeys = new Set([
      ...selectedGarment.mandatoryMeasurements,
      ...selectedGarment.optionalMeasurements
    ]);
    return allDefinitions.filter((m) => !usedKeys.has(m.key));
  }, [selectedGarment, allDefinitions]);

  // Résultat de validation en temps réel
  const validationResult: ValidationResult = useMemo(() => {
    return MeasurementValidationService.validate(values, selectedGarment);
  }, [values, selectedGarment]);

  // Handler de modification de champ
  const handleChangeValue = (key: string, rawVal: string) => {
    const newValues = { ...values, [key]: rawVal };
    setValues(newValues);
    if (onMeasurementsChange) {
      onMeasurementsChange(newValues, selectedGarment.name);
    }
  };

  const handleFieldFocus = (key: string) => {
    if (onActiveFieldChange) {
      onActiveFieldChange(key);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Réinitialiser toutes les mesures saisies ?')) {
      setValues({});
      if (onMeasurementsChange) onMeasurementsChange({});
      toast.success('Formulaire de mesures réinitialisé.');
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Context Banner: Active Garment Summary & Technical Sewing Guidelines (No redundant library) */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-slate-50 to-teal-50/80 border border-emerald-200/80 rounded-2xl p-4 shadow-sm text-slate-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/10 text-emerald-700 rounded-2xl border border-emerald-300/60 shrink-0 shadow-inner">
              <GarmentVectorIcon
                id={selectedGarment.id}
                name={selectedGarment.name}
                category={selectedGarment.category}
                className="w-8 h-8 text-emerald-700"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span>🧵</span> Vêtement sélectionné
                </span>
                <span className="px-2 py-0.5 bg-slate-200/80 text-slate-800 rounded-md text-[10px] font-extrabold">
                  {selectedGarment.category}
                </span>
                <span className="px-2 py-0.5 bg-slate-200/80 text-slate-800 rounded-md text-[10px] font-extrabold">
                  👤 {selectedGarment.gender}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                {selectedGarment.name}
              </h3>
            </div>
          </div>

          {/* Return to Step 2 Button */}
          {onChangeGarmentRequested && (
            <button
              type="button"
              onClick={onChangeGarmentRequested}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition hover:scale-105 cursor-pointer shrink-0"
              title="Revenir à l'Étape 2 pour changer de modèle de vêtement"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>🔄 Changer de vêtement</span>
            </button>
          )}
        </div>

        {/* Useful Technical Sewing Context (Technical details, fabric & ease recommendations) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Description & Style */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
              Description & Modèle
            </span>
            <p className="text-slate-700 font-medium leading-relaxed text-xs">
              {selectedGarment.description || "Confection sur-mesure d'atelier haut de gamme."}
            </p>
          </div>

          {/* Profil & Recommandations de Couture */}
          <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/70 space-y-1.5 shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Profil de Mesures Chargé
              </span>
              <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {mandatoryDefinitions.length} requises / {optionalDefinitions.length} optionnelles
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Marge de couture</span>
                <span className="font-bold text-slate-900">1.5 - 2.0 cm</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Aisance recommandée</span>
                <span className="font-bold text-slate-900">4 - 6 cm (Standard)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Form / History */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`pb-2.5 px-4 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'form'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Saisie des Mesures ({selectedGarment.name})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-4 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique & Évolutions</span>
        </button>
      </div>

      {activeTab === 'form' && (
        <div className="space-y-4">
          {/* Real-time Validation Banner */}
          <MeasurementValidator
            validationResult={validationResult}
            onFixField={(key) => handleFieldFocus(key)}
          />

          {/* Quick Search */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher une mesure spécifique (ex: Cou, Biceps, Cuisses...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Section 1: Mesures Obligatoires pour ce vêtement */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5 tracking-wider">
                <GarmentVectorIcon id={selectedGarment.id} name={selectedGarment.name} category={selectedGarment.category} className="w-4 h-4 text-emerald-600" />
                Mesures Requises pour : {selectedGarment.name}
              </h4>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                {mandatoryDefinitions.length} requises
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mandatoryDefinitions.map((def) => {
                const isActive = activeMeasurementKey === def.key;
                const val = values[def.key] ?? '';

                return (
                  <div
                    key={def.key}
                    onClick={() => handleFieldFocus(def.key)}
                    className={`p-3 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        {def.label}
                      </label>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{def.code}</span>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        placeholder={`Ex: ${(def.minNormalCm + def.maxNormalCm) / 2}`}
                        value={val}
                        onFocus={() => handleFieldFocus(def.key)}
                        onChange={(e) => handleChangeValue(def.key, e.target.value)}
                        className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Mesures Optionnelles pour ce vêtement */}
          {optionalDefinitions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase text-sky-800 flex items-center gap-1.5 tracking-wider">
                <Sparkles className="w-4 h-4 text-sky-600" />
                Mesures Complémentaires / Optionnelles ({optionalDefinitions.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {optionalDefinitions.map((def) => {
                  const isActive = activeMeasurementKey === def.key;
                  const val = values[def.key] ?? '';

                  return (
                    <div
                      key={def.key}
                      onClick={() => handleFieldFocus(def.key)}
                      className={`p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/30 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-800">{def.label}</label>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{def.code}</span>
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Optionnel"
                          value={val}
                          onFocus={() => handleFieldFocus(def.key)}
                          onChange={(e) => handleChangeValue(def.key, e.target.value)}
                          className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
                        />
                        <span className="absolute right-3 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                          cm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls Bottom Bar */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              Réinitialiser
            </button>

            <span className="text-xs font-mono text-slate-500">
              {Object.keys(values).filter((k) => values[k] !== '' && values[k] !== undefined).length} mesure(s) saisie(s)
            </span>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <MeasurementHistoryViewer
          merchantId={merchantId}
          clientId={clientId}
          clientName={clientName}
          gender={gender === 'Femme' ? 'Femme' : 'Homme'}
          currentMeasurements={values}
          onLoadProfile={(profile) => {
            setValues(profile.measurements || {});
            if (onMeasurementsChange) onMeasurementsChange(profile.measurements || {});
            setActiveTab('form');
            toast.success(`Profil "${profile.profileName}" chargé dans le formulaire !`);
          }}
        />
      )}
    </div>
  );
};
