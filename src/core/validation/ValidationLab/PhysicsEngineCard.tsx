import React from 'react';
import { Target, ActivitySquare, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

export const PhysicsEngineCard = ({ result }: { result: any }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="absolute -right-4 -top-4 text-slate-800/20 group-hover:text-slate-800/40 transition-colors">
        <Cpu className="w-24 h-24 stroke-[4]" />
      </div>
      <div>
        <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Physics Engine</span>
        <h3 className="text-lg font-black text-white mt-1">Metrics (WIP)</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Push Comp</span>
          <div className="flex items-center gap-1.5 text-slate-400 text-sm font-black">
             <span>-- mm</span>
          </div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Pull Comp</span>
          <div className="flex items-center gap-1.5 text-slate-400 text-sm font-black">
             <span>-- mm</span>
          </div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Fabric Stretch</span>
          <div className="flex items-center gap-1.5 text-slate-400 text-sm font-black">
             <span>-- %</span>
          </div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</span>
          <div className="flex items-center gap-1.5 text-amber-500 text-sm font-black">
             <AlertTriangle className="w-4 h-4" /> PENDING
          </div>
        </div>
      </div>
    </div>
  );
};
