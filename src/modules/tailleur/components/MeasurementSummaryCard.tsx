import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, ChevronDown, ChevronUp, Ruler, Sparkles, 
  CheckCircle2, AlertCircle, Eye, Sliders, ExternalLink
} from 'lucide-react';
import { MeasurementDisplayService, MeasurementDisplayProfile, RenderedMeasurementItem } from '../services/MeasurementDisplayService';
import { GarmentVectorIcon } from './GarmentVectorIcon';

interface MeasurementSummaryCardProps {
  clientMeasurements?: Record<string, number | string>;
  merchantId?: string;
  preferredGarmentName?: string;
  onOpenSmartAssistant?: () => void;
  className?: string;
}

export const MeasurementSummaryCard: React.FC<MeasurementSummaryCardProps> = ({
  clientMeasurements = {},
  merchantId = 'default',
  preferredGarmentName,
  onOpenSmartAssistant,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const displayProfile: MeasurementDisplayProfile = MeasurementDisplayService.getDisplayProfile(
    clientMeasurements,
    merchantId,
    preferredGarmentName
  );

  const { garment, primaryMeasurements, secondaryMeasurements, missingMandatoryMeasurements, totalFilledCount } = displayProfile;

  const hasAnyMeasurement = totalFilledCount > 0;

  return (
    <div className={`bg-slate-50/70 rounded-2xl p-4 border border-slate-100 shadow-sm text-left transition-all ${className}`}>
      {/* Header Context Banner with Garment Badge */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <GarmentVectorIcon id={garment.id} name={garment.name} category={garment.category} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-mono font-bold text-emerald-700 uppercase tracking-widest block truncate">
              Profil : {garment.category}
            </span>
            <p className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
              <span>{garment.name}</span>
            </p>
          </div>
        </div>

        {onOpenSmartAssistant && (
          <button
            type="button"
            onClick={onOpenSmartAssistant}
            className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
            title="Lancer le Moteur Intelligent de Prise de Mesures"
          >
            <Ruler className="w-3 h-3" />
            <span className="hidden sm:inline">Mesurer</span>
          </button>
        )}
      </div>

      {/* Primary Measurements Grid (Mesures Principales) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Scissors className="w-3 h-3 text-emerald-600" />
            <span>Mesures Principales ({primaryMeasurements.length})</span>
          </h4>
          <span className="text-[9px] font-mono text-slate-400 font-semibold">
            {totalFilledCount} renseignée(s)
          </span>
        </div>

        {primaryMeasurements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {primaryMeasurements.map((m) => (
              <div 
                key={m.key} 
                className={`p-2 rounded-xl text-center border transition-all ${
                  m.isFilled 
                    ? 'bg-white border-slate-200/80 shadow-xs' 
                    : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider truncate" title={m.label}>
                  {m.shortLabel || m.label}
                </span>
                <span className={`font-mono text-xs font-black ${m.isFilled ? 'text-slate-900' : 'text-slate-400'}`}>
                  {m.value !== '—' ? `${m.value} ${m.unit}` : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Aucune mesure principale disponible
          </div>
        )}
      </div>

      {/* Missing Mandatory Alert Warning if any */}
      {missingMandatoryMeasurements.length > 0 && (
        <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200/60 rounded-xl text-[10px] text-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong>{missingMandatoryMeasurements.length} mesure(s) requise(s)</strong> manquante(s) pour {garment.name}
            </span>
          </div>
        </div>
      )}

      {/* Secondary Measurements Accordion / Drawer */}
      <AnimatePresence>
        {isExpanded && secondaryMeasurements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-slate-200/60 space-y-2 overflow-hidden"
          >
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-teal-600" />
              <span>Mesures Complémentaires ({secondaryMeasurements.length})</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {secondaryMeasurements.map((m) => (
                <div key={m.key} className="bg-white p-2 rounded-xl text-center border border-slate-200/80 shadow-xs">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider truncate" title={m.label}>
                    {m.shortLabel || m.label}
                  </span>
                  <span className="font-mono text-xs font-black text-slate-900">
                    {m.value} {m.unit}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button for Expand or Modal */}
      <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between gap-2">
        {secondaryMeasurements.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Réduire les mesures</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Mesures complémentaires (+{secondaryMeasurements.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">
            {hasAnyMeasurement ? `${totalFilledCount} mesure(s) enregistrée(s)` : 'Aucune mesure saisie'}
          </span>
        )}

        <button
          type="button"
          onClick={() => setShowDetailModal(true)}
          className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1 cursor-pointer ml-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Voir toutes les mensurations</span>
        </button>
      </div>

      {/* Detail Modal showing Full Structured Measurements */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 text-slate-900"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <GarmentVectorIcon id={garment.id} name={garment.name} category={garment.category} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Fiche Complète des Mensurations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modèle de référence : <strong className="text-emerald-400">{garment.name}</strong> ({garment.category})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Primary Section */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2 pb-1 border-b border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mesures Principales Requis pour {garment.name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {primaryMeasurements.map((m) => (
                    <div key={m.key} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold">{m.code}</span>
                      <span className="block text-xs font-bold text-slate-700 truncate">{m.label}</span>
                      <span className="text-base font-mono font-black text-slate-900 mt-1 block">
                        {m.value} {m.value !== '—' ? m.unit : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Section */}
              {secondaryMeasurements.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-2 pb-1 border-b border-teal-100">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    Mesures Complémentaires Enregistrées ({secondaryMeasurements.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {secondaryMeasurements.map((m) => (
                      <div key={m.key} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold">{m.code}</span>
                        <span className="block text-xs font-bold text-slate-700 truncate">{m.label}</span>
                        <span className="text-base font-mono font-black text-slate-900 mt-1 block">
                          {m.value} {m.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Mandatory Section if any */}
              {missingMandatoryMeasurements.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-2 pb-1 border-b border-amber-100">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Mesures Manquantes pour {garment.name} ({missingMandatoryMeasurements.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {missingMandatoryMeasurements.map((m) => (
                      <div key={m.key} className="bg-amber-50/50 p-3 rounded-2xl border border-dashed border-amber-200 opacity-70">
                        <span className="block text-[10px] font-mono text-amber-600 uppercase font-bold">{m.code}</span>
                        <span className="block text-xs font-bold text-amber-900 truncate">{m.label}</span>
                        <span className="text-sm font-mono font-bold text-amber-500 mt-1 block">Non renseigné</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Total des données enregistrées : <strong>{totalFilledCount} mesure(s)</strong>
              </span>
              {onOpenSmartAssistant && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    onOpenSmartAssistant();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Ruler className="w-4 h-4" />
                  <span>Mettre à jour avec le Moteur Intelligent</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
