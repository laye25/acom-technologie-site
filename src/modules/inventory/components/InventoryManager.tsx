import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, ShoppingCart, Image as ImageIcon, Box, AlertTriangle, TrendingDown, ArrowRight, Download, Upload, CheckCircle2, Loader2, FileSpreadsheet, FileText, ClipboardList, Send, UserCheck, ShieldAlert, CheckSquare } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant, MerchantProduct } from '../../../types';

import { syncService } from '../../../services/syncService';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { StockStatCard, HealthIndicator } from '../../../components/MerchantDashboard';
import { OptimizedImage } from '../../../components/OptimizedImage';
import ScannerModal from '../../../components/ScannerModal';
import { format } from 'date-fns';
import { Package, Calculator, Check, RefreshCw, TrendingUp, ArrowDownRight, ArrowUpRight, Clock, ScanLine } from 'lucide-react';


const InventoryManager = ({ merchant, setShowUpgradeModal }: { merchant: Merchant, setShowUpgradeModal?: (s: boolean) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<MerchantProduct> | null>(null);
  const [restockData, setRestockData] = useState({ 
    quantity: 0, 
    cost: 0, 
    unitCostPrice: 0,
    unitSellingPrice: 0,
    reason: 'Réapprovisionnement standard' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [showNewSubCatInput, setShowNewSubCatInput] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showSKUScanner, setShowSKUScanner] = useState(false);
  
  const [productLimit, setProductLimit] = useState(10);
  const [movementLimit, setMovementLimit] = useState(10);

  // New features states:
  // 1. Manual Stock Adjustments
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    productId: '',
    quantity: 1,
    type: 'out' as 'in' | 'out',
    reason: 'Casse / Périmé',
    customReason: '',
    operator: 'Administrateur'
  });

  // 2. Supplier Purchase Order (Bon de Commande Fournisseur)
  const [isGeneratingPO, setIsGeneratingPO] = useState(false);
  const [poSupplier, setPoSupplier] = useState({
    name: 'Fournisseur Général',
    email: 'contact@fournisseur.com',
    phone: '+223 70 00 00 00',
    address: 'Zone Industrielle, Bamako'
  });
  const [selectedPOProducts, setSelectedPOProducts] = useState<string[]>([]);
  const [poCustomQuantities, setPoCustomQuantities] = useState<Record<string, number>>({});
  const [generatedPODoc, setGeneratedPODoc] = useState<any>(null);

  // 3. Advanced Movement Filters
  const [filterMovementType, setFilterMovementType] = useState('all');
  const [filterMovementProduct, setFilterMovementProduct] = useState('all');
  const [filterMovementPeriod, setFilterMovementPeriod] = useState('all');

  // 4. Products Quick Filter (All, Low stock, Out of stock)
  const [productFilterType, setProductFilterType] = useState<'all' | 'low' | 'out'>('all');

  // 5. Printable Physical Inventory Count Sheet
  const [isInventorySheetOpen, setIsInventorySheetOpen] = useState(false);

  // Products loaded from Dexie via useLiveQuery
  useEffect(() => {
    syncService.syncProducts(merchant.id);
    syncService.syncCategories(merchant.id);
    syncService.syncSales(merchant.id);
  }, [merchant.id]);

  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const categories = useLiveQuery(() => 
    db.categories.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const movements = useLiveQuery(() => 
    db.movements.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const loading = false;

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (productFilterType === 'low') {
      result = result.filter(p => Number(p.stockQuantity || 0) > 0 && Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5));
    } else if (productFilterType === 'out') {
      result = result.filter(p => Number(p.stockQuantity || 0) <= 0);
    }
    return result;
  }, [products, searchTerm, productFilterType]);

  const filteredMovements = useMemo(() => {
    let result = movements;
    
    // Type Filter
    if (filterMovementType !== 'all') {
      if (filterMovementType === 'in') {
        result = result.filter(m => m.type === 'in' || m.type === 'return');
      } else if (filterMovementType === 'out') {
        result = result.filter(m => m.type === 'out' || m.type === 'adjustment' || m.type === 'loss' || m.type === 'damage');
      } else if (filterMovementType === 'sale') {
        result = result.filter(m => m.type === 'sale');
      }
    }
    
    // Product Filter
    if (filterMovementProduct !== 'all') {
      result = result.filter(m => m.productId === filterMovementProduct);
    }
    
    // Period Filter
    if (filterMovementPeriod !== 'all') {
      const now = new Date();
      result = result.filter(m => {
        let mDate: Date;
        if (m.createdAt?.seconds) {
          mDate = new Date(m.createdAt.seconds * 1000);
        } else if (m.createdAt) {
          mDate = new Date(m.createdAt);
        } else {
          return true;
        }
        
        const diffTime = Math.abs(now.getTime() - mDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (filterMovementPeriod === 'today') {
          return diffDays <= 1;
        } else if (filterMovementPeriod === '7days') {
          return diffDays <= 7;
        } else if (filterMovementPeriod === '30days') {
          return diffDays <= 30;
        }
        return true;
      });
    }
    
    return result;
  }, [movements, filterMovementType, filterMovementProduct, filterMovementPeriod]);

  const handleBarcodeForNewProduct = async (code: string) => {
    if (!currentProduct) return;
    toast.loading("Recherche des détails...", { id: "barcode-search" });
    try {
      let foundName = '';
      let foundImage = '';

      // 1. Try OpenFoodFacts
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          foundName = offData.product.product_name;
          foundImage = offData.product.image_front_url || offData.product.image_url;
        }
      } catch (err) {
        console.warn("OpenFoodFacts failed", err);
      }

      // 2. Try UPCitemdb if not found
      if (!foundName) {
        try {
          const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`);
          const upcData = await upcRes.json();
          if (upcData.code === 'OK' && upcData.items && upcData.items.length > 0) {
            foundName = upcData.items[0].title;
            if (upcData.items[0].images && upcData.items[0].images.length > 0) {
              foundImage = upcData.items[0].images[0];
            }
          }
        } catch (err) {
          console.warn("UPCitemdb failed", err);
        }
      }

      if (foundName) {
        toast.success(`Produit détecté : ${foundName.substring(0, 30)}...`, { id: 'barcode-search' });
        setCurrentProduct(prev => {
           if (!prev) return prev;
           return {
             ...prev,
             sku: code,
             name: prev.name || foundName || '',
             image: prev.image || foundImage || prev.image,
           };
        });
      } else {
        toast.success(`Code-barres scanné : ${code}`, { id: 'barcode-search' });
        setCurrentProduct(prev => prev ? {...prev, sku: code} : prev);
      }
    } catch (err) {
      toast.success(`Code-barres scanné : ${code}`, { id: 'barcode-search' });
      setCurrentProduct(prev => prev ? {...prev, sku: code} : prev);
    }
  };

  // Physical Barcode Scanner Effect for Inventory Manager
  const scannedCodeRef = useRef('');
  useEffect(() => {
    let timeoutId: any;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in generic input fields unless it's our inventory search explicitly
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.target.id !== 'inventory-search' && e.target.id !== 'sku-input') return;
      }
      
      if (e.key === 'Enter') {
        const code = scannedCodeRef.current;
        if (code.length > 2) {
          if (isEditing) {
            handleBarcodeForNewProduct(code);
          } else {
            // Find the product and open the restock OR edit modal
            const match = products.find(p => p.sku && p.sku.trim().toLowerCase() === code.trim().toLowerCase());
            if (match) {
              setSearchTerm(code);
              triggerAcomAlert('Succès', `Produit trouvé : ${match.name}`, 'success', 'SYSTÈME');
            } else {
              setSearchTerm(code);
              triggerAcomAlert('Erreur', "Aucun produit trouvé avec ce code : " + code, 'error', 'ALERTE');
            }
          }
        }
        scannedCodeRef.current = '';
      } else if (e.key.length === 1) { 
        scannedCodeRef.current += e.key;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          scannedCodeRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [products, isEditing, currentProduct, handleBarcodeForNewProduct]);

  // Enhanced Stats
  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalQuantity = products.reduce((acc, p) => acc + Number(p.stockQuantity || 0), 0);
    const lowStock = products.filter(p => Number(p.stockQuantity || 0) > 0 && Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length;
    const outOfStock = products.filter(p => Number(p.stockQuantity || 0) <= 0).length;
    
    // Total stock valuation using CUMP (costPrice) & retail price
    const totalPurchaseValue = products.reduce((acc, p) => acc + (Number(p.costPrice || 0) * Number(p.stockQuantity || 0)), 0);
    const totalRetailValue = products.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.stockQuantity || 0)), 0);
    const theoreticalMargin = totalRetailValue - totalPurchaseValue;
    const theoreticalMarginPercent = totalRetailValue > 0 ? (theoreticalMargin / totalRetailValue) * 100 : 0;

    return { 
      totalItems, 
      totalQuantity, 
      lowStock, 
      outOfStock, 
      totalPurchaseValue, 
      totalRetailValue,
      theoreticalMargin,
      theoreticalMarginPercent
    };
  }, [products]);

  // Dynamic Stock Health Indicators
  const theoreticalProfit = useMemo(() => {
    return Math.max(0, Math.min(100, Math.round(stats.theoreticalMarginPercent)));
  }, [stats.theoreticalMarginPercent]);

  const rotationStock = useMemo(() => {
    const totalUnitsSold = sales.reduce((sum, s) => sum + (s.items ? s.items.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0) : 0), 0);
    const totalStock = products.reduce((acc, p) => acc + Number(p.stockQuantity || 0), 0);
    if (totalStock === 0 && totalUnitsSold === 0) return 0;
    if (totalStock === 0) return 100;
    const ratio = (totalUnitsSold / (totalUnitsSold + totalStock)) * 100;
    return Math.max(12, Math.min(100, Math.round(ratio)));
  }, [sales, products]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.name || currentProduct.price === undefined) return;
    
    if (!currentProduct.id && merchant.plan === 'FREE' && products.length >= 2) {
      triggerAcomAlert('Erreur', 'Vous avez atteint la limite de 2 produits pour le plan TESTE. Veuillez passer au forfait supérieur.', 'error', 'ALERTE');
      if (setShowUpgradeModal) setShowUpgradeModal(true);
      return;
    }

    setSaving(true);
    try {
      await dbService.merchantProducts.save({
        ...currentProduct,
        sku: currentProduct.sku ? currentProduct.sku.trim() : undefined,
        merchantId: merchant.id,
        updatedAt: new Date()
      });

      // Memorize Category and Sub-category for future products
      if (currentProduct.category) {
        const existingCat = categories.find(c => c.name.toLowerCase() === currentProduct.category?.toLowerCase());
        if (!existingCat) {
          await dbService.merchantCategories.save({
            merchantId: merchant.id,
            name: currentProduct.category,
            subCategories: currentProduct.subCategory ? [currentProduct.subCategory] : []
          });
        } else if (currentProduct.subCategory) {
          const subCats = existingCat.subCategories || [];
          if (!subCats.some(s => s.toLowerCase() === currentProduct.subCategory?.toLowerCase())) {
            await dbService.merchantCategories.save({
              ...existingCat,
              subCategories: [...subCats, currentProduct.subCategory]
            });
          }
        }
      }

      triggerAcomAlert('Succès', currentProduct.id ? 'Produit mis à jour' : 'Produit ajouté', 'success', 'SYSTÈME');
      setIsEditing(false);
      setCurrentProduct(null);
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de l\'enregistrement', 'error', 'ALERTE');
    } finally {
      setSaving(false);
    }
  };

  // Live CUMP Calculation helper for restock modal
  const liveCUMP = useMemo(() => {
    if (!currentProduct) return 0;
    const qCurrent = Number(currentProduct.stockQuantity || 0);
    const cCurrent = Number(currentProduct.costPrice || 0);
    const qAdded = Number(restockData.quantity || 0);
    const cAdded = Number(restockData.unitCostPrice || 0);
    if (qCurrent + qAdded <= 0) return 0;
    const cump = qCurrent > 0 ? ((qCurrent * cCurrent) + (qAdded * cAdded)) / (qCurrent + qAdded) : cAdded;
    return Math.round(cump * 100) / 100;
  }, [currentProduct, restockData.quantity, restockData.unitCostPrice]);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.id || restockData.quantity <= 0) return;
    setSaving(true);
    try {
      // CUMP (Coût Unitaire Moyen Pondéré) Calculation for successive restocking
      const qCurrent = Number(currentProduct.stockQuantity || 0);
      const cCurrent = Number(currentProduct.costPrice || 0);
      const qAdded = Number(restockData.quantity || 0);
      const cAdded = Number(restockData.unitCostPrice || 0);
      
      let calculatedCUMP = cAdded;
      if (qCurrent > 0) {
        calculatedCUMP = ((qCurrent * cCurrent) + (qAdded * cAdded)) / (qCurrent + qAdded);
      }
      calculatedCUMP = Math.round(calculatedCUMP * 100) / 100;

      // Update the product with calculated CUMP as its costPrice, and update sell price
      const updatedProduct = {
        ...currentProduct,
        costPrice: calculatedCUMP,
        price: Number(restockData.unitSellingPrice || 0),
        updatedAt: new Date()
      };
      await dbService.merchantProducts.save(updatedProduct as any);

      // The added cost value
      const calculatedCost = Number(restockData.quantity) * Number(restockData.unitCostPrice || 0);

      await dbService.stockMovements.addStock(
        merchant.id,
        currentProduct.id,
        restockData.quantity,
        restockData.reason,
        merchant.ownerId || 'system',
        calculatedCost
      );

      triggerAcomAlert(
        'Succès', 
        `Réapprovisionnement réussi ! CUMP recalculé de ${cCurrent.toLocaleString()} à ${calculatedCUMP.toLocaleString()} ${merchant.currency}`, 
        'success', 
        'SYSTÈME'
      );
      setIsRestocking(false);
      setRestockData({ 
        quantity: 0, 
        cost: 0, 
        unitCostPrice: 0,
        unitSellingPrice: 0,
        reason: 'Réapprovisionnement standard' 
      });
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de la mise à jour du stock', 'error', 'ALERTE');
    } finally {
      setSaving(false);
    }
  };

  // Manual Stock Adjustment Handler
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentData.productId || adjustmentData.quantity <= 0) {
      toast.error("Veuillez sélectionner un produit.");
      return;
    }
    setSaving(true);
    try {
      const prod = products.find(p => p.id === adjustmentData.productId);
      if (!prod) throw new Error("Produit non trouvé");

      const currentStock = Number(prod.stockQuantity || 0);
      let newStock = currentStock;
      const isAddition = adjustmentData.type === 'in';
      
      if (isAddition) {
        newStock = currentStock + Number(adjustmentData.quantity);
      } else {
        newStock = Math.max(0, currentStock - Number(adjustmentData.quantity));
      }

      // Update local product stock
      await db.products.update(prod.id, { stockQuantity: newStock, updatedAt: new Date() });

      // Record detailed stock movement
      const movementId = crypto.randomUUID();
      await db.movements.put({
        id: movementId,
        merchantId: merchant.id,
        productId: prod.id,
        type: adjustmentData.type,
        quantity: Number(adjustmentData.quantity),
        previousQuantity: currentStock,
        newQuantity: newStock,
        reason: `Ajustement: ${adjustmentData.reason}${adjustmentData.customReason ? ` (${adjustmentData.customReason})` : ''}`,
        performedBy: adjustmentData.operator || 'Administrateur',
        createdAt: new Date()
      });

      // Async sync to cloud
      try {
        await dbService.merchantProducts.save({
          ...prod,
          stockQuantity: newStock,
          updatedAt: new Date()
        });
      } catch (err) {
        console.warn("Could not sync manual adjustment to cloud immediately:", err);
      }

      triggerAcomAlert(
        'Succès', 
        `Ajustement de stock enregistré (${isAddition ? '+' : '-'}${adjustmentData.quantity} unités pour ${prod.name})`, 
        'success', 
        'SYSTÈME'
      );
      setIsAdjusting(false);
      setAdjustmentData({
        productId: '',
        quantity: 1,
        type: 'out',
        reason: 'Casse / Périmé',
        customReason: '',
        operator: 'Administrateur'
      });
    } catch (err) {
      triggerAcomAlert('Erreur', "Échec de l'ajustement de stock", 'error', 'ALERTE');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await dbService.merchantProducts.delete(id);
      triggerAcomAlert('Succès', 'Produit supprimé', 'success', 'SYSTÈME');
      setDeleteConfirm(null);
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de la suppression', 'error', 'ALERTE');
    } finally {
      setSaving(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    try {
      const headers = [
        'SKU', 
        'Nom', 
        'Categorie', 
        'Sous-Categorie', 
        'Stock Actuel', 
        'Seuil Alerte', 
        'Prix Achat (CUMP)', 
        'Prix Vente', 
        'Valeur Stock (Achat)',
        'Valeur Stock (Vente)',
        'Statut Alerte'
      ];
      
      const rows = products.map(p => {
        const isLow = Number(p.stockQuantity || 0) > 0 && Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5);
        const isOut = Number(p.stockQuantity || 0) <= 0;
        const alertStatus = isOut ? 'RUPTURE' : isLow ? 'ALERTE STOCK BAS' : 'OK';
        
        const qty = Number(p.stockQuantity || 0);
        const purchaseVal = Number(p.costPrice || 0) * qty;
        const retailVal = Number(p.price || 0) * qty;
        
        return [
          p.sku || 'SANS SKU',
          p.name,
          p.category || 'Général',
          p.subCategory || 'N/A',
          qty,
          p.minStockLevel || 5,
          p.costPrice || 0,
          p.price || 0,
          purchaseVal,
          retailVal,
          alertStatus
        ];
      });

      const csvContent = "\uFEFF" + [
        headers.join(';'), 
        ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(';'))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `inventaire_${merchant.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerAcomAlert('Succès', 'Fichier CSV exporté avec succès !', 'success', 'SYSTÈME');
    } catch (err) {
      toast.error("Erreur lors de l'exportation CSV");
    }
  };

  // Generate Automated Supplier Purchase Order
  const handleGeneratePODocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPOProducts.length === 0) {
      toast.error("Veuillez sélectionner au moins un article à commander.");
      return;
    }

    const items = selectedPOProducts.map(id => {
      const p = products.find(prod => prod.id === id);
      const qtyToOrder = poCustomQuantities[id] || Math.max(1, ((p?.minStockLevel || 5) * 2) - Number(p?.stockQuantity || 0));
      return {
        product: p,
        quantity: qtyToOrder,
        unitCost: p?.costPrice || 0,
        total: qtyToOrder * (p?.costPrice || 0)
      };
    });

    const totalCost = items.reduce((sum, item) => sum + item.total, 0);

    setGeneratedPODoc({
      poNumber: `BC-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: format(new Date(), 'dd/MM/yyyy'),
      supplier: poSupplier,
      items,
      totalCost
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Stock Quick Stats Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StockStatCard 
          label="Total Articles" 
          value={stats.totalItems.toString()} 
          suffix={`${stats.totalQuantity} UNITÉS`}
          icon={Package} 
          color="blue"
        />
        <StockStatCard 
          label="Valo. Achat (CUMP)" 
          value={stats.totalPurchaseValue.toLocaleString()} 
          suffix={merchant.currency}
          icon={Calculator} 
          color="indigo"
        />
        <StockStatCard 
          label="Valo. Vente" 
          value={stats.totalRetailValue.toLocaleString()} 
          suffix={merchant.currency}
          icon={Calculator} 
          color="emerald"
        />
        <StockStatCard 
          label="Marge Théorique" 
          value={stats.theoreticalMargin.toLocaleString()} 
          suffix={`${Math.round(stats.theoreticalMarginPercent)}% MARGE`}
          icon={CheckSquare} 
          color="emerald"
        />
        <StockStatCard 
          label="Points d'alerte" 
          value={stats.lowStock.toString()} 
          suffix="ALERTES"
          icon={AlertCircle} 
          color="orange"
          warning={stats.lowStock > 0}
        />
        <StockStatCard 
          label="Articles épuisés" 
          value={stats.outOfStock.toString()} 
          suffix="RUPTURES"
          icon={Trash2} 
          color="rose"
          danger={stats.outOfStock > 0}
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Main Product Table / List */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="inventory-search"
                  placeholder="Rechercher ou scanner SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim().length > 2) {
                      const match = products.find(p => p.sku && p.sku.trim().toLowerCase() === searchTerm.trim().toLowerCase());
                      if (match) {
                        triggerAcomAlert('Succès', `Produit trouvé : ${match.name}`, 'success', 'SYSTÈME');
                      } else {
                        triggerAcomAlert('Erreur', "Aucun produit trouvé avec ce code : " + searchTerm, 'error', 'ALERTE');
                      }
                    }
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-primary/10 shadow-sm outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="h-auto px-5 bg-indigo-50 text-indigo-600 rounded-[1.5rem] border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Scanner un code-barres"
              >
                <ScanLine className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  setCurrentProduct({ name: '', price: 0, stockQuantity: 0, category: 'Général', minStockLevel: 5 });
                  setIsEditing(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-3.5 bg-ink text-white rounded-2xl font-black uppercase text-[9px] tracking-wider hover:bg-black transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau</span>
              </button>
              
              <button
                onClick={() => setIsAdjusting(true)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-3.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl font-black uppercase text-[9px] tracking-wider hover:bg-indigo-100 transition-all shadow-sm"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Ajuster</span>
              </button>

              <button
                onClick={() => setIsInventorySheetOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-3.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl font-black uppercase text-[9px] tracking-wider hover:bg-amber-100 transition-all shadow-sm"
                title="Fiche d'inventaire physique"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Fiche Comptage</span>
              </button>

              <button
                onClick={() => {
                  // Pre-fill selected products with all low/out of stock items
                  const deficientIds = products
                    .filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5))
                    .map(p => p.id as string);
                  setSelectedPOProducts(deficientIds);
                  const initialQuants: Record<string, number> = {};
                  products.forEach(p => {
                    initialQuants[p.id as string] = Math.max(1, ((p.minStockLevel || 5) * 2) - Number(p.stockQuantity || 0));
                  });
                  setPoCustomQuantities(initialQuants);
                  setIsGeneratingPO(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-black uppercase text-[9px] tracking-wider hover:bg-emerald-100 transition-all shadow-sm"
                title="Générer un Bon de Commande Fournisseur"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Réassort BC</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-3.5 bg-gray-50 border border-black/5 text-gray-700 rounded-2xl font-black uppercase text-[9px] tracking-wider hover:bg-gray-100 transition-all shadow-sm"
                title="Exporter l'état du stock en format CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Filters for Stock Levels */}
          <div className="flex items-center gap-2 bg-gray-50/50 p-1 rounded-2xl border border-gray-100 w-fit">
            <button 
              onClick={() => setProductFilterType('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                productFilterType === 'all' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Tout le Stock ({products.length})
            </button>
            <button 
              onClick={() => setProductFilterType('low')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                productFilterType === 'low' ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100/30' : 'text-gray-400 hover:text-amber-600'
              }`}
            >
              Stock Bas ({products.filter(p => Number(p.stockQuantity || 0) > 0 && Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length})
            </button>
            <button 
              onClick={() => setProductFilterType('out')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                productFilterType === 'out' ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/30' : 'text-gray-400 hover:text-rose-600'
              }`}
            >
              Épuisés ({products.filter(p => Number(p.stockQuantity || 0) <= 0).length})
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-4 sm:px-8 py-3 md:py-5">Article</th>
                      <th className="px-4 sm:px-8 py-3 md:py-5">Prix & Valeur</th>
                      <th className="px-4 sm:px-8 py-3 md:py-5">État Stock</th>
                      <th className="px-4 sm:px-8 py-3 md:py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center opacity-30">
                            <Package className="w-12 h-12 mb-4" />
                            <p className="font-black uppercase tracking-widest text-xs">Aucun produit trouvé</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.slice(0, productLimit).map((product) => {
                        const isLow = Number(product.stockQuantity || 0) > 0 && Number(product.stockQuantity || 0) <= (Number(product.minStockLevel) || 5);
                        const isOut = Number(product.stockQuantity || 0) <= 0;
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50/20 transition-colors group">
                            <td className="px-4 sm:px-8 py-4 md:py-6">
                              <div className="flex items-center space-x-3 md:space-x-5">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-[1.25rem] flex items-center justify-center overflow-hidden border border-black/5 group-hover:scale-105 transition-transform shadow-inner shrink-0">
                                  {product.image ? (
                                    <OptimizedImage src={product.image} alt={product.name} width={150} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-200" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-black text-ink text-sm leading-tight tracking-tight truncate">{product.name}</span>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.15em]">
                                      {product.sku || 'SANS SKU'}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span className="text-[9px] font-mono font-black text-primary uppercase tracking-[0.15em]">
                                      {product.category}
                                    </span>
                                    {product.sizes && (
                                      <>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          T: {product.sizes}
                                        </span>
                                      </>
                                    )}
                                    {product.colors && (
                                      <>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          C: {product.colors}
                                        </span>
                                      </>
                                    )}
                                    {(product as any).syncStatus && (
                                      <>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                                          (product as any).syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                          (product as any).syncStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                          'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                          {(product as any).syncStatus === 'synced' ? <Check className="w-2.5 h-2.5" /> : <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                                          <span className="text-[8px] font-black uppercase tracking-wider">{(product as any).syncStatus}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-8 py-4 md:py-6">
                              <div className="flex flex-col">
                                <span className="font-mono font-black text-ink text-sm">
                                  {product.price.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                                </span>
                                <span className="text-[9px] font-mono font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                  VAL: {(product.price * Number(product.stockQuantity || 0)).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-8 py-4 md:py-6">
                              <div className="flex items-center space-x-4">
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black border tracking-widest ${
                                  isOut ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                                  isLow ? 'bg-orange-50 text-orange-600 border-orange-100 shadow-sm' : 
                                  'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 transition-colors cursor-help'
                                }`}>
                                  {(product.stockQuantity || 0).toString().padStart(2, '0')} UNITÉS
                                </div>
                                <button 
                                  onClick={() => { 
                                    setCurrentProduct(product); 
                                    setRestockData({
                                      quantity: 1,
                                      cost: Number(product.costPrice || 0),
                                      unitCostPrice: Number(product.costPrice || 0),
                                      unitSellingPrice: Number(product.price || 0),
                                      reason: 'Réapprovisionnement standard'
                                    });
                                    setIsRestocking(true); 
                                  }}
                                  className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-black/5 text-gray-500 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                  title="Réapprovisionner"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 sm:px-8 py-4 md:py-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => { setCurrentProduct(product); setIsEditing(true); }} className="p-3 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-black/5 hover:border-primary/20 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteConfirm(product.id || null)} className="p-3 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-black/5 hover:border-rose-200 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {filteredProducts.length > productLimit && (
                  <div className="p-4 flex justify-center border-t border-gray-100">
                    <button 
                      onClick={() => setProductLimit(prev => prev + 10)}
                      className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                    >
                      Voir plus
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Movement Summary or Chart */}
        <div className="w-full xl:w-[400px] space-y-6">
          <div className="bg-ink p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-32 h-32 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-bold text-white mb-2">Santé du Stock</h3>
              <p className="text-white/50 text-[11px] leading-relaxed mb-6 font-medium uppercase tracking-widest">
                Analyse de votre inventaire actuel
              </p>
              
              <div className="space-y-5">
                <HealthIndicator label="Disponibilité" value={products.length > 0 ? (products.filter(p => Number(p.stockQuantity || 0) > 0).length / products.length * 100).toFixed(0) : '0'} color="primary" />
                <HealthIndicator label="Rentabilité théorique" value={theoreticalProfit.toString()} color="blue" />
                <HealthIndicator label="Rotation de stock" value={rotationStock.toString()} color="purple" />
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-black mb-1">Articles Bas</p>
                  <p className="text-2xl font-black text-white">{stats.lowStock}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-black mb-1">Ruptures</p>
                  <p className="text-2xl font-black text-rose-400">{stats.outOfStock}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
            <h4 className="text-sm font-black text-ink uppercase tracking-widest mb-6">Flux Récents</h4>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {movements.slice(0, 8).map((m: any) => {
                const product = products.find(p => p.id === m.productId);
                return (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:shadow-md transition-all gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${
                        m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}>
                        {m.type === 'in' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{product?.name || 'Produit...'}</p>
                        <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd MMM, HH:mm') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black font-mono ${m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.type === 'in' ? '+' : '-'}{m.quantity}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">UNITÉS</p>
                    </div>
                  </div>
                );
              })}
              {movements.length === 0 && (
                <div className="py-12 text-center text-gray-300 font-bold uppercase text-[9px] tracking-[0.2em]">
                  Aucun mouvement enregistré
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                // Focus the movements history if it was a separate tab, but here it's below
                const el = document.getElementById('movements-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full mt-6 py-4 border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Voir tout l'historique
            </button>
          </div>
        </div>
      </div>

      {/* Full History Section with Advanced Filters */}
      <div id="movements-section" className="pt-12 border-t border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-ink tracking-tight">Journal des Mouvements</h3>
            <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.15em] mt-1">Traçabilité complète & filtres avancés</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => {
                const headers = ['Date', 'Produit', 'Type', 'Quantité', 'Raison', 'Opérateur'];
                const rows = filteredMovements.map(m => {
                  const prod = products.find(p => p.id === m.productId);
                  const mDate = m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : format(new Date(m.createdAt || new Date()), 'dd/MM/yyyy HH:mm');
                  return [
                    mDate,
                    prod?.name || 'Produit supprimé',
                    m.type === 'in' ? 'ENTRÉE' : m.type === 'sale' ? 'VENTE' : m.type.toUpperCase(),
                    m.quantity,
                    m.reason || 'N/A',
                    m.performedBy || 'Administrateur'
                  ];
                });
                const csv = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `journal_mouvements_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-5 py-3 bg-white border border-black/5 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exporter CSV Journal</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest mb-2">Type de Flux</label>
            <select
              value={filterMovementType}
              onChange={e => setFilterMovementType(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-black/5 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tous les types (Entrées & Sorties)</option>
              <option value="in">Entrées uniquement (Approvisionnements / Retours)</option>
              <option value="out">Sorties de stock (Casse / Perte / Ajustements)</option>
              <option value="sale">Ventes uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest mb-2">Filtrer par Article</label>
            <select
              value={filterMovementProduct}
              onChange={e => setFilterMovementProduct(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-black/5 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tous les produits</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest mb-2">Période Temporelle</label>
            <select
              value={filterMovementPeriod}
              onChange={e => setFilterMovementPeriod(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-black/5 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Horodatage</th>
                  <th className="px-8 py-5">Article Impacté</th>
                  <th className="px-8 py-5">Flux & Quantité</th>
                  <th className="px-8 py-5">Justification / Motif</th>
                  <th className="px-8 py-5">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.slice(0, movementLimit).map((m: any) => {
                  const product = products.find(p => p.id === m.productId);
                  const isPositive = m.type === 'in' || m.type === 'return';
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-mono font-black text-ink uppercase">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : 
                           m.createdAt ? format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-ink">{product?.name || 'Article supprimé'}</span>
                            <span className="text-[9px] font-mono text-gray-400 font-bold">{product?.sku || 'SANS SKU'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {m.type === 'in' ? 'ENTRÉE' : m.type === 'sale' ? 'VENTE' : m.type.toUpperCase()}
                          </span>
                          <span className={`font-mono font-black text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? '+' : '-'}{m.quantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-bold text-gray-400 italic">"{m.reason || 'Aucune note'}"</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black border border-indigo-100 uppercase">
                            {(m.performedBy || 'AD')[0]}
                          </div>
                          <span className="text-xs font-bold text-ink">{m.performedBy || 'Administrateur'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-300 font-bold uppercase text-[9px] tracking-[0.2em]">
                      Aucun mouvement ne correspond aux filtres sélectionnés
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredMovements.length > movementLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setMovementLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      <AnimatePresence>
        {isRestocking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Réapprovisionner</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Mise à jour des stocks</p>
                </div>
                <button onClick={() => setIsRestocking(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Produit sélectionné</p>
                    <p className="font-bold text-ink">{currentProduct?.name}</p>
                  </div>
                </div>

                <form onSubmit={handleRestock} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Quantité à ajouter</label>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        value={restockData.quantity || ''} 
                        onChange={e => {
                          const quantity = Number(e.target.value);
                          setRestockData(prev => ({ ...prev, quantity }));
                        }} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold text-base" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix d'achat unitaire ({merchant.currency})</label>
                        <input 
                          type="number" 
                          min="0" 
                          required
                          value={restockData.unitCostPrice || ''} 
                          onChange={e => {
                            const unitCostPrice = Number(e.target.value);
                            setRestockData(prev => ({ ...prev, unitCostPrice }));
                          }} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix de vente unitaire ({merchant.currency})</label>
                        <input 
                          type="number" 
                          min="0" 
                          required
                          value={restockData.unitSellingPrice || ''} 
                          onChange={e => {
                            const unitSellingPrice = Number(e.target.value);
                            setRestockData(prev => ({ ...prev, unitSellingPrice }));
                          }} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Résumé de l'approvisionnement */}
                  <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500 uppercase tracking-wide">Coût Total Estimé :</span>
                      <span className="font-mono font-black text-ink text-sm">
                        {((restockData.quantity || 0) * (restockData.unitCostPrice || 0)).toLocaleString()} {merchant.currency}
                      </span>
                    </div>
                    {restockData.unitSellingPrice > restockData.unitCostPrice && (
                      <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-dashed border-gray-200">
                        <span className="text-emerald-600 font-bold uppercase tracking-wider">Marge unitaire estimée :</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {+(restockData.unitSellingPrice - restockData.unitCostPrice).toLocaleString()} {merchant.currency} ({Math.round(((restockData.unitSellingPrice - restockData.unitCostPrice) / restockData.unitSellingPrice) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Motif / Note</label>
                    <input type="text" value={restockData.reason} onChange={e => setRestockData({...restockData, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-medium text-sm" placeholder="ex: Arrivage fournisseur..." />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={() => setIsRestocking(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmer l\'ajout'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Barcode Scanner Modal Modal */}
      <ScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={(code) => {
          setShowBarcodeScanner(false);
          setSearchTerm(code);
          const match = products.find(p => p.sku && p.sku.trim().toLowerCase() === code.trim().toLowerCase());
          if (match) {
             triggerAcomAlert('Succès', `Produit trouvé : ${match.name}`, 'success', 'SYSTÈME');
          } else {
             triggerAcomAlert('Erreur', "Aucun produit trouvé.", 'error', 'ALERTE');
          }
        }}
        title="Rechercher un produit"
      />

      <ScannerModal
        isOpen={showSKUScanner}
        onClose={() => setShowSKUScanner(false)}
        onScanSuccess={(code) => {
          setShowSKUScanner(false);
          handleBarcodeForNewProduct(code);
        }}
        title="Scanner Code-barres / SKU"
      />

      {/* Product Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Détails du Produit</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Configuration technique de l'article</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du produit</label>
                      <input 
                        type="text" 
                        required 
                        value={currentProduct?.name || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, name: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" 
                        placeholder="ex: Laptop Pro 15"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">SKU / Code interne</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          id="sku-input"
                          value={currentProduct?.sku || ''} 
                          onChange={e => setCurrentProduct({...currentProduct!, sku: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono text-sm flex-1" 
                          placeholder="ex: LP-15-2024"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSKUScanner(true)}
                          className="px-4 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Scanner un code-barres"
                        >
                          <ScanLine className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Image (URL ou Fichier)</label>
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            value={currentProduct?.image || ''} 
                            onChange={e => setCurrentProduct({...currentProduct!, image: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-xs" 
                            placeholder="https://..."
                          />
                          <label className="block w-full text-center px-4 py-2 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="text-xs font-bold text-gray-500">Ou uploader une image</span>
                            <input 
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setCurrentProduct({...currentProduct!, image: reader.result as string});
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {currentProduct?.image && (
                          <div className="w-16 h-16 rounded-xl border border-black/5 overflow-hidden bg-gray-100 flex-shrink-0">
                            <OptimizedImage src={currentProduct.image} alt={currentProduct.name} width={100} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">
                          <span>Catégorie</span>
                          {showNewCatInput && (
                            <button type="button" onClick={() => { setShowNewCatInput(false); setCurrentProduct({...currentProduct!, category: ''}); }} className="text-primary hover:text-primary-hover capitalize tracking-normal text-[10px]">Annuler</button>
                          )}
                        </label>
                        {showNewCatInput ? (
                          <input 
                            type="text"
                            value={currentProduct?.category || ''} 
                            onChange={e => setCurrentProduct({...currentProduct!, category: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold"
                            placeholder="Saisir la nouvelle catégorie..."
                            autoFocus
                          />
                        ) : (
                          <select
                            value={currentProduct?.category || ''}
                            onChange={e => {
                              if (e.target.value === '_new') {
                                setShowNewCatInput(true);
                                setCurrentProduct({...currentProduct!, category: ''});
                              } else {
                                setCurrentProduct({...currentProduct!, category: e.target.value});
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold bg-white"
                          >
                            <option value="" disabled>Sélectionner une catégorie</option>
                            {Array.from(new Set([
                              'Général', 'Électronique', 'Mobilier', 'Fournitures', 'Services', 
                              ...(categories || []).map(c => c.name),
                              ...(products || []).map(p => p.category)
                            ].filter(Boolean))).map(cat => (
                              <option key={cat as string} value={cat as string}>{cat}</option>
                            ))}
                            <option value="_new" className="font-bold text-primary">+ Ajouter une nouvelle</option>
                          </select>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">
                          <span>Sous Catégorie</span>
                          {showNewSubCatInput && (
                            <button type="button" onClick={() => { setShowNewSubCatInput(false); setCurrentProduct({...currentProduct!, subCategory: ''}); }} className="text-primary hover:text-primary-hover capitalize tracking-normal text-[10px]">Annuler</button>
                          )}
                        </label>
                        {showNewSubCatInput ? (
                          <input 
                            type="text" 
                            value={currentProduct?.subCategory || ''} 
                            onChange={e => setCurrentProduct({...currentProduct!, subCategory: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold"
                            placeholder="Saisir la nouvelle sous catégorie..."
                            autoFocus
                          />
                        ) : (
                          <select
                            value={currentProduct?.subCategory || ''}
                            onChange={e => {
                              if (e.target.value === '_new') {
                                setShowNewSubCatInput(true);
                                setCurrentProduct({...currentProduct!, subCategory: ''});
                              } else {
                                setCurrentProduct({...currentProduct!, subCategory: e.target.value});
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold bg-white"
                          >
                            <option value="">(Aucune)</option>
                            {Array.from(new Set([
                              ...(categories.find(c => c.name.toLowerCase() === currentProduct?.category?.toLowerCase())?.subCategories || []),
                              ...(products.filter(p => p.category && p.category.toLowerCase() === currentProduct?.category?.toLowerCase()).map(p => p.subCategory))
                            ].filter(Boolean))).map(sub => (
                              <option key={sub as string} value={sub as string}>{sub}</option>
                            ))}
                            <option value="_new" className="font-bold text-primary">+ Ajouter une nouvelle</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Coût intrant par unité (Prix d'achat)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={currentProduct?.costPrice === 0 ? '' : currentProduct?.costPrice || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, costPrice: Number(e.target.value.replace(/\D/g, ''))})} 
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix de vente</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required 
                        value={currentProduct?.price === 0 ? '' : currentProduct?.price || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, price: Number(e.target.value.replace(/\D/g, ''))})} 
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Stock actuel</label>
                    <input 
                      type="number" 
                      required 
                      value={currentProduct?.stockQuantity || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, stockQuantity: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Seuil d'alerte</label>
                    <input 
                      type="number" 
                      required 
                      value={currentProduct?.minStockLevel || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, minStockLevel: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Tailles (Optionnel)</label>
                    <input 
                      type="text" 
                      value={currentProduct?.sizes || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, sizes: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm" 
                      placeholder="ex: S, M, L, XL ou 38, 39, 40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Couleur (Optionnel)</label>
                    <input 
                      type="text" 
                      value={currentProduct?.colors || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, colors: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm" 
                      placeholder="ex: Noir, Blanc, Bleu, Rouge"
                    />
                  </div>
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le produit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le produit ?</h3>
              <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={saving}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Stock Adjustment Modal */}
      <AnimatePresence>
        {isAdjusting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Ajustement Manuel du Stock</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Corriger manuellement les écarts de stock</p>
                </div>
                <button onClick={() => setIsAdjusting(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleManualAdjustment} className="p-8 space-y-5">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Sélectionner l'article</label>
                  <select
                    required
                    value={adjustmentData.productId}
                    onChange={e => setAdjustmentData({ ...adjustmentData, productId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold bg-white text-sm"
                  >
                    <option value="" disabled>Choisir un produit...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''} — Stock Actuel: {p.stockQuantity || 0}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type d'opération</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setAdjustmentData({ ...adjustmentData, type: 'in' })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          adjustmentData.type === 'in' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-ink'
                        }`}
                      >
                        Entrée (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustmentData({ ...adjustmentData, type: 'out' })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          adjustmentData.type === 'out' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:text-ink'
                        }`}
                      >
                        Sortie (-)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Quantité</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={adjustmentData.quantity || ''}
                      onChange={e => setAdjustmentData({ ...adjustmentData, quantity: Math.max(1, Number(e.target.value)) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Motif prédéfini</label>
                  <select
                    value={adjustmentData.reason}
                    onChange={e => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold bg-white text-sm"
                  >
                    <option value="Casse / Périmé">Casse / Périmé / Endommagé (Sortie)</option>
                    <option value="Vol / Perte constaté">Vol / Perte constaté (Sortie)</option>
                    <option value="Correction d'inventaire">Correction d'inventaire physique</option>
                    <option value="Retour client non répertorié">Retour client non répertorié (Entrée)</option>
                    <option value="Donation / Échantillon">Donation / Échantillon (Sortie)</option>
                    <option value="Autre motif">Autre motif (spécifier ci-dessous)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Notes supplémentaires (Optionnel)</label>
                  <input
                    type="text"
                    value={adjustmentData.customReason || ''}
                    onChange={e => setAdjustmentData({ ...adjustmentData, customReason: e.target.value })}
                    placeholder="Précisez les détails du mouvement..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom de l'opérateur</label>
                    <input
                      type="text"
                      required
                      value={adjustmentData.operator}
                      onChange={e => setAdjustmentData({ ...adjustmentData, operator: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button type="button" onClick={() => setIsAdjusting(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supplier Purchase Order Modal */}
      <AnimatePresence>
        {isGeneratingPO && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Bon de Commande Fournisseur (Réassort)</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Générer un ordre de réapprovisionnement automatique</p>
                </div>
                <button onClick={() => { setIsGeneratingPO(false); setGeneratedPODoc(null); }} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {!generatedPODoc ? (
                <form onSubmit={handleGeneratePODocument} className="p-8 space-y-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Fournisseur</label>
                      <input
                        type="text"
                        required
                        value={poSupplier.name}
                        onChange={e => setPoSupplier({ ...poSupplier, name: e.target.value })}
                        placeholder="ex: SENEGAL TEXTILE SARL"
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm font-bold"
                      />
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-center gap-3 text-xs">
                      <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        Les articles sélectionnés ci-dessous sont en alerte ou rupture de stock. Les quantités de commande par défaut visent à doubler le seuil d'alerte.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-mono font-black text-ink uppercase tracking-widest">Articles à Commander</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border border-gray-100 rounded-2xl p-4">
                      {products.map(p => {
                        const isSelected = selectedPOProducts.includes(p.id as string);
                        
                        return (
                          <div key={p.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-4 ${
                            isSelected ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-gray-100'
                          }`}>
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedPOProducts([...selectedPOProducts, p.id as string]);
                                  } else {
                                    setSelectedPOProducts(selectedPOProducts.filter(id => id !== p.id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <p className="text-xs font-black text-ink">{p.name}</p>
                                <p className="text-[9px] font-mono text-gray-400">Stock actuel: {p.stockQuantity || 0} / Seuil: {p.minStockLevel || 5}</p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] font-mono text-gray-400 uppercase">Qté à Commander :</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={poCustomQuantities[p.id as string] || ''}
                                  onChange={e => setPoCustomQuantities({ ...poCustomQuantities, [p.id as string]: Math.max(1, Number(e.target.value)) })}
                                  className="w-20 px-3 py-1.5 border border-indigo-100 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setIsGeneratingPO(false)} className="px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                      Générer le document PDF/Imprimable
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 flex-1 flex flex-col overflow-y-auto">
                  <div className="border border-gray-200 p-8 rounded-2xl bg-gray-50/20 font-sans shadow-inner flex-1" id="po-print-area">
                    <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-ink uppercase tracking-tight">{merchant.name}</h2>
                        <p className="text-xs text-gray-500 mt-1">E-mail: {merchant.email || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Tél: {merchant.phone || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-ink text-white font-mono text-[9px] font-black uppercase rounded-full">BON DE COMMANDE</span>
                        <p className="text-xs font-mono font-bold text-ink mt-3">{generatedPODoc.poNumber}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Généré le {generatedPODoc.date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-mono text-gray-400 uppercase font-black mb-1">Destinataire (Fournisseur) :</p>
                        <p className="text-sm font-black text-indigo-700">{generatedPODoc.supplier}</p>
                        <p className="text-xs text-gray-500 mt-1">Veuillez livrer à l'adresse de notre entrepôt.</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 text-right">
                        <p className="text-[9px] font-mono text-gray-400 uppercase font-black mb-1">Détails de Livraison :</p>
                        <p className="text-xs font-bold text-ink">Livraison Express Attendue</p>
                        <p className="text-xs text-gray-500 mt-1">Sous 3 à 5 jours ouvrés</p>
                      </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300 text-[10px] font-mono uppercase text-gray-400">
                          <th className="py-2">Description / SKU</th>
                          <th className="py-2 text-center">Quantité</th>
                          <th className="py-2 text-right">C.U. Estimé</th>
                          <th className="py-2 text-right">Total HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {generatedPODoc.items.map((item: any, idx: number) => (
                          <tr key={idx} className="text-xs text-ink">
                            <td className="py-3">
                              <p className="font-bold">{item.product?.name}</p>
                              <p className="text-[9px] font-mono text-gray-400">{item.product?.sku || 'SANS SKU'}</p>
                            </td>
                            <td className="py-3 text-center font-mono font-bold">{item.quantity}</td>
                            <td className="py-3 text-right font-mono">{item.unitCost.toLocaleString()} {merchant.currency}</td>
                            <td className="py-3 text-right font-mono font-bold">{item.total.toLocaleString()} {merchant.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
                      <div className="text-[10px] text-gray-400 max-w-sm">
                        * Ce document sert d'ordre officiel de commande. Le coût exact sera réajusté lors de la réception finale des factures d'achat.
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold uppercase font-black">Montant Total Estimé HT</p>
                        <p className="text-2xl font-black text-emerald-600">{generatedPODoc.totalCost.toLocaleString()} {merchant.currency}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 justify-end border-t border-gray-100 mt-4">
                    <button onClick={() => setGeneratedPODoc(null)} className="px-5 py-3 border border-gray-200 text-xs font-bold rounded-xl text-gray-500 hover:bg-gray-50 transition-all">Retour</button>
                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="px-6 py-3 bg-ink text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Imprimer / PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Physical Inventory Counting Sheet Modal */}
      <AnimatePresence>
        {isInventorySheetOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Fiche de Comptage d'Inventaire Physique</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Imprimer une fiche pour faire l'inventaire dans les rayons</p>
                </div>
                <button onClick={() => setIsInventorySheetOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 flex flex-col space-y-6">
                <div className="p-4 bg-amber-50 text-amber-900 border border-amber-100 rounded-2xl flex items-center gap-3 text-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    Imprimez ce document pour vos équipes. Il comporte des colonnes vides pour le comptage physique manuel ainsi que les écarts constatés par rapport au système informatique.
                  </span>
                </div>

                <div className="border border-gray-200 p-8 rounded-2xl bg-white shadow-sm flex-1 print:p-0" id="print-sheet-area">
                  <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-ink uppercase tracking-tight">{merchant.name} - Inventaire</h2>
                      <p className="text-xs text-gray-500 mt-1">Fiche de comptage physique pour contrôle des stocks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-gray-400 uppercase">Date d'inventaire :</p>
                      <p className="text-sm font-bold text-ink border-b border-gray-300 w-32 pb-1 inline-block mt-1"></p>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300 text-[9px] font-mono uppercase text-gray-400">
                        <th className="py-3">SKU / Code-barres</th>
                        <th className="py-3">Nom de l'article</th>
                        <th className="py-3">Catégorie</th>
                        <th className="py-3 text-center w-28">Stock Système</th>
                        <th className="py-3 text-center w-32">Comptage Réel</th>
                        <th className="py-3 text-center w-32">Écart (+/-)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((p, idx) => (
                        <tr key={idx} className="text-xs text-ink h-12">
                          <td className="py-2 font-mono text-gray-400">{p.sku || 'SANS SKU'}</td>
                          <td className="py-2 font-bold">{p.name}</td>
                          <td className="py-2 text-gray-500">{p.category || 'Général'}</td>
                          <td className="py-2 text-center font-mono font-bold text-gray-400">{p.stockQuantity || 0}</td>
                          <td className="py-2 text-center">
                            <div className="w-20 h-6 border border-gray-300 rounded mx-auto"></div>
                          </td>
                          <td className="py-2 text-center">
                            <div className="w-20 h-6 border border-gray-300 rounded mx-auto bg-gray-50/50"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-12 pt-12 border-t border-dashed border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-400">
                    <div>
                      <p className="font-bold mb-8">Visa de l'opérateur / inventorieur :</p>
                      <p className="border-t border-gray-200 pt-2">Nom & Signature :</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold mb-8">Visa de la direction :</p>
                      <p className="border-t border-gray-200 pt-2 inline-block w-48">Signature :</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 justify-end border-t border-gray-100">
                  <button onClick={() => setIsInventorySheetOpen(false)} className="px-5 py-3 border border-gray-200 text-xs font-bold rounded-xl text-gray-500 hover:bg-gray-50 transition-all">Fermer</button>
                  <button 
                    onClick={() => {
                      window.print();
                    }}
                    className="px-6 py-3 bg-ink text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Imprimer Fiche</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default InventoryManager;
