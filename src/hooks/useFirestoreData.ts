import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  QueryConstraint,
  DocumentData,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useDataCache } from '../context/CacheContext';
import { subscriptionEngine } from '../data/services/subscription.engine';
import { restoreFromFirestore } from '../lib/firestore.utils';

export type TableName = 
  | 'services' 
  | 'blog_posts' 
  | 'portfolio' 
  | 'settings' 
  | 'users' 
  | 'orders' 
  | 'messages'
  | 'merchants'
  | 'merchant_products'
  | 'merchant_sales'
  | 'merchant_expenses'
  | 'merchant_suppliers'
  | 'stock_movements'
  | 'merchant_stats'
  | 'design_templates'
  | 'design_requests'
  | 'interventions'
  | 'projects'
  | 'vehicles'
  | 'employees'
  | 'students'
  | 'patients'
  | 'appointments'
  | 'notifications'
  | 'studio_acom_categories'
  | 'studio_acom_templates'
  | 'designs'
  | 'templates'
  | 'expenses'
  | 'studio_acom_products'
  | 'partner_ratings'
  | 'variants'
  | 'assets';

export type CollectionName = TableName;

export interface UseSupabaseOptions<T> {
  tableName: TableName;
  order?: { column: string; ascending?: boolean; direction?: 'asc' | 'desc' };
  filters?: { column: string; value: any }[];
  filter?: { column: string; value: any };
  where?: any[][];
  mapper?: (data: any) => T;
  realtime?: boolean;
  skip?: boolean;
  limit?: number;
}

const defaultMapper = (data: any) => data;

export function useFirestoreData<T>({
  tableName,
  order,
  filters,
  filter,
  where: whereClauses,
  mapper = defaultMapper as any,
  realtime = false,
  skip = false,
  limit: limitCount
}: UseSupabaseOptions<T>) {
  const { getCachedData, setCachedData } = useDataCache();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  
  // Use a ref for the mapper to avoid re-triggering the effect if the mapper changes
  const mapperRef = useRef(mapper);
  useEffect(() => {
    mapperRef.current = mapper;
  }, [mapper]);

  const cacheKey = JSON.stringify({
    tableName,
    order,
    filters,
    filter,
    whereClauses,
    limitCount
  });

  useEffect(() => {
    if (realtime) {
      const observer = new IntersectionObserver(([entry]) => {
        setIsVisible(entry.isIntersecting);
      }, { threshold: 0.1 });
      
      // We assume this hook is used within a component that can be observed. 
      // Attaching to document.body or a specific container might be needed if component ref isn't available.                
      // For now, simple document-level visibility might suffice, or we pass a ref.
      return () => observer.disconnect();
    }
  }, [realtime]);

  useEffect(() => {
    if (skip || (realtime && !isVisible)) {
      if (skip) setLoading(false);
      return;
    }

    const cached = getCachedData(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const constraints: QueryConstraint[] = [];

    if (whereClauses && whereClauses.length > 0) {
      whereClauses.forEach(w => {
        const [column, operator, value] = w;
        const col = column === 'id' ? '__name__' : column;
        if (operator === '==') constraints.push(where(col, '==', value));
        else if (operator === '!=') constraints.push(where(col, '!=', value));
        else if (operator === '>') constraints.push(where(col, '>', value));
        else if (operator === '>=') constraints.push(where(col, '>=', value));
        else if (operator === '<') constraints.push(where(col, '<', value));
        else if (operator === '<=') constraints.push(where(col, '<=', value));
        else if (operator === 'in') constraints.push(where(col, 'in', value));
        else if (operator === 'array-contains') constraints.push(where(col, 'array-contains', value));
      });
    } else if (filters && filters.length > 0) {
      filters.forEach(f => {
        const col = f.column === 'id' ? '__name__' : f.column;
        constraints.push(where(col, '==', f.value));
      });
    } else if (filter) {
      const col = filter.column === 'id' ? '__name__' : filter.column;
      constraints.push(where(col, '==', filter.value));
    }

    if (order) {
      const direction = order.ascending ?? (order.direction === 'asc') ? 'asc' : 'desc';
      constraints.push(orderBy(order.column, direction));
    }

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const colRef = collection(db, tableName);
    const q = query(colRef, ...constraints);

    if (realtime) {
      const unsubscribe = subscriptionEngine.subscribe(cacheKey, q, (snapshot) => {
        const result = snapshot.docs.map(doc => {
          const rawData = { id: doc.id, ...doc.data() };
          return mapperRef.current(restoreFromFirestore(rawData));
        });
        setCachedData(cacheKey, result);
        setData(result);
        setLoading(false);
        setError(null);
      });
      return () => unsubscribe();
    } else {
      // One-time fetch
      getDocs(q).then((snapshot) => {
        const result = snapshot.docs.map(doc => {
          const rawData = { id: doc.id, ...doc.data() };
          return mapperRef.current(restoreFromFirestore(rawData));
        });
        setCachedData(cacheKey, result);
        setData(result);
        setLoading(false);
        setError(null);
      }).catch(err => {
        console.error(`Error fetching ${tableName}:`, err);
        setError(err);
        setLoading(false);
      });
    }
  }, [tableName, cacheKey, skip, realtime, isVisible, JSON.stringify(whereClauses), JSON.stringify(filters), filter?.column, filter?.value, order?.column, order?.ascending, order?.direction, limitCount, getCachedData, setCachedData]);

  const mutate = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Use setTimeout to avoid synchronous state updates of other components during render/update cycles
      setTimeout(() => setCachedData(cacheKey, next), 0);
      return next;
    });
  }, [cacheKey, setCachedData]);

  return { data, loading, error, mutate, refresh: () => {} }; // refresh is no-op with onSnapshot
}
