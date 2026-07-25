// src/ai-demo/services/KnowledgeRepository.ts
/**
 * KnowledgeRepository - Unified Living Knowledge Base for Acom SaaS Ecosystem
 * Unifies Scenarios, Objectives, Tips, FAQ, Narrations, Quizzes, Policies, Glossaries, and Media Assets.
 * Implements complete provenance tracking: Author, Origin (Human vs AI), Creation Date, Approval History, and Consumers.
 */

export type KnowledgeType =
  | 'SCENARIO'
  | 'OBJECTIVE'
  | 'TIP'
  | 'FAQ'
  | 'NARRATION'
  | 'QUIZ'
  | 'POLICY'
  | 'GLOSSARY'
  | 'MEDIA';

export type KnowledgeOrigin = 'HUMAN_EXPERT' | 'AI_GENERATED' | 'HYBRID_SYNTHESIS';

export interface KnowledgeProvenance {
  authorId: string;
  authorName: string;
  origin: KnowledgeOrigin;
  createdAt: string;
  updatedAt: string;
  version: string;
  approvalHistory: Array<{
    approverRole: string;
    approverName: string;
    timestamp: string;
    comment: string;
  }>;
  consumerApps: string[];
}

export interface UnifiedKnowledgeItem {
  id: string;
  domainId: string;
  type: KnowledgeType;
  title: string;
  content: string;
  tags: string[];
  provenance: KnowledgeProvenance;
  metadata?: Record<string, any>;
}

export class KnowledgeRepositoryEngine {
  private static items: Map<string, UnifiedKnowledgeItem> = new Map();

  static {
    // Seed default knowledge items for Pressing
    const pressingScenarioId = 'KNOW-SCEN-PRESS-001';
    this.items.set(pressingScenarioId, {
      id: pressingScenarioId,
      domainId: 'pressing',
      type: 'SCENARIO',
      title: 'Dépôt & Cash In - Blanchisserie Moderne',
      content: 'Scénario canonique de réception d\'articles avec enregistrement d\'acompte et émission de bon thermique.',
      tags: ['pressing', 'caisse', 'acompte', 'ticket'],
      provenance: {
        authorId: 'usr_master_tailor',
        authorName: 'Mamadou Diallo (Chef d\'Atelier Pressing)',
        origin: 'HUMAN_EXPERT',
        createdAt: '2026-07-20T10:00:00Z',
        updatedAt: '2026-07-24T12:00:00Z',
        version: '2.0.0',
        approvalHistory: [
          {
            approverRole: 'Expert Métier',
            approverName: 'Ablaye Sene',
            timestamp: '2026-07-21T09:30:00Z',
            comment: 'Conforme aux procédures d\'atelier blanchisserie.'
          },
          {
            approverRole: 'Administrateur Produit',
            approverName: 'Directeur Produit Acom',
            timestamp: '2026-07-24T11:00:00Z',
            comment: 'Validé pour publication sur le canal Acom Pressing Desktop & Web.'
          }
        ],
        consumerApps: ['Acom Pressing Web', 'Acom Pressing Mobile POS', 'Live Guidance Widget']
      }
    });

    const pressingFaqId = 'KNOW-FAQ-PRESS-002';
    this.items.set(pressingFaqId, {
      id: pressingFaqId,
      domainId: 'pressing',
      type: 'FAQ',
      title: 'Impression du ticket thermique en bluetooth',
      content: 'Comment appairer l\'imprimante de caisse thermique mobile lors du dépôt ?',
      tags: ['pressing', 'imprimante', 'bluetooth', 'support'],
      provenance: {
        authorId: 'ai_assistant_gen',
        authorName: 'ACOM AI Knowledge Generator',
        origin: 'AI_GENERATED',
        createdAt: '2026-07-22T14:20:00Z',
        updatedAt: '2026-07-22T14:20:00Z',
        version: '1.0.0',
        approvalHistory: [
          {
            approverRole: 'Support Tech Acom',
            approverName: 'Support N2',
            timestamp: '2026-07-23T08:15:00Z',
            comment: 'Vérifié avec les imprimantes Xprinter & Epson POS.'
          }
        ],
        consumerApps: ['Acom Helpdesk', 'Acom Mobile POS']
      }
    });
  }

  public static getItemsByDomain(domainId: string): UnifiedKnowledgeItem[] {
    return Array.from(this.items.values()).filter((item) => item.domainId === domainId || item.domainId === 'all');
  }

  public static getAllItems(): UnifiedKnowledgeItem[] {
    return Array.from(this.items.values());
  }

  public static addItem(item: UnifiedKnowledgeItem): void {
    this.items.set(item.id, item);
  }

  public static getStats() {
    const all = this.getAllItems();
    return {
      total: all.length,
      humanOriginCount: all.filter((i) => i.provenance.origin === 'HUMAN_EXPERT').length,
      aiOriginCount: all.filter((i) => i.provenance.origin === 'AI_GENERATED').length,
      approvedCount: all.filter((i) => i.provenance.approvalHistory.length > 0).length
    };
  }
}
