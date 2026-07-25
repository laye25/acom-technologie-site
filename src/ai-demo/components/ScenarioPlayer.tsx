// src/ai-demo/components/ScenarioPlayer.tsx
/**
 * ScenarioPlayer Component
 * High-performance, pixel-faithful Scenario Player consuming TimelineRuntime & OverlayEngine.
 * Serves as the ultimate visual ground truth before video rendering.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ScenarioApplicationIntelligent } from '../types';
import { TimelineRuntime, TimelineRuntimeFrame } from '../engines/TimelineRuntime';
import { OverlayEngine } from '../engines/OverlayEngine';
import { AssetManager } from '../services/AssetManager';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, Sparkles, Layers, Maximize2 } from 'lucide-react';

interface ScenarioPlayerProps {
  scenario: ScenarioApplicationIntelligent;
  autoPlay?: boolean;
  onStepChange?: (stepIndex: number) => void;
}

export const ScenarioPlayer: React.FC<ScenarioPlayerProps> = ({
  scenario,
  autoPlay = false,
  onStepChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<TimelineRuntime | null>(null);

  const [frame, setFrame] = useState<TimelineRuntimeFrame | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [speed, setSpeed] = useState<number>(1.0);

  useEffect(() => {
    // 1. Preload snapshots
    const urls = (scenario.snapshots || []).map((s) => s.dataUrl).filter(Boolean) as string[];
    AssetManager.preloadBatchImages(urls);

    // 2. Initialize Runtime
    const runtime = new TimelineRuntime(scenario);
    runtimeRef.current = runtime;

    const unsubscribe = runtime.subscribe((f) => {
      setFrame(f);
      if (onStepChange) onStepChange(f.stepIndex);
    });

    if (autoPlay) runtime.start();

    return () => {
      runtime.stop();
      unsubscribe();
    };
  }, [scenario]);

  // Canvas Drawing Loop
  useEffect(() => {
    if (!frame || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Draw snapshot background
    if (frame.activeSnapshot?.dataUrl) {
      const img = AssetManager.getCachedImage(frame.activeSnapshot.dataUrl);
      if (img) {
        ctx.save();
        if (frame.zoomScale > 1.0) {
          const centerX = w / 2;
          const centerY = h / 2;
          ctx.translate(centerX, centerY);
          ctx.scale(frame.zoomScale, frame.zoomScale);
          ctx.translate(-centerX, -centerY);
        }
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
      }
    }

    // Render Overlay Engine layers
    OverlayEngine.renderOverlayFrame({
      ctx,
      width: w,
      height: h,
      step: frame.activeStep,
      snapshot: frame.activeSnapshot,
      progressPercent: frame.totalProgress,
      branding: {
        appName: scenario.application.appName,
        moduleName: scenario.application.moduleName,
        showLogo: true,
        version: scenario.application.version,
        primaryColor: '#0f172a',
        accentColor: '#2563eb'
      }
    });
  }, [frame]);

  const handlePlayPause = () => {
    if (!runtimeRef.current) return;
    if (isPlaying) {
      runtimeRef.current.stop();
      setIsPlaying(false);
    } else {
      runtimeRef.current.start();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (runtimeRef.current) runtimeRef.current.setSpeed(newSpeed);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSec = parseFloat(e.target.value);
    if (runtimeRef.current) runtimeRef.current.seek(targetSec);
  };

  if (!frame) return null;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col space-y-2 p-3">
      {/* Canvas Screen */}
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
        {/* Scrub Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-400 text-[11px] w-12 text-right">
            {frame.elapsedSec.toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={frame.totalDurationSec || 10}
            step={0.1}
            value={frame.elapsedSec}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="font-mono text-slate-400 text-[11px] w-12">
            {frame.totalDurationSec.toFixed(1)}s
          </span>
        </div>

        {/* Buttons & Speed */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (runtimeRef.current) {
                  const targetSec = Math.max(0, frame.elapsedSec - 3);
                  runtimeRef.current.seek(targetSec);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handlePlayPause}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow transition-colors"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              {isPlaying ? 'Pause' : 'Jouer'}
            </button>

            <button
              onClick={() => {
                if (runtimeRef.current) {
                  const targetSec = Math.min(frame.totalDurationSec, frame.elapsedSec + 3);
                  runtimeRef.current.seek(targetSec);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => runtimeRef.current?.seek(0)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Réinitialiser"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-slate-400">
            <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Étape {frame.stepIndex + 1}/{frame.totalSteps}
            </span>

            <div className="flex items-center gap-1">
              {[0.5, 1.0, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    speed === s ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
