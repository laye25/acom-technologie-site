// src/ai-demo/services/SaiRepository.ts
/**
 * SAI Repository & Data Engine - ACOM AI Demo Platform
 * Centralized persistence, versioning, confidentiality masking,
 * and JSON Schema export for Scénario Applicatif Intelligent (SAI).
 */

import {
  ScenarioApplicationIntelligent,
  SaiMetadata,
  SaiPrivacyLevel,
  SaiInteractionEvent,
  SaiVisualSnapshot,
  SaiTimelineStep,
  SaiKnowledgeNode,
  SaiVersionHistory,
  DemoProject,
  RecordedEvent,
  TimelineStep
} from '../types';
import { SaiEventBus } from './SaiEventBus';

const SAI_STORAGE_KEY = 'acom_sai_repository_v1';
const CURRENT_SCHEMA_URI = 'https://acom.tech/schemas/sai.v1.json';

export class SaiRepository {
  private static scenarios: Map<string, ScenarioApplicationIntelligent> = new Map();

  /**
   * Initializes and loads all SAI scenarios from local persistent storage
   */
  public static loadAllScenarios(): ScenarioApplicationIntelligent[] {
    try {
      const raw = localStorage.getItem(SAI_STORAGE_KEY);
      if (raw) {
        const parsed: ScenarioApplicationIntelligent[] = JSON.parse(raw);
        this.scenarios.clear();
        parsed.forEach((s) => this.scenarios.set(s.id, s));
      }
    } catch (e) {
      console.warn('[SaiRepository] Could not load stored SAI scenarios', e);
    }
    return Array.from(this.scenarios.values());
  }

  /**
   * Saves or updates a Scénario Applicatif Intelligent (SAI)
   */
  public static saveScenario(
    scenario: ScenarioApplicationIntelligent,
    author: string = 'Acom Admin'
  ): ScenarioApplicationIntelligent {
    const existing = this.scenarios.get(scenario.id);
    scenario.metadata.updatedAt = new Date().toISOString();

    // Versioning check
    if (existing && existing.version === scenario.version) {
      // Auto-increment patch version if content modified
      const versionParts = scenario.version.split('.').map(Number);
      if (versionParts.length === 3) {
        versionParts[2] += 1;
        scenario.version = versionParts.join('.');
      }
    }

    if (!scenario.history) scenario.history = [];
    scenario.history.unshift({
      version: scenario.version,
      timestamp: new Date().toISOString(),
      author,
      changesDescription: existing ? 'Mise à jour du scénario applicatif' : 'Création initiale du SAI'
    });

    this.scenarios.set(scenario.id, scenario);
    this.persistToDisk();

    // Publish event on Event Bus
    SaiEventBus.publish('sai:repository_saved', scenario);

    return scenario;
  }

  /**
   * Retrieves a SAI scenario by ID
   */
  public static getScenarioById(id: string): ScenarioApplicationIntelligent | undefined {
    if (this.scenarios.size === 0) {
      this.loadAllScenarios();
    }
    return this.scenarios.get(id);
  }

  /**
   * Applies automatic confidentiality and privacy masking rules to a SAI scenario
   */
  public static applyPrivacyMasking(
    scenario: ScenarioApplicationIntelligent,
    targetLevel: SaiPrivacyLevel
  ): ScenarioApplicationIntelligent {
    const masked = JSON.parse(JSON.stringify(scenario)) as ScenarioApplicationIntelligent;
    masked.metadata.privacyLevel = targetLevel;

    if (targetLevel === 'CONFIDENTIAL') {
      // Unmasked internal access
      return masked;
    }

    // Mask sensitive event data
    masked.events = masked.events.map((evt) => {
      const e = { ...evt };
      if (e.valueMasked) {
        if (targetLevel === 'PUBLIC') {
          e.valueMasked = '••••••••';
        } else if (targetLevel === 'INTERNAL') {
          // Partial mask for internal view
          e.valueMasked = e.valueMasked.length > 3 ? e.valueMasked.substring(0, 3) + '***' : '***';
        }
      }
      return e;
    });

    // Mask snapshots if public and confidentiality flag set
    if (targetLevel === 'PUBLIC') {
      masked.snapshots = masked.snapshots.map((snap) => ({
        ...snap,
        privacyMasksApplied: true
      }));
    }

    SaiEventBus.publish('sai:privacy_masked', { id: scenario.id, level: targetLevel });
    return masked;
  }

  /**
   * Converts a Scénario Applicatif Intelligent (SAI) into a JSON schema compliant bundle
   */
  public static exportSaiJsonSchema(scenario: ScenarioApplicationIntelligent): string {
    const bundle = {
      $schema: CURRENT_SCHEMA_URI,
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenario
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Factory function to create a new empty Scénario Applicatif Intelligent (SAI)
   */
  public static createNewSai(
    merchantId: string,
    appName: string,
    moduleName: string,
    pageName: string,
    title?: string,
    description?: string,
    privacyLevel: SaiPrivacyLevel = 'INTERNAL'
  ): ScenarioApplicationIntelligent {
    const now = new Date().toISOString();
    const id = `sai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const sai: ScenarioApplicationIntelligent = {
      $schema: CURRENT_SCHEMA_URI,
      id,
      version: '1.0.0',
      schemaVersion: '1.0.0',
      metadata: {
        title: title || `Scénario Applicatif : ${moduleName} - ${pageName}`,
        description: description || `Parcours utilisateur métier capturé dans ${appName}.`,
        author: 'Système ACOM',
        createdAt: now,
        updatedAt: now,
        merchantId,
        privacyLevel,
        tags: [moduleName.toLowerCase(), pageName.toLowerCase(), 'sai'],
        status: 'draft',
        qualityScore: 92
      },
      application: {
        appName,
        moduleName,
        pageName,
        route: `/app/${moduleName.toLowerCase().replace(/\s+/g, '-')}`,
        version: '2.4.0',
        environment: 'web'
      },
      events: [],
      snapshots: [],
      timeline: [],
      knowledge: [],
      narration: [
        {
          id: 'narr-fr',
          language: 'fr',
          voiceId: 'fr-FR-Neural2-A',
          subtitlesSrt: '',
          subtitlesVtt: ''
        }
      ],
      diagnostics: {
        overallScore: 92,
        readabilityScore: 95,
        rhythmScore: 90,
        pedagogyScore: 91,
        deadTimeTrimmedSec: 0,
        suggestions: []
      },
      exports: {},
      history: [
        {
          version: '1.0.0',
          timestamp: now,
          author: 'Système ACOM',
          changesDescription: 'Initialisation du Scénario Applicatif Intelligent'
        }
      ],
      extensions: {
        acomEngineVersion: '1.0.0',
        aiTeachingEnabled: true
      }
    };

    return this.saveScenario(sai);
  }

  /**
   * Helper converter: Bridges a Scénario Applicatif Intelligent (SAI) to a DemoProject for UI compatibility
   */
  public static convertSaiToDemoProject(sai: ScenarioApplicationIntelligent): DemoProject {
    const events: RecordedEvent[] = sai.events.map((e) => ({
      id: e.id,
      timestampMs: e.timestamp,
      timeFormatted: this.formatTimeMs(e.timestamp),
      module: e.module,
      page: e.page,
      action: e.type.toLowerCase() as any,
      buttonOrLabel: e.action,
      targetId: e.targetId,
      x: e.coordinates?.x,
      y: e.coordinates?.y,
      valueMasked: e.valueMasked,
      hasSensitiveData: e.privacyLevel === 'CONFIDENTIAL'
    }));

    const timelineSteps: TimelineStep[] = sai.timeline.map((s) => {
      const snap = sai.snapshots.find((sp) => sp.id === s.snapshotId);
      return {
        id: s.id,
        stepNumber: s.stepNumber,
        startTimeSec: s.startTimeSec,
        durationSec: s.durationSec,
        title: s.title,
        description: s.description,
        narrationText: s.narrationText,
        actionType: s.actionType.toLowerCase() as any,
        zoomLevel: s.zoomLevel,
        effectOverlay: s.effectOverlay,
        screenshotUrl: snap?.dataUrl,
        objective: s.intent || s.description,
        advice: s.proAdvice,
        tip: s.timeSavingTip,
        isAccelerated: s.isAccelerated
      };
    });

    return {
      id: sai.id,
      title: sai.metadata.title,
      description: sai.metadata.description,
      moduleName: sai.application.moduleName,
      pageName: sai.application.pageName,
      createdAt: sai.metadata.createdAt,
      updatedAt: sai.metadata.updatedAt,
      durationSec: timelineSteps.reduce((acc, s) => acc + s.durationSec, 0) || 12,
      events,
      timelineSteps,
      voiceConfig: {
        voiceId: 'fr-FR-Standard-A',
        voiceName: 'Voix Pédagogique FR',
        gender: 'female',
        language: 'fr',
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0,
        provider: 'webspeech'
      },
      videoConfig: {
        resolution: '1080p',
        fps: 60,
        aspectRatio: '16:9',
        format: 'mp4',
        includeNarration: true,
        includeSubtitles: true,
        backgroundMusicVolume: 0.15
      },
      brandingConfig: {
        showLogo: true,
        appName: sai.application.appName,
        moduleName: sai.application.moduleName,
        version: sai.application.version,
        authorName: sai.metadata.author,
        showQRCode: true,
        websiteUrl: 'https://acom.tech',
        primaryColor: '#0f172a',
        accentColor: '#2563eb',
        showOutroScreen: true
      },
      subtitles: {
        srtContent: '',
        vttContent: '',
        txtContent: '',
        items: []
      },
      documentation: {
        userGuideMarkdown: `# Guide : ${sai.metadata.title}\n\n${sai.metadata.description}`,
        userGuideHtml: `<h1>${sai.metadata.title}</h1><p>${sai.metadata.description}</p>`,
        faqList: [],
        trainingScript: sai.timeline.map((t) => `${t.stepNumber}. ${t.title}: ${t.narrationText}`).join('\n'),
        knowledgeBaseEntry: sai.metadata.description
      },
      status: sai.metadata.status === 'validated' ? 'ready' : 'draft',
      isTrainingMode: true,
      tags: sai.metadata.tags
    };
  }

  private static formatTimeMs(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const millis = ms % 1000;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  private static persistToDisk(): void {
    try {
      const data = Array.from(this.scenarios.values());
      localStorage.setItem(SAI_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[SaiRepository] Persistence to localStorage failed', e);
    }
  }
}
