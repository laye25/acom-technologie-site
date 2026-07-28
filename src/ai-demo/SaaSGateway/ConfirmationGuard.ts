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
  private pendingRequest: PendingConfirmationRequest | null = null;
  private subscribers: Set<(req: PendingConfirmationRequest | null) => void> = new Set();

  public registerHandler(handler: ConfirmationHandler): void {
    this.activeHandler = handler;
  }

  public unregisterHandler(): void {
    this.activeHandler = null;
  }

  public subscribe(listener: (req: PendingConfirmationRequest | null) => void): () => void {
    this.subscribers.add(listener);
    listener(this.pendingRequest);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notify(): void {
    this.subscribers.forEach(s => s(this.pendingRequest));
  }

  public getPendingRequest(): PendingConfirmationRequest | null {
    return this.pendingRequest;
  }

  public resolvePendingRequest(confirmed: boolean): void {
    if (this.pendingRequest) {
      const req = this.pendingRequest;
      this.pendingRequest = null;
      this.notify();
      req.resolve(confirmed);
    }
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
        resolve: (val: boolean) => {
          if (this.pendingRequest?.id === request.id) {
            this.pendingRequest = null;
            this.notify();
          }
          resolve(val);
        }
      };

      this.pendingRequest = request;
      this.notify();

      if (this.activeHandler) {
        this.activeHandler(request);
      }
    });
  }
}

export const ConfirmationGuard = new ConfirmationGuardService();
