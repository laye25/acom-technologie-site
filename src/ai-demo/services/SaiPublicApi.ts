// src/ai-demo/services/SaiPublicApi.ts
/**
 * SaiPublicApi - Unified Public API Contract for Scénario Applicatif Intelligent (SAI)
 * Provides a standardized programmatic contract for external integrations, plugins,
 * and internal modules:
 * .load(), .save(), .validate(), .replay(), .export(), .publish(), .clone(), .compare()
 */

import { ScenarioApplicationIntelligent } from '../types/sai';
import { GOLDEN_PRESSING_SCENARIO } from '../integration-tests/pressing-demo/PressingScenario';
import { WorkflowEngine, SaiWorkflowStatus } from './WorkflowEngine';

export interface SaiValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

export interface SaiComparisonDelta {
  stepCountDifference: number;
  durationDifferenceSec: number;
  addedSteps: string[];
  removedSteps: string[];
  modifiedSteps: Array<{ stepIndex: number; changes: string[] }>;
}

export class SaiPublicApi {
  private static store: Map<string, ScenarioApplicationIntelligent> = new Map([
    [GOLDEN_PRESSING_SCENARIO.id, GOLDEN_PRESSING_SCENARIO]
  ]);

  /**
   * Load a scenario by ID
   */
  public static async load(id: string): Promise<ScenarioApplicationIntelligent> {
    const sc = this.store.get(id);
    if (!sc) {
      throw new Error(`Scénario SAI introuvable pour l'identifiant: ${id}`);
    }
    return JSON.parse(JSON.stringify(sc));
  }

  /**
   * Save or update a scenario in memory/storage
   */
  public static async save(scenario: ScenarioApplicationIntelligent): Promise<ScenarioApplicationIntelligent> {
    const updated = {
      ...scenario,
      metadata: {
        ...scenario.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    this.store.set(scenario.id, updated);
    return updated;
  }

  /**
   * Validate a scenario according to structural and quality criteria
   */
  public static validate(scenario: ScenarioApplicationIntelligent): SaiValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!scenario.id) errors.push('Identifiant du scénario manquant');
    if (!scenario.metadata?.title) errors.push('Titre du scénario manquant');
    if (!scenario.timeline || scenario.timeline.length === 0) {
      errors.push('La timeline ne contient aucune étape');
    }

    if (scenario.events.length === 0) {
      warnings.push('Aucun événement d\'interaction enregistré');
    }

    if (scenario.snapshots.length === 0) {
      warnings.push('Aucun snapshot visuel associé');
    }

    const isValid = errors.length === 0;
    const score = Math.max(0, 100 - errors.length * 30 - warnings.length * 10);

    return {
      isValid,
      score,
      errors,
      warnings
    };
  }

  /**
   * Replay configuration generator
   */
  public static replay(scenario: ScenarioApplicationIntelligent, speedMultiplier: number = 1.0) {
    return {
      scenarioId: scenario.id,
      timeline: scenario.timeline,
      speedMultiplier,
      totalDurationSec: scenario.timeline.reduce((acc, step) => acc + step.durationSec, 0) / speedMultiplier
    };
  }

  /**
   * Export scenario to requested format
   */
  public static async export(
    scenario: ScenarioApplicationIntelligent,
    format: 'json' | 'markdown' | 'pdf_guide' | 'html_doc'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(scenario, null, 2);
      case 'markdown':
        return `# Guide Pédagogique: ${scenario.metadata.title}\n\n${scenario.metadata.description}\n\n` +
          scenario.timeline.map((s) => `## Étape ${s.stepNumber}: ${s.title}\n- **Intention**: ${s.intent}\n- **Narration**: ${s.narrationText}\n`).join('\n');
      case 'html_doc':
        return `<div class="sai-doc"><h1>${scenario.metadata.title}</h1><p>${scenario.metadata.description}</p></div>`;
      case 'pdf_guide':
        return `[PDF DOCUMENTATION GENERATED FOR ${scenario.metadata.title}]`;
    }
  }

  /**
   * Publish scenario across targeted channel
   */
  public static async publish(
    scenario: ScenarioApplicationIntelligent,
    targetChannel: 'catalog' | 'portal' | 'doc_center',
    actor: string
  ): Promise<ScenarioApplicationIntelligent> {
    const result = WorkflowEngine.transitionScenario(scenario, 'PUBLISHED', actor, 'ADMIN', `Publication sur le canal: ${targetChannel}`);
    if (!result.success) {
      throw new Error(result.message);
    }
    await this.save(result.scenario);
    return result.scenario;
  }

  /**
   * Clone scenario into a new independent instance
   */
  public static clone(scenario: ScenarioApplicationIntelligent, newTitle?: string): ScenarioApplicationIntelligent {
    const clonedId = `sai-clone-${Date.now()}`;
    const cloned: ScenarioApplicationIntelligent = JSON.parse(JSON.stringify(scenario));
    cloned.id = clonedId;
    cloned.metadata.title = newTitle || `${scenario.metadata.title} (Copie)`;
    cloned.metadata.createdAt = new Date().toISOString();
    cloned.metadata.updatedAt = new Date().toISOString();
    cloned.metadata.reviewStatus = 'DRAFT';

    this.store.set(clonedId, cloned);
    return cloned;
  }

  /**
   * Compare two SAI scenarios and highlight differences
   */
  public static compare(saiA: ScenarioApplicationIntelligent, saiB: ScenarioApplicationIntelligent): SaiComparisonDelta {
    const countDiff = saiB.timeline.length - saiA.timeline.length;
    const durA = saiA.timeline.reduce((a, b) => a + b.durationSec, 0);
    const durB = saiB.timeline.reduce((a, b) => a + b.durationSec, 0);

    const modifiedSteps: Array<{ stepIndex: number; changes: string[] }> = [];

    const minLen = Math.min(saiA.timeline.length, saiB.timeline.length);
    for (let i = 0; i < minLen; i++) {
      const stepA = saiA.timeline[i];
      const stepB = saiB.timeline[i];
      const changes: string[] = [];

      if (stepA.title !== stepB.title) changes.push(`Titre modifié: "${stepA.title}" -> "${stepB.title}"`);
      if (stepA.narrationText !== stepB.narrationText) changes.push('Narration modifiée');
      if (stepA.zoomLevel !== stepB.zoomLevel) changes.push(`Zoom modifié: ${stepA.zoomLevel}x -> ${stepB.zoomLevel}x`);

      if (changes.length > 0) {
        modifiedSteps.push({ stepIndex: i, changes });
      }
    }

    return {
      stepCountDifference: countDiff,
      durationDifferenceSec: durB - durA,
      addedSteps: countDiff > 0 ? saiB.timeline.slice(saiA.timeline.length).map((s) => s.title) : [],
      removedSteps: countDiff < 0 ? saiA.timeline.slice(saiB.timeline.length).map((s) => s.title) : [],
      modifiedSteps
    };
  }
}
