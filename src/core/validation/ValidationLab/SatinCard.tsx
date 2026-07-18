import React from 'react';
import { Activity, LayoutTemplate, Layers } from 'lucide-react';

export const SatinCard = ({ result }: { result: any }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-fuchsia-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Layers className="text-fuchsia-500" size={20} />
          Satin Engine v2
        </h3>
        <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 px-2 py-1 rounded-full border border-fuchsia-500/20">
          SPR-005
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <Activity size={12} /> Satin Fidelity (SFS)
          </div>
          <div className="text-xl text-white font-mono">
            {result ? result.satinFidelityScore.toFixed(2) : '--'}%
          </div>
        </div>
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <LayoutTemplate size={12} /> Width Fidelity
          </div>
          <div className="text-xl text-white font-mono">
            {result ? result.widthFidelity.toFixed(2) : '--'}%
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
         <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex-1">
          <div className="text-slate-400 text-xs mb-1">Needle Angle Smoothness</div>
          <div className="text-lg text-white font-mono">
            {result ? result.needleAngleSmoothness.toFixed(3) : '--'}
          </div>
        </div>
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex-1">
          <div className="text-slate-400 text-xs mb-1">Overlap Rate</div>
          <div className="text-lg text-white font-mono">
            {result ? result.overlapRate.toFixed(4) : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};
