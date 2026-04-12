import { useMemo } from 'react';
import { 
  Sparkles, Star, LayoutGrid, FolderOpen, Contact2, Megaphone, Building2, Layout
} from 'lucide-react';
import { useFirestoreData } from './useFirestoreData';
import { INITIAL_CATEGORIES, Category as StudioCategory, Product, Variant } from '../constants/studioAcom';

const ICON_MAP: Record<string, any> = { 
  Sparkles, Star, LayoutGrid, FolderOpen, Contact2, Megaphone, Building2 
};

export function useStudioAcom(isOpen: boolean = true) {
  // 1. Fetch Categories
  const { data: dbCategories, loading: loadingCats } = useFirestoreData<any>({
    tableName: 'studio_acom_categories',
    realtime: true,
    skip: !isOpen,
    mapper: (cat: any) => {
      const initial = INITIAL_CATEGORIES.find(c => c.id === cat.id);
      
      // Determine icon name
      let iconName = 'LayoutGrid';
      if (typeof cat.icon === 'string') {
        iconName = cat.icon;
      } else if (cat.iconName) {
        iconName = cat.iconName;
      } else if (initial) {
        // Find the key in ICON_MAP that matches the initial icon component
        const entry = Object.entries(ICON_MAP).find(([_, comp]) => comp === initial.icon);
        if (entry) iconName = entry[0];
      }
      
      return {
        ...cat,
        id: cat.id,
        name: cat.name || initial?.name || 'Sans nom',
        sub: cat.sub || initial?.sub || '',
        iconName,
        icon: ICON_MAP[iconName] || Layout,
        color: cat.color || initial?.color || 'text-gray-600',
        coverImage: cat.cover_image || cat.coverImage || initial?.coverImage || ''
      };
    }
  });

  // 2. Fetch Products
  const { data: dbProducts, loading: loadingProds } = useFirestoreData<any>({
    tableName: 'studio_acom_products',
    realtime: true,
    skip: !isOpen,
    mapper: (p: any) => ({
      ...p,
      id: p.id,
      name: p.name || 'Produit sans nom',
      categoryId: p.category_id || p.categoryId,
      description: p.description || '',
      coverImage: p.cover_image || p.coverImage || '',
      userId: p.user_id || p.userId
    })
  });

  // 3. Fetch Variants
  const { data: dbVariants, loading: loadingVariants } = useFirestoreData<any>({
    tableName: 'variants',
    realtime: true,
    skip: !isOpen,
    mapper: (v: any) => ({
      ...v,
      id: v.id,
      productId: v.product_id || v.productId,
      name: v.name || 'Variante sans nom',
      size: v.size || '',
      price: Number(v.price) || 0,
      templateId: v.template_id || v.templateId || '',
      previewImage: v.preview_image || v.previewImage || '',
      minQuantity: v.min_quantity || v.minQuantity || 1,
      maxQuantity: v.max_quantity || v.maxQuantity || 1000,
      templateSvg: v.template_svg || v.templateSvg || '',
      format: v.format || 'landscape'
    })
  });

  // Merge everything
  const categories = useMemo(() => {
    // Start with system categories that are NOT in the DB
    const systemOnly = INITIAL_CATEGORIES.filter(sc => !dbCategories.find(dc => dc.id === sc.id));
    
    // Map system categories to the same format
    const mappedSystem = systemOnly.map(sc => ({
      ...sc,
      iconName: sc.icon?.name || 'LayoutGrid',
      icon: sc.icon,
      coverImage: sc.coverImage || ''
    }));

    const merged = [...mappedSystem, ...dbCategories].sort((a, b) => a.name.localeCompare(b.name));
    
    return merged;
  }, [dbCategories]);

  const products = useMemo(() => {
    return dbProducts.map(p => ({
      ...p,
      variants: dbVariants.filter(v => v.productId === p.id)
    }));
  }, [dbProducts, dbVariants]);

  return {
    categories,
    products,
    loading: loadingCats || loadingProds || loadingVariants,
    dbCategories,
    dbProducts,
    dbVariants
  };
}
