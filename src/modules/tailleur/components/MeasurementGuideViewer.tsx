import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, HelpCircle, 
  Ruler, Lightbulb, UserCheck, ShieldAlert, ChevronRight, Zap
} from 'lucide-react';
import { 
  MeasurementLibraryService, 
  MeasurementDefinition, 
  AnatomicalZone, 
  GenderType 
} from '../services/MeasurementLibraryService';
import { GarmentDefinition } from '../services/GarmentLibraryService';
import { GarmentVectorIcon } from './GarmentVectorIcon';

export type ExtendedGenderType = 'Homme' | 'Femme' | 'Enfant' | 'Mixte';

interface MeasurementGuideViewerProps {
  gender: GenderType;
  onGenderChange?: (gender: GenderType) => void;
  activeMeasurementKey?: string | null;
  onSelectMeasurementKey?: (key: string) => void;
  currentValues?: Record<string, number | string>;
  selectedGarment?: GarmentDefinition | null;
}

export const MeasurementGuideViewer: React.FC<MeasurementGuideViewerProps> = ({
  gender,
  onGenderChange,
  activeMeasurementKey,
  onSelectMeasurementKey,
  currentValues = {},
  selectedGarment = null
}) => {
  const [selectedGender, setSelectedGender] = useState<ExtendedGenderType>(() => {
    if (selectedGarment?.category === 'Enfant' || selectedGarment?.gender === 'Garçon' || selectedGarment?.gender === 'Fille') {
      return 'Enfant';
    }
    return gender === 'Femme' ? 'Femme' : 'Homme';
  });

  // Re-sync gender when selectedGarment changes
  useEffect(() => {
    if (selectedGarment) {
      if (selectedGarment.category === 'Enfant' || selectedGarment.gender === 'Garçon' || selectedGarment.gender === 'Fille') {
        setSelectedGender('Enfant');
      } else if (selectedGarment.gender === 'Femme') {
        setSelectedGender('Femme');
      } else if (selectedGarment.gender === 'Homme') {
        setSelectedGender('Homme');
      }
    }
  }, [selectedGarment]);

  const handleGenderToggle = (newGender: ExtendedGenderType) => {
    setSelectedGender(newGender);
    if (onGenderChange && (newGender === 'Homme' || newGender === 'Femme')) {
      onGenderChange(newGender);
    }
  };

  const activeDefinition: MeasurementDefinition | undefined = activeMeasurementKey
    ? MeasurementLibraryService.getByKey(activeMeasurementKey)
    : undefined;

  const currentVal = activeMeasurementKey && currentValues[activeMeasurementKey]
    ? currentValues[activeMeasurementKey]
    : undefined;

  // Active silhouette coords
  const isFemale = selectedGender === 'Femme';
  const isChild = selectedGender === 'Enfant';
  const coords = activeDefinition
    ? isFemale
      ? activeDefinition.femaleCoords
      : activeDefinition.maleCoords
    : null;

  // Mandatory / Optional key sets for active garment
  const mandatoryKeys = new Set(selectedGarment?.mandatoryMeasurements || []);
  const optionalKeys = new Set(selectedGarment?.optionalMeasurements || []);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col h-full overflow-hidden text-left">
      {/* Header & Gender Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <Ruler className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
              Guide & Silhouette
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                Temps Réel
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Cliquez sur la silhouette pour guider la prise de mesure.
            </p>
          </div>
        </div>

        {/* Male / Female / Child Selector */}
        <div className="bg-slate-800 p-1 rounded-2xl flex border border-slate-700">
          <button
            type="button"
            onClick={() => handleGenderToggle('Homme')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              selectedGender === 'Homme'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👨 Homme</span>
          </button>
          <button
            type="button"
            onClick={() => handleGenderToggle('Femme')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              selectedGender === 'Femme'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👩 Femme</span>
          </button>
          <button
            type="button"
            onClick={() => handleGenderToggle('Enfant')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              selectedGender === 'Enfant'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🧒 Enfant</span>
          </button>
        </div>
      </div>

      {/* Selected Garment Context Banner */}
      {selectedGarment && (
        <div className="mt-3 bg-slate-950/90 border border-slate-800 p-2.5 rounded-2xl flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <GarmentVectorIcon id={selectedGarment.id} name={selectedGarment.name} category={selectedGarment.category} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block truncate">
                Modèle actif : {selectedGarment.category}
              </span>
              <p className="text-xs font-black text-white truncate">{selectedGarment.name}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="bg-emerald-500/20 text-emerald-300 font-mono font-black text-[10px] px-2 py-0.5 rounded-lg border border-emerald-500/30">
              {selectedGarment.mandatoryMeasurements.length} requis
            </span>
          </div>
        </div>
      )}

      {/* Main Content Grid: SVG Silhouette + Guide Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 flex-1 overflow-y-auto">
        {/* Silhouette SVG Column (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950/90 rounded-2xl p-4 border border-slate-800/80 relative flex flex-col items-center justify-center min-h-[360px] shadow-inner">
          {/* Active zone label top floating badge */}
          {activeDefinition ? (
            <motion.div
              key={activeDefinition.key}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-3 right-3 bg-emerald-950/95 border border-emerald-500/40 p-2.5 rounded-xl backdrop-blur-md flex items-center justify-between z-10 shadow-lg"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  Mesure sélectionnée :
                </span>
                <p className="text-xs font-black text-white truncate">{activeDefinition.label}</p>
              </div>
              {currentVal !== undefined && (
                <div className="bg-emerald-500 text-slate-950 font-mono font-black text-xs px-2.5 py-1 rounded-lg shrink-0">
                  {currentVal} cm
                </div>
              )}
            </motion.div>
          ) : (
            <div className="absolute top-3 left-3 right-3 text-center bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-[11px] text-slate-400 font-medium">
              Cliquez sur un point de la silhouette pour voir la méthode
            </div>
          )}

          {/* Interactive Vector Silhouette SVG */}
          <div className="relative w-full h-[340px] flex items-center justify-center pt-8">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full max-h-[320px] drop-shadow-2xl"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Glow Filters */}
                <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>

              {/* Vector Body Outline according to Selected Gender/Age */}
              {isChild ? (
                // Silhouette Enfant SVG (Junior Proportions)
                <g className="transition-all duration-300">
                  <circle cx="50" cy="14" r="6" fill="url(#bodyGradient)" stroke="#64748b" strokeWidth="0.8" />
                  <path d="M 47,20 L 47,23 L 53,23 L 53,20 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path
                    d="M 47,23 L 34,27 L 32,38 L 38,44 L 33,54 L 48,54 L 52,54 L 67,54 L 62,44 L 68,38 L 66,27 L 53,23 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                  <path d="M 34,27 L 27,48 L 25,47 L 31,26 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path d="M 66,27 L 73,48 L 75,47 L 69,26 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path
                    d="M 35,54 L 35,90 L 41,90 L 48,54 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 65,54 L 65,90 L 59,90 L 52,54 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                </g>
              ) : !isFemale ? (
                // Silhouette Homme SVG
                <g className="transition-all duration-300">
                  <circle cx="50" cy="11" r="5" fill="url(#bodyGradient)" stroke="#64748b" strokeWidth="0.8" />
                  <path d="M 46,15 L 46,18 L 54,18 L 54,15 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path
                    d="M 46,18 L 28,23 L 24,35 L 28,42 L 34,42 L 32,54 L 48,54 L 48,52 L 52,52 L 52,54 L 68,54 L 66,42 L 72,42 L 76,35 L 72,23 L 54,18 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                  <path d="M 28,23 L 20,48 L 17,47 L 24,22 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path d="M 72,23 L 80,48 L 83,47 L 76,22 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path
                    d="M 33,54 L 33,92 L 40,92 L 48,54 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 67,54 L 67,92 L 60,92 L 52,54 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                </g>
              ) : (
                // Silhouette Femme SVG
                <g className="transition-all duration-300">
                  <circle cx="50" cy="12" r="4.8" fill="url(#bodyGradient)" stroke="#64748b" strokeWidth="0.8" />
                  <path d="M 47,16 L 47,19 L 53,19 L 53,16 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path
                    d="M 47,19 L 31,24 L 28,34 L 36,41 L 30,52 L 48,52 L 52,52 L 70,52 L 64,41 L 72,34 L 69,24 L 53,19 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                  <path d="M 31,24 L 23,47 L 21,46 L 27,23 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path d="M 69,24 L 77,47 L 79,46 L 73,23 Z" fill="#334155" stroke="#64748b" strokeWidth="0.5" />
                  <path
                    d="M 32,52 L 32,92 L 39,92 L 48,52 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 68,52 L 68,92 L 61,92 L 52,52 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                </g>
              )}

              {/* SVG Tape Measure Overlay for active zone */}
              {coords && coords.svgPath && (
                <path
                  d={coords.svgPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeDasharray="2,2"
                  filter="url(#emeraldGlow)"
                  className="animate-pulse"
                />
              )}

              {/* Interactive Clickable Hotspots for Measurements */}
              {MeasurementLibraryService.getByGender(selectedGender === 'Enfant' ? 'Mixte' : selectedGender).map((def) => {
                const c = isFemale ? def.femaleCoords : def.maleCoords;
                const isActive = activeMeasurementKey === def.key;
                const hasValue = currentValues[def.key] !== undefined && currentValues[def.key] !== '';
                const isMandatory = mandatoryKeys.has(def.key);
                const isOptional = optionalKeys.has(def.key);

                return (
                  <g
                    key={def.key}
                    onClick={() => onSelectMeasurementKey && onSelectMeasurementKey(def.key)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring for active or mandatory item */}
                    {(isActive || isMandatory) && (
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isActive ? "5.5" : "4.5"}
                        fill="none"
                        stroke={isActive ? "#34d399" : isMandatory ? "#10b981" : "#38bdf8"}
                        strokeWidth={isActive ? "1.5" : "1"}
                        className={isActive ? "animate-ping" : "opacity-60"}
                      />
                    )}

                    {/* Point d'ancrage */}
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isActive ? "3.5" : isMandatory ? "3" : "2.2"}
                      fill={
                        isActive 
                          ? "#10b981" 
                          : isMandatory 
                          ? "#059669" 
                          : isOptional 
                          ? "#0284c7" 
                          : hasValue 
                          ? "#38bdf8" 
                          : "#64748b"
                      }
                      stroke={isActive ? "#ffffff" : isMandatory ? "#a7f3d0" : "#0f172a"}
                      strokeWidth="0.8"
                      filter={isActive ? "url(#emeraldGlow)" : undefined}
                      className="transition-all group-hover:scale-125"
                    />

                    {/* Mini Label Code */}
                    <text
                      x={c.x + (c.labelPosition === 'right' ? 4 : c.labelPosition === 'left' ? -4 : 0)}
                      y={c.y + (c.labelPosition === 'bottom' ? 4 : c.labelPosition === 'top' ? -3 : 1)}
                      textAnchor={c.labelPosition === 'right' ? 'start' : c.labelPosition === 'left' ? 'end' : 'middle'}
                      fill={isActive ? "#34d399" : isMandatory ? "#6ee7b7" : "#94a3b8"}
                      fontSize="2.6"
                      fontWeight={isActive || isMandatory ? "bold" : "normal"}
                      fontFamily="monospace"
                      className="pointer-events-none select-none transition-all"
                    >
                      {def.code}{isMandatory ? '★' : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Measurement Technique & Guide Details Column (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {activeDefinition ? (
            <motion.div
              key={activeDefinition.key}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 flex-1 flex flex-col justify-between"
            >
              {/* Header Measurement Info */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30 uppercase">
                      {activeDefinition.code}
                    </span>
                    <h4 className="text-base font-black text-white">{activeDefinition.label}</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                    Sexe : {activeDefinition.gender}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{activeDefinition.description}</p>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5 tracking-wider">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Étapes de Prise de Mesure (Pas-à-Pas)
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeDefinition.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-emerald-900/60 text-emerald-300 font-mono font-bold text-[10px] rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-emerald-700/50">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best Practices & Common Mistakes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Best Practices */}
                <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-2xl space-y-1.5">
                  <h6 className="text-[11px] font-black uppercase text-emerald-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                    Bonnes Pratiques
                  </h6>
                  <ul className="space-y-1 text-[11px] text-emerald-100/90">
                    {activeDefinition.bestPractices.map((bp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0">•</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Common Mistakes */}
                <div className="bg-rose-950/30 border border-rose-800/40 p-3.5 rounded-2xl space-y-1.5">
                  <h6 className="text-[11px] font-black uppercase text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Pièges à Éviter
                  </h6>
                  <ul className="space-y-1 text-[11px] text-rose-100/90">
                    {activeDefinition.commonMistakes.map((cm, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 shrink-0">•</span>
                        <span>{cm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Normal CM Bounds Indicator */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Plage habituelle :</span>
                <span className="text-white font-bold">
                  {activeDefinition.minNormalCm} cm à {activeDefinition.maxNormalCm} cm
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">Aucune mesure sélectionnée</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Sélectionnez un champ dans le formulaire ou cliquez directement sur les points interactifs de la silhouette pour afficher le guide d’atelier.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
