import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Trash2, Edit, Save, Search, 
  Filter, TrendingUp, TrendingDown, Layers, Box, AlertTriangle, 
  DollarSign, Check, ShoppingBag, Eye, RefreshCw, Sparkles, FileText,
  ChevronRight, Scissors, HelpCircle, ArrowLeft, Percent, Info, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface Merchant {
  id: string;
  name: string;
  currency?: string;
}

interface MercerieItem {
  id: string;
  name: string;
  category: 'Fils' | 'Fermetures' | 'Boutons' | 'Élastiques' | 'Doublures & Toiles' | 'Broderies & Galons' | 'Autres';
  quantity: number;
  minQuantity: number;
  purchasePrice: number; // Cost price per unit
  supplier?: string;
  notes?: string;
  lastRestocked: string;
}

interface CostSheetItem {
  mercerieId: string;
  name: string;
  quantityUsed: number;
  unitCost: number;
}

interface CostSheet {
  id: string;
  title: string;
  orderId?: string; // Optional link to actual Tailleur Order
  clientName: string;
  modelName: string;
  fabricCost: number;
  fabricDetails?: string;
  mercerieCostItems: CostSheetItem[];
  laborCost: number;
  laborDetails?: string;
  overheadCost: number; // Indirect costs like electricity, transport, etc.
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

const CATEGORIES = [
  'Fils',
  'Fermetures',
  'Boutons',
  'Élastiques',
  'Doublures & Toiles',
  'Broderies & Galons',
  'Autres'
] as const;

export const TailleurMercerieCostManager = ({ merchant }: TailleurMercerieCostManagerProps) => {
  const currency = merchant.currency || 'FCFA';

  // Base state
  const [mercerie, setMercerie] = useState<MercerieItem[]>([]);
  const [costSheets, setCostSheets] = useState<CostSheet[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [artisans, setArtisans] = useState<any[]>([]);

  // Sub-tab Navigation: 'mercerie' (Supplies stock), 'costs' (Cost Sheets), 'analytics' (Profitability analyses)
  const [subTab, setSubTab] = useState<'mercerie' | 'costs' | 'new_cost' | 'analytics'>('mercerie');

  // Modals / Detail state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MercerieItem | null>(null);
  const [selectedCostSheet, setSelectedCostSheet] = useState<CostSheet | null>(null);

  // Form Fields - Mercerie Item
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<MercerieItem['category']>('Fils');
  const [itemQuantity, setItemQuantity] = useState(0);
  const [itemMinQuantity, setItemMinQuantity] = useState(5);
  const [itemPurchasePrice, setItemPurchasePrice] = useState(500);
  const [itemSupplier, setItemSupplier] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Form Fields - Cost Sheet (Le Coût de Revient)
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
  
  // Dynamic list of supplies inside the current cost sheet
  const [selectedSupplies, setSelectedSupplies] = useState<CostSheetItem[]>([]);
  const [currentSupplyId, setCurrentSupplyId] = useState('');
  const [currentSupplyQty, setCurrentSupplyQty] = useState(1);

  // Searches & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load Data
  useEffect(() => {
    try {
      // 1. Load Mercerie Stock
      const savedMercerie = localStorage.getItem(`tailleur_mercerie_${merchant.id}`);
      if (savedMercerie) {
        setMercerie(JSON.parse(savedMercerie));
      } else {
        // Sample default haberdashery items
        const defaultMercerie: MercerieItem[] = [
          {
            id: 'm-1',
            name: 'Fils d\'Or à broder (Bobine)',
            category: 'Fils',
            quantity: 12,
            minQuantity: 3,
            purchasePrice: 2500,
            supplier: 'Mercerie Moderne Dakar',
            notes: 'Fil de haute qualité pour broderies d\'apparat.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-2',
            name: 'Fermeture Éclair invisible 60cm noire',
            category: 'Fermetures',
            quantity: 45,
            minQuantity: 10,
            purchasePrice: 400,
            supplier: 'Fournisseur Sandaga',
            notes: 'Idéal pour robes moulantes et ensembles tailleurs.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-3',
            name: 'Boutons dorés XL (Sachet de 50)',
            category: 'Boutons',
            quantity: 8,
            minQuantity: 2,
            purchasePrice: 3500,
            supplier: 'Mercerie Moderne Dakar',
            notes: 'Boutons style officier en métal gravé.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-4',
            name: 'Élastique souple plat 3cm (Mètre)',
            category: 'Élastiques',
            quantity: 25,
            minQuantity: 8,
            purchasePrice: 200,
            supplier: 'Sandaga Gros',
            notes: 'Pour ceintures de jupes et pantalons boubou.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-5',
            name: 'Doublure Satin Premium (Mètre)',
            category: 'Doublures & Toiles',
            quantity: 30,
            minQuantity: 10,
            purchasePrice: 1200,
            supplier: 'Sandaga Tissus',
            notes: 'Doublure ultra douce pour vestes et robes en dentelle.',
            lastRestocked: new Date().toISOString().split('T')[0]
          },
          {
            id: 'm-6',
            name: 'Dentelle fine perlée blanche (Mètre)',
            category: 'Broderies & Galons',
            quantity: 4,
            minQuantity: 5, // Under stock alert on purpose to demonstrate features
            purchasePrice: 4500,
            supplier: 'Import direct Dubaï',
            notes: 'Très demandée pour les tenues de mariage.',
            lastRestocked: new Date().toISOString().split('T')[0]
          }
        ];
        setMercerie(defaultMercerie);
        localStorage.setItem(`tailleur_mercerie_${merchant.id}`, JSON.stringify(defaultMercerie));
      }

      // 2. Load Cost Sheets (Coûts de revient)
      const savedCosts = localStorage.getItem(`tailleur_costs_${merchant.id}`);
      if (savedCosts) {
        setCostSheets(JSON.parse(savedCosts));
      } else {
        // Default Cost Sheets
        const defaultCosts: CostSheet[] = [
          {
            id: 'c-1',
            title: 'Robe Sirène Dentelle - Mme Diagne',
            clientName: 'Awa Diagne',
            modelName: 'Robe Sirène Haute Couture',
            fabricCost: 35000,
            fabricDetails: '5m de Basin brodé et tulle de soie',
            mercerieCostItems: [
              { mercerieId: 'm-2', name: 'Fermeture Éclair invisible 60cm noire', quantityUsed: 1, unitCost: 400 },
              { mercerieId: 'm-5', name: 'Doublure Satin Premium (Mètre)', quantityUsed: 4, unitCost: 1200 }
            ],
            laborCost: 18000,
            laborDetails: 'Montage principal (Moustapha) + Broderies (Fatou)',
            overheadCost: 3000,
            overheadDetails: 'Fils de bâti, aiguille spéciale dentelle, repassage vapeur',
            totalCostPrice: 61200, // 35000 + 400 + 4800 + 18000 + 3000
            sellingPrice: 95000,
            profit: 33800,
            marginPercent: 35.58,
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
          },
          {
            id: 'c-2',
            title: 'Grand Boubou Brodé Or - Mr Cissé',
            clientName: 'Amadou Cissé',
            modelName: 'Boubou 3 Pièces Traditionnel',
            fabricCost: 50000,
            fabricDetails: '8m de Getzner Super VIP blanc',
            mercerieCostItems: [
              { mercerieId: 'm-1', name: 'Fils d\'Or à broder (Bobine)', quantityUsed: 2, unitCost: 2500 }
            ],
            laborCost: 25000,
            laborDetails: 'Broderie lourde machine (Fatou Sow)',
            overheadCost: 4000,
            overheadDetails: 'Toile thermocollante, électricité machine haute tension, transport',
            totalCostPrice: 84000, // 50000 + 5000 + 25000 + 4000
            sellingPrice: 135000,
            profit: 51000,
            marginPercent: 37.78,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
          }
        ];
        setCostSheets(defaultCosts);
        localStorage.setItem(`tailleur_costs_${merchant.id}`, JSON.stringify(defaultCosts));
      }

      // 3. Load Tailleur orders to facilitate linking
      const savedOrders = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }

      // 4. Load Artisans list to propose as default labor cost reference
      const savedArtisans = localStorage.getItem(`tailleur_artisans_${merchant.id}`);
      if (savedArtisans) {
        setArtisans(JSON.parse(savedArtisans));
      }
    } catch (e) {
      console.error('Error loading mercerie & cost data:', e);
    }
  }, [merchant.id]);

  // Synchronizers
  const syncMercerie = (newMercerie: MercerieItem[]) => {
    setMercerie(newMercerie);
    localStorage.setItem(`tailleur_mercerie_${merchant.id}`, JSON.stringify(newMercerie));
  };

  const syncCostSheets = (newCosts: CostSheet[]) => {
    setCostSheets(newCosts);
    localStorage.setItem(`tailleur_costs_${merchant.id}`, JSON.stringify(newCosts));
  };

  // ----------------------------------------------------
  // MERCERIE INVENTORY HANDLERS
  // ----------------------------------------------------
  const openItemForm = (item: MercerieItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category);
      setItemQuantity(item.quantity);
      setItemMinQuantity(item.minQuantity);
      setItemPurchasePrice(item.purchasePrice);
      setItemSupplier(item.supplier || '');
      setItemNotes(item.notes || '');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemCategory('Fils');
      setItemQuantity(10);
      setItemMinQuantity(3);
      setItemPurchasePrice(1000);
      setItemSupplier('');
      setItemNotes('');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Le nom de l\'article est obligatoire.');
      return;
    }
    if (itemQuantity < 0 || itemPurchasePrice < 0) {
      toast.error('La quantité et le prix unitaire d\'achat doivent être positifs.');
      return;
    }

    if (editingItem) {
      const updated = mercerie.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: itemName.trim(),
            category: itemCategory,
            quantity: Number(itemQuantity),
            minQuantity: Number(itemMinQuantity),
            purchasePrice: Number(itemPurchasePrice),
            supplier: itemSupplier.trim() || undefined,
            notes: itemNotes.trim() || undefined,
            lastRestocked: Number(itemQuantity) > item.quantity ? new Date().toISOString().split('T')[0] : item.lastRestocked
          };
        }
        return item;
      });
      syncMercerie(updated);
      toast.success('Article de mercerie mis à jour');
    } else {
      const newItem: MercerieItem = {
        id: 'm-' + Date.now(),
        name: itemName.trim(),
        category: itemCategory,
        quantity: Number(itemQuantity),
        minQuantity: Number(itemMinQuantity),
        purchasePrice: Number(itemPurchasePrice),
        supplier: itemSupplier.trim() || undefined,
        notes: itemNotes.trim() || undefined,
        lastRestocked: new Date().toISOString().split('T')[0]
      };
      syncMercerie([newItem, ...mercerie]);
      toast.success('Nouvel article ajouté au stock');
    }
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Voulez-vous vraiment retirer cet article du stock de mercerie ?')) {
      const updated = mercerie.filter(item => item.id !== id);
      syncMercerie(updated);
      toast.success('Article supprimé');
    }
  };

  const handleQuickAddQty = (id: string, qtyToAdd: number) => {
    const updated = mercerie.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + qtyToAdd;
        return {
          ...item,
          quantity: newQty,
          lastRestocked: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });
    syncMercerie(updated);
    toast.success(`Approvisionné avec succès (+${qtyToAdd} unités)`);
  };

  // Filtering lists
  const getFilteredMercerie = () => {
    let list = [...mercerie];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.supplier && item.supplier.toLowerCase().includes(query))
      );
    }
    if (filterCategory !== 'all') {
      list = list.filter(item => item.category === filterCategory);
    }
    return list;
  };

  const filteredMercerie = getFilteredMercerie();

  // Stock alert counts
  const alertItemsCount = mercerie.filter(item => item.quantity <= item.minQuantity).length;
  const totalStockValue = mercerie.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

  // ----------------------------------------------------
  // COST SHEET (COÛT DE REVIENT) HANDLERS
  // ----------------------------------------------------
  const handleLinkOrderChange = (orderId: string) => {
    setLinkedOrderId(orderId);
    if (!orderId) return;

    const foundOrder = orders.find(o => o.id === orderId);
    if (foundOrder) {
      setCostClientName(foundOrder.clientName || foundOrder.client || '');
      setCostModelName(foundOrder.model || foundOrder.modelName || '');
      setCostTitle(`Fiche de Revient : ${foundOrder.clientName || 'Client'} - ${foundOrder.model || 'Modèle'}`);
      
      // Attempt to guess costs based on pricing if available in the order
      if (foundOrder.totalPrice) {
        setCostSellingPrice(foundOrder.totalPrice);
      }
      if (foundOrder.advancePayment) {
        // Can be useful context
      }
    }
  };

  const handleAddSupplyToCostSheet = () => {
    if (!currentSupplyId) {
      toast.error('Sélectionnez un article de mercerie.');
      return;
    }
    if (currentSupplyQty <= 0) {
      toast.error('Indiquez une quantité valide.');
      return;
    }

    const item = mercerie.find(m => m.id === currentSupplyId);
    if (!item) return;

    // Check if enough stock
    if (item.quantity < currentSupplyQty) {
      toast(`Stock insuffisant (${item.quantity} restants), mais vous pouvez forcer la consommation.`, { icon: '⚠️' });
    }

    // Check if already in the draft list
    const existingIndex = selectedSupplies.findIndex(s => s.mercerieId === currentSupplyId);
    if (existingIndex > -1) {
      const updated = [...selectedSupplies];
      updated[existingIndex].quantityUsed += Number(currentSupplyQty);
      setSelectedSupplies(updated);
    } else {
      setSelectedSupplies([
        ...selectedSupplies,
        {
          mercerieId: currentSupplyId,
          name: item.name,
          quantityUsed: Number(currentSupplyQty),
          unitCost: item.purchasePrice
        }
      ]);
    }

    toast.success(`${item.name} ajouté au calcul`);
    // Reset selection
    setCurrentSupplyId('');
    setCurrentSupplyQty(1);
  };

  const handleRemoveSupplyFromCostSheet = (index: number) => {
    const updated = [...selectedSupplies];
    updated.splice(index, 1);
    setSelectedSupplies(updated);
  };

  // Dynamic calculations for the creation form
  const draftMercerieTotal = selectedSupplies.reduce((sum, s) => sum + (s.quantityUsed * s.unitCost), 0);
  const draftTotalCostPrice = Number(costFabricCost) + draftMercerieTotal + Number(costLaborCost) + Number(costOverheadCost);
  const draftProfit = Number(costSellingPrice) - draftTotalCostPrice;
  const draftMarginPercent = costSellingPrice > 0 ? (draftProfit / Number(costSellingPrice)) * 100 : 0;

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
    setCurrentSupplyId('');
    setCurrentSupplyQty(1);
  };

  const handleSaveCostSheet = (e: React.FormEvent) => {
    e.preventDefault();

    if (!costClientName.trim() || !costModelName.trim()) {
      toast.error('Le client et le modèle sont requis.');
      return;
    }
    if (costSellingPrice <= 0) {
      toast.error('Le prix de vente doit être supérieur à zéro.');
      return;
    }

    const title = costTitle.trim() || `Fiche de Revient : ${costClientName} - ${costModelName}`;

    const newSheet: CostSheet = {
      id: 'c-' + Date.now(),
      title,
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

    // DECREASE MERCERIE STOCK IN REALTIME FOR USED ITEMS
    const updatedMercerie = [...mercerie];
    selectedSupplies.forEach(used => {
      const index = updatedMercerie.findIndex(m => m.id === used.mercerieId);
      if (index > -1) {
        updatedMercerie[index].quantity = Math.max(0, updatedMercerie[index].quantity - used.quantityUsed);
      }
    });

    syncMercerie(updatedMercerie);
    syncCostSheets([newSheet, ...costSheets]);

    toast.success('Fiche de coût de revient enregistrée ! Stock de mercerie mis à jour.');
    resetCostSheetForm();
    setSubTab('costs');
  };

  const handleDeleteCostSheet = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette fiche de coût de revient ? Le stock consommé ne sera pas restitué automatiquement.')) {
      const updated = costSheets.filter(c => c.id !== id);
      syncCostSheets(updated);
      toast.success('Fiche supprimée');
      if (selectedCostSheet?.id === id) {
        setSelectedCostSheet(null);
      }
    }
  };

  // Helper color for margins
  const getMarginBadgeClass = (percent: number) => {
    if (percent >= 40) return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (percent >= 20) return 'bg-amber-50 text-amber-700 border border-amber-100';
    return 'bg-rose-50 text-rose-700 border border-rose-100';
  };

  const getMarginTextColor = (percent: number) => {
    if (percent >= 40) return 'text-emerald-600';
    if (percent >= 20) return 'text-amber-600';
    return 'text-rose-600';
  };

  // ----------------------------------------------------
  // ANALYTICS PRE-CALCULATIONS
  // ----------------------------------------------------
  const avgMargin = costSheets.length > 0 
    ? costSheets.reduce((sum, c) => sum + c.marginPercent, 0) / costSheets.length 
    : 0;

  const totalProfits = costSheets.reduce((sum, c) => sum + c.profit, 0);
  const totalRevenue = costSheets.reduce((sum, c) => sum + c.sellingPrice, 0);
  const totalCostsValue = costSheets.reduce((sum, c) => sum + c.totalCostPrice, 0);

  // Cost shares across all calculations
  const totalFabricAll = costSheets.reduce((sum, c) => sum + c.fabricCost, 0);
  const totalMercerieAll = costSheets.reduce((sum, c) => sum + c.mercerieCostItems.reduce((s, m) => s + (m.quantityUsed * m.unitCost), 0), 0);
  const totalLaborAll = costSheets.reduce((sum, c) => sum + c.laborCost, 0);
  const totalOverheadAll = costSheets.reduce((sum, c) => sum + c.overheadCost, 0);
  
  const overallCostSum = totalFabricAll + totalMercerieAll + totalLaborAll + totalOverheadAll;
  
  const shareFabric = overallCostSum > 0 ? (totalFabricAll / overallCostSum) * 100 : 0;
  const shareMercerie = overallCostSum > 0 ? (totalMercerieAll / overallCostSum) * 100 : 0;
  const shareLabor = overallCostSum > 0 ? (totalLaborAll / overallCostSum) * 100 : 0;
  const shareOverhead = overallCostSum > 0 ? (totalOverheadAll / overallCostSum) * 100 : 0;

  return (
    <motion.div 
      id="tailleur-mercerie-cost-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left font-sans"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Mercerie & Rentabilité</h2>
            <p className="text-xs text-gray-500 font-medium">Gérez le stock de fournitures (boutons, fils, zips) et calculez le coût de revient réel de vos créations de mode.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl self-start md:self-center gap-1">
          <button
            onClick={() => setSubTab('mercerie')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'mercerie' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Box className="w-3.5 h-3.5 inline mr-1.5" /> Stock Mercerie
          </button>
          <button
            onClick={() => setSubTab('costs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'costs' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Calculator className="w-3.5 h-3.5 inline mr-1.5" /> Coût de Revient
          </button>
          <button
            onClick={() => { resetCostSheetForm(); setSubTab('new_cost'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'new_cost' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" /> Calculer un Coût
          </button>
          <button
            onClick={() => setSubTab('analytics')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'analytics' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" /> Rentabilité & Marges
          </button>
        </div>
      </div>

      {/* Mini-Kpis */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valeur Stock Mercerie</span>
            <p className="text-lg font-bold text-gray-900 mt-1">{totalStockValue.toLocaleString('fr-FR')} <span className="text-xs text-gray-400">{currency}</span></p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Marge Moyenne</span>
            <p className="text-lg font-bold text-gray-900 mt-1">{avgMargin.toFixed(1)}%</p>
          </div>
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Percent className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Bénéfice Net Cumulé</span>
            <p className="text-lg font-bold text-gray-900 mt-1">{totalProfits.toLocaleString('fr-FR')} <span className="text-xs text-gray-400">{currency}</span></p>
          </div>
          <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        {alertItemsCount > 0 ? (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Fournitures Critiques</span>
              <p className="text-lg font-bold text-rose-800 mt-1">{alertItemsCount} articles</p>
            </div>
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">État du stock</span>
              <p className="text-xs font-bold text-emerald-800 mt-1">Tous les articles au-dessus du minimum</p>
            </div>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Check className="w-4.5 h-4.5" />
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* SUB TAB 1: STOCK MERCERIE */}
      {/* ==================================================== */}
      {subTab === 'mercerie' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher boutons, fils, aiguilles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="all">Toutes les catégories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={() => openItemForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer w-full md:w-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Ajouter un Article
            </button>
          </div>

          {/* Grid Cards */}
          {filteredMercerie.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Box className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucun article trouvé</p>
              <p className="text-xs text-gray-400">Modifiez les filtres ou enregistrez de nouvelles fournitures.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMercerie.map((item) => {
                const isLowStock = item.quantity <= item.minQuantity;
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                      isLowStock ? 'border-rose-200 shadow-sm shadow-rose-50/50' : 'border-gray-100'
                    }`}
                  >
                    {isLowStock && (
                      <span className="absolute top-4 right-4 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Alerte Stock
                      </span>
                    )}

                    <div className="space-y-4">
                      {/* Name & Category */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider bg-violet-50 px-2.5 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm mt-2">{item.name}</h4>
                        {item.supplier && (
                          <p className="text-xs text-gray-500 font-medium mt-0.5">Fournisseur : {item.supplier}</p>
                        )}
                      </div>

                      {/* Brief Notes */}
                      {item.notes && (
                        <p className="text-xs text-gray-500 italic">"{item.notes}"</p>
                      )}

                      {/* Stock details */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">En Stock</p>
                          <p className={`text-sm font-bold ${isLowStock ? 'text-rose-600' : 'text-gray-900'}`}>{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Seuil min</p>
                          <p className="text-sm font-bold text-gray-600">{item.minQuantity}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Prix Unitaire</p>
                          <p className="text-sm font-bold text-violet-700">{item.purchasePrice.toLocaleString('fr-FR')} F</p>
                        </div>
                      </div>
                    </div>

                    {/* Stock Refill & Edit actions */}
                    <div className="flex items-center justify-between gap-2 border-t border-gray-50 mt-4 pt-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleQuickAddQty(item.id, 5)}
                          className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          +5 unités
                        </button>
                        <button
                          onClick={() => handleQuickAddQty(item.id, 10)}
                          className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          +10 unités
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
      {/* SUB TAB 2: COST SHEETS LIST */}
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
                  {/* Margin % badge */}
                  <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold ${getMarginBadgeClass(sheet.marginPercent)}`}>
                    Marge : {sheet.marginPercent}%
                  </span>

                  <div className="space-y-4">
                    {/* Header Details */}
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Modèle / Confection</span>
                      <h4 className="font-bold text-gray-900 text-sm mt-0.5">{sheet.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">Client: {sheet.clientName}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{new Date(sheet.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {/* Cost structure bar progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                        <span>Coût de revient : {sheet.totalCostPrice.toLocaleString('fr-FR')} {currency}</span>
                        <span className="text-gray-900">Prix de vente : {sheet.sellingPrice.toLocaleString('fr-FR')} {currency}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${Math.min(100, (sheet.totalCostPrice / sheet.sellingPrice) * 100)}%` }} className="h-full bg-violet-600" />
                        <div style={{ width: `${Math.min(100, (sheet.profit / sheet.sellingPrice) * 100)}%` }} className="h-full bg-emerald-500" />
                      </div>
                    </div>

                    {/* Breakdown details */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 text-center text-[11px]">
                      <div>
                        <p className="text-gray-400 uppercase font-bold">Tissu</p>
                        <p className="font-bold text-gray-800 mt-0.5">{sheet.fabricCost.toLocaleString('fr-FR')} F</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-bold">Mercerie</p>
                        <p className="font-bold text-gray-800 mt-0.5">
                          {sheet.mercerieCostItems.reduce((s, m) => s + (m.quantityUsed * m.unitCost), 0).toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-bold">Main d'œuvre</p>
                        <p className="font-bold text-gray-800 mt-0.5">{sheet.laborCost.toLocaleString('fr-FR')} F</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-bold">Frais Div.</p>
                        <p className="font-bold text-gray-800 mt-0.5">{sheet.overheadCost.toLocaleString('fr-FR')} F</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between gap-2 border-t border-gray-50 mt-4 pt-4">
                    <p className="text-xs font-bold text-emerald-600">
                      Bénéfice : +{sheet.profit.toLocaleString('fr-FR')} {currency}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedCostSheet(sheet)}
                        className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                        title="Voir Fiche Détaillée"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCostSheet(sheet.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-lg cursor-pointer animate-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB TAB 3: DYNAMIC NEW COST SHEET FORM */}
      {/* ==================================================== */}
      {subTab === 'new_cost' && (
        <form onSubmit={handleSaveCostSheet} className="space-y-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Calcul du Coût de Revient (Fiche de rentabilité)</h3>
              <p className="text-xs text-gray-500">Saisissez les différents intrants d'une création pour calculer automatiquement son bénéfice net.</p>
            </div>
            <button
              type="button"
              onClick={resetCostSheetForm}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 bg-white rounded-xl cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Inputs column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Link Order (Optionnel) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-violet-500" /> Associer à une Commande existante (Optionnel)
                </label>
                <select
                  value={linkedOrderId}
                  onChange={(e) => handleLinkOrderChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl text-xs py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="">-- Confection Libre (Non liée) --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.clientName || 'Client'} - {o.model || 'Modèle'} ({o.totalPrice ? `${o.totalPrice.toLocaleString('fr-FR')} F` : 'Pas de prix'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Confection identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Client</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Mme Diouf Aicha"
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
                <label className="text-xs font-bold text-gray-700">Titre de la fiche de revient</label>
                <input
                  type="text"
                  placeholder="ex: Robe de mariée de Mme Diouf"
                  value={costTitle}
                  onChange={(e) => setCostTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Step 3: Tissu Cost */}
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

              {/* Step 4: Mercerie Consumed */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-violet-500" /> Fournitures consommées (Mercerie)
                </h4>

                {/* Direct quick picker */}
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
                          {m.name} ({m.quantity} restants - {m.purchasePrice} F / u)
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

                {/* Selected Mercerie Items list */}
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

              {/* Step 5: Labor (Main d'œuvre) */}
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

              {/* Step 6: Overhead Cost (Frais généraux d'atelier) */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-500" /> Frais d'atelier Indirects (Frais généraux)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Montant global ({currency})</label>
                    <input
                      type="number"
                      value={costOverheadCost}
                      onChange={(e) => setCostOverheadCost(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Détails des charges indirectes</label>
                    <input
                      type="text"
                      value={costOverheadDetails}
                      onChange={(e) => setCostOverheadDetails(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Step 7: Price to customer */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="font-bold text-xs text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Prix Facturé au Client (Vente)
                </h4>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Prix de vente final ({currency})</label>
                  <input
                    type="number"
                    value={costSellingPrice}
                    onChange={(e) => setCostSellingPrice(Number(e.target.value))}
                    className="w-full p-3 border border-emerald-200 rounded-xl font-bold text-lg text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-500 font-medium">Saisissez le tarif facturé ou proposé au client pour évaluer en direct la profitabilité.</p>
                </div>
              </div>

            </div>

            {/* Right Cost-Sheet Simulator Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border-2 border-violet-100 rounded-3xl p-6 shadow-sm space-y-6 sticky top-6">
                <div className="border-b border-gray-100 pb-4 text-center">
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full uppercase tracking-wider">Simulateur en Direct</span>
                  <h4 className="font-bold text-gray-900 text-sm mt-3">Rendement Financier Estimé</h4>
                  <p className="text-xs text-gray-500 mt-1">{costModelName || 'Nouveau modèle'} • {costClientName || 'Nouveau client'}</p>
                </div>

                {/* Price Breakdown items */}
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

                  {/* Total Cost calculation (B) */}
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-sm font-bold text-gray-900">
                    <span>Coût de Revient Total (B) :</span>
                    <span className="text-violet-700">{draftTotalCostPrice.toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  {/* Profit Margin indicator */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">Marge nette (A - B) :</span>
                      <span className={`text-base font-bold ${getMarginTextColor(draftMarginPercent)}`}>
                        {draftProfit >= 0 ? '+' : ''}{draftProfit.toLocaleString('fr-FR')} {currency}
                      </span>
                    </div>
                    
                    {/* Visual gauge (HTML custom slider) */}
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
                      <div className="flex justify-between text-[8px] text-gray-400 uppercase font-bold pt-0.5">
                        <span>Faible (&lt;20%)</span>
                        <span>Moyen (20%-40%)</span>
                        <span>Excellent (&gt;40%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final validation buttons */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Enregistrer la Fiche de Rentabilité
                  </button>
                  <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed">
                    L'enregistrement diminuera automatiquement le stock de fournitures utilisé et sauvegardera la fiche pour vos historiques comptables.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* SUB TAB 4: RENTABILITÉ & MARGES (ANALYTICS) */}
      {/* ==================================================== */}
      {subTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Detailed analysis cards */}
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
              
              {/* Left Side: Repartition graph list */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Layers className="w-4.5 h-4.5 text-violet-500" /> Répartition Globale des Charges de Production
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Visualisez où partent vos dépenses lors de la confection des vêtements sur-mesure de votre atelier.</p>

                  <div className="space-y-4 pt-2">
                    {/* Fabric Share */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Tissu & Wax</span>
                        <span className="text-slate-500">{shareFabric.toFixed(1)}% ({totalFabricAll.toLocaleString('fr-FR')} F)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${shareFabric}%` }} className="h-full bg-violet-600 rounded-full" />
                      </div>
                    </div>

                    {/* Mercerie Share */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Fournitures & Mercerie</span>
                        <span className="text-slate-500">{shareMercerie.toFixed(1)}% ({totalMercerieAll.toLocaleString('fr-FR')} F)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${shareMercerie}%` }} className="h-full bg-amber-500 rounded-full" />
                      </div>
                    </div>

                    {/* Labor Share */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Main d'œuvre (Artisans)</span>
                        <span className="text-slate-500">{shareLabor.toFixed(1)}% ({totalLaborAll.toLocaleString('fr-FR')} F)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${shareLabor}%` }} className="h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>

                    {/* Overhead Share */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Frais Généraux / Atelier</span>
                        <span className="text-slate-500">{shareOverhead.toFixed(1)}% ({totalOverheadAll.toLocaleString('fr-FR')} F)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${shareOverhead}%` }} className="h-full bg-slate-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50/50 p-3.5 border border-yellow-100 rounded-xl text-xs text-amber-800 leading-relaxed mt-4 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <p>
                      <strong>Conseil Atelier :</strong> Si la part de mercerie ou de tissu dépasse 50% de vos coûts, réévaluez vos prix ou renégociez vos tarifs d'achat en gros avec vos fournisseurs de Dakar/Sandaga pour préserver vos marges bénéficiaires.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Best margins list & summary */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-500" /> Modèles de Confection les Plus Rentables
                  </h4>
                  <p className="text-xs text-gray-500">Classement de vos vêtements confections par ordre de performance de marge bénéficiaire brute.</p>

                  <div className="divide-y divide-gray-100">
                    {[...costSheets]
                      .sort((a, b) => b.marginPercent - a.marginPercent)
                      .map((sheet, index) => (
                        <div key={sheet.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{sheet.title}</p>
                              <p className="text-[10px] text-gray-400">Vente : {sheet.sellingPrice.toLocaleString('fr-FR')} F</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getMarginBadgeClass(sheet.marginPercent)}`}>
                            {sheet.marginPercent}% Marge
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-violet-50/30 border border-violet-100 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-xs text-violet-700 uppercase tracking-wider">Indicateurs Majeurs</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Chiffre d'Affaires Modélisé</p>
                      <p className="text-base font-bold text-gray-900 mt-1">{totalRevenue.toLocaleString('fr-FR')} {currency}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Coût de Production Global</p>
                      <p className="text-base font-bold text-gray-900 mt-1">{totalCostsValue.toLocaleString('fr-FR')} {currency}</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: MERCERIE ITEM (ADD / EDIT) */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl border border-gray-100"
            >
              <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-base flex items-center gap-1.5">
                  <Box className="w-5 h-5" /> {editingItem ? 'Modifier Fourniture' : 'Ajouter une Fourniture'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nom de l'article *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Fermeture Éclair invisible 60cm"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Catégorie *</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as MercerieItem['category'])}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs cursor-pointer"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Prix d'Achat unitaire *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemPurchasePrice}
                      onChange={(e) => setItemPurchasePrice(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Quantité Initiale *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Alerte stock minimum *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemMinQuantity}
                      onChange={(e) => setItemMinQuantity(Number(e.target.value))}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Fournisseur</label>
                  <input
                    type="text"
                    placeholder="ex: Dakar Mercerie Moderne"
                    value={itemSupplier}
                    onChange={(e) => setItemSupplier(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Notes / Emplacement dans l'atelier</label>
                  <textarea
                    placeholder="ex: Tiroir n°3, fournitures dorées..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs h-16 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

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
                    className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 inline mr-1" /> Enregistrer fournitures
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* DETAIL MODAL: COST SHEET PREVIEW (FICHE COÛT DE REVIENT) */}
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
              {/* Card Header styling */}
              <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-violet-400 bg-violet-950/80 px-2.5 py-0.5 rounded-full border border-violet-800 uppercase tracking-wider">
                    Fiche Technique & Financière
                  </span>
                  <h3 className="font-bold text-lg mt-2 text-white">{selectedCostSheet.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Calculez précisément les coûts pour optimiser vos prix</p>
                </div>
                <button
                  onClick={() => setSelectedCostSheet(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Printable receipt form body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* General identities */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Client destinataire :</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedCostSheet.clientName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Modèle de confection :</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedCostSheet.modelName}</p>
                  </div>
                </div>

                {/* Main analytical table of costs */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
                        <th className="py-2.5 px-4">Poste de dépense</th>
                        <th className="py-2.5 px-4">Description / Détail</th>
                        <th className="py-2.5 px-4 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {/* Fabric */}
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-gray-900">1. Matière (Tissu)</td>
                        <td className="py-2.5 px-4 text-gray-500 italic">{selectedCostSheet.fabricDetails || 'Tissu de base'}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{selectedCostSheet.fabricCost.toLocaleString('fr-FR')} F</td>
                      </tr>

                      {/* Mercerie loop */}
                      {selectedCostSheet.mercerieCostItems.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-4 font-bold text-gray-900">2. Mercerie ({m.name})</td>
                          <td className="py-2.5 px-4 text-gray-500">{m.quantityUsed} unité(s) x {m.unitCost} F</td>
                          <td className="py-2.5 px-4 text-right font-bold">{(m.quantityUsed * m.unitCost).toLocaleString('fr-FR')} F</td>
                        </tr>
                      ))}

                      {/* Labor */}
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-gray-900">3. Main d'œuvre</td>
                        <td className="py-2.5 px-4 text-gray-500 italic">{selectedCostSheet.laborDetails || 'Confection et surjet d\'atelier'}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{selectedCostSheet.laborCost.toLocaleString('fr-FR')} F</td>
                      </tr>

                      {/* Overhead */}
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-gray-900">4. Frais Indirects</td>
                        <td className="py-2.5 px-4 text-gray-500 italic">{selectedCostSheet.overheadDetails || 'Aiguilles, fils d\'assemblage, électricité'}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{selectedCostSheet.overheadCost.toLocaleString('fr-FR')} F</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Performance totals banner */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Coût de Revient Total :</span>
                    <span className="font-bold text-slate-900">{selectedCostSheet.totalCostPrice.toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Tarif de Vente appliqué :</span>
                    <span className="font-bold text-emerald-600">{selectedCostSheet.sellingPrice.toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 text-sm font-bold text-slate-800">
                    <span>Bénéfice Net :</span>
                    <span className="text-emerald-600">+{selectedCostSheet.profit.toLocaleString('fr-FR')} {currency}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span>Taux de Marge brute :</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${getMarginBadgeClass(selectedCostSheet.marginPercent)}`}>
                      {selectedCostSheet.marginPercent}%
                    </span>
                  </div>
                </div>

                {/* Info guidance */}
                <div className="flex gap-2.5 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-800 leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                  <p>
                    Cette fiche synthétique a été générée de manière sécurisée par votre module couture Acom. Elle vous permet d'analyser vos marges et d'ajuster vos grilles tarifaires de manière autonome pour maximiser vos revenus de mode.
                  </p>
                </div>
              </div>

              {/* Action row at bottom */}
              <div className="bg-slate-50 px-6 py-4 flex justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Imprimer Fiche
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
