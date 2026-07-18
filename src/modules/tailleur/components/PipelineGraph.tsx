import React from 'react';
import { GitBranch, Activity, Layers, Play, Settings, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PipelineGraphProps {
  selectedPipelineStage: 'geom' | 'topo' | 'ribbon' | 'tatami' | 'travel' | 'dst';
  setSelectedPipelineStage: (stage: 'geom' | 'topo' | 'ribbon' | 'tatami' | 'travel' | 'dst') => void;
  benchmarkResults: any;
  currentMotif: any;
}

export const PipelineGraph: React.FC<PipelineGraphProps> = ({
  selectedPipelineStage,
  setSelectedPipelineStage,
  benchmarkResults,
  currentMotif
}) => {
  const result = benchmarkResults?.[currentMotif.name];

  const getMetricForStage = (stageId: string) => {
    if (!result) return '---';
    if (stageId === 'geom') return `${result.geom.gfi.toFixed(0)}% GFI`;
    if (stageId === 'topo') return `${result.topo.tpi.toFixed(0)}% TPI`;
    if (stageId === 'ribbon') {
      return currentMotif.type === 'Ribbon' || currentMotif.type === 'Mixed'
        ? `${result.ribbon.confidenceScore.toFixed(0)}% MAT`
        : 'N/A';
    }
    if (stageId === 'tatami') return `${result.tatami.score.toFixed(0)}% DENS`;
    if (stageId === 'travel') return `${result.travel.score.toFixed(0)}% TSP`;
    if (stageId === 'dst') return `${result.dst.score.toFixed(0)}% BIN`;
    return '---';
  };

  const getConfidenceColor = (stageId: string) => {
    if (!result) return 'text-slate-500 border-slate-800 bg-slate-900/40';
    let val = 100;
    if (stageId === 'geom') val = result.geom.gfi;
    if (stageId === 'topo') val = result.topo.tpi;
    if (stageId === 'ribbon') {
      val = currentMotif.type === 'Ribbon' || currentMotif.type === 'Mixed'
        ? result.ribbon.confidenceScore
        : 100;
    }
    if (stageId === 'tatami') val = result.tatami.score;
    if (stageId === 'travel') val = result.travel.score;
    if (stageId === 'dst') val = result.dst.score;

    if (val >= 90) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5 animate-pulse';
  };

  const nodes = [
    { id: 'geom', name: 'Geometry', desc: 'RDP & Lissage', row: 1, col: 1 },
    { id: 'topo', name: 'Topology', desc: 'Isomorphisme', row: 1, col: 2 },
    { id: 'ribbon', name: 'Ribbon', desc: 'Solveur MAT', row: 1, col: 3 },
    { id: 'tatami', name: 'Tatami', desc: 'Génération', row: 1, col: 4 },
    { id: 'travel', name: 'Travel Path', desc: 'Optimisation', row: 1, col: 5 },
    { id: 'dst', name: 'DST Export', desc: 'Binaire DST', row: 1, col: 6 },
  ];

  return (
    <div className="bg-slate-950/80 border border-slate-850 p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">
            Graphe de Validation Non-Linéaire (DAG Pipeline)
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Cliquez sur un nœud pour afficher ses métriques</span>
      </div>

      {/* Visual interactive DAG representation */}
      <div className="relative p-2 overflow-x-auto">
        <div className="min-w-[640px] flex items-center justify-between gap-1 relative z-10">
          {nodes.map((node, idx) => {
            const isSelected = selectedPipelineStage === node.id;
            const metric = getMetricForStage(node.id);
            const confidenceStyle = getConfidenceColor(node.id);
            const isCritical = confidenceStyle.includes('rose-400');

            return (
              <React.Fragment key={node.id}>
                <button
                  onClick={() => setSelectedPipelineStage(node.id as any)}
                  className={`relative flex-1 p-3 rounded-xl border text-left transition-all group ${
                    isSelected
                      ? 'bg-violet-600/10 border-violet-500 text-white ring-1 ring-violet-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {/* Pulse aura if critical */}
                  {isCritical && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )}

                  <div className="text-[9px] uppercase font-mono text-slate-500 flex justify-between items-center">
                    <span>NŒUD {idx + 1}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>}
                  </div>
                  
                  <div className="text-xs font-black text-slate-100 mt-1 line-clamp-1">{node.name}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5 line-clamp-1">{node.desc}</div>

                  <div className={`mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block ${confidenceStyle}`}>
                    {metric}
                  </div>
                </button>

                {idx < nodes.length - 1 && (
                  <div className="flex-shrink-0 w-4 flex items-center justify-center relative">
                    {/* Pulsing connection arrow */}
                    <svg className="w-4 h-4 text-slate-700 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Relational Validators (Geometry Validator & Ribbon Validator) as siblings below */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-slate-200">Geometry Validator</span>
              <p className="text-[10px] text-slate-400">Double validation Hausdorff vs RMS</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            result?.geom?.gfi >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {result ? `${result.geom.gfi.toFixed(1)}% GFI` : '---'}
          </span>
        </div>

        <div className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <div>
              <span className="font-bold text-slate-200">Ribbon Validator</span>
              <p className="text-[10px] text-slate-400">Analyse de miter & chevauchement</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            !result || currentMotif.type === 'Topology' ? 'bg-slate-800 text-slate-500' :
            result.ribbon.confidenceScore >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {result && currentMotif.type !== 'Topology' ? `${result.ribbon.confidenceScore.toFixed(1)}% MAT` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
