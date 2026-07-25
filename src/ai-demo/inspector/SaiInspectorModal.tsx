// src/ai-demo/inspector/SaiInspectorModal.tsx
import React, { useState, useEffect } from 'react';
import { ScenarioApplicationIntelligent } from '../types';
import { EventViewer } from './EventViewer';
import { SnapshotViewer } from './SnapshotViewer';
import { TimelineViewer } from './TimelineViewer';
import { MetadataPanel } from './MetadataPanel';
import { PrivacyInspector } from './PrivacyInspector';
import { ReplayEngine, ReplayState } from '../services/ReplayEngine';
import { SaiValidator } from '../services/SaiValidator';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  FileCode,
  Shield,
  RotateCcw,
  Zap
} from 'lucide-react';

interface SaiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioApplicationIntelligent;
  onScenarioUpdated?: (updated: ScenarioApplicationIntelligent) => void;
}

export const SaiInspectorModal: React.FC<SaiInspectorModalProps> = ({
  isOpen,
  onClose,
  scenario: initialScenario,
  onScenarioUpdated
}) => {
  const [scenario, setScenario] = useState<ScenarioApplicationIntelligent>(initialScenario);
  const [activeTab, setActiveTab] = useState<'REPLAY' | 'EVENTS' | 'SNAPSHOTS' | 'TIMELINE' | 'METADATA' | 'PRIVACY'>('REPLAY');
  const [replayState, setReplayState] = useState<ReplayState | null>(null);
  const [replayEngine, setReplayEngine] = useState<ReplayEngine | null>(null);

  useEffect(() => {
    setScenario(initialScenario);
  }, [initialScenario]);

  // Initialize ReplayEngine
  useEffect(() => {
    if (!isOpen || !scenario) return;

    const engine = new ReplayEngine(scenario);
    setReplayEngine(engine);

    const unsubscribe = engine.subscribe((state) => {
      setReplayState(state);
    });

    return () => {
      engine.pause();
      unsubscribe();
    };
  }, [isOpen, scenario]);

  if (!isOpen || !scenario) return null;

  const validation = SaiValidator.validate(scenario);

  const handleStepJump = (idx: number) => {
    if (replayEngine) {
      replayEngine.jumpToStep(idx);
      setActiveTab('REPLAY');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{scenario.metadata.title}</h3>
                <span className="font-mono text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded">
                  SAI v{scenario.version}
                </span>
                {validation.isValid ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
                    <CheckCircle2 className="h-3 w-3" /> Conforme
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-950 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded">
                    <AlertTriangle className="h-3 w-3" /> Avertissement
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Inspecteur Technique & Replay Engine • Merchant: <span className="font-mono text-emerald-400">{scenario.metadata.merchantId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 px-6 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('REPLAY')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'REPLAY'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" /> Replay Engine
          </button>

          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'EVENTS'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" /> Événements ({scenario.events.length})
          </button>

          <button
            onClick={() => setActiveTab('SNAPSHOTS')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'SNAPSHOTS'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Snapshots ({scenario.snapshots.length})
          </button>

          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'TIMELINE'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> Timeline ({scenario.timeline.length})
          </button>

          <button
            onClick={() => setActiveTab('METADATA')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'METADATA'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" /> Schema & JSON
          </button>

          <button
            onClick={() => setActiveTab('PRIVACY')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'PRIVACY'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Confidentialité
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'REPLAY' && replayState && (
            <div className="space-y-4">
              {/* Replay Viewport */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      Étape {replayState.currentStepIndex + 1} / {replayState.totalSteps}
                    </span>
                    <span className="text-slate-400 truncate max-w-md font-medium">
                      {replayState.activeStep?.title || 'Initialisation'}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400">
                    {replayState.elapsedSec.toFixed(1)}s / {replayState.totalDurationSec.toFixed(1)}s
                  </span>
                </div>

                {/* Display active snapshot */}
                <div className="relative aspect-video bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                  {replayState.activeSnapshot?.dataUrl ? (
                    <img
                      src={replayState.activeSnapshot.dataUrl}
                      alt="Replay Frame"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-8 text-slate-500 text-xs">
                      Aucune capture d'écran associée à cette étape.
                    </div>
                  )}

                  {/* Step Overlay Callout */}
                  {replayState.activeStep && (
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 border border-slate-800 backdrop-blur-md p-3 rounded-lg text-xs space-y-1 shadow-lg">
                      <div className="font-bold text-blue-300">{replayState.activeStep.title}</div>
                      <div className="text-slate-300">{replayState.activeStep.description}</div>
                    </div>
                  )}
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => replayEngine?.prevStep()}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => (replayState.isPlaying ? replayEngine?.pause() : replayEngine?.play())}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow transition-colors"
                    >
                      {replayState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                      {replayState.isPlaying ? 'Pause' : 'Rejouer Le Scénario'}
                    </button>

                    <button
                      onClick={() => replayEngine?.nextStep()}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => replayEngine?.jumpToStep(0)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Recommencer"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Vitesse:</span>
                    {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => replayEngine?.setSpeed(spd)}
                        className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                          replayState.speedMultiplier === spd
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EVENTS' && <EventViewer events={scenario.events} privacyLevel={scenario.metadata.privacyLevel} />}

          {activeTab === 'SNAPSHOTS' && <SnapshotViewer snapshots={scenario.snapshots} />}

          {activeTab === 'TIMELINE' && (
            <TimelineViewer steps={scenario.timeline} onSelectStepForReplay={handleStepJump} />
          )}

          {activeTab === 'METADATA' && <MetadataPanel scenario={scenario} />}

          {activeTab === 'PRIVACY' && (
            <PrivacyInspector
              scenario={scenario}
              onPrivacyLevelChanged={(updated) => {
                setScenario(updated);
                if (onScenarioUpdated) onScenarioUpdated(updated);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
