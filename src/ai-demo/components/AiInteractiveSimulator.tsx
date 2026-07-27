import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Video, MousePointer, FastForward, CheckCircle2, ChevronLeft, ChevronRight, Layers, Lock, ShieldCheck } from 'lucide-react';
import { DemoProject, TimelineStep } from '../types';
import { VoiceEngine } from '../voice/VoiceEngine';
import { SaaSPageRecognizer, SaaSProfile } from '../services/SaaSPageRecognizer';
import { RealDOMExecutionEngine } from '../engines/RealDOMExecutionEngine';

interface AiInteractiveSimulatorProps {
  project: DemoProject;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onTriggerNativeCapture?: () => void;
}

export const AiInteractiveSimulator: React.FC<AiInteractiveSimulatorProps> = ({
  project,
  activeStepIndex,
  onSelectStep,
  onTriggerNativeCapture
}) => {
  const steps = project.timelineSteps || [];
  const currentStep = steps[activeStepIndex] || steps[0];

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 400, y: 250 });
  const [showRipple, setShowRipple] = useState<boolean>(false);
  const [saasProfile, setSaasProfile] = useState<SaaSProfile | null>(null);
  const [executionObservation, setExecutionObservation] = useState<string>('');

  const stepTimerRef = useRef<any>(null);

  // Detect SaaS & Page on mount
  useEffect(() => {
    const profile = SaaSPageRecognizer.detectActiveSaaSAndPage();
    setSaasProfile(profile);
  }, []);

  // Position cursor & execute real DOM action when step changes
  useEffect(() => {
    if (currentStep) {
      const targetX = currentStep.x || 350 + (activeStepIndex * 80) % 300;
      const targetY = currentStep.y || 200 + (activeStepIndex * 60) % 200;
      
      setCursorPos({ x: targetX, y: targetY });

      // Trigger click ripple animation on click/submit actions
      if (currentStep.actionType === 'click' || currentStep.actionType === 'submit') {
        setShowRipple(true);
        const t = setTimeout(() => setShowRipple(false), 800);
        return () => clearTimeout(t);
      }

      // Execute on real DOM and observe state
      const result = RealDOMExecutionEngine.executeStepOnRealDOM(currentStep);
      setExecutionObservation(result.observation);
    }
  }, [activeStepIndex, currentStep]);

  // Voice narration handling
  useEffect(() => {
    if (!isMuted && currentStep?.narrationText && isPlaying) {
      setIsSpeaking(true);
      const voiceConfig = project.voiceConfig || VoiceEngine.getAvailableVoices('fr')[0];
      VoiceEngine.speakText(currentStep.narrationText, voiceConfig, () => {
        setIsSpeaking(false);
      });
    } else {
      VoiceEngine.stopSpeech();
      setIsSpeaking(false);
    }

    return () => {
      VoiceEngine.stopSpeech();
    };
  }, [activeStepIndex, isMuted, isPlaying, currentStep, project.voiceConfig]);

  // Auto advance steps when playing
  useEffect(() => {
    if (!isPlaying || steps.length === 0) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      return;
    }

    const duration = Math.max(2, (currentStep?.durationSec || 3)) * (1000 / playbackSpeed);

    stepTimerRef.current = setTimeout(() => {
      if (activeStepIndex < steps.length - 1) {
        onSelectStep(activeStepIndex + 1);
      } else {
        // Loop back to start
        onSelectStep(0);
      }
    }, duration);

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [isPlaying, activeStepIndex, steps.length, currentStep?.durationSec, playbackSpeed, onSelectStep]);

  const handleNext = () => {
    if (activeStepIndex < steps.length - 1) {
      onSelectStep(activeStepIndex + 1);
    } else {
      onSelectStep(0);
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      onSelectStep(activeStepIndex - 1);
    }
  };

  const handleRestart = () => {
    onSelectStep(0);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Banner with Notice & Quick Capture Trigger */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">
            Simulateur IA & DOM Réel
          </span>
          {saasProfile && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>SaaS Détecté : {saasProfile.saasName} ({saasProfile.pageName})</span>
            </span>
          )}
        </div>

        {onTriggerNativeCapture && (
          <button
            onClick={onTriggerNativeCapture}
            className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Video className="w-3.5 h-3.5 text-amber-300" />
            <span>Capturer en Vidéo Natif (1080p)</span>
          </button>
        )}
      </div>

      {executionObservation && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 text-[11px] text-indigo-300 flex items-center gap-2">
          <span className="font-bold text-indigo-400">🔍 État DOM :</span>
          <span className="truncate">{executionObservation}</span>
        </div>
      )}

      {/* Main Simulation Viewport (Simulated Browser Canvas) */}
      <div className="relative flex-1 bg-slate-900 flex flex-col overflow-hidden">
        {/* Simulated Browser Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-3 text-xs shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 flex items-center gap-2 text-slate-400 font-mono text-[11px] truncate">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-slate-300">https://acom.app/{project.moduleName?.toLowerCase().replace(/\s+/g, '_')}/{project.pageName?.toLowerCase().replace(/\s+/g, '_')}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">
              {currentStep?.actionType?.toUpperCase() || 'INFO'}
            </span>
          </div>
        </div>

        {/* Canvas Area with Interactive Mock Interface */}
        <div className="relative flex-1 bg-slate-950 p-6 flex flex-col justify-between overflow-hidden select-none">
          {/* Background Mock Application UI Grid */}
          <div className="absolute inset-0 p-6 pointer-events-none opacity-40 grid grid-cols-12 gap-4">
            {/* Sidebar Mock */}
            <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800/60 rounded w-full" />
              <div className="h-3 bg-slate-800/60 rounded w-5/6" />
              <div className="h-3 bg-slate-800/60 rounded w-4/6" />
              <div className="h-20 bg-indigo-950/30 border border-indigo-900/40 rounded-lg mt-6" />
            </div>

            {/* Main Content Mock */}
            <div className="col-span-9 space-y-4">
              <div className="h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center px-4 justify-between">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-indigo-600/50 rounded w-24" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-6 bg-slate-800 rounded w-3/4" />
                </div>
                <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-6 bg-slate-800 rounded w-3/4" />
                </div>
                <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-6 bg-slate-800 rounded w-3/4" />
                </div>
              </div>

              <div className="h-40 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800/60 rounded w-full" />
                <div className="h-3 bg-slate-800/60 rounded w-full" />
                <div className="h-3 bg-slate-800/60 rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* Foreground Active Simulated Element Box */}
          <div className="relative z-10 my-auto max-w-xl mx-auto w-full bg-slate-900/90 backdrop-blur border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-black text-xs">
                  {activeStepIndex + 1}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{currentStep?.title}</h4>
                  <p className="text-xs text-slate-400">{currentStep?.description}</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-1 rounded border border-indigo-500/30">
                {currentStep?.targetSelector || `[data-step="${currentStep?.id}"]`}
              </span>
            </div>

            {/* Simulated Dynamic Content according to actionType */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
              {currentStep?.actionType === 'click' && (
                <div className="flex items-center justify-between p-3 bg-indigo-950/40 border border-indigo-500/50 rounded-xl">
                  <span className="text-xs font-semibold text-indigo-200">Action Utilisateur : Clic sur l'élément</span>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30">
                    Bouton Action
                  </button>
                </div>
              )}

              {currentStep?.actionType === 'input' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Saisie interactive de la valeur</label>
                  <div className="p-2.5 bg-slate-900 border border-indigo-500/60 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <span className="animate-pulse">|</span>
                    <span>Données de test saisies automatiquement</span>
                  </div>
                </div>
              )}

              {currentStep?.actionType === 'submit' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300 block">Validation & Enregistrement</span>
                    <span className="text-slate-400">Confirmation et synchronisation des données</span>
                  </div>
                </div>
              )}

              {(!currentStep?.actionType || currentStep?.actionType === 'page_change') && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
                  Affichage et inspection de la vue <span className="text-indigo-400 font-bold">{project.pageName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Animated Virtual Cursor */}
          <div
            className="absolute z-30 transition-all duration-700 ease-in-out pointer-events-none"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`
            }}
          >
            <div className="relative">
              <MousePointer className="w-6 h-6 text-indigo-400 fill-indigo-600 drop-shadow-lg -rotate-12" />
              
              {/* Click Ripple Effect */}
              {showRipple && (
                <div className="absolute -inset-3 rounded-full border-2 border-indigo-400 bg-indigo-500/30 animate-ping pointer-events-none" />
              )}

              {/* Cursor Label */}
              <div className="absolute left-6 top-2 bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                ACOM AI Pointer
              </div>
            </div>
          </div>

          {/* Floating AI Narration Banner at Bottom of Canvas */}
          <div className="relative z-20 mt-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${isSpeaking ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
              <Volume2 className="w-4 h-4" />
            </div>

            <div className="flex-1 overflow-hidden">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Discours Narration IA</span>
              <p className="text-xs text-emerald-300 font-medium italic truncate">
                « {currentStep?.narrationText || 'Démonstration en cours...'} »
              </p>
            </div>

            {isSpeaking && (
              <div className="flex items-end gap-1 h-4 px-2">
                <div className="w-1 bg-emerald-400 rounded animate-bounce h-full" style={{ animationDelay: '0ms' }} />
                <div className="w-1 bg-emerald-400 rounded animate-bounce h-2/3" style={{ animationDelay: '150ms' }} />
                <div className="w-1 bg-emerald-400 rounded animate-bounce h-4/5" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Toolbar at Bottom */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-all"
            title="Recommencer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrev}
            disabled={activeStepIndex === 0}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg cursor-pointer transition-all"
            title="Étape précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Lecture</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-all"
            title="Étape suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-xs text-slate-400 font-medium ml-2">
            Étape <span className="text-white font-bold">{activeStepIndex + 1}</span> / {steps.length}
          </div>
        </div>

        {/* Step Indicator Dots */}
        <div className="hidden md:flex items-center gap-1.5">
          {steps.map((s, idx) => (
            <button
              key={s.id || idx}
              onClick={() => onSelectStep(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === activeStepIndex
                  ? 'w-6 bg-indigo-500'
                  : idx < activeStepIndex
                  ? 'w-2 bg-indigo-900'
                  : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Speed & Audio Toggles */}
        <div className="flex items-center gap-3">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isMuted
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Activer le son' : 'Muter le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Speed Selector */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px] font-bold">
            {[0.8, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  playbackSpeed === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
