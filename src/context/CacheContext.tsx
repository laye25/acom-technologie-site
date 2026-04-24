import React, { createContext, useContext, useCallback } from 'react';
import { firestoreService } from '../services/firestoreService';

interface CacheItem {
  data: any;
  timestamp: number;
}

class MemoryCache {
  private store = new Map<string, CacheItem>();
  private pendingFetches = new Map<string, Promise<any>>();

  get(key: string, ttl: number = 600000): any | null {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > ttl) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, value: any) {
    this.store.set(key, { data: value, timestamp: Date.now() });
  }

  clear() {
    this.store.clear();
  }

  getPending(key: string) {
    return this.pendingFetches.get(key);
  }

  setPending(key: string, promise: Promise<any>) {
    this.pendingFetches.set(key, promise);
  }

  deletePending(key: string) {
    this.pendingFetches.delete(key);
  }
}

const memoryCache = new MemoryCache();

interface CacheContextType {
  getCachedData: (key: string) => any | null;
  setCachedData: (key: string, data: any) => void;
  prefetchCollection: (collectionName: string) => Promise<void>;
  clearCache: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setCachedData = useCallback((key: string, data: any) => {
    memoryCache.set(key, data);
  }, []);

  const getCachedData = useCallback((key: string) => {
    // Return cached value if within TTL (10 mins default in MemoryCache)
    return memoryCache.get(key);
  }, []);

  const prefetchCollection = useCallback(async (collectionName: string) => {
    const key = JSON.stringify({ collectionName });
    
    if (memoryCache.get(key) || memoryCache.getPending(key)) return;

    try {
      const promise = firestoreService.getAll(collectionName);
      memoryCache.setPending(key, promise);
      const data = await promise;
      memoryCache.set(key, data);
      console.log(`[Prefetch] Loaded ${collectionName}`);
    } catch (e) {
      console.error(`[Prefetch] Failed for ${collectionName}`, e);
    } finally {
      memoryCache.deletePending(key);
    }
  }, []);

  const clearCache = useCallback(() => {
    memoryCache.clear();
  }, []);

  return (
    <CacheContext.Provider value={{ getCachedData, setCachedData, prefetchCollection, clearCache }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(CacheContext);
  if (!context) throw new Error('useDataCache must be used within a CacheProvider');
  return context;
};
