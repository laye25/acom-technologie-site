// src/ai-demo/engines/RealDOMExecutionEngine.ts
/**
 * RealDOMExecutionEngine: Executes demo actions directly on the real DOM elements,
 * observes state changes after each step, and coordinates with ScreenRecorder & VoiceEngine.
 */

import { TimelineStep } from '../types';
import { ScreenRecorder } from '../recorders/ScreenRecorder';

export interface ExecutionState {
  currentStepIndex: number;
  isRunning: boolean;
  statusMessage: string;
  stateObservations: Array<{ stepIndex: number; observation: string; success: boolean }>;
}

export class RealDOMExecutionEngine {
  private static recorder = new ScreenRecorder();

  /**
   * Starts native screen recording session for real UI demonstration
   */
  public static async startNativeRecording(resolution: '720p' | '1080p' = '1080p', fps: 30 | 60 = 30): Promise<boolean> {
    return await RealDOMExecutionEngine.recorder.startCapture(resolution, fps, true);
  }

  /**
   * Stops native recording and returns recorded video blob
   */
  public static async stopNativeRecording(): Promise<Blob | null> {
    return await RealDOMExecutionEngine.recorder.stopCapture();
  }

  /**
   * Executes a specific step action on the real DOM using stable selectors
   */
  public static executeStepOnRealDOM(step: TimelineStep): { success: boolean; observation: string } {
    try {
      const selector = step.targetSelector || '';
      let targetEl: HTMLElement | null = null;

      if (selector) {
        targetEl = document.querySelector(selector) as HTMLElement;
      }

      // Fallback search by text or action type if selector not found
      if (!targetEl && step.actionType) {
        if (step.actionType === 'input') {
          targetEl = document.querySelector('input, textarea, select') as HTMLElement;
        } else if (step.actionType === 'click') {
          targetEl = document.querySelector('button, [role="button"]') as HTMLElement;
        }
      }

      if (!targetEl) {
        return {
          success: false,
          observation: `Élément cible "${selector}" introuvable dans le DOM actuel. Passage en mode simulation visuelle.`
        };
      }

      // Highlight target element visually for demonstration feedback
      const originalOutline = targetEl.style.outline;
      const originalBg = targetEl.style.backgroundColor;
      targetEl.style.outline = '3px solid #2563eb';
      targetEl.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';

      setTimeout(() => {
        if (targetEl) {
          targetEl.style.outline = originalOutline;
          targetEl.style.backgroundColor = originalBg;
        }
      }, 1500);

      // Perform real interaction
      if (step.actionType === 'input') {
        const inputEl = targetEl as HTMLInputElement;
        if (inputEl) {
          inputEl.focus();
          inputEl.value = step.targetValue || 'Valeur Test';
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else if (step.actionType === 'click' || step.actionType === 'submit') {
        targetEl.click();
      }

      // Observe state changes after action
      const modalOpen = !!document.querySelector('.modal, [role="dialog"], .fixed.inset-0');
      const toastVisible = !!document.querySelector('.toast, [role="alert"]');

      let observation = `Action "${step.title || step.description}" exécutée avec succès sur le DOM réel.`;
      if (modalOpen) observation += ` (Modale détectée ouverte)`;
      if (toastVisible) observation += ` (Notification / Alerte détectée)`;

      return {
        success: true,
        observation
      };
    } catch (err: any) {
      return {
        success: false,
        observation: `Erreur d'exécution DOM : ${err?.message || 'Erreur inconnue'}`
      };
    }
  }
}
