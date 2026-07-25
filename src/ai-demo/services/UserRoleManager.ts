// src/ai-demo/services/UserRoleManager.ts
/**
 * UserRoleManager - Role-Based Access Control (RBAC) for ACOM AI Demo Platform
 * Defines user roles (Auteur, Relecteur, Formateur, Administrateur)
 * and their permissions across Capture, Edit, Review, Course Design, and Publishing.
 */

export type UserRole = 'AUTHOR' | 'REVIEWER' | 'TRAINER' | 'ADMIN';

export interface UserPermission {
  canCapture: boolean;
  canEditScenario: boolean;
  canAddComments: boolean;
  canApproveScenario: boolean;
  canPublishScenario: boolean;
  canManageCourses: boolean;
  canManageDomainProfiles: boolean;
  canManagePlugins: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export class UserRoleManager {
  private static permissionsMap: Record<UserRole, UserPermission> = {
    AUTHOR: {
      canCapture: true,
      canEditScenario: true,
      canAddComments: true,
      canApproveScenario: false,
      canPublishScenario: false,
      canManageCourses: false,
      canManageDomainProfiles: false,
      canManagePlugins: false
    },
    REVIEWER: {
      canCapture: false,
      canEditScenario: true,
      canAddComments: true,
      canApproveScenario: true,
      canPublishScenario: false,
      canManageCourses: false,
      canManageDomainProfiles: false,
      canManagePlugins: false
    },
    TRAINER: {
      canCapture: true,
      canEditScenario: true,
      canAddComments: true,
      canApproveScenario: true,
      canPublishScenario: true,
      canManageCourses: true,
      canManageDomainProfiles: false,
      canManagePlugins: false
    },
    ADMIN: {
      canCapture: true,
      canEditScenario: true,
      canAddComments: true,
      canApproveScenario: true,
      canPublishScenario: true,
      canManageCourses: true,
      canManageDomainProfiles: true,
      canManagePlugins: true
    }
  };

  public static getPermissions(role: UserRole): UserPermission {
    return this.permissionsMap[role] || this.permissionsMap.AUTHOR;
  }

  public static getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'AUTHOR':
        return 'Auteur / Créateur';
      case 'REVIEWER':
        return 'Relecteur / Q&A';
      case 'TRAINER':
        return 'Formateur / Pedagogical Lead';
      case 'ADMIN':
        return 'Administrateur Plateforme';
    }
  }

  public static getDefaultUsers(): UserProfile[] {
    return [
      {
        id: 'usr-1',
        name: 'Mamadou Diallo',
        email: 'm.diallo@acom.tech',
        role: 'AUTHOR'
      },
      {
        id: 'usr-2',
        name: 'Aïssatou Sow',
        email: 'a.sow@acom.tech',
        role: 'REVIEWER'
      },
      {
        id: 'usr-3',
        name: 'Abdoulaye Ndiaye',
        email: 'a.ndiaye@acom.tech',
        role: 'TRAINER'
      },
      {
        id: 'usr-4',
        name: 'Admin Système',
        email: 'admin@acom.tech',
        role: 'ADMIN'
      }
    ];
  }
}
