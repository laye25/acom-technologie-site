// src/ai-demo/services/VideoStorageService.ts
// VideoStorageService: IndexedDB persistence for large recorded webm/mp4 video blobs

const DB_NAME = 'acom_demo_video_db';
const STORE_NAME = 'video_blobs';

export class VideoStorageService {
  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public static async saveVideoBlob(projectId: string, blob: Blob): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, projectId);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Failed to save video blob to IndexedDB:', e);
    }
  }

  public static async getVideoBlobUrl(projectId: string): Promise<string | undefined> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(projectId);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          if (request.result instanceof Blob) {
            resolve(URL.createObjectURL(request.result));
          } else {
            resolve(undefined);
          }
        };
        request.onerror = () => resolve(undefined);
      });
    } catch (e) {
      console.warn('Failed to retrieve video blob from IndexedDB:', e);
      return undefined;
    }
  }

  public static async deleteVideoBlob(projectId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(projectId);
    } catch (e) {
      console.warn('Failed to delete video blob from IndexedDB:', e);
    }
  }
}
