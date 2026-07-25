// src/ai-demo/components/DemoDocView.tsx
// Documentation view presenting interactive Markdown guides, HTML pages, and FAQ lists

import React, { useState } from 'react';
import { DemoProject } from '../types';
import { ExportEngine } from '../services/ExportEngine';
import { FileText, Download, Printer, HelpCircle, BookOpen, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface DemoDocViewProps {
  projects: DemoProject[];
}

export const DemoDocView: React.FC<DemoDocViewProps> = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  if (!activeProject) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 text-slate-400">
        <p className="font-bold">Aucune documentation générée.</p>
      </div>
    );
  }

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(activeProject.documentation?.userGuideMarkdown || '');
    toast.success('Guide Markdown copié dans le presse-papier !');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Centre de Documentation & FAQ</h2>
            <p className="text-xs text-slate-500">Guides utilisateurs, modes opératoires et base de connaissances IA</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copier Markdown</span>
          </button>

          <button
            onClick={() => ExportEngine.triggerPrintPdf(activeProject)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Sélectionner la Démonstration / Procédure :</label>
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

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-full uppercase tracking-wider">
              {activeProject.moduleName}
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">{activeProject.title}</h3>
            <p className="text-xs text-slate-500">{activeProject.description}</p>
          </div>

          <div
            className="prose prose-slate max-w-none text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: activeProject.documentation?.userGuideHtml || '<p>Pas de contenu</p>' }}
          />

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Foire Aux Questions (FAQ)</span>
            </h4>
            <div className="space-y-2">
              {activeProject.documentation?.faqList?.map((faq, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900">Q: {faq.question}</span>
                  <p className="text-slate-600 mt-1">R: {faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
