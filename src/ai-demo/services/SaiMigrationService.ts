// src/ai-demo/services/SaiMigrationService.ts
/**
 * SaiMigrationService - Backward Compatibility & Schema Evolution
 * Converts legacy DemoProject structures or old SAI versions into standard SAI v1.0.0
 */

import { ScenarioApplicationIntelligent, DemoProject, SaiPrivacyLevel } from '../types';

export class SaiMigrationService {
  /**
   * Migrates any legacy project or unversioned object to official SAI v1.0.0
   */
  public static migrateToLatestSai(source: any): ScenarioApplicationIntelligent {
    if (!source) {
      throw new Error('Impossible de migrer un objet vide.');
    }

    // If already compliant SAI v1.0.0, return untouched
    if (source.schemaVersion === '1.0.0' && source.$schema && source.metadata?.merchantId) {
      return source as ScenarioApplicationIntelligent;
    }

    const now = new Date().toISOString();
    const id = source.id || `sai-migrated-${Date.now()}`;

    // Handle legacy DemoProject migration
    const appName = source.brandingConfig?.appName || 'Acom Software';
    const moduleName = source.moduleName || 'Module Métier';
    const pageName = source.pageName || 'Accueil';
    const merchantId = source.merchantId || 'merchant-default';
    const privacyLevel: SaiPrivacyLevel = source.privacyLevel || 'INTERNAL';

    const events = Array.isArray(source.events)
      ? source.events.map((e: any, idx: number) => ({
          id: e.id || `evt-mig-${idx}`,
          timestamp: e.timestampMs || e.timestamp || idx * 1000,
          type: (e.action?.toUpperCase() as any) || 'CLICK',
          module: moduleName,
          page: pageName,
          component: e.targetTag || 'UIElement',
          action: e.buttonOrLabel || 'Action',
          intent: `Action enregistrée sur ${pageName}`,
          privacyLevel: e.hasSensitiveData ? 'CONFIDENTIAL' : 'INTERNAL',
          merchantId,
          targetId: e.targetId,
          coordinates: e.x !== undefined && e.y !== undefined ? { x: e.x, y: e.y } : undefined,
          valueMasked: e.valueMasked,
          snapshotId: e.screenshotUrl ? `snap-mig-${idx}` : undefined
        }))
      : [];

    const snapshots = Array.isArray(source.events)
      ? source.events
          .filter((e: any) => e.screenshotUrl)
          .map((e: any, idx: number) => ({
            id: `snap-mig-${idx}`,
            timestamp: e.timestampMs || idx * 1000,
            width: 1280,
            height: 800,
            dataUrl: e.screenshotUrl,
            privacyMasksApplied: Boolean(e.hasSensitiveData)
          }))
      : [];

    const timeline = Array.isArray(source.timelineSteps)
      ? source.timelineSteps.map((s: any, idx: number) => ({
          id: s.id || `step-mig-${idx}`,
          stepNumber: s.stepNumber || idx + 1,
          startTimeSec: s.startTimeSec || idx * 2,
          durationSec: s.durationSec || 3,
          title: s.title || `Étape ${idx + 1}`,
          description: s.description || '',
          actionType: (s.actionType?.toUpperCase() as any) || 'CLICK',
          intent: s.objective || s.description || '',
          zoomLevel: s.zoomLevel || 1.1,
          effectOverlay: s.effectOverlay || 'green_halo',
          snapshotId: snapshots[idx]?.id,
          narrationText: s.narrationText || '',
          proAdvice: s.advice,
          timeSavingTip: s.tip,
          isAccelerated: s.isAccelerated
        }))
      : [];

    const migrated: ScenarioApplicationIntelligent = {
      $schema: 'https://acom.tech/schemas/sai.v1.json',
      id,
      version: '1.0.0',
      schemaVersion: '1.0.0',
      metadata: {
        title: source.title || `Scénario Migré : ${moduleName}`,
        description: source.description || 'Scénario applicatif migré vers la norme SAI v1.0.0',
        author: source.author || 'Migration Automatique ACOM',
        createdAt: source.createdAt || now,
        updatedAt: now,
        merchantId,
        privacyLevel,
        tags: source.tags || [moduleName.toLowerCase(), 'migré'],
        status: source.status === 'ready' ? 'validated' : 'draft',
        qualityScore: 90
      },
      application: {
        appName,
        moduleName,
        pageName,
        route: `/app/${moduleName.toLowerCase().replace(/\s+/g, '-')}`,
        version: '2.4.0',
        environment: 'web'
      },
      events,
      snapshots,
      timeline,
      knowledge: [],
      narration: [
        {
          id: 'narr-mig',
          language: 'fr',
          voiceId: source.voiceConfig?.voiceId || 'fr-FR-Standard-A',
          subtitlesSrt: source.subtitles?.srtContent || '',
          subtitlesVtt: source.subtitles?.vttContent || ''
        }
      ],
      diagnostics: {
        overallScore: 90,
        readabilityScore: 92,
        rhythmScore: 88,
        pedagogyScore: 90,
        deadTimeTrimmedSec: 0,
        suggestions: []
      },
      exports: {},
      history: [
        {
          version: '1.0.0',
          timestamp: now,
          author: 'SaiMigrationService',
          changesDescription: 'Migration automatique vers le contrat SAI v1.0.0'
        }
      ],
      extensions: {
        migratedFromLegacy: true,
        originalId: source.id
      }
    };

    return migrated;
  }
}
