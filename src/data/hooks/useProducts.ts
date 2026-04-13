import { useState, useEffect } from 'react';
import { getProductsByCategory } from '../services/product.service';
import { Product } from '../models/product.model';

export function useProducts(categoryId: string) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }
    getProductsByCategory(categoryId).then((products) => {
      setData(products);
      setLoading(false);
    });
  }, [categoryId]);

  return { data, loading };
}
