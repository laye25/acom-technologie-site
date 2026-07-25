// src/ai-demo/components/DemoExportView.tsx
// Export management view for MP4, MOV, WEBM, GIF, 16:9, 9:16, 1:1, SRT/VTT subtitles, and PDF docs

import React, { useState } from 'react';
import { DemoProject } from '../types';
import { ExportEngine } from '../services/ExportEngine';
import { Download, FileText, Video, Share2, Sparkles, CheckCircle2, Film } from 'lucide-react';
import toast from 'react-hot-toast';

interface DemoExportViewProps {
  projects: DemoProject[];
}

export const DemoExportView: React.FC<DemoExportViewProps> = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const [format, setFormat] = useState<'mp4' | 'mov' | 'webm' | 'gif'>('mp4');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4K'>('1080p');

  if (!activeProject) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 text-slate-400">
        <p className="font-bold">Aucune démonstration disponible pour l'exportation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Centre d'Exportation Multi-Formats</h2>
          <p className="text-xs text-slate-500">Exportez vos démonstrations en vidéo (MP4, MOV, GIF), sous-titres et documentations PDF</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Sélectionner la démonstration :</label>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">Format Vidéo :</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="mp4">MP4 (Standard)</option>
              <option value="mov">MOV (Apple/ProRes)</option>
              <option value="webm">WEBM (Web)</option>
              <option value="gif">GIF Animé (Email)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">Ratio Réseau Social :</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="16:9">16:9 (YouTube / Écran)</option>
              <option value="9:16">9:16 (TikTok / Reels / Shorts)</option>
              <option value="1:1">1:1 (Instagram / LinkedIn)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">Résolution :</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="720p">720p HD</option>
              <option value="1080p">1080p Full HD</option>
              <option value="1440p">1440p 2K</option>
              <option value="4K">4K Ultra HD</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => ExportEngine.exportVideo(activeProject, format)}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Film className="w-4 h-4" />
            <span>Télécharger Vidéo {format.toUpperCase()}</span>
          </button>

          <button
            onClick={() => ExportEngine.exportSubtitles(activeProject, 'srt')}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Sous-titres .SRT</span>
          </button>

          <button
            onClick={() => ExportEngine.triggerPrintPdf(activeProject)}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Imprimer Guide PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
