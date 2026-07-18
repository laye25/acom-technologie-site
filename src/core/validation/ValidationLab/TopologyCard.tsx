import React from 'react';
import { Target, ActivitySquare, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const TopologyCard = ({ result }: { result: any }) => {
  if (!result) return null;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute right-4 top-4 opacity-5 text-slate-500">
        <Target className="w-24 h-24 stroke-[4]" />
      </div>
      <div>
        <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Topology Engine</span>
        <h3 className="text-lg font-black text-white mt-1">Diagnostic Report</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 col-span-2 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</span>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-black">
              <CheckCircle2 className="w-4 h-4" /> PASS
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">TPI Score</span>
            <div className="text-xl font-black text-white">{result.tpi?.toFixed(1)}%</div>
          </div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Euler Char (χ)</span>
          <div className="text-sm font-mono text-slate-300">{result.euler}</div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Regions</span>
          <div className="text-sm font-mono text-slate-300">
             <span className="text-emerald-400">{result.islands} Is</span> / <span className="text-rose-400">{result.preservedHoles} Ho</span>
          </div>
        </div>
        <div className="hidden">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</span>
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-black">
            <CheckCircle2 className="w-4 h-4" /> PASS
          </div>
        </div>
      </div>
    </div>
  );
};
