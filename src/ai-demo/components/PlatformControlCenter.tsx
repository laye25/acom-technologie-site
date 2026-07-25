// src/ai-demo/components/PlatformControlCenter.tsx
/**
 * PlatformControlCenter Component
 * Central Operations Dashboard for ACOM AI Demo Platform:
 * - Pipeline Orchestrator status (RECORD -> SCENARIO -> VALIDATE -> REPLAY -> KNOWLEDGE -> DIAGNOSTIC -> RENDER -> EXPORT -> PUBLISH)
 * - Golden Integration Test Suite execution (Pressing, School, Stock, Medical)
 * - Technical Telemetry & Observability Dashboard (Frame rates, cache sizes, memory usage, render durations)
 * - Collaborative Review Workflow (Review, Approve, Publish)
 */

import React, { useState, useEffect } from 'react';
import { globalPipelineOrchestrator, PipelineStageTask } from '../services/PipelineOrchestrator';
import { PlatformObservability, SystemMetricsSnapshot } from '../services/PlatformObservability';
import { IntegrationTestRunner, TestResult } from '../integration-tests/IntegrationTestRunner';
import { GOLDEN_PRESSING_SCENARIO } from '../integration-tests/pressing-demo/PressingScenario';
import { ScenarioPlayer } from './ScenarioPlayer';
import {
  Activity,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Server,
  Zap,
  AlertTriangle,
  FileCheck,
  Film,
  Send,
  Layers,
  BarChart3,
  Cpu,
  Lock,
  Unlock,
  MessageSquare
} from 'lucide-react';

export const PlatformControlCenter: React.FC = () => {
  const [tasks, setTasks] = useState<PipelineStageTask[]>([]);
  const [metrics, setMetrics] = useState<SystemMetricsSnapshot>(PlatformObservability.getMetrics());
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'tests' | 'telemetry' | 'player'>('pipeline');
  const [isRenderingVideo, setIsRenderingVideo] = useState<boolean>(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStatus, setRenderStatus] = useState<string>('');

  useEffect(() => {
    const unsubOrchestrator = globalPipelineOrchestrator.subscribe((ts) => setTasks(ts));
    const unsubTelemetry = PlatformObservability.subscribe((m) => setMetrics(m));

    return () => {
      unsubOrchestrator();
      unsubTelemetry();
    };
  }, []);

  const handleRunFullPipeline = async () => {
    try {
      await globalPipelineOrchestrator.executePipeline(GOLDEN_PRESSING_SCENARIO, {
        renderVideo: true,
        autoPublish: false
      });
    } catch (err) {
      console.error('Pipeline Execution Error:', err);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    const results = await IntegrationTestRunner.runAllSuites();
    setTestResults(results);
    setIsRunningTests(false);
  };

  const handleRenderVideo = async () => {
    setIsRenderingVideo(true);
    setRenderProgress(0);
    setRenderStatus('Exigence ScreenRec : Le rendu vidéo synthétique est désactivé.');

    try {
      throw new Error('Le rendu vidéo artificiel/Canvas est désactivé. Veuillez utiliser l\'enregistreur ScreenRec pour capturer le flux écran réel.');
    } catch (e: any) {
      setRenderStatus(`Export Refusé: ${e?.message}`);
    } finally {
      setIsRenderingVideo(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              Plateforme ACOM AI Demo
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              v2.4.0-STABLE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Centre de Contrôle & Orchestration
          </h1>
          <p className="text-slate-400 text-sm">
            Supervision du pipeline exécutable, benchmarks automatisés et métriques d'observabilité.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunFullPipeline}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play className="h-4 w-4 fill-current" />
            Exécuter Pipeline SAI
          </button>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
            {isRunningTests ? 'Lancement Tests...' : 'Lancer Tests Intégration'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'pipeline'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          Pipeline Orchestrator
        </button>

        <button
          onClick={() => setActiveTab('player')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'player'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Film className="h-4 w-4" />
          Scenario Player & Vidéo
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'tests'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Golden Integration Tests
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'telemetry'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          Observabilité & Métriques
        </button>
      </div>

      {/* Tab 1: Pipeline Orchestrator */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.stage}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-blue-400 font-bold tracking-wider">
                      {task.stage}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : task.status === 'RUNNING'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                          : task.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 mt-1">{task.label}</h3>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Avancement</span>
                    <span>{task.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        task.status === 'SUCCESS'
                          ? 'bg-emerald-500'
                          : task.status === 'FAILED'
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                  {task.durationMs && (
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      Durée: {task.durationMs.toFixed(0)}ms
                    </div>
                  )}
                  {task.errorMessage && (
                    <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20 mt-1">
                      {task.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Scenario Player & Video Renderer */}
      {activeTab === 'player' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Film className="h-4 w-4 text-blue-400" />
                Scenario Player 60 FPS (Ground Truth Replay)
              </h2>
              <ScenarioPlayer scenario={GOLDEN_PRESSING_SCENARIO} autoPlay={false} />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" />
                Générateur Vidéo MP4 (Canvas)
              </h3>
              <p className="text-xs text-slate-400">
                Génère une vidéo MP4/WebM haute définition directement par rendu frame-par-frame avec surimpressions graphiques.
              </p>

              <button
                onClick={handleRenderVideo}
                disabled={isRenderingVideo}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Film className="h-4 w-4" />
                {isRenderingVideo ? 'Génération Vidéo...' : 'Générer Vidéo MP4'}
              </button>

              {isRenderingVideo && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono text-slate-300">
                    <span>{renderStatus}</span>
                    <span>{renderProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${renderProgress}%` }} />
                  </div>
                </div>
              )}

              {renderedVideoUrl && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 block">✓ Vidéo Générée avec Succès</span>
                  <video src={renderedVideoUrl} controls className="w-full rounded-xl border border-slate-800 bg-black" />
                  <a
                    href={renderedVideoUrl}
                    download="Acom_Pressing_Demo.mp4"
                    className="block text-center text-xs text-blue-400 hover:underline font-mono"
                  >
                    Telecharger Acom_Pressing_Demo.mp4
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Golden Integration Tests */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Batterie de Tests d'Intégration Officielles</h2>
              <p className="text-xs text-slate-400">
                Vérification automatique de bout en bout des scénarios de référence (Pressing, École, Stock, Santé).
              </p>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              Exécuter la Suite
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testResults.map((res) => (
              <div
                key={res.suiteName}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {res.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-400" />
                    )}
                    <span className="font-bold text-sm text-slate-100">{res.suiteName}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">{res.durationMs.toFixed(1)}ms</span>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Contrôles exécutés: {res.checksCount}</span>
                  <span className={res.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {res.passed ? '100% SUCCÈS' : 'ÉCHECS DÉTECTÉS'}
                  </span>
                </div>

                {res.failures.length > 0 && (
                  <div className="space-y-1 pt-2">
                    {res.failures.map((f, idx) => (
                      <div key={idx} className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded">
                        • {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {testResults.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                Aucun test exécuté. Cliquez sur "Exécuter la Suite" pour démarrer.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Telemetry & Observability */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-mono">Événements Capturés</span>
              <div className="text-2xl font-bold text-blue-400 font-mono">{metrics.eventsCapturedCount}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-mono">Snapshots Visuels</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{metrics.snapshotsCapturedCount}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-mono">Temps Rendu Canvas</span>
              <div className="text-2xl font-bold text-amber-400 font-mono">{metrics.averageRenderTimeMs}ms</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-mono">Images en Cache RAM</span>
              <div className="text-2xl font-bold text-purple-400 font-mono">{metrics.memoryCachedImagesCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Journal d'Audit & Événements Système
            </h3>
            <div className="space-y-1.5 font-mono text-xs max-h-60 overflow-y-auto">
              {PlatformObservability.getAuditLogs().map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">{log.timestamp.split('T')[1].split('.')[0]}</span>
                    <span className="text-blue-400 font-bold">[{log.category}]</span>
                    <span>{log.message}</span>
                  </div>
                  {log.durationMs && <span className="text-emerald-400">{log.durationMs.toFixed(1)}ms</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
