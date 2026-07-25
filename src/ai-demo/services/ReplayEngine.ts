// src/ai-demo/services/ReplayEngine.ts
/**
 * ReplayEngine - Deterministic Step-by-Step Replay Engine
 * Replays a Scénario Applicatif Intelligent (SAI) without requiring video rendering or AI services.
 */

import { ScenarioApplicationIntelligent, SaiTimelineStep, SaiVisualSnapshot, SaiInteractionEvent } from '../types';

export interface ReplayState {
  scenarioId: string;
  isPlaying: boolean;
  currentStepIndex: number;
  totalSteps: number;
  elapsedSec: number;
  totalDurationSec: number;
  speedMultiplier: number;
  activeStep?: SaiTimelineStep;
  activeSnapshot?: SaiVisualSnapshot;
  activeEvents: SaiInteractionEvent[];
}

export type ReplayListener = (state: ReplayState) => void;

export class ReplayEngine {
  private scenario: ScenarioApplicationIntelligent;
  private isPlaying: boolean = false;
  private currentStepIndex: number = 0;
  private speedMultiplier: number = 1.0;
  private timerId: any = null;
  private listeners: Set<ReplayListener> = new Set();
  private elapsedSec: number = 0;

  constructor(scenario: ScenarioApplicationIntelligent) {
    this.scenario = scenario;
  }

  /**
   * Re-initializes the engine with a new scenario
   */
  public loadScenario(scenario: ScenarioApplicationIntelligent): void {
    this.pause();
    this.scenario = scenario;
    this.currentStepIndex = 0;
    this.elapsedSec = 0;
    this.notifyListeners();
  }

  public subscribe(listener: ReplayListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.currentStepIndex >= this.scenario.timeline.length) {
      this.currentStepIndex = 0;
      this.elapsedSec = 0;
    }

    const intervalMs = Math.floor(100 / this.speedMultiplier);
    this.timerId = setInterval(() => {
      this.tick();
    }, intervalMs);

    this.notifyListeners();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notifyListeners();
  }

  public jumpToStep(stepIndex: number): void {
    if (stepIndex < 0) stepIndex = 0;
    if (stepIndex >= this.scenario.timeline.length) {
      stepIndex = Math.max(0, this.scenario.timeline.length - 1);
    }
    this.currentStepIndex = stepIndex;

    // Calculate elapsed time up to this step
    let accumulated = 0;
    for (let i = 0; i < stepIndex; i++) {
      accumulated += this.scenario.timeline[i]?.durationSec || 2;
    }
    this.elapsedSec = accumulated;

    this.notifyListeners();
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  public nextStep(): void {
    if (this.currentStepIndex < this.scenario.timeline.length - 1) {
      this.jumpToStep(this.currentStepIndex + 1);
    }
  }

  public prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.jumpToStep(this.currentStepIndex - 1);
    }
  }

  private tick(): void {
    this.elapsedSec += 0.1;
    const currentStep = this.scenario.timeline[this.currentStepIndex];

    if (!currentStep) {
      this.pause();
      return;
    }

    // Check if we should advance to the next step
    let stepStart = 0;
    for (let i = 0; i < this.currentStepIndex; i++) {
      stepStart += this.scenario.timeline[i]?.durationSec || 2;
    }

    const stepEnd = stepStart + (currentStep.durationSec || 2);

    if (this.elapsedSec >= stepEnd) {
      if (this.currentStepIndex < this.scenario.timeline.length - 1) {
        this.currentStepIndex += 1;
      } else {
        this.pause();
      }
    }

    this.notifyListeners();
  }

  public getState(): ReplayState {
    const activeStep = this.scenario.timeline[this.currentStepIndex];
    const activeSnapshot = activeStep?.snapshotId
      ? this.scenario.snapshots.find((s) => s.id === activeStep.snapshotId)
      : this.scenario.snapshots[this.currentStepIndex] || this.scenario.snapshots[0];

    // Filter events corresponding to this step window
    const totalDuration = this.scenario.timeline.reduce((acc, s) => acc + (s.durationSec || 2), 0);

    return {
      scenarioId: this.scenario.id,
      isPlaying: this.isPlaying,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.scenario.timeline.length,
      elapsedSec: Math.min(this.elapsedSec, totalDuration),
      totalDurationSec: totalDuration,
      speedMultiplier: this.speedMultiplier,
      activeStep,
      activeSnapshot,
      activeEvents: this.scenario.events
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
