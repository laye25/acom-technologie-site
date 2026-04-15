import React, { useState, useMemo } from 'react';
import { Service } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Upload, Loader2, Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreData, TableName } from '../../hooks/useFirestoreData';
import { dbService as db } from '../../services/dbService';
import { getAiClient, getGeminiModel } from '../../lib/gemini';
import { compressImage, getOptimizedUrl } from '../../lib/imageUtils';
import { OptimizedImage } from '../OptimizedImage';

import { ConfirmModal } from './ConfirmModal';

import { SEOAnalyzer } from './SEOAnalyzer';

const ServiceManager = () => {
  const serviceMapper = useMemo(() => (s: any) => ({
    id: s.id,
    name: s.name,
    shortDescription: s.shortDescription || '',
    description: s.description,
    price: s.price,
    cost: s.cost || 0,
    category: s.category,
    image: s.image,
    additionalImages: s.additionalImages || [],
    features: s.features || [],
    promotion: s.promotion || {
      discountPercentage: 0,
      startDate: '',
      endDate: '',
      isActive: false
    }
  }), []);

  const serviceOptions = useMemo(() => ({
    tableName: 'services' as TableName,
    order: { column: 'name' as const },
    mapper: serviceMapper
  }), [serviceMapper]);

  const { data: services, loading, error: fetchError, refresh } = useFirestoreData<Service>(serviceOptions);

  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
  const [featuresInput, setFeaturesInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [showConfirmSeed, setShowConfirmSeed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const existingCategories = useMemo(() => {
    const cats = services.map(s => s.category);
    const defaultCats = ['digital', 'marketing', 'design', 'event'];
    return Array.from(new Set([...defaultCats, ...cats]));
  }, [services]);

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
      setCurrentService(prev => prev ? { ...prev, image: compressedBase64 } : null);
      setUploading(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(`Erreur lors du chargement : ${error.message}`);
      setUploading(false);
    }
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const newImages: string[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (file.size > 5 * 1024 * 1024) continue;

        try {
          const compressedBase64 = await compressImage(file, 1200, 800, 0.7);
          newImages.push(compressedBase64);
        } catch (compressError) {
          console.error('Error compressing gallery image:', compressError);
        }
      }

      setCurrentService(prev => prev ? { 
        ...prev, 
        additionalImages: [...(prev.additionalImages || []), ...newImages] 
      } : null);
    } catch (error: any) {
      console.error('Error uploading additional images:', error);
      setUploadError(`Erreur lors du chargement : ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setCurrentService(prev => {
      if (!prev) return null;
      const newImages = [...(prev.additionalImages || [])];
      newImages.splice(index, 1);
      return { ...prev, additionalImages: newImages };
    });
  };

  const handleGenerateAI = async (field: 'shortDescription' | 'description') => {
    if (!currentService?.name) {
      showNotification('error', "Veuillez d'abord saisir le nom du service.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = getAiClient();
      if (!ai) {
        showNotification('error', 'L\'assistant IA n\'est pas configuré.');
        return;
      }
      const model = getGeminiModel();
      const prompt = field === 'shortDescription' 
        ? `Génère une seule phrase d'accroche courte et percutante (maximum 15 mots) pour un service nommé "${currentService.name}" proposé par une agence digitale au Sénégal.`
        : `Génère une description détaillée et professionnelle (environ 100-150 mots) pour un service nommé "${currentService.name}" proposé par une agence digitale au Sénégal. Inclus les bénéfices pour le client. Réponds en français.`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      const text = result.text;
      setCurrentService(prev => prev ? { ...prev, [field]: text } : null);
      showNotification('success', 'Contenu généré avec succès !');
    } catch (error) {
      console.error('AI Generation error:', error);
      showNotification('error', 'Erreur lors de la génération IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentService?.name || !currentService?.description) {
      showNotification('error', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const { image, additionalImages, ...rest } = currentService || {};
      
      const serviceData = {
        ...rest,
        category: isAddingCategory ? newCategory : (currentService?.category || 'digital'),
        price: Number(currentService?.price) || 0,
        features: featuresInput.split(',').map(f => f.trim()).filter(f => f !== ''),
        image: image || '',
        additionalImages: additionalImages || []
      } as Service;

      await db.services.save(serviceData);
      showNotification('success', currentService.id ? 'Service mis à jour !' : 'Service ajouté !');
      
      setIsEditing(false);
      setCurrentService(null);
      setFeaturesInput('');
      setIsAddingCategory(false);
      setNewCategory('');
    } catch (error: any) {
      console.error('Error saving service:', error);
      showNotification('error', `Erreur lors de l'enregistrement : ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await db.services.delete(id);
      showNotification('success', 'Service supprimé !');
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting service:', error);
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

  if (loading && services.length === 0) return (
    <div className="p-12 text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
      <p className="text-gray-600 mb-4">Chargement des services...</p>
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
        <h2 className="text-xl font-bold text-gray-900">Catalogue des Services</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfirmSeed(true)}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Rétablir les offres par défaut"
          >
            <Database className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Rétablir</span>
          </button>
          <button
            onClick={() => {
              setCurrentService({ category: 'digital', features: [], image: '' });
              setFeaturesInput('');
              setIsEditing(true);
              setIsAddingCategory(false);
              setNewCategory('');
            }}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white p-4 border border-black/5 shadow-sm group relative">
            <div className="relative h-40 mb-4 overflow-hidden bg-gray-100">
              {service.image ? (
                <OptimizedImage 
                  src={service.image} 
                  alt={service.name} 
                  width={400}
                  className="w-full h-full object-contain" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              {/* Actions buttons - Always visible on mobile, hover on desktop */}
              <div className="absolute top-2 right-2 flex space-x-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setCurrentService(service);
                    setFeaturesInput(service.features.join(', '));
                    setIsEditing(true);
                    setIsAddingCategory(false);
                    setNewCategory('');
                  }}
                  className="p-2 bg-white/95 backdrop-blur shadow-lg rounded-lg text-gray-600 hover:text-primary transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(service.id)}
                  className="p-2 bg-white/95 backdrop-blur shadow-lg rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{service.description}</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-primary font-bold">{service.price.toLocaleString()} FCFA</span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500 uppercase font-bold tracking-wider">
                {service.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun service trouvé dans la base de données</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Votre base de données est vide. Vous pouvez ajouter un service manuellement ou rétablir les offres par défaut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                setCurrentService({ category: 'digital', features: [], image: '' });
                setFeaturesInput('');
                setIsEditing(true);
                setIsAddingCategory(false);
                setNewCategory('');
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
                  Rétablir les offres par défaut
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Supprimer le service"
        message="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmModal
        isOpen={showConfirmSeed}
        title="Rétablir les offres par défaut"
        message="Voulez-vous rétablir les offres par défaut ? Cela ajoutera les services de base."
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
              className="bg-white w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {currentService?.id ? 'Modifier le Service' : 'Nouveau Service'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom du Service</label>
                    <input
                      type="text"
                      required
                      value={currentService?.name || ''}
                      onChange={e => setCurrentService(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prix de Vente (FCFA)</label>
                    <input
                      type="number"
                      required
                      value={currentService?.price || ''}
                      onChange={e => setCurrentService(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Coût Estimé (FCFA)</label>
                    <input
                      type="number"
                      value={currentService?.cost || ''}
                      onChange={e => setCurrentService(prev => prev ? { ...prev, cost: Number(e.target.value) } : null)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Coût de revient..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                    <div className="space-y-2">
                      <select
                        value={isAddingCategory ? 'other' : (currentService?.category || 'digital')}
                        onChange={e => {
                          if (e.target.value === 'other') {
                            setIsAddingCategory(true);
                            setCurrentService(prev => prev ? { ...prev, category: '' } : null);
                          } else {
                            setIsAddingCategory(false);
                            setCurrentService(prev => prev ? { ...prev, category: e.target.value } : null);
                          }
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                        <option value="other">+ Nouvelle catégorie...</option>
                      </select>
                      
                      {isAddingCategory && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <input
                            type="text"
                            required
                            placeholder="Nom de la nouvelle catégorie..."
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-primary/30 focus:ring-2 focus:ring-primary/20 outline-none bg-primary/5"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sous-catégorie</label>
                    <select
                      value={(currentService as any)?.subCategory || ''}
                      onChange={e => setCurrentService(prev => prev ? { ...prev, subCategory: e.target.value } : null)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="">Sélectionner une sous-catégorie...</option>
                      {currentService?.category?.toLowerCase() === 'design' && (
                        <>
                          <option value="Identité & Branding">Identité & Branding</option>
                          <option value="Impression & Marquage">Impression & Marquage</option>
                          <option value="Signalétique">Signalétique</option>
                        </>
                      )}
                      {currentService?.category?.toLowerCase() === 'digital' && (
                        <>
                          <option value="Développement Logiciel">Développement Logiciel</option>
                          <option value="Web & Plateformes">Web & Plateformes</option>
                        </>
                      )}
                      <option value="Autres">Autres</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Description Courte (Page d'accueil)</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('shortDescription')}
                      disabled={isGenerating}
                      className="flex items-center text-[10px] font-bold text-primary hover:text-primary-dark transition-colors bg-primary/5 px-2 py-1 rounded-lg"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Générer avec IA
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Une seule phrase accrocheuse..."
                    value={currentService?.shortDescription || ''}
                    onChange={e => setCurrentService(prev => prev ? { ...prev, shortDescription: e.target.value } : null)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">S'affiche sur la carte du service en page d'accueil.</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Description Détaillée (Page Détails)</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('description')}
                      disabled={isGenerating}
                      className="flex items-center text-[10px] font-bold text-primary hover:text-primary-dark transition-colors bg-primary/5 px-2 py-1 rounded-lg"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Générer avec IA
                    </button>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={currentService?.description || ''}
                    onChange={e => setCurrentService(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">S'affiche sur la page de détails complète du service.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Photo de couverture</label>
                  <div className="space-y-3">
                    {currentService?.image && (
                      <div className="relative h-32 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <OptimizedImage src={currentService.image} alt="Preview" width={600} className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setCurrentService(prev => prev ? { ...prev, image: '' } : null)}
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
                          value={currentService?.image || ''}
                          onChange={e => setCurrentService(prev => prev ? { ...prev, image: e.target.value } : null)}
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Images additionnelles (Galerie)</label>
                  <div className="space-y-3">
                    {currentService?.additionalImages && currentService.additionalImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {currentService.additionalImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                            <OptimizedImage src={imgUrl} alt={`Gallery ${idx}`} width={200} className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 flex flex-col items-center justify-center px-4 py-4 bg-gray-50 text-gray-500 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">Ajouter des photos</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImageUpload}
                          disabled={uploading}
                        />
                      </label>
                      
                      <div className="flex-1">
                        <input
                          type="text"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const url = (e.target as HTMLInputElement).value;
                              if (url) {
                                setCurrentService(prev => prev ? { 
                                  ...prev, 
                                  additionalImages: [...(prev.additionalImages || []), url] 
                                } : null);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                          placeholder="Coller une URL et Entrée..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Caractéristiques (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={featuresInput}
                    onChange={e => setFeaturesInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Design Responsive, SEO, Support 24/7"
                  />
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary">Promotion</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={currentService?.promotion?.isActive || false}
                        onChange={e => setCurrentService(prev => prev ? {
                          ...prev,
                          promotion: {
                            ...(prev?.promotion || { discountPercentage: 0, startDate: '', endDate: '', isActive: false }),
                            isActive: e.target.checked
                          }
                        } : null)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-3 text-xs font-bold text-gray-700">Activer l'offre</span>
                    </label>
                  </div>

                  {currentService?.promotion?.isActive && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Remise (%)</label>
                        <select
                          value={currentService?.promotion?.discountPercentage || 0}
                          onChange={e => setCurrentService(prev => prev ? {
                            ...prev,
                            promotion: {
                              ...(prev?.promotion || { discountPercentage: 0, startDate: '', endDate: '', isActive: false }),
                              discountPercentage: Number(e.target.value)
                            }
                          } : null)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        >
                          <option value="0">0%</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                          <option value="20">20%</option>
                          <option value="25">25%</option>
                          <option value="30">30%</option>
                          <option value="40">40%</option>
                          <option value="50">50%</option>
                          <option value="60">60%</option>
                          <option value="75">75%</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Début</label>
                        <input
                          type="date"
                          value={currentService?.promotion?.startDate || ''}
                          onChange={e => setCurrentService(prev => prev ? {
                            ...prev,
                            promotion: {
                              ...(prev?.promotion || { discountPercentage: 0, startDate: '', endDate: '', isActive: false }),
                              startDate: e.target.value
                            }
                          } : null)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Fin</label>
                        <input
                          type="date"
                          value={currentService?.promotion?.endDate || ''}
                          onChange={e => setCurrentService(prev => prev ? {
                            ...prev,
                            promotion: {
                              ...(prev?.promotion || { discountPercentage: 0, startDate: '', endDate: '', isActive: false }),
                              endDate: e.target.value
                            }
                          } : null)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {currentService?.name && currentService?.description && (
                  <div className="pt-4 border-t border-gray-100">
                    <SEOAnalyzer type="service" content={currentService} />
                  </div>
                )}

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
                    disabled={uploading || isGenerating}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {uploading ? 'Chargement...' : 'Enregistrer'}
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

export default ServiceManager;
