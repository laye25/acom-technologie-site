// src/ai-demo/types/sai.ts
/**
 * Contract & Schema Definition for Scénario Applicatif Intelligent (SAI)
 * Official Data Contract v1.0.0 - ACOM AI Demo Platform
 */

export type SaiPrivacyLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';

export type SaiEventType =
  | 'CLICK'
  | 'INPUT'
  | 'PAGE_CHANGE'
  | 'MODAL_OPEN'
  | 'MODAL_CLOSE'
  | 'SUBMIT'
  | 'DELETE'
  | 'ERROR'
  | 'SHORTCUT'
  | 'HOVER'
  | 'PRINT'
  | 'EXPORT'
  | 'CALCULATION';

export interface SaiAnonymizationRule {
  fieldPattern: string; // e.g. "phone", "email", "clientName", "amount"
  maskType: 'hash' | 'blur' | 'asterisk' | 'replace_fixed';
  fixedReplacement?: string;
}

export interface SaiComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  stepIndex?: number;
}

export interface SaiEditLock {
  lockedBy: string;
  lockedAt: string;
}

export interface SaiMetadata {
  title: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  merchantId: string; // Multi-Tenant mandatory
  privacyLevel: SaiPrivacyLevel;
  tags: string[];
  status: 'draft' | 'validated' | 'archived';
  reviewStatus?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  editLock?: SaiEditLock | null;
  comments?: SaiComment[];
  qualityScore?: number;
}

export interface SaiApplicationContext {
  appName: string; // e.g. "Acom Tailleur", "Acom Pressing"
  moduleName: string; // e.g. "Commandes", "Fiche Réception Client"
  pageName: string;
  route: string;
  version: string;
  environment: 'web' | 'desktop' | 'mobile';
}

export interface SaiInteractionEvent {
  id: string;
  timestamp: number; // Ms from start
  type: SaiEventType;
  module: string;
  page: string;
  component: string;
  action: string;
  intent?: string; // User's pedagogical intent (e.g. "Validation de la commande client")
  privacyLevel: SaiPrivacyLevel;
  merchantId: string;
  targetId?: string;
  targetSelector?: string;
  targetTag?: string;
  coordinates?: { x: number; y: number };
  valueMasked?: string;
  snapshotId?: string;
  metadata?: Record<string, any>;
}

export interface SaiVisualSnapshot {
  id: string;
  timestamp: number;
  width: number;
  height: number;
  dataUrl?: string; // Data URL or SVG string
  cssRules?: string;
  privacyMasksApplied: boolean;
}

export interface SaiKnowledgeNode {
  id: string;
  stepId: string;
  conceptName: string;
  summary: string;
  businessObjective: string;
  proAdvice: string;
  timeSavingTip: string;
  warningNote?: string;
  faqEntries: Array<{ question: string; answer: string }>;
}

export interface SaiTimelineStep {
  id: string;
  stepNumber: number;
  startTimeSec: number;
  durationSec: number;
  title: string;
  description: string;
  actionType: SaiEventType;
  intent: string;
  zoomLevel: number;
  effectOverlay: 'none' | 'green_halo' | 'red_halo' | 'arrow_pointer' | 'blur_mask';
  snapshotId?: string;
  narrationText: string;
  proAdvice?: string;
  timeSavingTip?: string;
  isAccelerated?: boolean;
}

export interface SaiNarrationTrack {
  id: string;
  language: string; // 'fr', 'en', 'es', 'ar', 'wo', 'pt'
  voiceId: string;
  audioBlobUrl?: string;
  subtitlesSrt: string;
  subtitlesVtt: string;
}

export interface SaiDiagnostics {
  overallScore: number;
  readabilityScore: number;
  rhythmScore: number;
  pedagogyScore: number;
  deadTimeTrimmedSec: number;
  suggestions: Array<{
    id: string;
    title: string;
    type: string;
    autoFixable: boolean;
  }>;
}

export interface SaiVersionHistory {
  version: string; // e.g. "1.0.0"
  timestamp: string;
  author: string;
  changesDescription: string;
}

export interface SaiExportArtifacts {
  videoMp4Url?: string;
  videoWebmUrl?: string;
  pdfGuideMarkdown?: string;
  htmlDoc?: string;
  markdownDoc?: string;
  quizJson?: string;
}

export interface ScenarioApplicationIntelligent {
  $schema: string; // "https://acom.tech/schemas/sai.v1.json"
  id: string;
  version: string; // e.g. "1.0.0"
  schemaVersion: '1.0.0';
  metadata: SaiMetadata;
  application: SaiApplicationContext;
  events: SaiInteractionEvent[];
  snapshots: SaiVisualSnapshot[];
  timeline: SaiTimelineStep[];
  knowledge: SaiKnowledgeNode[];
  narration: SaiNarrationTrack[];
  diagnostics: SaiDiagnostics;
  exports: SaiExportArtifacts;
  history: SaiVersionHistory[];
  extensions: Record<string, any>; // Extension mechanism for custom engines
}
