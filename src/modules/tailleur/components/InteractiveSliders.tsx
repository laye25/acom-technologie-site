import React from 'react';
import { Sliders, RefreshCw, AlertTriangle, Lightbulb, CheckCircle2, ShieldAlert } from 'lucide-react';

interface InteractiveSlidersProps {
  currentMotif: any;
  customParams: Record<string, {
    rdpTolerance: number;
    resamplingMin: number;
    resamplingMax: number;
    cornerMiter: number;
    stitchDensity: number;
    overlapMargin: number;
  }>;
  updateParam: (motifName: string, key: string, value: number) => void;
  benchmarkResults: any;
  selectedPipelineStage: string;
  onApply: () => void;
  isCorrected: Record<string, boolean>;
  setIsCorrected: (val: Record<string, boolean>) => void;
}

export const InteractiveSliders: React.FC<InteractiveSlidersProps> = ({
  currentMotif,
  customParams,
  updateParam,
  benchmarkResults,
  selectedPipelineStage,
  onApply,
  isCorrected,
  setIsCorrected
}) => {
  const result = benchmarkResults?.[currentMotif.name];
  const params = customParams[currentMotif.name] || {
    rdpTolerance: isCorrected[currentMotif.name] ? 0.05 : 0.15,
    resamplingMin: 1.2,
    resamplingMax: 4.0,
    cornerMiter: 2.5,
    stitchDensity: 4.25,
    overlapMargin: 0.85
  };

  // Generate real anomalies based on results
  const getAnomalies = () => {
    const list = [];
    if (!result) return list;

    if (result.geom.noiseIndex > 0.15) {
      list.push({
        title: 'Bruit Haute Fréquence détecté',
        val: `${(result.geom.noiseIndex * 100).toFixed(1)}% des sommets`,
        type: 'danger'
      });
    }
    if (result.geom.selfIntersectionCount > 0) {
      list.push({
        title: "Auto-intersection d'arêtes",
        val: `${result.geom.selfIntersectionCount} points critiques`,
        type: 'danger'
      });
    }
    if (currentMotif.type === 'Ribbon' || currentMotif.type === 'Mixed') {
      if (result.ribbon.selfIntersections > 0) {
        list.push({
          title: 'Repliements de Rails (Overlap)',
          val: `${result.ribbon.selfIntersections} intersections`,
          type: 'danger'
        });
      }
    }
    if (result.geom.surfaceError > 200) {
      list.push({
        title: 'Perte significative de Surface',
        val: `${result.geom.surfaceError.toFixed(0)} mm² d'écart`,
        type: 'warning'
      });
    }
    if (result.geom.curvatureError > 1.5) {
      list.push({
        title: 'Instabilité de Courbure C¹',
        val: `Δ: ${result.geom.curvatureError.toFixed(2)} rad/mm`,
        type: 'warning'
      });
    }

    if (list.length === 0) {
      list.push({
        title: 'Aucune anomalie critique détectée',
        val: 'Sain',
        type: 'success'
      });
    }
    return list;
  };

  // Calculate physical risks based on actual results and parameters
  const getPhysicalRisks = () => {
    if (!result) return { needleBreak: 'Low', threadTearing: 'Low', puckering: 'Low', looseStitches: 'Low' };

    const selfInter = result.geom.selfIntersectionCount + (result.ribbon?.selfIntersections || 0);
    const spacing = params.resamplingMin;
    const density = params.stitchDensity;

    return {
      needleBreak: selfInter > 0 ? 'CRITICAL' : (params.cornerMiter < 1.8 ? 'HIGH' : 'LOW'),
      threadTearing: spacing < 0.8 ? 'CRITICAL' : (result.geom.noiseIndex > 0.2 ? 'HIGH' : 'LOW'),
      puckering: density > 6.0 ? 'CRITICAL' : (density > 5.0 ? 'HIGH' : 'LOW'),
      looseStitches: params.resamplingMax > 6.0 ? 'HIGH' : 'LOW'
    };
  };

  // Build expert advice dynamically based on active issues
  const getExpertSuggestions = () => {
    const advice = [];
    if (!result) return advice;

    const risks = getPhysicalRisks();

    if (risks.needleBreak === 'CRITICAL' || risks.needleBreak === 'HIGH') {
      advice.push({
        icon: '✓',
        text: "Augmentez le 'Miter Ratio' (limiteur d'angle aigu) à au moins 2.5 pour amortir les coins pointus de ribbon."
      });
    }
    if (risks.threadTearing === 'CRITICAL' || risks.threadTearing === 'HIGH') {
      advice.push({
        icon: '✓',
        text: "Augmentez l'échantillonnage minimal à 1.2 mm pour éviter que les points d'aiguille ne se chevauchent sur la même coordonnée."
      });
    }
    if (risks.puckering === 'CRITICAL' || risks.puckering === 'HIGH') {
      advice.push({
        icon: '✓',
        text: "Réduisez la densité de point à 4.2 pts/mm² pour éliminer les tensions sur le tissu et les plissements."
      });
    }
    if (result.geom.noiseIndex > 0.15) {
      advice.push({
        icon: '✓',
        text: "Augmentez l'Epsilon RDP à 0.18 mm pour filtrer le bruit géométrique haute fréquence sans modifier la surface."
      });
    }

    if (advice.length === 0) {
      advice.push({
        icon: '✓',
        text: "Tous les paramètres physiques sont parfaitement équilibrés pour de la broderie industrielle haut de gamme."
      });
    }
    return advice;
  };

  const anomalies = getAnomalies();
  const risks = getPhysicalRisks();
  const suggestions = getExpertSuggestions();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-black uppercase text-white tracking-wider">Ajustements CAD/CAM</h3>
        </div>
        <button
          onClick={() => {
            // Reset to default
            updateParam(currentMotif.name, 'rdpTolerance', 0.15);
            updateParam(currentMotif.name, 'resamplingMin', 1.2);
            updateParam(currentMotif.name, 'resamplingMax', 4.0);
            updateParam(currentMotif.name, 'cornerMiter', 2.5);
            updateParam(currentMotif.name, 'stitchDensity', 4.25);
            updateParam(currentMotif.name, 'overlapMargin', 0.85);
            const nextState = { ...isCorrected, [currentMotif.name]: false };
            setIsCorrected(nextState);
            setTimeout(() => onApply(), 50);
          }}
          className="text-[10px] text-slate-400 hover:text-slate-200 underline font-semibold"
        >
          Réinitialiser
        </button>
      </div>

      {/* Manual parameter adjusters */}
      <div className="space-y-4">
        {/* RDP Tolerance Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Tolérance RDP (Epsilon)</span>
            <span className="font-mono text-violet-400 font-extrabold">{params.rdpTolerance.toFixed(3)} mm</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.50"
            step="0.01"
            value={params.rdpTolerance}
            onChange={(e) => updateParam(currentMotif.name, 'rdpTolerance', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-sans">
            <span>Fidélité maximale (0.01)</span>
            <span>Lissage maximal (0.50)</span>
          </div>
        </div>

        {/* Resampling Min Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Espacement Minimal des Points</span>
            <span className="font-mono text-violet-400 font-extrabold">{params.resamplingMin.toFixed(2)} mm</span>
          </div>
          <input
            type="range"
            min="0.50"
            max="3.00"
            step="0.10"
            value={params.resamplingMin}
            onChange={(e) => updateParam(currentMotif.name, 'resamplingMin', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        {/* Resampling Max Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Espacement Maximal des Points</span>
            <span className="font-mono text-violet-400 font-extrabold">{params.resamplingMax.toFixed(2)} mm</span>
          </div>
          <input
            type="range"
            min="2.00"
            max="8.00"
            step="0.20"
            value={params.resamplingMax}
            onChange={(e) => updateParam(currentMotif.name, 'resamplingMax', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        {/* Corner Miter Limit Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Limiteur de Mitre d'Angle</span>
            <span className="font-mono text-violet-400 font-extrabold">{params.cornerMiter.toFixed(1)} ratio</span>
          </div>
          <input
            type="range"
            min="1.00"
            max="5.00"
            step="0.50"
            value={params.cornerMiter}
            onChange={(e) => updateParam(currentMotif.name, 'cornerMiter', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        {/* Stitch Density Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Densité de Point de Remplissage</span>
            <span className="font-mono text-violet-400 font-extrabold">{params.stitchDensity.toFixed(2)} pts/mm²</span>
          </div>
          <input
            type="range"
            min="1.00"
            max="10.00"
            step="0.25"
            value={params.stitchDensity}
            onChange={(e) => updateParam(currentMotif.name, 'stitchDensity', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        {/* Overlap Margin Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Marge d'Overlap de Sécurité</span>
            <span className="font-mono text-violet-400 font-extrabold">{params.overlapMargin.toFixed(2)} mm</span>
          </div>
          <input
            type="range"
            min="0.10"
            max="2.50"
            step="0.05"
            value={params.overlapMargin}
            onChange={(e) => updateParam(currentMotif.name, 'overlapMargin', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        <button
          onClick={onApply}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-violet-500/20 flex items-center justify-center gap-2 transition-all mt-4"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Appliquer & Recalculer
        </button>
      </div>

      {/* Transparent Diagnostic: Anomaly Report */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Anomalies Structurelles Détectées</span>
        </div>
        <div className="space-y-2">
          {anomalies.map((an, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                an.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                an.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {an.type === 'danger' || an.type === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="font-bold">{an.title}</span>
              </div>
              <span className="font-mono text-[10px] opacity-80">{an.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Physical Impact Audit */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
          <span>Rapport d'Impact Physico-Mécanique</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col justify-between">
            <span className="text-slate-500">Casse d'aiguille</span>
            <span className={`font-extrabold mt-1 text-xs ${
              risks.needleBreak === 'CRITICAL' ? 'text-rose-500 animate-pulse' :
              risks.needleBreak === 'HIGH' ? 'text-amber-500' : 'text-emerald-400'
            }`}>
              {risks.needleBreak}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col justify-between">
            <span className="text-slate-500">Déchirure de fil</span>
            <span className={`font-extrabold mt-1 text-xs ${
              risks.threadTearing === 'CRITICAL' ? 'text-rose-500 animate-pulse' :
              risks.threadTearing === 'HIGH' ? 'text-amber-500' : 'text-emerald-400'
            }`}>
              {risks.threadTearing}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col justify-between">
            <span className="text-slate-500">Plissements tissu</span>
            <span className={`font-extrabold mt-1 text-xs ${
              risks.puckering === 'CRITICAL' ? 'text-rose-500' :
              risks.puckering === 'HIGH' ? 'text-amber-500' : 'text-emerald-400'
            }`}>
              {risks.puckering}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col justify-between">
            <span className="text-slate-500">Boucles lâches</span>
            <span className={`font-extrabold mt-1 text-xs ${
              risks.looseStitches === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {risks.looseStitches}
            </span>
          </div>
        </div>
      </div>

      {/* Sartorial / Expert Suggestions */}
      <div className="border-t border-slate-800 pt-4 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Suggestions de Remédiation</span>
        </div>
        <div className="space-y-1.5">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="flex gap-2 text-[10.5px] leading-relaxed text-slate-300">
              <span className="text-violet-400 font-bold">{sug.icon}</span>
              <span>{sug.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
