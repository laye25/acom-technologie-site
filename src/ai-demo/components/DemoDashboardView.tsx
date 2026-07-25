// src/ai-demo/components/DemoDashboardView.tsx
// Dashboard showing total videos, duration, active languages, exports, and recent demos

import React from 'react';
import { DemoProject } from '../types';
import { Video, Clock, Globe, Download, Play, Plus, Sparkles, TrendingUp, Layers, FileText } from 'lucide-react';

interface DemoDashboardViewProps {
  projects: DemoProject[];
  onSelectProject: (p: DemoProject) => void;
  onCreateNew: () => void;
}

export const DemoDashboardView: React.FC<DemoDashboardViewProps> = ({
  projects,
  onSelectProject,
  onCreateNew
}) => {
  const totalDemos = projects.length;
  const totalSec = projects.reduce((acc, p) => acc + (p.durationSec || 0), 0);
  const totalMin = Math.round(totalSec / 60);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 rounded-full text-indigo-300 font-bold text-xs uppercase tracking-wider border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Moteur d'IA Générative de Démo & Documentation</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Bienvenue sur ACOM AI Demo</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Transformez vos réelles utilisations des logiciels Acom Technologie en vidéos de démonstration professionnelles, tutoriels, voix off multilingues, guides PDF et base de connaissances IA sans effort manuel.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onCreateNew}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xl hover:shadow-indigo-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une démonstration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl font-bold">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalDemos}</span>
            <p className="text-xs text-slate-500 font-medium">Démonstrations générées</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalMin} min</span>
            <p className="text-xs text-slate-500 font-medium">Temps de vidéo total</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl font-bold">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">6 Langues</span>
            <p className="text-xs text-slate-500 font-medium">FR, EN, ES, AR, WO, PT</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalDemos * 3}</span>
            <p className="text-xs text-slate-500 font-medium">Guides PDF & FAQ</p>
          </div>
        </div>
      </div>

      {/* Recent Demos */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Dernières Démonstrations & Tutoriels</h3>
            <p className="text-xs text-slate-500">Sélectionnez une démo pour la visionner ou exporter les supports</p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Tutoriel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="group bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 p-4 rounded-2xl transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-lg">
                    {project.moduleName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {project.durationSec}s
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {project.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 mt-4 flex justify-between items-center text-xs text-indigo-600 font-bold">
                <span className="flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Visionner</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
