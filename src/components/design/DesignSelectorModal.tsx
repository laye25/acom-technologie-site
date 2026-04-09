import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Sparkles, PenTool, Contact2, Monitor, 
  Smartphone, Megaphone, Building2, ChevronRight, FolderOpen, LayoutGrid,
  Heart, Eye, Star, CreditCard, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../../hooks/useSupabase';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { supabase } from '../../lib/supabase';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, Category as StudioCategory, Product, Variant } from '../../constants/studioAcom';
import { OptimizedImage } from '../OptimizedImage';
import MultiVariantConfigurator from '../studio/MultiVariantConfigurator';

interface DesignSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (item: any) => void;
  initialDisplayMode?: 'products' | 'variants';
  initialViewStep?: ViewStep;
  initialSearchQuery?: string;
}

type ViewStep = 'categories' | 'products' | 'variants' | 'configurator';

const MiniPreview = ({ elements, bgColor }: { elements: any[], bgColor: string }) => {
  return (
    <div 
      className="relative w-full h-full overflow-hidden pointer-events-none" 
      style={{ backgroundColor: bgColor, containerType: 'inline-size' }}
    >
      {elements.map((el: any) => {
        // Ensure coordinates and dimensions are numbers
        const x = Number(el.x) || 0;
        const y = Number(el.y) || 0;
        const rotation = Number(el.rotation) || 0;
        const width = Number(el.width) || 0;
        const height = Number(el.height) || 0;
        const radius = Number(el.radius) || 0;
        const fontSize = Number(el.fontSize) || 16;

        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${(x / 600) * 100}%`,
          top: `${(y / 350) * 100}%`,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'top left',
          opacity: el.opacity !== undefined ? el.opacity : 1,
        };

        if (el.shadowColor) {
          style.filter = `drop-shadow(${el.shadowOffsetX || 0}px ${el.shadowOffsetY || 0}px ${el.shadowBlur || 0}px ${el.shadowColor})`;
        }

        if (el.type === 'text') {
          style.color = el.fill;
          style.fontSize = `${(fontSize / 600) * 100}cqi`;
          style.fontWeight = 'bold';
          style.whiteSpace = 'pre-wrap';
          style.lineHeight = '1';
          if (el.fontFamily) style.fontFamily = el.fontFamily;
          if (el.align) {
            style.textAlign = el.align;
          }
        } else if (el.type === 'shape' || el.type === 'circle') {
          style.backgroundColor = el.fill;
          style.width = width ? `${(width / 600) * 100}%` : (radius ? `${(radius * 2 / 600) * 100}%` : '10%');
          style.height = height ? `${(height / 350) * 100}%` : (radius ? `${(radius * 2 / 350) * 100}%` : '2%');
          if (el.type === 'circle') style.borderRadius = '50%';
        } else if (el.type === 'image') {
          style.width = `${(width || 100) / 600 * 100}%`;
          style.height = `${(height || 100) / 350 * 100}%`;
        } else if (el.type === 'path') {
          style.width = '100%';
          style.height = '100%';
          style.left = '0';
          style.top = '0';
        }

        return (
          <div key={el.id} style={style}>
            {el.type === 'text' && el.text}
            {el.type === 'image' && el.src && (
              <OptimizedImage src={el.src} alt="Design element" className="w-full h-full object-contain" />
            )}
            {el.type === 'path' && (
              <svg viewBox="0 0 600 350" className="w-full h-full overflow-visible">
                <path d={el.data} fill={el.fill} transform={`translate(${x}, ${y})`} />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface NavCategory {
  id: string;
  name: string;
  sub: string;
  icon: any;
  color: string;
  subs?: string[];
  coverImage?: string;
}

export const CATEGORIES: NavCategory[] = [
  { id: 'saved', name: 'Projets', sub: 'Vos créations enregistrées', icon: FolderOpen, color: 'text-purple-600' },
  { id: 'all', name: 'Tous les modèles', sub: 'Explorez toutes nos créations', icon: Sparkles, color: 'text-gray-600' },
  { id: 'favorites', name: 'Mes Favoris', sub: 'Vos modèles préférés', icon: Star, color: 'text-amber-500' },
  { id: 'categories', name: 'Toutes les catégories', sub: 'Parcourez par thématique', icon: LayoutGrid, color: 'text-blue-600' },
  { 
    id: 'print', 
    name: 'Papeterie & Bureautique', 
    sub: 'Carte de Visite, Papier En-tête A4, Enveloppe DL, Chemise à rabats', 
    icon: Contact2, 
    color: 'text-orange-500',
    subs: ['Carte de Visite', 'Papier En-tête A4', 'Enveloppe DL', 'Chemise à rabats'],
    coverImage: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'marketing', 
    name: 'Marketing & Publicité', 
    sub: 'Flyer A5, Dépliant 3 volets, Affiche événementielle, Brochure', 
    icon: Megaphone, 
    color: 'text-red-500',
    subs: ['Flyer A5', 'Dépliant 3 volets', 'Affiche événementielle', 'Brochure'],
    coverImage: 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'goodies', 
    name: 'Signalétique & Goodies', 
    sub: 'Roll-up de salon, Habillage de mug, Étiquette de produit, Bâche', 
    icon: Building2, 
    color: 'text-emerald-500',
    subs: ['Roll-up de salon', 'Habillage de mug', 'Étiquette de produit', 'Bâche'],
    coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800'
  },
];

const DynamicMockup = ({ type, id, size }: { type: string, id: string, size: string }) => {
  const isPortrait = size.includes('1080x1920') || size.includes('Portrait') || size.includes('210x297') || size.includes('148x210') || size.includes('40x60') || size.includes('85x200');
  const isSquare = size.includes('500x500') || size.includes('1080x1080') || size.includes('64x64');
  const isWide = size.includes('1920x600') || size.includes('1584x396') || size.includes('600x200') || size.includes('220x110');

  const getContainerClass = () => {
    if (isPortrait) return 'w-24 h-36';
    if (isSquare) return 'w-28 h-28';
    if (isWide) return 'w-44 h-16';
    return 'w-36 h-24'; // Default landscape
  };

  return (
    <div className={`relative flex items-center justify-center ${getContainerClass()}`}>
      {/* Stacked effect */}
      <div className="absolute top-1 left-1 w-full h-full bg-gray-200 rounded-sm shadow-sm" />
      <div className="absolute top-2 left-2 w-full h-full bg-gray-100 rounded-sm shadow-sm" />
      
      <div className="w-full h-full bg-[#4c1d95] flex flex-col p-3 relative rounded-sm shadow-md border border-white/20 z-10 overflow-hidden">
        {/* Decorative elements based on type */}
        <div className="w-full h-full flex flex-col">
          {/* Header area */}
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <div className="w-4 h-4 border-2 border-white/40 rounded-sm rotate-45 flex items-center justify-center">
                <div className="w-1 h-1 bg-white/60 rounded-full" />
              </div>
            </div>
            {isWide && <div className="w-12 h-1 bg-white/20 rounded-full mt-2" />}
          </div>

          {/* Content area */}
          <div className="space-y-1.5 flex-1">
            <div className="w-full h-1 bg-white/30 rounded-full" />
            <div className="w-2/3 h-1 bg-white/20 rounded-full" />
            {!isWide && <div className="w-1/2 h-1 bg-white/10 rounded-full" />}
            
            {isPortrait && (
              <div className="mt-4 space-y-1.5">
                <div className="w-full h-1 bg-white/10 rounded-full" />
                <div className="w-full h-1 bg-white/10 rounded-full" />
                <div className="w-3/4 h-1 bg-white/10 rounded-full" />
              </div>
            )}
          </div>

          {/* Bottom area */}
          <div className="mt-auto flex justify-between items-end">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
              <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
            </div>
            {isSquare && <div className="w-4 h-4 bg-white/10 rounded-full" />}
          </div>
        </div>

        {/* Specific overlays */}
        {id === 'brochure-3fold' && (
          <div className="absolute inset-0 flex">
            <div className="w-1/3 h-full border-r border-white/10" />
            <div className="w-1/3 h-full border-r border-white/10" />
          </div>
        )}
        {id === 'email-sig' && (
          <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-white/20" />
        )}
      </div>
    </div>
  );
};

const CATEGORY_COLORS = [
  { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-100', accent: 'bg-amber-400' },
  { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-100', accent: 'bg-purple-400' },
  { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-100', accent: 'bg-blue-400' },
  { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-100', accent: 'bg-rose-400' },
  { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-100', accent: 'bg-emerald-400' },
];

const getCategoryColor = (index: number) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

// Helper to optimize Supabase Storage images
const getOptimizedUrl = (url: string, width: number = 400) => {
  if (!url) return url;
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url.replace('/object/public/', `/render/image/public/`) + `?width=${width}&resize=contain&quality=80`;
  }
  return url;
};

const CategoryBanner = ({ category, onClick }: { category: NavCategory, onClick: () => void }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative h-48 rounded-3xl overflow-hidden cursor-pointer group shadow-lg"
    >
      {category.coverImage ? (
        <OptimizedImage 
          src={category.coverImage} 
          alt={category.name}
          width={800}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`p-2 rounded-xl bg-white/20 backdrop-blur-md ${category.color}`}>
            <category.icon className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-white">{category.name}</h3>
        </div>
        <p className="text-sm text-gray-200 font-medium line-clamp-1">{category.sub}</p>
      </div>
      
      <div className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-5 h-5 text-white" />
      </div>
    </motion.div>
  );
};

const CategorySkeleton = () => (
  <div className="h-48 rounded-3xl bg-gray-100 animate-pulse flex flex-col justify-end p-6 space-y-3">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200" />
      <div className="h-6 w-32 bg-gray-200 rounded-lg" />
    </div>
    <div className="h-4 w-full bg-gray-200 rounded-lg" />
  </div>
);

const TemplateSkeleton = ({ aspectClass }: { aspectClass: string }) => (
  <div className="w-full animate-pulse">
    <div className={`w-full ${aspectClass} bg-gray-100 rounded-2xl mb-4`} />
    <div className="h-4 w-3/4 bg-gray-100 rounded-lg mb-2" />
    <div className="h-3 w-1/2 bg-gray-50 rounded-lg" />
  </div>
);

const getAspectRatioClass = (size: string) => {
  const s = size.toLowerCase();
  if (s.includes('1080x1920') || s.includes('story') || s.includes('portrait') || s.includes('85x200')) return 'aspect-[9/16]';
  if (s.includes('1080x1080') || s.includes('500x500') || s.includes('64x64') || s.includes('square')) return 'aspect-square';
  if (s.includes('1920x600') || s.includes('banner') || s.includes('1584x396') || s.includes('600x200') || s.includes('220x110')) return 'aspect-[3/1]';
  if (s.includes('1280x720') || s.includes('16:9') || s.includes('presentation')) return 'aspect-video';
  if (s.includes('210x297') || s.includes('a4') || s.includes('148x210') || s.includes('a5') || s.includes('40x60')) return 'aspect-[1/1.414]';
  if (s.includes('3.5x2') || s.includes('business card') || s.includes('carte de visite')) return 'aspect-[3.5/2]';
  return 'aspect-[3.5/2]'; // Default
};

const TemplateCard = ({ 
  item, 
  onSelect, 
  onPreview, 
  isFavorite, 
  onToggleFavorite,
  type = 'product'
}: { 
  item: any, 
  onSelect: (t: any) => void,
  onPreview?: (t: any) => void,
  isFavorite?: boolean,
  onToggleFavorite?: (id: string) => void,
  type?: 'product' | 'variant'
}) => {
  const size = item.size || '';
  const aspectClass = getAspectRatioClass(size);
  const image = item.coverImage || item.previewImage || item.preview;
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group text-left w-full relative"
    >
      <div className={`w-full ${aspectClass} bg-[#f3f4f6] rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center transition-all group-hover:shadow-2xl group-hover:shadow-primary/10 border border-gray-100`}>
        {image ? (
          <OptimizedImage 
            src={image} 
            alt={item.name} 
            width={600}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <LayoutGrid className="w-12 h-12" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-4 space-y-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="w-full py-3 bg-white text-gray-900 rounded-xl text-sm font-black shadow-2xl border border-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-transform hover:bg-primary hover:text-white"
          >
            {type === 'product' ? 'Voir les variantes' : 'Choisir ce design'}
          </button>
          
          {onPreview && (
            <div className="flex items-center space-x-2 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform delay-75">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(item);
                }}
                className="flex-1 py-2.5 bg-white/90 backdrop-blur-md text-gray-900 rounded-lg text-[11px] font-black shadow-xl flex items-center justify-center space-x-2 hover:bg-white transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Aperçu</span>
              </button>
              
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className={`p-2.5 rounded-lg shadow-xl transition-all ${
                    isFavorite 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-white/90 backdrop-blur-md text-gray-400 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="px-1">
        <h4 className="font-black text-gray-900 text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h4>
        {size && (
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            {size}
          </p>
        )}
        {item.price && (
          <p className="text-sm font-black text-primary mt-1">
            À partir de {item.price}€
          </p>
        )}
      </div>
    </motion.div>
  );
};

const DesignSelectorModal: React.FC<DesignSelectorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  initialDisplayMode = 'products',
  initialViewStep = 'products',
  initialSearchQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewStep, setViewStep] = useState<ViewStep>(initialViewStep);
  const [displayMode, setDisplayMode] = useState<'products' | 'variants'>(initialDisplayMode);
  
  // Sync initial props when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDisplayMode(initialDisplayMode);
      setViewStep(initialViewStep);
      setSearchQuery(initialSearchQuery);
    }
  }, [isOpen, initialDisplayMode, initialViewStep, initialSearchQuery]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('acom_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Memoize mappers to prevent infinite re-fetching
  const categoryMapper = useCallback((cat: any) => {
    const initial = INITIAL_CATEGORIES.find(c => c.id === cat.id);
    const iconMap: { [key: string]: any } = { Sparkles, Star, LayoutGrid, FolderOpen, Contact2, Megaphone, Building2 };
    return {
      ...cat,
      icon: iconMap[cat.icon] || initial?.icon || Sparkles,
      color: cat.color || initial?.color || 'text-gray-600',
      coverImage: cat.cover_image || cat.coverImage
    };
  }, []);

  const productMapper = useCallback((prod: any) => ({
    ...prod,
    categoryId: prod.category_id || prod.categoryId,
    coverImage: prod.cover_image || prod.coverImage,
    userId: prod.user_id || prod.userId
  }), []);

  const variantMapper = useCallback((v: any) => ({
    ...v,
    productId: v.product_id,
    templateId: v.template_id,
    previewImage: v.preview_image,
    minQuantity: v.min_quantity,
    maxQuantity: v.max_quantity,
    templateSvg: v.template_svg
  }), []);

  // 1. Fetch Categories with Real-time
  const { data: dbCategories, loading: loadingCats } = useSupabaseData<StudioCategory>({
    tableName: 'studio_acom_categories',
    realtime: true,
    mapper: categoryMapper,
    skip: !isOpen,
    limit: 100
  });

  // 2. Fetch Products with Real-time
  const { data: dbProducts, loading: loadingProds } = useSupabaseData<Product>({
    tableName: 'studio_acom_products',
    realtime: true,
    mapper: productMapper,
    skip: !isOpen,
    limit: 500
  });

  // 3. Fetch Variants with Real-time
  const { data: dbVariants } = useSupabaseData<Variant>({
    tableName: 'variants',
    realtime: true,
    mapper: variantMapper,
    skip: !isOpen,
    limit: 1000
  });

  // Merge Products and Variants
  const allProducts = useMemo(() => {
    return dbProducts.map(p => ({
      ...p,
      variants: dbVariants.filter(v => v.productId === p.id)
    }));
  }, [dbProducts, dbVariants]);

  // Merge Categories (System + DB)
  const allCategories = useMemo(() => {
    const systemCats = CATEGORIES.filter(c => ['saved', 'all', 'favorites', 'categories'].includes(c.id));
    let merged = [...systemCats];

    if (dbCategories && dbCategories.length > 0) {
      dbCategories.forEach((cat: any) => {
        if (!merged.find(c => c.id === cat.id)) {
          merged.push(cat);
        }
      });
    } else if (!loadingCats) {
      // Only use INITIAL_CATEGORIES if DB is empty and we are not loading
      INITIAL_CATEGORIES.forEach(cat => {
        if (!merged.find(c => c.id === cat.id)) {
          merged.push(cat);
        }
      });
    }

    return merged;
  }, [dbCategories, loadingCats]);

  // Use the merged data
  const categories = allCategories;
  const loadingVariants = loadingCats || loadingProds;

  // Reset view when category changes
  React.useEffect(() => {
    if (activeCategory === 'categories') {
      setViewStep('categories');
    } else {
      setViewStep('products');
    }
    setDisplayMode('products');
  }, [activeCategory]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('acom_favorites', JSON.stringify(next));
      return next;
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const { data: userDesigns } = useSupabaseData<any>({
    tableName: 'designs',
    filter: { column: 'ownerId', value: user?.id },
    skip: !isOpen || !user || activeCategory !== 'saved',
    realtime: true,
    limit: 50
  });

  const selectedProduct = useMemo(() => 
    allProducts.find(p => p.id === selectedProductId) || null
  , [allProducts, selectedProductId]);

  const selectedVariant = useMemo(() => 
    selectedProduct?.variants.find(v => v.id === selectedVariantId) || null
  , [selectedProduct, selectedVariantId]);

  // Helper to optimize Supabase Storage images
  // (Moved to top level)

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all' || activeCategory === 'categories') {
      return matchesSearch;
    }
    
    return matchesSearch && p.categoryId === activeCategory;
  });

  const displayedItems = useMemo(() => {
    if (activeCategory === 'saved') {
      return userDesigns || [];
    }
    if (displayMode === 'products') {
      return filteredProducts;
    } else {
      // Flatten products to variants
      const variants: any[] = [];
      filteredProducts.forEach(p => {
        p.variants.forEach(v => {
          variants.push({ ...v, productId: p.id, productName: p.name });
        });
      });
      return variants;
    }
  }, [filteredProducts, displayMode]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setViewStep('variants');
  };

  const handleSelectVariant = (variant: any) => {
    if (onSelect) {
      const product = allProducts.find(p => p.variants.some(v => v.id === variant.id));
      onSelect({ ...variant, subCategory: product?.name });
      onClose();
      return;
    }
    
    const product = allProducts.find(p => p.variants.some(v => v.id === variant.id));
    if (product) {
      setSelectedProductId(product.id);
      setSelectedVariantId(variant.id);
      setViewStep('configurator');
    } else if (activeCategory === 'saved') {
      // For saved designs, go directly to editor
      navigate('/design-editor', { 
        state: { 
          design: variant,
          templateId: variant.id
        } 
      });
      onClose();
    }
  };

  const handlePersonalize = (variant: Variant) => {
    if (onSelect) {
      const product = allProducts.find(p => p.variants.some(v => v.id === variant.id));
      onSelect({ ...variant, subCategory: product?.name });
      onClose();
      return;
    }
    
    // Integration with Studio ACOM
    const params = new URLSearchParams({
      template_id: variant.templateId || variant.id,
      size: variant.size || '',
      color: variant.color || '',
      shape: variant.shape || '',
      format: variant.format || '',
      finish: variant.finish || ''
    });
    
    navigate(`/design-editor?${params.toString()}`, { 
      state: { 
        templateId: variant.templateId || variant.id,
        svgContent: variant.templateSvg,
        config: {
          size: variant.size,
          color: variant.color,
          format: variant.format,
          material: variant.finish,
          quantity: variant.minQuantity || 100 // Default to minQuantity or 100
        }
      } 
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-white overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full h-full flex flex-col md:flex-row"
          >
            {/* Sidebar gauche (Menu complet) */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col py-8 transform transition-transform duration-300 md:relative md:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
              <div className="px-8 mb-10 flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Studio ACOM</h1>
              </div>
              
              <div className="px-8 mb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Navigation</h3>
              </div>

              <div className="flex flex-col w-full px-4 space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center space-x-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                      activeCategory === cat.id 
                        ? 'bg-gray-50 text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <cat.icon className={`w-6 h-6 ${cat.color}`} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
              {/* Header */}
              <div className="p-4 md:p-6 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-0 z-20">
                {/* Bouton Hamburger pour mobile */}
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <div className="space-y-1.5">
                    <div className="w-6 h-0.5 bg-gray-900 rounded-full" />
                    <div className="w-6 h-0.5 bg-gray-900 rounded-full" />
                    <div className="w-6 h-0.5 bg-gray-900 rounded-full" />
                  </div>
                </button>

                <div className="flex-1 max-w-2xl relative">
                  <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-600 text-sm md:text-base"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextMode = displayMode === 'products' ? 'variants' : 'products';
                    setDisplayMode(nextMode);
                    // On force le passage à la vue "produits" (grille) pour voir le résultat du changement
                    setViewStep('products');
                  }}
                  className={`px-3 md:px-4 py-2 rounded-xl font-black text-[10px] md:text-sm transition-all shadow-sm border shrink-0 ${
                    displayMode === 'variants' 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  } whitespace-nowrap`}
                >
                  {displayMode === 'products' ? 'Voir les variantes' : 'Voir les produits'}
                </button>
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full shrink-0">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {viewStep === 'configurator' && selectedProduct ? (
                  <MultiVariantConfigurator 
                    product={selectedProduct}
                    initialVariantId={selectedVariantId || undefined}
                    onPersonalize={handlePersonalize}
                  />
                ) : viewStep === 'variants' && selectedProduct ? (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <button 
                          onClick={() => setViewStep('products')}
                          className="flex items-center space-x-2 text-gray-400 hover:text-gray-900 font-bold text-sm mb-2 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          <span>Retour aux produits</span>
                        </button>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                          Variantes pour {selectedProduct.name}
                        </h2>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {selectedProduct.variants.map((variant) => (
                        <TemplateCard 
                          key={variant.id}
                          item={variant}
                          onSelect={handleSelectVariant}
                          type="variant"
                        />
                      ))}
                    </div>
                  </div>
                ) : activeCategory === 'categories' || (activeCategory === 'all' && viewStep === 'categories') ? (
                  <div className="p-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Toutes les catégories</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loadingVariants && categories.length <= 4 ? (
                        [1, 2, 3, 4, 5, 6].map(i => <CategorySkeleton key={i} />)
                      ) : (
                        categories.filter(c => !['all', 'favorites', 'categories', 'saved'].includes(c.id)).map((cat) => (
                          <CategoryBanner 
                            key={cat.id}
                            category={cat}
                            onClick={() => {
                              setActiveCategory(cat.id);
                              setViewStep('products');
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">
                      {activeCategory === 'all' ? 'Explorer les modèles' : 
                       activeCategory === 'favorites' ? 'Mes Favoris' :
                       activeCategory === 'saved' ? 'Projets' :
                       categories.find(c => c.id === activeCategory)?.name || 'Modèles'}
                    </h2>
                    
                    {/* Si on a une recherche ou si on est dans une catégorie spécifique, on affiche la grille plate */}
                    {(searchQuery || activeCategory !== 'all') ? (
                      loadingVariants && displayedItems.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <TemplateSkeleton key={i} aspectClass="aspect-[3.5/2]" />)}
                        </div>
                      ) : displayedItems.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                          {displayedItems.map((item) => (
                            <TemplateCard 
                              key={item.id}
                              item={item}
                              onSelect={(activeCategory === 'saved' || displayMode === 'variants') ? handleSelectVariant : handleSelectProduct}
                              type={(activeCategory === 'saved' || displayMode === 'variants') ? 'variant' : 'product'}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                            <LayoutGrid className="w-8 h-8 text-gray-300" />
                          </div>
                          <h3 className="text-lg font-black text-gray-900 mb-1">Aucun modèle trouvé</h3>
                          <p className="text-sm text-gray-500 font-medium">Essayez une autre recherche ou catégorie</p>
                        </div>
                      )
                    ) : (
                      /* Vue par défaut (Toutes les catégories) : on affiche par sections de catégories */
                      <div className="space-y-16 pb-20">
                        {loadingVariants && allProducts.length === 0 ? (
                          <div className="space-y-16">
                            {[1, 2].map(section => (
                              <div key={section}>
                                <div className="h-8 w-48 bg-gray-100 animate-pulse rounded-lg mb-8" />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                  {[1, 2, 3, 4].map(i => <TemplateSkeleton key={i} aspectClass="aspect-[3.5/2]" />)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : allProducts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
                              <Sparkles className="w-10 h-10 text-primary/30" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Studio ACOM en préparation</h3>
                            <p className="text-gray-500 font-bold max-w-md text-center px-8">
                              Nos modèles de production sont en cours de déploiement. Revenez très bientôt pour découvrir nos designs exclusifs.
                            </p>
                          </div>
                        ) : (
                          categories.filter(c => !['all', 'favorites', 'categories', 'saved'].includes(c.id)).map((category) => {
                            const categoryItems = displayMode === 'products'
                              ? allProducts.filter(p => p.categoryId === category.id).slice(0, 4)
                              : allProducts.filter(p => p.categoryId === category.id).flatMap(p => p.variants).slice(0, 8);
                            
                            if (categoryItems.length === 0) return null;
                            
                            return (
                              <div key={category.id}>
                                <div className="flex items-center justify-between mb-8">
                                  <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{category.name}</h2>
                                    <p className="text-sm font-bold text-gray-500">
                                      {displayMode === 'products' 
                                        ? `Découvrez nos produits de ${category.name.toLowerCase()}`
                                        : `Découvrez nos designs de ${category.name.toLowerCase()}`}
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => setActiveCategory(category.id)}
                                    className="flex items-center space-x-2 text-primary font-black text-sm hover:translate-x-1 transition-transform"
                                  >
                                    <span>Voir tout</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                  {categoryItems.map(item => (
                                    <TemplateCard 
                                      key={item.id} 
                                      item={item} 
                                      onSelect={displayMode === 'products' ? handleSelectProduct : handleSelectVariant}
                                      type={displayMode === 'products' ? 'product' : 'variant'}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Enlarged Preview Overlay */}
          <AnimatePresence>
            {previewTemplate && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreviewTemplate(null)}
                  className="absolute inset-0 bg-gray-900/90 backdrop-blur-xl"
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  className="relative bg-white w-full max-w-5xl h-full max-h-[95vh] md:max-h-[90vh] rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
                >
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="absolute top-4 right-4 md:top-8 md:right-8 z-10 p-2 md:p-3 bg-white/80 backdrop-blur-md text-gray-900 rounded-full shadow-lg hover:bg-gray-200 transition-all"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  <div className="flex-1 bg-gray-50 p-6 md:p-12 flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-0">
                    <div className={`w-full h-full max-w-2xl max-h-full flex items-center justify-center`}>
                      <div className={`w-full shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden bg-white ${getAspectRatioClass(previewTemplate.size)}`}>
                        {previewTemplate.coverImage ? (
                          <OptimizedImage 
                            src={previewTemplate.coverImage} 
                            alt={previewTemplate.name} 
                            width={800}
                            className="w-full h-full object-cover"
                          />
                        ) : previewTemplate.design ? (
                          <MiniPreview 
                            elements={previewTemplate.design.sides?.front?.elements || previewTemplate.design.elements || []} 
                            bgColor={previewTemplate.design.sides?.front?.bgColor || previewTemplate.design.bgColor || '#ffffff'} 
                          />
                        ) : (
                          <div className="scale-150">
                            <DynamicMockup type={previewTemplate.type} id={previewTemplate.id} size={previewTemplate.size} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-96 p-6 md:p-12 flex flex-col justify-center overflow-y-auto">
                    <div className="mb-6 md:mb-8">
                      <div className="flex items-center space-x-2 mb-3 md:mb-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full">
                          Modèle Officiel
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full">
                          {previewTemplate.size}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter mb-3 md:mb-4 leading-none">
                        {previewTemplate.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 font-bold leading-relaxed">
                        Ce modèle a été conçu pour offrir un rendu professionnel immédiat. Personnalisez les textes, les couleurs et les images pour l'adapter à votre marque.
                      </p>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <button
                        onClick={() => handleSelectProduct(previewTemplate)}
                        className="w-full py-4 md:py-5 bg-gray-900 text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20"
                      >
                        Voir les variantes
                      </button>
                      
                      <button
                        onClick={() => toggleFavorite(previewTemplate.id)}
                        className={`w-full py-5 border-2 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 ${
                          favorites.includes(previewTemplate.id)
                            ? 'border-rose-500 bg-rose-50 text-rose-500'
                            : 'border-gray-100 bg-white text-gray-900 hover:border-gray-200'
                        }`}
                      >
                        <Heart className={`w-6 h-6 ${favorites.includes(previewTemplate.id) ? 'fill-current' : ''}`} />
                        <span>{favorites.includes(previewTemplate.id) ? 'Dans vos favoris' : 'Ajouter aux favoris'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DesignSelectorModal;
