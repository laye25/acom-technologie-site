import { useState, useEffect } from 'react';
import { getCategories } from '../services/category.service';
import { Category } from '../models/category.model';

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((categories) => {
      setData(categories);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
