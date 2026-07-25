// src/ai-demo/inspector/TimelineViewer.tsx
import React from 'react';
import { SaiTimelineStep } from '../types';
import { Play, ZoomIn, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

interface TimelineViewerProps {
  steps: SaiTimelineStep[];
  onSelectStepForReplay?: (stepIndex: number) => void;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ steps, onSelectStepForReplay }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
        Aucune étape de scénario applicatif enregistrée.
      </div>
    );
  }

  const totalDuration = steps.reduce((acc, s) => acc + (s.durationSec || 2), 0);

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Timeline Pédagogique du SAI</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <span>{steps.length} Étapes</span>
          <span>Durée Totale: {totalDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Step Sequence */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {steps.map((step, idx) => (
          <div
            key={step.id || idx}
            className="p-3.5 bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all space-y-2 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 font-mono font-bold text-xs border border-blue-500/30">
                  {step.stepNumber || idx + 1}
                </span>
                <h4 className="font-semibold text-slate-200 text-xs group-hover:text-blue-300 transition-colors">
                  {step.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {onSelectStepForReplay && (
                  <button
                    onClick={() => onSelectStepForReplay(idx)}
                    className="px-2 py-1 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 text-[10px] font-medium border border-blue-800/60 flex items-center gap-1 transition-colors"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" /> Rejouer
                  </button>
                )}
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {step.durationSec}s
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 pl-8 leading-relaxed">{step.description}</p>

            <div className="pl-8 pt-1 flex flex-wrap items-center gap-2 text-[10px]">
              {step.intent && (
                <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  Intention: {step.intent}
                </span>
              )}
              {step.zoomLevel && step.zoomLevel > 1 && (
                <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 flex items-center gap-1">
                  <ZoomIn className="h-2.5 w-2.5" /> Zoom {step.zoomLevel}x
                </span>
              )}
              {step.effectOverlay && step.effectOverlay !== 'none' && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Effet: {step.effectOverlay}
                </span>
              )}
            </div>

            {(step.proAdvice || step.timeSavingTip) && (
              <div className="ml-8 mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] space-y-1">
                {step.proAdvice && (
                  <div className="text-amber-400/90 flex items-start gap-1.5">
                    <span className="font-semibold shrink-0">💡 Conseil Pro:</span>
                    <span>{step.proAdvice}</span>
                  </div>
                )}
                {step.timeSavingTip && (
                  <div className="text-emerald-400/90 flex items-start gap-1.5">
                    <span className="font-semibold shrink-0">⚡ Astuce Gains de Temps:</span>
                    <span>{step.timeSavingTip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
