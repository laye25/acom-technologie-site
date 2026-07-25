import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, CheckCircle2, ShieldAlert, 
  Info, Sparkles, Activity
} from 'lucide-react';
import { ValidationResult } from '../services/MeasurementValidationService';

interface MeasurementValidatorProps {
  validationResult: ValidationResult;
  onFixField?: (fieldKey: string) => void;
}

export const MeasurementValidator: React.FC<MeasurementValidatorProps> = ({
  validationResult,
  onFixField
}) => {
  const { score, alerts, missingMandatoryKeys, isValid } = validationResult;

  if (alerts.length === 0 && isValid) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-950">Mesures Parfaitement Cohérentes</h4>
            <p className="text-[11px] text-emerald-700 font-medium">
              Toutes les mesures requises sont saisies et respectent les proportions anatomiques.
            </p>
          </div>
        </div>
        <div className="bg-emerald-600 text-white font-mono text-xs font-black px-3 py-1 rounded-xl shadow-sm shrink-0">
          100% Cohérence
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-left">
      {/* Header Score Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Analyseur de Cohérence Anatomique
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono">Score :</span>
          <span
            className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl text-white ${
              score >= 80
                ? 'bg-emerald-600'
                : score >= 50
                ? 'bg-amber-500'
                : 'bg-rose-600'
            }`}
          >
            {score}%
          </span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            onClick={() => onFixField && onFixField(alt.fieldKey)}
            className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 transition cursor-pointer hover:shadow-sm ${
              alt.severity === 'error'
                ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                : alt.severity === 'warning'
                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                : 'bg-sky-50/90 border-sky-200 text-sky-950'
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              {alt.severity === 'error' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : alt.severity === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="font-extrabold text-[11px] leading-tight">
                  {alt.fieldLabel} : {alt.message}
                </p>
                <p className="text-[10px] opacity-80 mt-0.5">{alt.recommendation}</p>
              </div>
            </div>

            {onFixField && (
              <span className="text-[9px] font-black uppercase text-slate-600 bg-white/80 border px-2 py-0.5 rounded-md shrink-0">
                Corriger
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
