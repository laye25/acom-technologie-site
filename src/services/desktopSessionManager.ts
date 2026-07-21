import firebaseConfig from '../../firebase-applet-config.json';
import { User } from 'firebase/auth';

const DB_NAME = 'firebaseLocalStorageDb';
const STORE_NAME = 'firebaseLocalStorage';
const KEY = `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`;

export const desktopSessionManager = {
  /**
   * Saves the Firebase Auth session to the secure Desktop persistent storage.
   */
  async saveSession(user: User | null): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.saveDesktopSettings) return;

    if (!user) {
      await electronAPI.saveDesktopSettings({ firebase_session: null });
      return;
    }

    try {
      const sessionData = user.toJSON();
      await electronAPI.saveDesktopSettings({ firebase_session: sessionData });
      console.log('[DesktopSessionManager] Session backed up to Desktop secure storage.');
    } catch (e) {
      console.error('[DesktopSessionManager] Failed to save session:', e);
    }
  },

  /**
   * Restores the session from Desktop persistent storage and injects it into IndexedDB
   * BEFORE Firebase initializes, ensuring session continuity across origin changes.
   */
  async restoreSessionBeforeFirebaseInit(): Promise<boolean> {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.getDesktopSettings) return false;

    try {
      const result = await electronAPI.getDesktopSettings();
      if (!result?.settings?.firebase_session) {
        return false;
      }

      const sessionData = result.settings.firebase_session;
      await injectIntoIndexedDB(sessionData);
      console.log('[DesktopSessionManager] Firebase session successfully injected into IndexedDB.');
      return true;
    } catch (e) {
      console.error('[DesktopSessionManager] Failed to restore session from Desktop:', e);
      return false;
    }
  }
};

function injectIntoIndexedDB(sessionData: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e: any) => {
      const db = e.target.result;
      
      // Ensure the store exists (in case onupgradeneeded wasn't triggered but store is missing, though rare)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        // Force upgrade by increasing version
        const req2 = indexedDB.open(DB_NAME, db.version + 1);
        req2.onupgradeneeded = (e2: any) => {
          e2.target.result.createObjectStore(STORE_NAME);
        };
        req2.onsuccess = (e2: any) => {
          writeRecord(e2.target.result, sessionData).then(resolve).catch(reject);
        };
        req2.onerror = () => reject(req2.error);
        return;
      }

      writeRecord(db, sessionData).then(resolve).catch(reject);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

function writeRecord(db: IDBDatabase, sessionData: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = { fbase_key: KEY, value: sessionData };
      
      const putReq = store.put(record, KEY);
      
      putReq.onsuccess = () => {
        db.close();
        resolve();
      };
      
      putReq.onerror = () => {
        db.close();
        reject(putReq.error);
      };
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}
