import React from 'react';
import { Target, ActivitySquare, CheckCircle2, XCircle, FileCode } from 'lucide-react';

export const MachineBackendCard = ({ result, pesResult }: { result: any, pesResult?: any }) => {
  if (!result) return null;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute right-4 top-4 opacity-5 text-slate-500">
        <Target className="w-24 h-24 stroke-[4]" />
      </div>
      <div>
        <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">Machine Backends</span>
        <h3 className="text-lg font-black text-white mt-1">Export Generation</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Tajima DST</span>
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-black">
                <CheckCircle2 className="w-4 h-4" /> GENERATED
             </div>
             <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
                <FileCode size={12}/> {result.bytes ? (result.bytes / 1024).toFixed(1) : '0'} KB
             </div>
          </div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Brother PES</span>
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-black">
                <CheckCircle2 className="w-4 h-4" /> GENERATED
             </div>
             <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
                <FileCode size={12}/> {pesResult?.bytes ? (pesResult.bytes / 1024).toFixed(1) : '0'} KB
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
