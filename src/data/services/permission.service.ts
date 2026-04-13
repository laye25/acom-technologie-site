import { UserProfile } from '../../types';

export type Role = 'admin' | 'manager' | 'client';

export interface Resource {
  userId?: string;
  ownerId?: string;
  merchantId?: string;
  [key: string]: any;
}

class PermissionEngine {
  /**
   * Check if a user can perform an action on a resource.
   * This implements RBAC (Role-Based Access Control) and basic Ownership checks.
   */
  can(user: UserProfile | null, action: 'read' | 'write' | 'delete', resource?: Resource): boolean {
    if (!user) return false;

    // Admins can do everything
    if (user.role === 'admin') return true;

    // Managers can read and write most things, but maybe not delete
    if (user.role === 'manager') {
      if (action === 'delete') return false;
      return true;
    }

    // Clients can only access their own resources
    if (user.role === 'client') {
      if (!resource) return false;
      
      const ownerId = resource.userId || resource.ownerId || resource.user_id;
      return ownerId === user.uid;
    }

    return false;
  }

  /**
   * Specific check for editing (write/update)
   */
  canEdit(user: UserProfile | null, resource: Resource): boolean {
    return this.can(user, 'write', resource);
  }

  /**
   * Specific check for deleting
   */
  canDelete(user: UserProfile | null, resource: Resource): boolean {
    return this.can(user, 'delete', resource);
  }

  /**
   * Check if user is an admin
   */
  isAdmin(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  /**
   * Check if user is a manager or admin
   */
  isStaff(user: UserProfile | null): boolean {
    return user?.role === 'admin' || user?.role === 'manager';
  }
}

export const permissionEngine = new PermissionEngine();
