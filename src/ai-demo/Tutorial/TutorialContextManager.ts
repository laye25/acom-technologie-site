// src/ai-demo/Tutorial/TutorialContextManager.ts
// Real-Time Adaptive Context Manager for Acom IA Démo
// Constantly monitors active SaaS, active module, active tab, active page, available DOM targets, and user actions
// Automatically recalculates and adapts tutorial scenarios and voice narration in real-time.

import { ContextEngine } from '../Intelligence/ContextEngine';
import { LanguageEngine } from '../Assistant/LanguageEngine';
import { TutorialEngine } from './TutorialEngine';
import { TutorialScenario } from '../types';

export type TutorialMode = 'free_exploration' | 'guided_parcours';

export interface ContextState {
  saas: string;
  module: string;
  page: string;
  activeTab: string;
  activeModal: string | null;
  subContext: string | null;
  visibleTargets: string[];
  mode: TutorialMode;
  visitedPages: string[];
}

class TutorialContextManagerService {
  private mode: TutorialMode = 'free_exploration';
  private visitedPages: Set<string> = new Set(['dashboard']);
  private listeners: Set<(state: ContextState) => void> = new Set();
  private lastContextKey: string = '';
  private isProcessingTransition: boolean = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    // Subscribe to ContextEngine updates
    ContextEngine.subscribe(() => {
      this.evaluateAndAdaptContext('context_engine_update');
    });

    // Resize and scroll listeners to keep DOM target resolution fresh
    window.addEventListener('resize', () => this.notify());
  }

  public getMode(): TutorialMode {
    return this.mode;
  }

  public setMode(newMode: TutorialMode): void {
    this.mode = newMode;
    this.notify();
  }

  public getVisitedPages(): string[] {
    return Array.from(this.visitedPages);
  }

  public isVisited(pageId: string): boolean {
    return this.visitedPages.has(pageId);
  }

  public markVisited(pageId: string): void {
    this.visitedPages.add(pageId);
  }

  public detectSaas(): string {
    const ctx = ContextEngine.getContext();
    return ctx.activeSaaS || 'couture';
  }

  public detectPage(): string {
    const ctx = ContextEngine.getContext();
    return ctx.currentPage || 'dashboard';
  }

  public detectActiveTab(): string {
    return this.detectPage();
  }

  public detectModal(): string | null {
    return TutorialEngine.getActiveModal();
  }

  public detectModule(): string {
    const saas = this.detectSaas();
    const page = this.detectPage();

    if (saas === 'couture' || saas === 'tailleur') {
      if (page === 'tailleur_clients' || page === 'clients-couture' || page === 'clients') return 'Fichier Clients Couture';
      if (page === 'tailleur_orders' || page === 'commandes-mesures' || page === 'orders') return 'Commandes Mesures & Confection';
      if (page === 'tailleur_tissus' || page === 'tissus-wax' || page === 'textiles') return 'Stock Tissus & Wax';
      if (page === 'tailleur_boutique' || page === 'boutique-pret-a-porter') return 'Boutique Prêt-à-Porter';
      if (page === 'tailleur_gallery' || page === 'inspirations-moodboards') return 'Inspirations & Moodboards';
      if (page === 'tailleur_artisans') return 'Artisans & Équipe Atelier';
      if (page === 'tailleur_mercerie') return 'Mercerie & Coûts';
      if (page === 'tailleur_closure') return 'Clôture de Caisse Atelier';
      return 'Ateliers de Couture';
    }
    if (saas === 'pressing') {
      if (page === 'pressing_receipt') return 'Fiche de Réception Pressing';
      if (page === 'pressing_tarifs') return 'Paramétrage des Tarifs';
      if (page === 'pressing_stock') return 'Vente & Stock Pressing';
      if (page === 'pressing_closure') return 'Clôture de Caisse Pressing';
      return 'Management Pressing';
    }
    if (saas === 'stock' || saas === 'boutique' || saas === 'commerce') {
      if (page === 'pos' || page === 'caisse') return 'Caisse POS';
      if (page === 'inventory' || page === 'stock') return 'Gestion du Stock';
      if (page === 'suppliers' || page === 'fournisseurs') return 'Partenaires & Fournisseurs';
      if (page === 'billing' || page === 'facturation') return 'Facturation & Devis';
      if (page === 'audit') return 'Journal d\'Audit';
      return 'Management Commerce';
    }
    return 'Espace Acom Technologie';
  }

  public detectVisibleTargets(): string[] {
    if (typeof document === 'undefined') return [];
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-acom-id], [data-tutorial], [data-tutorial-id]')
    );
    return elements
      .filter(el => el.clientWidth > 0 && el.clientHeight > 0)
      .map(el => el.getAttribute('data-acom-id') || el.getAttribute('data-tutorial') || el.getAttribute('data-tutorial-id') || '')
      .filter(Boolean);
  }

  public detectContext(): ContextState {
    const saas = this.detectSaas();
    const page = this.detectPage();
    const activeModal = this.detectModal();
    const module = this.detectModule();
    const visibleTargets = this.detectVisibleTargets();

    return {
      saas,
      module,
      page,
      activeTab: page,
      activeModal,
      subContext: activeModal ? `modal:${activeModal}` : null,
      visibleTargets,
      mode: this.mode,
      visitedPages: this.getVisitedPages()
    };
  }

  /**
   * Evaluates context and triggers smooth scenario adaptation if navigation / context changed.
   */
  public evaluateAndAdaptContext(source: string = 'manual'): void {
    if (this.isProcessingTransition) return;

    const currentCtx = this.detectContext();
    const contextKey = `${currentCtx.saas}:${currentCtx.page}:${currentCtx.activeModal || 'none'}`;

    if (contextKey === this.lastContextKey) return;
    this.lastContextKey = contextKey;

    this.markVisited(currentCtx.page);

    // If tutorial is currently active (or in free exploration), adapt immediately!
    if (TutorialEngine.isTutorialActive() || this.mode === 'free_exploration') {
      this.isProcessingTransition = true;

      // 1. Interrupt active speech and clear voice queue
      this.stopCurrentSpeech();

      // 2. Clear current focus / halo
      this.clearCurrentFocus();

      // 3. Resolve scenario for the new page / modal
      const scenario = TutorialEngine.getScenarioForPage(currentCtx.page, currentCtx.saas);

      if (scenario) {
        // 4. Switch scenario seamlessly
        TutorialEngine.startTutorial(scenario, 0);
      }

      setTimeout(() => {
        this.isProcessingTransition = false;
      }, 300);
    }

    this.notify();
  }

  /**
   * Called when user manually clicks a tab, opens modal, or changes SaaS.
   */
  public onNavigationChange(newPage: string, newSaas?: string): void {
    const targetSaas = newSaas || this.detectSaas();

    // 1. Stop current speech narration immediately
    this.stopCurrentSpeech();

    // 2. Clear current focus
    this.clearCurrentFocus();

    // 3. Update ContextEngine
    ContextEngine.updateContext({
      currentPage: newPage,
      activeSaaS: targetSaas as any
    });

    // 4. Adapt context
    this.evaluateAndAdaptContext('navigation_change');
  }

  public stopCurrentSpeech(): void {
    LanguageEngine.stopSpeech();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }

  public clearCurrentFocus(): void {
    // Standard focus clearing handled via TutorialEngine notify
  }

  public scrollToTarget(targetAcomId: string): void {
    if (typeof document === 'undefined' || !targetAcomId) return;

    const el = document.querySelector<HTMLElement>(
      `[data-acom-id="${targetAcomId}"], [data-tutorial="${targetAcomId}"], [data-tutorial-id="${targetAcomId}"], #${targetAcomId}`
    );

    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      } catch (e) {
        window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 120, behavior: 'smooth' });
      }
    }
  }

  public focusTarget(targetAcomId: string): void {
    this.scrollToTarget(targetAcomId);
    TutorialEngine.jumpToAcomId(targetAcomId);
  }

  public switchScenario(scenarioOrId: TutorialScenario | string, initialStepIndex: number = 0): void {
    this.stopCurrentSpeech();
    this.clearCurrentFocus();

    if (typeof scenarioOrId === 'string') {
      const resolved = TutorialEngine.getScenarioForPage(scenarioOrId);
      if (resolved) {
        TutorialEngine.startTutorial(resolved, initialStepIndex);
      }
    } else {
      TutorialEngine.startTutorial(scenarioOrId, initialStepIndex);
    }
  }

  public startStep(stepIndex: number): void {
    TutorialEngine.jumpToStepIndex(stepIndex);
  }

  public detectUserAction(actionType: string, targetId?: string): void {
    console.log(`[TutorialContextManager] User action detected: ${actionType} on ${targetId}`);
    if (actionType === 'tab_click' && targetId) {
      this.onNavigationChange(targetId);
    }
  }

  public subscribe(listener: (state: ContextState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.detectContext();
    this.listeners.forEach(l => l(state));
  }
}

export const TutorialContextManager = new TutorialContextManagerService();
