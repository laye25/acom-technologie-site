import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Download, FileText, Settings, Subtitles, CheckCircle2, ChevronRight, Sparkles, ChevronDown, Award, Zap, Camera, Video, MonitorPlay, Loader2 } from 'lucide-react';
import { DemoProject, TimelineStep } from '../types';
import { ExportEngine } from '../services/ExportEngine';
import { UIAnalyzer } from '../engines/UIAnalyzer';
import { AiEngine } from '../engines/AiEngine';
import { SaiMigrationService } from '../services/SaiMigrationService';
import { SaiInspectorModal } from '../inspector/SaiInspectorModal';
import { VideoStorageService } from '../services/VideoStorageService';
import { SaiEventBus } from '../services/SaiEventBus';
import toast from 'react-hot-toast';

interface DemoPlayerModalProps {
  project: DemoProject;
  onClose: () => void;
}

export const DemoPlayerModal: React.FC<DemoPlayerModalProps> = ({ project: initialProject, onClose }) => {
  const [project, setProject] = useState<DemoProject>(initialProject);
  const [activeTab, setActiveTab] = useState<'video' | 'doc' | 'subtitles'>('video');
  const [showSaiInspector, setShowSaiInspector] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const steps = project.timelineSteps || [];

  // Try restoring stored native video blob from IndexedDB if missing
  useEffect(() => {
    let isMounted = true;
    if (!project.videoBlobUrl) {
      VideoStorageService.getVideoBlobUrl(project.id).then((storedUrl) => {
        if (isMounted && storedUrl) {
          setProject(prev => ({ ...prev, videoBlobUrl: storedUrl }));
        }
      });
    }
    return () => { isMounted = false; };
  }, [project.id, project.videoBlobUrl]);

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
    setSimStepIndex(index);
    if (videoRef.current && stepTimestamps[index] !== undefined) {
      videoRef.current.currentTime = stepTimestamps[index];
      videoRef.current.play().catch(e => console.warn('Play prevented:', e));
    }
  };

  const handleAutoOptimize = () => {
    const p = AiEngine.autoOptimizeProject(project);
    setProject(p);
  };

  const handleTriggerNativeCapture = () => {
    onClose();
    SaiEventBus.publish('sai:trigger_live_demo_capture', {
      moduleName: project.moduleName,
      pageName: project.pageName,
      project: project
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-[1400px] h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 relative">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Video className="w-5 h-5" />
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
                  a.download = `${project.title.replace(/\s+/g, '_')}.webm`;
                  a.click();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger Vidéo HD</span>
              </button>
            )}

            <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-300 border border-slate-700">
              <button
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'}`}
              >
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vidéo Capture Réelle (ScreenRec)</span>
              </button>

              <button
                onClick={() => setActiveTab('doc')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'doc' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'}`}
              >
                Guide PDF
              </button>

              <button
                onClick={() => setActiveTab('subtitles')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'subtitles' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'}`}
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
                <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center min-h-[400px]">
                  {project.videoBlobUrl ? (
                    <video 
                      ref={videoRef} 
                      src={project.videoBlobUrl} 
                      controls 
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="text-center p-8 max-w-md mx-auto space-y-4">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
                        <Video className="w-8 h-8 text-amber-400" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-white font-bold text-lg">Capture Vidéo Indisponible</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Aucun flux vidéo natif (ScreenRec) n'a été enregistré pour cette démonstration.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleTriggerNativeCapture}
                          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:from-emerald-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Video className="w-4 h-4 text-amber-300 animate-pulse" />
                          <span>🎥 Démarrer l'Enregistrement Direct avec Capture d'Écran</span>
                        </button>
                      </div>
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
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          activeStep.actionType === 'click' ? 'bg-blue-500/20 text-blue-400' :
                          activeStep.actionType === 'input' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
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
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-900/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                            : isPast
                              ? 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive ? 'bg-indigo-500 text-white' : 
                            isPast ? 'bg-slate-800 text-slate-400' : 
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            <h5 className={`font-bold text-xs truncate ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>
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
