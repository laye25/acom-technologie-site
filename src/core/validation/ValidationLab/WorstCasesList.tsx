import React from 'react';
import { AlertOctagon, TrendingDown, Clock, ShieldAlert } from 'lucide-react';

export const WorstCasesList = ({ results }: { results: any }) => {
  if (!results || !results.globalReport) return null;
  
  const worstCases = results.globalReport.worstCases;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <AlertOctagon className="text-rose-500" size={20} />
          Worst Cases (Failure Database)
        </h3>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">Top 10</span>
      </div>
      
      <div className="space-y-3">
        {worstCases.map((wc: any, idx: number) => (
          <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between hover:border-rose-500/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-500 font-mono">
                {idx + 1}
              </div>
              <div>
                <div className="text-sm text-white font-medium group-hover:text-rose-400 transition-colors">
                  {wc.id}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${wc.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {wc.status}
                  </span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {wc.executionTimeMs.toFixed(1)}ms</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-mono font-bold text-white">
                {wc.overallScore.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-500 uppercase mt-0.5">Overall Score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
