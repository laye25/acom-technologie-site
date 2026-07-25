// src/ai-demo/services/SaiValidator.ts
/**
 * SaiValidator - Structural, Semantic & Schema Validation Engine
 * Validates Scénario Applicatif Intelligent (SAI) objects against v1.0.0 contract rules
 */

import { ScenarioApplicationIntelligent } from '../types';

export interface SaiValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    totalEvents: number;
    totalSnapshots: number;
    totalSteps: number;
    hasMerchantId: boolean;
    schemaCompliant: boolean;
  };
}

export class SaiValidator {
  /**
   * Validates a Scénario Applicatif Intelligent (SAI) object
   */
  public static validate(sai: any): SaiValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!sai || typeof sai !== 'object') {
      return {
        isValid: false,
        errors: ['Le scénario fourni est nul ou invalide.'],
        warnings: [],
        metrics: {
          totalEvents: 0,
          totalSnapshots: 0,
          totalSteps: 0,
          hasMerchantId: false,
          schemaCompliant: false
        }
      };
    }

    // 1. Schema & Version Checks
    if (sai.schemaVersion !== '1.0.0') {
      warnings.push(`Version de schéma non standard: ${sai.schemaVersion || 'non spécifiée'}. Attendu: 1.0.0.`);
    }

    if (!sai.id) {
      errors.push('Champ obligatoire manquant : "id" du scénario.');
    }

    // 2. Metadata Checks
    if (!sai.metadata) {
      errors.push('Section obligatoire manquante : "metadata".');
    } else {
      if (!sai.metadata.title) {
        errors.push('Métadonnées : Le titre du scénario est obligatoire.');
      }
      if (!sai.metadata.merchantId) {
        errors.push('Métadonnées : "merchantId" est obligatoire pour l\'isolation Multi-Tenant.');
      }
      if (!['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'].includes(sai.metadata.privacyLevel)) {
        warnings.push(`Niveau de confidentialité inconnu : ${sai.metadata.privacyLevel}. Réglé par défaut sur INTERNAL.`);
      }
    }

    // 3. Application Context Checks
    if (!sai.application) {
      errors.push('Section obligatoire manquante : "application".');
    } else {
      if (!sai.application.appName) warnings.push('ApplicationContext : appName manquant.');
      if (!sai.application.moduleName) warnings.push('ApplicationContext : moduleName manquant.');
    }

    // 4. Events Array Checks
    const events = Array.isArray(sai.events) ? sai.events : [];
    if (events.length === 0) {
      warnings.push('Scénario vide : Aucun événement d\'interaction enregistré.');
    } else {
      events.forEach((evt: any, idx: number) => {
        if (!evt.id) errors.push(`Événement #${idx} : Champ "id" manquant.`);
        if (evt.timestamp === undefined) errors.push(`Événement #${idx} : "timestamp" manquant.`);
        if (!evt.type) errors.push(`Événement #${idx} : Type d'événement manquant.`);
      });
    }

    // 5. Snapshots Checks
    const snapshots = Array.isArray(sai.snapshots) ? sai.snapshots : [];
    if (snapshots.length === 0) {
      warnings.push('Aucune capture visuelle (snapshot) associée à ce scénario.');
    }

    // 6. Timeline Steps Checks
    const timeline = Array.isArray(sai.timeline) ? sai.timeline : [];
    if (timeline.length === 0 && events.length > 0) {
      warnings.push('La timeline d\'étapes n\'a pas encore été générée pour ces événements.');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      metrics: {
        totalEvents: events.length,
        totalSnapshots: snapshots.length,
        totalSteps: timeline.length,
        hasMerchantId: Boolean(sai.metadata?.merchantId),
        schemaCompliant: isValid && warnings.length === 0
      }
    };
  }
}
