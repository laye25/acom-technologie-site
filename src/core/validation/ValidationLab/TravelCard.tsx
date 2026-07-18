import React from 'react';
import { Target, ActivitySquare, CheckCircle2, Navigation, Scissors, Maximize2, Zap } from 'lucide-react';

export const TravelCard = ({ result }: { result: any }) => {
  if (!result) return null;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Navigation className="text-amber-500" size={20} />
          Travel Optimizer v1
        </h3>
        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">
          SPR-006
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <Target size={12} /> Travel Score
          </div>
          <div className="text-xl text-white font-mono">
            {result.travelScore ? result.travelScore.toFixed(2) : '--'}%
          </div>
        </div>
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <ActivitySquare size={12} /> TSP Cost
          </div>
          <div className="text-xl text-white font-mono">
            {result.tspCost ? result.tspCost.toFixed(0) : '--'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <Scissors size={12} /> Trim Count
          </div>
          <div className="text-xl text-emerald-400 font-mono font-bold">
            {result.trimCount !== undefined ? result.trimCount : '--'}
          </div>
        </div>
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <Maximize2 size={12} /> Jump Count
          </div>
          <div className="text-xl text-emerald-400 font-mono font-bold">
            {result.jumpCount !== undefined ? result.jumpCount : '--'}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
         <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 flex-1">
          <div className="text-slate-400 text-[10px] uppercase mb-1">Thread Length</div>
          <div className="text-sm text-white font-mono">
            {result.threadLength ? (result.threadLength/1000).toFixed(2) + 'm' : '--'}
          </div>
        </div>
        <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 flex-1">
          <div className="text-slate-400 text-[10px] uppercase mb-1">Machine Time</div>
          <div className="text-sm text-white font-mono">
            {result.machineTime ? (result.machineTime/60).toFixed(1) + 'min' : '--'}
          </div>
        </div>
        <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 flex-1">
          <div className="text-slate-400 text-[10px] uppercase mb-1">Entry Quality</div>
          <div className="text-sm text-white font-mono flex items-center gap-1">
             {result.entryQuality ? result.entryQuality.toFixed(1) + '%' : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};
