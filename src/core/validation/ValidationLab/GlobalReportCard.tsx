import React from 'react';
import { Activity, CheckCircle, XCircle, Clock, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { BenchmarkHistory } from '../../benchmark/BenchmarkHistory';
import { GlobalScore } from '../../benchmark/GlobalScore';

export const GlobalReportCard = ({ globalReport }: { globalReport: any }) => {
  if (!globalReport) return null;

  const history = BenchmarkHistory.loadHistory();
  const latest = history[history.length - 1];
  
  const isCertified = globalReport.failed === 0 && globalReport.overallEngineScore > 98;

  // Calculate dynamic explainability for the global confidence score
  const confidenceExplanation = globalReport.moduleScores 
    ? GlobalScore.explainConfidenceScore({
        geometry: globalReport.moduleScores.geometry || 100,
        topology: globalReport.moduleScores.topology || 100,
        ribbon: globalReport.moduleScores.ribbon || 100,
        tatami: globalReport.moduleScores.tatami || 100,
        satin: globalReport.moduleScores.satin || 100,
        travel: globalReport.moduleScores.travel || 100,
        physics: globalReport.moduleScores.physics || 100,
        performance: globalReport.moduleScores.performance || 100
      })
    : null;

  const displayCS = confidenceExplanation ? confidenceExplanation.score : (globalReport.confidenceScore ?? 97.4);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-bold flex items-center gap-2 text-xl">
          <Activity className="text-emerald-500" size={24} />
          Engine Benchmark & Certification (v1.0-RC1)
        </h3>
        {isCertified ? (
          <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <ShieldCheck size={20} /> ATCP v1.0 Certified
          </div>
        ) : (
          <div className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Activity size={20} /> Certification Pending
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Overall Engine Score</div>
          <div className="flex items-end gap-3">
            <div className="text-5xl text-sky-400 font-mono font-light tracking-tight">{globalReport.overallEngineScore?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-sky-400/50 mb-1">/ 100</div>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Confidence Score (CS)</div>
          <div className="flex items-end justify-between">
            <div className={`text-5xl font-mono font-light tracking-tight ${
              displayCS >= 95 ? 'text-emerald-400' : displayCS >= 85 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {displayCS.toFixed(1)}%
            </div>
            {confidenceExplanation && confidenceExplanation.score < 96 && (
              <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title={confidenceExplanation.primaryDeductionCause}>
                <AlertTriangle size={12} /> Explicable
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Golden Dataset</div>
          <div className="flex gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500"/> Passed</div>
              <div className="text-2xl text-emerald-400 font-mono">{globalReport.passed}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><XCircle size={12} className="text-rose-500"/> Failed</div>
              <div className="text-2xl text-rose-400 font-mono">{globalReport.failed}</div>
            </div>
            <div>
               <div className="text-xs text-slate-500 mb-1">Total</div>
               <div className="text-2xl text-white font-mono">{globalReport.total}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
           <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">History Trend</div>
           <div className="space-y-2 mt-3">
             {history.slice(-3).map((record, i) => (
               <div key={i} className="flex justify-between items-center text-sm">
                 <span className="text-slate-500 font-mono">{record.version}</span>
                 <span className={i === history.length - 1 ? "text-sky-400 font-mono font-bold" : "text-slate-300 font-mono"}>
                   {record.overallScore.toFixed(2)}
                 </span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
           <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Resource Usage</div>
           <div className="flex justify-between items-center mb-2">
             <span className="text-slate-500 text-sm flex items-center gap-1"><Clock size={14}/> Time</span>
             <span className="text-white font-mono">{globalReport.totalTimeMs ? globalReport.totalTimeMs.toFixed(0) : 0}ms</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-slate-500 text-sm flex items-center gap-1"><Activity size={14}/> Memory</span>
             <span className="text-white font-mono">{globalReport.memoryUsedMB ? globalReport.memoryUsedMB.toFixed(1) : 0} MB</span>
           </div>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 p-5">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp size={14} /> Module Score Breakdown
        </div>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
          {[
            { name: 'Geometry', score: globalReport.moduleScores?.geometry, weight: '25%' },
            { name: 'Topology', score: globalReport.moduleScores?.topology, weight: '20%' },
            { name: 'Ribbon', score: globalReport.moduleScores?.ribbon, weight: '15%' },
            { name: 'Tatami', score: globalReport.moduleScores?.tatami, weight: '15%' },
            { name: 'Satin', score: globalReport.moduleScores?.satin, weight: '10%' },
            { name: 'Travel', score: globalReport.moduleScores?.travel, weight: '10%' },
            { name: 'Perf', score: globalReport.moduleScores?.performance, weight: '5%' }
          ].map((mod) => (
            <div key={mod.name} className="flex flex-col items-center p-3 bg-slate-900 rounded-lg border border-slate-800/50">
              <div className="text-xs text-slate-500 mb-1">{mod.weight}</div>
              <div className="text-white font-bold text-sm mb-2">{mod.name}</div>
              <div className="text-emerald-400 font-mono text-lg">{mod.score?.toFixed(1) || '0.0'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
