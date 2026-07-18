import React from 'react';
import { Target, ActivitySquare, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { RibbonMetrics } from '../../ribbon/types';

export const RibbonCard = ({ result }: { result?: RibbonMetrics }) => {
  if (!result) return null;
  
  const score = (result.continuity * 100).toFixed(1);
  const widthErr = result.widthError.toFixed(2);
  const crossings = result.railCrossings;
  const smoothness = result.smoothness.toFixed(3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute right-4 top-4 opacity-5 text-slate-500">
        <Target className="w-24 h-24 stroke-[4]" />
      </div>
      <div>
        <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Ribbon Engine</span>
        <h3 className="text-lg font-black text-white mt-1">Score: {score}%</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
        
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Continuity</span>
          <div className="flex items-center gap-1.5 text-slate-100 text-sm font-black">
            {result.continuity === 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {(result.continuity * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Width Err</span>
          <div className="flex items-center gap-1.5 text-slate-100 text-sm font-black">
            <ActivitySquare className="w-4 h-4 text-emerald-400" /> {widthErr} mm
          </div>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Rail Cross</span>
          <div className="flex items-center gap-1.5 text-slate-100 text-sm font-black">
             {crossings === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-500" />}
             {crossings} X
          </div>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Smoothness</span>
          <div className="text-slate-100 text-sm font-black">
            {smoothness}
          </div>
        </div>

      </div>
    </div>
  );
};
