// src/ai-demo/integration-tests/IntegrationTestRunner.ts
/**
 * IntegrationTestRunner - Automated Suite for Platform Stability & Golden Datasets
 * Runs end-to-end checks across:
 * - pressing-demo (Reference Scenario: Ticket -> Acompte -> Impression)
 * - school-demo (Acom School - Inscription & Bulletin)
 * - stock-demo (Acom Stock - Inventaire & Seuil Alerte)
 * - medical-demo (Acom Santé - Consultation & Prescription)
 */

import { ScenarioApplicationIntelligent } from '../types/sai';
import { GOLDEN_PRESSING_SCENARIO } from './pressing-demo/PressingScenario';
import { PipelineOrchestrator } from '../services/PipelineOrchestrator';
import { TimelineRuntime } from '../engines/TimelineRuntime';
import { PlatformObservability } from '../services/PlatformObservability';

export interface TestResult {
  suiteName: string;
  passed: boolean;
  durationMs: number;
  checksCount: number;
  failures: string[];
}

export class IntegrationTestRunner {
  /**
   * Runs all official integration test suites
   */
  public static async runAllSuites(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Suite 1: Pressing Golden Scenario
    results.push(await this.runSuite('pressing-demo', GOLDEN_PRESSING_SCENARIO));

    // Suite 2: School Demo Mock Test
    results.push(await this.runSuite('school-demo', this.createMockScenario('Acom École', 'Inscription Élève')));

    // Suite 3: Stock Demo Mock Test
    results.push(await this.runSuite('stock-demo', this.createMockScenario('Acom Stock', 'Inventaire & Ajustement')));

    // Suite 4: Medical Demo Mock Test
    results.push(await this.runSuite('medical-demo', this.createMockScenario('Acom Santé', 'Fiche Consultation')));

    return results;
  }

  private static async runSuite(suiteName: string, scenario: ScenarioApplicationIntelligent): Promise<TestResult> {
    const startTime = performance.now();
    const failures: string[] = [];
    let checksCount = 0;

    // Check 1: Schema Integrity
    checksCount++;
    if (!scenario.$schema || !scenario.id || scenario.schemaVersion !== '1.0.0') {
      failures.push('Structure ou schéma SAI non conforme.');
    }

    // Check 2: Events & Snapshots Presence
    checksCount++;
    if (!scenario.events || scenario.events.length === 0) {
      failures.push('Aucun événement capturé.');
    }
    checksCount++;
    if (!scenario.snapshots || scenario.snapshots.length === 0) {
      failures.push('Aucune capture visuelle snapshot.');
    }

    // Check 3: Multi-Tenant merchantId presence
    checksCount++;
    if (!scenario.metadata?.merchantId) {
      failures.push('Champ merchantId multi-tenant manquant dans les métadonnées.');
    }

    // Check 4: Timeline & Step Execution Clock
    checksCount++;
    try {
      const runtime = new TimelineRuntime(scenario);
      const duration = runtime.getTotalDuration();
      if (duration <= 0) failures.push('Durée du scénario nulle ou négative.');
      runtime.seek(duration / 2);
      const frame = runtime.getCurrentFrame();
      if (!frame.activeStep) failures.push('Impossible de calculer le frame actif.');
    } catch (e: any) {
      failures.push(`Erreur Runtime Timeline: ${e?.message}`);
    }

    // Check 5: Orchestrator Pipeline Dry Run
    checksCount++;
    try {
      const orchestrator = new PipelineOrchestrator();
      await orchestrator.executePipeline(scenario, { renderVideo: false });
    } catch (e: any) {
      failures.push(`Erreur Pipeline Orchestration: ${e?.message}`);
    }

    const durationMs = performance.now() - startTime;
    const passed = failures.length === 0;

    // Log telemetry
    PlatformObservability.logAudit(
      'INTEGRATION_TEST',
      `Suite ${suiteName}: ${passed ? 'REUSSIE' : 'ECHOUEE'} (${durationMs.toFixed(1)}ms)`,
      durationMs
    );

    return {
      suiteName,
      passed,
      durationMs,
      checksCount,
      failures
    };
  }

  private static createMockScenario(appName: string, moduleName: string): ScenarioApplicationIntelligent {
    return {
      $schema: 'https://acom.tech/schemas/sai.v1.json',
      id: `sai-${appName.toLowerCase().replace(/\s+/g, '-')}-001`,
      version: '1.0.0',
      schemaVersion: '1.0.0',
      metadata: {
        title: `${appName} - ${moduleName}`,
        description: `Scénario de test automatisé pour ${appName}`,
        author: 'Auto-Test Runner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        merchantId: 'merchant-test-001',
        privacyLevel: 'PUBLIC',
        tags: ['test', appName],
        status: 'validated'
      },
      application: {
        appName,
        moduleName,
        pageName: 'Accueil',
        route: '/app',
        version: '1.0.0',
        environment: 'web'
      },
      events: [
        {
          id: 'e1',
          timestamp: 0,
          type: 'PAGE_CHANGE',
          module: moduleName,
          page: 'Accueil',
          component: 'Header',
          action: 'Ouverture module',
          merchantId: 'merchant-test-001',
          privacyLevel: 'PUBLIC'
        }
      ],
      snapshots: [
        {
          id: 's1',
          timestamp: 0,
          width: 1280,
          height: 720,
          privacyMasksApplied: true,
          dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="%230f172a"/><text x="100" y="200" fill="%2338bdf8" font-size="32">Test Mock App</text></svg>'
        }
      ],
      timeline: [
        {
          id: 't1',
          stepNumber: 1,
          startTimeSec: 0,
          durationSec: 3.0,
          title: 'Action Principale',
          description: 'Exécution du test',
          actionType: 'CLICK',
          intent: 'Test',
          zoomLevel: 1.0,
          effectOverlay: 'none',
          snapshotId: 's1',
          narrationText: 'Étape de test'
        }
      ],
      knowledge: [],
      narration: [],
      diagnostics: {
        overallScore: 95,
        readabilityScore: 95,
        rhythmScore: 95,
        pedagogyScore: 95,
        deadTimeTrimmedSec: 0,
        suggestions: []
      },
      exports: {},
      history: [],
      extensions: {}
    };
  }
}
