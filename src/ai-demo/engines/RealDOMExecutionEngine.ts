// src/ai-demo/engines/RealDOMExecutionEngine.ts
/**
 * RealDOMExecutionEngine: Executes demo actions directly on real DOM elements using
 * precise getBoundingClientRect coordinates, stable selectors, state verification,
 * and traceable logging for Acom AI Demo.
 */

import { TimelineStep } from '../types';
import { ScreenRecorder } from '../recorders/ScreenRecorder';

export interface ExecutionTrace {
  stepIndex: number;
  businessTarget: string;
  narration: string;
  domElementFound: string;
  actualElementType: string;
  selectorUsed: string;
  actionExecuted: string;
  resultObtained: string;
  success: boolean;
  coordinates?: { x: number; y: number };
}

export class RealDOMExecutionEngine {
  private static recorder = new ScreenRecorder();

  public static async startNativeRecording(resolution: '720p' | '1080p' = '1080p', fps: 30 | 60 = 30): Promise<boolean> {
    return await RealDOMExecutionEngine.recorder.startCapture(resolution, fps, true);
  }

  public static async stopNativeRecording(): Promise<Blob | null> {
    return await RealDOMExecutionEngine.recorder.stopCapture();
  }

  /**
   * Executes a step with precise DOM resolution, coordinate lookup via getBoundingClientRect,
   * verification, and full trace generation.
   */
  public static executeStepWithTrace(step: TimelineStep, stepIndex: number): ExecutionTrace {
    const businessTarget = step.title || 'Action Métier';
    const narration = step.narrationText || step.description || '';
    const selector = step.targetSelector || '';

    let targetEl: HTMLElement | null = null;
    let selectorUsed = selector;

    // 1. Precise DOM resolution
    if (selector) {
      targetEl = document.querySelector(selector) as HTMLElement;
    }

    // Disambiguation & Fallbacks for Pressing / Forms
    if (!targetEl) {
      if (businessTarget.toLowerCase().includes('téléphone') || businessTarget.toLowerCase().includes('whatsapp')) {
        targetEl = document.querySelector('input[type="tel"], input[placeholder*="221"], input[name*="phone"]') as HTMLElement;
        selectorUsed = 'input[type="tel"] | input[placeholder*="221"]';
      } else if (businessTarget.toLowerCase().includes('client') || businessTarget.toLowerCase().includes('nom')) {
        targetEl = document.querySelector('input[placeholder*="Nom"], input[name*="name"], input[type="text"]') as HTMLElement;
        selectorUsed = 'input[placeholder*="Nom"] | input[type="text"]';
      } else if (businessTarget.toLowerCase().includes('email')) {
        targetEl = document.querySelector('input[type="email"], input[placeholder*="@"]') as HTMLElement;
        selectorUsed = 'input[type="email"]';
      } else if (step.actionType === 'input') {
        targetEl = document.querySelector('input, textarea, select') as HTMLElement;
        selectorUsed = 'input, textarea, select';
      } else if (step.actionType === 'click' || step.actionType === 'submit') {
        targetEl = document.querySelector('button, [role="button"], input[type="submit"]') as HTMLElement;
        selectorUsed = 'button, [role="button"]';
      }
    }

    if (!targetEl) {
      return {
        stepIndex,
        businessTarget,
        narration,
        domElementFound: 'AUCUN ÉLÉMENT TROUVÉ',
        actualElementType: 'none',
        selectorUsed,
        actionExecuted: step.actionType || 'none',
        resultObtained: 'ÉLÉMENT NON RECONNU — Arrêt de l’étape',
        success: false
      };
    }

    const actualElementType = targetEl.tagName.toLowerCase();
    const domElementFound = `<${actualElementType} id="${targetEl.id}" class="${targetEl.className.toString().substring(0, 30)}">`;

    // 2. Precise Bounding Client Rect Coordinate Calculation
    const rect = targetEl.getBoundingClientRect();
    const centerX = Math.round(rect.left + rect.width / 2);
    const centerY = Math.round(rect.top + rect.height / 2);

    // Visual highlight & cursor feedback
    const originalOutline = targetEl.style.outline;
    targetEl.style.outline = '3px solid #10b981';
    setTimeout(() => {
      if (targetEl) targetEl.style.outline = originalOutline;
    }, 1200);

    // 3. Execute Real Action
    let actionExecuted = '';
    let resultObtained = '';
    let success = true;

    try {
      if (step.actionType === 'input' || actualElementType === 'input' || actualElementType === 'textarea' || actualElementType === 'select') {
        const inputEl = targetEl as HTMLInputElement;
        inputEl.focus();
        const valToSet = step.targetValue || 'Amadou Sow';
        inputEl.value = valToSet;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        actionExecuted = `Saisie de "${valToSet}"`;
        success = inputEl.value === valToSet;
        resultObtained = success ? `Valeur vérifiée présente : "${inputEl.value}"` : `Échec de vérification valeur`;
      } else {
        targetEl.click();
        actionExecuted = 'Clic de validation / navigation';
        resultObtained = 'Clic exécuté avec succès sur le DOM réel';
      }
    } catch (err: any) {
      success = false;
      actionExecuted = step.actionType || 'action';
      resultObtained = `Erreur d’exécution : ${err?.message || 'Erreur inconnue'}`;
    }

    return {
      stepIndex,
      businessTarget,
      narration,
      domElementFound,
      actualElementType,
      selectorUsed,
      actionExecuted,
      resultObtained,
      success,
      coordinates: { x: centerX, y: centerY }
    };
  }
}
