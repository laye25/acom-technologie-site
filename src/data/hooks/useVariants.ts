import { useState, useEffect } from 'react';
import { getVariantsByProduct } from '../services/variant.service';
import { Variant } from '../models/variant.model';

export function useVariants(productId: string) {
  const [data, setData] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    getVariantsByProduct(productId).then((variants) => {
      setData(variants);
      setLoading(false);
    });
  }, [productId]);

  return { data, loading };
}
