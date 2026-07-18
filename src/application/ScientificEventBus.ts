export type Command = 
  | { type: 'COMPILE', payload: { assetId: string, layers: any[], projectName: string, format: string, fabricKey: string, mode: string, executivePriority: string, executiveMachine: string, executiveThread: string, runId?: string } }
  | { type: 'VALIDATE_ASSET', payload: { assetId: string, layers: any[], stitchesCount: number, trimsCount: number, threadLength: number } }
  | { type: 'RUN_DIAGNOSTIC', payload: { assetId: string, layers: any[], fabricKey: string } }
  | { type: 'LAUNCH_NIGHT_RESEARCH', payload: { mode: 'fast' | 'full' | 'deep' | 'sandbox', targetMerchantId?: string, queueFiles: any[], settings: any, preflightSteps: any[], pipelineSteps: string[] } }
  | { type: 'SAVE_SCIENTIFIC_ASSET', payload: { layers: any[], projectName: string, fabricKey: string } }
  | { type: 'EKLE_LEARN', payload: { sourceId: string, sourceName: string, layers: any[] } }
  | { type: 'EKLE_SUGGEST', payload: { layers: any[] } }
  | { type: 'VERSEAU_REASON', payload: { mode: string, fabricKey: string, fabricName: string, priority: string, machine: string, thread: string } }
  | { type: 'VERSEAU_FEEDBACK', payload: { fabricKey: string, mode: string, success: boolean, stats: any, decisions: any, machine: string } }
  | { type: 'VERSEAU_ADD_MEMORY', payload: { memory: any } }
  | { type: 'VERSEAU_GET_MEMORIES', payload: {} };

export type Event = 
  | { type: 'COMPILATION_STARTED', payload: { assetId: string, mode: string } }
  | { type: 'SCIENTIFIC_REVIEW_STARTED', payload: { revisionId: string } }
  | { type: 'SCIENTIFIC_REVIEW_FINISHED', payload: { revisionId: string, reviewId: string } }
  | { type: 'NIGHT_RESEARCH_STARTED', payload: { mode: string } }
  | { type: 'NIGHT_RESEARCH_FINISHED', payload: { campaignId: string, stats: any } }
  | { type: 'GEOMETRY_AUTOPSY_STARTED', payload: { snapshotId: string } }
  | { type: 'GEOMETRY_AUTOPSY_FINISHED', payload: { auditId: string } }
  | { type: 'CERTIFICATION_GRANTED', payload: { revisionId: string } }
  | { type: 'CERTIFICATION_REJECTED', payload: { revisionId: string, reason: string } }
  | { type: 'ASSET_PUBLISHED', payload: { assetId: string } }

  | { type: 'SNAPSHOT_CREATED', payload: { snapshotId: string, assetId: string } }
  | { type: 'REVISION_CREATED', payload: { revisionId: string, assetId: string, snapshotId: string } }
  | { type: 'COMPILATION_FINISHED', payload: { revisionId: string, format: string, buffer: ArrayBuffer } }
  | { type: 'VALIDATION_PASSED', payload: { revisionId: string, validationId: string } }
  | { type: 'SCIENTIFIC_REVIEW_COMPLETED', payload: { revisionId: string, reviewId: string } }
  | { type: 'KNOWLEDGE_ACCEPTED', payload: { knowledgeId: string } }
  | { type: 'NIGHT_CAMPAIGN_FINISHED', payload: { campaignId: string, stats: any } }
  | { type: 'NIGHT_RESEARCH_LOG', payload: { message: string } }
  | { type: 'NIGHT_RESEARCH_STEP', payload: { index: number, total: number, file: any, priorityText: string, activeStep: number } }
  | { type: 'NIGHT_RESEARCH_STATS', payload: { stats: any, scoreGain: number } }
  | { type: 'NIGHT_RESEARCH_PREFLIGHT_STEP', payload: { index: number, status: string, value?: string } }
  | { type: 'NIGHT_RESEARCH_PHASE', payload: { phase: string, mode?: string } }
  // SDE Scientific Decision Engine Events
  | { type: 'OBSERVATION_CREATED', payload: { observationId: string, description: string, confidence: number } }
  | { type: 'HYPOTHESIS_CREATED', payload: { hypothesisId: string, description: string } }
  | { type: 'EXPERIMENT_CREATED', payload: { experimentId: string, description: string } }
  | { type: 'EVIDENCE_ADDED', payload: { evidenceId: string, comparison: string } }
  | { type: 'KNOWLEDGE_PROMOTED', payload: { principleId: string, description: string } }
  | { type: 'LAW_CERTIFIED', payload: { lawId: string, law: string } }
  | { type: 'LAW_REFUTED', payload: { lawId: string, reason: string } }
  | { type: 'CAMPAIGN_COMPLETED', payload: { campaignId: string, stats: any } }
  | { type: 'DECISION_TAKEN', payload: { decisionId: string, type: string, decision: string, motive: string } }
  // SRE Scientific Reasoning Engine Events
  | { type: 'REASONING_STARTED', payload: { assetId: string } }
  | { type: 'REASONING_FINISHED', payload: { assetId: string, questionsCount: number, debatesCount: number } }
  | { type: 'QUESTION_GENERATED', payload: { questionId: string, text: string } }
  | { type: 'CONTRADICTION_FOUND', payload: { contradictionId: string, description: string } }
  | { type: 'DEBATE_HELD', payload: { debateId: string, winnerId: string, motive: string } }
  | { type: 'CURIOSITY_ZONE_IDENTIFIED', payload: { zoneId: string, fabric: string } }
  // Simulation Events
  | { type: 'SIMULATION_LOG', payload: { message: string } }
  | { type: 'SIMULATION_STAGE', payload: { stage: string } }
  | { type: 'SIMULATION_SCORE', payload: { scores: any } }
  | { type: 'SIMULATION_REASONING', payload: { reasoning: any, criticReport: any, directive: any } }
  | { type: 'SIMULATION_OBSERVATION', payload: { observation: string } }
  | { type: 'PIPELINE_STATE_CHANGED', payload: { state: string } }
  | { type: 'VALIDATION_COMPLETED', payload: { report: any } };

type EventHandler = (event: Event) => void;

class ScientificEventBusClass {
  private handlers: { [key: string]: EventHandler[] } = {};

  subscribe(eventType: string, handler: EventHandler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
    return () => this.unsubscribe(eventType, handler);
  }

  unsubscribe(eventType: string, handler: EventHandler) {
    if (!this.handlers[eventType]) return;
    this.handlers[eventType] = this.handlers[eventType].filter(h => h !== handler);
  }

  publish(event: Event) {
    const eventHandlers = this.handlers[event.type];
    if (eventHandlers) {
      eventHandlers.forEach(handler => handler(event));
    }
  }
}

export const ScientificEventBus = new ScientificEventBusClass();
