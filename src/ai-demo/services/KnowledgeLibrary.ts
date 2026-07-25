// src/ai-demo/services/KnowledgeLibrary.ts
/**
 * KnowledgeLibrary - Centralized Reusable Pedagogical Repository
 * Stores, indexes, and retrieves reusable pedagogical items (Objectives, Pro Tips,
 * Time-saving Tips, Narration Snippets, Quiz Items, FAQ Cards) across all Acom domains.
 */

import { AcomDomainId } from './DomainProfiles';

export type KnowledgeCategory =
  | 'OBJECTIVE'
  | 'PRO_TIP'
  | 'TIME_SAVING_TIP'
  | 'NARRATION_TEMPLATE'
  | 'QUIZ_ITEM'
  | 'FAQ_ITEM';

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  domainId: AcomDomainId;
  title: string;
  content: string;
  tags: string[];
  usageCount: number;
  metadata?: Record<string, any>;
}

export class KnowledgeLibrary {
  private static items: Map<string, KnowledgeItem> = new Map([
    [
      'k-1',
      {
        id: 'k-1',
        category: 'PRO_TIP',
        domainId: 'pressing',
        title: 'Contrôle Taches & Étiquetage Cintre',
        content: 'Examinez impérativement le col et les poignets avant d\'émettre le reçu client et collez la puce code-barres sur le cintre.',
        tags: ['réception', 'qualité', 'cintre'],
        usageCount: 14
      }
    ],
    [
      'k-2',
      {
        id: 'k-2',
        category: 'TIME_SAVING_TIP',
        domainId: 'pressing',
        title: 'Validation Rapide Touche F2',
        content: 'Appuyez sur F2 pour valider le ticket sans repasser par la sélection manuelle du bouton d\'impression.',
        tags: ['raccourci', 'caisse', 'vitesse'],
        usageCount: 29
      }
    ],
    [
      'k-3',
      {
        id: 'k-3',
        category: 'FAQ_ITEM',
        domainId: 'pressing',
        title: 'Gestion des Acomptes Partiels',
        content: 'En cas de paiement partiel, saisissez la somme exacte perçue. Le solde sera automatiquement exigé lors de la remise au comptoir.',
        tags: ['acompte', 'solde', 'caisse'],
        usageCount: 8
      }
    ],
    [
      'k-4',
      {
        id: 'k-4',
        category: 'QUIZ_ITEM',
        domainId: 'pressing',
        title: 'Quiz Réception Atelier',
        content: 'Quelle est la première action à effectuer lors de la réception d\'un costume de soie ?',
        tags: ['quiz', 'évaluation'],
        usageCount: 5,
        metadata: {
          options: [
            'Nettoyer à l\'eau bouillante',
            'Saisir l\'état du vêtement et sélectionner le lavage spécial',
            'Ne pas donner de reçu au client'
          ],
          correctIndex: 1
        }
      }
    ]
  ]);

  public static getItemsByDomain(domainId: AcomDomainId): KnowledgeItem[] {
    return Array.from(this.items.values()).filter(
      (item) => item.domainId === domainId || item.domainId === 'pressing'
    );
  }

  public static searchKnowledge(query: string, domainId?: AcomDomainId): KnowledgeItem[] {
    const q = query.toLowerCase();
    return Array.from(this.items.values()).filter((item) => {
      const matchDomain = !domainId || item.domainId === domainId;
      const matchText =
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchDomain && matchText;
    });
  }

  public static addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'usageCount'>): KnowledgeItem {
    const id = `k-${Date.now()}`;
    const newItem: KnowledgeItem = {
      ...item,
      id,
      usageCount: 0
    };
    this.items.set(id, newItem);
    return newItem;
  }
}
