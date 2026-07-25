// src/ai-demo/services/WorkflowEngine.ts
/**
 * WorkflowEngine - Business Lifecycle & Approval Process Manager
 * Manages the transition of Scénarios Applicatifs Intelligents (SAI) through:
 * BROUILLON (Draft) -> RÉVISION (Review) -> VALIDÉ (Approved) -> PUBLIÉ (Published) -> ARCHIVÉ (Archived).
 */

import { ScenarioApplicationIntelligent, SaiMetadata } from '../types/sai';

export type SaiWorkflowStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface SaiWorkflowAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  fromStatus: SaiWorkflowStatus;
  toStatus: SaiWorkflowStatus;
  comment?: string;
}

export interface WorkflowTransitionResult {
  success: boolean;
  scenario: ScenarioApplicationIntelligent;
  message: string;
  auditEntry?: SaiWorkflowAuditEntry;
}

export class WorkflowEngine {
  private static allowedTransitions: Record<SaiWorkflowStatus, SaiWorkflowStatus[]> = {
    DRAFT: ['REVIEW', 'ARCHIVED'],
    REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'],
    APPROVED: ['PUBLISHED', 'REVIEW', 'ARCHIVED'],
    PUBLISHED: ['ARCHIVED', 'REVIEW'],
    ARCHIVED: ['DRAFT']
  };

  /**
   * Transition a scenario to a target lifecycle status with audit logging.
   */
  public static transitionScenario(
    scenario: ScenarioApplicationIntelligent,
    targetStatus: SaiWorkflowStatus,
    actor: string,
    actorRole: string,
    comment?: string
  ): WorkflowTransitionResult {
    const currentStatus: SaiWorkflowStatus =
      (scenario.metadata.reviewStatus as SaiWorkflowStatus) || 'DRAFT';

    const validTargets = this.allowedTransitions[currentStatus] || [];
    if (!validTargets.includes(targetStatus)) {
      return {
        success: false,
        scenario,
        message: `Transition non autorisée de ${currentStatus} vers ${targetStatus}. Transitions valides: ${validTargets.join(', ')}`
      };
    }

    const auditEntry: SaiWorkflowAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      actorRole,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      comment
    };

    const updatedMetadata: SaiMetadata = {
      ...scenario.metadata,
      reviewStatus: targetStatus,
      updatedAt: new Date().toISOString(),
      status: targetStatus === 'PUBLISHED' ? 'validated' : targetStatus === 'ARCHIVED' ? 'archived' : 'draft'
    };

    const auditLogs: SaiWorkflowAuditEntry[] =
      scenario.extensions?.workflowAuditLogs || [];

    const updatedScenario: ScenarioApplicationIntelligent = {
      ...scenario,
      metadata: updatedMetadata,
      extensions: {
        ...scenario.extensions,
        workflowAuditLogs: [auditEntry, ...auditLogs]
      }
    };

    return {
      success: true,
      scenario: updatedScenario,
      message: `Statut mis à jour avec succès : ${currentStatus} -> ${targetStatus}`,
      auditEntry
    };
  }

  /**
   * Get all allowed status transitions for current status
   */
  public static getAllowedTransitions(currentStatus: SaiWorkflowStatus): SaiWorkflowStatus[] {
    return this.allowedTransitions[currentStatus] || [];
  }
}
