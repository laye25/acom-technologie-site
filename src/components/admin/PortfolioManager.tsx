import React, { useState, useMemo } from 'react';
import { PortfolioItem } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Upload, Loader2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSupabaseData, TableName } from '../../hooks/useSupabase';
import { dbService as db } from '../../services/dbService';
import { compressImage, getOptimizedUrl } from '../../lib/imageUtils';
import { OptimizedImage } from '../OptimizedImage';

import { ConfirmModal } from './ConfirmModal';

const PortfolioManager = () => {
  const projectMapper = useMemo(() => (item: any) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    image: item.image,
    order: item.order
  }), []);

  const portfolioOptions = useMemo(() => ({
    tableName: 'portfolio' as TableName,
    order: { column: 'order' as const },
    mapper: projectMapper
  }), [projectMapper]);

  const { data: items, loading, error: fetchError, refresh } = useSupabaseData<PortfolioItem>(portfolioOptions);

  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<PortfolioItem> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [showConfirmSeed, setShowConfirmSeed] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedStatus('Initialisation...');
    try {
      // await db.seedDatabase((status) => setSeedStatus(status));
      showNotification('error', 'La restauration n\'est pas supportée avec Supabase pour le moment.');
      setShowConfirmSeed(false);
    } catch (error: any) {
      console.error('Error seeding data:', error);
      showNotification('error', `Erreur lors de la restauration : ${error.message}`);
    } finally {
      setIsSeeding(false);
      setSeedStatus(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image est trop volumineuse (max 5Mo)');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const compressedBase64 = await compressImage(file, 1200, 800, 0.7);
      setCurrentItem(prev => prev ? { ...prev, image: compressedBase64 } : null);
      setUploading(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(`Erreur lors du chargement : ${error.message}`);
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem?.title || !currentItem?.category) {
      showNotification('error', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const itemData = {
        ...currentItem,
        order: currentItem.order ?? items.length
      };

      await db.portfolio.save(itemData);
      showNotification('success', currentItem.id ? 'Projet mis à jour !' : 'Projet ajouté !');
      
      setIsEditing(false);
      setCurrentItem(null);
    } catch (error: any) {
      console.error('Error saving portfolio item:', error);
      showNotification('error', `Erreur lors de l'enregistrement : ${error.message}`);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await db.portfolio.delete(id);
      showNotification('success', 'Projet supprimé !');
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting portfolio item:', error);
      showNotification('error', `Erreur lors de la suppression : ${error.message}`);
    }
  };

  if (fetchError) return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Database className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Erreur de chargement</h3>
      <p className="text-gray-500 mb-6 max-w-xs mx-auto">{fetchError.message}</p>
      <button 
        onClick={() => refresh()}
        className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );

  if (loading && items.length === 0) return (
    <div className="p-12 text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
      <p className="text-gray-600 mb-4">Chargement du portfolio...</p>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-lg border ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <p className="text-sm font-medium">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Gestion du Portfolio</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfirmSeed(true)}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Rétablir les projets par défaut"
          >
            <Database className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Rétablir</span>
          </button>
          <button
            onClick={() => {
              setCurrentItem({ category: '', title: '', image: '', order: items.length });
              setIsEditing(true);
            }}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Projet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm group relative">
            <div className="relative h-48 mb-4 rounded-xl overflow-hidden bg-gray-100">
              {item.image ? (
                <OptimizedImage 
                  src={item.image} 
                  alt={item.title} 
                  width={400}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex space-x-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setCurrentItem(item);
                    setIsEditing(true);
                  }}
                  className="p-2 bg-white/95 backdrop-blur shadow-lg rounded-lg text-gray-600 hover:text-primary transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(item.id)}
                  className="p-2 bg-white/95 backdrop-blur shadow-lg rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500 uppercase font-bold tracking-wider mt-2 inline-block">
              {item.category}
            </span>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Votre portfolio est vide. Vous pouvez ajouter un projet manuellement ou rétablir les projets par défaut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                setCurrentItem({ category: '', title: '', image: '', order: 0 });
                setIsEditing(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter manuellement
            </button>
            <button
              onClick={() => setShowConfirmSeed(true)}
              disabled={isSeeding}
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {seedStatus || 'Importation...'}
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Rétablir les projets par défaut
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Supprimer le projet"
        message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmModal
        isOpen={showConfirmSeed}
        title="Rétablir les projets par défaut"
        message="Voulez-vous rétablir les projets par défaut ? Cela ajoutera les projets de base."
        type="warning"
        onConfirm={handleSeedData}
        onCancel={() => setShowConfirmSeed(false)}
      />

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {currentItem?.id ? 'Modifier le Projet' : 'Nouveau Projet'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Titre du Projet</label>
                  <input
                    type="text"
                    required
                    value={currentItem?.title || ''}
                    onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    required
                    value={currentItem?.category || ''}
                    onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="ex: Web Development, Branding..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Photo du projet</label>
                  <div className="space-y-3">
                    {currentItem?.image && (
                      <div className="relative h-48 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <OptimizedImage src={currentItem.image} alt="Preview" width={600} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCurrentItem(prev => prev ? { ...prev, image: '' } : null)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 flex flex-col items-center justify-center px-4 py-4 bg-gray-50 text-gray-500 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">Choisir une photo</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                      
                      <div className="flex-1">
                        <input
                          type="text"
                          value={currentItem?.image || ''}
                          onChange={e => setCurrentItem({ ...currentItem, image: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                          placeholder="Ou coller une URL..."
                        />
                      </div>
                    </div>
                    {uploadError && (
                      <p className="text-xs text-red-500 font-medium mt-1">{uploadError}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
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

export default PortfolioManager;
