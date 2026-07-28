// src/ai-demo/types.ts
// Core TypeScript definitions for the new Acom IA Démo architecture

export type ActionRiskLevel = 'read' | 'normal' | 'sensible';

export interface SaaSUserContext {
  userId: string;
  userName: string;
  role: 'gerant' | 'caissier' | 'artisan' | 'admin' | 'user';
  permissions: string[];
}

export interface SaaSContext {
  merchantId: string;
  merchantName: string;
  activeSaaS: 'pressing' | 'couture' | 'stock' | 'medical' | 'scolaire' | 'transport' | 'btp';
  currentPage: string;
  user: SaaSUserContext;
  currency: string;
}

export interface SaaSActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface SaaSActionDefinition {
  id: string; // e.g. "pressing.createReceipt"
  saas: string; // "pressing"
  name: string; // "Créer une fiche de dépôt pressing"
  description: string;
  riskLevel: ActionRiskLevel;
  requiredPermissions: string[];
  parameters: SaaSActionParameter[];
  execute: (params: Record<string, any>, context: SaaSContext) => Promise<SaaSActionResult>;
}

export interface SaaSActionResult {
  success: boolean;
  actionId: string;
  messageFr: string;
  messageWolof: string;
  data?: any;
  error?: string;
  emittedEvent?: string;
}

export interface NLUIntentResult {
  intentId: string; // e.g. "pressing.createReceipt"
  actionFound: boolean;
  parameters: Record<string, any>;
  missingParameters: string[];
  isAmbiguous: boolean;
  clarificationMessageFr?: string;
  clarificationMessageWolof?: string;
  explanationFr: string;
  explanationWolof: string;
  riskLevel: ActionRiskLevel;
  confidence: number;
}

export interface BusinessEvent<T = any> {
  id: string;
  type: string; // e.g. "RECEIPT_CREATED", "CUSTOMER_CREATED", "PAYMENT_RECORDED", "CASH_REGISTER_CLOSED"
  saas: string;
  merchantId: string;
  payload: T;
  timestamp: string;
  triggeredBy: 'user' | 'ai_assistant';
}

export interface AcomActionLog {
  id: string;
  timestamp: string;
  merchantId: string;
  saas: string;
  intentId: string;
  parameters: Record<string, any>;
  riskLevel: ActionRiskLevel;
  userRole: string;
  status: 'executed' | 'rejected' | 'pending_confirmation' | 'failed';
  messageFr: string;
  messageWolof: string;
  error?: string;
}

export interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  targetAcomId: string; // e.g. "pressing.receipt.client_name"
  actionToPerform?: 'type' | 'click' | 'observe';
  inputValue?: string;
  speechFr: string;
  speechWolof: string;
  expectedEvent?: string;
}

export interface TutorialScenario {
  id: string;
  title: string;
  description: string;
  saasModule: string;
  estimatedDurationSec: number;
  steps: TutorialStep[];
}

export type ScreenRecordingStatus = 'idle' | 'requesting_permission' | 'recording' | 'stopped' | 'permission_denied' | 'error';
