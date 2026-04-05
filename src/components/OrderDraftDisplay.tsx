import React from 'react';
import { Sparkles, CheckCircle2, Clock, Lightbulb, ListChecks, Flag } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderDraftDisplayProps {
  draft: {
    title: string;
    objectives: string[];
    specifications: string[];
    complexity: string;
    duration: string;
    phases: string[];
    recommendations: string[];
  };
}

export const OrderDraftDisplay: React.FC<OrderDraftDisplayProps> = ({ draft }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-50/50 via-white to-primary/5 rounded-[2.5rem] border border-indigo-100 shadow-xl shadow-indigo-500/5 overflow-hidden"
    >
      <div className="p-8 border-b border-indigo-100 bg-white/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Cahier des Charges</h3>
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Analyse de votre besoin par notre équipe technique</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* Title & Overview */}
        <div>
          <h4 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{draft.title}</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center px-4 py-2 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <Flag className="w-4 h-4 text-indigo-600 mr-2" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Complexité: </span>
              <span className="text-xs font-black text-indigo-600 ml-2 uppercase">{draft.complexity}</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <Clock className="w-4 h-4 text-indigo-600 mr-2" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Durée estimée: </span>
              <span className="text-xs font-black text-indigo-600 ml-2 uppercase">{draft.duration}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Objectives */}
          <div className="space-y-4">
            <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Objectifs Clés
            </h5>
            <ul className="space-y-3">
              {draft.objectives.map((obj, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-3 bg-white/50 p-3 rounded-xl border border-indigo-50">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-indigo-600" />
              Spécifications Techniques
            </h5>
            <ul className="space-y-3">
              {draft.specifications.map((spec, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-3 bg-white/50 p-3 rounded-xl border border-indigo-50">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" />
                  {spec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Phases du Projet
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {draft.phases.map((phase, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl font-black text-indigo-900">{i + 1}</span>
                </div>
                <p className="text-xs font-bold text-gray-700 relative z-10">{phase}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200">
          <h5 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5" />
            Recommandations Stratégiques
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {draft.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 shrink-0" />
                <p className="text-xs font-medium leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
