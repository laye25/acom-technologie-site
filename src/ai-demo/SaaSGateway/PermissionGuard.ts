// src/ai-demo/SaaSGateway/PermissionGuard.ts
// Security guard verifying user roles and permissions for SaaS actions

import { SaaSActionDefinition, SaaSUserContext } from '../types';

export class PermissionGuard {
  public static isAllowed(action: SaaSActionDefinition, user: SaaSUserContext): { allowed: boolean; reasonFr?: string; reasonWolof?: string } {
    if (!action.requiredPermissions || action.requiredPermissions.length === 0) {
      return { allowed: true };
    }

    // Admin has access to everything
    if (user.role === 'admin' || user.role === 'gerant') {
      return { allowed: true };
    }

    const hasPermission = action.requiredPermissions.some(p => 
      p === user.role || (user.permissions && user.permissions.includes(p))
    );

    if (hasPermission) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reasonFr: `Permission insuffisante. L'action "${action.name}" nécessite le rôle : ${action.requiredPermissions.join(', ')}.`,
      reasonWolof: `Mëno def lii. Dafa la laaj rôle : ${action.requiredPermissions.join(', ')}.`
    };
  }
}
