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
  
  // If we are at the top level of 'content', just stringify the whole thing
  // The caller in CardEditor.tsx passes 'el' as 'content' which is a large object
  // Let's force it to be a JSON string immediately at the top level if it's the 'content' property being prepared.
  // Actually, prepareForFirestore is recursive. This is tricky.
  
  const prepared: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    
    // Force stringification for 'content', 'details' and 'files' to drastically reduce document size
    if ((key === 'content' || key === 'details' || key === 'files') && value !== null && typeof value === 'object') {
       prepared[key] = JSON.stringify(value);
    } else if (key === 'fabricData' && value !== null) {
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
    if ((key === 'fabricData' || key === 'content' || key === 'details' || key === 'files') && typeof value === 'string') {
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
