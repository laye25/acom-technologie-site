import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  QueryConstraint,
  getDocs,
  documentId,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useDataCache } from '../context/CacheContext';

export type CollectionName = 
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
  | 'expenses';

interface UseFirebaseOptions<T> {
  collectionName: CollectionName;
  order?: { column: string; ascending?: boolean; direction?: 'asc' | 'desc' };
  filters?: { column: string; value: any }[];
  filter?: { column: string; value: any }; // Keep for backward compatibility
  where?: any[][]; // Support for direct where clauses
  mapper?: (data: any) => T;
  realtime?: boolean;
  skip?: boolean;
  limit?: number;
}

const defaultMapper = (data: any) => data;

export function useFirebaseData<T>({
  collectionName,
  order,
  filters,
  filter,
  where: whereClauses,
  mapper = defaultMapper as any,
  realtime = false,
  skip = false,
  limit: limitCount
}: UseFirebaseOptions<T>) {
  const { getCachedData, setCachedData } = useDataCache();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);

  // Generate a unique key for this query
  const cacheKey = JSON.stringify({
    collectionName,
    order,
    filters,
    filter,
    whereClauses,
    limitCount
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (skip) return;
    
    // Check cache first (Point 1, 7)
    if (!forceRefresh && !realtime) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const constraints: QueryConstraint[] = [];

      if (whereClauses && whereClauses.length > 0) {
        whereClauses.forEach(w => {
          constraints.push(where(w[0], w[1], w[2]));
        });
      } else if (filters && filters.length > 0) {
        filters.forEach(f => {
          const column = f.column === 'id' ? documentId() : f.column;
          constraints.push(where(column, '==', f.value));
        });
      } else if (filter) {
        const column = filter.column === 'id' ? documentId() : filter.column;
        constraints.push(where(column, '==', filter.value));
      }

      if (order) {
        const direction = order.direction || (order.ascending ?? true ? 'asc' : 'desc');
        constraints.push(orderBy(order.column, direction));
      }

      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const result = querySnapshot.docs.map(doc => mapper({ id: doc.id, ...doc.data() }));
      
      // Update cache
      setCachedData(cacheKey, result);
      
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [
    collectionName, 
    order?.column, 
    order?.ascending, 
    order?.direction, 
    filter?.column, 
    filter?.value, 
    JSON.stringify(filters), 
    JSON.stringify(whereClauses), 
    mapper, 
    skip,
    limitCount,
    cacheKey,
    realtime,
    getCachedData,
    setCachedData
  ]);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    if (!realtime) {
      fetchData();
      return;
    }

    // Realtime logic (Point 1: Use sparingly)
    setLoading(true);
    const constraints: QueryConstraint[] = [];

    if (whereClauses && whereClauses.length > 0) {
      whereClauses.forEach(w => {
        constraints.push(where(w[0], w[1], w[2]));
      });
    } else if (filters && filters.length > 0) {
      filters.forEach(f => {
        const column = f.column === 'id' ? documentId() : f.column;
        constraints.push(where(column, '==', f.value));
      });
    } else if (filter) {
      const column = filter.column === 'id' ? documentId() : filter.column;
      constraints.push(where(column, '==', filter.value));
    }

    if (order) {
      const direction = order.direction || (order.ascending ?? true ? 'asc' : 'desc');
      constraints.push(orderBy(order.column, direction));
    }

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const result = querySnapshot.docs.map(doc => mapper({ id: doc.id, ...doc.data() }));
      setData(result);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(`Snapshot error for ${collectionName}:`, err);
      try {
        handleFirestoreError(err, OperationType.LIST, collectionName);
      } catch (formattedError: any) {
        setError(formattedError);
      }
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) console.warn(`useFirebaseData loading timed out for ${collectionName}`);
        return false;
      });
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [
    collectionName, 
    order?.column, 
    order?.ascending, 
    order?.direction, 
    filter?.column, 
    filter?.value, 
    JSON.stringify(filters), 
    JSON.stringify(whereClauses), 
    mapper, 
    realtime, 
    skip, 
    fetchData,
    limitCount
  ]);

  return { data, loading, error, refresh: fetchData };
}
