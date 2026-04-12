import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { useDataCache } from '../context/CacheContext';

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
  | 'variants';

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

  const cacheKey = JSON.stringify({
    tableName,
    order,
    filters,
    filter,
    whereClauses,
    limitCount
  });

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    const cached = getCachedData(cacheKey);
    if (cached) {
      setData(cached);
      if (!realtime) {
        setLoading(false);
      }
    } else {
      setLoading(true);
    }

    const constraints: QueryConstraint[] = [];

    if (whereClauses && whereClauses.length > 0) {
      whereClauses.forEach(w => {
        const [column, operator, value] = w;
        if (operator === '==') constraints.push(where(column, '==', value));
        else if (operator === '!=') constraints.push(where(column, '!=', value));
        else if (operator === '>') constraints.push(where(column, '>', value));
        else if (operator === '>=') constraints.push(where(column, '>=', value));
        else if (operator === '<') constraints.push(where(column, '<', value));
        else if (operator === '<=') constraints.push(where(column, '<=', value));
        else if (operator === 'in') constraints.push(where(column, 'in', value));
        else if (operator === 'array-contains') constraints.push(where(column, 'array-contains', value));
      });
    } else if (filters && filters.length > 0) {
      filters.forEach(f => {
        constraints.push(where(f.column, '==', f.value));
      });
    } else if (filter) {
      constraints.push(where(filter.column, '==', filter.value));
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const result = snapshot.docs.map(doc => mapper({ id: doc.id, ...doc.data() }));
      setCachedData(cacheKey, result);
      setData(result);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(`Firestore error fetching ${tableName}:`, err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tableName, cacheKey, skip, realtime, JSON.stringify(whereClauses), JSON.stringify(filters), filter?.column, filter?.value, order?.column, order?.ascending, order?.direction, limitCount, mapper, getCachedData, setCachedData]);

  return { data, loading, error, refresh: () => {} }; // refresh is no-op with onSnapshot
}
