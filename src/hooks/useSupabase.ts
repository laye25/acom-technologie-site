import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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

export function useSupabaseData<T>({
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

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (skip) return;
    
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        if (!realtime) {
          setLoading(false);
          return;
        }
      }
    }

    const hasCache = !!getCachedData(cacheKey);

    try {
      // Only show loading if we don't have cache or it's a forced refresh
      if (!hasCache || forceRefresh) {
        setLoading(true);
      }
      let query: any = supabase.from(tableName).select('*');

      if (whereClauses && whereClauses.length > 0) {
        whereClauses.forEach(w => {
          let [column, operator, value] = w;
          // Convert camelCase to snake_case
          column = column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          
          if (operator === '==') query = query.eq(column, value);
          else if (operator === '!=') query = query.neq(column, value);
          else if (operator === '>') query = query.gt(column, value);
          else if (operator === '>=') query = query.gte(column, value);
          else if (operator === '<') query = query.lt(column, value);
          else if (operator === '<=') query = query.lte(column, value);
          else if (operator === 'in') query = query.in(column, value);
          else if (operator === 'array-contains') query = query.contains(column, [value]);
        });
      } else if (filters && filters.length > 0) {
        filters.forEach(f => {
          const col = f.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = query.eq(col, f.value);
        });
      } else if (filter) {
        const col = filter.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        query = query.eq(col, filter.value);
      }

      if (order) {
        const ascending = order.ascending ?? (order.direction === 'asc');
        const orderColumn = order.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        query = query.order(orderColumn, { ascending });
      }

      if (limitCount) {
        query = query.limit(limitCount);
      }

      const { data: result, error: err } = await query;
      
      if (err) {
        console.error(`Supabase error fetching ${tableName}:`, err);
        // Create a more descriptive error for the UI
        const enhancedError = new Error(JSON.stringify({
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code,
          tableName
        }));
        throw enhancedError;
      }

      const mappedResult = result.map(item => mapper(item));
      setCachedData(cacheKey, mappedResult);
      setData(mappedResult);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [
    tableName, 
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

    fetchData();

    if (realtime) {
      const channel = supabase
        .channel(`public:${tableName}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
          fetchData(true);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tableName, realtime, skip, fetchData]);

  return { data, loading, error, refresh: fetchData };
}
