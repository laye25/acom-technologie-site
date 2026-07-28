// src/ai-demo/services/SaaSPageRecognizer.ts
/**
 * SaaSPageRecognizer: Automatically recognizes the active Acom SaaS application,
 * active page, and extracts real DOM cartography and stable selectors.
 */

import { UIAnalyzer } from '../engines/UIAnalyzer';
import { UIAnalysis, UIControlInfo, TimelineStep } from '../types';
import { ScenarioApplicationIntelligent } from '../types/sai';

export interface SaaSProfile {
  saasId: string;
  saasName: string;
  pageId: string;
  pageName: string;
  route: string;
  confidence: number;
  uiAnalysis: UIAnalysis;
}

export class SaaSPageRecognizer {
  /**
   * Automatically detects the active SaaS and page from window location and DOM
   */
  public static detectActiveSaaSAndPage(): SaaSProfile {
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const fullUrl = pathname + hash;

    let saasId = 'pressing';
    let saasName = 'Acom Pressing';
    let pageId = 'reception';
    let pageName = 'Réception & Dépôt Client';

    if (fullUrl.includes('tailleur') || fullUrl.includes('couture')) {
      saasId = 'tailleur';
      saasName = 'Atelier de Couture & Mesures';
      pageId = fullUrl.includes('orders') ? 'orders' : 'clients';
      pageName = fullUrl.includes('orders') ? 'Commandes Couture' : 'Fichiers Clients & Mesures';
    } else if (fullUrl.includes('stock') || fullUrl.includes('caisse') || fullUrl.includes('pos')) {
      saasId = 'stock_retail';
      saasName = 'Acom Stock & Caisse POS';
      pageId = 'pos_terminal';
      pageName = 'Terminal de Caisse';
    } else if (fullUrl.includes('school') || fullUrl.includes('ecole')) {
      saasId = 'school';
      saasName = 'Acom École';
      pageId = 'students';
      pageName = 'Gestion Inscriptions';
    } else if (fullUrl.includes('health') || fullUrl.includes('sante')) {
      saasId = 'health';
      saasName = 'Acom Santé';
      pageId = 'consultation';
      pageName = 'Fiche Consultation';
    } else {
      // Default / Golden Reference: Pressing
      saasId = 'pressing';
      saasName = 'Acom Pressing';
      pageId = 'reception';
      pageName = 'Réception & Dépôt Client';
    }

    const uiAnalysis = UIAnalyzer.analyzeCurrentUI(saasName, pageName);

    return {
      saasId,
      saasName,
      pageId,
      pageName,
      route: pathname,
      confidence: 0.99,
      uiAnalysis
    };
  }

  /**
   * Generates real DOM-driven timeline steps from discovered UI controls
   */
  public static generateStepsFromDOM(uiAnalysis: UIAnalysis): TimelineStep[] {
    const steps: TimelineStep[] = [];
    const controls = uiAnalysis.controls || [];

    // Step 1: Page recognition & Context
    steps.push({
      id: 'step-recog',
      stepNumber: 1,
      startTimeSec: 0,
      durationSec: 3,
      title: `Reconnaissance SaaS : ${uiAnalysis.module}`,
      description: `Page active détectée : ${uiAnalysis.page} (${uiAnalysis.controls.length} éléments DOM cartographiés).`,
      actionType: 'click',
      targetSelector: 'body',
      narrationText: `Module ${uiAnalysis.module} reconnu. Page active : ${uiAnalysis.page}. Cartographie DOM réelle établie.`,
      zoomLevel: 1.0,
      effectOverlay: 'green_halo',
      x: 200,
      y: 150
    });

    // Generate steps from discovered controls
    controls.slice(0, 5).forEach((ctrl, idx) => {
      const isInput = ctrl.type === 'textbox' || ctrl.type === 'select';
      steps.push({
        id: `step-ctrl-${idx}`,
        stepNumber: idx + 2,
        startTimeSec: (idx + 1) * 3,
        durationSec: 3,
        title: isInput ? `Saisie : ${ctrl.label}` : `Action : ${ctrl.label}`,
        description: `Interaction temps réel sur l'élément stable "${ctrl.selector}".`,
        actionType: isInput ? 'input' : 'click',
        targetSelector: ctrl.selector,
        targetValue: isInput ? 'Amadou Sow' : undefined,
        narrationText: isInput ? `Saisie automatique dans le champ ${ctrl.label}.` : `Clic sur le bouton ${ctrl.label}.`,
        zoomLevel: 1.2,
        effectOverlay: 'arrow_pointer',
        x: 350 + (idx * 50) % 300,
        y: 200 + (idx * 40) % 200
      });
    });

    return steps;
  }

  public static generateLiveScenario(domainName: string, pageName: string): ScenarioApplicationIntelligent {
    const analysis = UIAnalyzer.analyzeCurrentUI(domainName, pageName);
    const timelineSteps = this.generateStepsFromDOM(analysis);

    return {
      $schema: 'https://acom.tech/schemas/sai.v1.json',
      id: `sai-live-dynamic-${Date.now()}`,
      version: '1.0.0',
      schemaVersion: '1.0.0',
      metadata: {
        title: `Scénario Dynamique Live : ${domainName}`,
        description: `Scénario généré en temps réel par inspection directe du DOM réel de la page active.`,
        author: 'Acom Live DOM Engine',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        merchantId: 'merchant-live-001',
        privacyLevel: 'PUBLIC',
        tags: ['live', 'dom-inspection', 'dynamic', 'runtime'],
        status: 'validated',
        reviewStatus: 'APPROVED',
        qualityScore: 100
      },
      application: {
        appName: domainName,
        moduleName: analysis.module,
        pageName: analysis.page,
        route: window.location.pathname,
        version: '2.5.0',
        environment: 'web'
      },
      events: [],
      snapshots: [],
      timeline: timelineSteps.map(s => ({
        id: s.id,
        stepNumber: s.stepNumber,
        startTimeSec: s.startTimeSec,
        durationSec: s.durationSec,
        title: s.title,
        description: s.description,
        actionType: s.actionType as any,
        intent: s.title,
        targetSelector: s.targetSelector,
        targetValue: s.targetValue,
        narrationText: s.narrationText,
        zoomLevel: s.zoomLevel,
        effectOverlay: s.effectOverlay,
        x: s.x,
        y: s.y
      })),
      knowledge: [],
      narration: [],
      diagnostics: {
        overallScore: 100,
        readabilityScore: 100,
        rhythmScore: 100,
        pedagogyScore: 100,
        deadTimeTrimmedSec: 0,
        suggestions: []
      },
      exports: {},
      history: [],
      extensions: {}
    };
  }

  /**
   * Instantly fills current visible form inputs on the active page with realistic demo data.
   */
  public static autofillCurrentPageInputs(): number {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input:not([type]), textarea'
    )).filter(el => {
      // Ignore floating widget, navigation, header, sidebar, search bars and filters
      if (
        el.closest('#acom-demo-floating-widget') ||
        el.closest('nav') ||
        el.closest('header') ||
        el.closest('aside') ||
        el.closest('[role="search"]') ||
        el.closest('.search-bar') ||
        el.closest('[class*="search"]') ||
        el.closest('[id*="search"]') ||
        el.closest('[class*="filter"]')
      ) {
        return false;
      }
      const style = window.getComputedStyle(el);
      const isReadOnly = 'readOnly' in el ? (el as HTMLInputElement | HTMLTextAreaElement).readOnly : false;
      return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled && !isReadOnly;
    });

    let filledCount = 0;

    const sampleNames = ['Amadou Diallo', 'Aïssatou Sow', 'Khadija Ndiaye', 'Ousmane Ba'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];

    inputs.forEach(el => {
      const textContext = [
        el.getAttribute('name') || '',
        el.getAttribute('id') || '',
        el.getAttribute('placeholder') || '',
        el.getAttribute('aria-label') || '',
        el.labels ? Array.from(el.labels).map(l => l.innerText).join(' ') : '',
        el.parentElement?.innerText || ''
      ].join(' ').toLowerCase();

      let valToSet = '';

      if (textContext.includes('nom') || textContext.includes('client') || textContext.includes('customer') || textContext.includes('nom complet')) {
        valToSet = randomName;
      } else if (textContext.includes('tel') || textContext.includes('phone') || textContext.includes('whatsapp') || textContext.includes('mobile')) {
        valToSet = '+221 77 845 12 90';
      } else if (textContext.includes('mail') || textContext.includes('email')) {
        valToSet = 'client.demo@acom.sn';
      } else if (textContext.includes('adresse') || textContext.includes('address') || textContext.includes('ville') || textContext.includes('quartier')) {
        valToSet = 'Dakar, Mermoz - Sacré Cœur';
      } else if (textContext.includes('obs') || textContext.includes('remarque') || textContext.includes('note') || textContext.includes('description') || textContext.includes('état')) {
        valToSet = 'Costume 2 pièces + Chemise, traitement anti-taches prioritaire.';
      } else if (textContext.includes('montant') || textContext.includes('prix') || textContext.includes('tarif') || textContext.includes('price') || textContext.includes('avance') || textContext.includes('paye')) {
        valToSet = '15000';
      } else if (textContext.includes('qte') || textContext.includes('quantite') || textContext.includes('nombre') || textContext.includes('poids')) {
        valToSet = '3';
      } else if (!el.value) {
        valToSet = 'Donnée Démo ACOM';
      }

      if (valToSet) {
        // Dispatch React synthetic value change
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          el.tagName.toLowerCase() === 'textarea'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, valToSet);
        } else {
          el.value = valToSet;
        }

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));

        // Visual flash effect on filled inputs
        const origOutline = el.style.outline;
        const origTransition = el.style.transition;
        el.style.transition = 'all 0.3s ease';
        el.style.outline = '2px solid #10b981';
        setTimeout(() => {
          el.style.outline = origOutline;
          el.style.transition = origTransition;
        }, 1200);

        filledCount++;
      }
    });

    return filledCount;
  }
}

