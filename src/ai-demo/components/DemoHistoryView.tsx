// src/ai-demo/components/DemoHistoryView.tsx
// Audit trail history of all generated video demos, events recorded, and exports

import React from 'react';
import { DemoProject } from '../types';
import { Clock, Play, FileText, CheckCircle2, History } from 'lucide-react';

interface DemoHistoryViewProps {
  projects: DemoProject[];
  onSelectProject: (p: DemoProject) => void;
}

export const DemoHistoryView: React.FC<DemoHistoryViewProps> = ({ projects, onSelectProject }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Historique des Générations</h2>
            <p className="text-xs text-slate-500">Journal d'audit horodaté de toutes les vidéos et documentations produites</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded">
                      {project.moduleName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(project.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{project.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{project.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Généré</span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(project);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Revoir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
