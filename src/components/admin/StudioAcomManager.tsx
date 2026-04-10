import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, Image as ImageIcon, 
  Layout, Save, X, Sparkles, Star, LayoutGrid, Check,
  FolderOpen, Contact2, Megaphone, Building2, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSupabaseData } from '../../hooks/useSupabase';
import { dbService } from '../../services/dbService';
import { Category as StudioCategory, Product, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../../constants/studioAcom';
import { supabase } from '../../lib/supabase';
import { OptimizedImage } from '../OptimizedImage';
import { db } from '../../db/db';
import { syncService } from '../../services/syncService';
import { Category as MerchantCategory } from '../../types';

const StudioAcomManager = () => {
  console.log('StudioAcomManager rendering');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categories, setCategories] = useState<StudioCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const refreshCats = async () => {
    const cats = await db.categories.toArray();
    setCategories(cats.map(c => ({
      ...c,
      sub: (c as any).sub || '',
      icon: (c as any).icon || FolderOpen,
      color: (c as any).color || 'text-primary'
    })) as StudioCategory[]);
  };

  // Charger les catégories depuis Dexie au montage
  React.useEffect(() => {
    const loadCategories = async () => {
      setLoadingCats(true);
      try {
        const localCats = await db.categories.toArray();
        setCategories(localCats.map(c => ({
          ...c,
          sub: (c as any).sub || '',
          icon: (c as any).icon || FolderOpen,
          color: (c as any).color || 'text-primary'
        })) as StudioCategory[]);
        
        // Synchroniser avec Supabase en arrière-plan
        await syncService.syncCategories(user?.id || '');
        
        // Recharger depuis Dexie après synchronisation
        const updatedCats = await db.categories.toArray();
        setCategories(updatedCats.map(c => ({
          ...c,
          sub: (c as any).sub || '',
          icon: (c as any).icon || FolderOpen,
          color: (c as any).color || 'text-primary'
        })) as StudioCategory[]);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, [user?.id]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const refreshProducts = async () => {
    const products = await db.products.toArray();
    setProducts(products.map(p => ({
      ...p,
      categoryId: p.merchantId,
      coverImage: p.image || '',
      variants: []
    })) as Product[]);
  };

  // Charger les produits depuis Dexie au montage
  React.useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const localProducts = await db.products.toArray();
        setProducts(localProducts.map(p => ({
          ...p,
          categoryId: p.merchantId, // Mapping correct
          coverImage: p.image || '',
          variants: [] // Variants are handled separately
        })) as Product[]);
        
        // Synchroniser avec Supabase en arrière-plan
        await syncService.syncProducts(user?.id || '');
        
        // Recharger depuis Dexie après synchronisation
        const updatedProducts = await db.products.toArray();
        setProducts(updatedProducts.map(p => ({
          ...p,
          categoryId: p.merchantId,
          coverImage: p.image || '',
          variants: []
        })) as Product[]);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSave called with item:', editingItem);
    
    if (!editingItem?.name) {
      toast.error('Le nom est requis');
      return;
    }
    
    if (activeTab === 'products' && !editingItem?.categoryId) {
      toast.error('La catégorie est requise');
      return;
    }

    // Confirmation before saving large modifications
    if (editingItem?.id && !window.confirm('Voulez-vous vraiment enregistrer ces modifications ?')) {
      return;
    }

    const loadingToast = toast.loading('Enregistrement en cours...');
    try {
      const dataToSave = { ...editingItem };
      const variants = dataToSave.variants || [];
      
      // Clean up UI-only properties
      delete dataToSave._tempVariations;
      delete dataToSave.expandedVariant;
      delete dataToSave.variants;

      // Remove undefined values
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });

      let savedItem;
      if (activeTab === 'categories') {
        // 1. Sauvegarder localement dans Dexie
        await db.categories.put(dataToSave);
        // 2. Synchroniser en arrière-plan
        syncService.syncCategories(user?.id || '');
        refreshCats();
      } else {
        // 1. Sauvegarder localement dans Dexie
        await db.products.put({ ...dataToSave, variants, userId: user?.id });
        // 2. Synchroniser en arrière-plan
        syncService.syncProducts(user?.id || '');
        
        refreshProducts();
      }
      
      toast.success('Enregistré avec succès !', { id: loadingToast });
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Erreur lors de l\'enregistrement : ' + (error instanceof Error ? error.message : 'Erreur inconnue'), { id: loadingToast });
    }
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    console.log('handleDelete called for id:', id, 'on tab:', activeTab);
    if (!window.confirm('Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.')) {
      return false;
    }
    
    const loadingToast = toast.loading('Suppression en cours...');
    try {
      if (activeTab === 'categories') {
        // Check if there are products in this category
        const { count, error: countError } = await supabase
          .from('studio_acom_products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', id);
        
        if (countError) console.error('Error checking products in category:', countError);
        
        if (count && count > 0) {
          toast.error(`Impossible de supprimer : cette catégorie contient ${count} produits.`, { id: loadingToast });
          return false;
        }
        
        await dbService.studioAcom.categories.delete(id);
        refreshCats();
      } else {
        await dbService.studioAcom.products.delete(id);
        refreshProducts();
      }
      toast.success('Supprimé avec succès !', { id: loadingToast });
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erreur lors de la suppression : ' + (error instanceof Error ? error.message : 'Erreur inconnue'), { id: loadingToast });
      return false;
    }
  };

  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImportDefaults = async () => {
    setIsImporting(true);
    setImportSuccess(false);
    try {
      console.log('Starting import of default data...');
      // Import Categories
      const defaultCats = INITIAL_CATEGORIES.filter(c => !['all', 'favorites', 'categories', 'saved'].includes(c.id));
      console.log(`Found ${defaultCats.length} categories to import.`);
      
      for (const cat of defaultCats) {
        console.log(`Importing category: ${cat.name} (${cat.id})...`);
        
        // Map the icon object to its name
        const iconMap: { [key: string]: any } = { Sparkles, Star, LayoutGrid, FolderOpen, Contact2, Megaphone, Building2 };
        const iconName = Object.keys(iconMap).find(key => iconMap[key] === cat.icon) || 'LayoutGrid';
        
        console.log(`Resolved icon name: ${iconName}`);
        try {
          // Map to snake_case for Supabase
          await dbService.studioAcom.categories.save({ 
            id: cat.id,
            name: cat.name,
            sub: cat.sub,
            icon: iconName,
            color: cat.color,
            cover_image: cat.coverImage
          });
          console.log(`Successfully saved category: ${cat.name}`);
        } catch (err) {
          console.error(`Failed to save category ${cat.name}:`, err);
          throw err;
        }
      }

      // Import Products
      if (INITIAL_PRODUCTS.length > 0) {
        console.log(`Found ${INITIAL_PRODUCTS.length} products to import.`);
        for (const product of INITIAL_PRODUCTS) {
          console.log(`Importing product: ${product.name} (${product.id})...`);
          try {
            // Map to snake_case for Supabase
            await dbService.studioAcom.products.save({
              id: product.id,
              name: product.name,
              category_id: product.categoryId,
              description: product.description,
              cover_image: product.coverImage,
              user_id: product.userId,
              variants: product.variants
            });
            console.log(`Successfully saved product: ${product.name}`);
          } catch (err) {
            console.error(`Failed to save product ${product.name}:`, err);
            throw err;
          }
        }
      } else {
        console.log('No default products found to import.');
      }
      
      console.log('Import completed successfully!');
      refreshCats();
      refreshProducts();
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      console.error('Error importing defaults:', error);
      alert('Erreur lors de l\'importation : ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem({ ...editingItem, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredItems = (activeTab === 'categories' ? categories : products).filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (iconName: string) => {
    const icons: any = { Sparkles, Star, LayoutGrid, FolderOpen, Contact2, Megaphone, Building2 };
    return icons[iconName] || Layout;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'categories' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Catégories
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Produits
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <button
            onClick={handleImportDefaults}
            disabled={isImporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isImporting 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                : importSuccess 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Importer toutes les catégories et modèles par défaut"
          >
            {isImporting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            ) : importSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden lg:inline">
              {isImporting ? 'Importation...' : importSuccess ? 'Importé !' : 'Par défaut'}
            </span>
          </button>
          <button
            onClick={() => {
              setEditingItem(activeTab === 'categories' ? { name: '', sub: '', color: 'text-gray-600' } : { name: '', categoryId: categories[0]?.id || '', description: '', variants: [] });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => (
            <motion.div
              key={item.id}
              layout
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="aspect-video bg-gray-50 rounded-xl mb-4 overflow-hidden relative group/image">
                {item.coverImage ? (
                  <img 
                    src={item.coverImage} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                
                {/* Overlay for quick actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    className="p-3 bg-white text-gray-900 rounded-full hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover/image:translate-y-0 duration-300"
                    title="Modifier l'image et les détails"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-white text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all transform translate-y-4 group-hover/image:translate-y-0 duration-300 delay-75"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Icon Badge */}
                {activeTab === 'categories' && (
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg flex items-center gap-2 shadow-sm">
                    {React.createElement(getIcon(item.icon), { className: `w-4 h-4 ${item.color || 'text-primary'}` })}
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">{item.id}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                    {activeTab === 'products' && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded border border-primary/10">
                        Produit
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{item.sub || item.description}</p>
                  
                  {activeTab === 'products' && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                        <Layout className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">
                        {categories.find(c => c.id === item.categoryId)?.name || 'Sans catégorie'}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun élément trouvé</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Commencez par ajouter un élément ou importez les données par défaut.
          </p>
          <button
            onClick={handleImportDefaults}
            className="px-6 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all"
          >
            Importer les données par défaut
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  {editingItem?.id ? 'Modifier' : 'Ajouter'} {activeTab === 'categories' ? 'la catégorie' : 'le produit'}
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {activeTab === 'categories' 
                    ? 'Configurez les détails de la catégorie de produits' 
                    : 'Gérez les détails du produit et ses différentes variantes'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {activeTab === 'categories' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Nom de la catégorie</label>
                        <input
                          type="text"
                          required
                          value={editingItem?.name || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                          placeholder="Ex: Papeterie"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Sous-titre / Description courte</label>
                        <input
                          type="text"
                          value={editingItem?.sub || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, sub: e.target.value })}
                          className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                          placeholder="Ex: Cartes, enveloppes..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Icône</label>
                          <select
                            value={editingItem?.icon || 'LayoutGrid'}
                            onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all appearance-none"
                          >
                            <option value="Sparkles">Étincelles</option>
                            <option value="Star">Étoile</option>
                            <option value="LayoutGrid">Grille</option>
                            <option value="FolderOpen">Dossier</option>
                            <option value="Contact2">Contact</option>
                            <option value="Megaphone">Mégaphone</option>
                            <option value="Building2">Bâtiment</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Couleur</label>
                          <input
                            type="text"
                            value={editingItem?.color || 'text-gray-600'}
                            onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                            placeholder="ex: text-blue-600"
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Image de couverture</label>
                      <div className="relative group aspect-video bg-gray-50 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-purple-300 transition-all">
                        {editingItem?.coverImage ? (
                          <>
                            <OptimizedImage 
                              src={editingItem.coverImage} 
                              alt="Preview" 
                              width={800}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => setEditingItem({ ...editingItem, coverImage: '' })}
                                className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors">
                            <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                            <span className="text-sm text-gray-500 font-bold">Ajouter une image</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'coverImage')}
                            />
                          </label>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Ou collez une URL d'image ici..."
                        value={editingItem?.coverImage || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, coverImage: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold text-xs transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Produit Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Nom du produit</label>
                          <input
                            type="text"
                            required
                            value={editingItem?.name || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                            placeholder="Ex: Carte de Visite Luxe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Catégorie parente</label>
                          <select
                            required
                            value={editingItem?.categoryId || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all appearance-none"
                          >
                            <option value="" disabled>Sélectionnez une catégorie</option>
                            {categories.filter(c => !['all', 'favorites', 'categories', 'saved'].includes(c.id)).map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Description détaillée</label>
                          <textarea
                            value={editingItem?.description || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            rows={4}
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm resize-none transition-all"
                            placeholder="Décrivez les caractéristiques de ce produit..."
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Image principale du produit</label>
                        <div className="relative group aspect-video bg-gray-50 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-purple-300 transition-all">
                          {editingItem?.coverImage ? (
                            <>
                              <OptimizedImage 
                                src={editingItem.coverImage} 
                                alt="Preview" 
                                width={800}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  type="button"
                                  onClick={() => setEditingItem({ ...editingItem, coverImage: '' })}
                                  className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <Trash2 className="w-6 h-6" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors">
                              <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                              <span className="text-sm text-gray-500 font-bold">Ajouter une image</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'coverImage')}
                              />
                            </label>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Ou URL de l'image..."
                          value={editingItem?.coverImage || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, coverImage: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold text-xs transition-all"
                        />
                      </div>
                    </div>

                    {/* Variantes Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Variantes & Modèles</h3>
                          <p className="text-xs text-gray-400 font-bold mt-1">Configurez les options spécifiques (prix, dimensions, design)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newVariant = { 
                              id: Date.now().toString(), 
                              name: 'Nouveau modèle', 
                              size: '85x55 mm', 
                              color: '', 
                              shape: '', 
                              format: 'landscape', 
                              finish: 'Mat', 
                              templateId: '', 
                              previewImage: '', 
                              price: 0, 
                              minQuantity: 100, 
                              maxQuantity: 1000, 
                              templateSvg: '<svg viewBox="0 0 100 100"></svg>' 
                            };
                            setEditingItem({ 
                              ...editingItem, 
                              variants: [...(editingItem.variants || []), newVariant],
                              expandedVariant: (editingItem.variants || []).length
                            });
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter une variante
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {editingItem?.variants?.map((v: any, index: number) => (
                          <div 
                            key={index} 
                            className={`rounded-3xl border transition-all overflow-hidden ${
                              index === editingItem.expandedVariant 
                                ? 'border-purple-200 ring-8 ring-purple-50 shadow-xl' 
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                          >
                            <div 
                              className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${index === editingItem.expandedVariant ? 'bg-purple-50/30' : 'bg-white'}`}
                              onClick={() => setEditingItem({ ...editingItem, expandedVariant: index === editingItem.expandedVariant ? null : index })}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                                  {v.previewImage ? (
                                    <OptimizedImage 
                                      src={v.previewImage} 
                                      alt={v.name}
                                      width={100}
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <ImageIcon className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-black text-gray-900 block">{v.name || 'Sans nom'}</span>
                                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{v.size} • {v.price}€</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  type="button" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const newVariants = [...(editingItem.variants || [])]; 
                                    newVariants.splice(index, 1); 
                                    setEditingItem({ ...editingItem, variants: newVariants }); 
                                  }} 
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                                <div className={`p-2 rounded-xl transition-all ${index === editingItem.expandedVariant ? 'bg-purple-100 text-purple-600 rotate-90' : 'text-gray-400'}`}>
                                  <ChevronRight className="w-5 h-5" />
                                </div>
                              </div>
                            </div>

                            {index === editingItem.expandedVariant && (
                              <div className="p-8 border-t border-gray-100 space-y-8 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nom du modèle</label>
                                    <input type="text" value={v.name} onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].name = e.target.value; setEditingItem({ ...editingItem, variants: newVariants }); }} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Dimensions</label>
                                    <input type="text" value={v.size} onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].size = e.target.value; setEditingItem({ ...editingItem, variants: newVariants }); }} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Prix (€)</label>
                                    <input type="number" value={v.price} onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].price = parseFloat(e.target.value); setEditingItem({ ...editingItem, variants: newVariants }); }} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Finition</label>
                                    <input type="text" value={v.finish} onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].finish = e.target.value; setEditingItem({ ...editingItem, variants: newVariants }); }} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" placeholder="Ex: Mat, Brillant..." />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Qté Min</label>
                                    <input type="number" value={v.minQuantity} onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].minQuantity = parseInt(e.target.value); setEditingItem({ ...editingItem, variants: newVariants }); }} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Qté Max</label>
                                    <input type="number" value={v.maxQuantity} onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].maxQuantity = parseInt(e.target.value); setEditingItem({ ...editingItem, variants: newVariants }); }} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aperçu du modèle</label>
                                    <div className="flex items-start gap-4">
                                      <div className="w-24 h-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                                        {v.previewImage ? (
                                          <>
                                            <OptimizedImage 
                                              src={v.previewImage} 
                                              alt={v.name}
                                              width={200}
                                              className="w-full h-full object-cover" 
                                            />
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                const newVariants = [...editingItem.variants];
                                                newVariants[index].previewImage = '';
                                                setEditingItem({ ...editingItem, variants: newVariants });
                                              }}
                                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                            >
                                              <Trash2 className="w-5 h-5" />
                                            </button>
                                          </>
                                        ) : (
                                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors">
                                            <Plus className="w-6 h-6 text-gray-300" />
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                  const newVariants = [...editingItem.variants];
                                                  newVariants[index].previewImage = reader.result as string;
                                                  setEditingItem({ ...editingItem, variants: newVariants });
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }} />
                                          </label>
                                        )}
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <input type="text" value={v.previewImage || ''} onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].previewImage = e.target.value; setEditingItem({ ...editingItem, variants: newVariants }); }} placeholder="URL de l'image" className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold text-xs transition-all" />
                                        <p className="text-[10px] text-gray-400 font-bold italic">Image miniature pour ce modèle spécifique.</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-1">
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Design SVG (Template)</label>
                                      <label className="cursor-pointer flex items-center gap-1.5 text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest transition-colors">
                                        <Plus className="w-3 h-3" />
                                        Importer SVG
                                        <input 
                                          type="file" 
                                          accept=".svg" 
                                          className="hidden" 
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onload = (event) => {
                                                const content = event.target?.result as string;
                                                const newVariants = [...editingItem.variants];
                                                newVariants[index].templateSvg = content;
                                                setEditingItem({ ...editingItem, variants: newVariants });
                                              };
                                              reader.readAsText(file);
                                            }
                                          }} 
                                        />
                                      </label>
                                    </div>
                                    <textarea 
                                      value={v.templateSvg} 
                                      onChange={(e) => { const newVariants = [...editingItem.variants]; newVariants[index].templateSvg = e.target.value; setEditingItem({ ...editingItem, variants: newVariants }); }} 
                                      placeholder="<svg>...</svg>" 
                                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-mono text-[10px] transition-all resize-none" 
                                      rows={5} 
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newVariant = { 
                              id: Date.now().toString(), 
                              name: 'Nouveau modèle', 
                              size: '85x55 mm', 
                              color: '', 
                              shape: '', 
                              format: 'landscape', 
                              finish: 'Mat', 
                              templateId: '', 
                              previewImage: '', 
                              price: 0, 
                              minQuantity: 100, 
                              maxQuantity: 1000, 
                              templateSvg: '<svg viewBox="0 0 100 100"></svg>' 
                            };
                            setEditingItem({ 
                              ...editingItem, 
                              variants: [...(editingItem.variants || []), newVariant],
                              expandedVariant: (editingItem.variants || []).length
                            });
                          }}
                          className="w-full py-6 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-black text-sm hover:border-purple-200 hover:text-purple-500 hover:bg-purple-50/30 transition-all flex flex-col items-center gap-2"
                        >
                          <Plus className="w-8 h-8" />
                          Ajouter une nouvelle variante de produit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 text-gray-500 font-black text-sm hover:bg-white hover:shadow-md rounded-2xl transition-all"
                >
                  Annuler
                </button>
                <div className="flex items-center gap-4">
                  {editingItem?.id && (
                    <button
                      type="button"
                      onClick={async () => {
                        const success = await handleDelete(editingItem.id);
                        if (success) setIsModalOpen(false);
                      }}
                      className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-12 py-3 bg-purple-600 text-white font-black text-sm rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all flex items-center gap-3"
                  >
                    <Save className="w-5 h-5" />
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudioAcomManager;
