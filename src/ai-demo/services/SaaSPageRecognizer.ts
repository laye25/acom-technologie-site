// src/ai-demo/services/SaaSPageRecognizer.ts
/**
 * SaaSPageRecognizer: Automatically recognizes the active Acom SaaS application,
 * active page, and extracts real DOM cartography and stable selectors.
 */

import { UIAnalyzer } from '../engines/UIAnalyzer';
import { UIAnalysis, UIControlInfo } from '../types';

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
    let pageName = 'Nouvel Enregistrement';

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
      confidence: 0.98,
      uiAnalysis
    };
  }

  /**
   * Matches or maps recognized UI controls to business actions
   */
  public static mapControlsToBusinessActions(controls: UIControlInfo[]): Array<{
    actionName: string;
    control?: UIControlInfo;
    targetSelector: string;
    intent: string;
  }> {
    return controls.map((ctrl, idx) => {
      let actionName = 'click';
      let intent = `Action sur ${ctrl.label}`;

      if (ctrl.type === 'textbox' || ctrl.type === 'select') {
        actionName = 'input';
        intent = `Saisie dans ${ctrl.label}`;
      } else if (ctrl.label.toLowerCase().includes('imprimer') || ctrl.label.toLowerCase().includes('valider')) {
        actionName = 'submit';
        intent = `Validation et émission du document`;
      }

      return {
        actionName,
        control: ctrl,
        targetSelector: ctrl.selector || `#control-${idx}`,
        intent
      };
    });
  }
}
