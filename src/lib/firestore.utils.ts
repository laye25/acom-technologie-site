import { auth } from '../firebase';
import { FieldValue } from 'firebase/firestore';
import toast from 'react-hot-toast';

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

let quotaToastShown = false;

let permissionToastShown = false;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.toLowerCase().includes('quota')) {
    // Si la limite de quota est atteinte, on l'enregistre pour bloquer les futurs appels locaux pendant 1h
    localStorage.setItem('firebase_quota_exceeded', Date.now().toString());
    if (!quotaToastShown) {
       toast.error("Quota Firestore épuisé. L'application est passée en mode hors-ligne (Lecture seule cache) pour les prochaines 60 min.", { duration: 10000 });
       quotaToastShown = true;
    }
  } else if (errorMessage.toLowerCase().includes('missing or insufficient permissions')) {
    console.error(`[Firestore 403] Permissions insuffisantes sur le chemin: ${path} pour l'opération: ${operationType}`);
    if (!permissionToastShown) {
      toast.error("Permissions insuffisantes pour cette action.", { duration: 4000 });
      permissionToastShown = true;
      setTimeout(() => { permissionToastShown = false; }, 10000); // Allow again after 10s
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
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
  // Return the error info instead of throwing it, to allow callers to gracefully return their fallback (like null)
  return errInfo;
}

/**
 * Prepares data for Firestore by stripping undefined values 
 * and stringifying properties that might contain nested arrays (like fabricData)
 */
export function prepareForFirestore(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  
  // Handle numbers that Firestore rejects
  if (typeof data === 'number') {
    if (isNaN(data) || !isFinite(data)) return 0;
    return data;
  }
  
  if (typeof data !== 'object') return data;
  
  if (data instanceof Date) return data;
  if (data instanceof FieldValue) return data; // Preserve serverTimestamp()
  
  if (Array.isArray(data)) {
    return data.map(item => prepareForFirestore(item));
  }
  
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
 * and converting Firebase Timestamps to Date objects.
 */
export function restoreFromFirestore(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  
  // Handle Firebase Timestamps
  if (data.seconds !== undefined && data.nanoseconds !== undefined) {
    return new Date(data.seconds * 1000 + data.nanoseconds / 1000000);
  }

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
