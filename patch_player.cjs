const fs = require('fs');

const code = `import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Download, FileText, Settings, Subtitles, CheckCircle2, ChevronRight, Sparkles, ChevronDown, Award, Zap, Camera } from 'lucide-react';
import { DemoProject, DemoStep } from '../types';
import { ExportEngine } from '../services/ExportEngine';
import { UIAnalyzer } from '../services/UIAnalyzer';
import { SaiMigrationService } from '../services/SaiMigrationService';
import { SaiInspectorModal } from './SaiInspectorModal';

interface DemoPlayerModalProps {
  project: DemoProject;
  onClose: () => void;
}

export const DemoPlayerModal: React.FC<DemoPlayerModalProps> = ({ project: initialProject, onClose }) => {
  const [project, setProject] = useState<DemoProject>(initialProject);
  const [activeTab, setActiveTab] = useState<'video' | 'audit' | 'doc' | 'subtitles'>('video');
  const [showSaiInspector, setShowSaiInspector] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const steps = project.scenario?.steps || [];
  
  // Calculate approximate timestamps for steps
  const stepTimestamps = steps.map((s, i) => {
    let t = 0;
    for (let j = 0; j < i; j++) t += Math.max(1.2, (steps[j].durationSec || 2.5));
    return t;
  });

  const currentStepIndex = stepTimestamps.findIndex((t, i) => {
    const nextT = stepTimestamps[i + 1] || Infinity;
    return currentTime >= t && currentTime < nextT;
  });
  
  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const jumpToStep = (index: number) => {
    if (videoRef.current && stepTimestamps[index] !== undefined) {
      videoRef.current.currentTime = stepTimestamps[index];
      videoRef.current.play().catch(e => console.warn('Play prevented:', e));
    }
  };

  const handleAutoOptimize = () => {
    const p = { ...project };
    if (!p.scenario) return;
    p.scenario.steps = UIAnalyzer.optimizePedagogy(p.scenario.steps);
    p.scenario.steps = UIAnalyzer.identifyDeadTimes(p.scenario.steps);
    setProject(p);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-[1400px] h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 relative">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-white">{project.title}</h3>
              <p className="text-xs text-slate-400">{project.moduleName} • {project.pageName} • {steps.length} étapes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaiInspector(true)}
              className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-blue-800/80 transition-all"
            >
              <span>Inspecteur SAI v1.0</span>
            </button>
            <button
              onClick={handleAutoOptimize}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Optimiser IA</span>
            </button>
            {project.videoBlobUrl && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = project.videoBlobUrl!;
                  a.download = \`\${project.title.replace(/\\s+/g, '_')}.webm\`;
                  a.click();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
            )}

            <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-300 border border-slate-700">
              <button
                onClick={() => setActiveTab('video')}
                className={\`px-3 py-1.5 rounded-lg transition-all cursor-pointer \${activeTab === 'video' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'}\`}
              >
                Vidéo Native
              </button>
              <button
                onClick={() => setActiveTab('doc')}
                className={\`px-3 py-1.5 rounded-lg transition-all cursor-pointer \${activeTab === 'doc' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'}\`}
              >
                Guide PDF
              </button>
              <button
                onClick={() => setActiveTab('subtitles')}
                className={\`px-3 py-1.5 rounded-lg transition-all cursor-pointer \${activeTab === 'subtitles' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'}\`}
              >
                Sous-titres
              </button>
            </div>
            
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 cursor-pointer ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
          {activeTab === 'video' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Native Video Player Column */}
              <div className="lg:col-span-2 space-y-4 flex flex-col">
                <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                  {project.videoBlobUrl ? (
                    <video 
                      ref={videoRef} 
                      src={project.videoBlobUrl} 
                      controls 
                      autoPlay
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="text-center p-8">
                      <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h4 className="text-white font-bold text-lg">Aucun enregistrement natif</h4>
                      <p className="text-slate-400 text-sm mt-2">
                        Cette démonstration n'a pas été enregistrée en mode natif. 
                        Relancez la démonstration pour capturer une vidéo fidèle.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pedagogical Step Callout Details */}
                {activeStep && (
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-3 shrink-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Étape {activeStep.stepNumber} : {activeStep.title}</span>
                        </span>
                        
                        {/* Type Badge */}
                        <span className={\`px-2 py-0.5 rounded text-[9px] font-black uppercase \${
                          activeStep.actionType === 'click' ? 'bg-blue-500/20 text-blue-400' :
                          activeStep.actionType === 'type' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }\`}>
                          {activeStep.actionType}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Action technique</span>
                        <p className="text-slate-300 font-mono text-[10px] truncate">{activeStep.targetSelector}</p>
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Discours / Narration IA</span>
                        <p className="text-emerald-300 italic">« {activeStep.narrationText} »</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Step Timeline */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-800 shrink-0">
                  <h4 className="font-bold text-white text-sm">Timeline de la Démonstration</h4>
                  <p className="text-xs text-slate-400 mt-1">{steps.length} étapes synchronisées</p>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                  {steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isPast = index < currentStepIndex;
                    return (
                      <div 
                        key={step.id || index}
                        onClick={() => jumpToStep(index)}
                        className={\`p-3 rounded-xl border transition-all cursor-pointer \${
                          isActive 
                            ? 'bg-indigo-900/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                            : isPast
                              ? 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }\`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={\`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold \${
                            isActive ? 'bg-indigo-500 text-white' : 
                            isPast ? 'bg-slate-800 text-slate-400' : 
                            'bg-slate-800 text-slate-400'
                          }\`}>
                            {index + 1}
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            <h5 className={\`font-bold text-xs truncate \${isActive ? 'text-indigo-300' : 'text-slate-300'}\`}>
                              {step.title}
                            </h5>
                            <p className="text-[10px] text-slate-500 truncate">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'doc' && (
            <div className="bg-white text-slate-900 p-8 rounded-2xl max-w-3xl mx-auto shadow-inner space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black text-indigo-900">{project.title}</h2>
                  <p className="text-sm text-slate-500">{project.moduleName} • Guide Officiel Acom Technologie</p>
                </div>
                <button
                  onClick={() => ExportEngine.triggerPrintPdf(project)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Imprimer / PDF</span>
                </button>
              </div>
              <div 
                className="prose prose-indigo max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: project.documentation?.userGuideHtml || '<p>Aucune documentation disponible</p>' }}
              />
            </div>
          )}

          {activeTab === 'subtitles' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-bold">Fichiers de sous-titres :</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => ExportEngine.exportSubtitles(project, 'srt')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Télécharger .SRT
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 max-h-96 overflow-y-auto leading-relaxed">
                {project.subtitles?.srtContent || 'Aucun sous-titre généré'}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {showSaiInspector && (
        <SaiInspectorModal 
          isOpen={showSaiInspector} 
          onClose={() => setShowSaiInspector(false)}
          scenario={SaiMigrationService.migrateToLatestSai(project)}
        />
      )}
    </div>
  );
};
`;

fs.writeFileSync('src/ai-demo/components/DemoPlayerModal.tsx', code);
