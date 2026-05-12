import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, Image as ImageIcon, 
  Layout, Save, X, Sparkles, Star, LayoutGrid, Check,
  FolderOpen, Contact2, Megaphone, Building2, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { dbService } from '../../services/dbService';
import { Category as StudioCategory, Product, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../../constants/studioAcom';
import { firestoreService } from '../../services/firestoreService';
import { storageService } from '../../services/storageService';
import { compressImage, getImageUrl } from '../../lib/imageUtils';
import { where } from 'firebase/firestore';
import { ImageService } from '../../data/services/image.service';
import { OptimizedImage } from '../OptimizedImage';
import { ConfirmModal } from './ConfirmModal';
import { useStudioAcom } from '../../hooks/useStudioAcom';
import DesignRequestManager from './DesignRequestManager';
import { PrintingManager } from './PrintingManager';
import { PartnerReputationManager } from './PartnerReputationManager';
import { UserManager } from './UserManager';
import { Order, Service, UserProfile } from '../../types';

const StudioAcomManager = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'designs' | 'impression' | 'partenaires' | 'utilisateurs'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const { categories, products, loading } = useStudioAcom(activeTab === 'categories' || activeTab === 'products');

  const allOrders = useLiveQuery(() => db.orders.toArray(), []) || [];
  const allServices = useLiveQuery(() => db.services.toArray(), []) || [];
  const allUsers = useLiveQuery(() => db.users.toArray(), []) || [];

  const loadingCats = loading;
  const loadingProducts = loading;

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    if (!editingItem?.name) {
      toast.error('Le nom est requis');
      return;
    }
    
    if (activeTab === 'products' && !editingItem?.categoryId) {
      toast.error('La catégorie est requise');
      return;
    }

    if (editingItem?.id && !showSaveConfirm) {
      setShowSaveConfirm(true);
      return;
    }

    setShowSaveConfirm(false);
    setIsSaving(true);
    const loadingToast = toast.loading('Enregistrement en cours...');
    try {
      if (activeTab === 'categories') {
        const catData = {
          ...editingItem,
          cover_image: editingItem.coverImage || editingItem.cover_image
        };
        await dbService.studioAcom.categories.save(catData);
      } else {
        const prodData = {
          ...editingItem,
          cover_image: editingItem.coverImage || editingItem.cover_image
        };
        await dbService.studioAcom.products.save({ ...prodData, userId: user?.uid });
      }
      
      toast.success('Enregistré avec succès !', { id: loadingToast });
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Erreur lors de l\'enregistrement : ' + (error instanceof Error ? error.message : 'Erreur inconnue'), { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(id);
      return false;
    }
    
    setShowDeleteConfirm(null);
    const loadingToast = toast.loading('Suppression en cours...');
    try {
      if (activeTab === 'categories') {
        // Check if there are products in this category
        const productsInCat = products.filter(p => p.categoryId === id);
        
        const count = productsInCat.length;
        
        if (count && count > 0) {
          toast.error(`Impossible de supprimer : cette catégorie contient ${count} produits.`, { id: loadingToast });
          return false;
        }
        
        await dbService.studioAcom.categories.delete(id);
      } else {
        await dbService.studioAcom.products.delete(id);
      }
      toast.success('Supprimé avec succès !', { id: loadingToast });
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erreur lors de la suppression : ' + (error instanceof Error ? error.message : 'Erreur inconnue'), { id: loadingToast });
      return false;
    }
  };

  const handleEdit = (item: any) => {
    console.log('Admin StudioAcom: Editing item trigger', { id: item.id, tab: activeTab });
    
    // Safety check: ensure item has necessary fields mapped for the edit form
    const editItem = { ...item };
    
    // Map snake_case to camelCase if needed, as these are the fields the forms use
    if (!editItem.categoryId && editItem.category_id) {
      editItem.categoryId = editItem.category_id;
    }
    
    if (!editItem.coverImage && editItem.cover_image) {
      editItem.coverImage = editItem.cover_image;
    }

    setEditingItem(editItem);
    setIsModalOpen(true);
  };

  const [isUploading, setIsUploading] = useState(false);

  const updateVariant = (index: number, updates: any) => {
    setEditingItem(prev => {
      if (!prev) return null;
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = { ...newVariants[index], ...updates };
      return { ...prev, variants: newVariants };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, subPath: string = 'general') => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;

    setIsUploading(true);
    try {
      // Create a unique path for the image
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const path = `${activeTab}/${subPath}/${fileName}`;

      const publicUrl = await ImageService.compressAndUpload(file, path);
      
      setEditingItem(prev => prev ? { ...prev, [field]: publicUrl } : null);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Échec du téléchargement de l\'image.');
    } finally {
      setIsUploading(false);
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
          <button
            onClick={() => setActiveTab('designs')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'designs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Demandes Design
          </button>
          <button
            onClick={() => setActiveTab('impression')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'impression' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Impression
          </button>
          <button
            onClick={() => setActiveTab('partenaires')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'partenaires' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Partenaires
          </button>
          <button
            onClick={() => setActiveTab('utilisateurs')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'utilisateurs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Gestion Utilisateurs
          </button>
        </div>

        {(activeTab === 'categories' || activeTab === 'products') && (
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
        )}
      </div>

      {/* Content based on Tab */}
      {activeTab === 'designs' && <DesignRequestManager />}
      {activeTab === 'impression' && <PrintingManager orders={allOrders} services={allServices} users={allUsers} />}
      {activeTab === 'partenaires' && <PartnerReputationManager />}
      {activeTab === 'utilisateurs' && <UserManager />}

      {/* Grid */}
      {(activeTab === 'categories' || activeTab === 'products') && (
        filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => (
            <motion.div
              key={item.id}
              layout
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="aspect-video bg-white rounded-xl mb-4 overflow-hidden relative group/image">
                {getImageUrl(item) ? (
                  <OptimizedImage 
                    src={getImageUrl(item)} 
                    alt={item.name} 
                    width={400}
                    placeholder="blur"
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="p-3 bg-white text-gray-900 rounded-full hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover/image:translate-y-0 duration-300"
                    title="Modifier l'image et les détails"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-3 bg-white text-rose-500 rounded-full hover:bg-rose-50 hover:text-white transition-all transform translate-y-4 group-hover/image:translate-y-0 duration-300 delay-75"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Icon Badge */}
                {activeTab === 'categories' && (
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg flex items-center gap-2 shadow-sm">
                    {typeof item.icon === 'function' ? (
                      <item.icon className={`w-4 h-4 ${item.color || 'text-primary'}`} />
                    ) : item.icon && typeof item.icon === 'object' && 'type' in item.icon ? (
                      item.icon
                    ) : (
                      // Fallback: render the icon name or a default
                      <span className="text-[10px]">{item.iconName || '📁'}</span>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">{item.id}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0" onClick={() => handleEdit(item)}>
                  <div className="flex items-center gap-2 mb-1 cursor-pointer">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{item.name}</h3>
                    {activeTab === 'products' && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded border border-primary/10">
                        Produit
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{item.sub || item.description}</p>
                  
                  {activeTab === 'products' && (
                    <div className="flex items-center gap-2 mt-3 cursor-pointer">
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
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
          <p className="text-gray-500 max-w-xs mx-auto">
            Commencez par ajouter un élément.
          </p>
        </div>
      ))}

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
                          onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                          placeholder="Ex: Papeterie"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Sous-titre / Description courte</label>
                        <input
                          type="text"
                          value={editingItem?.sub || ''}
                          onChange={(e) => setEditingItem(prev => prev ? { ...prev, sub: e.target.value } : null)}
                          className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                          placeholder="Ex: Cartes, enveloppes..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Icône</label>
                          <select
                            value={editingItem?.iconName || (typeof editingItem?.icon === 'string' ? editingItem.icon : 'LayoutGrid')}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, iconName: e.target.value, icon: e.target.value } : null)}
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
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, color: e.target.value } : null)}
                            placeholder="ex: text-blue-600"
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Image de couverture</label>
                      <div className="relative group aspect-video bg-gray-50 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-purple-300 transition-all">
                        {getImageUrl(editingItem) ? (
                          <>
                            <OptimizedImage 
                              src={getImageUrl(editingItem)} 
                              alt="Preview" 
                              width={800}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(prev => prev ? { ...prev, coverImage: '', cover_image: '', image: '', previewImage: '', preview: '' } : null);
                                }}
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
                        value={getImageUrl(editingItem)}
                        onChange={(e) => setEditingItem(prev => prev ? { ...prev, coverImage: e.target.value } : null)}
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
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold transition-all"
                            placeholder="Ex: Carte de Visite Luxe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Catégorie parente</label>
                          <select
                            required
                            value={editingItem?.categoryId || ''}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, categoryId: e.target.value } : null)}
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
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                            rows={4}
                            className="w-full px-5 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm resize-none transition-all"
                            placeholder="Décrivez les caractéristiques de ce produit..."
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Image principale du produit</label>
                        <div className="relative group aspect-video bg-gray-50 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-purple-300 transition-all">
                          {getImageUrl(editingItem) ? (
                            <>
                              <OptimizedImage 
                                src={getImageUrl(editingItem)} 
                                alt="Preview" 
                                width={800}
                                placeholder="blur"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItem(prev => prev ? { ...prev, coverImage: '', cover_image: '', image: '', previewImage: '', preview: '' } : null);
                                  }}
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
                          value={getImageUrl(editingItem)}
                          onChange={(e) => setEditingItem(prev => prev ? { ...prev, coverImage: e.target.value } : null)}
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
                              onClick={() => setEditingItem(prev => prev ? { ...prev, expandedVariant: index === prev.expandedVariant ? null : index } : null)}
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
                                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{v.size} • {v.price} FCFA</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  type="button" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const newVariants = [...(editingItem.variants || [])]; 
                                    newVariants.splice(index, 1); 
                                    setEditingItem(prev => {
                                      if (!prev) return null;
                                      const newVariants = [...(prev.variants || [])];
                                      newVariants.splice(index, 1);
                                      return { ...prev, variants: newVariants };
                                    }); 
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
                                    <input type="text" value={v.name} onChange={(e) => updateVariant(index, { name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Dimensions</label>
                                    <input type="text" value={v.size} onChange={(e) => updateVariant(index, { size: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Prix (FCFA)</label>
                                    <input type="number" value={v.price} onChange={(e) => updateVariant(index, { price: parseFloat(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Finition</label>
                                    <input type="text" value={v.finish} onChange={(e) => updateVariant(index, { finish: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" placeholder="Ex: Mat, Brillant..." />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Qté Min</label>
                                    <input type="number" value={v.minQuantity} onChange={(e) => updateVariant(index, { minQuantity: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Qté Max</label>
                                    <input type="number" value={v.maxQuantity} onChange={(e) => updateVariant(index, { maxQuantity: parseInt(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-200 outline-none font-bold text-sm transition-all" />
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
                                              onClick={() => updateVariant(index, { previewImage: '', preview_image: '' })}
                                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                            >
                                              <Trash2 className="w-5 h-5" />
                                            </button>
                                          </>
                                        ) : (
                                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors">
                                            <Plus className="w-6 h-6 text-gray-300" />
                                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;

                                              const loadingToast = toast.loading('Téléchargement...');
                                              try {
                                                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                                                const bucket = 'studio-acom';
                                                const path = `variants/${fileName}`;
                                                const publicUrl = await storageService.uploadFile(bucket, path, file);
                                                updateVariant(index, { previewImage: publicUrl });
                                                toast.success('Image téléchargée !', { id: loadingToast });
                                              } catch (error) {
                                                console.error('Error uploading variant image:', error);
                                                try {
                                                  const compressedBase64 = await compressImage(file, 800, 800, 0.7);
                                                  updateVariant(index, { previewImage: compressedBase64 });
                                                  toast.success('Enregistré localement (base64)', { id: loadingToast });
                                                } catch (compressError) {
                                                  toast.error('Erreur lors du traitement de l\'image', { id: loadingToast });
                                                }
                                              }
                                            }} />
                                          </label>
                                        )}
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <input type="text" value={v.previewImage || ''} onChange={(e) => updateVariant(index, { previewImage: e.target.value })} placeholder="URL de l'image" className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold text-xs transition-all" />
                                        <p className="text-[10px] text-gray-400 font-bold italic">Image miniature pour ce modèle spécifique.</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-1">
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Design SVG (Template)</label>
                                      <label className="cursor-pointer flex items-center gap-1.5 text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest transition-colors">
                                        <Plus className="w-3 h-3" />
                                        Importer SVG(s)
                                        <input 
                                          type="file" 
                                          accept=".svg" 
                                          multiple
                                          className="hidden" 
                                          onChange={(e) => {
                                            const files = e.target.files;
                                            if (files && files.length > 0) {
                                              const promises = Array.from(files).map((file) => {
                                                return new Promise<string>((resolve) => {
                                                  const reader = new FileReader();
                                                  reader.onload = (event) => resolve(event.target?.result as string);
                                                  reader.readAsText(file);
                                                });
                                              });
                                              Promise.all(promises).then((svgContents) => {
                                                const content = svgContents.length > 1 ? JSON.stringify(svgContents) : svgContents[0];
                                                const newVariants = [...editingItem.variants];
                                                newVariants[index].templateSvg = content;
                                                updateVariant(index, { templateSvg: content });
                                                if (svgContents.length > 1) {
                                                  toast.success(`${svgContents.length} pages SVG importées !`);
                                                }
                                              });
                                            }
                                          }} 
                                        />
                                      </label>
                                    </div>
                                    <textarea 
                                      value={v.templateSvg} 
                                      onChange={(e) => updateVariant(index, { templateSvg: e.target.value })} 
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
      {/* Confirmations */}
      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        title="Confirmer la suppression"
        message="Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
        type="danger"
      />

      <ConfirmModal
        isOpen={showSaveConfirm}
        title="Confirmer les modifications"
        message="Voulez-vous vraiment enregistrer ces modifications ?"
        confirmLabel="Enregistrer"
        cancelLabel="Annuler"
        onConfirm={() => handleSave({ preventDefault: () => {} } as any)}
        onCancel={() => setShowSaveConfirm(false)}
        type="info"
      />
    </div>
  );
};

export default StudioAcomManager;
