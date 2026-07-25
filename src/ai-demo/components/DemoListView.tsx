// src/ai-demo/components/DemoListView.tsx
// View listing all created demonstrations with search, filter by module, and delete/play actions

import React, { useState } from 'react';
import { DemoProject } from '../types';
import { Search, Play, Trash2, FileText, Download, Share2, Filter, Video, Tag } from 'lucide-react';
import { DemoManager } from '../services/DemoManager';
import { ExportEngine } from '../services/ExportEngine';
import toast from 'react-hot-toast';

interface DemoListViewProps {
  projects: DemoProject[];
  onSelectProject: (p: DemoProject) => void;
  onRefresh: () => void;
}

export const DemoListView: React.FC<DemoListViewProps> = ({
  projects,
  onSelectProject,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  const modules = Array.from(new Set(projects.map(p => p.moduleName)));

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.pageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchModule = selectedModule === 'all' || p.moduleName === selectedModule;
    return matchSearch && matchModule;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous vraiment supprimer cette démonstration ?')) {
      DemoManager.deleteProject(id);
      toast.success('Démonstration supprimée');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Mes Démonstrations & Tutoriels</h2>
            <p className="text-xs text-slate-500">Gérez, filtrez, écoutez et exportez vos contenus de démonstration IA</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, module ou mot-clé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tous les modules ({projects.length})</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="group bg-white hover:border-indigo-500 border border-slate-200/80 p-5 rounded-2xl transition-all cursor-pointer shadow-2xs hover:shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-100">
                  {project.moduleName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {project.durationSec}s • {project.timelineSteps.length} étapes
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {project.title}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {project.tags.map(t => (
                  <span key={t} className="text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(project);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Ouvrir</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    ExportEngine.exportVideo(project, 'mp4');
                  }}
                  title="Télécharger la Vidéo MP4"
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-emerald-200 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vidéo</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    ExportEngine.exportDocumentation(project, 'md');
                  }}
                  title="Télécharger Guide MD"
                  className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  title="Supprimer"
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200/80 text-slate-400 space-y-2">
            <Video className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm">Aucune démonstration ne correspond à votre recherche</p>
          </div>
        )}
      </div>
    </div>
  );
};
