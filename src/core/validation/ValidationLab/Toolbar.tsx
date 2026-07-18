import React from 'react';
import { ShieldCheck, Activity, BarChart2, Video, Award } from 'lucide-react';

export const Toolbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: any) => void }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="text-primary" />
          ATCP Validation Lab
        </h2>
        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1 border border-emerald-500/30">
          <ShieldCheck size={14} />
          Phase 1.0 Certified
        </div>
      </div>
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button 
          onClick={() => setActiveTab('wall')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'wall' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Engine Wall
        </button>
        <button 
          onClick={() => setActiveTab('benchmark')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'benchmark' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <BarChart2 size={16} /> Benchmark
        </button>
        <button 
          onClick={() => setActiveTab('stress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'stress' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Video size={16} /> Stress Test
        </button>
        <button 
          onClick={() => setActiveTab('certification')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'certification' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Award size={16} className="text-emerald-400" /> Certification
        </button>
      </div>
    </div>
  );
};

