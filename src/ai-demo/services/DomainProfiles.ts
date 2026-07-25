// src/ai-demo/services/DomainProfiles.ts
/**
 * DomainProfiles - Domain-Specific Profiles & Knowledge Rules for Acom SaaS Ecosystem
 * Provides tailored business vocabulary, pedagogical advice rules, narration tones,
 * and icon badges for Pressing, School Management, Health, Stock/Retail, BTP, and HR.
 * Supports Domain Inheritance & Overrides for rapid new SaaS onboarding.
 */

export type AcomDomainId = 'pressing' | 'school' | 'health' | 'stock_retail' | 'btp' | 'hr' | 'hotel' | 'restaurant';

export interface DomainProfile {
  id: AcomDomainId;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  icon: string;
  parentDomainId?: AcomDomainId;
  terminology: {
    clientOrUser: string;
    itemOrRecord: string;
    transactionOrAction: string;
    outputDocument: string;
  };
  pedagogicalRules: {
    recommendedSpeedMultiplier: number;
    mandatoryProTips: string[];
    defaultNarrationTone: 'professional' | 'educational' | 'reassuring' | 'dynamic';
  };
  faqTemplates: Array<{ question: string; defaultAnswer: string }>;
}

export class DomainProfileRegistry {
  private static profiles: Map<AcomDomainId, DomainProfile> = new Map([
    [
      'pressing',
      {
        id: 'pressing',
        name: 'Acom Pressing',
        tagline: 'Gestion d\'Atelier, Blanchisserie & Nettoyage à Sec',
        primaryColor: '#0f172a',
        accentColor: '#2563eb',
        icon: 'Shirt',
        terminology: {
          clientOrUser: 'Client Dépôt',
          itemOrRecord: 'Article / Vêtement',
          transactionOrAction: 'Encaissement Acompte',
          outputDocument: 'Ticket Thermique & Bon Lavage'
        },
        pedagogicalRules: {
          recommendedSpeedMultiplier: 1.0,
          mandatoryProTips: [
            'Toujours vérifier les taches tenaces lors de la réception client.',
            'Éditer le bon de lavage à coller directement sur le cintre d\'atelier.',
            'Activer la relance SMS automatique après repassage.'
          ],
          defaultNarrationTone: 'professional'
        },
        faqTemplates: [
          {
            question: 'Comment gérer les vêtements délicats (soie, cuir) ?',
            defaultAnswer: 'Sélectionnez la catégorie "Lavage Spécial" pour appliquer la tarification ajustée et marquer l\'étiquette d\'avertissement.'
          },
          {
            question: 'Que faire en cas d\'acompte partiel ?',
            defaultAnswer: 'Saisissez le montant perçu. Le ticket affichera le solde exact restant dû au retrait.'
          }
        ]
      }
    ],
    [
      'school',
      {
        id: 'school',
        name: 'Acom École',
        tagline: 'Gestion Scolaire, Inscriptions & Bulletins',
        primaryColor: '#1e1b4b',
        accentColor: '#7c3aed',
        icon: 'GraduationCap',
        terminology: {
          clientOrUser: 'Élève / Tuteur',
          itemOrRecord: 'Dossier d\'Inscription',
          transactionOrAction: 'Validation de Trimestre',
          outputDocument: 'Bulletin de Notes & Reçu de Scolarité'
        },
        pedagogicalRules: {
          recommendedSpeedMultiplier: 1.2,
          mandatoryProTips: [
            'Saisir les coordonnées exactes du tuteur pour l\'envoi automatique des bulletins.',
            'Vérifier les pièces justificatives avant de valider la réinscription.'
          ],
          defaultNarrationTone: 'educational'
        },
        faqTemplates: [
          {
            question: 'Comment éditer les bulletins en masse ?',
            defaultAnswer: 'Allez dans Conseils de Classe -> Génération Globale PDF pour exporter la classe entière en un seul clic.'
          }
        ]
      }
    ],
    [
      'health',
      {
        id: 'health',
        name: 'Acom Santé',
        tagline: 'Gestion Médicale, Cabinet & Prescriptions',
        primaryColor: '#064e3b',
        accentColor: '#059669',
        icon: 'Stethoscope',
        terminology: {
          clientOrUser: 'Patient',
          itemOrRecord: 'Fiche Consultation',
          transactionOrAction: 'Prescription Médicamenteuse',
          outputDocument: 'Ordonnance Sécurisée & Feuillets'
        },
        pedagogicalRules: {
          recommendedSpeedMultiplier: 0.9,
          mandatoryProTips: [
            'Masquer systématiquement le nom des patients lors de la captation de tutoriels vidéo.',
            'Utiliser la recherche CIM-10 pour la codification automatique des diagnostics.'
          ],
          defaultNarrationTone: 'reassuring'
        },
        faqTemplates: [
          {
            question: 'Les ordonnances sont-elles horodatées ?',
            defaultAnswer: 'Oui, chaque ordonnance générée contient une signature numérique et un horodatage certifié.'
          }
        ]
      }
    ],
    [
      'stock_retail',
      {
        id: 'stock_retail',
        name: 'Acom Stock & Caisse',
        tagline: 'Gestion de Stock, Inventaire & Points de Vente',
        primaryColor: '#78350f',
        accentColor: '#d97706',
        icon: 'Package',
        terminology: {
          clientOrUser: 'Client / Fournisseur',
          itemOrRecord: 'Produit / Article Stock',
          transactionOrAction: 'Mouvement d\'Inventaire',
          outputDocument: 'Facture & Bon de Livraison'
        },
        pedagogicalRules: {
          recommendedSpeedMultiplier: 1.1,
          mandatoryProTips: [
            'Régler les seuils d\'alerte de réapprovisionnement pour éviter les ruptures.',
            'Utiliser la douchette laser pour les inventaires tournants.'
          ],
          defaultNarrationTone: 'dynamic'
        },
        faqTemplates: [
          {
            question: 'Comment corriger un écart d\'inventaire ?',
            defaultAnswer: 'Sélectionnez "Ajustement de stock", motif "Ajustement physique" et validez le motif pour tracer la correction.'
          }
        ]
      }
    ],
    [
      'hotel',
      {
        id: 'hotel',
        name: 'Acom Hôtellerie (Hérité de Stock & Caisse)',
        tagline: 'Gestion de Réservation, Réception & Chambres',
        primaryColor: '#4c1d95',
        accentColor: '#8b5cf6',
        icon: 'Building',
        parentDomainId: 'stock_retail',
        terminology: {
          clientOrUser: 'Résident / Client Chambre',
          itemOrRecord: 'Réservation / Nuitée',
          transactionOrAction: 'Check-in / Check-out',
          outputDocument: 'Note de Séjour & Recu d\'Hébergement'
        },
        pedagogicalRules: {
          recommendedSpeedMultiplier: 1.0,
          mandatoryProTips: [
            'Renseigner la taxe de séjour avant d\'émettre la note finale.',
            'Activer la fiche d\'accès rapide à la gouvernante pour le nettoyage des chambres.'
          ],
          defaultNarrationTone: 'professional'
        },
        faqTemplates: [
          {
            question: 'Comment décaler un Check-Out sans pénalité ?',
            defaultAnswer: 'Accédez au Planning des Chambres -> Modifier Réservation -> Étendre le séjour.'
          }
        ]
      }
    ]
  ]);

  public static getProfile(domainId: AcomDomainId): DomainProfile {
    return this.profiles.get(domainId) || this.profiles.get('pressing')!;
  }

  public static getAllProfiles(): DomainProfile[] {
    return Array.from(this.profiles.values());
  }

  public static deriveProfile(
    newId: AcomDomainId,
    name: string,
    tagline: string,
    parentDomainId: AcomDomainId,
    overrides?: Partial<Omit<DomainProfile, 'id' | 'name' | 'tagline' | 'parentDomainId'>>
  ): DomainProfile {
    const parent = this.getProfile(parentDomainId);
    const derived: DomainProfile = {
      id: newId,
      name,
      tagline,
      parentDomainId,
      primaryColor: overrides?.primaryColor || parent.primaryColor,
      accentColor: overrides?.accentColor || parent.accentColor,
      icon: overrides?.icon || parent.icon,
      terminology: {
        ...parent.terminology,
        ...overrides?.terminology
      },
      pedagogicalRules: {
        ...parent.pedagogicalRules,
        ...overrides?.pedagogicalRules
      },
      faqTemplates: [
        ...parent.faqTemplates,
        ...(overrides?.faqTemplates || [])
      ]
    };
    this.profiles.set(newId, derived);
    return derived;
  }
}

