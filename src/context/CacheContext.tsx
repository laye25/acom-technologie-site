import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { collection, query, getDocs, QueryConstraint, where, orderBy, limit, documentId } from 'firebase/firestore';
import { db } from '../firebase';

interface CacheItem {
  data: any;
  timestamp: number;
}

interface CacheContextType {
  getCachedData: (key: string) => any | null;
  setCachedData: (key: string, data: any) => void;
  prefetchCollection: (collectionName: string, constraints?: any[]) => Promise<void>;
  clearCache: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Record<string, CacheItem>>(() => {
    // Try to load from localStorage for persistent cache (Point 2)
    try {
      const saved = localStorage.getItem('firestore_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out expired items
        const now = Date.now();
        const filtered: Record<string, CacheItem> = {};
        Object.keys(parsed).forEach(key => {
          if (now - parsed[key].timestamp < CACHE_TTL) {
            filtered[key] = parsed[key];
          }
        });
        return filtered;
      }
    } catch (e) {
      console.warn('Failed to load cache from localStorage', e);
    }
    return {};
  });

  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const setCachedData = useCallback((key: string, data: any) => {
    const newItem = { data, timestamp: Date.now() };
    setCache(prev => {
      const next = { ...prev, [key]: newItem };
      // Persist to localStorage (Point 2)
      try {
        localStorage.setItem('firestore_cache', JSON.stringify(next));
      } catch (e) {
        // If localStorage is full, clear it
        localStorage.removeItem('firestore_cache');
      }
      return next;
    });
  }, []);

  const getCachedData = useCallback((key: string) => {
    const item = cacheRef.current[key];
    if (item && Date.now() - item.timestamp < CACHE_TTL) {
      return item.data;
    }
    return null;
  }, []);

  const prefetchCollection = useCallback(async (collectionName: string, constraints: any[] = []) => {
    const key = JSON.stringify({ collectionName, constraints });
    if (getCachedData(key)) return;

    try {
      const q = query(collection(db, collectionName), ...constraints);
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCachedData(key, data);
      console.log(`[Prefetch] Loaded ${collectionName}`);
    } catch (e) {
      console.error(`[Prefetch] Failed for ${collectionName}`, e);
    }
  }, [getCachedData, setCachedData]);

  const clearCache = useCallback(() => {
    setCache({});
    localStorage.removeItem('firestore_cache');
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
