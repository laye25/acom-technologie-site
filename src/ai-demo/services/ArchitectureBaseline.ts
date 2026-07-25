// src/ai-demo/services/ArchitectureBaseline.ts
/**
 * ArchitectureBaseline - Version 2.0 Architectural Governance & Baseline Standard
 * Formalizes the 5 architectural layers, component tiers, capability matrix,
 * ADR (Architecture Decision Records) registry, and strict layer dependency rules.
 */

export type ArchitecturalLayer =
  | 'INFRASTRUCTURE'
  | 'KNOWLEDGE'
  | 'EXECUTION'
  | 'WORKFLOW'
  | 'PRODUCT';

export type ComponentGovernanceTier =
  | 'TIER_1_FROZEN'      // Core Platform Contract - Requires formal RFC/ADR & Architecture Review
  | 'TIER_2_EVOLVING'    // Feature Extensions - Upgradable within architectural boundaries
  | 'TIER_3_EXTENSIBLE';  // SDK Plugins - Completely open for external modules

export interface ArchitectureComponent {
  id: string;
  name: string;
  layer: ArchitecturalLayer;
  tier: ComponentGovernanceTier;
  description: string;
  stabilityContract: 'Stable' | 'Evolving' | 'Extensible';
  allowedDependencies: ArchitecturalLayer[];
}

export type PlatformCapability =
  | 'CAPABILITY_CAPTURE'
  | 'CAPABILITY_REPLAY'
  | 'CAPABILITY_EXPORT'
  | 'CAPABILITY_VOICE'
  | 'CAPABILITY_QUIZ'
  | 'CAPABILITY_TRANSLATION'
  | 'CAPABILITY_CERTIFICATION'
  | 'CAPABILITY_ANALYTICS';

export interface ArchitectureDecisionRecord {
  id: string;
  title: string;
  status: 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED';
  date: string;
  author: string;
  context: string;
  decision: string;
  consequences: string[];
  impactedComponents: string[];
}

export class ArchitectureBaselineRegistry {
  private static components: ArchitectureComponent[] = [
    // Layer 1: Infrastructure
    { id: 'sai_repository', name: 'SaiRepository', layer: 'INFRASTRUCTURE', tier: 'TIER_1_FROZEN', description: 'Persistance IndexedDB/Dexie & Firestore', stabilityContract: 'Stable', allowedDependencies: [] },
    { id: 'event_bus', name: 'SaiEventBus', layer: 'INFRASTRUCTURE', tier: 'TIER_1_FROZEN', description: 'Bus dévénements synchrones et asynchrones', stabilityContract: 'Stable', allowedDependencies: [] },
    { id: 'validator', name: 'SaiValidator', layer: 'INFRASTRUCTURE', tier: 'TIER_1_FROZEN', description: 'Validation structurelle et sémantique SAI', stabilityContract: 'Stable', allowedDependencies: [] },
    { id: 'migration_service', name: 'SaiMigrationService', layer: 'INFRASTRUCTURE', tier: 'TIER_1_FROZEN', description: 'Transformations et migrations de version SAI', stabilityContract: 'Stable', allowedDependencies: [] },

    // Layer 2: Knowledge
    { id: 'sai_core', name: 'SAI Core Specification', layer: 'KNOWLEDGE', tier: 'TIER_1_FROZEN', description: 'Modèle canonique Scénario Applicatif Intelligent', stabilityContract: 'Stable', allowedDependencies: ['INFRASTRUCTURE'] },
    { id: 'knowledge_library', name: 'KnowledgeLibrary', layer: 'KNOWLEDGE', tier: 'TIER_2_EVOLVING', description: 'Bibliothèque de composants pédagogiques réutilisables', stabilityContract: 'Evolving', allowedDependencies: ['INFRASTRUCTURE'] },
    { id: 'live_guidance', name: 'LiveGuidanceEngine', layer: 'KNOWLEDGE', tier: 'TIER_2_EVOLVING', description: 'Guidage pas-à-pas interactif dans l\'application hôte', stabilityContract: 'Evolving', allowedDependencies: ['INFRASTRUCTURE'] },

    // Layer 3: Execution
    { id: 'replay_engine', name: 'ReplayEngine', layer: 'EXECUTION', tier: 'TIER_1_FROZEN', description: 'Moteur d\'exécution déterministe de la timeline', stabilityContract: 'Stable', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE'] },
    { id: 'scenario_player', name: 'ScenarioPlayer', layer: 'EXECUTION', tier: 'TIER_1_FROZEN', description: 'Lecteur interactif HTML5 Canvas & Web Audio', stabilityContract: 'Stable', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE'] },
    { id: 'overlay_engine', name: 'OverlayEngine', layer: 'EXECUTION', tier: 'TIER_2_EVOLVING', description: 'Moteur de rendu des halos et métadonnées visuelles', stabilityContract: 'Evolving', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE'] },

    // Layer 4: Workflow & Governance
    { id: 'workflow_engine', name: 'WorkflowEngine', layer: 'WORKFLOW', tier: 'TIER_2_EVOLVING', description: 'Gestionnaire de cycle de vie et d\'approbation', stabilityContract: 'Evolving', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE', 'EXECUTION'] },
    { id: 'user_role_manager', name: 'UserRoleManager', layer: 'WORKFLOW', tier: 'TIER_2_EVOLVING', description: 'Contrôle d\'accès basé sur les rôles (RBAC)', stabilityContract: 'Evolving', allowedDependencies: ['INFRASTRUCTURE'] },
    { id: 'sai_public_api', name: 'SaiPublicApi', layer: 'WORKFLOW', tier: 'TIER_1_FROZEN', description: 'Contrat API unifié pour le SDK et extensions', stabilityContract: 'Stable', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE', 'EXECUTION'] },
    { id: 'plugin_sdk', name: 'PluginSdk', layer: 'WORKFLOW', tier: 'TIER_3_EXTENSIBLE', description: 'SDK dextension pour modules externes', stabilityContract: 'Extensible', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE', 'EXECUTION'] },

    // Layer 5: Product
    { id: 'experience_workspace', name: 'ExperienceWorkspace', layer: 'PRODUCT', tier: 'TIER_2_EVOLVING', description: 'Workspaces de Capture, Inspection, Édition, Publication', stabilityContract: 'Evolving', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE', 'EXECUTION', 'WORKFLOW'] },
    { id: 'domain_profiles', name: 'DomainProfiles', layer: 'PRODUCT', tier: 'TIER_3_EXTENSIBLE', description: 'Profils métiers SaaS (Pressing, École, RH, BTP, etc.)', stabilityContract: 'Extensible', allowedDependencies: ['INFRASTRUCTURE', 'KNOWLEDGE'] }
  ];

  private static adrs: ArchitectureDecisionRecord[] = [
    {
      id: 'ADR-001',
      title: 'Le Scénario Applicatif Intelligent (SAI) comme unique source de vérité',
      status: 'ACCEPTED',
      date: '2026-07-20',
      author: 'Chief Architect & Research Team',
      context: 'Nécessité de produire de manière cohérente la vidéo, la documentation HTML/PDF, la voix-off, et les parcours de formation sans duplication.',
      decision: 'Remplacer l\'enregistrement vidéo brut par une structure de données déterministe (SAI) contenant la timeline, les événements, les snapshots et la narration.',
      consequences: [
        'Rendu déterministe à la demande',
        'Édition non destructrice de la pédagogie sans réenregistrement',
        'Consommation de bande passante et de stockage divisée par 10'
      ],
      impactedComponents: ['SaiCore', 'ReplayEngine', 'ExportEngine', 'ScenarioPlayer']
    },
    {
      id: 'ADR-002',
      title: 'Gel de l\'Architecture Baseline v2.0 et Gouvernance par Niveaux',
      status: 'ACCEPTED',
      date: '2026-07-24',
      author: 'ACOM Architecture Board',
      context: 'La plateforme ACOM AI Demo est passée d\'un moteur technique à une plateforme produit transverse.',
      decision: 'Geler le noyau technique (Niveau 1 Figé). Interdire toute modification directe des moteurs fondamentaux sans revue d\'architecture et ADR.',
      consequences: [
        'Stabilité garantie du contrat API publique (SaiPublicApi)',
        'Extensibilité via le PluginSdk et les profils métiers',
        'Passage d\'un développement orienté moteurs à des sprints orientés fonctionnalités utilisateur'
      ],
      impactedComponents: ['SaiRepository', 'SaiEventBus', 'ReplayEngine', 'SaiPublicApi']
    }
  ];

  public static getComponents(): ArchitectureComponent[] {
    return this.components;
  }

  public static getComponentsByTier(tier: ComponentGovernanceTier): ArchitectureComponent[] {
    return this.components.filter((c) => c.tier === tier);
  }

  public static getAdrs(): ArchitectureDecisionRecord[] {
    return this.adrs;
  }

  public static getCapabilitiesForDomain(domainId: string): PlatformCapability[] {
    switch (domainId) {
      case 'pressing':
        return ['CAPABILITY_CAPTURE', 'CAPABILITY_REPLAY', 'CAPABILITY_EXPORT', 'CAPABILITY_VOICE', 'CAPABILITY_QUIZ'];
      case 'school':
        return ['CAPABILITY_CAPTURE', 'CAPABILITY_REPLAY', 'CAPABILITY_EXPORT', 'CAPABILITY_VOICE', 'CAPABILITY_QUIZ', 'CAPABILITY_CERTIFICATION'];
      case 'health':
        return ['CAPABILITY_CAPTURE', 'CAPABILITY_REPLAY', 'CAPABILITY_EXPORT', 'CAPABILITY_VOICE', 'CAPABILITY_TRANSLATION'];
      default:
        return ['CAPABILITY_CAPTURE', 'CAPABILITY_REPLAY', 'CAPABILITY_EXPORT', 'CAPABILITY_VOICE', 'CAPABILITY_QUIZ', 'CAPABILITY_ANALYTICS'];
    }
  }
}
