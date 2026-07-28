// src/ai-demo/SaaSGateway/ConfirmationGuard.ts
// Handles pending confirmation requests for SENSIBLE actions

import { SaaSActionDefinition, SaaSContext } from '../types';

export interface PendingConfirmationRequest {
  id: string;
  action: SaaSActionDefinition;
  params: Record<string, any>;
  context: SaaSContext;
  timestamp: string;
  resolve: (value: boolean) => void;
}

type ConfirmationHandler = (request: PendingConfirmationRequest) => void;

class ConfirmationGuardService {
  private activeHandler: ConfirmationHandler | null = null;

  public registerHandler(handler: ConfirmationHandler): void {
    this.activeHandler = handler;
  }

  public unregisterHandler(): void {
    this.activeHandler = null;
  }

  public async requestConfirmation(
    action: SaaSActionDefinition,
    params: Record<string, any>,
    context: SaaSContext
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const request: PendingConfirmationRequest = {
        id: `conf_${Date.now()}`,
        action,
        params,
        context,
        timestamp: new Date().toISOString(),
        resolve
      };

      if (this.activeHandler) {
        this.activeHandler(request);
      } else {
        // Fallback: window.confirm
        const msg = `[ACTION SENSIBLE REQUIS] : ${action.name}\n\nParamètres : ${JSON.stringify(params, null, 2)}\n\nVoulez-vous vraiment exécuter cette opération ?`;
        const accepted = window.confirm(msg);
        resolve(accepted);
      }
    });
  }
}

export const ConfirmationGuard = new ConfirmationGuardService();
