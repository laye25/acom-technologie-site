import React, { useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, BrainCircuit, History, ArrowRight, Star } from 'lucide-react';

interface AeosLearningEngineProps {
  pendingValidations: any[];
  onValidate: (validationId: string) => void;
  onReject: (validationId: string) => void;
}

const EvidenceStrengthStars = ({ strength = 1 }: { strength?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star} 
          className={`w-3 h-3 ${star <= strength ? 'fill-amber-400 text-amber-400' : 'fill-slate-800 text-slate-700'}`} 
        />
      ))}
    </div>
  );
};

export const AeosLearningEngine: React.FC<AeosLearningEngineProps> = ({
  pendingValidations,
  onValidate,
  onReject
}) => {
  const [isCommitting, setIsCommitting] = useState<Record<string, boolean>>({});

  const handleCommit = async (validation: any) => {
    setIsCommitting(prev => ({ ...prev, [validation.id]: true }));
    
    try {
      const { ApplicationCommandBus } = await import('../../../application/ApplicationCommandBus');
      await ApplicationCommandBus.dispatch({
        type: 'EKLE_LEARN',
        payload: {
          sourceId: 'user_validation',
          sourceName: validation.semanticObj.className.toUpperCase(),
          layers: [{ points: validation.points, id: validation.layerId }]
        }
      });
      onValidate(validation.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommitting(prev => ({ ...prev, [validation.id]: false }));
    }
  };

  return (
    <div id="aeos-learning-engine-container" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Interface d'Entraînement (EKLE)</h4>
            <p className="text-[10px] text-gray-400">Validez les déductions pour enrichir la base de connaissances (Objets, Lois, Paramètres).</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono font-bold">
          EKLE ENGINE
        </span>
      </div>

      <div className="space-y-4">
        {pendingValidations.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-850">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-400">Aucune déduction sémantique en attente.</p>
            <p className="text-[10px] text-gray-500 mt-1">Importez un SVG ou une image pour que l'IA détecte des formes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingValidations.map(v => (
              <div key={v.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-1">
                      Déduction de l'IA
                    </span>
                    <h5 className="text-sm font-bold text-white">
                      Forme : <span className="text-violet-400">{v.semanticObj.className}</span>
                    </h5>
                    <p className="text-xs text-gray-400 mt-1 mb-2">
                      Recommandation : {v.semanticObj.suggestedStitchType}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-gray-500 font-mono">Force de la Preuve:</span>
                      <EvidenceStrengthStars strength={v.semanticObj.confidence > 0.95 ? 3 : (v.semanticObj.confidence > 0.8 ? 2 : 1)} />
                    </div>
                  </div>
                  <div className="bg-violet-500/10 text-violet-400 px-2 py-1 rounded text-[10px] font-mono font-bold border border-violet-500/20">
                    {(v.semanticObj.confidence * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-800/50 flex gap-2">
                  <button
                    onClick={() => handleCommit(v)}
                    disabled={isCommitting[v.id]}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isCommitting[v.id] ? (
                      <span className="animate-spin">🔄</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valider (EKLE)
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onReject(v.id)}
                    className="px-3 bg-slate-800 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-lg py-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
