import React from 'react';
import { Activity, Clock } from 'lucide-react';

export const PipelineTimeline = ({ result }: { result: any }) => {
  if (!result || !result.report || !result.report.performance) return null;
  
  const perf = result.report.performance;
  const passes = Object.keys(perf.passes);
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Activity className="text-sky-500" size={20} />
          Performance Profiling
        </h3>
        <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-1 rounded-full border border-sky-500/20 flex items-center gap-1">
          <Clock size={10} /> {perf.totalMs.toFixed(1)} ms
        </span>
      </div>
      
      <div className="space-y-2">
        {passes.map((passName, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
             <div className="text-sm text-slate-300 font-medium">{passName.replace('Pass', '')} Engine</div>
             <div className="text-sm text-white font-mono">{perf.passes[passName].toFixed(2)} ms</div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase text-slate-500 mb-1">Max Memory</div>
          <div className="text-lg text-white font-mono flex items-center gap-1">
            24.5 MB <span className="text-xs text-slate-600">(simulated)</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500 mb-1">Peak Allocations</div>
          <div className="text-lg text-white font-mono flex items-center gap-1">
            1.2K <span className="text-xs text-slate-600">(simulated)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
