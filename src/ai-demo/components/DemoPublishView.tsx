// src/ai-demo/components/DemoPublishView.tsx
// Publishing view providing Knowledge Base integration, iframe embed codes, and training mode toggles

import React, { useState } from 'react';
import { DemoProject } from '../types';
import { PublishingEngine } from '../services/PublishingEngine';
import { Share2, Globe, Code, Copy, CheckCircle2, GraduationCap, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface DemoPublishViewProps {
  projects: DemoProject[];
}

export const DemoPublishView: React.FC<DemoPublishViewProps> = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  if (!activeProject) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 text-slate-400">
        <p className="font-bold">Aucune démonstration disponible pour publication.</p>
      </div>
    );
  }

  const embedCode = PublishingEngine.generateEmbedHtml(activeProject);

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Code d\'intégration iframe copié !');
  };

  const handlePublishKB = () => {
    const res = PublishingEngine.publishToKnowledgeBase(activeProject);
    toast.success(`Publié dans la Base de Connaissances (${res.kbId}) !`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Centre de Publication & Diffusion</h2>
          <p className="text-xs text-slate-500">Publiez sur la base de connaissances, générez des codes d'intégration web et activez le mode formation</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Sélectionner la Démonstration :</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.moduleName})</option>
            ))}
          </select>
        </div>

        {/* Publish Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Base de Connaissances Acom</span>
            </div>
            <p className="text-xs text-slate-600">
              Rendez cette démonstration accessible à tous les utilisateurs et clients du module {activeProject.moduleName}.
            </p>
            <button
              onClick={handlePublishKB}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
            >
              Publier sur la KB
            </button>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase">
              <GraduationCap className="w-4 h-4" />
              <span>Mode Formation Interactive</span>
            </div>
            <p className="text-xs text-slate-600">
              Transforme ce tutoriel en cours de formation obligatoire avec quiz et attestation pour les nouveaux employés.
            </p>
            <button
              onClick={() => toast.success('Mode formation activé pour les nouveaux apprenants !')}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
            >
              Activer le Mode Formation
            </button>
          </div>
        </div>

        {/* Code Embed Section */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-600" />
              <span>Code d'Intégration Web (Iframe) :</span>
            </span>
            <button onClick={handleCopyEmbed} className="text-indigo-600 hover:underline text-[11px] font-bold cursor-pointer">
              Copier le code
            </button>
          </label>
          <pre className="p-3 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl border border-slate-800 overflow-x-auto">
            {embedCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
