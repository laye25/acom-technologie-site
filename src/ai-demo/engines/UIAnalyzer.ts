// src/ai-demo/engines/UIAnalyzer.ts
// ACOM UI Analyzer: Directly inspects application interface structure, buttons, forms, and pages.

import { UIAnalysis, UIControlInfo } from '../types';
import { SensitiveDataMasker } from '../utils/sensitiveDataMasker';

export class UIAnalyzer {
  /**
   * Inspects the current DOM or target container to produce a clean UIAnalysis object
   */
  public static analyzeCurrentUI(moduleName: string, pageName: string): UIAnalysis {
    const controls: UIControlInfo[] = [];

    // 1. Gather Buttons
    const buttons = document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"]');
    buttons.forEach((btn) => {
      const el = btn as HTMLElement;
      const text = el.innerText || el.getAttribute('aria-label') || el.title || '';
      if (text.trim() && el.offsetWidth > 0 && el.offsetHeight > 0) {
        controls.push({
          type: 'button',
          label: text.trim().substring(0, 40),
          id: el.id || undefined,
          selector: this.getElementCssSelector(el)
        });
      }
    });

    // 2. Gather Text Inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], textarea, select');
    inputs.forEach((input) => {
      const el = input as HTMLInputElement;
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        const labelText = this.findLabelForInput(el) || el.getAttribute('placeholder') || el.name || 'Champ Saisi';
        const isSensitive = SensitiveDataMasker.isElementSensitive(el);

        controls.push({
          type: el.tagName.toLowerCase() === 'select' ? 'select' : 'textbox',
          label: labelText.substring(0, 40),
          id: el.id || undefined,
          selector: this.getElementCssSelector(el),
          isSensitive
        });
      }
    });

    // 3. Gather Modals & Titles
    const h1OrH2 = document.querySelector('h1, h2, h3, [role="heading"]');
    const pageTitle = h1OrH2 ? (h1OrH2 as HTMLElement).innerText.trim() : pageName;

    return {
      module: moduleName || 'Acom SaaS',
      page: pageName || 'Accueil',
      title: pageTitle || 'Interface Utilisateur',
      controls: controls.slice(0, 25), // keep concise
      timestamp: new Date().toISOString()
    };
  }

  private static findLabelForInput(input: HTMLElement): string | null {
    if (input.id) {
      const labelEl = document.querySelector(`label[for="${input.id}"]`);
      if (labelEl) return (labelEl as HTMLElement).innerText;
    }
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.innerText;
    return null;
  }

  private static getElementCssSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const firstClass = el.className.split(' ')[0];
      if (firstClass) return `.${firstClass}`;
    }
    return el.tagName.toLowerCase();
  }
}
