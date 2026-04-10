import React, { useState, useMemo } from 'react';
import { BlogPost } from '../../types';
import { Plus, Edit2, Trash2, X, Save, FileText, Calendar, User, Upload, Loader2, Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSupabaseData, TableName } from '../../hooks/useSupabase';
import { dbService as db } from '../../services/dbService';
import { ai, getGeminiModel } from '../../lib/gemini';
import { compressImage, getOptimizedUrl } from '../../lib/imageUtils';
import { OptimizedImage } from '../OptimizedImage';

import { ConfirmModal } from './ConfirmModal';

import { SEOAnalyzer } from './SEOAnalyzer';

const BlogManager = () => {
  const postMapper = useMemo(() => (p: any) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    author: p.author,
    date: p.date,
    image: p.image,
    category: p.category,
    readTime: p.readTime
  }), []);

  const blogOptions = useMemo(() => ({
    tableName: 'blog_posts' as TableName,
    order: { column: 'date' as const, ascending: false },
    mapper: postMapper
  }), [postMapper]);

  const { data: posts, loading, error: fetchError, refresh } = useSupabaseData<BlogPost>(blogOptions);

  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [showConfirmSeed, setShowConfirmSeed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
      setCurrentPost(prev => prev ? { ...prev, image: compressedBase64 } : null);
      setUploading(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(`Erreur lors du chargement : ${error.message}`);
      setUploading(false);
    }
  };

  const handleGenerateAI = async (field: 'excerpt' | 'content') => {
    if (!currentPost?.title) {
      showNotification('error', "Veuillez d'abord saisir le titre de l'article.");
      return;
    }

    setIsGenerating(true);
    try {
      const model = getGeminiModel();
      const prompt = field === 'excerpt' 
        ? `Génère un court extrait accrocheur (environ 20-30 mots) pour un article de blog intitulé "${currentPost.title}" pour une agence digitale au Sénégal.`
        : `Génère le contenu complet d'un article de blog professionnel et informatif pour une agence digitale au Sénégal. Le titre est "${currentPost.title}". Utilise des balises HTML simples comme <p>, <h3>, <ul>, <li> pour structurer le texte. Réponds en français. Environ 300-400 mots.`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      const text = result.text;
      setCurrentPost(prev => prev ? { ...prev, [field]: text } : null);
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
    
    if (!currentPost?.title || !currentPost?.content || !currentPost?.author) {
      showNotification('error', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const postData = {
        ...currentPost,
        excerpt: currentPost.excerpt || '',
        date: currentPost.date || format(new Date(), 'd MMMM yyyy', { locale: fr }),
        category: currentPost.category || 'Général',
        readTime: currentPost.readTime || '5 min'
      };

      await db.blog.save(postData);
      showNotification('success', currentPost.id ? 'Article mis à jour !' : 'Article publié !');
      
      setIsEditing(false);
      setCurrentPost(null);
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      showNotification('error', `Erreur lors de l'enregistrement : ${error.message}`);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await db.blog.delete(id);
      showNotification('success', 'Article supprimé !');
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
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

  if (loading && posts.length === 0) return (
    <div className="p-12 text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
      <p className="text-gray-600 mb-4">Chargement des articles...</p>
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
        <h2 className="text-xl font-bold text-gray-900">Gestion du Blog</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfirmSeed(true)}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Rétablir les articles par défaut"
          >
            <Database className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Rétablir</span>
          </button>
          <button
            onClick={() => {
              setCurrentPost({ category: 'Technologie', author: 'Acom Technologie', readTime: '5 min' });
              setIsEditing(true);
            }}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm group relative">
            <div className="relative h-40 mb-4 rounded-xl overflow-hidden bg-gray-100">
              {post.image ? (
                <OptimizedImage src={post.image} alt={post.title} width={500} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FileText className="w-8 h-8" />
                </div>
              )}
              {/* Actions buttons - Always visible on mobile, hover on desktop */}
              <div className="absolute top-2 right-2 flex space-x-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setCurrentPost(post);
                    setIsEditing(true);
                  }}
                  className="p-2 bg-white/95 backdrop-blur shadow-lg rounded-lg text-gray-600 hover:text-primary transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(post.id)}
                  className="p-2 bg-white/95 backdrop-blur shadow-lg rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 line-clamp-2">{post.title}</h3>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {post.date}
              </div>
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {post.author}
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun article trouvé dans la base de données</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Votre base de données est vide. Vous pouvez rédiger un article manuellement ou rétablir les articles par défaut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                setCurrentPost({ category: 'Technologie', author: 'Acom Technologie', readTime: '5 min' });
                setIsEditing(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Rédiger manuellement
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
                  Rétablir les articles par défaut
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Supprimer l'article"
        message="Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible."
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmModal
        isOpen={showConfirmSeed}
        title="Rétablir les articles par défaut"
        message="Voulez-vous rétablir les articles par défaut ? Cela ajoutera les articles de base."
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
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {currentPost?.id ? 'Modifier l\'Article' : 'Nouvel Article'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Titre de l'article</label>
                    <input
                      type="text"
                      required
                      value={currentPost?.title || ''}
                      onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Auteur</label>
                    <input
                      type="text"
                      required
                      value={currentPost?.author || ''}
                      onChange={e => setCurrentPost({ ...currentPost, author: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                    <input
                      type="text"
                      required
                      value={currentPost?.category || ''}
                      onChange={e => setCurrentPost({ ...currentPost, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Extrait (Excerpt)</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('excerpt')}
                      disabled={isGenerating}
                      className="flex items-center text-[10px] font-bold text-primary hover:text-primary-dark transition-colors bg-primary/5 px-2 py-1 rounded-lg"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Générer avec IA
                    </button>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={currentPost?.excerpt || ''}
                    onChange={e => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Contenu (HTML supporté)</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAI('content')}
                      disabled={isGenerating}
                      className="flex items-center text-[10px] font-bold text-primary hover:text-primary-dark transition-colors bg-primary/5 px-2 py-1 rounded-lg"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Générer avec IA
                    </button>
                  </div>
                  <textarea
                    required
                    rows={8}
                    value={currentPost?.content || ''}
                    onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none font-mono text-sm"
                    placeholder="<p>Votre contenu ici...</p>"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Photo de couverture</label>
                    <div className="space-y-3">
                      {currentPost?.image && (
                        <div className="relative h-40 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                          <OptimizedImage src={currentPost.image} alt="Preview" width={800} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCurrentPost(prev => prev ? { ...prev, image: '' } : null)}
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
                            value={currentPost?.image || ''}
                            onChange={e => setCurrentPost({ ...currentPost, image: e.target.value })}
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
                    <label className="block text-sm font-bold text-gray-700 mb-1">Temps de lecture (ex: 5 min)</label>
                    <input
                      type="text"
                      value={currentPost?.readTime || ''}
                      onChange={e => setCurrentPost({ ...currentPost, readTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                {currentPost?.title && currentPost?.content && (
                  <div className="pt-4 border-t border-gray-100">
                    <SEOAnalyzer type="blog" content={currentPost} />
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

export default BlogManager;
