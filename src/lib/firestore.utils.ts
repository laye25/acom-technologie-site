import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Prepares data for Firestore by stripping undefined values 
 * and stringifying properties that might contain nested arrays (like fabricData)
 */
export function prepareForFirestore(data: any): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => prepareForFirestore(item));
  }
  
  const prepared: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    
    // Special handling for fabricData to bypass nested array restrictions
    if (key === 'fabricData' && value !== null) {
      prepared[key] = typeof value === 'string' ? value : JSON.stringify(value);
    } else {
      prepared[key] = prepareForFirestore(value);
    }
  }
  return prepared;
}

/**
 * Restores data from Firestore by parsing stringified properties (like fabricData)
 */
export function restoreFromFirestore(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => restoreFromFirestore(item));
  }
  
  const restored: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'fabricData' && typeof value === 'string') {
      try {
        restored[key] = JSON.parse(value);
      } catch (e) {
        restored[key] = value;
      }
    } else {
      restored[key] = restoreFromFirestore(value);
    }
  }
  return restored;
}
