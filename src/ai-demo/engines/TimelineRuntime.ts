// src/ai-demo/engines/TimelineRuntime.ts
/**
 * TimelineRuntime - High-Precision Execution Clock & Frame State Engine
 * Computes exact frame-by-frame state, smooth zoom transforms, and overlay signals at 60 FPS.
 */

import { ScenarioApplicationIntelligent, SaiTimelineStep, SaiVisualSnapshot } from '../types';

export interface TimelineRuntimeFrame {
  scenarioId: string;
  stepIndex: number;
  totalSteps: number;
  stepProgress: number; // 0 to 1 within step
  totalProgress: number; // 0 to 1 overall
  elapsedSec: number;
  totalDurationSec: number;
  zoomScale: number;
  activeStep?: SaiTimelineStep;
  activeSnapshot?: SaiVisualSnapshot;
  nextSnapshot?: SaiVisualSnapshot;
}

export type TimelineFrameCallback = (frame: TimelineRuntimeFrame) => void;

export class TimelineRuntime {
  private scenario: ScenarioApplicationIntelligent;
  private isRunning: boolean = false;
  private elapsedSec: number = 0;
  private speedMultiplier: number = 1.0;
  private animFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private listeners: Set<TimelineFrameCallback> = new Set();

  constructor(scenario: ScenarioApplicationIntelligent) {
    this.scenario = scenario;
  }

  public setScenario(scenario: ScenarioApplicationIntelligent): void {
    this.stop();
    this.scenario = scenario;
    this.elapsedSec = 0;
    this.notifyFrame();
  }

  public subscribe(callback: TimelineFrameCallback): () => void {
    this.listeners.add(callback);
    callback(this.getCurrentFrame());
    return () => this.listeners.delete(callback);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public seek(totalSec: number): void {
    const totalDuration = this.getTotalDuration();
    this.elapsedSec = Math.max(0, Math.min(totalDuration, totalSec));
    this.notifyFrame();
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.25, Math.min(4.0, multiplier));
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaSec = ((now - this.lastTimestamp) / 1000) * this.speedMultiplier;
    this.lastTimestamp = now;

    this.elapsedSec += deltaSec;
    const totalDuration = this.getTotalDuration();

    if (this.elapsedSec >= totalDuration) {
      this.elapsedSec = totalDuration;
      this.notifyFrame();
      this.stop();
      return;
    }

    this.notifyFrame();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public getCurrentFrame(): TimelineRuntimeFrame {
    const steps = this.scenario.timeline || [];
    const totalDurationSec = this.getTotalDuration();

    if (steps.length === 0) {
      return {
        scenarioId: this.scenario.id,
        stepIndex: 0,
        totalSteps: 0,
        stepProgress: 0,
        totalProgress: 0,
        elapsedSec: 0,
        totalDurationSec: 0,
        zoomScale: 1.0
      };
    }

    // Locate active step based on accumulated elapsed time
    let accumulated = 0;
    let stepIndex = 0;
    let stepProgress = 0;
    let activeStep = steps[0];

    for (let i = 0; i < steps.length; i++) {
      const stepDuration = steps[i].durationSec || 2;
      if (this.elapsedSec >= accumulated && this.elapsedSec < accumulated + stepDuration) {
        stepIndex = i;
        activeStep = steps[i];
        stepProgress = (this.elapsedSec - accumulated) / stepDuration;
        break;
      }
      accumulated += stepDuration;
      if (i === steps.length - 1) {
        stepIndex = steps.length - 1;
        activeStep = steps[steps.length - 1];
        stepProgress = 1.0;
      }
    }

    const activeSnapshot = activeStep?.snapshotId
      ? this.scenario.snapshots.find((s) => s.id === activeStep.snapshotId)
      : this.scenario.snapshots[stepIndex] || this.scenario.snapshots[0];

    const nextStep = steps[stepIndex + 1];
    const nextSnapshot = nextStep?.snapshotId
      ? this.scenario.snapshots.find((s) => s.id === nextStep.snapshotId)
      : this.scenario.snapshots[stepIndex + 1];

    // Compute smooth zoom scale interpolation
    const targetZoom = activeStep?.zoomLevel || 1.0;
    const zoomScale = 1.0 + (targetZoom - 1.0) * Math.sin(stepProgress * Math.PI);

    return {
      scenarioId: this.scenario.id,
      stepIndex,
      totalSteps: steps.length,
      stepProgress,
      totalProgress: totalDurationSec > 0 ? this.elapsedSec / totalDurationSec : 0,
      elapsedSec: this.elapsedSec,
      totalDurationSec,
      zoomScale,
      activeStep,
      activeSnapshot,
      nextSnapshot
    };
  }

  public getTotalDuration(): number {
    return (this.scenario.timeline || []).reduce((acc, s) => acc + (s.durationSec || 2), 0) || 10;
  }

  private notifyFrame(): void {
    const frame = this.getCurrentFrame();
    this.listeners.forEach((callback) => callback(frame));
  }
}
