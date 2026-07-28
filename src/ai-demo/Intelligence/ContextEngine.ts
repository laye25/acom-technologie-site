// src/ai-demo/Intelligence/ContextEngine.ts
// Maintains active SaaS context (merchant, user, role, page, capabilities, page structure)

import { SaaSContext, SaaSUserContext } from '../types';
import { CapabilityRegistry } from '../SaaSGateway/CapabilityRegistry';
import { SaaSPageRegistry, SaaSPageDefinition } from './SaaSPageRegistry';

class ContextEngineService {
  private currentContext: SaaSContext = {
    merchantId: 'm_pressing_demo',
    merchantName: 'Pressing Acom',
    activeSaaS: 'pressing',
    currentPage: 'pressing_receipt',
    user: {
      userId: 'usr_gerant',
      userName: 'Gérant Pressing',
      role: 'gerant',
      permissions: ['gerant', 'admin', 'caissier']
    },
    currency: 'FCFA'
  };

  public getContext(): SaaSContext {
    return { ...this.currentContext };
  }

  public getActivePageDefinition(): SaaSPageDefinition | undefined {
    return SaaSPageRegistry.getPage(this.currentContext.currentPage);
  }

  public updateContext(updates: Partial<SaaSContext>): SaaSContext {
    this.currentContext = {
      ...this.currentContext,
      ...updates
    };
    return this.getContext();
  }

  public updateUser(userUpdates: Partial<SaaSUserContext>): SaaSContext {
    this.currentContext.user = {
      ...this.currentContext.user,
      ...userUpdates
    };
    return this.getContext();
  }

  public getAvailableCapabilities() {
    return CapabilityRegistry.getAllActions(this.currentContext.activeSaaS);
  }
}

export const ContextEngine = new ContextEngineService();

