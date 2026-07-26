// src/ai-demo/services/LiveGuidanceEngine.ts
/**
 * LiveGuidanceEngine - Interactive Live Application Guidance & Automated Control Engine
 * Uses SAI scenarios to actively guide users or automatically take control of the target SaaS interface,
 * rendering a visible smooth virtual cursor, executing typewriter form inputs character by character,
 * making selections, clicking buttons, saving final data, and completing video tutorial generation.
 */

import { ScenarioApplicationIntelligent, SaiTimelineStep } from '../types/sai';
import { DemoProject } from '../types';
import { ExportEngine } from './ExportEngine';
import { DemoManager } from './DemoManager';
import { SaiEventBus } from './SaiEventBus';
import { VoiceEngine } from '../voice/VoiceEngine';
import toast from 'react-hot-toast';

export interface GuidanceSessionState {
  scenarioId: string;
  currentStepIndex: number;
  totalSteps: number;
  isCompleted: boolean;
  activeStep: SaiTimelineStep;
  progressPercentage: number;
  waitingForUserAction: boolean;
  history: Array<{ stepIndex: number; timestamp: string; validated: boolean }>;
  isAutoControlActive?: boolean;
}

/**
 * DomVirtualCursor - Floating smooth animated pointer overlaid directly on the target SaaS page
 */
export class DomVirtualCursor {
  private static cursorEl: HTMLDivElement | null = null;

  public static show(): HTMLDivElement {
    if (typeof document === 'undefined') return {} as HTMLDivElement;
    
    if (!this.cursorEl) {
      const el = document.createElement('div');
      el.id = 'acom-live-virtual-cursor';
      el.style.position = 'fixed';
      el.style.top = '120px';
      el.style.left = '120px';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '999999';
      el.style.transition = 'top 0.55s cubic-bezier(0.25, 1, 0.5, 1), left 0.55s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s ease';
      el.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 12px rgba(92, 33, 151, 0.6));">
            <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#8b5cf6" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
          <div id="acom-cursor-ripple" style="position: absolute; top: -10px; left: -10px; width: 52px; height: 52px; border-radius: 50%; border: 2.5px solid #10b981; opacity: 0; transform: scale(0.4); transition: all 0.35s ease-out;"></div>
          <div style="position: absolute; top: 22px; left: 18px; background: rgba(15, 23, 42, 0.92); color: #6ee7b7; border: 1px solid #10b981; border-radius: 8px; padding: 3px 8px; font-size: 11px; font-weight: 800; white-space: nowrap; font-family: system-ui, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
            <span>Guidage IA Direct</span>
          </div>
        </div>
      `;
      document.body.appendChild(el);
      this.cursorEl = el;
    }
    this.cursorEl.style.display = 'block';
    return this.cursorEl;
  }

  public static async moveToElement(targetEl: HTMLElement): Promise<{ x: number; y: number }> {
    const cursor = this.show();
    const rect = targetEl.getBoundingClientRect();
    const targetX = Math.max(20, rect.left + rect.width / 2);
    const targetY = Math.max(20, rect.top + rect.height / 2);

    cursor.style.left = `${targetX}px`;
    cursor.style.top = `${targetY}px`;

    // Wait for cursor travel animation to complete
    await new Promise((r) => setTimeout(r, 600));
    return { x: targetX, y: targetY };
  }

  public static async triggerClick(): Promise<void> {
    if (!this.cursorEl) return;
    const cursor = this.cursorEl;
    cursor.style.transform = 'scale(0.85)';
    const ripple = cursor.querySelector('#acom-cursor-ripple') as HTMLElement;
    if (ripple) {
      ripple.style.opacity = '1';
      ripple.style.transform = 'scale(1.4)';
    }
    await new Promise((r) => setTimeout(r, 220));
    cursor.style.transform = 'scale(1)';
    if (ripple) {
      ripple.style.opacity = '0';
      ripple.style.transform = 'scale(0.4)';
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  public static hide(): void {
    if (this.cursorEl) {
      this.cursorEl.style.display = 'none';
    }
  }
}

export class LiveGuidanceEngine {
  private static activeScenario: ScenarioApplicationIntelligent | null = null;
  private static currentStepIndex: number = 0;
  private static isGuidanceActive: boolean = false;
  private static isAutoControlActive: boolean = false;
  private static autoExecutionTimer: any = null;
  private static currentSessionId: string | null = null;

  public startGuidanceSession(scenario: ScenarioApplicationIntelligent): GuidanceSessionState {
    LiveGuidanceEngine.activeScenario = scenario;
    LiveGuidanceEngine.currentStepIndex = 0;
    LiveGuidanceEngine.isGuidanceActive = true;
    LiveGuidanceEngine.isAutoControlActive = false;
    LiveGuidanceEngine.currentSessionId = Math.random().toString(36).substring(7);
    return this.getSessionState();
  }

  /**
   * Generates a smart multi-step scenario for whatever active form is visible on screen
   */
  public static buildFormScenarioForCurrentPage(moduleName: string, pageName: string): ScenarioApplicationIntelligent {
    const steps: SaiTimelineStep[] = [];
    let stepIndex = 1;

    // Client Name
    const clientInput = document.querySelector<HTMLInputElement>('input[placeholder*="Nom"], input[placeholder*="nom"], input[name*="name"], input[name*="client"]') || 
                         document.querySelectorAll<HTMLInputElement>('form input[type="text"]')[0] || 
                         document.querySelector<HTMLInputElement>('input[type="text"]');
    if (clientInput) {
      steps.push({
        id: `step-${stepIndex}`,
        stepNumber: stepIndex++,
        startTimeSec: (stepIndex - 1) * 3,
        durationSec: 3.5,
        title: 'Saisie du Nom du Client',
        description: 'Saisie automatique caractère par caractère du nom client dans le formulaire',
        actionType: 'INPUT',
        intent: 'Identifier le client',
        zoomLevel: 1,
        effectOverlay: 'green_halo',
        narrationText: 'Saisie automatique du nom complet Amadou Sow.',
        targetId: clientInput.id || undefined
      } as any);
    }

    // Phone / WhatsApp
    const phoneInput = document.querySelector<HTMLInputElement>('input[placeholder*="221"], input[placeholder*="phone"], input[placeholder*="Téléphone"], input[name*="phone"]') || 
                        document.querySelectorAll<HTMLInputElement>('form input[type="text"]')[1];
    if (phoneInput) {
      steps.push({
        id: `step-${stepIndex}`,
        stepNumber: stepIndex++,
        startTimeSec: (stepIndex - 1) * 3,
        durationSec: 3.5,
        title: 'Numéro de Téléphone / WhatsApp',
        description: 'Saisie du contact pour l\'envoi automatique des notifications SMS/WhatsApp',
        actionType: 'INPUT',
        intent: 'Contacter le client',
        zoomLevel: 1,
        effectOverlay: 'green_halo',
        narrationText: 'Saisie du numéro WhatsApp +221 77 123 45 67.',
        targetId: phoneInput.id || undefined
      } as any);
    }

    // Email
    const emailInput = document.querySelector<HTMLInputElement>('input[type="email"], input[placeholder*="mail"], input[name*="email"]') || 
                       document.querySelectorAll<HTMLInputElement>('form input[type="text"]')[2];
    if (emailInput) {
      steps.push({
        id: `step-${stepIndex}`,
        stepNumber: stepIndex++,
        startTimeSec: (stepIndex - 1) * 3,
        durationSec: 3,
        title: 'Adresse Courriel Client',
        description: 'Saisie de l\'adresse email pour transmission du ticket numérique',
        actionType: 'INPUT',
        intent: 'Notifier le client',
        zoomLevel: 1,
        effectOverlay: 'green_halo',
        narrationText: 'Saisie de l\'email client@gmail.com.',
        targetId: emailInput.id || undefined
      } as any);
    }

    // Add article button or Quantity increment
    const addArticleBtn = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
      b => b.innerText.trim() === '+' || b.innerText.toLowerCase().includes('ajouter') || b.innerText.toLowerCase().includes('article') || b.querySelector('svg.lucide-plus')
    );
    if (addArticleBtn) {
      steps.push({
        id: `step-${stepIndex}`,
        stepNumber: stepIndex++,
        startTimeSec: (stepIndex - 1) * 3,
        durationSec: 2.5,
        title: 'Ajout d\'un Article / Quantité',
        description: 'Incrémentation de la quantité d\'articles dans la commande',
        actionType: 'CLICK',
        intent: 'Incrémenter le panier',
        zoomLevel: 1,
        effectOverlay: 'green_halo',
        narrationText: 'Clic sur le bouton d\'ajout d\'article.',
        targetId: addArticleBtn.id || undefined
      } as any);
    }

    // Weight / Amount / Acompte
    const numInput = document.querySelector<HTMLInputElement>('input[type="number"]:not([disabled]), input[placeholder*="500"], input[placeholder*="6.5"]');
    if (numInput) {
      steps.push({
        id: `step-${stepIndex}`,
        stepNumber: stepIndex++,
        startTimeSec: (stepIndex - 1) * 3,
        durationSec: 3,
        title: 'Saisie des Valeurs / Acompte',
        description: 'Saisie de l\'acompte perçu ou du poids en kg',
        actionType: 'INPUT',
        intent: 'Régler l\'acompte',
        zoomLevel: 1,
        effectOverlay: 'green_halo',
        narrationText: 'Saisie de la valeur financière ou du poids.',
        targetId: numInput.id || undefined
      } as any);
    }

    // Save Button / Submit
    const submitBtn = document.querySelector<HTMLElement>('button[type="submit"]') || 
                       Array.from(document.querySelectorAll<HTMLElement>('button')).find(
                         b => b.innerText.toLowerCase().includes('enregistrer') || b.innerText.toLowerCase().includes('valider') || b.innerText.toLowerCase().includes('sauvegarder')
                       );
    if (submitBtn) {
      steps.push({
        id: `step-${stepIndex}`,
        stepNumber: stepIndex++,
        startTimeSec: (stepIndex - 1) * 3,
        durationSec: 3.5,
        title: 'Validation & Enregistrement du Formulaire',
        description: 'Enregistrement des données saisies et confirmation',
        actionType: 'SUBMIT',
        intent: 'Finaliser l\'opération',
        zoomLevel: 1,
        effectOverlay: 'green_halo',
        narrationText: 'Validation finale du formulaire et enregistrement des données.',
        targetId: submitBtn.id || undefined
      } as any);
    }

    // Fallback if no specific input matched
    if (steps.length === 0) {
      steps.push({
        id: 'step-fallback-1',
        stepNumber: 1,
        startTimeSec: 0,
        durationSec: 3,
        title: 'Démonstration de l\'Interface Active',
        description: 'Parcours guidé automatique des éléments de la page',
        actionType: 'CLICK',
        intent: 'Présenter la page',
        zoomLevel: 1,
        effectOverlay: 'green_halo',
        narrationText: 'Parcours guidé de l\'interface active.'
      });
    }

    const isoNow = new Date().toISOString();

    return {
      $schema: 'https://acom-technologie.com/schemas/sai-v2.json',
      schemaVersion: '2.0.0',
      id: `sai-auto-${Date.now()}`,
      version: '2.0.0',
      metadata: {
        title: `Démonstration ${pageName}`,
        description: `Scénario de démonstration automatique pour ${moduleName}`,
        createdAt: isoNow,
        updatedAt: isoNow,
        author: 'ACOM AI Live Guidance',
        tags: ['auto-demo'],
        reviewStatus: 'PUBLISHED',
        merchantId: 'merchant-default',
        privacyLevel: 'INTERNAL',
        status: 'validated'
      },
      application: {
        appName: moduleName,
        moduleName: pageName,
        pageName: pageName,
        route: typeof window !== 'undefined' ? window.location.pathname : '/',
        version: '1.0.0',
        environment: 'web'
      },
      timeline: steps
    } as any;
  }

  /**
   * Starts automatic control of the target page:
   * Moves a visible virtual cursor smoothly across the screen,
   * Fills form fields character by character (typewriter effect),
   * performs selections, clicks buttons, and completes video tutorial generation.
   */
  public async startAutoControlSession(
    scenario?: ScenarioApplicationIntelligent,
    onStateChange?: (state: GuidanceSessionState) => void,
    onVideoComplete?: () => void
  ): Promise<void> {
    const sessionId = Math.random().toString(36).substring(7);
    LiveGuidanceEngine.currentSessionId = sessionId;
    
    if (LiveGuidanceEngine.isAutoControlActive) {
      VoiceEngine.stopSpeech();
    }
    
    const activeScenario = scenario || LiveGuidanceEngine.buildFormScenarioForCurrentPage('Acom SaaS', 'Interface Active');
    LiveGuidanceEngine.activeScenario = activeScenario;
    LiveGuidanceEngine.currentStepIndex = 0;
    LiveGuidanceEngine.isGuidanceActive = true;
    LiveGuidanceEngine.isAutoControlActive = true;

    const totalSteps = activeScenario.timeline.length;
    
    // Toasts removed to prevent them from showing up in the recorded video.

    // Show DOM virtual cursor
    DomVirtualCursor.show();

    for (let i = 0; i < totalSteps; i++) {
      if (!LiveGuidanceEngine.isAutoControlActive || !LiveGuidanceEngine.activeScenario || LiveGuidanceEngine.currentSessionId !== sessionId) break;

      LiveGuidanceEngine.currentStepIndex = i;
      const activeStep = activeScenario.timeline[i];
      const isLastStep = i === totalSteps - 1;

      if (onStateChange) {
        onStateChange(this.getSessionState());
      }

      // 1. Start TTS audio simultaneously with DOM action
      const stepDurationMs = Math.max(1200, (activeStep.durationSec || 2.5) * 1000);
      const voiceConfig = VoiceEngine.getAvailableVoices('fr')[0];
      
      const audioPromise = new Promise<void>(resolve => {
        if (activeStep.narrationText) {
          VoiceEngine.speakText(activeStep.narrationText, voiceConfig, resolve);
        } else {
          resolve();
        }
      });

      // 2. Move cursor, highlight element, and type/click live on DOM concurrently
      const domPromise = LiveGuidanceEngine.executeStepOnDom(activeStep, isLastStep);

      // Wait for both the minimum step duration AND the audio and DOM action to finish
      const timerPromise = new Promise<void>(resolve => setTimeout(resolve, stepDurationMs));
      await Promise.all([timerPromise, audioPromise, domPromise]);

      if (LiveGuidanceEngine.currentSessionId !== sessionId) break;

      if (isLastStep) {
        // Wait a little bit to show the final state
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (LiveGuidanceEngine.currentSessionId !== sessionId) return; // aborted

    // Hide DOM virtual cursor after completion
    DomVirtualCursor.hide();

    if (LiveGuidanceEngine.isAutoControlActive && LiveGuidanceEngine.activeScenario) {
      LiveGuidanceEngine.isAutoControlActive = false;
      LiveGuidanceEngine.isGuidanceActive = false;

      SaiEventBus.publish('sai:scenario_updated', {
        scenarioId: activeScenario.id,
        completedAt: Date.now()
      });

      if (onVideoComplete) {
        onVideoComplete();
      } else if (activeScenario) {
        const project: DemoProject = {
          id: `demo-${Date.now()}`,
          title: activeScenario.timeline[0]?.title ? `Tutoriel : ${activeScenario.timeline[0].title}` : `Démonstration ${activeScenario.application.moduleName}`,
          description: `Guide vidéo interactif généré automatiquement pour le module ${activeScenario.application.moduleName}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          durationSec: 15,
          moduleName: activeScenario.application.appName,
          pageName: activeScenario.application.moduleName,
          events: ((activeScenario as any).recordedEvents || []).map((e: any) => ({
            id: e.id,
            timestampMs: e.timestamp || 0,
            timeFormatted: '00:00.000',
            module: activeScenario.application.appName,
            page: activeScenario.application.moduleName,
            action: (e.type?.toLowerCase() as any) || 'click',
            buttonOrLabel: e.action || 'Action',
            targetTag: e.component,
            targetId: e.targetId
          })),
          timelineSteps: activeScenario.timeline as any,
          voiceConfig: {
            voiceId: 'fr-FR-Neural2-A',
            voiceName: 'Voix Fret IA Studio',
            gender: 'female',
            language: 'fr',
            pitch: 1.0,
            rate: 1.0,
            volume: 1.0,
            provider: 'webspeech'
          },
          videoConfig: {
            resolution: '1080p',
            fps: 30,
            aspectRatio: '16:9',
            format: 'mp4',
            includeNarration: true,
            includeSubtitles: true,
            backgroundMusicVolume: 0.1
          },
          brandingConfig: {
            showLogo: true,
            appName: activeScenario.application.appName,
            moduleName: activeScenario.application.moduleName,
            version: activeScenario.version || '1.0.0',
            primaryColor: '#5c2197',
            accentColor: '#10b981'
          },
          subtitles: {
            srtContent: '',
            vttContent: '',
            txtContent: '',
            items: []
          },
          documentation: {
            userGuideMarkdown: '',
            userGuideHtml: '',
            faqList: [],
            trainingScript: '',
            knowledgeBaseEntry: ''
          },
          status: 'ready',
          isTrainingMode: false,
          tags: ['auto-tutorial']
        };

        DemoManager.saveProject(project);
      }

      toast.success("Tutoriel vidéo généré et terminé automatiquement !", { id: 'auto-video-complete' });
    }

    if (onStateChange) {
      onStateChange(this.getSessionState());
    }
  }

  public static async executeStepOnDom(step: SaiTimelineStep, isLastStep: boolean = false): Promise<boolean> {
    if (typeof document === 'undefined') return false;

    const label = (step.title || step.intent || step.description || '').toLowerCase();
    const narration = (step.narrationText || '').toLowerCase();
    const actionType = String(step.actionType || 'CLICK').toUpperCase();
    const customTargetId = (step as any).targetId;

    let targetEl: HTMLElement | null = null;

    // 1. Try finding by step.targetId
    if (customTargetId) {
      targetEl = document.getElementById(customTargetId);
    }

    // 2. Intelligent field matching based on field labels & placeholders
    if (!targetEl) {
      if (label.includes('nom') || label.includes('client') || narration.includes('client') || narration.includes('nom')) {
        targetEl = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Nom"], input[placeholder*="nom"], input[name*="name"], input[name*="client"]'
        ) || document.querySelectorAll<HTMLInputElement>('form input[type="text"]')[0] || null;
      } else if (label.includes('téléphone') || label.includes('phone') || label.includes('contact') || narration.includes('téléphone')) {
        targetEl = document.querySelector<HTMLInputElement>(
          'input[placeholder*="221"], input[placeholder*="phone"], input[placeholder*="Téléphone"], input[name*="phone"]'
        ) || document.querySelectorAll<HTMLInputElement>('form input[type="text"]')[1] || null;
      } else if (label.includes('email') || label.includes('courriel') || narration.includes('email')) {
        targetEl = document.querySelector<HTMLInputElement>(
          'input[type="email"], input[placeholder*="mail"], input[name*="email"]'
        ) || document.querySelectorAll<HTMLInputElement>('form input[type="text"]')[2] || null;
      } else if (label.includes('poids') || label.includes('kg') || narration.includes('poids')) {
        targetEl = document.querySelector<HTMLInputElement>(
          'input[placeholder*="6.5"], input[placeholder*="kg"], input[name*="weight"]'
        ) || null;
      } else if (label.includes('remise') || label.includes('réduction')) {
        targetEl = document.querySelector<HTMLInputElement>(
          'input[placeholder*="500"], input[placeholder*="10"]'
        ) || null;
      } else if (label.includes('montant') || label.includes('acompte') || label.includes('perçu') || narration.includes('acompte')) {
        targetEl = document.querySelector<HTMLInputElement>(
          'input[type="number"]:not([disabled])'
        ) || null;
      } else if (label.includes('ajouter') || label.includes('article') || label.includes('+') || narration.includes('article')) {
        targetEl = document.querySelector<HTMLElement>(
          'button:has(svg):not([type="submit"]), button.w-8.h-8'
        ) || Array.from(document.querySelectorAll<HTMLElement>('button')).find(b => b.innerText.trim() === '+') || null;
      }
    }

    // 3. Match by element innerText / placeholder / title
    if (!targetEl) {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('button, input, select, textarea, [role="button"], a, label')
      );

      for (const el of candidates) {
        const text = (
          el.innerText ||
          el.getAttribute('aria-label') ||
          el.getAttribute('placeholder') ||
          el.getAttribute('title') ||
          el.getAttribute('name') ||
          ''
        ).toLowerCase();

        if (text && (text.includes(label) || label.includes(text) || narration.includes(text))) {
          targetEl = el;
          break;
        }
      }
    }

    // 4. Fallback heuristics for form inputs or save button
    if (!targetEl) {
      if (actionType === 'SUBMIT' || label.includes('enregistrer') || label.includes('valider') || label.includes('sauvegarder') || label.includes('ticket')) {
        targetEl = document.querySelector<HTMLElement>('button[type="submit"]') ||
          Array.from(document.querySelectorAll<HTMLElement>('button')).find(b => b.innerText.toLowerCase().includes('enregistrer')) ||
          document.querySelector<HTMLElement>('form button:last-child');
      } else if (actionType === 'INPUT' || label.includes('saisie')) {
        targetEl = document.querySelector<HTMLInputElement>('form input:not([type="hidden"])');
      } else {
        targetEl = null; // Do not fallback to random buttons which breaks the UI
      }
    }

    if (!targetEl) return false;

    // Strict UI presence checks
    const rect = targetEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const computedStyle = window.getComputedStyle(targetEl);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
      return false;
    }

    // Prevent closing the modal: avoid clicking buttons that usually close modals
    if (targetEl.tagName.toLowerCase() === 'button' || targetEl.getAttribute('role') === 'button') {
      const text = (targetEl.innerText || targetEl.getAttribute('aria-label') || '').toLowerCase().trim();
      if (text === 'x' || text.includes('fermer') || text.includes('annuler') || text.includes('cancel') || text.includes('close')) {
        return false;
      }
    }

    // Scroll element into view safely
    try {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // scrollIntoView safety
    }

    // Move virtual cursor to element
    await DomVirtualCursor.moveToElement(targetEl);
    await DomVirtualCursor.triggerClick();

    // Visual highlight on target
    const origOutline = targetEl.style.outline;
    const origBoxShadow = targetEl.style.boxShadow;
    const origTransition = targetEl.style.transition;
    targetEl.style.transition = 'all 0.3s ease';
    targetEl.style.outline = '4px solid #10b981';
    targetEl.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.95)';
    
    try {
      targetEl.focus();
    } catch {
      // focus safety
    }

    // Handle React controlled inputs with character-by-character TYPEWRITER effect!
    if (targetEl instanceof HTMLInputElement || targetEl instanceof HTMLTextAreaElement) {
      const fullVal = LiveGuidanceEngine.determineInputValue(step, narration, targetEl);
      const prototype = targetEl instanceof HTMLInputElement 
        ? window.HTMLInputElement.prototype 
        : window.HTMLTextAreaElement.prototype;
      const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

      // Clear existing first
      if (nativeValueSetter) {
        nativeValueSetter.call(targetEl, '');
      } else {
        targetEl.value = '';
      }
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));

      // Type character by character live!
      let currentTyped = '';
      for (let charIndex = 0; charIndex < fullVal.length; charIndex++) {
        currentTyped += fullVal[charIndex];
        if (nativeValueSetter) {
          nativeValueSetter.call(targetEl, currentTyped);
        } else {
          targetEl.value = currentTyped;
        }
        targetEl.dispatchEvent(new Event('input', { bubbles: true }));
        targetEl.dispatchEvent(new Event('change', { bubbles: true }));
        // 55ms keystroke delay for natural live typewriter effect
        await new Promise((r) => setTimeout(r, 55));
      }

      targetEl.dispatchEvent(new Event('blur', { bubbles: true }));
    }
    // Handle selects
    else if (targetEl instanceof HTMLSelectElement) {
      if (targetEl.options.length > 1) {
        const prototype = window.HTMLSelectElement.prototype;
        const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        const newIndex = Math.min(1, targetEl.options.length - 1);
        const newVal = targetEl.options[newIndex].value;

        if (nativeValueSetter) {
          nativeValueSetter.call(targetEl, newVal);
        } else {
          targetEl.selectedIndex = newIndex;
        }

        targetEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    // Handle buttons / clicks / submits
    else {
      targetEl.click();
    }

    await new Promise((r) => setTimeout(r, 450));
    targetEl.style.outline = origOutline;
    targetEl.style.boxShadow = origBoxShadow;
    targetEl.style.transition = origTransition;

    return true;
  }

  private static determineInputValue(step: SaiTimelineStep, narration: string, inputEl: HTMLInputElement | HTMLTextAreaElement): string {
    const text = (step.title + ' ' + narration + ' ' + (inputEl.placeholder || '') + ' ' + (inputEl.name || '')).toLowerCase();

    if (text.includes('nom') || text.includes('client')) return 'Amadou Sow';
    if (text.includes('téléphone') || text.includes('phone') || text.includes('whatsapp') || text.includes('contact')) return '+221 77 123 45 67';
    if (text.includes('email') || text.includes('courriel')) return 'client@gmail.com';
    if (text.includes('poids') || text.includes('kg')) return '6.5';
    if (text.includes('note') || text.includes('observation') || text.includes('état')) return 'Articles de valeur, repassage délicat';
    if (text.includes('montant') || text.includes('acompte')) return '5000';

    return 'Amadou Sow';
  }

  public nextStep(): GuidanceSessionState {
    if (!LiveGuidanceEngine.activeScenario) throw new Error('Aucune session de guidance active');

    if (LiveGuidanceEngine.currentStepIndex < LiveGuidanceEngine.activeScenario.timeline.length - 1) {
      LiveGuidanceEngine.currentStepIndex += 1;
    } else {
      LiveGuidanceEngine.isGuidanceActive = false;
    }

    return this.getSessionState();
  }

  public previousStep(): GuidanceSessionState {
    if (!LiveGuidanceEngine.activeScenario) throw new Error('Aucune session de guidance active');

    if (LiveGuidanceEngine.currentStepIndex > 0) {
      LiveGuidanceEngine.currentStepIndex -= 1;
    }

    return this.getSessionState();
  }

  public stopSession(): void {
    if (LiveGuidanceEngine.autoExecutionTimer) {
      clearTimeout(LiveGuidanceEngine.autoExecutionTimer);
      LiveGuidanceEngine.autoExecutionTimer = null;
    }
    LiveGuidanceEngine.currentSessionId = null;
    VoiceEngine.stopSpeech();
    DomVirtualCursor.hide();
    LiveGuidanceEngine.activeScenario = null;
    LiveGuidanceEngine.currentStepIndex = 0;
    LiveGuidanceEngine.isGuidanceActive = false;
    LiveGuidanceEngine.isAutoControlActive = false;
  }

  public getSessionState(): GuidanceSessionState {
    if (!LiveGuidanceEngine.activeScenario) {
      return {
        scenarioId: '',
        currentStepIndex: 0,
        totalSteps: 0,
        isCompleted: false,
        activeStep: {
          id: 'dummy',
          stepNumber: 0,
          startTimeSec: 0,
          durationSec: 0,
          title: 'Session Inactive',
          description: '',
          actionType: 'CLICK',
          intent: '',
          zoomLevel: 1,
          effectOverlay: 'none',
          narrationText: ''
        },
        progressPercentage: 0,
        waitingForUserAction: false,
        history: [],
        isAutoControlActive: false
      };
    }

    const totalSteps = LiveGuidanceEngine.activeScenario.timeline.length;
    const isCompleted = LiveGuidanceEngine.currentStepIndex >= totalSteps - 1;
    const activeStep = LiveGuidanceEngine.activeScenario.timeline[LiveGuidanceEngine.currentStepIndex] || LiveGuidanceEngine.activeScenario.timeline[0];
    const progressPercentage = Math.round(((LiveGuidanceEngine.currentStepIndex + 1) / totalSteps) * 100);

    return {
      scenarioId: LiveGuidanceEngine.activeScenario.id,
      currentStepIndex: LiveGuidanceEngine.currentStepIndex,
      totalSteps,
      isCompleted,
      activeStep,
      progressPercentage,
      waitingForUserAction: !LiveGuidanceEngine.isAutoControlActive,
      history: [],
      isAutoControlActive: LiveGuidanceEngine.isAutoControlActive
    };
  }
}
