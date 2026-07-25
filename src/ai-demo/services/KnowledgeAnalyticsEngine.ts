// src/ai-demo/services/KnowledgeAnalyticsEngine.ts
/**
 * KnowledgeAnalyticsEngine - Continuous Improvement & Pedagogical Intelligence
 * Tracks scenario consultations, drop-off steps, learning duration, and certification status
 * for Acom AI Demo Baseline v2.0 Knowledge Repository.
 */

export type ContentCertificationLevel = 'DRAFT' | 'PUBLISHED' | 'CERTIFIED' | 'OFFICIAL';

export interface StepAnalyticsMetric {
  stepIndex: number;
  stepTitle: string;
  viewCount: number;
  averageTimeSeconds: number;
  dropOffRatePercent: number;
  difficultyScore: 'EASY' | 'MODERATE' | 'CHALLENGING';
}

export interface ScenarioKnowledgeAnalytics {
  scenarioId: string;
  scenarioTitle: string;
  domainId: string;
  totalViews: number;
  completionRatePercent: number;
  averageLearningDurationMinutes: number;
  certificationLevel: ContentCertificationLevel;
  certifiedBy?: string;
  certifiedAt?: string;
  stepMetrics: StepAnalyticsMetric[];
  aiRecommendations: string[];
}

export class KnowledgeAnalyticsEngine {
  private static analyticsData: Map<string, ScenarioKnowledgeAnalytics> = new Map();

  static {
    this.analyticsData.set('KNOW-SCEN-PRESS-001', {
      scenarioId: 'KNOW-SCEN-PRESS-001',
      scenarioTitle: 'Dépôt & Cash In - Blanchisserie Moderne',
      domainId: 'pressing',
      totalViews: 1420,
      completionRatePercent: 94.2,
      averageLearningDurationMinutes: 4.5,
      certificationLevel: 'OFFICIAL',
      certifiedBy: 'Direction de la Formation Acom Technologie',
      certifiedAt: '2026-07-24T14:00:00Z',
      stepMetrics: [
        {
          stepIndex: 1,
          stepTitle: 'Réception Client & Fiche',
          viewCount: 1420,
          averageTimeSeconds: 45,
          dropOffRatePercent: 1.2,
          difficultyScore: 'EASY'
        },
        {
          stepIndex: 2,
          stepTitle: 'Sélection de la Catégorie d\'Article',
          viewCount: 1403,
          averageTimeSeconds: 62,
          dropOffRatePercent: 2.8,
          difficultyScore: 'MODERATE'
        },
        {
          stepIndex: 3,
          stepTitle: 'Encaissement Acompte & Ticket POS',
          viewCount: 1364,
          averageTimeSeconds: 110,
          dropOffRatePercent: 1.8,
          difficultyScore: 'CHALLENGING'
        }
      ],
      aiRecommendations: [
        'Ajouter un sous-titre explicatif sur l\'impression bluetooth pour diminuer le temps passé sur l\'étape 3.',
        'La deuxième étape présente un intérêt élevé : suggérer la création d\'une fiche pro-tip réutilisable sur les types de textiles délicats.'
      ]
    });
  }

  public static getAnalytics(scenarioId: string): ScenarioKnowledgeAnalytics | undefined {
    return this.analyticsData.get(scenarioId);
  }

  public static getAllAnalytics(): ScenarioKnowledgeAnalytics[] {
    return Array.from(this.analyticsData.values());
  }

  public static certifyContent(
    scenarioId: string,
    level: ContentCertificationLevel,
    certifiedBy: string
  ): ScenarioKnowledgeAnalytics | undefined {
    const record = this.analyticsData.get(scenarioId);
    if (record) {
      record.certificationLevel = level;
      record.certifiedBy = certifiedBy;
      record.certifiedAt = new Date().toISOString();
      this.analyticsData.set(scenarioId, record);
    }
    return record;
  }
}
