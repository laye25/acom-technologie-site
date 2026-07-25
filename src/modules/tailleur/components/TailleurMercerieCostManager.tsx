import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Plus, Trash2, Edit, Save, Search, 
  Filter, TrendingUp, TrendingDown, Layers, Box, AlertTriangle, 
  DollarSign, Check, ShoppingBag, Eye, RefreshCw, Sparkles, FileText,
  ChevronRight, Scissors, HelpCircle, ArrowLeft, Percent, Info, Tag,
  FolderPlus, Settings, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  Palette, Grid, List, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { MercerieColorSelector } from './MercerieColorSelector';
import { 
  MercerieCategoryService, 
  MercerieCategory 
} from '../services/MercerieCategoryService';
import { 
  MercerieColorLibraryService 
} from '../services/MercerieColorLibraryService';
import { 
  MercerieAttributeService, 
  DetailedMercerieItem 
} from '../services/MercerieAttributeService';

interface Merchant {
  id: string;
  name: string;
  currency?: string;
}

export type MercerieItem = DetailedMercerieItem;

interface CostSheetItem {
  mercerieId: string;
  name: string;
  quantityUsed: number;
  unitCost: number;
}

interface CostSheet {
  id: string;
  title: string;
  orderId?: string;
  clientName: string;
  modelName: string;
  fabricCost: number;
  fabricDetails?: string;
  mercerieCostItems: CostSheetItem[];
  laborCost: number;
  laborDetails?: string;
  overheadCost: number;
  overheadDetails?: string;
  totalCostPrice: number;
  sellingPrice: number;
  profit: number;
  marginPercent: number;
  createdAt: string;
}

interface TailleurMercerieCostManagerProps {
  merchant: Merchant;
}

export const TailleurMercerieCostManager = ({ merchant }: TailleurMercerieCostManagerProps) => {
  const currency = merchant.currency || 'FCFA';

  // Base State
  const [mercerie, setMercerie] = useState<MercerieItem[]>([]);
  const [categories, setCategories] = useState<MercerieCategory[]>([]);
  const [costSheets, setCostSheets] = useState<CostSheet[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Sub-tab Navigation
  const [subTab, setSubTab] = useState<'mercerie' | 'categories' | 'costs' | 'new_cost' | 'analytics'>('mercerie');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MercerieItem | null>(null);
  const [selectedCostSheet, setSelectedCostSheet] = useState<CostSheet | null>(null);

  // Quick Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MercerieCategory | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('📦');
  const [catDescInput, setCatDescInput] = useState('');

  // Form Fields - Mercerie Item
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<string>('Fils');
  const [itemSubcategory, setItemSubcategory] = useState('');
  const [itemColor, setItemColor] = useState('Bleu Marine');
  const [itemColorHex, setItemColorHex] = useState('#000080');
  const [itemSecondaryColor, setItemSecondaryColor] = useState('');
  const [itemMaterial, setItemMaterial] = useState('Polyester');
  const [itemCustomMaterial, setItemCustomMaterial] = useState('');
  const [itemSize, setItemSize] = useState('N°40');
  const [itemUnit, setItemUnit] = useState('Bobine');
  const [itemQuantity, setItemQuantity] = useState(10);
  const [itemMinQuantity, setItemMinQuantity] = useState(3);
  const [itemPurchasePrice, setItemPurchasePrice] = useState(1000);
  const [itemSellingPrice, setItemSellingPrice] = useState(1500);
  const [itemSupplier, setItemSupplier] = useState('');
  const [itemSupplierRef, setItemSupplierRef] = useState('');
  const [itemInternalRef, setItemInternalRef] = useState('');
  const [itemPhoto, setItemPhoto] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Form Fields - Cost Sheet
  const [costTitle, setCostTitle] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState('');
  const [costClientName, setCostClientName] = useState('');
  const [costModelName, setCostModelName] = useState('');
  const [costFabricCost, setCostFabricCost] = useState(15000);
  const [costFabricDetails, setCostFabricDetails] = useState('');
  const [costLaborCost, setCostLaborCost] = useState(10000);
  const [costLaborDetails, setCostLaborDetails] = useState('');
  const [costOverheadCost, setCostOverheadCost] = useState(2500);
  const [costOverheadDetails, setCostOverheadDetails] = useState('Électricité, fil d\'assemblage, transport d\'atelier');
  const [costSellingPrice, setCostSellingPrice] = useState(45000);
  
  // Selected supplies for current cost sheet
  const [selectedSupplies, setSelectedSupplies] = useState<CostSheetItem[]>([]);
  const [currentSupplyId, setCurrentSupplyId] = useState('');
  const [currentSupplyQty, setCurrentSupplyQty] = useState(1);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterColorFamily, setFilterColorFamily] = useState<string>('all');
  const [filterMaterial, setFilterMaterial] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'alert' | 'in_stock'>('all');

  // Load Initial Data
  useEffect(() => {
    try {
      // 1. Load Dynamic Categories
      const loadedCats = MercerieCategoryService.getCategories(merchant.id);
      setCategories(loadedCats);

      // 2. Load Mercerie Items
      const savedMercerie = localStorage.getItem(`tailleur_mercerie_${merchant.id}`);
      if (savedMercerie) {
        const parsed: MercerieItem[] = JSON.parse(savedMercerie);
        setMercerie(parsed);
      } else {
        // Sample complete mercerie items
        const defaultMercerie: MercerieItem[] = [
          {
            id: 'm-1',
            name: 'Fil Polyester Haute Résistance',
            category: 'Fils',
            subcategory: 'Couture générale',
            color: 'Bleu Marine',
            colorHex: '#000080',
            material: 'Polyester',
            size: 'N°40',
            unit: 'Bobine',
            quantity: 18,
            minQuantity: 5,
            purchasePrice: 1200,
            sellingPrice: 1800,
            supplier: 'Mercerie Moderne Dakar',
            internalRef: 'FIL-POL-01',
            notes: 'Bobine 1000m idéale pour assemblage Bazin et Wax.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-2',
            name: 'Fermeture Éclair Invisible',
            category: 'Fermetures Éclair',
            subcategory: 'Invisible',
            color: 'Blanc Cassé',
            colorHex: '#F8F9FA',
            material: 'Nylon',
            size: '60 cm',
            unit: 'Pièce',
            quantity: 42,
            minQuantity: 10,
            purchasePrice: 400,
            sellingPrice: 750,
            supplier: 'Fournisseur Sandaga',
            internalRef: 'ZIP-INV-60',
            notes: 'Idéale pour robes ajustées et tailleurs.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-3',
            name: 'Boutons Métal Gravés Officier',
            category: 'Boutons',
            subcategory: 'Veste / Boubou',
            color: 'Or Métallique',
            colorHex: '#D4AF37',
            material: 'Laiton',
            size: '20 mm',
            unit: 'Grosses (144 pcs)',
            quantity: 4,
            minQuantity: 2,
            purchasePrice: 4500,
            sellingPrice: 7000,
            supplier: 'Dubaï Import',
            internalRef: 'BTN-OR-20',
            notes: 'Finition dorée brillante pour vestes et boubous VIP.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-4',
            name: 'Élastique Souple Plat Ceinture',
            category: 'Élastiques',
            color: 'Blanc Pur',
            colorHex: '#FFFFFF',
            material: 'Élastique / Gomme',
            size: '3 cm',
            unit: 'Mètre',
            quantity: 35,
            minQuantity: 10,
            purchasePrice: 250,
            sellingPrice: 500,
            supplier: 'Sandaga Gros',
            internalRef: 'ELAS-30',
            notes: 'Pour pantalons boubous et ceintures jupes.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-5',
            name: 'Doublure Satin Toucher Soie',
            category: 'Entoilages',
            color: 'Noir Intense',
            colorHex: '#000000',
            material: 'Satin',
            size: 'Largeur 1.5m',
            unit: 'Mètre',
            quantity: 28,
            minQuantity: 8,
            purchasePrice: 1500,
            sellingPrice: 2500,
            supplier: 'Dakar Tissus',
            internalRef: 'DOUB-SAT-01',
            notes: 'Doublure fluide et douce pour vestes et robes.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-6',
            name: 'Dentelle Fine Perlée',
            category: 'Dentelles',
            color: 'Vert Émeraude',
            colorHex: '#50C878',
            material: 'Coton / Perles',
            size: '15 cm',
            unit: 'Mètre',
            quantity: 3, // Low stock on purpose
            minQuantity: 5,
            purchasePrice: 4800,
            sellingPrice: 8000,
            supplier: 'Avenue Ponty Mercerie',
            internalRef: 'DENT-EM-15',
            notes: 'Très demandée pour encolures et bas de boubou.',
            lastRestocked: new Date().toISOString().split('T')[0]
          }
        ];
        setMercerie(defaultMercerie);
        localStorage.setItem(`tailleur_mercerie_${merchant.id}`, JSON.stringify(defaultMercerie));
      }

      // 3. Load Cost Sheets
      const savedCosts = localStorage.getItem(`tailleur_costs_${merchant.id}`);
      if (savedCosts) {
        setCostSheets(JSON.parse(savedCosts));
      } else {
        const defaultCosts: CostSheet[] = [
          {
            id: 'c-1',
            title: 'Robe Sirène Dentelle - Mme Diagne',
            clientName: 'Awa Diagne',
            modelName: 'Robe Sirène Haute Couture',
            fabricCost: 35000,
            fabricDetails: '5m de Bazin brodé et tulle de soie',
            mercerieCostItems: [
              { mercerieId: 'm-2', name: 'Fermeture Éclair Invisible (60cm Blanc Cassé)', quantityUsed: 1, unitCost: 400 },
              { mercerieId: 'm-5', name: 'Doublure Satin Toucher Soie (Mètre)', quantityUsed: 4, unitCost: 1500 }
            ],
            laborCost: 18000,
            laborDetails: 'Montage principal (Moustapha) + Broderies (Fatou)',
            overheadCost: 3000,
            overheadDetails: 'Fils de bâti, aiguille spéciale dentelle, repassage vapeur',
            totalCostPrice: 62400,
            sellingPrice: 95000,
            profit: 32600,
            marginPercent: 34.31,
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
          }
        ];
        setCostSheets(defaultCosts);
        localStorage.setItem(`tailleur_costs_${merchant.id}`, JSON.stringify(defaultCosts));
      }

      // 4. Load Orders
      const savedOrders = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (e) {
      console.error('Error loading Mercerie data:', e);
    }
  }, [merchant.id]);

  // Synchronizers
  const syncMercerie = (newMercerie: MercerieItem[]) => {
    setMercerie(newMercerie);
    localStorage.setItem(`tailleur_mercerie_${merchant.id}`, JSON.stringify(newMercerie));
  };

  const syncCategories = (newCategories: MercerieCategory[]) => {
    setCategories(newCategories);
    MercerieCategoryService.saveCategories(newCategories, merchant.id);
  };

  const syncCostSheets = (newCosts: CostSheet[]) => {
    setCostSheets(newCosts);
    localStorage.setItem(`tailleur_costs_${merchant.id}`, JSON.stringify(newCosts));
  };

  // Active Category Names
  const activeCategoryNames = useMemo(() => {
    return categories.filter(c => c.isActive).map(c => c.name);
  }, [categories]);

  // ----------------------------------------------------
  // ITEM FORM MODAL HANDLERS
  // ----------------------------------------------------
  const openItemForm = (item: MercerieItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category || activeCategoryNames[0] || 'Fils');
      setItemSubcategory(item.subcategory || '');
      setItemColor(item.color || 'Bleu Marine');
      setItemColorHex(item.colorHex || '#000080');
      setItemSecondaryColor(item.secondaryColor || '');
      setItemMaterial(item.material || 'Polyester');
      setItemCustomMaterial('');
      setItemSize(item.size || 'N°40');
      setItemUnit(item.unit || 'Bobine');
      setItemQuantity(item.quantity);
      setItemMinQuantity(item.minQuantity);
      setItemPurchasePrice(item.purchasePrice);
      setItemSellingPrice(item.sellingPrice || item.purchasePrice * 1.5);
      setItemSupplier(item.supplier || '');
      setItemSupplierRef(item.supplierRef || '');
      setItemInternalRef(item.internalRef || '');
      setItemPhoto(item.photo || '');
      setItemNotes(item.notes || '');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemCategory(activeCategoryNames[0] || 'Fils');
      setItemSubcategory('');
      setItemColor('Bleu Marine');
      setItemColorHex('#000080');
      setItemSecondaryColor('');
      setItemMaterial('Polyester');
      setItemCustomMaterial('');
      setItemSize('N°40');
      setItemUnit('Bobine');
      setItemQuantity(10);
      setItemMinQuantity(3);
      setItemPurchasePrice(1000);
      setItemSellingPrice(1500);
      setItemSupplier('');
      setItemSupplierRef('');
      setItemInternalRef(`REF-${Math.floor(1000 + Math.random() * 9000)}`);
      setItemPhoto('');
      setItemNotes('');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Le nom de la fourniture est obligatoire.');
      return;
    }

    const finalMaterial = itemCustomMaterial.trim() || itemMaterial;

    const newItem: MercerieItem = {
      id: editingItem ? editingItem.id : `m-${Date.now()}`,
      name: itemName.trim(),
      category: itemCategory,
      subcategory: itemSubcategory.trim() || undefined,
      color: itemColor,
      colorHex: itemColorHex,
      secondaryColor: itemSecondaryColor.trim() || undefined,
      material: finalMaterial,
      size: itemSize.trim(),
      unit: itemUnit,
      quantity: Number(itemQuantity),
      minQuantity: Number(itemMinQuantity),
      purchasePrice: Number(itemPurchasePrice),
      sellingPrice: Number(itemSellingPrice),
      supplier: itemSupplier.trim() || undefined,
      supplierRef: itemSupplierRef.trim() || undefined,
      internalRef: itemInternalRef.trim() || undefined,
      photo: itemPhoto.trim() || undefined,
      notes: itemNotes.trim() || undefined,
      lastRestocked: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      const updated = mercerie.map(i => i.id === editingItem.id ? newItem : i);
      syncMercerie(updated);
      toast.success('Article de mercerie mis à jour avec succès.');
    } else {
      syncMercerie([newItem, ...mercerie]);
      toast.success('Nouvel article de mercerie enregistré.');
    }

    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    const item = mercerie.find(m => m.id === id);
    if (confirm(`Voulez-vous vraiment retirer "${item?.name || 'cet article'}" du stock ?`)) {
      const updated = mercerie.filter(i => i.id !== id);
      syncMercerie(updated);
      toast.success('Article supprimé du stock de mercerie.');
    }
  };

  const handleQuickAddQty = (id: string, qtyToAdd: number) => {
    const updated = mercerie.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: item.quantity + qtyToAdd,
          lastRestocked: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });
    syncMercerie(updated);
    toast.success(`+${qtyToAdd} unité(s) ajoutée(s) au stock.`);
  };

  // ----------------------------------------------------
  // DYNAMIC CATEGORY MANAGEMENT HANDLERS
  // ----------------------------------------------------
  const openCategoryModal = (cat: MercerieCategory | null = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCatNameInput(cat.name);
      setCatIconInput(cat.icon || '📦');
      setCatDescInput(cat.description || '');
    } else {
      setEditingCategory(null);
      setCatNameInput('');
      setCatIconInput('📦');
      setCatDescInput('');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const updated = MercerieCategoryService.updateCategory(
          editingCategory.id,
          {
            name: catNameInput,
            icon: catIconInput,
            description: catDescInput
          },
          merchant.id
        );
        const allCats = MercerieCategoryService.getCategories(merchant.id);
        syncCategories(allCats);
        toast.success(`Catégorie "${updated.name}" mise à jour.`);
      } else {
        const created = MercerieCategoryService.addCategory(
          catNameInput,
          catIconInput,
          catDescInput,
          merchant.id
        );
        const allCats = MercerieCategoryService.getCategories(merchant.id);
        syncCategories(allCats);
        // If modal was opened from inside item form, auto select newly created category!
        setItemCategory(created.name);
        toast.success(`Nouvelle catégorie "${created.name}" créée !`);
      }
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement de la catégorie.');
    }
  };

  const handleToggleCategoryActive = (id: string) => {
    const target = categories.find(c => c.id === id);
    if (!target) return;
    try {
      MercerieCategoryService.updateCategory(id, { isActive: !target.isActive }, merchant.id);
      const allCats = MercerieCategoryService.getCategories(merchant.id);
      syncCategories(allCats);
      toast.success(`Catégorie "${target.name}" ${!target.isActive ? 'activée' : 'désactivée'}.`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    try {
      MercerieCategoryService.deleteCategory(
        id,
        (catName) => mercerie.some(item => item.category?.toLowerCase() === catName.toLowerCase()),
        merchant.id
      );
      const allCats = MercerieCategoryService.getCategories(merchant.id);
      syncCategories(allCats);
      toast.success('Catégorie supprimée.');
    } catch (err: any) {
      toast.error(err.message || 'Impossible de supprimer cette catégorie.');
    }
  };

  const handleReorderCategory = (id: string, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(c => c.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prev = sorted[index - 1];
      const temp = sorted[index].order;
      sorted[index].order = prev.order;
      prev.order = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const next = sorted[index + 1];
      const temp = sorted[index].order;
      sorted[index].order = next.order;
      next.order = temp;
    }

    syncCategories(sorted);
  };

  // ----------------------------------------------------
  // COST SHEET SIMULATOR & CALCULATOR HANDLERS
  // ----------------------------------------------------
  const handleAddSupplyToCostSheet = () => {
    if (!currentSupplyId) {
      toast.error('Sélectionnez un article de mercerie.');
      return;
    }
    const item = mercerie.find(m => m.id === currentSupplyId);
    if (!item) return;

    if (currentSupplyQty > item.quantity) {
      toast.error(`Stock insuffisant ! Seulement ${item.quantity} ${item.unit || 'unités'} disponibles.`);
      return;
    }

    const existingIndex = selectedSupplies.findIndex(s => s.mercerieId === currentSupplyId);
    if (existingIndex >= 0) {
      const updated = [...selectedSupplies];
      updated[existingIndex].quantityUsed += currentSupplyQty;
      setSelectedSupplies(updated);
    } else {
      setSelectedSupplies([
        ...selectedSupplies,
        {
          mercerieId: currentSupplyId,
          name: `${item.name} (${item.color || ''} ${item.size || ''})`.trim(),
          quantityUsed: currentSupplyQty,
          unitCost: item.purchasePrice
        }
      ]);
    }

    setCurrentSupplyId('');
    setCurrentSupplyQty(1);
    toast.success('Fourniture ajoutée à la fiche de coût.');
  };

  const handleRemoveSupplyFromCostSheet = (idx: number) => {
    setSelectedSupplies(selectedSupplies.filter((_, i) => i !== idx));
  };

  const draftMercerieTotal = useMemo(() => {
    return selectedSupplies.reduce((sum, s) => sum + (s.quantityUsed * s.unitCost), 0);
  }, [selectedSupplies]);

  const draftTotalCostPrice = useMemo(() => {
    return Number(costFabricCost) + draftMercerieTotal + Number(costLaborCost) + Number(costOverheadCost);
  }, [costFabricCost, draftMercerieTotal, costLaborCost, costOverheadCost]);

  const draftProfit = useMemo(() => {
    return Number(costSellingPrice) - draftTotalCostPrice;
  }, [costSellingPrice, draftTotalCostPrice]);

  const draftMarginPercent = useMemo(() => {
    if (!costSellingPrice || Number(costSellingPrice) === 0) return 0;
    return (draftProfit / Number(costSellingPrice)) * 100;
  }, [draftProfit, costSellingPrice]);

  const handleSaveCostSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costModelName.trim() || !costClientName.trim()) {
      toast.error('Indiquez le client et le modèle de vêtement.');
      return;
    }

    const newSheet: CostSheet = {
      id: `c-${Date.now()}`,
      title: costTitle.trim() || `${costModelName} - ${costClientName}`,
      orderId: linkedOrderId || undefined,
      clientName: costClientName.trim(),
      modelName: costModelName.trim(),
      fabricCost: Number(costFabricCost),
      fabricDetails: costFabricDetails.trim() || undefined,
      mercerieCostItems: selectedSupplies,
      laborCost: Number(costLaborCost),
      laborDetails: costLaborDetails.trim() || undefined,
      overheadCost: Number(costOverheadCost),
      overheadDetails: costOverheadDetails.trim() || undefined,
      totalCostPrice: draftTotalCostPrice,
      sellingPrice: Number(costSellingPrice),
      profit: draftProfit,
      marginPercent: Number(draftMarginPercent.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    syncCostSheets([newSheet, ...costSheets]);

    // Decrement inventory stock
    const updatedMercerie = [...mercerie];
    selectedSupplies.forEach(used => {
      const idx = updatedMercerie.findIndex(m => m.id === used.mercerieId);
      if (idx !== -1) {
        updatedMercerie[idx].quantity = Math.max(0, updatedMercerie[idx].quantity - used.quantityUsed);
      }
    });
    syncMercerie(updatedMercerie);

    toast.success('Fiche de coût enregistrée ! Stock de mercerie mis à jour.');
    setSubTab('costs');
    resetCostSheetForm();
  };

  const resetCostSheetForm = () => {
    setCostTitle('');
    setLinkedOrderId('');
    setCostClientName('');
    setCostModelName('');
    setCostFabricCost(15000);
    setCostFabricDetails('');
    setCostLaborCost(10000);
    setCostLaborDetails('');
    setCostOverheadCost(2500);
    setCostOverheadDetails('Électricité, fil d\'assemblage, transport d\'atelier');
    setCostSellingPrice(45000);
    setSelectedSupplies([]);
  };

  // ----------------------------------------------------
  // FILTERED MERCERIE LIST
  // ----------------------------------------------------
  const filteredMercerie = useMemo(() => {
    let list = mercerie;

    // Smart multi-keyword search
    if (searchQuery.trim()) {
      list = MercerieAttributeService.smartSearch(list, searchQuery, filterCategory);
    } else if (filterCategory !== 'all') {
      list = list.filter(i => i.category?.toLowerCase() === filterCategory.toLowerCase());
    }

    // Color Family Filter
    if (filterColorFamily !== 'all') {
      list = list.filter(i => {
        const info = MercerieColorLibraryService.getColorInfo(i.color);
        return info.family === filterColorFamily;
      });
    }

    // Material Filter
    if (filterMaterial !== 'all') {
      list = list.filter(i => i.material?.toLowerCase() === filterMaterial.toLowerCase());
    }

    // Stock Status Filter
    if (filterStockStatus === 'alert') {
      list = list.filter(i => i.quantity <= i.minQuantity);
    } else if (filterStockStatus === 'in_stock') {
      list = list.filter(i => i.quantity > i.minQuantity);
    }

    return list;
  }, [mercerie, searchQuery, filterCategory, filterColorFamily, filterMaterial, filterStockStatus]);

  // Analytics KPI totals
  const alertItemsCount = mercerie.filter(item => item.quantity <= item.minQuantity).length;
  const totalStockValue = mercerie.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

  const totalFabricAll = costSheets.reduce((sum, c) => sum + c.fabricCost, 0);
  const totalMercerieAll = costSheets.reduce((sum, c) => sum + c.mercerieCostItems.reduce((s, m) => s + (m.quantityUsed * m.unitCost), 0), 0);
  const totalLaborAll = costSheets.reduce((sum, c) => sum + c.laborCost, 0);
  const totalOverheadAll = costSheets.reduce((sum, c) => sum + c.overheadCost, 0);
  const totalAllCosts = totalFabricAll + totalMercerieAll + totalLaborAll + totalOverheadAll;

  const shareFabric = totalAllCosts > 0 ? (totalFabricAll / totalAllCosts) * 100 : 0;
  const shareMercerie = totalAllCosts > 0 ? (totalMercerieAll / totalAllCosts) * 100 : 0;
  const shareLabor = totalAllCosts > 0 ? (totalLaborAll / totalAllCosts) * 100 : 0;
  const shareOverhead = totalAllCosts > 0 ? (totalOverheadAll / totalAllCosts) * 100 : 0;

  const getMarginBadgeClass = (marginPct: number) => {
    if (marginPct >= 40) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (marginPct >= 20) return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-rose-100 text-rose-800 border border-rose-200';
  };

  const getMarginTextColor = (marginPct: number) => {
    if (marginPct >= 40) return 'text-emerald-600';
    if (marginPct >= 20) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
      id="tailleur-mercerie-cost-container"
    >
      {/* Top Header & KPI Summary Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Atelier Couture • Fournitures & Revient
            </span>
            {alertItemsCount > 0 && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {alertItemsCount} Ravitaillements requis
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-2 flex items-center gap-2">
            <Box className="w-6 h-6 text-violet-600" /> Mercerie Intelligent & Fiches de Coût
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Bibliothèque complète de fournitures avec identification par couleur, taille, matière et catégories administrables.
          </p>
        </div>

        {/* Global KPIs */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 min-w-[130px]">
            <p className="text-[9px] text-gray-400 font-bold uppercase">Articles en Stock</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{mercerie.length} réf.</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 min-w-[150px]">
            <p className="text-[9px] text-gray-400 font-bold uppercase">Valeur du Stock</p>
            <p className="text-lg font-bold text-violet-700 mt-0.5">{totalStockValue.toLocaleString('fr-FR')} {currency}</p>
          </div>
        </div>
      </div>

      {/* Main Sub-tabs Header Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/60 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSubTab('mercerie')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === 'mercerie' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Box className="w-4 h-4 text-violet-600" /> Stock Mercerie ({mercerie.length})
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === 'categories' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FolderPlus className="w-4 h-4 text-violet-600" /> Catégories ({categories.length})
        </button>

        <button
          onClick={() => setSubTab('costs')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === 'costs' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-violet-600" /> Fiches de Coût ({costSheets.length})
        </button>

        <button
          onClick={() => { resetCostSheetForm(); setSubTab('new_cost'); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === 'new_cost' ? 'bg-violet-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plus className="w-4 h-4" /> Calculer un Coût
        </button>

        <button
          onClick={() => setSubTab('analytics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === 'analytics' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-violet-600" /> Rentabilité & Marges
        </button>
      </div>

      {/* ==================================================== */}
      {/* SUB TAB 1: STOCK MERCERIE */}
      {/* ==================================================== */}
      {subTab === 'mercerie' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search box */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Recherche intelligente: nom, fil bleu, bouton 20mm, polyester, réf, etc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Action button */}
              <button
                onClick={() => openItemForm()}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 w-full md:w-auto justify-center"
              >
                <Plus className="w-4 h-4" /> Ajouter une Fourniture
              </button>
            </div>

            {/* Filter pills & Selectors */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200/80">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-500 text-[10px] uppercase">Catégorie:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="all">Toutes ({categories.length})</option>
                  {activeCategoryNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200/80">
                <Palette className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-500 text-[10px] uppercase">Couleur:</span>
                <select
                  value={filterColorFamily}
                  onChange={(e) => setFilterColorFamily(e.target.value)}
                  className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                >
                  {MercerieColorLibraryService.getColorFamilies().map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200/80">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-500 text-[10px] uppercase">Matière:</span>
                <select
                  value={filterMaterial}
                  onChange={(e) => setFilterMaterial(e.target.value)}
                  className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="all">Toutes les matières</option>
                  {MercerieAttributeService.getMaterials().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200/80">
                <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-500 text-[10px] uppercase">Niveau Stock:</span>
                <select
                  value={filterStockStatus}
                  onChange={(e) => setFilterStockStatus(e.target.value as any)}
                  className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="all">Tous les articles</option>
                  <option value="alert">⚠️ Alerte Stock Minimum</option>
                  <option value="in_stock">✅ Stock Suffisant</option>
                </select>
              </div>
            </div>
          </div>

          {/* Supplies Grid Display */}
          {filteredMercerie.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Box className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucune fourniture de mercerie trouvée</p>
              <p className="text-xs text-gray-400">Modifiez vos termes de recherche ou ajoutez un nouvel article.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMercerie.map((item) => {
                const isLowStock = item.quantity <= item.minQuantity;
                const catIcon = MercerieCategoryService.getCategoryIcon(item.category, merchant.id);
                const colorInfo = MercerieColorLibraryService.getColorInfo(item.color);

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                      isLowStock ? 'border-rose-200 shadow-sm shadow-rose-50/50' : 'border-gray-100'
                    }`}
                  >
                    {/* Stock Alert Badge */}
                    {isLowStock && (
                      <span className="absolute top-4 right-4 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Alerte Stock
                      </span>
                    )}

                    <div className="space-y-3.5">
                      {/* Category & Internal Ref Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <span>{catIcon}</span> {item.category}
                        </span>
                        {item.internalRef && (
                          <span className="text-[10px] font-mono text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded">
                            {item.internalRef}
                          </span>
                        )}
                      </div>

                      {/* Main Title */}
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                        {item.subcategory && (
                          <p className="text-[11px] text-gray-500 font-medium">{item.subcategory}</p>
                        )}
                      </div>

                      {/* Rich Attribute Badges (Color, Material, Size) */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* Color Badge with Swatch */}
                        {item.color && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-800">
                            <span 
                              className="w-3 h-3 rounded-full border border-black/20 shrink-0" 
                              style={{ backgroundColor: item.colorHex || colorInfo.hex || '#000' }}
                            />
                            {item.color}
                          </span>
                        )}

                        {/* Size / Dimension Badge */}
                        {item.size && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-50 border border-violet-100 text-violet-800">
                            <span>📏</span> {item.size}
                          </span>
                        )}

                        {/* Material Badge */}
                        {item.material && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 border border-amber-100 text-amber-800">
                            <span>🧵</span> {item.material}
                          </span>
                        )}
                      </div>

                      {item.supplier && (
                        <p className="text-[11px] text-gray-500 font-medium">Fournisseur: {item.supplier}</p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-gray-500 italic">"{item.notes}"</p>
                      )}

                      {/* Quantities & Price KPI Box */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center">
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Stock</p>
                          <p className={`text-sm font-bold ${isLowStock ? 'text-rose-600' : 'text-gray-900'}`}>
                            {item.quantity} <span className="text-[10px] text-gray-400 font-normal">{item.unit || 'u'}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Seuil min</p>
                          <p className="text-sm font-bold text-gray-600">{item.minQuantity}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Prix d'achat</p>
                          <p className="text-sm font-bold text-violet-700">{item.purchasePrice.toLocaleString('fr-FR')} F</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 border-t border-gray-50 mt-4 pt-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleQuickAddQty(item.id, 5)}
                          className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickAddQty(item.id, 10)}
                          className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          +10
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openItemForm(item)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB TAB: CATEGORY MANAGEMENT (ADMINISTRATION) */}
      {/* ==================================================== */}
      {subTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Module Administration
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">Gestion des Catégories de Mercerie</h3>
              <p className="text-xs text-gray-500 mt-1">
                Créez, modifiez, désactivez ou réorganisez les catégories de fournitures. Les catégories actives sont directement disponibles dans tout l'atelier.
              </p>
            </div>
            <button
              onClick={() => openCategoryModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouvelle Catégorie
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
                    <th className="py-3 px-4 w-12 text-center">Ordre</th>
                    <th className="py-3 px-4">Icône & Catégorie</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Fournitures Rattachées</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {categories.map((cat, idx) => {
                    const itemCount = mercerie.filter(i => i.category?.toLowerCase() === cat.name.toLowerCase()).length;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-gray-400">
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={() => handleReorderCategory(cat.id, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 hover:text-violet-600 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-slate-800">{cat.order}</span>
                            <button
                              onClick={() => handleReorderCategory(cat.id, 'down')}
                              disabled={idx === categories.length - 1}
                              className="p-0.5 hover:text-violet-600 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="text-lg bg-slate-100 p-1.5 rounded-lg">{cat.icon || '📦'}</span>
                            <span>{cat.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                          {cat.description || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full font-bold">
                            {itemCount} article(s)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleCategoryActive(cat.id)}
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] cursor-pointer inline-flex items-center gap-1 ${
                              cat.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {cat.isActive ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {cat.isActive ? 'Active' : 'Désactivée'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openCategoryModal(cat)}
                              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB TAB: COST SHEETS LIST */}
      {/* ==================================================== */}
      {subTab === 'costs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Historique de vos Coûts de Revient & Rentabilité</h3>
            <button
              onClick={() => { resetCostSheetForm(); setSubTab('new_cost'); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouvelle Fiche
            </button>
          </div>

          {costSheets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calculator className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucune fiche de coût calculée</p>
              <p className="text-xs text-gray-400">Pour évaluer votre rentabilité, cliquez sur "Calculer un Coût".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {costSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative flex flex-col justify-between"
                >
                  <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold ${getMarginBadgeClass(sheet.marginPercent)}`}>
                    Marge : {sheet.marginPercent}%
                  </span>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Modèle / Confection</span>
                      <h4 className="font-bold text-gray-900 text-sm mt-0.5">{sheet.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">Client: {sheet.clientName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Coût de Revient</p>
                        <p className="font-bold text-gray-900 mt-0.5">{sheet.totalCostPrice.toLocaleString('fr-FR')} F</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Prix de Vente</p>
                        <p className="font-bold text-violet-700 mt-0.5">{sheet.sellingPrice.toLocaleString('fr-FR')} F</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Marge Nette</p>
                        <p className={`font-bold mt-0.5 ${getMarginTextColor(sheet.marginPercent)}`}>
                          +{sheet.profit.toLocaleString('fr-FR')} F
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4 text-xs">
                    <span className="text-[10px] text-gray-400">{new Date(sheet.createdAt).toLocaleDateString('fr-FR')}</span>
                    <button
                      onClick={() => setSelectedCostSheet(sheet)}
                      className="text-violet-600 hover:text-violet-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Voir Fiche Complète
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB TAB: CALCULATEUR & SIMULATEUR */}
      {/* ==================================================== */}
      {subTab === 'new_cost' && (
        <form onSubmit={handleSaveCostSheet} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-violet-500" /> Informations Client & Modèle
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Nom du Client</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Mme Awa Diagne"
                      value={costClientName}
                      onChange={(e) => setCostClientName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Modèle de vêtement</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Taille Basse Wax et broderies"
                      value={costModelName}
                      onChange={(e) => setCostModelName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Titre de la fiche</label>
                  <input
                    type="text"
                    placeholder="ex: Robe de mariée de Mme Diouf"
                    value={costTitle}
                    onChange={(e) => setCostTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Tissu Cost */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-violet-500" /> Coût de la Matière Première (Tissus)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Coût Tissu ({currency})</label>
                    <input
                      type="number"
                      value={costFabricCost}
                      onChange={(e) => setCostFabricCost(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Détails de la matière</label>
                    <input
                      type="text"
                      placeholder="ex: 6 mètres de basin Getzner VIP teinté"
                      value={costFabricDetails}
                      onChange={(e) => setCostFabricDetails(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Mercerie Consumed */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-violet-500" /> Fournitures consommées (Mercerie)
                </h4>

                <div className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Fourniture en stock</label>
                    <select
                      value={currentSupplyId}
                      onChange={(e) => setCurrentSupplyId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2 cursor-pointer"
                    >
                      <option value="">Sélectionner un article...</option>
                      {mercerie.map(m => (
                        <option key={m.id} value={m.id}>
                          {MercerieAttributeService.formatItemFullLabel(m, merchant.id)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={currentSupplyQty}
                      onChange={(e) => setCurrentSupplyQty(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSupplyToCostSheet}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer h-9 shrink-0"
                  >
                    Ajouter
                  </button>
                </div>

                {selectedSupplies.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-2">Aucune fourniture de mercerie ajoutée à cette fiche.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSupplies.map((supply, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-xs text-gray-700">
                        <div>
                          <span className="font-bold text-gray-900">{supply.name}</span>
                          <span className="text-[11px] text-gray-500 ml-2">({supply.quantityUsed} x {supply.unitCost} F)</span>
                        </div>
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                          <span>{(supply.quantityUsed * supply.unitCost).toLocaleString('fr-FR')} F</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplyFromCostSheet(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-white rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-gray-100">
                      <span className="text-gray-500 uppercase text-[10px]">Total Fournitures</span>
                      <span className="text-violet-700">{draftMercerieTotal.toLocaleString('fr-FR')} {currency}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Labor */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-violet-500" /> Main d'œuvre / Rémunération Tailleurs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Coût Artisan ({currency})</label>
                    <input
                      type="number"
                      value={costLaborCost}
                      onChange={(e) => setCostLaborCost(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Artisan affecté ou détails</label>
                    <input
                      type="text"
                      placeholder="ex: Affecté à Moustapha (Montage veste)"
                      value={costLaborDetails}
                      onChange={(e) => setCostLaborDetails(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Overhead */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-violet-500" /> Charges Indirectes d'Atelier
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Frais Estimés ({currency})</label>
                    <input
                      type="number"
                      value={costOverheadCost}
                      onChange={(e) => setCostOverheadCost(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Détails des charges</label>
                    <input
                      type="text"
                      placeholder="ex: Électricité, fil d'assemblage, repassage..."
                      value={costOverheadDetails}
                      onChange={(e) => setCostOverheadDetails(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Selling Price */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-violet-500" /> Prix de Vente Client
                </h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tarif Total Facturé au Client ({currency})</label>
                  <input
                    type="number"
                    value={costSellingPrice}
                    onChange={(e) => setCostSellingPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-violet-50 border border-violet-200 rounded-xl text-sm font-bold text-violet-900"
                  />
                </div>
              </div>

            </div>

            {/* Right Simulator Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border-2 border-violet-100 rounded-3xl p-6 shadow-sm space-y-6 sticky top-6">
                <div className="border-b border-gray-100 pb-4 text-center">
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full uppercase tracking-wider">Simulateur en Direct</span>
                  <h4 className="font-bold text-gray-900 text-sm mt-3">Rendement Financier Estimé</h4>
                  <p className="text-xs text-gray-500 mt-1">{costModelName || 'Nouveau modèle'} • {costClientName || 'Nouveau client'}</p>
                </div>

                <div className="space-y-3 text-xs text-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Prix de Vente final (A) :</span>
                    <span className="font-bold text-gray-900">{Number(costSellingPrice).toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  <div className="border-t border-dashed border-gray-100 pt-3 space-y-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Structure des Coûts :</p>
                    <div className="flex justify-between">
                      <span>1. Tissu & Wax :</span>
                      <span className="font-semibold text-gray-900">{Number(costFabricCost).toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Fournitures (Mercerie) :</span>
                      <span className="font-semibold text-gray-900">{draftMercerieTotal.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3. Main d'œuvre (Personnel) :</span>
                      <span className="font-semibold text-gray-900">{Number(costLaborCost).toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span>4. Charges indirectes d'atelier :</span>
                      <span className="font-semibold text-gray-900">{Number(costOverheadCost).toLocaleString('fr-FR')} F</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-sm font-bold text-gray-900">
                    <span>Coût de Revient Total (B) :</span>
                    <span className="text-violet-700">{draftTotalCostPrice.toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">Marge nette (A - B) :</span>
                      <span className={`text-base font-bold ${getMarginTextColor(draftMarginPercent)}`}>
                        {draftProfit >= 0 ? '+' : ''}{draftProfit.toLocaleString('fr-FR')} {currency}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                        <span>Seuil de rentabilité</span>
                        <span className={getMarginTextColor(draftMarginPercent)}>{draftMarginPercent.toFixed(1)}% de Marge</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden relative">
                        <div style={{ width: `${Math.max(0, Math.min(100, draftMarginPercent))}%` }} className={`h-full ${
                          draftMarginPercent >= 40 ? 'bg-emerald-500' :
                          draftMarginPercent >= 20 ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Enregistrer la Fiche de Rentabilité
                  </button>
                  <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed">
                    L'enregistrement diminuera automatiquement le stock de fournitures utilisé.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* SUB TAB: ANALYTICS */}
      {/* ==================================================== */}
      {subTab === 'analytics' && (
        <div className="space-y-8">
          {costSheets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Pas assez de données pour générer des graphiques de rentabilité</p>
              <p className="text-xs text-gray-400">Calculez au moins une fiche de coût de revient pour débloquer les analyses de marge.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Layers className="w-4.5 h-4.5 text-violet-500" /> Répartition Globale des Charges de Production
                  </h4>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Tissu & Wax</span>
                        <span className="text-slate-500">{shareFabric.toFixed(1)}% ({totalFabricAll.toLocaleString('fr-FR')} F)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${shareFabric}%` }} className="h-full bg-violet-600 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Fournitures & Mercerie</span>
                        <span className="text-slate-500">{shareMercerie.toFixed(1)}% ({totalMercerieAll.toLocaleString('fr-FR')} F)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${shareMercerie}%` }} className="h-full bg-amber-500 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Main d'œuvre (Artisans)</span>
                        <span className="text-slate-500">{shareLabor.toFixed(1)}% ({totalLaborAll.toLocaleString('fr-FR')} F)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${shareLabor}%` }} className="h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT MERCERIE ITEM */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full uppercase">
                    Bibliothèque de Fournitures
                  </span>
                  <h3 className="font-bold text-lg text-gray-900 mt-1">
                    {editingItem ? 'Modifier la Fourniture' : 'Ajouter une Nouvelle Fourniture'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nom de l'article *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Fil Polyester, Fermeture Éclair Invisible, Boutons Officier"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-gray-900"
                  />
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-700">Catégorie *</label>
                      <button
                        type="button"
                        onClick={() => openCategoryModal()}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Nouvelle catégorie
                      </button>
                    </div>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs cursor-pointer font-bold"
                    >
                      {activeCategoryNames.map(cat => (
                        <option key={cat} value={cat}>
                          {MercerieCategoryService.getCategoryIcon(cat, merchant.id)} {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Sous-catégorie (optionnelle)</label>
                    <input
                      type="text"
                      placeholder="ex: Invisible, Broderie, Surjet, Jean..."
                      value={itemSubcategory}
                      onChange={(e) => setItemSubcategory(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Color Selector Component */}
                <div className="space-y-1">
                  <MercerieColorSelector
                    currentColor={itemColor}
                    currentColorHex={itemColorHex}
                    secondaryColor={itemSecondaryColor}
                    onChangeColor={(colorName, hex) => {
                      setItemColor(colorName);
                      setItemColorHex(hex);
                    }}
                    onChangeSecondaryColor={setItemSecondaryColor}
                    onChangeHex={setItemColorHex}
                    onChangeCustomName={setItemColor}
                  />
                </div>

                {/* Material & Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Matière *</label>
                    <select
                      value={itemMaterial}
                      onChange={(e) => setItemMaterial(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs cursor-pointer"
                    >
                      {MercerieAttributeService.getMaterials().map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Taille / Dimension *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: N°40, 15 mm, 60 cm, 3 cm..."
                      value={itemSize}
                      onChange={(e) => setItemSize(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                    />
                    {/* Suggestion pills based on chosen category */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {MercerieAttributeService.getSizeSuggestions(itemCategory).slice(0, 5).map(sugg => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => setItemSize(sugg.split(' ')[0])}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-violet-100 text-[10px] font-bold text-slate-700 rounded-md cursor-pointer"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quantities, Unit & Prices */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Unité</label>
                    <select
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    >
                      {MercerieAttributeService.getUnits().map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Alerte Min *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemMinQuantity}
                      onChange={(e) => setItemMinQuantity(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Prix Achat *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemPurchasePrice}
                      onChange={(e) => setItemPurchasePrice(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-violet-700"
                    />
                  </div>
                </div>

                {/* References & Supplier */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Code Interne</label>
                    <input
                      type="text"
                      placeholder="ex: REF-FIL-01"
                      value={itemInternalRef}
                      onChange={(e) => setItemInternalRef(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Fournisseur</label>
                    <input
                      type="text"
                      placeholder="ex: Sandaga Gros"
                      value={itemSupplier}
                      onChange={(e) => setItemSupplier(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Réf Fournisseur</label>
                    <input
                      type="text"
                      placeholder="ex: DKR-994"
                      value={itemSupplierRef}
                      onChange={(e) => setItemSupplierRef(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Notes / Emplacement dans l'atelier</label>
                  <textarea
                    placeholder="ex: Tiroir 3, étagère fil de broderie..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs h-16 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl bg-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Enregistrer fourniture
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base text-gray-900">
                  {editingCategory ? 'Modifier la Catégorie' : 'Créer une Nouvelle Catégorie'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nom de la catégorie *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Boutons Pression, Passants, Epaulettes..."
                    value={catNameInput}
                    onChange={(e) => setCatNameInput(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Icône (Emoji) *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={catIconInput}
                      onChange={(e) => setCatIconInput(e.target.value)}
                      className="w-16 p-2 text-center text-lg bg-gray-50 border border-gray-200 rounded-xl"
                    />
                    <div className="flex flex-wrap gap-1 text-base">
                      {['🧵', '🔘', '🧷', '✨', '〰️', '🎗️', '🔮', '⭐', '📜', '🔗', '🪡', '📍', '🎀', '🪢', '🔲', '📦'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setCatIconInput(emoji)}
                          className="p-1 hover:bg-violet-50 rounded cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Description (optionnelle)</label>
                  <textarea
                    placeholder="ex: Fournitures d'attache rapides et fermoirs"
                    value={catDescInput}
                    onChange={(e) => setCatDescInput(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs h-16 resize-none"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm cursor-pointer"
                  >
                    Enregistrer Catégorie
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* DETAIL MODAL: COST SHEET PREVIEW */}
      {/* ==================================================== */}
      <AnimatePresence>
        {selectedCostSheet && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-xl border border-gray-100"
            >
              <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-violet-400 bg-violet-950/80 px-2.5 py-0.5 rounded-full border border-violet-800 uppercase tracking-wider">
                    Fiche Technique & Financière
                  </span>
                  <h3 className="font-bold text-lg mt-2 text-white">{selectedCostSheet.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Détail des coûts et rentabilité pour le modèle</p>
                </div>
                <button
                  onClick={() => setSelectedCostSheet(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Client :</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedCostSheet.clientName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Modèle :</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedCostSheet.modelName}</p>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
                        <th className="py-2.5 px-4">Poste de dépense</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-gray-900">1. Matière (Tissu)</td>
                        <td className="py-2.5 px-4 text-gray-500 italic">{selectedCostSheet.fabricDetails || 'Tissu principal'}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{selectedCostSheet.fabricCost.toLocaleString('fr-FR')} F</td>
                      </tr>

                      {selectedCostSheet.mercerieCostItems.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-4 font-bold text-gray-900">2. Mercerie ({m.name})</td>
                          <td className="py-2.5 px-4 text-gray-500">{m.quantityUsed} unité(s) x {m.unitCost} F</td>
                          <td className="py-2.5 px-4 text-right font-bold">{(m.quantityUsed * m.unitCost).toLocaleString('fr-FR')} F</td>
                        </tr>
                      ))}

                      <tr>
                        <td className="py-2.5 px-4 font-bold text-gray-900">3. Main d'œuvre</td>
                        <td className="py-2.5 px-4 text-gray-500 italic">{selectedCostSheet.laborDetails || 'Confection et montage'}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{selectedCostSheet.laborCost.toLocaleString('fr-FR')} F</td>
                      </tr>

                      <tr>
                        <td className="py-2.5 px-4 font-bold text-gray-900">4. Frais Indirects</td>
                        <td className="py-2.5 px-4 text-gray-500 italic">{selectedCostSheet.overheadDetails || 'Charges atelier'}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{selectedCostSheet.overheadCost.toLocaleString('fr-FR')} F</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Coût de Revient Total :</span>
                    <span className="font-bold text-slate-900">{selectedCostSheet.totalCostPrice.toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Prix de Vente :</span>
                    <span className="font-bold text-emerald-600">{selectedCostSheet.sellingPrice.toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 text-sm font-bold text-slate-800">
                    <span>Bénéfice Net :</span>
                    <span className="text-emerald-600">+{selectedCostSheet.profit.toLocaleString('fr-FR')} {currency}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Imprimer
                </button>
                <button
                  onClick={() => setSelectedCostSheet(null)}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
