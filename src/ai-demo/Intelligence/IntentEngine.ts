// src/ai-demo/Intelligence/IntentEngine.ts
// Converts user natural language prompts (French & Wolof) into structured NLU intent results

import { NLUIntentResult, SaaSContext } from '../types';
import { ContextEngine } from './ContextEngine';

class IntentEngineService {
  public async parseIntent(prompt: string, contextOverride?: SaaSContext): Promise<NLUIntentResult> {
    const context = contextOverride || ContextEngine.getContext();
    const availableCapabilities = ContextEngine.getAvailableCapabilities();

    try {
      const response = await fetch('/api/gemini/nlu-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          saasContext: context,
          availableCapabilities
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: NLUIntentResult = await response.json();
      return result;
    } catch (err) {
      console.warn('[IntentEngine] NLU API call failed, using client fallback', err);
      return this.clientFallbackParse(prompt, context);
    }
  }

  private clientFallbackParse(prompt: string, context: SaaSContext): NLUIntentResult {
    const text = prompt.toLowerCase();

    if (text.includes('client') && (text.includes('cherche') || text.includes('wut') || text.includes('gis'))) {
      const queryMatch = prompt.match(/(?:client|wut|gis|recherche)\s+([a-zA-Z0-9\s]+)/i);
      const query = queryMatch ? queryMatch[1].trim() : prompt;
      return {
        intentId: 'pressing.searchCustomer',
        actionFound: true,
        parameters: { query },
        missingParameters: [],
        isAmbiguous: false,
        explanationFr: `Recherche du client "${query}".`,
        explanationWolof: `Wut client "${query}".`,
        riskLevel: 'read',
        confidence: 0.85
      };
    }

    if (text.includes('client') && (text.includes('ajoute') || text.includes('créer') || text.includes('bind'))) {
      const nameMatch = prompt.match(/(?:client|nom)\s+([a-zA-Z\s]+)/i);
      const phoneMatch = prompt.match(/(\+?221\s?[0-9]{8,9}|7[06785]\d{7})/);
      const clientName = nameMatch ? nameMatch[1].trim() : '';
      const clientPhone = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : '';

      const missing = [];
      if (!clientName) missing.push('clientName');
      if (!clientPhone) missing.push('clientPhone');

      return {
        intentId: 'pressing.createCustomer',
        actionFound: true,
        parameters: { clientName, clientPhone },
        missingParameters: missing,
        isAmbiguous: false,
        explanationFr: missing.length > 0 ? `Il manque : ${missing.join(', ')}.` : `Création du client ${clientName}.`,
        explanationWolof: missing.length > 0 ? `Dafa manque : ${missing.join(', ')}.` : `Bind client ${clientName}.`,
        riskLevel: 'normal',
        confidence: 0.8
      };
    }

    if (text.includes('dépôt') || text.includes('depot') || text.includes('habit') || text.includes('senat') || text.includes('ticket')) {
      const nameMatch = prompt.match(/(?:client|pour|nom)\s+([a-zA-Z]+)/i);
      const amountMatch = prompt.match(/(\d+[\d\s]*)\s*(?:fcfa|f|cfa)/i);
      const clientName = nameMatch ? nameMatch[1].trim() : 'Client Passage';
      const amountPaid = amountMatch ? parseInt(amountMatch[1].replace(/\s/g, ''), 10) : 0;

      return {
        intentId: 'pressing.createReceipt',
        actionFound: true,
        parameters: { clientName, amountPaid, totalAmount: 2500, billingType: 'article' },
        missingParameters: [],
        isAmbiguous: false,
        explanationFr: `Création de dépôt pour ${clientName}. Acompte: ${amountPaid} FCFA.`,
        explanationWolof: `Bind dépôt ci touru ${clientName}. Versé: ${amountPaid} FCFA.`,
        riskLevel: 'normal',
        confidence: 0.8
      };
    }

    if (text.includes('clôture') || text.includes('cloture') || text.includes('tëj caisse')) {
      const amountMatch = prompt.match(/(\d+[\d\s]*)\s*(?:fcfa|f|cfa)/i);
      const actualCashCounted = amountMatch ? parseInt(amountMatch[1].replace(/\s/g, ''), 10) : 15000;

      return {
        intentId: 'pressing.closeCashRegister',
        actionFound: true,
        parameters: { actualCashCounted },
        missingParameters: [],
        isAmbiguous: false,
        explanationFr: `Clôture de caisse avec ${actualCashCounted} FCFA comptés.`,
        explanationWolof: `Tëj caisse ak ${actualCashCounted} FCFA.`,
        riskLevel: 'sensible',
        confidence: 0.85
      };
    }

    return {
      intentId: '',
      actionFound: false,
      parameters: {},
      missingParameters: [],
      isAmbiguous: true,
      clarificationMessageFr: 'Pouvez-vous préciser votre demande ?',
      clarificationMessageWolof: 'Waxal bu lere li nga beug.',
      explanationFr: 'Demande non comprise.',
      explanationWolof: 'Deggoma bakh.',
      riskLevel: 'read',
      confidence: 0.2
    };
  }
}

export const IntentEngine = new IntentEngineService();
