import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palette, Plus, Search, Filter, Edit, Trash2, Sliders, RefreshCw, 
  ChevronRight, ChevronLeft, Check, Sparkles, ShoppingCart, Info, TrendingUp, AlertTriangle, 
  FileSpreadsheet, ArrowUpDown, Tag, Layers, CheckCircle, Package, ArrowRight, X, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { syncService } from '../../../services/syncService';
import { TutorialEngine } from '../../../ai-demo/Tutorial/TutorialEngine';
import { ModalStickyFooter } from './design-system/TailorDesignSystem';
import { 
  FABRIC_COLOR_PALETTE, 
  FABRIC_PATTERNS, 
  FABRIC_COLOR_FAMILIES, 
  findColorInfo, 
  FabricColor 
} from '../data/fabricColors';

interface Merchant {
  id: string;
  name: string;
  currency?: string;
}

export interface Tissu {
  id: string;
  name: string;
  category: string;
  quantity: number; // in meters
  minStock?: number; // seuil critique / réapprovisionnement
  price?: number; // per meter fallback
  pricePerMeter?: number; // selling price per meter
  costPricePerMeter?: number; // cost price per meter
  color?: string; // Couleur principale
  secondaryColor?: string; // Couleur secondaire
  pattern?: string; // Motif (Uni, Fleuri, Brodé, Bogolan, etc.)
  internalRef?: string; // Référence interne
  colorHex?: string; // Code couleur HEX
  supplier?: string;
  notes?: string;
  colorTheme?: string; // Tailwind color theme
  syncStatus?: 'pending' | 'synced';
  createdAt: string;
  updatedAt: string;
}

interface TailleurTissusManagerProps {
  merchant: Merchant;
}

const CATEGORIES = [
  'Bazin',
  'Wax',
  'Broderie',
  'Soie',
  'Linen (Lin)',
  'Coton',
  'Velours',
  'Satin',
  'Dentelle',
  'Jacquard',
  'Autre'
];

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto) {
    if (typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const COLOR_THEMES = [
  { name: 'none', bg: 'bg-slate-400', text: 'text-slate-500', hover: 'hover:bg-slate-50', border: 'border-slate-200', glow: 'shadow-slate-100' },
  { name: 'red', bg: 'bg-red-500', text: 'text-red-500', hover: 'hover:bg-red-50', border: 'border-red-100', glow: 'shadow-red-100' },
  { name: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', hover: 'hover:bg-orange-50', border: 'border-orange-100', glow: 'shadow-orange-100' },
  { name: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', hover: 'hover:bg-amber-50', border: 'border-amber-100', glow: 'shadow-amber-100' },
  { name: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', hover: 'hover:bg-emerald-50', border: 'border-emerald-100', glow: 'shadow-emerald-100' },
  { name: 'teal', bg: 'bg-teal-500', text: 'text-teal-500', hover: 'hover:bg-teal-50', border: 'border-teal-100', glow: 'shadow-teal-100' },
  { name: 'sky', bg: 'bg-sky-500', text: 'text-sky-500', hover: 'hover:bg-sky-50', border: 'border-sky-100', glow: 'shadow-sky-100' },
  { name: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', hover: 'hover:bg-blue-50', border: 'border-blue-100', glow: 'shadow-blue-100' },
  { name: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', hover: 'hover:bg-indigo-50', border: 'border-indigo-100', glow: 'shadow-indigo-100' },
  { name: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', hover: 'hover:bg-purple-50', border: 'border-purple-100', glow: 'shadow-purple-100' },
  { name: 'pink', bg: 'bg-pink-500', text: 'text-pink-500', hover: 'hover:bg-pink-50', border: 'border-pink-100', glow: 'shadow-pink-100' },
  { name: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', hover: 'hover:bg-rose-50', border: 'border-rose-100', glow: 'shadow-rose-100' },
];

interface FabricColorSelectorProps {
  currentColor?: string;
  currentColorHex?: string;
  secondaryColor?: string;
  onChangeColor: (colorName: string, colorHex: string) => void;
  onChangeSecondaryColor?: (secondaryColor: string) => void;
  onChangeHex?: (colorHex: string) => void;
  onChangeCustomName?: (colorName: string) => void;
}

const FabricColorSelector: React.FC<FabricColorSelectorProps> = ({
  currentColor = '',
  currentColorHex = '#50C878',
  secondaryColor = '',
  onChangeColor,
  onChangeSecondaryColor,
  onChangeHex,
  onChangeCustomName,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const categoryNavRef = React.useRef<HTMLDivElement>(null);

  // Scroll category bar left or right
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryNavRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryNavRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Wheel event for horizontal scrolling
  const handleCategoryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (categoryNavRef.current && e.deltaY !== 0) {
      categoryNavRef.current.scrollLeft += e.deltaY;
    }
  };

  // Filter swatches
  const filteredSwatches = useMemo(() => {
    return FABRIC_COLOR_PALETTE.filter(c => {
      const matchesFamily = selectedFamily === 'all' || c.family === selectedFamily;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || 
        c.name.toLowerCase().includes(q) || 
        c.family.toLowerCase().includes(q) || 
        c.hex.toLowerCase().includes(q);
      return matchesFamily && matchesQuery;
    });
  }, [selectedFamily, searchQuery]);

  // Active color lookup
  const activeColorInfo = useMemo(() => {
    return findColorInfo(currentColor);
  }, [currentColor]);

  const activeFamilyName = useMemo(() => {
    const famObj = FABRIC_COLOR_FAMILIES.find(f => f.id === activeColorInfo.family);
    return famObj ? famObj.name : 'Couture';
  }, [activeColorInfo]);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
      {/* Header & Active Selected Color Summary Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
        <div>
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            COULEUR PRINCIPALE *
          </label>
          <span className="text-[10px] text-violet-600 font-bold">Bibliothèque de Couleurs Couture</span>
        </div>

        {/* Selected Color Badge Preview */}
        <div 
          data-acom-id="textiles.form_color_main"
          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <span 
            className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
            style={{ backgroundColor: currentColorHex || activeColorInfo.hex || '#50C878' }}
          />
          <div className="min-w-0">
            <span className="block text-xs font-black text-slate-800 truncate">
              {currentColor || 'Non spécifiée'}
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="font-mono font-bold text-violet-700">
                {currentColorHex || activeColorInfo.hex}
              </span>
              {currentColor && (
                <span className="text-slate-400">• {activeFamilyName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Scroll Navigation Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          {/* Left Scroll Button */}
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-violet-600 transition cursor-pointer shrink-0 shadow-2xs"
            title="Défiler les catégories vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={categoryNavRef}
            onWheel={handleCategoryWheel}
            data-acom-id="textiles.form_color_categories"
            className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none scroll-smooth touch-pan-x"
          >
            {FABRIC_COLOR_FAMILIES.map(fam => {
              const isActive = selectedFamily === fam.id;
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={(e) => {
                    setSelectedFamily(fam.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xs' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {fam.name}
                </button>
              );
            })}
          </div>

          {/* Right Scroll Button */}
          <button
            type="button"
            onClick={() => scrollCategories('right')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-violet-600 transition cursor-pointer shrink-0 shadow-2xs"
            title="Défiler les catégories vers la droite"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative" data-acom-id="textiles.form_color_search">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="🔍 Rechercher une couleur (ex: Bleu Roi, Bordeaux, Ivoire, Noir...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200/90 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Color Swatches */}
      <div 
        data-acom-id="textiles.form_color_grid"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 max-h-52 sm:max-h-60 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200/90 shadow-2inner"
      >
        {filteredSwatches.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-slate-400 font-medium">
            Aucune couleur trouvée pour "{searchQuery}"
          </div>
        ) : (
          filteredSwatches.map((c, swatchIdx) => {
            const isSelected = currentColor.trim().toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.id}
                type="button"
                data-acom-id={`textiles.form_color_swatch_${swatchIdx}`}
                onClick={() => onChangeColor(c.name, c.hex)}
                title={`${c.name} (${c.hex}) - Famille: ${c.family}`}
                className={`relative p-1.5 rounded-xl border transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer text-center group focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                  isSelected 
                    ? 'bg-violet-50 border-violet-600 ring-2 ring-violet-500/20 shadow-xs' 
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span 
                    className="w-4 h-4 rounded-full border border-black/15 shadow-2xs group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.hex }}
                  />
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 bg-violet-600 text-white rounded-full p-0.5 shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className={`text-[10px] leading-tight font-bold truncate max-w-full ${
                  isSelected ? 'text-violet-950 font-black' : 'text-slate-700'
                }`}>
                  {c.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Manual Inputs: Custom Color Name, Hex Picker, Secondary Color */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Custom Name */}
        <div>
          <span className="block text-[10px] text-slate-500 font-bold mb-1">Nom personnalisé :</span>
          <input
            type="text"
            required
            data-acom-id="textiles.form_color_custom_name"
            placeholder="Ex: Bleu Nuit, Blanc Cassé, Violet Impérial..."
            value={currentColor}
            onChange={e => {
              const val = e.target.value;
              if (onChangeCustomName) {
                onChangeCustomName(val);
              } else {
                const found = findColorInfo(val);
                onChangeColor(val, found.hex !== '#94A3B8' ? found.hex : currentColorHex);
              }
            }}
            className="w-full px-3 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-violet-500/20 text-xs font-bold rounded-xl outline-none"
          />
        </div>

        {/* Hex Nuanceur */}
        <div>
          <span className="block text-[10px] text-slate-500 font-bold mb-1 font-mono">Nuanceur HEX :</span>
          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-slate-200" data-acom-id="textiles.form_color_hex">
            <input
              type="color"
              value={currentColorHex || '#50C878'}
              onChange={e => {
                if (onChangeHex) {
                  onChangeHex(e.target.value);
                } else {
                  onChangeColor(currentColor, e.target.value);
                }
              }}
              className="w-6 h-6 rounded-md border-0 cursor-pointer p-0 bg-transparent shrink-0"
            />
            <input
              type="text"
              value={currentColorHex || '#50C878'}
              onChange={e => {
                if (onChangeHex) {
                  onChangeHex(e.target.value);
                }
              }}
              className="w-full text-xs font-mono font-bold uppercase text-slate-700 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <span className="block text-[10px] text-slate-500 font-bold mb-1">Couleur 2 (Option) :</span>
          <input
            type="text"
            data-acom-id="textiles.form_color_secondary"
            placeholder="Ex: Doré, Argent..."
            value={secondaryColor}
            onChange={e => {
              if (onChangeSecondaryColor) {
                onChangeSecondaryColor(e.target.value);
              }
            }}
            className="w-full px-3 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-violet-500/20 text-xs font-semibold rounded-xl outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export const TailleurTissusManager = ({ merchant }: TailleurTissusManagerProps) => {
  const currency = merchant.currency || 'FCFA';

  const [tissus, setTissus] = useState<Tissu[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedColorFamily, setSelectedColorFamily] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'instock' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price' | 'newest'>('newest');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTissu, setCurrentTissu] = useState<Partial<Tissu> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [paletteFamilyFilter, setPaletteFamilyFilter] = useState<string>('all');

  const [dynamicCategories, setDynamicCategories] = useState<string[]>(CATEGORIES);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Sync with Firestore
  const triggerSync = async (force: boolean = false) => {
    setIsSyncing(true);
    try {
      await syncService.syncTailoringCollection(merchant.id, 'tissus', force);
      const saved = localStorage.getItem(`tailleur_tissus_${merchant.id}`);
      if (saved) {
        setTissus(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error syncing fabrics:', e);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  // Load Fabrics on mount / merchant change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tailleur_tissus_${merchant.id}`);
      if (saved) {
        setTissus(JSON.parse(saved));
      } else {
        setTissus([]);
      }
    } catch (e) {
      console.error('Error loading fabrics:', e);
    }
    triggerSync();
  }, [merchant.id]);

  // Sync dynamic category options based on existing fabrics
  useEffect(() => {
    if (tissus.length > 0) {
      const existingCats = tissus.map(t => t.category).filter(Boolean);
      const uniqueCats = Array.from(new Set([...CATEGORIES, ...existingCats]));
      setDynamicCategories(uniqueCats);
    } else {
      setDynamicCategories(CATEGORIES);
    }
  }, [tissus]);

  // Track Form Modal state with TutorialEngine
  useEffect(() => {
    if (isFormOpen) {
      TutorialEngine.onModalOpened('couture.tissu_modal');
    } else {
      TutorialEngine.onModalClosed('couture.tissu_modal');
    }
  }, [isFormOpen]);

  // Helper to save fabrics to state and localStorage
  const saveFabrics = (newFabrics: Tissu[]) => {
    setTissus(newFabrics);
    localStorage.setItem(`tailleur_tissus_${merchant.id}`, JSON.stringify(newFabrics));
  };

  // Generate beautiful pre-set sample fabrics to kickstart testing
  const handleGenerateSamples = () => {
    const samples: Tissu[] = [
      {
        id: generateUUID(),
        name: 'Wax Hollandais Premium - Fleurs de Mariage',
        category: 'Wax',
        quantity: 12.5,
        price: 4500,
        pricePerMeter: 4500,
        costPricePerMeter: 3000,
        color: 'Bleu nuit et doré',
        supplier: 'Marché Sandaga - Boutique Amy',
        notes: 'Motifs floraux dorés sur fond bleu nuit. Parfait pour les robes de mariée et complets traditionnels.',
        colorTheme: 'blue',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      },
      {
        id: generateUUID(),
        name: 'Bazin Riche Getzner Super VIP - Violet impérial',
        category: 'Bazin',
        quantity: 15,
        price: 9000,
        pricePerMeter: 9000,
        costPricePerMeter: 6500,
        color: 'Violet impérial',
        supplier: 'Maison du Bazin - Getzner Dakar',
        notes: 'Bazin de haute qualité, très rigide avec éclat intense. Destiné aux boubous de gala.',
        colorTheme: 'purple',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      },
      {
        id: generateUUID(),
        name: 'Linen Blanc Optique d\'Italie',
        category: 'Linen (Lin)',
        quantity: 8,
        price: 6500,
        pricePerMeter: 6500,
        costPricePerMeter: 4500,
        color: 'Blanc optique',
        supplier: 'Sandaga Tissus Import',
        notes: 'Pur lin respirant de qualité supérieure. Idéal pour les tuniques hommes de luxe et ensembles d\'été.',
        colorTheme: 'emerald',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      },
      {
        id: generateUUID(),
        name: 'Soie Italienne Fluide - Abstraite Orange/Or',
        category: 'Soie',
        quantity: 5.5,
        price: 8500,
        pricePerMeter: 8500,
        costPricePerMeter: 5500,
        color: 'Orange et doré',
        supplier: 'Grossiste Tissu Liberté 6',
        notes: 'Toucher ultra soyeux, drapé magnifique pour robes d\'été fluides ou écharpes de créateurs.',
        colorTheme: 'amber',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      },
      {
        id: generateUUID(),
        name: 'Wax Block Imprimé - Soleil d\'Afrique',
        category: 'Wax',
        quantity: 1.8,
        price: 3500,
        pricePerMeter: 3500,
        costPricePerMeter: 2200,
        color: 'Jaune et rouge',
        supplier: 'Marché Colobane',
        notes: 'Motif jaune et rouge très chaleureux. Stock presque épuisé.',
        colorTheme: 'rose',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      }
    ];

    const merged = [...tissus];
    samples.forEach(sample => {
      if (!merged.some(f => f.name.toLowerCase() === sample.name.toLowerCase())) {
        merged.push(sample);
      }
    });

    saveFabrics(merged);
    triggerAcomAlert('Exemples Générés', 'Exemples de tissus générés avec succès !', 'success', 'TISSUS');
    triggerSync(true);
  };

  // Submit Handler for Form (Add/Edit)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const category = isNewCategory ? newCategoryName.trim() : currentTissu?.category;
    if (!currentTissu?.name || !category) {
      toast.error('Veuillez renseigner le nom et la catégorie du tissu');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const pricePerMeter = Number(currentTissu.pricePerMeter) || Number(currentTissu.price) || 0;
      const costPricePerMeter = Number(currentTissu.costPricePerMeter) || 0;
      const price = pricePerMeter; // backward compatibility
      const quantity = Number(currentTissu.quantity) || 0;

      let updatedList: Tissu[];
      if (currentTissu.id) {
        // Edit
        updatedList = tissus.map(t => t.id === currentTissu.id 
          ? { 
              ...(currentTissu as Tissu), 
              category,
              price, 
              pricePerMeter,
              costPricePerMeter,
              quantity, 
              syncStatus: 'pending', 
              updatedAt: new Date().toISOString() 
            } 
          : t
        );
        triggerAcomAlert('Tissu Mis à Jour', 'Tissu mis à jour avec succès.', 'success', 'TISSUS');
      } else {
        // Add
        const newTissu: Tissu = {
          id: generateUUID(),
          name: currentTissu.name,
          category,
          quantity,
          price,
          pricePerMeter,
          costPricePerMeter,
          color: currentTissu.color || '',
          supplier: currentTissu.supplier || '',
          notes: currentTissu.notes || '',
          colorTheme: currentTissu.colorTheme || COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)].name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending'
        };
        updatedList = [...tissus, newTissu];
        triggerAcomAlert('Nouveau Tissu Enregistré', 'Nouveau tissu enregistré avec succès !', 'success', 'TISSUS');
      }

      saveFabrics(updatedList);
      setIsSuccess(true);

      setTimeout(() => {
        setIsFormOpen(false);
        setCurrentTissu(null);
        setIsNewCategory(false);
        setNewCategoryName('');
        setIsSuccess(false);
        setIsSubmitting(false);
      }, 500);

      triggerSync();
    } catch (err) {
      console.error('Error saving fabric:', err);
      toast.error("Impossible d'enregistrer le tissu");
      setIsSubmitting(false);
    }
  };

  // Delete Tissu
  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce tissu de votre stock ?')) {
      const updated = tissus.filter(t => t.id !== id);
      saveFabrics(updated);
      triggerAcomAlert('Tissu Supprimé', 'Tissu supprimé du stock avec succès.', 'success', 'TISSUS');
      triggerSync();
    }
  };

  // Adjust Quantity (+ or - meters)
  const handleAdjustQuantity = (id: string, amount: number) => {
    const updated = tissus.map(t => {
      if (t.id === id) {
        const newQty = Math.max(0, parseFloat((t.quantity + amount).toFixed(2)));
        return {
          ...t,
          quantity: newQty,
          syncStatus: 'pending' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    saveFabrics(updated);
    triggerAcomAlert('Quantité Mise à Jour', 'Quantité de tissu mise à jour avec succès.', 'success', 'TISSUS');
    triggerSync();
  };

  // Compute Stats
  const stats = useMemo(() => {
    const totalTypes = tissus.length;
    const totalMeters = tissus.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const totalCost = tissus.reduce((sum, t) => sum + ((t.quantity || 0) * (t.costPricePerMeter ?? 0)), 0);
    const totalValue = tissus.reduce((sum, t) => sum + ((t.quantity || 0) * (t.pricePerMeter ?? t.price ?? 0)), 0);
    const expectedProfit = totalValue - totalCost;
    const lowStockCount = tissus.filter(t => (t.quantity || 0) > 0 && (t.quantity || 0) <= 2).length;
    const outOfStockCount = tissus.filter(t => (t.quantity || 0) === 0).length;

    return {
      totalTypes,
      totalMeters: parseFloat(totalMeters.toFixed(1)),
      totalCost,
      totalValue,
      expectedProfit,
      lowStockCount,
      outOfStockCount
    };
  }, [tissus]);

  // Filter & Sort Fabrics
  const filteredTissus = useMemo(() => {
    return tissus
      .filter(t => {
        const query = search.toLowerCase().trim();
        const matchesSearch = !query || 
                              t.name.toLowerCase().includes(query) || 
                              (t.supplier && t.supplier.toLowerCase().includes(query)) ||
                              (t.color && t.color.toLowerCase().includes(query)) ||
                              (t.secondaryColor && t.secondaryColor.toLowerCase().includes(query)) ||
                              (t.pattern && t.pattern.toLowerCase().includes(query)) ||
                              (t.internalRef && t.internalRef.toLowerCase().includes(query)) ||
                              (t.notes && t.notes.toLowerCase().includes(query));
        
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

        const colorInfo = findColorInfo(t.color);
        const matchesColorFamily = selectedColorFamily === 'all' || colorInfo.family === selectedColorFamily;

        const matchesPattern = selectedPattern === 'all' || (t.pattern && t.pattern.toLowerCase() === selectedPattern.toLowerCase());

        const qty = t.quantity ?? 0;
        const matchesStock = 
          stockFilter === 'all' ? true :
          stockFilter === 'low' ? (qty > 0 && qty <= 2) :
          stockFilter === 'instock' ? (qty > 2) :
          stockFilter === 'out' ? (qty === 0) : true;

        return matchesSearch && matchesCategory && matchesColorFamily && matchesPattern && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'quantity') return (b.quantity ?? 0) - (a.quantity ?? 0);
        const priceA = a.pricePerMeter ?? a.price ?? 0;
        const priceB = b.pricePerMeter ?? b.price ?? 0;
        if (sortBy === 'price') return priceB - priceA;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(); // newest
      });
  }, [tissus, search, selectedCategory, selectedColorFamily, selectedPattern, stockFilter, sortBy]);

  // Update Tutorial Engine with state of Tissus page
  useEffect(() => {
    try {
      const firstTissu = filteredTissus[0];
      TutorialEngine.setTissusPageState({
        tissusCount: stats.totalTypes,
        totalMeters: stats.totalMeters,
        totalCost: stats.totalCost,
        expectedProfit: stats.expectedProfit,
        currency,
        searchQuery: search,
        selectedCategory,
        selectedColorFamily,
        selectedPattern,
        stockFilter,
        sortBy,
        firstTissu,
        allTissus: filteredTissus
      });
    } catch (err) {
      console.error('Error updating tutorial engine for tissues:', err);
    }
  }, [
    tissus,
    stats,
    currency,
    search,
    selectedCategory,
    selectedColorFamily,
    selectedPattern,
    stockFilter,
    sortBy,
    filteredTissus
  ]);

  return (
    <div className="w-full space-y-6" id="tailleur_tissus_container">
      {/* Header and Sync State */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Palette className="w-5 h-5" />
            </span>
            <h1 data-acom-id="textiles.title" className="text-xl md:text-2xl font-black font-sans tracking-tight text-slate-800">
              Gestion du Stock de Tissus & Wax
            </h1>
          </div>
          <p data-acom-id="textiles.description" className="text-sm text-slate-500 font-medium ml-1">
            Suivez vos métrages disponibles, gérez vos approvisionnements et déduisez automatiquement vos tissus lors des commandes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            data-acom-id="textiles.refresh_btn"
            onClick={() => triggerSync(true)}
            disabled={isSyncing}
            className={`p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${isSyncing ? 'opacity-80' : ''}`}
            title="Synchroniser maintenant"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isSyncing ? 'animate-spin text-violet-600' : ''}`} />
            {isSyncing ? 'Sync...' : 'Actualiser'}
          </button>

          <button
            data-acom-id="textiles.add_btn"
            onClick={() => {
              setCurrentTissu({
                name: '',
                category: 'Wax',
                quantity: 6,
                price: 4000,
                supplier: '',
                notes: '',
                colorTheme: COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)].name
              });
              setIsNewCategory(false);
              setNewCategoryName('');
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-100 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Tissu
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Varieties */}
        <div data-acom-id="textiles.stat_varieties" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-400 font-black tracking-wider uppercase">VARIÉTÉS</span>
            <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">{stats.totalTypes} modèles</span>
          </div>
        </div>

        {/* Total Stock */}
        <div data-acom-id="textiles.stat_global_stock" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-400 font-black tracking-wider uppercase">STOCK GLOBAL</span>
            <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">{stats.totalMeters} m</span>
          </div>
        </div>

        {/* Total Cost Value */}
        <div data-acom-id="textiles.stat_cost_value" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-400 font-black tracking-wider uppercase">VALEUR D'ACHAT (COÛT)</span>
            <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 font-mono">{stats.totalCost.toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* Profit Estimé */}
        <div data-acom-id="textiles.stat_estimated_profit" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-400 font-black tracking-wider uppercase">PROFIT ESTIMÉ</span>
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">+{stats.expectedProfit.toLocaleString()} {currency}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              data-acom-id="textiles.search_input"
              type="text"
              placeholder="Rechercher par nom, couleur (bleu, bordeaux...), motif (brodé...), réf, fournisseur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-violet-500/25 text-sm font-medium rounded-xl transition-all outline-none placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Controls on sorting/filtering */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              data-acom-id="textiles.filter_category"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              <option value="All" className="bg-white dark:bg-slate-900">Toutes catégories</option>
              {dynamicCategories.map(cat => (
                <option key={cat} value={cat} className="bg-white dark:bg-slate-900">{cat}</option>
              ))}
            </select>

            {/* Color Family Filter */}
            <select
              data-acom-id="textiles.filter_color"
              value={selectedColorFamily}
              onChange={e => setSelectedColorFamily(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              <option value="all" className="bg-white dark:bg-slate-900">Toutes les couleurs</option>
              {FABRIC_COLOR_FAMILIES.map(fam => (
                <option key={fam.id} value={fam.id} className="bg-white dark:bg-slate-900">{fam.name}</option>
              ))}
            </select>

            {/* Pattern Filter */}
            <select
              data-acom-id="textiles.filter_pattern"
              value={selectedPattern}
              onChange={e => setSelectedPattern(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              <option value="all" className="bg-white dark:bg-slate-900">Tous les motifs</option>
              {FABRIC_PATTERNS.map(pat => (
                <option key={pat.id} value={pat.name} className="bg-white dark:bg-slate-900">{pat.icon ? `${pat.icon} ` : ''}{pat.name}</option>
              ))}
            </select>

            {/* Stock Level Filter */}
            <select
              data-acom-id="textiles.filter_stock"
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as any)}
              className="bg-slate-50 border-0 text-xs font-bold py-2.5 px-3 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">Tous les stocks</option>
              <option value="instock">En stock (&gt; 2m)</option>
              <option value="low">Stock critique (&le; 2m)</option>
              <option value="out">Épuisé (0m)</option>
            </select>

            {/* Sorting */}
            <select
              data-acom-id="textiles.filter_sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border-0 text-xs font-bold py-2.5 px-3 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="newest">Plus récents</option>
              <option value="name">Nom alphabétique</option>
              <option value="quantity">Stock (Décroissant)</option>
              <option value="price">Prix (Décroissant)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid List */}
      {filteredTissus.length === 0 ? (
        <motion.div
          data-acom-id="textiles.empty_state"
          key="empty-tissus"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 text-center rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <Palette className="w-8 h-8" />
          </div>
          <div className="max-w-sm">
            <h3 className="text-base font-black text-slate-700 font-sans tracking-tight mb-1">
              Aucun tissu trouvé
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {tissus.length === 0 
                ? "Vous n'avez pas encore enregistré de tissus dans votre inventaire. Ajoutez-en un manuellement ou générez des exemples pour tester !"
                : "Aucun tissu ne correspond à vos filtres de recherche actuels. Réessayez avec d'autres critères de couleur ou de catégorie."}
            </p>
          </div>
          {tissus.length === 0 && (
            <button
              data-acom-id="textiles.generate_samples_btn"
              onClick={handleGenerateSamples}
              className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-black rounded-xl border border-violet-100 flex items-center gap-1.5 active:scale-95 transition-all mt-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Générer des exemples de tissus
            </button>
          )}
        </motion.div>
      ) : (
        <div data-acom-id="textiles.grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTissus.map((tissu, index) => {
            const colorInfo = findColorInfo(tissu.color);
            const matchedTheme = COLOR_THEMES.find(c => c.name === tissu.colorTheme) || COLOR_THEMES[0];
            const quantity = tissu.quantity ?? 0;
            const isCrit = quantity <= 2 && quantity > 0;
            const isOut = quantity === 0;

            const displayColor = tissu.color || 'Couleur non spécifiée';
            const displayHex = tissu.colorHex || colorInfo.hex;

            return (
              <div
                key={tissu.id}
                data-acom-id={`textiles.card_${index}`}
                className={`rounded-2xl border ${
                  isCrit ? 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20' : 
                  'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                } overflow-hidden shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all duration-200 flex flex-col group hover:scale-[1.01]`}
              >
                  {/* Fabric Banner Pattern Accent */}
                  <div className={`h-28 relative overflow-hidden ${matchedTheme.bg} flex items-end p-3.5 z-0`}>
                    {/* Background swatch preview if hex available */}
                    {displayHex && displayHex !== '#94A3B8' && (
                      <div 
                        className="absolute inset-0 opacity-40 z-0 transition-opacity group-hover:opacity-60" 
                        style={{ backgroundColor: displayHex }} 
                      />
                    )}
                    
                    {/* Gradient overlay to ensure solid text background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-black/20 z-0" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span 
                        data-acom-id={`textiles.card_category_${index}`}
                        className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/35 text-[9px] font-black tracking-widest text-white uppercase"
                      >
                        {tissu.category}
                      </span>
                      {tissu.internalRef && (
                        <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[9px] font-mono font-bold text-slate-200 flex items-center gap-0.5">
                          <Hash className="w-2.5 h-2.5" />
                          {tissu.internalRef}
                        </span>
                      )}
                    </div>

                    <div 
                      data-acom-id={`textiles.card_status_${index}`}
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 z-10 ${
                        tissu.syncStatus === 'pending' 
                          ? 'bg-amber-500/90 text-white animate-pulse' 
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      {tissu.syncStatus === 'pending' ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          En attente
                        </>
                      ) : (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          Synchronisé
                        </>
                      )}
                    </div>

                    <div className="text-white w-full flex items-center justify-between z-10">
                      <span 
                        data-acom-id={`textiles.card_price_${index}`}
                        className="font-mono text-xs font-black tracking-wider drop-shadow-sm bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20"
                      >
                        {(tissu.pricePerMeter ?? tissu.price ?? 0).toLocaleString()} {currency} /m
                      </span>

                      {/* Stock Quantity Badge on Header */}
                      <span 
                        data-acom-id={`textiles.card_qty_header_${index}`}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${
                          isOut ? 'bg-red-600 text-white' : isCrit ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {quantity} m
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      {/* Name */}
                      <div>
                        <h3 
                          data-acom-id={`textiles.card_name_${index}`}
                          className="text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors"
                        >
                          {tissu.name}
                        </h3>
                      </div>

                      {/* Color & Pattern Badge Row */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {/* Main Color Pill with Hex Circle */}
                        <div 
                          data-acom-id={`textiles.card_color_${index}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-inner flex-shrink-0" 
                            style={{ backgroundColor: displayHex }}
                          />
                          <span className="truncate max-w-[130px]">
                            {colorInfo.badgeEmoji} {displayColor}
                          </span>
                        </div>

                        {/* Secondary Color if exists */}
                        {tissu.secondaryColor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            + {tissu.secondaryColor}
                          </span>
                        )}

                        {/* Pattern Pill */}
                        {tissu.pattern && (
                          <span 
                            data-acom-id={`textiles.card_pattern_${index}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800"
                          >
                            🎨 {tissu.pattern}
                          </span>
                        )}
                      </div>

                      {/* Price breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                        <div data-acom-id={`textiles.card_cost_${index}`}>
                          <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">COÛT ACHAT</span>
                          <span className="font-mono font-black text-slate-800 dark:text-slate-100">{(tissu.costPricePerMeter ?? 0).toLocaleString()} {currency}/m</span>
                        </div>
                        <div data-acom-id={`textiles.card_sale_${index}`}>
                          <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">PRIX VENTE</span>
                          <span className="font-mono font-black text-violet-700 dark:text-violet-400">{(tissu.pricePerMeter ?? tissu.price ?? 0).toLocaleString()} {currency}/m</span>
                        </div>
                      </div>

                      {tissu.supplier && (
                        <p 
                          data-acom-id={`textiles.card_supplier_${index}`}
                          className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          Fournisseur : {tissu.supplier}
                        </p>
                      )}

                      {tissu.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 italic leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
                          &ldquo;{tissu.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Stock indicator and controls */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Métrage disponible :
                        </span>
                        <span className={`text-xs font-black ${isOut ? 'text-red-600 dark:text-red-400' : isCrit ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {quantity} m
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div 
                        data-acom-id={`textiles.card_progress_${index}`}
                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOut ? 'bg-red-500' : isCrit ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (quantity / 20) * 100)}%` }}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            data-acom-id={`textiles.card_edit_${index}`}
                            onClick={() => {
                              setCurrentTissu({ ...tissu });
                              setIsNewCategory(false);
                              setIsFormOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            data-acom-id={`textiles.card_delete_${index}`}
                            onClick={() => handleDelete(tissu.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          data-acom-id={`textiles.card_action_${index}`}
                          onClick={() => {
                            setCurrentTissu({ ...tissu });
                            setIsNewCategory(false);
                            setIsFormOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-violet-700 dark:hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-transparent dark:border-slate-700"
                        >
                          Ajuster stock
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {/* Fabric Drawer Form Dialog (Modal) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden text-left"
            >
              {/* Modal Header (Fixed) */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-violet-50/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-violet-100 text-violet-700 rounded-xl">
                    <Palette className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 
                      data-acom-id="textiles.modal_title"
                      className="text-base font-black text-slate-800 font-sans tracking-tight"
                    >
                      {currentTissu?.id ? 'Modifier le Tissu' : 'Enregistrer un nouveau Tissu en Stock'}
                    </h2>
                    <p 
                      data-acom-id="textiles.modal_description"
                      className="text-[11px] text-slate-500 font-medium"
                    >
                      {currentTissu?.id ? 'Ajustez les détails du coupon ou rouleau' : 'Remplissez la fiche technique du tissu'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-acom-id="textiles.modal_close"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form wrapping Scrollable Content + Sticky Footer */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Scrollable Form Body */}
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 pb-8">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      NOM DU TISSU / MODÈLE *
                    </label>
                    <input
                      type="text"
                      required
                      data-acom-id="textiles.form_name"
                      placeholder="Ex: Bazin Getzner VIP, Wax Hollandais Soleil, Lin Pur..."
                      value={currentTissu?.name || ''}
                      onChange={e => setCurrentTissu({ ...currentTissu, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">CATÉGORIE *</label>
                      {isNewCategory ? (
                        <div className="flex gap-1.5" data-acom-id="textiles.form_category">
                          <input
                            type="text"
                            required
                            placeholder="Ex: Brocart, Jacquard..."
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewCategory(false);
                              setNewCategoryName('');
                            }}
                            className="px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <select
                          data-acom-id="textiles.form_category"
                          value={currentTissu?.category || 'Bazin'}
                          onChange={e => {
                            if (e.target.value === 'ADD_NEW') {
                              setIsNewCategory(true);
                              setNewCategoryName('');
                            } else {
                              setCurrentTissu({ ...currentTissu, category: e.target.value });
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                        >
                          {dynamicCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="ADD_NEW" className="text-violet-600 font-bold">+ Nouvelle catégorie...</option>
                        </select>
                      )}
                    </div>

                    {/* Internal Ref */}
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                        RÉFÉRENCE INTERNE (ROULEAU)
                      </label>
                      <div className="relative" data-acom-id="textiles.form_internal_ref">
                        <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Ex: REF-BG-01, TIROIR-B"
                          value={currentTissu?.internalRef || ''}
                          onChange={e => setCurrentTissu({ ...currentTissu, internalRef: e.target.value })}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-mono font-semibold rounded-xl transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Main Color Selector Section */}
                  <FabricColorSelector
                    currentColor={currentTissu?.color || ''}
                    currentColorHex={currentTissu?.colorHex || '#50C878'}
                    secondaryColor={currentTissu?.secondaryColor || ''}
                    onChangeColor={(colorName, colorHex) => {
                      setCurrentTissu({
                        ...currentTissu,
                        color: colorName,
                        colorHex: colorHex
                      });
                    }}
                    onChangeSecondaryColor={(secColor) => {
                      setCurrentTissu({
                        ...currentTissu,
                        secondaryColor: secColor
                      });
                    }}
                    onChangeHex={(hex) => {
                      setCurrentTissu({
                        ...currentTissu,
                        colorHex: hex
                      });
                    }}
                    onChangeCustomName={(name) => {
                      const found = findColorInfo(name);
                      setCurrentTissu({
                        ...currentTissu,
                        color: name,
                        colorHex: found.hex !== '#94A3B8' ? found.hex : (currentTissu?.colorHex || '#50C878')
                      });
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pattern / Motif */}
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                        MOTIF / STYLE
                      </label>
                      <select
                        data-acom-id="textiles.form_pattern"
                        value={currentTissu?.pattern || 'Uni'}
                        onChange={e => setCurrentTissu({ ...currentTissu, pattern: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                      >
                        {FABRIC_PATTERNS.map(pat => (
                          <option key={pat.id} value={pat.name}>{pat.icon ? `${pat.icon} ` : ''}{pat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity & Min Stock */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                          QUANTITÉ (MÈTRES) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          data-acom-id="textiles.form_qty"
                          placeholder="Ex: 12.5"
                          value={currentTissu?.quantity ?? ''}
                          onChange={e => setCurrentTissu({ ...currentTissu, quantity: e.target.value === '' ? '' as any : Number(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-black text-violet-700 rounded-xl transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                          SEUIL ALERTE (MÈTRES)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          data-acom-id="textiles.form_alert_threshold"
                          placeholder="Ex: 5.0"
                          value={currentTissu?.minStock ?? ''}
                          onChange={e => setCurrentTissu({ ...currentTissu, minStock: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-amber-500/20 text-sm font-bold text-amber-700 rounded-xl transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Cost Price */}
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                        COÛT ACHAT / M ({currency}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        data-acom-id="textiles.form_cost_price"
                        placeholder="Ex: 3000"
                        value={currentTissu?.costPricePerMeter ?? currentTissu?.price ?? ''}
                        onChange={e => setCurrentTissu({ ...currentTissu, costPricePerMeter: e.target.value === '' ? '' as any : Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none font-mono"
                      />
                    </div>

                    {/* Selling Price */}
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                        PRIX VENTE CONSEILLÉ / M ({currency}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        data-acom-id="textiles.form_sale_price"
                        placeholder="Ex: 4500"
                        value={currentTissu?.pricePerMeter ?? currentTissu?.price ?? ''}
                        onChange={e => setCurrentTissu({ ...currentTissu, pricePerMeter: e.target.value === '' ? '' as any : Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      FOURNISSEUR / BOUTIQUE (OPTIONNEL)
                    </label>
                    <input
                      type="text"
                      data-acom-id="textiles.form_supplier"
                      placeholder="Ex: Maison Getzner Dakar, Boutique Amy Sandaga"
                      value={currentTissu?.supplier || ''}
                      onChange={e => setCurrentTissu({ ...currentTissu, supplier: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      NOTES & EMPLACEMENT D'ENTREPOSAGE
                    </label>
                    <textarea
                      rows={2}
                      data-acom-id="textiles.form_notes"
                      placeholder="Emplacement en atelier (ex: Étagère 3), texture, brillance..."
                      value={currentTissu?.notes || ''}
                      onChange={e => setCurrentTissu({ ...currentTissu, notes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-medium rounded-xl transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Sticky Modal Footer */}
                <ModalStickyFooter
                  onCancel={() => setIsFormOpen(false)}
                  cancelLabel="Annuler"
                  submitLabel={currentTissu?.id ? "Mettre à jour le Tissu" : "Enregistrer le Tissu"}
                  isSubmitting={isSubmitting}
                  isSuccess={isSuccess}
                  cancelButtonId="textiles.modal_cancel"
                  submitButtonId="textiles.modal_submit"
                  warningId="textiles.modal_warning"
                  disabled={!currentTissu?.name || currentTissu?.quantity === undefined || currentTissu?.quantity === null || currentTissu?.quantity === ('' as any)}
                  disabledReason={
                    !currentTissu?.name 
                      ? "Veuillez renseigner le nom du tissu" 
                      : (currentTissu?.quantity === undefined || currentTissu?.quantity === null || currentTissu?.quantity === ('' as any)
                          ? "Veuillez indiquer la quantité en stock" 
                          : undefined)
                  }
                />
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TailleurTissusManager;
