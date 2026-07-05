import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../db/db';
import { Merchant } from '../../../types';
import { PressingTicket, PressingTarifs, PressingClosure, DetergentSale } from '../types';
import { OptimizedImage } from '../../../components/OptimizedImage';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { dbService } from '../../../services/dbService';
import { AcomAlertPopup } from '../../../components/AcomAlertPopup';
import { 
    Save, X, Loader2, Trash2, Printer, Search, 
    Filter, FileText, Check, DollarSign, Clock,
    WashingMachine, Calculator, Upload, Plus, Sparkles
} from 'lucide-react';

const ARTICLE_IMAGES: Record<string, string> = {
  veste: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=150&q=80",
  pantalon: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=150&q=80",
  chemise: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=150&q=80",
  robe: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=150&q=80",
  costume: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=150&q=80",
  blouson: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=150&q=80",
  manteau: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
  pull: "https://images.unsplash.com/photo-1574164904299-3a102b110380?auto=format&fit=crop&w=150&q=80",
  couverture: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=150&q=80",
  rideau: "https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=150&q=80",
  drap: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=150&q=80",
  other: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=150&q=80"
};

const compressAndSetImage = (file: File, onCompressed: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 300;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        onCompressed(compressedBase64);
      } else {
        onCompressed(e.target?.result as string);
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const DEFAULT_TARIFS: PressingTarifs = {
    articles: {},
    poids: {},
    supplements: {},
    articles_costs: {},
    poids_costs: {},
    supplements_costs: {},
    articles_images: {}
};

export const PressingTarifsManager = ({ merchant }: { merchant: Merchant }) => {
  const [tarifs, setTarifs] = useState<PressingTarifs>(() => {
    const saved = localStorage.getItem(`pressing_tarifs_${merchant.id}`);
    const parsed = saved ? JSON.parse(saved) : DEFAULT_TARIFS;
    if (!parsed.supplements) {
      parsed.supplements = { ...DEFAULT_TARIFS.supplements };
    }
    if (!parsed.articles_costs) {
      parsed.articles_costs = { ...DEFAULT_TARIFS.articles_costs };
    }
    if (!parsed.poids_costs) {
      parsed.poids_costs = { ...DEFAULT_TARIFS.poids_costs };
    }
    if (!parsed.supplements_costs) {
      parsed.supplements_costs = { ...DEFAULT_TARIFS.supplements_costs };
    }
    if (!parsed.articles_images) {
      parsed.articles_images = {};
    }
    return parsed;
  });

  const [syncing, setSyncing] = useState(false);

  // Unified pop-up state
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    message: '',
    type: 'info'
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    onConfirm?: () => void,
    showCancel?: boolean,
    confirmText: string = "D'ACCORD",
    subtitle: string = 'ALERTE SYSTÈME'
  ) => {
    setPopup({
      isOpen: true,
      title,
      subtitle,
      message,
      type,
      onConfirm: onConfirm ? () => {
        onConfirm();
        setPopup(prev => ({ ...prev, isOpen: false }));
      } : undefined,
      showCancel,
      confirmText
    });
  };


  // States for adding dynamic items
  const [newArticleName, setNewArticleName] = useState('');
  const [newArticlePrice, setNewArticlePrice] = useState<number | ''>('');
  const [newArticleCost, setNewArticleCost] = useState<number | ''>('');
  const [newArticleImage, setNewArticleImage] = useState('');
  const [showAddArticle, setShowAddArticle] = useState(false);

  const [newPoidsName, setNewPoidsName] = useState('');
  const [newPoidsPrice, setNewPoidsPrice] = useState<number | ''>('');
  const [newPoidsCost, setNewPoidsCost] = useState<number | ''>('');
  const [showAddPoids, setShowAddPoids] = useState(false);

  const [newSupplementName, setNewSupplementName] = useState('');
  const [newSupplementDesc, setNewSupplementDesc] = useState('');
  const [newSupplementPrice, setNewSupplementPrice] = useState<number | ''>('');
  const [newSupplementCost, setNewSupplementCost] = useState<number | ''>('');
  const [showAddSupplement, setShowAddSupplement] = useState(false);

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticleName.trim()) {
      showAlert('Vêtement manquant', 'Veuillez spécifier le nom du vêtement.', 'error');
      return;
    }
    const nameKey = newArticleName.trim().toLowerCase();
    const price = typeof newArticlePrice === 'number' ? newArticlePrice : 0;
    const cost = typeof newArticleCost === 'number' ? newArticleCost : 0;

    if (tarifs.articles[nameKey] !== undefined) {
      showAlert('Article existant', "Cet article existe déjà dans votre grille tarifaire.", 'error');
      return;
    }

    setTarifs(prev => ({
      ...prev,
      articles: {
        ...prev.articles,
        [nameKey]: price
      },
      articles_costs: {
        ...(prev.articles_costs || {}),
        [nameKey]: cost
      },
      articles_images: {
        ...(prev.articles_images || {}),
        [nameKey]: newArticleImage
      }
    }));

    setNewArticleName('');
    setNewArticlePrice('');
    setNewArticleCost('');
    setNewArticleImage('');
    setShowAddArticle(false);
    showAlert('Félicitations !', 'Nouvel article ajouté financièrement ! Cliquez sur Enregistrer pour confirmer.', 'success', undefined, false, "D'ACCORD", "AJOUT CAPTURE");
  };

  const handleAddPoids = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoidsName.trim()) {
      showAlert('Nom manquant', 'Veuillez spécifier le nom du forfait ou formule.', 'error');
      return;
    }
    const poidsKey = newPoidsName.trim().toLowerCase();
    const price = typeof newPoidsPrice === 'number' ? newPoidsPrice : 0;
    const cost = typeof newPoidsCost === 'number' ? newPoidsCost : 0;

    if (tarifs.poids[poidsKey] !== undefined) {
      showAlert('Formule existante', 'Cette formule Kg existe déjà.', 'error');
      return;
    }

    setTarifs(prev => ({
      ...prev,
      poids: {
        ...prev.poids,
        [poidsKey]: price
      },
      poids_costs: {
        ...(prev.poids_costs || {}),
        [poidsKey]: cost
      }
    }));

    setNewPoidsName('');
    setNewPoidsPrice('');
    setNewPoidsCost('');
    setShowAddPoids(false);
    showAlert('Félicitations !', 'Nouveau forfait Kg ajouté financièrement ! Cliquez sur Enregistrer pour confirmer.', 'success', undefined, false, "D'ACCORD", "AJOUT CAPTURE");
  };

  const handleRemoveArticle = (key: string) => {
    showAlert(
      'Supprimer un article ?',
      `Attention : Vous allez retirer temporairement l'article "${key}" de votre grille.\nCliquez sur Enregistrer pour confirmer définitivement.`,
      'warning',
      () => {
        const updatedArticles = { ...tarifs.articles };
        delete updatedArticles[key];
        const updatedCosts = { ...tarifs.articles_costs };
        delete updatedCosts[key];
        setTarifs(prev => ({
          ...prev,
          articles: updatedArticles,
          articles_costs: updatedCosts
        }));
        showAlert('Retiré !', "L'article a été retiré de la grille temporaire.", 'success');
      },
      true,
      'SUPPRIMER'
    );
  };

  const handleRemovePoids = (key: string) => {
    showAlert(
      'Supprimer un forfait ?',
      `Attention : Vous allez retirer temporairement la formule Kg "${key}" de votre grille.\nCliquez sur Enregistrer pour confirmer définitivement.`,
      'warning',
      () => {
        const updatedPoids = { ...tarifs.poids };
        delete updatedPoids[key];
        const updatedCosts = { ...tarifs.poids_costs };
        delete updatedCosts[key];
        setTarifs(prev => ({
          ...prev,
          poids: updatedPoids,
          poids_costs: updatedCosts
        }));
        showAlert('Retiré !', "La formule de lavage a été retirée de la grille.", 'success');
      },
      true,
      'SUPPRIMER'
    );
  };

  const handleAddSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplementName.trim()) {
      showAlert('Prestation manquante', 'Veuillez spécifier le nom de la prestation optionnelle.', 'error');
      return;
    }
    const rawName = newSupplementName.trim();
    const key = rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    
    if (!key) {
      showAlert('Nom non valide', "Le nom de la prestation contient des caractères non autorisés.", 'error');
      return;
    }

    const currentSupplements = tarifs.supplements || DEFAULT_TARIFS.supplements || {};
    if (currentSupplements[key] !== undefined) {
      showAlert('Prestation existante', "Cette prestation optionnelle existe déjà.", 'error');
      return;
    }

    const price = typeof newSupplementPrice === 'number' ? newSupplementPrice : 0;
    const cost = typeof newSupplementCost === 'number' ? newSupplementCost : 0;
    const desc = newSupplementDesc.trim() || 'Prestation optionnelle complémentaire';

    setTarifs(prev => ({
      ...prev,
      supplements: {
        ...(prev.supplements || DEFAULT_TARIFS.supplements || {}),
        [key]: price
      },
      supplements_labels: {
        ...prev.supplements_labels,
        [key]: desc
      },
      supplements_display_names: {
        ...(prev as any).supplements_display_names,
        [key]: rawName
      },
      supplements_costs: {
        ...(prev.supplements_costs || {}),
        [key]: cost
      }
    }));

    setNewSupplementName('');
    setNewSupplementDesc('');
    setNewSupplementPrice('');
    setNewSupplementCost('');
    setShowAddSupplement(false);
    showAlert('Félicitations !', 'Nouvelle prestation optionnelle ajoutée financièrement ! Cliquez sur Enregistrer pour confirmer.', 'success', undefined, false, "D'ACCORD", "AJOUT CAPTURE");
  };

  const handleRemoveSupplement = (key: string) => {
    showAlert(
      'Supprimer une prestation ?',
      `Attention : Vous allez retirer la prestation optionnelle "${key}" de votre grille.\nCliquez sur Enregistrer pour confirmer définitivement.`,
      'warning',
      () => {
        const updatedSupplements = { ...(tarifs.supplements || DEFAULT_TARIFS.supplements || {}) };
        delete updatedSupplements[key];
        const updatedLabels = { ...tarifs.supplements_labels };
        delete updatedLabels[key];
        setTarifs(prev => ({
          ...prev,
          supplements: updatedSupplements,
          supplements_labels: updatedLabels
        }));
        showAlert('Retirée !', "La prestation optionnelle a été retirée de la grille temporaire.", 'success');
      },
      true,
      'SUPPRIMER'
    );
  };

  const handleSave = async () => {
    setSyncing(true);
    try {
      localStorage.setItem(`pressing_tarifs_${merchant.id}`, JSON.stringify(tarifs));
      
      // Auto-sync these articles as products so AcomZone clients can see them
      const articleNames: Record<string, string> = {
        chemise: 'Chemise', pantalon: 'Pantalon', costume: 'Costume',
        robe: 'Robe', drap: 'Drap', couverture: 'Couverture',
        rideau: 'Rideau', autre: 'Autre (Pièce)'
      };

      const promises = Object.entries(tarifs.articles).map(([key, price]) => {
        return dbService.merchantProducts.save({
          id: `press_art_${key}_${merchant.id}`,
          merchantId: merchant.id,
          name: articleNames[key] || key.charAt(0).toUpperCase() + key.slice(1),
          price: price,
          category: 'Pressing & Nettoyage',
          description: `Service de nettoyage et repassage professionnel pour ${articleNames[key] || key}.`,
          stockQuantity: 999, // infinite
          images: ["https://images.unsplash.com/photo-1545155998-20bedb51d206?auto=format&fit=crop&w=600&q=80"]
        } as any);
      });

      const weightProducts = Object.entries(tarifs.poids).map(([key, price]) => {
        const weightNames: Record<string, string> = {
          standard: 'Lavage au Poids (Standard) - Par Kg',
          premium: 'Lavage au Poids (Premium) - Par Kg',
          express: 'Lavage au Poids (Express) - Par Kg'
        };
        return dbService.merchantProducts.save({
          id: `press_poids_${key}_${merchant.id}`,
          merchantId: merchant.id,
          name: weightNames[key] || `Lavage au poids (${key.charAt(0).toUpperCase() + key.slice(1)})`,
          price: price,
          category: 'Service au Kilo',
          description: `Tarification au kilo pour le nettoyage en mode ${key}.`,
          stockQuantity: 999,
          images: ["https://images.unsplash.com/photo-1545155998-20bedb51d206?auto=format&fit=crop&w=600&q=80"]
        } as any);
      });

      await Promise.all([...promises, ...weightProducts]);

      showAlert('Enregistrement Réussi', 'Les tarifs de pressing et prestations optionnelles ont été sauvegardés avec succès !', 'success', undefined, false, "D'ACCORD", "SAAS PRESSING");
    } catch (e) {
      showAlert('Erreur de sauvegarde', 'Erreur lors de la synchronisation de vos tarifs.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-[#faf5ff] text-[#5c2197] rounded-2xl border border-purple-100 flex items-center justify-center">
            <WashingMachine className="w-7 h-7 animate-pulse" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-ink tracking-tight">
              Paramétrage des Tarifs
            </h2>
            <p className="text-gray-500 text-xs mt-1">Définissez vos grilles tarifaires par article ou par kilo (Kg).</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={syncing}
          className="px-6 py-3 bg-[#5c2197] hover:bg-[#481977] text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-900/10 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Enregistrer les Tarifs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Article Billing */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6 flex flex-col justify-between overflow-hidden">
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-black text-ink flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#5c2197]" /> Tarifs par Article (Vêtements)
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">Tarifs unitaires et coûts intrants appliqués lors du dépôt de vêtements individuels.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(tarifs.articles).map((key) => {
                const typedKey = key as keyof typeof tarifs.articles;
                return (
                  <div key={key} className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 flex flex-col gap-2 relative group transition-all hover:shadow-sm">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 max-w-[75%]">
                        <div className="relative group/img flex-shrink-0">
                          <img 
                            src={tarifs.articles_images?.[key] || tarifs.articles_images?.[key.toLowerCase()] || ARTICLE_IMAGES[key.toLowerCase()] || ARTICLE_IMAGES['autre']} 
                            alt={key}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover border border-purple-100/60 shadow-3xs bg-slate-100"
                          />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity">
                            <span className="text-[7.5px] text-white font-bold uppercase tracking-wider">Joindre</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setTarifs(prev => ({
                                      ...prev,
                                      articles_images: {
                                        ...(prev.articles_images || {}),
                                        [key]: base64
                                      }
                                    }));
                                  });
                                }
                              }}
                            />
                          </label>
                          {tarifs.articles_images?.[key] && (
                            <button
                              type="button"
                              onClick={() => {
                                setTarifs(prev => {
                                  const updated = { ...(prev.articles_images || {}) };
                                  delete updated[key];
                                  return { ...prev, articles_images: updated };
                                });
                              }}
                              className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 shadow-md active:scale-95 transition-all border border-white"
                              title="Restaurer l'image par défaut"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <span className="font-bold text-xs text-ink uppercase tracking-wider capitalize truncate">{key}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveArticle(key)}
                        className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                        title="Détruire cette ligne d'article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Prix Public */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={tarifs.articles[typedKey]}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setTarifs({
                            ...tarifs,
                            articles: { ...tarifs.articles, [key]: val }
                          });
                        }}
                        className="w-full pl-4 pr-16 py-2 bg-white rounded-xl border border-gray-200 text-right font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-[#5c2197]/20"
                      />
                      <span className="absolute right-4 text-[9px] font-mono font-bold text-gray-400">Prix</span>
                    </div>

                    {/* Coût Intrant */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={tarifs.articles_costs?.[typedKey] !== undefined ? tarifs.articles_costs[typedKey] : (DEFAULT_TARIFS.articles_costs || {} as any)[typedKey] || 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setTarifs({
                            ...tarifs,
                            articles_costs: { ...(tarifs.articles_costs || {}), [key]: val }
                          });
                        }}
                        className="w-full pl-4 pr-16 py-2 bg-white rounded-xl border border-dashed border-gray-200 text-right font-mono font-medium text-xs text-[#5c2197] outline-none focus:ring-1 focus:ring-purple-300 shadow-inner"
                      />
                      <span className="absolute right-4 text-[9px] font-mono font-bold text-purple-400">Intrant</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-100 mt-6">
            {showAddArticle ? (
              <form onSubmit={handleAddArticle} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-200/60 space-y-4">
                <span className="text-[10px] uppercase tracking-widest text-[#5c2197] font-bold block">➕ Nouvel Article de Vêtements</span>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100">
                  <div className="relative w-16 h-16 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group/newimg flex-shrink-0">
                    {newArticleImage ? (
                      <>
                        <img src={newArticleImage} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewArticleImage('')}
                          className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm hover:scale-105 transition"
                          title="Supprimer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center p-1 cursor-pointer w-full h-full justify-center">
                        <Upload className="w-4 h-4 text-gray-400 group-hover/newimg:text-primary transition" />
                        <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Joindre</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setNewArticleImage(base64);
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nom du vêtement</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Sac"
                        value={newArticleName}
                        onChange={e => setNewArticleName(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold font-sans text-ink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prix Client (FCFA)</label>
                      <input
                        type="number"
                        required
                        placeholder="ex: 1500"
                        value={newArticlePrice}
                        onChange={e => setNewArticlePrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono text-xs font-bold text-ink text-right pr-4 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Coût Intrant (FCFA)</label>
                      <input
                        type="number"
                        placeholder="ex: 200"
                        value={newArticleCost}
                        onChange={e => setNewArticleCost(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-dashed border-purple-200 font-mono text-xs text-[#5c2197] text-right pr-4 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowAddArticle(false); setNewArticleName(''); setNewArticlePrice(''); setNewArticleCost(''); setNewArticleImage(''); }}
                    className="px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-[10px] font-bold text-white bg-[#5c2197] hover:bg-[#481977] rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddArticle(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-purple-400/55 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-gray-500 hover:text-[#5c2197] transition-all bg-gray-50/10 hover:bg-purple-500/5 pb-4"
              >
                <Plus className="w-4 h-4 text-[#5c2197]" /> AJOUTER UN NOUVEL ARTICLE
              </button>
            )}
          </div>
        </div>

        {/* Weight Billing (Kg) */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-black text-ink flex items-center gap-2">
                <WashingMachine className="w-5 h-5 text-purple-600" /> Tarifs au Kilogramme (Kg)
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">Recommandé pour les sacs de linge en vrac, laverie standard et blanchisseries.</p>
            </div>

            <div className="space-y-4">
              {Object.keys(tarifs.poids).map((key) => {
                const typedKey = key as keyof typeof tarifs.poids;
                const labels: { [key: string]: string } = {
                  standard: 'Lavage Standard',
                  premium: 'Lavage Premium / Délicat',
                  express: 'Lavage Express 24h'
                };
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100/50 gap-4 relative group transition-all hover:shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink block capitalize truncate max-w-[200px]">{labels[key] || key}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePoids(key)}
                          className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Détruire ce forfait kilo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400">Prise en charge professionnelle</span>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full sm:w-48 shrink-0">
                      {/* Prix Kg */}
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={tarifs.poids[typedKey]}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setTarifs({
                              ...tarifs,
                              poids: { ...tarifs.poids, [key]: val }
                            });
                          }}
                          className="w-full pl-4 pr-20 py-2 bg-white rounded-xl border border-gray-200 text-right font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-[#5c2197]/20"
                        />
                        <span className="absolute right-4 text-[9px] font-mono font-bold text-gray-400">FCFA/Kg</span>
                      </div>

                      {/* Coût Intrant Kg */}
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={tarifs.poids_costs?.[typedKey] !== undefined ? tarifs.poids_costs[typedKey] : (DEFAULT_TARIFS.poids_costs || {} as any)[typedKey] || 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setTarifs({
                              ...tarifs,
                              poids_costs: { ...(tarifs.poids_costs || {}), [key]: val }
                            });
                          }}
                          className="w-full pl-4 pr-20 py-2 bg-white rounded-xl border border-dashed border-gray-200 text-right font-mono font-medium text-xs text-[#5c2197] outline-none focus:ring-1 focus:ring-purple-300 shadow-inner"
                        />
                        <span className="absolute right-4 text-[9px] font-mono font-bold text-purple-400">Intrant</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-100 mt-6">
            {showAddPoids ? (
              <form onSubmit={handleAddPoids} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-200/60 space-y-4">
                <span className="text-[10px] uppercase tracking-widest text-[#5c2197] font-bold block">➕ Nouveau Forfait / Formule Kilogramme</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Désignation (ex: Express 12h)</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Lavage Ultra-Rapide, Literie"
                      value={newPoidsName}
                      onChange={e => setNewPoidsName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold font-sans text-ink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prix par Kilo (FCFA/Kg)</label>
                    <input
                      type="number"
                      required
                      placeholder="ex: 1200"
                      value={newPoidsPrice}
                      onChange={e => setNewPoidsPrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono text-xs font-bold text-ink text-right pr-4 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Coût par Kilo (FCFA/Kg)</label>
                    <input
                      type="number"
                      placeholder="ex: 300"
                      value={newPoidsCost}
                      onChange={e => setNewPoidsCost(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-dashed border-purple-200 font-mono text-xs text-[#5c2197] text-right pr-4 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowAddPoids(false); setNewPoidsName(''); setNewPoidsPrice(''); setNewPoidsCost(''); }}
                    className="px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-[10px] font-bold text-white bg-[#5c2197] hover:bg-[#481977] rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddPoids(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-purple-400/55 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-gray-500 hover:text-[#5c2197] transition-all bg-gray-50/10 hover:bg-purple-500/5 pb-4"
              >
                <Plus className="w-4 h-4 text-[#5c2197]" /> AJOUTER UN FORFAIT KG
              </button>
            )}
          </div>
        </div>

        {/* Supplements Billing (Prestations Optionnelles) */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6 lg:col-span-2">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-ink flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Tarifs des Prestations Optionnelles (Suppléments)
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">Services complémentaires applicables en supplément de la prestation de base d'un dépôt.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(tarifs.supplements || DEFAULT_TARIFS.supplements || {}).map((key) => {
              const labels: Record<string, string> = {
                repassage: 'Repassage seul / repassage sup',
                express: 'Traitement Express (Urgent)',
                detachage: 'Détachage Ciblé',
                livraison: 'Livraison à Domicile',
                premiumPack: 'Emballage Premium / cintre'
              };
              const displayNames: Record<string, string> = {
                repassage: 'Repassage',
                express: 'Express / Urgent',
                detachage: 'Détachage',
                livraison: 'Livraison',
                premiumPack: 'Pack Premium cintre'
              };

              const displayName = (tarifs as any).supplements_display_names?.[key] || displayNames[key] || key;
              const description = tarifs.supplements_labels?.[key] || labels[key] || 'Prestation optionnelle complémentaire';

              return (
                <div key={key} className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 flex flex-col gap-2 relative group transition-all hover:shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-ink uppercase tracking-wider capitalize truncate pr-4">{displayName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplement(key)}
                      className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Supprimer cette prestation optionnelle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight pr-6 min-h-[20px]">{description}</p>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {/* Prix Client */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={tarifs.supplements?.[key] !== undefined ? tarifs.supplements[key] : (DEFAULT_TARIFS.supplements as any)[key]}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setTarifs({
                            ...tarifs,
                            supplements: {
                              ...(tarifs.supplements || DEFAULT_TARIFS.supplements || {}),
                              [key]: val
                            }
                          });
                        }}
                        className="w-full pl-4 pr-16 py-2 bg-white rounded-xl border border-gray-200 text-right font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-[#5c2197]/20"
                      />
                      <span className="absolute right-4 text-[9px] font-mono font-bold text-gray-400">Prix</span>
                    </div>

                    {/* Coût Intrant */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={tarifs.supplements_costs?.[key] !== undefined ? tarifs.supplements_costs[key] : (DEFAULT_TARIFS.supplements_costs || {} as any)[key] || 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setTarifs({
                            ...tarifs,
                            supplements_costs: {
                              ...(tarifs.supplements_costs || {}),
                              [key]: val
                            }
                          });
                        }}
                        className="w-full pl-4 pr-16 py-2 bg-white rounded-xl border border-dashed border-gray-200 text-right font-mono font-medium text-xs text-[#5c2197] outline-none focus:ring-1 focus:ring-purple-300 shadow-inner"
                      />
                      <span className="absolute right-4 text-[9px] font-mono font-bold text-purple-400">Intrant</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-dashed border-gray-100 mt-6">
            {showAddSupplement ? (
              <form onSubmit={handleAddSupplement} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-200/60 space-y-4">
                <span className="text-[10px] uppercase tracking-widest text-[#5c2197] font-bold block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin-slow text-[#5c2197]" /> Nouvelle Prestation Optionnelle (Supplément)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nom du service</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Parfumage, Pliage sous vide"
                      value={newSupplementName}
                      onChange={e => setNewSupplementName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold font-sans text-ink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description / Détails</label>
                    <input
                      type="text"
                      placeholder="ex: Parfum de luxe"
                      value={newSupplementDesc}
                      onChange={e => setNewSupplementDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold font-sans text-ink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tarif Supplément (FCFA)</label>
                    <input
                      type="number"
                      required
                      placeholder="ex: 500"
                      value={newSupplementPrice}
                      onChange={e => setNewSupplementPrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono text-xs font-bold text-ink text-right pr-4 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Coût Intrant (FCFA)</label>
                    <input
                      type="number"
                      placeholder="ex: 100"
                      value={newSupplementCost}
                      onChange={e => setNewSupplementCost(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-dashed border-purple-200 font-mono text-xs text-[#5c2197] text-right pr-4 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowAddSupplement(false); setNewSupplementName(''); setNewSupplementDesc(''); setNewSupplementPrice(''); setNewSupplementCost(''); }}
                    className="px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-[10px] font-bold text-white bg-[#5c2197] hover:bg-[#481977] rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddSupplement(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-purple-400/55 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-gray-500 hover:text-[#5c2197] transition-all bg-gray-50/10 hover:bg-[#5c2197]/5 pb-4"
              >
                <Plus className="w-4 h-4 text-[#5c2197]" /> AJOUTER UNE PRESTATION OPTIONNELLE
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Modern custom Alert Popup for all messages and notifications in tariffs */}
      <AcomAlertPopup
        isOpen={popup.isOpen}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
        {...popup}
      />
    </motion.div>
  );
};