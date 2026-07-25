// src/ai-demo/narration/NarrationEngine.ts
// NarrationEngine: Synchronizes step narration audio playback with video timeline.

import { TimelineStep, VoiceConfig } from '../types';
import { VoiceEngine } from '../voice/VoiceEngine';

export class NarrationEngine {
  private currentStepIndex: number = -1;
  private isNarrating: boolean = false;

  public playStepNarration(step: TimelineStep, voiceConfig: VoiceConfig, onComplete?: () => void): void {
    if (!step.narrationText) {
      if (onComplete) onComplete();
      return;
    }

    this.isNarrating = true;
    VoiceEngine.speakText(step.narrationText, voiceConfig, () => {
      this.isNarrating = false;
      if (onComplete) onComplete();
    });
  }

  public stopNarration(): void {
    this.isNarrating = false;
    VoiceEngine.stopSpeech();
  }

  public getIsNarrating(): boolean {
    return this.isNarrating;
  }
}
