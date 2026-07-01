import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Image as ImageIcon, Scissors, Sparkles, Heart, Palette, 
  Trash2, Edit, Save, Share2, ArrowLeft, Filter, FolderHeart, Info, 
  Clock, Check, RefreshCw, X, Eye, HelpCircle, Layers, MapPin, 
  ChevronRight, Calendar, DollarSign, Download, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';

// Interfaces
interface Merchant {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  currency?: string;
}

interface GalleryModel {
  id: string;
  title: string;
  description: string;
  priceMin: number;
  priceMax: number;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  fabricType: string;
  yardageNeeded: string;
  estimatedDays: number;
  imageUrl: string;
  tags: string[];
  createdAt: string;
}

interface Moodboard {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  modelIds: string[]; // Pinned model IDs
  createdAt: string;
}

interface TailleurGalleryManagerProps {
  merchant: Merchant;
}

// Beautiful Default Models to prevent empty slate
const DEFAULT_MODELS: GalleryModel[] = [
  {
    id: 'def-1',
    title: 'Grand Boubou Brodé d\'Apparat',
    description: 'Grand boubou sénégalais traditionnel pour homme ou femme en Basin riche de premier choix, agrémenté de broderies géométriques dorées raffinées sur l\'encolure, le buste et les manches.',
    priceMin: 75000,
    priceMax: 150000,
    difficulty: 'Difficile',
    fabricType: 'Basin',
    yardageNeeded: '4.5 à 5 mètres',
    estimatedDays: 10,
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000',
    tags: ['Traditionnel', 'Mariage', 'Basin', 'Broderie Haute Couture'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'def-2',
    title: 'Robe Sirène Moderne en Wax',
    description: 'Robe de soirée ajustée style sirène avec manches gigot volumineuses et col bateau. Panneaux de Wax contrastés agencés de façon symétrique pour structurer et affiner la silhouette.',
    priceMin: 30000,
    priceMax: 55000,
    difficulty: 'Moyen',
    fabricType: 'Wax',
    yardageNeeded: '3 à 3.5 mètres (2 pagnes)',
    estimatedDays: 5,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000',
    tags: ['Wax', 'Moderne', 'Soirée', 'Ajusté'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'def-3',
    title: 'Kaftan Fluide avec Filigrane de Soie',
    description: 'Kaftan moderne ample et ultra-confortable en crêpe de soie légère. Décorations de sfifa délicates tissées main le long de l\'ouverture centrale et des poignets. Idéal pour les fêtes estivales.',
    priceMin: 45000,
    priceMax: 85000,
    difficulty: 'Facile',
    fabricType: 'Crêpe de Soie',
    yardageNeeded: '3.5 mètres',
    estimatedDays: 3,
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=1000',
    tags: ['Kaftan', 'Fluide', 'Chic', 'Soie'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'def-4',
    title: 'Ensemble Tailleur Veste Croisée & Cigarette',
    description: 'Ensemble moderne comprenant une veste croisée cintrée à double boutonnage et un pantalon cigarette 7/8e ajusté, le tout confectionné dans un imprimé Wax géométrique éclatant.',
    priceMin: 40000,
    priceMax: 70000,
    difficulty: 'Difficile',
    fabricType: 'Wax',
    yardageNeeded: '4 mètres',
    estimatedDays: 7,
    imageUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=1000',
    tags: ['Wax', 'Professionnel', 'Ensemble', 'Cintré'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'def-5',
    title: 'Robe Fourreau en Dentelle & Satin Doux',
    description: 'Robe de cocktail sophistiquée combinant un bustier doublé de dentelle fine florale noire et une jupe fourreau drapée en satin de soie lourd à haute brillance.',
    priceMin: 55000,
    priceMax: 95000,
    difficulty: 'Difficile',
    fabricType: 'Dentelle & Satin',
    yardageNeeded: '2m Dentelle + 2.5m Satin',
    estimatedDays: 8,
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000',
    tags: ['Dentelle', 'Satin', 'Soirée', 'Prestige'],
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_MOODBOARDS: Moodboard[] = [
  {
    id: 'mb-1',
    name: 'Collection Célébrations Tabaski 2026',
    description: 'Inspirations et coupes haut de gamme pour la fête de la Tabaski, mêlant Basin brodé traditionnel et kaftans légers de prestige.',
    coverImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000',
    modelIds: ['def-1', 'def-3'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'mb-2',
    name: 'Tendances Wax Urbaines',
    description: 'Coupes modernes et tenues de bureau élégantes structurées avec des motifs de Wax vibrants et des finitions soignées.',
    coverImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000',
    modelIds: ['def-2', 'def-4'],
    createdAt: new Date().toISOString()
  }
];

export const TailleurGalleryManager = ({ merchant }: TailleurGalleryManagerProps) => {
  // State
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'moodboards' | 'ai_assistant'>('catalog');
  const [models, setModels] = useState<GalleryModel[]>([]);
  const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
  
  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedFabric, setSelectedFabric] = useState<string>('all');
  const [selectedMoodboardId, setSelectedMoodboardId] = useState<string | null>(null);
  
  // Modals state
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<GalleryModel | null>(null);
  const [isMoodboardModalOpen, setIsMoodboardModalOpen] = useState(false);
  const [editingMoodboard, setEditingMoodboard] = useState<Moodboard | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingMoodboard, setSharingMoodboard] = useState<Moodboard | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinningModelId, setPinningModelId] = useState<string | null>(null);

  // Model Form Fields
  const [modelTitle, setModelTitle] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  const [modelPriceMin, setModelPriceMin] = useState(15000);
  const [modelPriceMax, setModelPriceMax] = useState(35000);
  const [modelDifficulty, setModelDifficulty] = useState<'Facile' | 'Moyen' | 'Difficile'>('Moyen');
  const [modelFabricType, setModelFabricType] = useState('Wax');
  const [modelYardage, setModelYardage] = useState('3 mètres');
  const [modelEstimatedDays, setModelEstimatedDays] = useState(4);
  const [modelImageUrl, setModelImageUrl] = useState('');
  const [modelTagsInput, setModelTagsInput] = useState('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const handleImageFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP, etc.).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setModelImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Moodboard Form Fields
  const [moodboardName, setMoodboardName] = useState('');
  const [moodboardDesc, setMoodboardDesc] = useState('');
  const [moodboardCoverUrl, setMoodboardCoverUrl] = useState('');

  // AI Assistant States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTargetClient, setAiTargetClient] = useState('');
  const [aiTargetEvent, setAiTargetEvent] = useState('Tabaski');
  const [aiPreferredFabric, setAiPreferredFabric] = useState('Wax');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string, title?: string, subtitle?: string, details?: any } | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isSharingModelId, setIsSharingModelId] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    // Gallery Models
    const savedModels = localStorage.getItem(`tailleur_gallery_models_${merchant.id}`);
    if (savedModels) {
      try {
        setModels(JSON.parse(savedModels));
      } catch (e) {
        setModels(DEFAULT_MODELS);
      }
    } else {
      setModels(DEFAULT_MODELS);
      localStorage.setItem(`tailleur_gallery_models_${merchant.id}`, JSON.stringify(DEFAULT_MODELS));
    }

    // Moodboards
    const savedMoodboards = localStorage.getItem(`tailleur_gallery_moodboards_${merchant.id}`);
    if (savedMoodboards) {
      try {
        setMoodboards(JSON.parse(savedMoodboards));
      } catch (e) {
        setMoodboards(DEFAULT_MOODBOARDS);
      }
    } else {
      setMoodboards(DEFAULT_MOODBOARDS);
      localStorage.setItem(`tailleur_gallery_moodboards_${merchant.id}`, JSON.stringify(DEFAULT_MOODBOARDS));
    }
  }, [merchant.id]);

  // Sync state helpers
  const saveModelsToLocal = (updatedModels: GalleryModel[]) => {
    setModels(updatedModels);
    localStorage.setItem(`tailleur_gallery_models_${merchant.id}`, JSON.stringify(updatedModels));
  };

  const saveMoodboardsToLocal = (updatedMoodboards: Moodboard[]) => {
    setMoodboards(updatedMoodboards);
    localStorage.setItem(`tailleur_gallery_moodboards_${merchant.id}`, JSON.stringify(updatedMoodboards));
  };

  // CRUD Model handlers
  const handleOpenModelModal = (model: GalleryModel | null = null) => {
    if (model) {
      setEditingModel(model);
      setModelTitle(model.title);
      setModelDesc(model.description);
      setModelPriceMin(model.priceMin);
      setModelPriceMax(model.priceMax);
      setModelDifficulty(model.difficulty);
      setModelFabricType(model.fabricType);
      setModelYardage(model.yardageNeeded);
      setModelEstimatedDays(model.estimatedDays);
      setModelImageUrl(model.imageUrl);
      setModelTagsInput(model.tags.join(', '));
    } else {
      setEditingModel(null);
      setModelTitle('');
      setModelDesc('');
      setModelPriceMin(20000);
      setModelPriceMax(45000);
      setModelDifficulty('Moyen');
      setModelFabricType('Wax');
      setModelYardage('3.5 mètres');
      setModelEstimatedDays(4);
      setModelImageUrl('');
      setModelTagsInput('');
    }
    setIsModelModalOpen(true);
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelTitle.trim()) return;

    // Default image if empty
    const defaultImg = modelFabricType.toLowerCase().includes('basin')
      ? 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000'
      : modelFabricType.toLowerCase().includes('dentelle') || modelFabricType.toLowerCase().includes('satin')
      ? 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000'
      : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000';

    const tagsArray = modelTagsInput
      ? modelTagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [modelFabricType, modelDifficulty];

    if (editingModel) {
      const updated = models.map(m => {
        if (m.id === editingModel.id) {
          return {
            ...m,
            title: modelTitle,
            description: modelDesc,
            priceMin: Number(modelPriceMin),
            priceMax: Number(modelPriceMax),
            difficulty: modelDifficulty,
            fabricType: modelFabricType,
            yardageNeeded: modelYardage,
            estimatedDays: Number(modelEstimatedDays),
            imageUrl: modelImageUrl.trim() || m.imageUrl || defaultImg,
            tags: tagsArray
          };
        }
        return m;
      });
      saveModelsToLocal(updated);
    } else {
      const newModel: GalleryModel = {
        id: 'model-' + Date.now(),
        title: modelTitle,
        description: modelDesc,
        priceMin: Number(modelPriceMin),
        priceMax: Number(modelPriceMax),
        difficulty: modelDifficulty,
        fabricType: modelFabricType,
        yardageNeeded: modelYardage,
        estimatedDays: Number(modelEstimatedDays),
        imageUrl: modelImageUrl.trim() || defaultImg,
        tags: tagsArray,
        createdAt: new Date().toISOString()
      };
      saveModelsToLocal([newModel, ...models]);
    }
    setIsModelModalOpen(false);
  };

  const handleDeleteModel = (id: string) => {
    if (confirm('Voulez-vous vraiment retirer ce modèle de votre galerie ?')) {
      const updated = models.filter(m => m.id !== id);
      saveModelsToLocal(updated);

      // Clean pins in moodboards
      const cleanedMBs = moodboards.map(mb => ({
        ...mb,
        modelIds: mb.modelIds.filter(mid => mid !== id)
      }));
      saveMoodboardsToLocal(cleanedMBs);
    }
  };

  // CRUD Moodboard handlers
  const handleOpenMoodboardModal = (mb: Moodboard | null = null) => {
    if (mb) {
      setEditingMoodboard(mb);
      setMoodboardName(mb.name);
      setMoodboardDesc(mb.description);
      setMoodboardCoverUrl(mb.coverImage);
    } else {
      setEditingMoodboard(null);
      setMoodboardName('');
      setMoodboardDesc('');
      setMoodboardCoverUrl('');
    }
    setIsMoodboardModalOpen(true);
  };

  const handleSaveMoodboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodboardName.trim()) return;

    const defaultCover = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000';

    if (editingMoodboard) {
      const updated = moodboards.map(m => {
        if (m.id === editingMoodboard.id) {
          return {
            ...m,
            name: moodboardName,
            description: moodboardDesc,
            coverImage: moodboardCoverUrl.trim() || m.coverImage || defaultCover
          };
        }
        return m;
      });
      saveMoodboardsToLocal(updated);
    } else {
      const newMB: Moodboard = {
        id: 'mb-' + Date.now(),
        name: moodboardName,
        description: moodboardDesc,
        coverImage: moodboardCoverUrl.trim() || defaultCover,
        modelIds: [],
        createdAt: new Date().toISOString()
      };
      saveMoodboardsToLocal([newMB, ...moodboards]);
    }
    setIsMoodboardModalOpen(false);
  };

  const handleDeleteMoodboard = (id: string) => {
    if (confirm('Voulez-vous supprimer ce moodboard ? Les modèles resteront dans votre catalogue global.')) {
      const updated = moodboards.filter(m => m.id !== id);
      saveMoodboardsToLocal(updated);
      if (selectedMoodboardId === id) {
        setSelectedMoodboardId(null);
      }
    }
  };

  const handleWhatsAppShare = () => {
    if (!sharingMoodboard) return;
    const selectedModels = models.filter(m => sharingMoodboard.modelIds.includes(m.id));
    const currencyStr = merchant.currency || 'FCFA';

    let text = `✨ *LOOKBOOK CLIENT : ${sharingMoodboard.name.toUpperCase()}* ✨\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (sharingMoodboard.description) {
      text += `_${sharingMoodboard.description}_\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    if (selectedModels.length === 0) {
      text += `Aucune tenue n'est sélectionnée dans ce lookbook pour le moment.\n`;
    } else {
      text += `Voici les modèles de couture personnalisés pour votre projet :\n\n`;
      selectedModels.forEach((model, index) => {
        const diffLabel = model.difficulty === 'Difficile' ? '🔴 Difficile' : model.difficulty === 'Moyen' ? '🟡 Moyen' : '🟢 Facile';
        const tagsList = model.tags && model.tags.length > 0 ? model.tags.map(t => `#${t.trim()}`).join(' ') : '';
        
        text += `👗 *${index + 1}. ${model.title.toUpperCase()}*\n`;
        text += `──────────────────────────\n`;
        if (model.description) {
          text += `📝 _${model.description}_\n\n`;
        }
        text += `💰 *Tarif estimé :* ${model.priceMin.toLocaleString('fr-FR')} - ${model.priceMax.toLocaleString('fr-FR')} ${currencyStr}\n`;
        text += `🧵 *Tissu conseillé :* ${model.fabricType}\n`;
        text += `📏 *Métrage requis :* ${model.yardageNeeded}\n`;
        text += `⏳ *Temps de confection :* ~${model.estimatedDays} jours\n`;
        text += `⚡ *Niveau requis :* ${diffLabel}\n`;
        if (tagsList) {
          text += `✨ *Styles :* ${tagsList}\n`;
        }
        if (model.imageUrl) {
          text += `📸 *Visualiser la tenue :* ${model.imageUrl}\n`;
        }
        text += `──────────────────────────\n\n`;
      });
    }

    text += `✨ *${merchant.name || 'Couture Design Studio'}* ✨\n`;
    text += `👉 Dites-nous quel modèle retient votre attention pour lancer la confection !`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    try {
      navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Impossible de copier au presse-papier :", err);
    }

    window.open(whatsappUrl, '_blank');
  };

  // Download / Share single card actions

  const downloadModelCard = async (modelId: string, modelTitle: string) => {
    const element = document.getElementById(`lookbook-card-${modelId}`);
    if (!element) return;
    
    setDownloadingId(modelId);
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // higher quality
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `carte-${modelTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erreur lors de la génération de la carte d\'image:', error);
      alert('Une erreur est survenue lors du téléchargement de l\'image. Vous pouvez faire une capture d\'écran de la carte directement !');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShareSingleModel = async (model: GalleryModel) => {
    const currencyStr = merchant.currency || 'FCFA';
    const diffLabel = model.difficulty === 'Difficile' ? '🔴 Difficile' : model.difficulty === 'Moyen' ? '🟡 Moyen' : '🟢 Facile';
    const tagsList = model.tags && model.tags.length > 0 ? model.tags.map(t => `#${t.trim()}`).join(' ') : '';

    let text = `👗 *TENUE : ${model.title.toUpperCase()}* 👗\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (model.description) {
      text += `📝 _${model.description}_\n\n`;
    }
    text += `💰 *Tarif estimé :* ${model.priceMin.toLocaleString('fr-FR')} - ${model.priceMax.toLocaleString('fr-FR')} ${currencyStr}\n`;
    text += `🧵 *Tissu conseillé :* ${model.fabricType}\n`;
    text += `📏 *Métrage requis :* ${model.yardageNeeded}\n`;
    text += `⏳ *Temps de confection :* ~${model.estimatedDays} jours\n`;
    text += `⚡ *Niveau requis :* ${diffLabel}\n`;
    if (tagsList) {
      text += `✨ *Styles :* ${tagsList}\n`;
    }
    if (model.imageUrl) {
      text += `📸 *Visualiser la tenue :* ${model.imageUrl}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ *${merchant.name || 'Couture Design Studio'}* ✨\n`;
    text += `👉 Contactez-nous pour lancer la confection de cette magnifique tenue !`;

    // Attempt to generate the image blob to share via Web Share API
    let fileToShare: File | null = null;
    const element = document.getElementById(`lookbook-card-${model.id}`);
    
    if (element) {
       setIsSharingModelId(model.id);
       try {
         const canvas = await html2canvas(element, {
           useCORS: true,
           allowTaint: true,
           scale: 2,
           backgroundColor: '#ffffff',
           logging: false,
         });
         const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
         if (blob) {
           fileToShare = new File([blob], `carte-${model.title.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
         }
       } catch(e) {
         console.error("Erreur génération image pour partage", e);
       } finally {
         setIsSharingModelId(null);
       }
    }

    if (navigator.share && fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
      try {
        await navigator.share({
          files: [fileToShare],
          title: model.title,
          text: text,
        });
        return; // Success! Web Share handles the rest
      } catch (err) {
        console.error("Erreur de partage natif:", err);
        // Fallback to text url below if user aborted or failed
      }
    }

    // Fallback if no Web Share API or if it failed
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Pin / Pinned logic
  const handleOpenPinModal = (modelId: string) => {
    setPinningModelId(modelId);
    setIsPinModalOpen(true);
  };

  const togglePinInMoodboard = (mbId: string) => {
    if (!pinningModelId) return;
    const updated = moodboards.map(mb => {
      if (mb.id === mbId) {
        const isPinned = mb.modelIds.includes(pinningModelId);
        return {
          ...mb,
          modelIds: isPinned 
            ? mb.modelIds.filter(id => id !== pinningModelId)
            : [...mb.modelIds, pinningModelId]
        };
      }
      return mb;
    });
    saveMoodboardsToLocal(updated);
  };

  // AI Generation Query
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    setAiError('');
    setAiResult(null);

    try {
      const response = await fetch('/api/gemini/analyze-business', { // Wait, let's proxy our designer assist through a customized endpoint or build a generic handler
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: [], // dummy values for compatibility
          expenses: [],
          tenantId: merchant.id,
          // Custom instruction for designer assist!
          isDesignerAssist: true,
          prompt: `Conçois un modèle de vêtement pour atelier de couture africain avec les critères suivants :
Coupe / Design global : ${aiPrompt}
Client ciblé : ${aiTargetClient || 'Tous clients'}
Événement : ${aiTargetEvent}
Tissu recommandé par défaut : ${aiPreferredFabric}

Format de réponse STRICT JSON (uniquement l'objet JSON valide sans markdown, sans triple backticks, sans texte superflu) :
{
  "title": "Nom commercial du style d'habit en français",
  "description": "Description détaillée de la coupe, des finitions, des manches, du style de décolleté ou d'ourlet en valorisant le savoir-faire.",
  "difficulty": "Facile" ou "Moyen" ou "Difficile",
  "fabricType": "Nom du tissu principal recommandé (ex: Basin riche, Wax hollandais, Crêpe de soie)",
  "yardageNeeded": "Métrage requis (ex: 3 mètres de wax, ou 4 mètres de basin)",
  "estimatedDays": 4, // Nombre de jours requis de travail estimé (entre 2 et 12)
  "priceMin": 25000, // Estimation du prix de main d'œuvre minimal en FCFA
  "priceMax": 55000, // Estimation du prix de main d'œuvre maximal en FCFA
  "tags": ["Tag1", "Tag2", "Tag3"] // maximum 4 tags appropriés
}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la communication avec le créateur IA.');
      }

      // Parse the JSON block out of text
      let textResponse = data.analysis || '';
      // Clean up markdown blocks if returned
      if (textResponse.includes('```json')) {
        textResponse = textResponse.split('```json')[1].split('```')[0].trim();
      } else if (textResponse.includes('```')) {
        textResponse = textResponse.split('```')[1].split('```')[0].trim();
      }
      
      const parsed = JSON.parse(textResponse.trim());
      setAiResult(parsed);
    } catch (e: any) {
      console.error('AI Couture Assistant Error:', e);
      setAiError('Désolé, l\'IA n\'a pas pu formuler de modèle valide pour l\'instant. Détail: ' + e.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Convert AI generated model to real model
  const saveAiModelToGallery = () => {
    if (!aiResult) return;
    
    const defaultImg = aiResult.fabricType.toLowerCase().includes('basin')
      ? 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000'
      : aiResult.fabricType.toLowerCase().includes('dentelle') || aiResult.fabricType.toLowerCase().includes('satin')
      ? 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000'
      : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000';

    const newModel: GalleryModel = {
      id: 'model-ai-' + Date.now(),
      title: aiResult.title,
      description: aiResult.description,
      priceMin: Number(aiResult.priceMin || 25000),
      priceMax: Number(aiResult.priceMax || 60000),
      difficulty: aiResult.difficulty || 'Moyen',
      fabricType: aiResult.fabricType || 'Wax',
      yardageNeeded: aiResult.yardageNeeded || '3 mètres',
      estimatedDays: Number(aiResult.estimatedDays || 5),
      imageUrl: defaultImg,
      tags: [...(aiResult.tags || []), 'Créé par IA'],
      createdAt: new Date().toISOString()
    };

    saveModelsToLocal([newModel, ...models]);
    alert('Modèle IA enregistré avec succès dans votre catalogue !');
    setActiveSubTab('catalog');
    setAiResult(null);
    setAiPrompt('');
  };

  // Filter models
  const getFilteredModels = () => {
    let list = [...models];

    // Moodboard filter
    if (selectedMoodboardId) {
      const mb = moodboards.find(m => m.id === selectedMoodboardId);
      if (mb) {
        list = list.filter(m => mb.modelIds.includes(m.id));
      }
    }

    // Keyword search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.fabricType.toLowerCase().includes(query) ||
        m.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      list = list.filter(m => m.difficulty === selectedDifficulty);
    }

    // Fabric filter
    if (selectedFabric !== 'all') {
      list = list.filter(m => m.fabricType.toLowerCase().includes(selectedFabric.toLowerCase()));
    }

    return list;
  };

  const filteredModels = getFilteredModels();

  return (
    <motion.div 
      id="tailleur-gallery-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left"
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Couture Design Studio</h2>
            <p className="text-xs text-gray-500 font-medium">Gérez votre catalogue de modèles, créez des moodboards visuels et découvrez l'inspiration IA.</p>
          </div>
        </div>
        
        {/* Sub-navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => { setActiveSubTab('catalog'); setSelectedMoodboardId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'catalog' && !selectedMoodboardId ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1.5" /> Galerie de Modèles
          </button>
          <button
            onClick={() => setActiveSubTab('moodboards')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'moodboards' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <FolderHeart className="w-3.5 h-3.5 inline mr-1.5" /> Moodboards Clients
          </button>
          <button
            onClick={() => setActiveSubTab('ai_assistant')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'ai_assistant' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" /> Inspiration IA
          </button>
        </div>
      </div>

      {/* Main Area based on Active Sub Tab */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Left Search / Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 md:flex-initial min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un modèle, tissu, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="all">Difficulté (Tout)</option>
                  <option value="Facile">Facile</option>
                  <option value="Moyen">Moyen</option>
                  <option value="Difficile">Difficile</option>
                </select>

                <select
                  value={selectedFabric}
                  onChange={(e) => setSelectedFabric(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="all">Tissu (Tout)</option>
                  <option value="Wax">Wax</option>
                  <option value="Basin">Basin</option>
                  <option value="Crêpe">Crêpe</option>
                  <option value="Dentelle">Dentelle</option>
                  <option value="Satin">Satin</option>
                </select>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              {selectedMoodboardId && (
                <button
                  onClick={() => setSelectedMoodboardId(null)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Voir tout le Catalogue
                </button>
              )}
              <button
                onClick={() => handleOpenModelModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter un Modèle
              </button>
            </div>
          </div>

          {/* Selected Moodboard Info Header */}
          {selectedMoodboardId && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-violet-600">Moodboard Sélectionné</span>
                <h3 className="text-base font-bold text-gray-900">{moodboards.find(m => m.id === selectedMoodboardId)?.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{moodboards.find(m => m.id === selectedMoodboardId)?.description}</p>
              </div>
              <button
                onClick={() => {
                  const mb = moodboards.find(m => m.id === selectedMoodboardId);
                  if (mb) {
                    setSharingMoodboard(mb);
                    setIsShareModalOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-violet-700 rounded-lg text-xs font-bold border border-violet-200 hover:bg-violet-100 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Présenter au Client
              </button>
            </div>
          )}

          {/* Models Grid */}
          {filteredModels.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-violet-50 text-violet-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucun modèle trouvé</p>
              <p className="text-xs text-gray-400">Essayez de modifier vos filtres ou créez votre premier modèle de vêtement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModels.map((model) => (
                <motion.div
                  key={model.id}
                  layout
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col justify-between"
                >
                  <div>
                    {/* Model Image */}
                    <div 
                      onClick={() => setPreviewImage({
                        url: model.imageUrl,
                        title: model.title,
                        subtitle: model.description,
                        details: {
                          difficulty: model.difficulty,
                          fabricType: model.fabricType,
                          yardageNeeded: model.yardageNeeded,
                          estimatedDays: model.estimatedDays,
                          priceMin: model.priceMin,
                          priceMax: model.priceMax
                        }
                      })}
                      className="relative h-80 md:h-[420px] w-full bg-gray-100 overflow-hidden cursor-zoom-in group/img"
                    >
                      <img
                        src={model.imageUrl}
                        alt={model.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000';
                        }}
                      />
                      {/* Zoom Hover Overlay */}
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                        <div className="bg-white/90 backdrop-blur-md p-3 rounded-full text-slate-900 transform scale-90 group-hover/img:scale-100 transition-all duration-300 shadow-xl">
                          <Eye className="w-5 h-5 text-violet-600" />
                        </div>
                      </div>
                      {/* Difficulty Badge */}
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm z-20 ${
                        model.difficulty === 'Facile' ? 'bg-emerald-500' :
                        model.difficulty === 'Moyen' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}>
                        {model.difficulty}
                      </span>
                      {/* Price Range Badge */}
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gray-900/80 backdrop-blur-xs z-20">
                        {model.priceMin.toLocaleString('fr-FR')} - {model.priceMax.toLocaleString('fr-FR')} F
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm tracking-tight line-clamp-1">{model.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">{model.description}</p>
                      </div>

                      {/* Technical specifications */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span className="truncate">Tissu : {model.fabricType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                          <span className="truncate">Métrage : {model.yardageNeeded}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Temps de confection : ~{model.estimatedDays} jours</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {model.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-semibold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenPinModal(model.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Heart className={`w-3.5 h-3.5 ${moodboards.some(mb => mb.modelIds.includes(model.id)) ? 'fill-rose-500 text-rose-500' : ''}`} /> Pin
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModelModal(model)}
                        className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'moodboards' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Vos Collections de Style</h3>
            <button
              onClick={() => handleOpenMoodboardModal()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Créer une Collection
            </button>
          </div>

          {/* Moodboards Grid */}
          {moodboards.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <FolderHeart className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucun moodboard disponible</p>
              <p className="text-xs text-gray-400">Créez des moodboards pour organiser vos collections saisonnières ou regrouper des modèles pour des événements clients.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {moodboards.map((mb) => (
                <div
                  key={mb.id}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row h-full md:h-48"
                >
                  {/* Left Column Cover Image */}
                  <div className="w-full md:w-2/5 relative h-32 md:h-full bg-gray-100 shrink-0">
                    <img
                      src={mb.coverImage}
                      alt={mb.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-violet-700 shadow-sm">
                      {mb.modelIds.length} modèle{mb.modelIds.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Right Column Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900 text-sm tracking-tight line-clamp-1">{mb.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 h-8">{mb.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                      <button
                        onClick={() => {
                          setSelectedMoodboardId(mb.id);
                          setActiveSubTab('catalog');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Explorer la Liste
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenMoodboardModal(mb)}
                          className="p-1.5 text-gray-500 hover:text-violet-600 rounded-lg transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMoodboard(mb.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'ai_assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-left">
          {/* Form Settings Left Column */}
          <div className="lg:col-span-2 space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-violet-700">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Créateur de Modèles IA</h3>
            </div>
            
            <p className="text-xs text-gray-500 font-medium">Décrivez votre idée créative en quelques phrases. Notre IA Gemini va structurer le modèle technique de vêtement prêt à l'emploi.</p>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description de l'idée couturière</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex : Robe de mariée sirène, bustier croisé avec fine dentelle dorée sur les manches papillons, jupe évasée en basin plissé."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 h-24 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Client cible (Optionnel)</label>
                <input
                  type="text"
                  value={aiTargetClient}
                  onChange={(e) => setAiTargetClient(e.target.value)}
                  placeholder="Ex : Jeunes mariées, Femmes d'affaires"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Événement principal</label>
                  <select
                    value={aiTargetEvent}
                    onChange={(e) => setAiTargetEvent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="Tabaski">Tabaski / Korité</option>
                    <option value="Mariage">Mariage civil / Coutumier</option>
                    <option value="Cocktail">Soirée / Cocktail</option>
                    <option value="Quotidien">Tenue de Bureau / Casual</option>
                    <option value="Dot">Cérémonie de Dot / Baptême</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Matière / Tissu suggéré</label>
                  <select
                    value={aiPreferredFabric}
                    onChange={(e) => setAiPreferredFabric(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="Wax">Wax Hollandais</option>
                    <option value="Basin">Basin Riche</option>
                    <option value="Crêpe de soie">Crêpe de Soie</option>
                    <option value="Dentelle">Dentelle Prestige</option>
                    <option value="Brocart">Brocart Soyeux</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI || !aiPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {isGeneratingAI ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analyse & Création en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-violet-200" /> Générer le Modèle IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Result Right Column */}
          <div className="lg:col-span-3 min-h-[300px] border border-gray-100 rounded-2xl flex flex-col overflow-hidden relative bg-white">
            <AnimatePresence mode="wait">
              {isGeneratingAI ? (
                <motion.div
                  key="ai_loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-violet-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Le styliste virtuel Gemini crée votre modèle...</p>
                    <p className="text-xs text-gray-400 mt-1">Analyse des formes de la robe, des coupes et calcul du métrage optimal.</p>
                  </div>
                </motion.div>
              ) : aiError ? (
                <motion.div
                  key="ai_error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">Échec de la génération IA</p>
                  <p className="text-xs text-rose-600 max-w-sm">{aiError}</p>
                </motion.div>
              ) : aiResult ? (
                <motion.div
                  key="ai_content"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* AI Generated Content Detail */}
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Title and badges */}
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[10px] font-bold">
                          <Sparkles className="w-3 h-3" /> Inspiration IA exclusive
                        </span>
                        <h4 className="text-lg font-bold text-gray-900 tracking-tight">{aiResult.title}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm ${
                          aiResult.difficulty === 'Facile' ? 'bg-emerald-500' :
                          aiResult.difficulty === 'Moyen' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}>
                          {aiResult.difficulty}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-violet-950/85">
                          ~{aiResult.priceMin?.toLocaleString('fr-FR')} - {aiResult.priceMax?.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    </div>

                    {/* Description text */}
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-gray-400" /> Détails et Coupe préconisée
                      </h5>
                      <p className="text-xs text-gray-700 leading-relaxed">{aiResult.description}</p>
                    </div>

                    {/* Technical requirements checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-gray-700 pt-2">
                      <div className="flex items-center gap-2.5 p-3.5 border border-gray-100 rounded-xl">
                        <Palette className="w-4 h-4 text-violet-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tissu recommandé</p>
                          <p className="font-bold text-gray-800">{aiResult.fabricType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3.5 border border-gray-100 rounded-xl">
                        <Scissors className="w-4 h-4 text-pink-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Métrage estimé</p>
                          <p className="font-bold text-gray-800">{aiResult.yardageNeeded}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3.5 border border-gray-100 rounded-xl">
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Temps de confection</p>
                          <p className="font-bold text-gray-800">~{aiResult.estimatedDays} jours de travail</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3.5 border border-gray-100 rounded-xl">
                        <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Événement visé</p>
                          <p className="font-bold text-gray-800">{aiTargetEvent}</p>
                        </div>
                      </div>
                    </div>

                    {/* Custom generated tags */}
                    {aiResult.tags && aiResult.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {aiResult.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-md text-[10px] font-semibold border border-violet-100">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAiResult(null)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 cursor-pointer"
                    >
                      Effacer
                    </button>
                    <button
                      type="button"
                      onClick={saveAiModelToGallery}
                      className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Enregistrer dans la Galerie
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="ai_empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">En attente de votre idée créative</p>
                  <p className="text-xs text-gray-400 max-w-xs">Saisissez l'idée couturière souhaitée à gauche, puis cliquez sur "Générer" pour obtenir un patron complet.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT GALLERY MODEL */}
      {isModelModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl max-w-2xl w-full border border-gray-100 shadow-xl overflow-hidden flex flex-col text-left"
          >
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
                {editingModel ? 'Modifier le modèle de robe' : 'Ajouter un nouveau modèle'}
              </h3>
              <button onClick={() => setIsModelModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Title */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Nom du modèle *</label>
                <input
                  type="text"
                  required
                  value={modelTitle}
                  onChange={(e) => setModelTitle(e.target.value)}
                  placeholder="Ex : Robe sirène avec puff sleeves"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Description & Finitions</label>
                <textarea
                  value={modelDesc}
                  onChange={(e) => setModelDesc(e.target.value)}
                  placeholder="Expliquez la coupe, les finitions, l'ouverture..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 h-16 resize-none"
                />
              </div>

              {/* Row 3: Prices & Days */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Prix Main d'Œuvre Min (FCFA)</label>
                  <input
                    type="number"
                    value={modelPriceMin}
                    onChange={(e) => setModelPriceMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Prix Main d'Œuvre Max (FCFA)</label>
                  <input
                    type="number"
                    value={modelPriceMax}
                    onChange={(e) => setModelPriceMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Temps estimé (jours)</label>
                  <input
                    type="number"
                    value={modelEstimatedDays}
                    onChange={(e) => setModelEstimatedDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Row 4: Fabric specs & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Difficulté de travail</label>
                  <select
                    value={modelDifficulty}
                    onChange={(e) => setModelDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Matière / Tissu principal</label>
                  <input
                    type="text"
                    value={modelFabricType}
                    onChange={(e) => setModelFabricType(e.target.value)}
                    placeholder="Ex : Wax, Basin riche, Soie"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Métrage requis</label>
                  <input
                    type="text"
                    value={modelYardage}
                    onChange={(e) => setModelYardage(e.target.value)}
                    placeholder="Ex : 3 mètres (ou 1 pagne)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Row 5: Photo upload & URL fallback */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">Photo du modèle *</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Interactive Drop Zone / Preview */}
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all min-h-[160px] relative overflow-hidden ${
                      isDraggingImage 
                        ? 'border-violet-500 bg-violet-50/50' 
                        : modelImageUrl 
                        ? 'border-emerald-200 bg-emerald-50/10' 
                        : 'border-gray-200 hover:border-violet-400 bg-gray-50/50'
                    }`}
                  >
                    {modelImageUrl ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img 
                          src={modelImageUrl} 
                          alt="Aperçu modèle" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                          <label className="px-3 py-1.5 bg-white/90 text-gray-800 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer hover:bg-white shadow-sm flex items-center gap-1">
                            <Upload className="w-3 h-3 text-violet-600" />
                            Remplacer
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleImageFileChange(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setModelImageUrl('')}
                            className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer space-y-2 w-full h-full py-4">
                        <div className="w-10 h-10 bg-violet-50 rounded-full flex items-center justify-center text-violet-500">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">Déposer une photo ici ou <span className="text-violet-600 underline">parcourir</span></p>
                          <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP jusqu'à 5 Mo</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileChange(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Right: URL option & Tags */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ou saisir une URL d'image existante</label>
                      <input
                        type="url"
                        value={modelImageUrl.startsWith('data:') ? '' : modelImageUrl}
                        onChange={(e) => setModelImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Tags (Séparés par virgules)</label>
                      <input
                        type="text"
                        value={modelTagsInput}
                        onChange={(e) => setModelTagsInput(e.target.value)}
                        placeholder="Ex : Moderne, Mariage, Wax"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Sauvegarder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT MOODBOARD */}
      {isMoodboardModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-xl overflow-hidden text-left"
          >
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
                {editingMoodboard ? 'Modifier la Collection' : 'Créer une Collection'}
              </h3>
              <button onClick={() => setIsMoodboardModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMoodboard} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Nom de la collection *</label>
                <input
                  type="text"
                  required
                  value={moodboardName}
                  onChange={(e) => setMoodboardName(e.target.value)}
                  placeholder="Ex : Collection Korité 2026"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Description / Objectif</label>
                <textarea
                  value={moodboardDesc}
                  onChange={(e) => setMoodboardDesc(e.target.value)}
                  placeholder="Décrivez l'événement, le thème ou la clientèle visée..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Image de Couverture (URL)</label>
                <input
                  type="url"
                  value={moodboardCoverUrl}
                  onChange={(e) => setMoodboardCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMoodboardModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: PIN MODEL TO MOODBOARDS */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl max-w-sm w-full border border-gray-100 shadow-xl overflow-hidden text-left"
          >
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Épingler dans vos Collections
              </h3>
              <button onClick={() => setIsPinModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 font-medium">Choisissez un ou plusieurs moodboards pour y épingler ce modèle de coupe :</p>

              {moodboards.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400 font-medium">
                  Aucun moodboard disponible. Créez-en un d'abord.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {moodboards.map(mb => {
                    const isPinned = mb.modelIds.includes(pinningModelId || '');
                    return (
                      <button
                        key={mb.id}
                        type="button"
                        onClick={() => togglePinInMoodboard(mb.id)}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                          isPinned 
                            ? 'bg-violet-50 border-violet-200 text-violet-700' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate pr-2">{mb.name}</span>
                        {isPinned ? (
                          <Check className="w-4 h-4 text-violet-600 shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-5 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-gray-800 shadow-xs cursor-pointer"
                >
                  Terminer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: PRESENTATION / CLIENT LOOKBOOK SHARING */}
      {isShareModalOpen && sharingMoodboard && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl max-w-4xl w-full border border-gray-100 shadow-2xl overflow-hidden flex flex-col text-left"
          >
            {/* Elegant Premium Presentation Top Bar */}
            <div className="p-6 bg-gray-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-violet-400 font-bold font-mono">LOOKBOOK CLIENT</span>
                <h3 className="text-xl font-bold mt-0.5 tracking-tight font-serif">{sharingMoodboard.name}</h3>
                <p className="text-xs text-gray-400 font-medium">{sharingMoodboard.description}</p>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)} 
                className="p-1.5 bg-gray-900 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Models Presentation Grid */}
            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-gray-50/50">
              {sharingMoodboard.modelIds.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-medium">
                  Aucun modèle n'est épinglé dans ce moodboard pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models.filter(m => sharingMoodboard.modelIds.includes(m.id)).map(model => (
                    <div key={model.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-md flex flex-col justify-between">
                      {/* Printable Area */}
                      <div id={`lookbook-card-${model.id}`} className="bg-white flex flex-col justify-between h-full p-1">
                        <div 
                          onClick={() => setPreviewImage({
                            url: model.imageUrl,
                            title: model.title,
                            subtitle: model.description,
                            details: {
                              difficulty: model.difficulty,
                              fabricType: model.fabricType,
                              yardageNeeded: model.yardageNeeded,
                              estimatedDays: model.estimatedDays,
                              priceMin: model.priceMin,
                              priceMax: model.priceMax
                            }
                          })}
                          className="relative h-80 md:h-[380px] bg-gray-50 overflow-hidden rounded-2xl cursor-zoom-in group/img"
                        >
                          <img 
                            src={model.imageUrl} 
                            alt={model.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" 
                          />
                          {/* Difficulty Pill */}
                          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white ${
                            model.difficulty === 'Difficile' ? 'bg-rose-500' :
                            model.difficulty === 'Moyen' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}>
                            {model.difficulty}
                          </span>
                          
                          {/* Price Range Pill */}
                          <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl text-xs font-extrabold text-white bg-slate-900/85 backdrop-blur-xs font-mono shadow-md">
                            {model.priceMin.toLocaleString('fr-FR')} - {model.priceMax.toLocaleString('fr-FR')} {merchant.currency || 'F'}
                          </span>
                          
                          {/* Zoom Hover Overlay */}
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                            <div className="bg-white/90 backdrop-blur-md p-3 rounded-full text-slate-900 transform scale-90 group-hover/img:scale-100 transition-all duration-300 shadow-xl">
                              <Eye className="w-5 h-5 text-violet-600" />
                            </div>
                          </div>
                        </div>

                        {/* Card Info Details */}
                        <div className="p-4 space-y-3 text-left">
                          <h4 className="font-extrabold text-gray-900 text-sm leading-tight tracking-tight">{model.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{model.description}</p>
                          
                          {/* Specs Section from Attachment */}
                          <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-violet-500">🔮</span>
                                <span className="truncate">Tissu : {model.fabricType}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-rose-500">✂️</span>
                                <span className="truncate">Métrage : {model.yardageNeeded}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                              <span className="text-sky-500">⏳</span>
                              <span>Temps de confection : ~{model.estimatedDays} jours</span>
                            </div>
                          </div>

                          {/* Horizontal Tags */}
                          {model.tags && model.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {model.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold tracking-tight">
                                  #{tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons (Excluded from the download/screenshot!) */}
                      <div className="px-4 pb-4 pt-2 border-t border-gray-50 flex items-center justify-between gap-2 bg-gray-50/50">
                        <button
                          onClick={() => downloadModelCard(model.id, model.title)}
                          disabled={downloadingId !== null}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-[11px] font-bold transition-all border border-gray-100 cursor-pointer disabled:opacity-55"
                        >
                          {downloadingId === model.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          Télécharger la Carte
                        </button>
                        <button
                          onClick={() => handleShareSingleModel(model)}
                          disabled={isSharingModelId !== null}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-55"
                        >
                          {isSharingModelId === model.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          Partager
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with share instructions */}
            <div className="p-5 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 font-medium">💡 Présentez cette interface élégante à vos clients sur tablette ou mobile pour faciliter le choix de coupe.</p>
              
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Partager par WhatsApp (Lien)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox / Image Viewer Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 cursor-zoom-out"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors cursor-pointer z-[110]"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row cursor-default"
            >
              {/* Image Column */}
              <div className="flex-1 max-h-[70vh] md:max-h-[80vh] bg-slate-950 flex items-center justify-center relative">
                <img
                  src={previewImage.url}
                  alt={previewImage.title || ''}
                  className="w-full h-full object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Sidebar Info Column */}
              <div className="w-full md:w-80 p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 text-white bg-slate-900 shrink-0">
                <div className="space-y-6 text-left">
                  <div className="flex flex-wrap gap-2">
                    {previewImage.details?.difficulty && (
                      <span className={`text-[9px] px-2.5 py-1 rounded-full uppercase font-black tracking-widest ${
                        previewImage.details.difficulty === 'Facile' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        previewImage.details.difficulty === 'Moyen' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {previewImage.details.difficulty}
                      </span>
                    )}
                    {previewImage.details?.fabricType && (
                      <span className="text-[9px] bg-violet-600/20 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full uppercase font-black tracking-widest">
                        Tissu : {previewImage.details.fabricType}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white mb-2">{previewImage.title}</h3>
                    {previewImage.subtitle && (
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                        {previewImage.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Technical Spec List */}
                  {previewImage.details && (
                    <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                      {previewImage.details.yardageNeeded && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Métrage requis</span>
                          <span className="font-bold text-slate-200">{previewImage.details.yardageNeeded}</span>
                        </div>
                      )}
                      {previewImage.details.estimatedDays && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Temps de confection</span>
                          <span className="font-bold text-slate-200">~{previewImage.details.estimatedDays} jours</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {previewImage.details?.priceMin !== undefined && (
                  <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-black tracking-widest">ESTIMATION PRIX</span>
                      <span className="text-lg font-black text-violet-400 font-mono">
                        {previewImage.details.priceMin.toLocaleString('fr-FR')} - {previewImage.details.priceMax.toLocaleString('fr-FR')} F
                      </span>
                    </div>

                    <button
                      onClick={() => setPreviewImage(null)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/10"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TailleurGalleryManager;
