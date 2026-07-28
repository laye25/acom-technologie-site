// src/ai-demo/SaaSGateway/ActionRouter.ts
// Central Action Router converting NLU intents to authorized real business execution

import { NLUIntentResult, SaaSContext, SaaSActionResult } from '../types';
import { CapabilityRegistry } from './CapabilityRegistry';
import { PermissionGuard } from './PermissionGuard';
import { ConfirmationGuard } from './ConfirmationGuard';
import { ActionLogger } from '../AuditLog/ActionLogger';

class ActionRouterService {
  public async dispatchIntent(intent: NLUIntentResult, context: SaaSContext): Promise<SaaSActionResult> {
    if (!intent.actionFound || !intent.intentId) {
      return {
        success: false,
        actionId: 'unknown',
        messageFr: intent.explanationFr || 'Action non reconnue ou non prise en charge.',
        messageWolof: intent.explanationWolof || 'Deggoma bakh. Waxaatal li nga beug.',
        error: 'ACTION_NOT_FOUND'
      };
    }

    // 1. Check parameter completeness
    if (intent.missingParameters && intent.missingParameters.length > 0) {
      const missingList = intent.missingParameters.join(', ');
      return {
        success: false,
        actionId: intent.intentId,
        messageFr: `Information manquante : Veuillez préciser ${missingList}.`,
        messageWolof: `Dafa manque senn information : Teïko wax ma ${missingList}.`,
        error: 'MISSING_PARAMETERS'
      };
    }

    if (intent.isAmbiguous) {
      return {
        success: false,
        actionId: intent.intentId,
        messageFr: intent.clarificationMessageFr || 'Votre demande est ambiguë, veuillez préciser votre souhait.',
        messageWolof: intent.clarificationMessageWolof || 'Lii lereul, waxal bu lere.',
        error: 'AMBIGUOUS_INTENT'
      };
    }

    // 2. Find Action Definition
    const actionDef = CapabilityRegistry.getAction(intent.intentId);
    if (!actionDef) {
      return {
        success: false,
        actionId: intent.intentId,
        messageFr: `L'action "${intent.intentId}" n'est pas encore enregistrée dans le SaaS.`,
        messageWolof: `Action bi ngen beug def goul ko ci SaaS bi.`,
        error: 'ACTION_UNREGISTERED'
      };
    }

    // 3. Permission Guard
    const permCheck = PermissionGuard.isAllowed(actionDef, context.user);
    if (!permCheck.allowed) {
      ActionLogger.log({
        merchantId: context.merchantId,
        saas: context.activeSaaS,
        intentId: intent.intentId,
        parameters: intent.parameters,
        riskLevel: actionDef.riskLevel,
        userRole: context.user.role,
        status: 'rejected',
        messageFr: permCheck.reasonFr || 'Permission refusée',
        messageWolof: permCheck.reasonWolof || 'Mëno def lii'
      });

      return {
        success: false,
        actionId: intent.intentId,
        messageFr: permCheck.reasonFr || 'Accès refusé pour cette opération.',
        messageWolof: permCheck.reasonWolof || 'Mëno def lii.',
        error: 'PERMISSION_DENIED'
      };
    }

    // 4. Security Confirmation Guard for SENSIBLE actions
    if (actionDef.riskLevel === 'sensible') {
      const confirmed = await ConfirmationGuard.requestConfirmation(actionDef, intent.parameters, context);
      if (!confirmed) {
        ActionLogger.log({
          merchantId: context.merchantId,
          saas: context.activeSaaS,
          intentId: intent.intentId,
          parameters: intent.parameters,
          riskLevel: 'sensible',
          userRole: context.user.role,
          status: 'rejected',
          messageFr: 'Action sensible annulée par l\'utilisateur.',
          messageWolof: 'Annulet nañu ko.'
        });

        return {
          success: false,
          actionId: intent.intentId,
          messageFr: 'Opération sensible annulée.',
          messageWolof: 'Annulet nañu ko.',
          error: 'USER_CANCELLED'
        };
      }
    }

    // 5. Real Execution
    try {
      const result = await actionDef.execute(intent.parameters, context);

      ActionLogger.log({
        merchantId: context.merchantId,
        saas: context.activeSaaS,
        intentId: intent.intentId,
        parameters: intent.parameters,
        riskLevel: actionDef.riskLevel,
        userRole: context.user.role,
        status: result.success ? 'executed' : 'failed',
        messageFr: result.messageFr,
        messageWolof: result.messageWolof,
        error: result.error
      });

      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'Erreur d\'exécution inconnue';
      
      ActionLogger.log({
        merchantId: context.merchantId,
        saas: context.activeSaaS,
        intentId: intent.intentId,
        parameters: intent.parameters,
        riskLevel: actionDef.riskLevel,
        userRole: context.user.role,
        status: 'failed',
        messageFr: `Erreur d'exécution : ${errMsg}`,
        messageWolof: `Am na erreur : ${errMsg}`,
        error: errMsg
      });

      return {
        success: false,
        actionId: intent.intentId,
        messageFr: `Erreur lors de l'exécution de l'action : ${errMsg}`,
        messageWolof: `Am na erreur bu bon : ${errMsg}`,
        error: errMsg
      };
    }
  }
}

export const ActionRouter = new ActionRouterService();
