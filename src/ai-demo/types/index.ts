// src/ai-demo/types/index.ts
// Comprehensive TypeScript interfaces for ACOM AI Demo Platform

export * from './sai';

export type DemoLanguage = 'fr' | 'en' | 'es' | 'ar' | 'wo' | 'pt';

export type DemoAspectRatio = '16:9' | '9:16' | '1:1';

export type DemoResolution = '720p' | '1080p' | '1440p' | '4K';

export type DemoFPS = 30 | 60;

export type DemoExportFormat = 'mp4' | 'mov' | 'webm' | 'gif';

export type EventActionType = 
  | 'click' 
  | 'input' 
  | 'select'
  | 'page_change' 
  | 'modal_open' 
  | 'modal_close' 
  | 'submit' 
  | 'delete' 
  | 'error' 
  | 'shortcut' 
  | 'hover';

export interface RecordedEvent {
  id: string;
  timestampMs: number; // Elapsed time in ms from recording start
  timeFormatted: string; // e.g. "00:02.541"
  module: string; // e.g. "Gestion Couture", "Gestion Scolaire", etc.
  page: string; // e.g. "Clients", "Commandes", "Stock"
  action: EventActionType;
  buttonOrLabel?: string;
  targetTag?: string;
  targetId?: string;
  x?: number;
  y?: number;
  valueMasked?: string;
  hasSensitiveData?: boolean;
  metadata?: Record<string, any>;
  screenshotUrl?: string;
}

export interface UIControlInfo {
  type: 'button' | 'textbox' | 'select' | 'checkbox' | 'icon' | 'table' | 'modal' | 'alert' | 'link';
  label: string;
  id?: string;
  selector?: string;
  isSensitive?: boolean;
}

export interface UIAnalysis {
  module: string;
  page: string;
  title: string;
  controls: UIControlInfo[];
  timestamp: string;
}

export interface TimelineStep {
  id: string;
  stepNumber: number;
  startTimeSec: number;
  durationSec: number;
  title: string;
  description: string;
  narrationText: string;
  actionType: EventActionType;
  targetSelector?: string;
  targetValue?: string;
  x?: number;
  y?: number;
  zoomLevel: number; // e.g. 1.0 to 1.8
  effectOverlay: 'none' | 'green_halo' | 'red_halo' | 'arrow_pointer' | 'blur_mask';
  screenshotUrl?: string;
  // Pedagogical & Engine Enhancements
  objective?: string; // e.g. "Ajouter les articles concernés par la réception"
  advice?: string;    // e.g. "Vérifiez la quantité livrée avant validation"
  tip?: string;       // e.g. "Vous pouvez aussi scanner le code-barres"
  isAccelerated?: boolean; // Indicates if dead-time was accelerated
  speedMultiplier?: number; // e.g. 2.5x speed up
}

export interface OptimizationSuggestion {
  id: string;
  type: 'trim_dead_time' | 'add_zoom' | 'enrich_narration' | 'add_tips';
  title: string;
  description: string;
  impactScore: number; // +5 to +20 points
  autoFixable: boolean;
}

export interface DemoAuditReport {
  overallScore: number; // 0 to 100
  overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  scores: {
    deadTimeScore: number;  // 0 to 100
    zoomScore: number;      // 0 to 100
    narrationScore: number; // 0 to 100
    transitionsScore: number; // 0 to 100
    pedagogyScore: number;  // 0 to 100
  };
  stats: {
    totalDurationSec: number;
    deadTimeTrimmedSec: number;
    stepCount: number;
    zoomsAppliedCount: number;
    tipsCount: number;
  };
  suggestions: OptimizationSuggestion[];
}

export interface VoiceConfig {
  voiceId: string;
  voiceName: string;
  gender: 'male' | 'female' | 'neutral';
  language: DemoLanguage;
  pitch: number; // 0.5 to 1.5
  rate: number;  // 0.5 to 1.5
  volume: number;// 0.0 to 1.0
  provider: 'webspeech' | 'gemini_tts' | 'elevenlabs';
}

export interface SubtitleItem {
  id: string;
  index: number;
  startFormatted: string; // 00:00:01,200
  endFormatted: string;   // 00:00:04,500
  text: string;
}

export interface SubtitleConfig {
  srtContent: string;
  vttContent: string;
  txtContent: string;
  items: SubtitleItem[];
}

export interface BrandingConfig {
  showLogo: boolean;
  logoUrl?: string;
  appName: string;
  moduleName: string;
  version: string;
  authorName?: string;
  showQRCode?: boolean;
  qrCodeUrl?: string;
  websiteUrl?: string;
  primaryColor: string;
  accentColor: string;
  showOutroScreen?: boolean;
}

export interface VideoConfig {
  resolution: DemoResolution;
  fps: DemoFPS;
  aspectRatio: DemoAspectRatio;
  format: DemoExportFormat;
  includeNarration: boolean;
  includeSubtitles: boolean;
  backgroundMusicUrl?: string;
  backgroundMusicVolume: number; // 0 to 1
}

export interface DocExport {
  userGuideMarkdown: string;
  userGuideHtml: string;
  faqList: Array<{ question: string; answer: string }>;
  apiDocMarkdown?: string;
  trainingScript: string;
  knowledgeBaseEntry: string;
}

export interface DemoProject {
  id: string;
  title: string;
  description: string;
  moduleName: string;
  pageName: string;
  createdAt: string;
  updatedAt: string;
  durationSec: number;
  events: RecordedEvent[];
  uiAnalysis?: UIAnalysis;
  timelineSteps: TimelineStep[];
  voiceConfig: VoiceConfig;
  videoConfig: VideoConfig;
  brandingConfig: BrandingConfig;
  subtitles: SubtitleConfig;
  documentation: DocExport;
  auditReport?: DemoAuditReport;
  videoBlobUrl?: string;
  status: 'draft' | 'processing' | 'ready' | 'published';
  isTrainingMode: boolean;
  tags: string[];
}

export interface DemoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'tutorial' | 'training' | 'release' | 'support';
  icon: string;
  defaultBranding: Partial<BrandingConfig>;
  defaultVideo: Partial<VideoConfig>;
  presetStepsPrompt: string;
}
