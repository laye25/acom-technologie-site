// src/ai-demo/components/FloatingDemoRecorderWidget.tsx
// Universal Floating Widget providing 1-click AI Demo Recording & Live Auto Control across all SaaS modules

import React, { useState, useEffect } from 'react';
import { useDemoRecorder } from '../hooks/useDemoRecorder';
import { LiveGuidanceEngine } from '../services/LiveGuidanceEngine';
import { SaiEventBus } from '../services/SaiEventBus';
import { Video, Square, Sparkles, X, Clock, MousePointerClick } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FloatingDemoRecorderWidgetProps {
  currentModule?: string;
  currentPage?: string;
}

export const FloatingDemoRecorderWidget: React.FC<FloatingDemoRecorderWidgetProps> = ({
  currentModule = 'Module Acom',
  currentPage = 'Page Active'
}) => {
  const {
    isRecording,
    elapsedSeconds,
    eventsCount,
    startDemoRecording,
    stopDemoRecording
  } = useDemoRecorder();

  const [isOpen, setIsOpen] = useState(false);
  const [withScreen, setWithScreen] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = SaiEventBus.subscribe('sai:trigger_live_demo_capture', (payload?: { moduleName?: string; pageName?: string }) => {
      const mod = payload?.moduleName || currentModule;
      const pag = payload?.pageName || currentPage;
      
      startDemoRecording(mod, pag, true).then(() => {
        setIsOpen(false);
        setIsAutoRunning(true);
        const guidanceEngine = new LiveGuidanceEngine();
        guidanceEngine.startAutoControlSession(
          undefined,
          undefined,
          async () => {
            setIsAutoRunning(false);
            const project = await stopDemoRecording();
            if (project) {
              navigate(`/admin/ai-demo?project=${project.id}`);
            }
          }
        );
      });
    });

    return () => unsub();
  }, [currentModule, currentPage, navigate, startDemoRecording, stopDemoRecording]);

  const handleStartAutoDemo = async () => {
    setIsAutoRunning(true);
    await startDemoRecording(currentModule, currentPage, true); // Force true
    setIsOpen(false);

    const guidanceEngine = new LiveGuidanceEngine();
    await guidanceEngine.startAutoControlSession(
      undefined,
      undefined,
      async () => {
        setIsAutoRunning(false);
        const project = await stopDemoRecording();
        if (project) {
          navigate(`/admin/ai-demo?project=${project.id}`);
        }
      }
    );
  };

  const handleStop = async () => {
    setIsAutoRunning(false);
    const project = await stopDemoRecording();
    if (project) {
      navigate(`/admin/ai-demo?project=${project.id}`);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div id="acom-demo-floating-widget" className="fixed bottom-24 right-4 z-50 font-sans">
      {!isRecording && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-indigo-500/25 transition-all transform hover:scale-105 cursor-pointer font-bold text-xs tracking-wide border border-white/20"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>🎥 Créer le tutoriel IA</span>
        </button>
      )}

      {!isRecording && isOpen && (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-slate-700 w-84 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-500/20 text-violet-400 rounded-lg">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">ACOM AI Demo Studio</h4>
                <p className="text-[11px] text-slate-400">{currentModule} • {currentPage}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Le moteur unique IA exécute automatiquement la démonstration en direct et enregistre nativement votre écran pour une fidélité absolue (vidéo 1080p).
          </p>
          
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl flex gap-2">
            <Video className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-200/90 leading-tight">
              Une demande d'autorisation de capture d'écran s'affichera. Veuillez sélectionner l'onglet actuel et cocher "Partager l'audio de l'onglet" pour garantir l'enregistrement de la narration vocale.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleStartAutoDemo}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all border border-emerald-400/30"
            >
              <MousePointerClick className="w-4 h-4 text-emerald-300 animate-bounce" />
              <span>⚡ Auto-Remplissage & Démonstration en Direct</span>
            </button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-violet-500/40 w-80 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="font-bold text-xs text-red-400 uppercase tracking-wider">
                {isAutoRunning ? '🤖 AUTO-DÉMO EN COURS' : 'REC EN COURS'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-amber-300 font-bold">
              <Clock className="w-3 h-3" />
              <span>{formatSeconds(elapsedSeconds)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/80 p-2 rounded-xl">
            <span>{isAutoRunning ? 'Curseur IA en action :' : 'Événements capturés :'}</span>
            <span className="font-bold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded">{eventsCount} actions</span>
          </div>

          <button
            onClick={handleStop}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Terminer & Générer la Démo IA</span>
          </button>
        </div>
      )}
    </div>
  );
};

