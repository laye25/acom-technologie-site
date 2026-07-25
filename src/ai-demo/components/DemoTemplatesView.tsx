// src/ai-demo/components/DemoTemplatesView.tsx
// Templates gallery allowing choice of preset themes for Marketing, Training, and Social Demos

import React from 'react';
import { TemplateEngine } from '../templates/TemplateEngine';
import { Layers, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface DemoTemplatesViewProps {
  onSelectTemplate: (templateId: string) => void;
}

export const DemoTemplatesView: React.FC<DemoTemplatesViewProps> = ({ onSelectTemplate }) => {
  const templates = TemplateEngine.getTemplates();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Bibliothèque de Templates ACOM Demo</h2>
          <p className="text-xs text-slate-500">Sélectionnez un style de montage prédéfini (Marketing, Tutoriel, Format Court 9:16)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-indigo-400 transition-all shadow-2xs hover:shadow-xl flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{tpl.icon}</span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{tpl.name}</h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                    {tpl.category}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {tpl.description}
              </p>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono space-y-1">
                <div>• Format : {tpl.defaultVideo.format?.toUpperCase()} ({tpl.defaultVideo.aspectRatio})</div>
                <div>• Qualité : {tpl.defaultVideo.resolution} @ {tpl.defaultVideo.fps}fps</div>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectTemplate(tpl.id);
                toast.success(`Template "${tpl.name}" appliqué !`);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <span>Utiliser ce template</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
