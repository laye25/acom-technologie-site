import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palette, Plus, Search, Filter, Edit, Trash2, Sliders, RefreshCw, 
  ChevronRight, Sparkles, ShoppingCart, Info, TrendingUp, AlertTriangle, 
  FileSpreadsheet, ArrowUpDown, Tag, Layers, CheckCircle, Package, ArrowRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { syncService } from '../services/syncService';

interface Merchant {
  id: string;
  name: string;
  currency?: string;
}

interface Tissu {
  id: string;
  name: string;
  category: string;
  quantity: number; // in meters
  price?: number; // per meter fallback
  pricePerMeter?: number; // selling price per meter
  costPricePerMeter?: number; // cost price per meter
  color?: string; // custom color/motif name
  supplier?: string;
  notes?: string;
  colorTheme?: string; // Tailwind color name like 'amber', 'purple', 'emerald', 'blue', 'rose', 'indigo'
  syncStatus?: 'pending' | 'synced';
  createdAt: string;
  updatedAt: string;
}

interface TailleurTissusManagerProps {
  merchant: Merchant;
}

const CATEGORIES = [
  'Wax',
  'Bazin',
  'Broderie',
  'Soie',
  'Linen (Lin)',
  'Coton',
  'Velours',
  'Satin',
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

export const TailleurTissusManager = ({ merchant }: TailleurTissusManagerProps) => {
  const currency = merchant.currency || 'FCFA';

  const [tissus, setTissus] = useState<Tissu[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'instock' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price' | 'newest'>('newest');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTissu, setCurrentTissu] = useState<Partial<Tissu> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
    toast.success('Exemples de tissus générés avec succès !');
    triggerSync(true);
  };

  // Submit Handler for Form (Add/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = isNewCategory ? newCategoryName.trim() : currentTissu?.category;
    if (!currentTissu?.name || !category) {
      toast.error('Veuillez renseigner le nom et la catégorie du tissu');
      return;
    }

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
      toast.success('Tissu mis à jour avec succès');
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
      toast.success('Nouveau tissu enregistré');
    }

    saveFabrics(updatedList);
    setIsFormOpen(false);
    setCurrentTissu(null);
    setIsNewCategory(false);
    setNewCategoryName('');
    triggerSync();
  };

  // Delete Tissu
  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce tissu de votre stock ?')) {
      const updated = tissus.filter(t => t.id !== id);
      saveFabrics(updated);
      toast.success('Tissu supprimé du stock');
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
    toast.success('Quantité mise à jour');
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
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                              (t.supplier && t.supplier.toLowerCase().includes(search.toLowerCase())) ||
                              (t.color && t.color.toLowerCase().includes(search.toLowerCase())) ||
                              (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

        const qty = t.quantity ?? 0;
        const matchesStock = 
          stockFilter === 'all' ? true :
          stockFilter === 'low' ? (qty > 0 && qty <= 2) :
          stockFilter === 'instock' ? (qty > 2) :
          stockFilter === 'out' ? (qty === 0) : true;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'quantity') return (b.quantity ?? 0) - (a.quantity ?? 0);
        const priceA = a.pricePerMeter ?? a.price ?? 0;
        const priceB = b.pricePerMeter ?? b.price ?? 0;
        if (sortBy === 'price') return priceB - priceA;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(); // newest
      });
  }, [tissus, search, selectedCategory, stockFilter, sortBy]);

  return (
    <div className="w-full space-y-6" id="tailleur_tissus_container">
      {/* Header and Sync State */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black font-sans tracking-tight text-slate-800">
              Gestion du Stock de Tissus & Wax
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-1">
            Suivez vos métrages disponibles, gérez vos approvisionnements et déduisez automatiquement vos tissus lors des commandes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => triggerSync(true)}
            disabled={isSyncing}
            className={`p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${isSyncing ? 'opacity-80' : ''}`}
            title="Synchroniser maintenant"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isSyncing ? 'animate-spin text-violet-600' : ''}`} />
            {isSyncing ? 'Sync...' : 'Actualiser'}
          </button>

          <button
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
        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black tracking-wider uppercase">VARIÉTÉS</span>
            <span className="text-sm sm:text-base font-black text-slate-800">{stats.totalTypes} modèles</span>
          </div>
        </div>

        {/* Total Stock */}
        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black tracking-wider uppercase">STOCK GLOBAL</span>
            <span className="text-sm sm:text-base font-black text-slate-800">{stats.totalMeters} m</span>
          </div>
        </div>

        {/* Total Cost Value */}
        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black tracking-wider uppercase">VALEUR D'ACHAT (COÛT)</span>
            <span className="text-sm sm:text-base font-black text-slate-800 font-mono">{stats.totalCost.toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* Profit Estimé */}
        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black tracking-wider uppercase">PROFIT ESTIMÉ</span>
            <span className="text-sm sm:text-base font-black text-emerald-600 font-mono">+{stats.expectedProfit.toLocaleString()} {currency}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de tissu, fournisseur, couleur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-medium rounded-xl transition-all outline-none"
            />
          </div>

          {/* Controls on sorting/filtering */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border-0 text-xs font-bold py-2.5 px-3.5 rounded-xl text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="All">Toutes catégories</option>
              {dynamicCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Stock Level Filter */}
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as any)}
              className="bg-slate-50 border-0 text-xs font-bold py-2.5 px-3.5 rounded-xl text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">Tous les stocks</option>
              <option value="instock">En stock (&gt; 2m)</option>
              <option value="low">Stock critique (&le; 2m)</option>
              <option value="out">Épuisé (0m)</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border-0 text-xs font-bold py-2.5 px-3.5 rounded-xl text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="newest">Plus récent d'abord</option>
              <option value="name">Nom alphabétique</option>
              <option value="quantity">Quantité (Décroissant)</option>
              <option value="price">Prix (Décroissant)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid List */}
      {filteredTissus.length === 0 ? (
        <motion.div
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
                : "Aucun tissu ne correspond à vos filtres de recherche actuels. Réessayez avec d'autres critères."}
            </p>
          </div>
          {tissus.length === 0 && (
            <button
              onClick={handleGenerateSamples}
              className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-black rounded-xl border border-violet-100 flex items-center gap-1.5 active:scale-95 transition-all mt-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Générer des exemples de tissus
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTissus.map(tissu => {
            const matchedTheme = COLOR_THEMES.find(c => c.name === tissu.colorTheme) || COLOR_THEMES[0];
            const quantity = tissu.quantity ?? 0;
            const isCrit = quantity <= 2 && quantity > 0;
            const isOut = quantity === 0;

            return (
              <div
                key={tissu.id}
                className={`rounded-2xl border ${isCrit ? 'border-amber-300 bg-amber-50' : isOut ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'} overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col group hover:scale-[1.01]`}
              >
                  {/* Fabric Banner Pattern Accent */}
                  <div className={`h-24 relative overflow-hidden ${matchedTheme.bg} flex items-end p-3 z-0`}>
                    {/* Gradient overlay to ensure solid text background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/15 z-0" />
                    
                    {/* Abstract design vector simulation */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay z-0">
                      <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-white transform -translate-x-6 -translate-y-6"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full border-8 border-white transform translate-x-10 translate-y-10"></div>
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white transform rotate-12"></div>
                      <div className="absolute inset-y-0 left-1/3 w-0.5 bg-white transform -rotate-45"></div>
                    </div>

                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/35 text-[9px] font-black tracking-widest text-white uppercase z-10">
                      {tissu.category}
                    </div>

                    {tissu.syncStatus === 'pending' && (
                      <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-amber-500/90 text-white text-[9px] font-bold flex items-center gap-1 z-10">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        En attente
                      </div>
                    )}

                    <div className="text-white w-full flex items-center justify-between z-10">
                      <span className="font-mono text-xs font-black tracking-wider drop-shadow-sm bg-black/15 px-2 py-0.5 rounded-md">
                        {(tissu.pricePerMeter ?? tissu.price ?? 0).toLocaleString()} {currency} /m
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-violet-700 transition-colors">
                          {tissu.name}
                        </h3>
                        {tissu.color && (
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            Couleur / Motif : {tissu.color}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <div>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">REV_COÛT</span>
                          <span className="font-mono font-black text-slate-900">{(tissu.costPricePerMeter ?? 0).toLocaleString()} {currency}/m</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">VENTE_CONSEILLÉ</span>
                          <span className="font-mono font-black text-violet-700">{(tissu.pricePerMeter ?? tissu.price ?? 0).toLocaleString()} {currency}/m</span>
                        </div>
                      </div>

                      {tissu.supplier && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3 text-slate-500" />
                          Fournisseur : {tissu.supplier}
                        </p>
                      )}

                      {tissu.notes && (
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 italic leading-relaxed pt-1 border-t border-slate-100">
                          &ldquo;{tissu.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Stock indicator and controls */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 block font-black uppercase tracking-widest">STOCK DISPONIBLE</span>
                          <span className={`text-base font-black ${isOut ? 'text-red-600' : isCrit ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {quantity} mètre{quantity > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Quick stock adjustment buttons */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => handleAdjustQuantity(tissu.id, -1)}
                            disabled={quantity <= 0}
                            className="w-7 h-7 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-black rounded-lg text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm border border-slate-200/50"
                            title="Retirer 1 mètre"
                          >
                            -1m
                          </button>
                          <button
                            onClick={() => handleAdjustQuantity(tissu.id, 1)}
                            className="w-7 h-7 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-lg text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm border border-slate-200/50"
                            title="Ajouter 1 mètre"
                          >
                            +1m
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar of Stock Level */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isOut ? 'bg-red-500' : isCrit ? 'bg-amber-500' : 'bg-emerald-600'}`}
                          style={{ width: `${Math.min(100, (quantity / 20) * 100)}%` }}
                        ></div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] text-slate-400 font-mono">
                          Màj {new Date(tissu.updatedAt).toLocaleDateString('fr-FR')}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCurrentTissu(tissu);
                              setIsNewCategory(false);
                              setNewCategoryName('');
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tissu.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-violet-50/40">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-violet-600" />
                  <h2 className="text-base font-black text-slate-800 font-sans tracking-tight">
                    {currentTissu?.id ? 'Modifier le Tissu' : 'Enregistrer un nouveau Tissu'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-slate-150 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">NOM DU TISSU / MOTIF</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Wax Hollandais Motif Soleil d'Afrique"
                    value={currentTissu?.name || ''}
                    onChange={e => setCurrentTissu({ ...currentTissu, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">CATÉGORIE</label>
                    {isNewCategory ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          placeholder="Ex: Satin de soie, Brocart..."
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
                        value={currentTissu?.category || 'Wax'}
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

                  {/* Color theme visual representation */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 font-sans">THÈME VISUEL</label>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {COLOR_THEMES.map(theme => {
                        const isNone = theme.name === 'none';
                        const isSelected = currentTissu?.colorTheme === theme.name || (!currentTissu?.colorTheme && isNone);
                        return (
                          <button
                            key={theme.name}
                            type="button"
                            onClick={() => setCurrentTissu({ ...currentTissu, colorTheme: theme.name })}
                            className={`w-6 h-6 rounded-full relative overflow-hidden flex items-center justify-center border-2 ${
                              isSelected ? 'border-slate-800 scale-115 shadow-md shadow-black/15 z-10' : 'border-transparent hover:scale-110'
                            } transition-all`}
                            title={isNone ? 'Aucun thème (Gris neutre)' : `Thème ${theme.name}`}
                          >
                            {isNone ? (
                              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                                {/* Diagonal red slash representing "None" */}
                                <div className="w-full h-0.5 bg-red-500/80 transform rotate-45 absolute"></div>
                                <span className="text-[8px] font-bold text-slate-500 absolute">Ø</span>
                              </div>
                            ) : (
                              <div className={`w-full h-full ${theme.bg}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Color / Pattern */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">COULEUR / MOTIF</label>
                    <input
                      type="text"
                      placeholder="Ex: Bleu indigo, Doré..."
                      value={currentTissu?.color || ''}
                      onChange={e => setCurrentTissu({ ...currentTissu, color: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">QUANTITÉ (MÈTRES) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="Ex: 6"
                      value={currentTissu?.quantity ?? ''}
                      onChange={e => setCurrentTissu({ ...currentTissu, quantity: e.target.value === '' ? '' as any : Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cost Price */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 font-mono">PRIX DE REVIENT / M ({currency}) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Ex: 3000"
                      value={currentTissu?.costPricePerMeter ?? currentTissu?.price ?? ''}
                      onChange={e => setCurrentTissu({ ...currentTissu, costPricePerMeter: e.target.value === '' ? '' as any : Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none font-mono"
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 font-mono">PRIX CONSEILLÉ / M ({currency}) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Ex: 4500"
                      value={currentTissu?.pricePerMeter ?? currentTissu?.price ?? ''}
                      onChange={e => setCurrentTissu({ ...currentTissu, pricePerMeter: e.target.value === '' ? '' as any : Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">FOURNISSEUR (OPTIONNEL)</label>
                  <input
                    type="text"
                    placeholder="Ex: Boutique Amy, Marché Sandaga"
                    value={currentTissu?.supplier || ''}
                    onChange={e => setCurrentTissu({ ...currentTissu, supplier: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">NOTES / DESCRIPTION DU MOTIF</label>
                  <textarea
                    rows={3}
                    placeholder="Couleurs principales, rangement (ex: Tiroir B), spécificités d'entretien..."
                    value={currentTissu?.notes || ''}
                    onChange={e => setCurrentTissu({ ...currentTissu, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-sm font-semibold rounded-xl transition-all outline-none resize-none"
                  />
                </div>

                {/* Save controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-100 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TailleurTissusManager;
