import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence enabled (IndexedDB) with fallback for restricted contexts like Electron custom schemes
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.warn('Failed to initialize Firestore with offline IndexedDB persistence, falling back to memoryLocalCache:', error);
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache()
    }, firebaseConfig.firestoreDatabaseId);
  } catch (fallbackError) {
    console.error('Fatal Firestore initialization failure, using default configuration:', fallbackError);
    firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = firestoreDb;

console.log('Firebase Firestore initialized:', !!db);

export const auth = getAuth();
export const storage = getStorage(app);
