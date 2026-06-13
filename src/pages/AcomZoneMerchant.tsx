import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MapPin, Phone, Mail, Globe, Clock, Star, Package, Check, Share2, 
  Info, ArrowRight, Search, Scan, ArrowUpDown, SlidersHorizontal, Sparkles, X, 
  HelpCircle, CheckCircle2, ChevronDown, ListFilter, RefreshCw, Smartphone, 
  Shirt, Stethoscope, GraduationCap, Wrench, HardHat, Car, Users, ShoppingBag,
  Tag, Scissors, Palette, Plus, Minus, Trash2, LayoutDashboard
} from 'lucide-react';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { Merchant, MerchantProduct, Order } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { dbService } from '../services/dbService';
import { merchantProductRepository } from '../data/repositories/merchant-product.repository';
import toast from 'react-hot-toast';

const DEFAULT_SAAS_PRODUCTS: Record<string, any[]> = {
  pressing: [
    { id: 'pres_chemise', name: "Chemise", price: 500, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Chemise.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1545155998-20bedb51d206?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_pantalon', name: "Pantalon", price: 700, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Pantalon.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_costume', name: "Costume", price: 1500, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Costume.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_robe', name: "Robe", price: 1000, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Robe.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_drap', name: "Drap", price: 800, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Drap.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_couverture', name: "Couverture", price: 2000, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Couverture.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1579152249012-6855ca1c41b5?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_rideau', name: "Rideau", price: 1500, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Rideau.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_autre', name: "Autre (Pièce)", price: 500, category: "Pressing & Nettoyage", description: "Service de nettoyage et repassage professionnel pour Autre (Pièce).", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_poids_standard', name: "Lavage au Poids (Standard) - Par Kg", price: 1500, category: "Service au Kilo", description: "Tarification au kilo pour le nettoyage en mode standard.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"] },
    { id: 'pres_poids_premium', name: "Lavage au Poids (Premium) - Par Kg", price: 2500, category: "Service au Kilo", description: "Tarification au kilo pour le nettoyage en mode premium.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1521791136368-1a46827d0a1a?auto=crop&w=600&q=80"] },
    { id: 'pres_poids_express', name: "Lavage au Poids (Express) - Par Kg", price: 3000, category: "Service au Kilo", description: "Tarification au kilo pour le nettoyage en mode express.", isService: true, stockQuantity: 999, images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80"] }
  ]
};

export default function AcomZoneMerchant() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const saasType = merchant?.type || 'boutique';
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'alert' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState('name_asc');
  
  // Dialog and Mock states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInputValue, setBarcodeInputValue] = useState('');
  const [orderingProduct, setOrderingProduct] = useState<MerchantProduct | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Shopping Cart States
  const [cart, setCart] = useState<Array<{ product: MerchantProduct; quantity: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingCartOrder, setIsSubmittingCartOrder] = useState(false);

  // Client booking form fields state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [specificFields, setSpecificFields] = useState<Record<string, any>>({});
  const [orderQuantity, setOrderQuantity] = useState(1);

  // Fallbacks using local Dexie data
  const localMerchants = useLiveQuery(() => db.merchants.toArray()) || [];
  const localProducts = useLiveQuery(() => merchantId ? db.products.where('merchantId').equals(merchantId).toArray() : []) || [];
  
  const { data: merchants, loading: loadingMerchants } = useFirestoreData<Merchant>({
    tableName: 'merchants',
    realtime: true
  });

  const { data: products1, loading: loadingProducts1 } = useFirestoreData<MerchantProduct>({
    tableName: 'merchant_products',
    realtime: true,
    where: merchantId ? [['merchantId', '==', merchantId]] : undefined
  });

  const { data: products2, loading: loadingProducts2 } = useFirestoreData<MerchantProduct>({
    tableName: 'merchant_products',
    realtime: true,
    where: merchantId ? [['merchant_id', '==', merchantId]] : undefined
  });

  const products = useMemo(() => {
    const combined = [...products1, ...products2];
    const unique = new Map();
    combined.forEach(p => unique.set(p.id, p));
    return Array.from(unique.values());
  }, [products1, products2]);

  useEffect(() => {
    const sourceMerchants = merchants.length > 0 ? merchants : localMerchants;
    if (sourceMerchants && sourceMerchants.length > 0) {
      const found = sourceMerchants.find(m => m.id === merchantId);
      if (found) {
        setMerchant(found);
      }
    }
  }, [merchants, localMerchants, merchantId]);

  const sourceProducts = useMemo(() => {
    const dbProducts = products.length > 0 ? products : localProducts;
    if (dbProducts.length > 0) {
      return dbProducts.map(p => ({
        ...p,
        merchantId: merchantId || '',
        id: p.id
      }));
    }

    const defaults = DEFAULT_SAAS_PRODUCTS[saasType] || [];
    return defaults.map(p => ({
      ...p,
      merchantId: merchantId || '',
      id: p.id + "_" + (merchantId || 'temp')
    }));
  }, [products, localProducts, saasType, merchantId]);

  // Pressing-specific detailed states (synchronized with "Fiche de Réception Client")
  const PRESSING_ITEM_PRICES = useMemo(() => {
    const prices: Record<string, number> = {};
    sourceProducts.forEach(p => {
      if (p.category === 'Pressing & Nettoyage') {
        const name = p.name.replace(/^Lavage complet & Repassage - /i, '').replace(/^Nettoyage Express - /i, '');
        prices[name] = p.price || 0;
      }
    });
    if (Object.keys(prices).length === 0) {
      return { Chemise: 400, Pantalon: 500, Costume: 1500, Robe: 1000, Drap: 600, Couverture: 2000, Rideau: 1500, Autre: 400 };
    }
    return prices;
  }, [sourceProducts]);

  const PRESSING_WEIGHT_PRICES = useMemo(() => {
    const prices: Record<string, number> = {};
    sourceProducts.forEach(p => {
      if (p.category === 'Service au Kilo') {
        const nameKey = p.name.toLowerCase().includes('premium') ? 'Premium' : p.name.toLowerCase().includes('express') ? 'Express' : 'Standard';
        prices[nameKey] = p.price || 0;
      }
    });
    if (Object.keys(prices).length === 0) {
      return { Standard: 1500, Premium: 2500, Express: 3000 };
    }
    return prices;
  }, [sourceProducts]);

  const pressingAddonPrices = useMemo(() => ({
    repassage: 1000,
    express: 1500,
    detachage: 1000,
    livraison: 1500,
    emballage: 500
  }), []);

  const [laundryQuantities, setLaundryQuantities] = useState<Record<string, number>>({});
  const [billingType, setBillingType] = useState<'article' | 'weight'>('article');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [selectedWeightService, setSelectedWeightService] = useState<string>('Standard');
  const [depositDate, setDepositDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [retrievalDate, setRetrievalDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // default 2 days retrieval
    return d.toISOString().split('T')[0];
  });
  const [observations, setObservations] = useState<string>('');
  const [optionalServices, setOptionalServices] = useState<Record<string, boolean>>({
    repassage: false,
    express: false,
    detachage: false,
    livraison: false,
    emballage: false
  });

  const pressingTotalDetails = useMemo(() => {
    let basePrice = 0;
    if (billingType === 'article') {
      Object.entries(laundryQuantities).forEach(([item, q]) => {
        const up = PRESSING_ITEM_PRICES[item as keyof typeof PRESSING_ITEM_PRICES] || 0;
        basePrice += up * q;
      });
    } else {
      const kiloPrice = PRESSING_WEIGHT_PRICES[selectedWeightService] || 1500;
      basePrice = weightKg * kiloPrice;
    }

    let addonPrice = 0;
    Object.entries(optionalServices).forEach(([addon, active]) => {
      if (active) {
        addonPrice += pressingAddonPrices[addon as keyof typeof pressingAddonPrices] || 0;
      }
    });

    const totalBeforeDiscount = basePrice + addonPrice;
    const finalTotal = Math.max(0, totalBeforeDiscount);

    return {
      basePrice,
      addonPrice,
      totalBeforeDiscount,
      finalTotal,
      restToPay: finalTotal
    };
  }, [laundryQuantities, billingType, weightKg, selectedWeightService, optionalServices, PRESSING_ITEM_PRICES, PRESSING_WEIGHT_PRICES, pressingAddonPrices]);

  // Synchronize initial pressing selection to state
  useEffect(() => {
    if (saasType === 'pressing' && orderingProduct) {
      setLaundryQuantities(prev => {
        const newQuantities = { ...prev };
        // If coming from an ordering product, select it
        if (orderingProduct) {
           const pName = orderingProduct.name.toLowerCase();
           if (pName.includes('costume')) newQuantities['Costume'] = 1;
           else if (pName.includes('robe')) newQuantities['Robe'] = 1;
           else if (pName.includes('chemise')) newQuantities['Chemise'] = 1;
           else if (pName.includes('pantalon')) newQuantities['Pantalon'] = 1;
           else if (pName.includes('drap')) newQuantities['Drap'] = 1;
           else if (pName.includes('couverture')) newQuantities['Couverture'] = 1;
           else if (pName.includes('rideau')) newQuantities['Rideau'] = 1;
           else newQuantities[orderingProduct.name] = 1;
        }
        return newQuantities;
      });
      setBillingType(orderingProduct?.category === 'Service au Kilo' ? 'weight' : 'article');
      if (orderingProduct?.category === 'Service au Kilo') {
         const nameKey = orderingProduct.name.toLowerCase().includes('premium') ? 'Premium' : orderingProduct.name.toLowerCase().includes('express') ? 'Express' : 'Standard';
         setSelectedWeightService(nameKey);
      }
    }
  }, [orderingProduct, saasType]);
  
  // Format real categories dynamically based on products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    sourceProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [sourceProducts]);

  const subCategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const subs = new Set<string>();
    sourceProducts.forEach(p => {
      if (p.category === selectedCategory && p.subCategory) {
        subs.add(p.subCategory);
      }
    });
    return Array.from(subs).sort((a, b) => a.localeCompare(b));
  }, [sourceProducts, selectedCategory]);

  const availableSizes = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const list = new Set<string>();
    const categoryFiltered = sourceProducts.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSubCat = selectedSubCategory === 'all' || p.subCategory === selectedSubCategory;
      return matchCat && matchSubCat;
    });
    categoryFiltered.forEach(p => {
      if (p.sizes) {
        p.sizes.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) list.add(trimmed.toUpperCase());
        });
      }
    });
    return Array.from(list).sort();
  }, [sourceProducts, selectedCategory, selectedSubCategory]);

  const availableColors = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const list = new Set<string>();
    const categoryFiltered = sourceProducts.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSubCat = selectedSubCategory === 'all' || p.subCategory === selectedSubCategory;
      return matchCat && matchSubCat;
    });
    categoryFiltered.forEach(p => {
      if (p.colors) {
        p.colors.split(',').forEach(c => {
          const trimmed = c.trim();
          if (trimmed) list.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
        });
      }
    });
    return Array.from(list).sort();
  }, [sourceProducts, selectedCategory, selectedSubCategory]);

  // Reset helper filters on structural changes
  useEffect(() => {
    setSelectedSubCategory('all');
    setSelectedSize('all');
    setSelectedColor('all');
  }, [selectedCategory]);

  useEffect(() => {
    setSelectedSize('all');
    setSelectedColor('all');
  }, [selectedSubCategory]);

  // Handle mock barcode code entry / validation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = barcodeInputValue.trim().toUpperCase();
    if (!token) return;

    // Search product code / SKU matching the input
    const found = sourceProducts.find(p => p.sku?.toUpperCase() === token || p.id.toUpperCase().includes(token));
    if (found) {
      setSearchQuery(found.name);
      toast.success(`Produit détecté : ${found.name}`);
      setIsScannerOpen(false);
      setBarcodeInputValue('');
    } else {
      toast.error("Aucun produit ne correspond à ce code-barres (SKU)");
    }
  };

  // Simulate scanning code automatically
  const simulateScanResult = (product: MerchantProduct) => {
    setSearchQuery(product.name);
    toast.success(`Scan réussi : ${product.name} (SKU: ${product.sku || 'N/A'})`);
    setIsScannerOpen(false);
  };

  // Handle Place Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingProduct || !merchant) return;

    if (!clientName.trim() || !clientPhone.trim()) {
      toast.error("Veuillez saisir votre nom et votre numéro de téléphone");
      return;
    }

    const currentStock = Number(orderingProduct.stockQuantity !== undefined ? orderingProduct.stockQuantity : 0);
    if (orderQuantity > currentStock) {
      toast.error(`Désolé, il ne reste que ${currentStock} unités de ce produit en stock.`);
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const isPressing = saasType === 'pressing';
      const discount = 0;
      const paymentStatus = 'unpaid';
      const amountPaid = 0;
      const paymentMethod = 'none';
      const bookingData: any = {
        userId: "acom_client_" + Math.random().toString(36).substr(2, 9),
        merchantId: merchant.id,
        partnerId: merchant.id, // For dual role compatibility
        status: 'pending',
        serviceId: orderingProduct.id,
        serviceName: isPressing ? 'Fiche de Réception Client' : orderingProduct.name,
        totalPrice: isPressing ? pressingTotalDetails.finalTotal : (orderingProduct.price * orderQuantity),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || 'contact@client-acomzone.sn',
        pillar: 'saas',
        unreadByAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        details: {
          clientPhone: clientPhone.trim(),
          clientAddress: specificFields.address || 'Point de vente / Click & Collect',
          saasSector: saasType,
          simulated: false,
          quantity: isPressing ? 1 : orderQuantity,
          unitPrice: isPressing ? pressingTotalDetails.finalTotal : orderingProduct.price,
          ...(isPressing ? {
            billingType,
            laundryQuantities: Object.fromEntries(Object.entries(laundryQuantities).filter(([_, q]) => q > 0)),
            weightKg: billingType === 'weight' ? weightKg : 0,
            depositDate,
            retrievalDate,
            observations,
            optionalServices,
            discount,
            paymentStatus,
            amountPaid,
            paymentMethod,
            restToPay: pressingTotalDetails.restToPay,
            items: billingType === 'article' 
              ? Object.entries(laundryQuantities).filter(([_, q]) => q > 0).map(([item, q]) => `${q}x ${item}`).join(', ')
              : `${weightKg} Kg de linge`,
            mode: `Fiche press: ${Object.entries(optionalServices).filter(([_, active]) => active).map(([name]) => name.toUpperCase()).join('+') || 'Standard'}`
          } : specificFields)
        }
      };

      await dbService.orders.save(bookingData);

      // Deduct stock quantity automatically
      const newStock = Math.max(0, currentStock - orderQuantity);

      // Update in local Dexie database for immediate reactive render of available units
      await db.products.update(orderingProduct.id, {
        stockQuantity: newStock,
        updatedAt: new Date()
      });

      // Update in remote Firestore database (rules permit partial update of stockQuantity line items)
      try {
        await merchantProductRepository.update(orderingProduct.id, {
          stockQuantity: newStock
        });
      } catch (remoteErr) {
        console.warn("Could not sync stock decrement with cloud Firestore:", remoteErr);
      }

      toast.success("Votre commande a été transmise avec succès au commerçant !");
      setOrderingProduct(null);
      // Reset forms
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setOrderQuantity(1);
      setSpecificFields({});
    } catch (e) {
      console.error(e);
      toast.error("Erreur technique lors de l'enregistrement de votre commande.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Cart Operations
  const addToCart = (product: MerchantProduct) => {
    const available = Number(product.stockQuantity !== undefined ? product.stockQuantity : 0);
    if (available <= 0) {
      toast.error("Ce produit est en rupture de stock.");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > available) {
          toast.error(`Stock maximum disponible atteint (${available} dispo)`);
          return prev;
        }
        toast.success(`Quantité mise à jour : ${product.name} (x${newQty})`);
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
      } else {
        toast.success(`${product.name} ajouté au panier !`);
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const updateCartItemQuantity = (productId: string, qty: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const available = Number(item.product.stockQuantity !== undefined ? item.product.stockQuantity : 0);
    if (qty > available) {
      toast.error(`Seulement ${available} unités disponibles.`);
      return;
    }

    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
    toast.success("Produit retiré du panier.");
  };

  const handlePlaceCartOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !merchant) return;

    if (!clientName.trim() || !clientPhone.trim()) {
      toast.error("Veuillez saisir votre nom et votre numéro de téléphone");
      return;
    }

    // Dynamic stock verification before saving Order
    for (const item of cart) {
      const currentStock = Number(item.product.stockQuantity !== undefined ? item.product.stockQuantity : 0);
      if (item.quantity > currentStock) {
        toast.error(`Stock insuffisant pour "${item.product.name}" : il reste seulement ${currentStock} unités.`);
        return;
      }
    }

    setIsSubmittingCartOrder(true);
    try {
      const totalOrderPrice = cart.reduce((tot, item) => tot + (item.product.price * item.quantity), 0);
      const itemsList = cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku || '',
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      // Summarize services inside main fields for compatible dashboard rendering
      const summaryName = cart.map(item => `${item.product.name} (x${item.quantity})`).join(', ');

      const bookingData: any = {
        userId: "acom_client_" + Math.random().toString(36).substr(2, 9),
        merchantId: merchant.id,
        partnerId: merchant.id, // Compatibility
        status: 'pending',
        serviceId: cart[0].product.id, // Primary item or cart ref
        serviceName: summaryName.length > 100 ? `${summaryName.substr(0, 97)}...` : summaryName,
        totalPrice: totalOrderPrice,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || 'contact@client-acomzone.sn',
        pillar: 'saas',
        unreadByAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        details: {
          clientPhone: clientPhone.trim(),
          clientAddress: specificFields.address || 'Point de vente / Click & Collect',
          saasSector: saasType,
          simulated: false,
          items: itemsList,
          ...specificFields
        }
      };

      // 1. Save multi-product order
      await dbService.orders.save(bookingData);

      // 2. Loop to deduct stock automatically and sync Firestore
      for (const item of cart) {
        const currentStock = Number(item.product.stockQuantity !== undefined ? item.product.stockQuantity : 0);
        const newStock = Math.max(0, currentStock - item.quantity);

        // Update local Dexie for reactive rendering
        await db.products.update(item.product.id, {
          stockQuantity: newStock,
          updatedAt: new Date()
        });

        // Update remote Firestore (partial key update permitted by rules)
        try {
          await merchantProductRepository.update(item.product.id, {
            stockQuantity: newStock
          });
        } catch (remoteErr) {
          console.warn(`Could not sync stock decrement for ${item.product.name} with cloud Firestore:`, remoteErr);
        }
      }

      toast.success("Votre commande multi-produits a été enregistrée avec succès !");
      setCart([]);
      setIsCartOpen(false);
      // Reset forms
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setSpecificFields({});
    } catch (err) {
      console.error(err);
      toast.error("Erreur technique lors de l'enregistrement de votre commande.");
    } finally {
      setIsSubmittingCartOrder(false);
    }
  };

  // Filter & sorting products
  const filteredProducts = useMemo(() => {
    let result = [...sourceProducts];

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        (p.sizes && p.sizes.toLowerCase().includes(q)) ||
        (p.colors && p.colors.toLowerCase().includes(q))
      );
    }

    // Category filter matching
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Subcategory filter matching
    if (selectedSubCategory !== 'all') {
      result = result.filter(p => p.subCategory === selectedSubCategory);
    }

    // Size filter matching
    if (selectedSize !== 'all') {
      result = result.filter(p => p.sizes && p.sizes.split(',').map(s => s.trim().toUpperCase()).includes(selectedSize));
    }

    // Color filter matching
    if (selectedColor !== 'all') {
      result = result.filter(p => p.colors && p.colors.split(',').map(c => c.trim().toUpperCase()).includes(selectedColor.toUpperCase()));
    }

    // Stock level filtering matching the mock-up
    if (stockFilter === 'in_stock') {
      result = result.filter(p => (p.stockQuantity || 0) > (p.minStockLevel || 2));
    } else if (stockFilter === 'alert') {
      result = result.filter(p => {
        const qty = p.stockQuantity || 0;
        const min = p.minStockLevel || 2;
        return qty > 0 && qty <= min;
      });
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter(p => (p.stockQuantity || 0) <= 0);
    }

    // Sorting list algorithms
    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [sourceProducts, searchQuery, selectedCategory, selectedSubCategory, selectedSize, selectedColor, stockFilter, sortBy]);

  // Loading indicator helper
  const isLoading = (loadingMerchants || loadingProducts1 || loadingProducts2) && merchants.length === 0 && localMerchants.length === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!merchant && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6 text-center">
        <h1 className="text-3xl font-black text-gray-900 mb-4 animate-pulse">Boutique introuvable</h1>
        <p className="text-gray-600 mb-8">Nous n'avons pas pu trouver cette enseigne sur AcomZone.</p>
        <Link to="/acomzone" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour à AcomZone</span>
        </Link>
      </div>
    );
  }

  // Define dynamic metadata based on the specific specialized SaaS
  const saasMeta = getSaasSpecialtyMeta(saasType);
  const hasStockManagement = saasType === 'boutique' || saasType === 'chantier';

  return (
    <div id="acom-zone-client-portal" className="min-h-screen bg-slate-50/50 pt-24 pb-20">
      
      {/* Header Banner */}
      <div className="h-60 md:h-72 w-full relative overflow-hidden bg-gradient-to-r from-gray-900 via-violet-950 to-gray-900">
        <div className="absolute inset-0 opacity-45">
          {merchant?.logo ? (
             <img referrerPolicy="no-referrer" src={merchant.logo} alt="" className="w-full h-full object-cover blur-2xl scale-125" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-violet-600/30 to-blue-900/30" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50/50 via-slate-900/30 to-transparent" />
      </div>

      <div className="px-4 md:px-12 max-w-7xl mx-auto -mt-24 relative z-10">
        
        {/* Navigation back with customized label & manager dashboard link */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link to="/acomzone" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all text-xs font-black uppercase tracking-widest backdrop-blur-md bg-black/45 px-5 py-3 rounded-full shadow-lg hover:bg-black/60 active:scale-95">
            <ArrowLeft className="w-4 h-4 text-violet-400" />
            Retour au Plan de Ville
          </Link>
          <Link to="/merchant/saas" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all text-xs font-black uppercase tracking-widest backdrop-blur-md bg-emerald-600/80 hover:bg-emerald-600 px-5 py-3 rounded-full shadow-lg active:scale-95 border border-emerald-500/30">
            <LayoutDashboard className="w-4 h-4 text-emerald-300" />
            Espace de gestion
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100/50 flex flex-col md:flex-row gap-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border border-gray-150 shadow-inner overflow-hidden shrink-0 flex items-center justify-center mx-auto md:mx-0 relative z-20">
            {merchant?.logo ? (
              <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain p-2 bg-white" />
            ) : (
              <div className="w-full h-full bg-violet-600/10 text-violet-700 flex items-center justify-center text-3xl font-black">
                {merchant?.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3.5 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{merchant?.name}</h1>
                  <span className="bg-emerald-550/10 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/10 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    En Ligne
                  </span>
                </div>
                <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">{merchant?.description || 'Découvrez nos services professionnels disponibles en commande directe.'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-gray-500 pt-3 border-t border-gray-50">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg border border-gray-100 flex items-center gap-1.5 font-bold">
                <saasMeta.icon className="w-3.5 h-3.5" />
                Secteur : {saasMeta.tagLabel}
              </span>
              {merchant?.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-violet-500" />
                  <span>{merchant.address}</span>
                </div>
              )}
              {merchant?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-violet-500" />
                  <span>{merchant.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📸 INTUITIVE CLIENT MOCK INTERFACE (100% faithful to screenshots) */}
        <div id="intelligent-acomzone-search-filters" className="space-y-6 mb-10">
          
          {/* Top Pill Bar: Search & Scan */}
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search inputs */}
            <div className="relative flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm focus-within:shadow-md focus-within:border-violet-500 transition-all px-6 py-4 flex items-center">
              <Search className="w-5 h-5 text-violet-600 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 font-medium focus:ring-0 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>



          </div>

          {/* Catalog Categories (Establishment spec) + Stock Filter combined panel */}
          <div className="bg-white rounded-[1.8rem] p-6 shadow-sm border border-gray-100/80 space-y-6">
            
            {/* Categories section */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  Catégories de l'établissement
                </span>
                {(selectedCategory !== 'all' || selectedSubCategory !== 'all' || selectedSize !== 'all' || selectedColor !== 'all' || stockFilter !== 'all' || searchQuery !== '') && (
                  <button 
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedSubCategory('all');
                      setSelectedSize('all');
                      setSelectedColor('all');
                      setStockFilter('all');
                      setSearchQuery('');
                    }} 
                    className="text-xs text-[#7C3AED] hover:underline font-bold transition-all"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {/* Tous Button */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
                    selectedCategory === 'all' 
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200/80'
                  }`}
                >
                  <span>Tous</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {sourceProducts.length}
                  </span>
                </button>

                {categories.map((cat, index) => {
                  const isSelected = selectedCategory === cat;
                  const count = sourceProducts.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
                        isSelected 
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200/80'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ligne 1.5: Sous-catégories (Filtre rapide) */}
            {selectedCategory !== 'all' && subCategories.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    Sous-catégories associées
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setSelectedSubCategory('all')}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${
                      selectedSubCategory === 'all'
                        ? 'bg-violet-100/80 text-[#7C3AED] border-violet-200/70 font-bold'
                        : 'bg-white text-gray-600 hover:text-gray-800 border-gray-200/80'
                    }`}
                  >
                    <span>Toutes</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      selectedSubCategory === 'all' ? 'bg-[#7C3AED]/20 text-[#7C3AED]' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {sourceProducts.filter(p => p.category === selectedCategory).length}
                    </span>
                  </button>

                  {subCategories.map((subCat) => {
                    const count = sourceProducts.filter(p => p.category === selectedCategory && p.subCategory === subCat).length;
                    const isSelected = selectedSubCategory === subCat;
                    return (
                      <button
                        key={subCat}
                        onClick={() => setSelectedSubCategory(subCat)}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${
                          isSelected
                            ? 'bg-violet-100/80 text-[#7C3AED] border-violet-200/70 font-bold'
                            : 'bg-white text-gray-600 hover:text-gray-800 border-gray-200/80'
                        }`}
                      >
                        <span>{subCat}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-[#7C3AED]/20 text-[#7C3AED]' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ligne 1.8: Tailles et Couleurs */}
            {(availableSizes.length > 0 || availableColors.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                
                {availableSizes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-gray-400" />
                        Filtrer par Taille
                      </span>
                      {selectedSize !== 'all' && (
                        <button 
                          onClick={() => setSelectedSize('all')} 
                          className="text-[9px] font-bold text-[#7C3AED] hover:underline"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedSize('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border shadow-sm ${
                          selectedSize === 'all'
                            ? 'bg-violet-100/80 text-[#7C3AED] border-violet-200/70'
                            : 'bg-white text-gray-500 hover:text-gray-800 border-gray-200/80'
                        }`}
                      >
                        Toutes
                      </button>
                      {availableSizes.map(size => {
                        const count = sourceProducts.filter(p => p.sizes && p.sizes.split(',').map(s => s.trim().toUpperCase()).includes(size)).length;
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border shadow-sm ${
                              isSelected
                                ? 'bg-violet-100/80 text-[#7C3AED] border-violet-200/70'
                                : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200/80'
                            }`}
                          >
                            <span>{size}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-[#7C3AED]/25 text-[#7C3AED]' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-gray-400" />
                        Filtrer par Couleur
                      </span>
                      {selectedColor !== 'all' && (
                        <button 
                          onClick={() => setSelectedColor('all')} 
                          className="text-[9px] font-bold text-[#7C3AED] hover:underline"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedColor('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border shadow-sm ${
                          selectedColor === 'all'
                            ? 'bg-violet-100/80 text-[#7C3AED] border-violet-200/70'
                            : 'bg-white text-gray-500 hover:text-gray-800 border-gray-200/80'
                        }`}
                      >
                        Toutes
                      </button>
                      {availableColors.map(color => {
                        const count = sourceProducts.filter(p => p.colors && p.colors.split(',').map(c => c.trim().toUpperCase()).includes(color.toUpperCase())).length;
                        const isSelected = selectedColor === color;
                        return (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border shadow-sm ${
                              isSelected
                                ? 'bg-violet-100/80 text-[#7C3AED] border-violet-200/70 border-violet-200 text-[#7C3AED] font-bold'
                                : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200/80'
                            }`}
                          >
                            <span>{color}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-[#7C3AED]/25 text-[#7C3AED]' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Sub-Filters: Stock levels (Tout / En stock / Alerte / Rupture) */}
            <div className={`pt-5 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center gap-4 ${hasStockManagement ? 'justify-between' : 'justify-end'}`}>
              
              {hasStockManagement && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filtrer Stock :</span>
                  
                  <div className="flex bg-gray-50 border border-gray-200/70 p-1 rounded-2xl">
                    <button
                      onClick={() => setStockFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${stockFilter === 'all' ? 'bg-white text-gray-900 shadow-sm shadow-black/5' : 'text-gray-500'}`}
                    >
                      Tout
                    </button>
                    <button
                      onClick={() => setStockFilter('in_stock')}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${stockFilter === 'in_stock' ? 'bg-[#00ba88] text-white shadow-sm font-black shadow-black/5' : 'text-gray-500'}`}
                    >
                      En stock
                    </button>
                    <button
                      onClick={() => setStockFilter('alert')}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${stockFilter === 'alert' ? 'bg-amber-500 text-white shadow-sm shadow-black/5' : 'text-gray-500'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Alerte stock
                    </button>
                    <button
                      onClick={() => setStockFilter('out_of_stock')}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${stockFilter === 'out_of_stock' ? 'bg-rose-500 text-white shadow-sm shadow-black/5' : 'text-gray-500'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-450" />
                      Rupture
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic sorting dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-450">Trier par :</span>
                <div className="relative inline-block text-left">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200/80 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 cursor-pointer"
                  >
                    <option value="name_asc">Nom (A-Z)</option>
                    <option value="name_desc">Nom (Z-A)</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Dynamic Products Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Package className="w-5.5 h-5.5 text-violet-600" />
              Catalogue de l'Établissement ({filteredProducts.length})
            </h2>
            {searchQuery && (
              <span className="text-xs bg-violet-50 text-violet-700 font-bold px-3 py-1 rounded-full border border-violet-100">
                Filtre actif : {searchQuery}
              </span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-16 text-center shadow-sm">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun produit/service trouvé</h3>
              <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
                Ajustez vos filtres de catégories ou essayez un mot-clé générique pour découvrir de nouveaux services.
              </p>
              {(searchQuery || selectedCategory !== 'all' || selectedSubCategory !== 'all' || selectedSize !== 'all' || selectedColor !== 'all' || stockFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedSubCategory('all');
                    setSelectedSize('all');
                    setSelectedColor('all');
                    setStockFilter('all');
                  }}
                  className="mt-5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Réinitialiser tous les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => {
                const isOutOfStock = (product.stockQuantity || 0) <= 0;
                const isAlert = product.stockQuantity > 0 && product.stockQuantity <= (product.minStockLevel || 2);
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    className="group bg-white rounded-2xl border border-gray-150/40 overflow-hidden hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col relative"
                  >
                    {/* Status Dot / Ribbon */}
                    {hasStockManagement && (
                      isOutOfStock ? (
                        <span className="absolute top-3 right-3 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-10">
                          Rupture
                        </span>
                      ) : isAlert ? (
                        <span className="absolute top-3 right-3 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-10">
                          Stock Limité
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-10">
                          Disponible
                        </span>
                      )
                    )}

                    <div className="h-44 bg-gray-50/50 relative overflow-hidden flex items-center justify-center p-6">
                      {product.image ? (
                        <img referrerPolicy="no-referrer" src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="w-12 h-12 text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded">
                          {product.category || 'Général'}
                        </span>
                        {product.sku && (
                          <span className="text-[9px] font-mono font-bold text-gray-400">
                            {product.sku}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-black text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-2">{product.name}</h3>
                      
                      {product.description && (
                        <p className="text-xs text-gray-450 line-clamp-2 pb-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      
                      {/* Available units stock info */}
                      {hasStockManagement ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium bg-gray-50/60 rounded-xl px-3 py-1.5 border border-gray-100/80 mt-auto select-none">
                          <Package className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-rose-500' : isAlert ? 'text-amber-500' : 'text-emerald-500'}`} />
                          <span>Dispo :</span>
                          <span className={`font-black ${isOutOfStock ? 'text-rose-600' : isAlert ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {isOutOfStock ? 'Fermé / Rupture' : `${product.stockQuantity !== undefined ? product.stockQuantity : 0} ${product.stockQuantity && product.stockQuantity > 1 ? 'unités' : 'unité'}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium bg-gray-50/60 rounded-xl px-3 py-1.5 border border-gray-100/80 mt-auto select-none">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Statut :</span>
                          <span className="font-black text-emerald-700">Disponible</span>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-1.5">
                        <div className="text-sm font-black text-gray-900 shrink-0">
                          {product.price.toLocaleString()} <span className="text-[10px] text-gray-400 font-medium">{merchant?.currency || 'FCFA'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Cart Button or Stepper if already added to cart */}
                          {!isOutOfStock && (() => {
                            const cartItem = cart.find(i => i.product.id === product.id);
                            if (cartItem) {
                              return (
                                <div className="flex items-center bg-violet-50 text-violet-700 rounded-xl p-0.5 border border-violet-100 shadow-sm shrink-0">
                                  <button
                                    onClick={() => updateCartItemQuantity(product.id, cartItem.quantity - 1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-all font-black text-xs text-violet-600"
                                    title="Diminuer la quantité"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-5 text-center text-[11px] font-black text-violet-800 select-none">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateCartItemQuantity(product.id, cartItem.quantity + 1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-all font-black text-xs text-violet-600"
                                    title="Augmenter la quantité"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <button
                                  onClick={() => addToCart(product)}
                                  className="h-8 px-2.5 rounded-xl bg-violet-600 hover:bg-[#7C3AED] text-white flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-violet-200 active:scale-95 shrink-0"
                                  title="Ajouter au panier"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Ajouter</span>
                                </button>
                              );
                            }
                          })()}

                          {/* Direct Purchase Button */}
                          <button 
                            disabled={isOutOfStock}
                            onClick={() => {
                              if (isOutOfStock) return;
                              setOrderingProduct(product);
                              setOrderQuantity(1);
                              // Set initial adapted specific values
                              setSpecificFields({
                                saasSector: saasType,
                                productName: product.name,
                                price: product.price
                              });
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
                              isOutOfStock 
                                ? 'bg-gray-100 text-gray-450 cursor-not-allowed border border-gray-200' 
                                : 'bg-gray-50 text-gray-600 hover:bg-[#7C3AED] hover:text-white border border-gray-150'
                            }`}
                            title={isOutOfStock ? "Rupture de stock" : "Commander immédiatement"}
                          >
                            <ArrowRight className="w-4 h-4 pointer-events-none" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Barcode scanner mockup modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Scan className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Simulateur Scanner Code-Barres</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">
                    Pour simuler, entrez la référence SKU d'un produit ou sélectionnez l'un des produits de la boutique détecté(s) ci-dessous.
                  </p>
                </div>

                {/* Laser scan window design */}
                <div className="h-32 bg-gray-950 rounded-2xl relative overflow-hidden flex items-center justify-center border-2 border-dashed border-violet-500">
                  <div className="absolute left-1/2 -ml-24 w-48 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[bounce_2s_infinite]" />
                  <span className="text-xs font-mono text-gray-500 relative z-10 uppercase select-none">Flux Caméra Activé</span>
                </div>

                {/* Direct choice of product for easy testing */}
                {sourceProducts.length > 0 && (
                  <div className="space-y-1.5 text-left bg-gray-50 p-3 rounded-xl border border-gray-150 max-h-40 overflow-y-auto">
                    <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Raccourcis de simulation (Cliquez pour scanner)</span>
                    {sourceProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => simulateScanResult(p)}
                        className="w-full text-left p-2 hover:bg-violet-50 hover:text-violet-750 text-xs font-bold text-gray-700 rounded-lg flex items-center justify-between border border-transparent hover:border-violet-100 transition-all"
                      >
                        <span className="truncate max-w-[200px]">{p.name}</span>
                        <span className="font-mono text-[9px] text-[#7C3AED] bg-violet-100/50 px-1.5 py-0.5 rounded">SKU: {p.sku || p.id.substr(0,4)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleBarcodeSubmit} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={barcodeInputValue}
                    onChange={(e) => setBarcodeInputValue(e.target.value)}
                    placeholder="Saisir SKU code-barres"
                    className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-600 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl active:scale-95 transition-all shadow-md shadow-primary/20"
                  >
                    Valider
                  </button>
                </form>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bespoke SaaS adapted Booking Form */}
      <AnimatePresence>
        {orderingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`bg-white rounded-[2rem] p-6 md:p-8 ${saasType === 'pressing' ? 'max-w-3xl' : 'max-w-xl'} w-full shadow-2xl relative my-8 max-h-[95vh] overflow-y-auto`}
            >
              <button 
                onClick={() => setOrderingProduct(null)}
                className="absolute top-5 right-5 p-2.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                
                {/* Form header adapting to SaaS Category */}
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl ${saasMeta.bgColor} border shadow-inner flex items-center justify-center`}>
                    <saasMeta.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">AcomZone • Canal Réservation</span>
                    <h3 className="font-black text-gray-900 text-xl tracking-tight mt-0.5">{saasMeta.formTitle}</h3>
                    <p className="text-xs text-gray-400 mt-1">Vous réservez le service : <span className="font-bold text-gray-700">{orderingProduct.name}</span></p>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  
                  {saasType === 'pressing' ? (
                    // BEAUTIFUL "FICHE DE RÉCEPTION CLIENT" SPECIFICATION
                    <div className="space-y-6 text-left">
                      {/* SECTION 1: INFORMATIONS DE LA COMMANDE */}
                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-gray-155">
                          <span className="w-1.5 h-3 bg-[#7C3AED] rounded-full"></span>
                          <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">Informations de la Commande</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 block">Nom du client *</label>
                            <input
                              type="text"
                              required
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="Ex: Fatou Sy"
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 block">Téléphone *</label>
                            <input
                              type="tel"
                              required
                              value={clientPhone}
                              onChange={(e) => setClientPhone(e.target.value)}
                              placeholder="Ex: +221 77 432 10 98"
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 block">Email (Optionnel)</label>
                            <input
                              type="email"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              placeholder="Ex: client@exemple.sn"
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 block">Date de dépôt *</label>
                            <input
                              type="date"
                              required
                              value={depositDate}
                              onChange={(e) => setDepositDate(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-500 block">Date de retrait prévue 📅 *</label>
                            <input
                              type="date"
                              required
                              value={retrievalDate}
                              onChange={(e) => setRetrievalDate(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-500 block">Observations / État du linge</label>
                          <input
                            type="text"
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Ex: col sale, bouton manquant, linge délicat..."
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        {/* Type of Billing (Toggle Buttons) */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 block">Type de Facturation</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setBillingType('article')}
                              className={`flex items-center justify-center gap-2 p-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                billingType === 'article'
                                  ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-md'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              👕 Par Article
                            </button>
                            <button
                              type="button"
                              onClick={() => setBillingType('weight')}
                              className={`flex items-center justify-center gap-2 p-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                billingType === 'weight'
                                  ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-md'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              ⚖️ Par Poids (Kg)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: QUANTITÉ D'ARTICLES À LAVER */}
                      {billingType === 'article' ? (
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                          <div className="flex items-center justify-between pb-1 border-b border-gray-155">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-[#7C3AED] rounded-full"></span>
                              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">Quantité d'articles à laver</h4>
                            </div>
                            <span className="text-[9px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded uppercase font-mono">Tarification unitaire</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(PRESSING_ITEM_PRICES).map(([item, price]) => (
                              <div 
                                key={item} 
                                className="bg-white border border-gray-150 p-3 rounded-xl flex items-center justify-between hover:border-violet-200 transition-colors"
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wide">{item}</span>
                                  <span className="text-[10px] text-gray-400 font-bold">{price} {merchant?.currency || 'FCFA'}/u</span>
                                </div>

                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setLaundryQuantities(prev => ({ ...prev, [item]: Math.max(0, prev[item] - 1) }))}
                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded transition-colors font-black text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center text-xs font-black text-gray-900 bg-transparent select-none">
                                    {laundryQuantities[item] || 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setLaundryQuantities(prev => ({ ...prev, [item]: prev[item] + 1 }))}
                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#7C3AED] hover:bg-gray-100 rounded transition-colors font-black text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                          <div className="flex items-center gap-2 pb-1 border-b border-gray-155">
                            <span className="w-1.5 h-3 bg-[#7C3AED] rounded-full"></span>
                            <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">Lavage au Poids (Kg)</h4>
                          </div>

                          <div className="bg-white border border-gray-155 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-left space-y-1">
                              <span className="font-black text-xs text-gray-800 uppercase tracking-wider block">Saisir le Poids estimé</span>
                              <span className="text-[10px] text-gray-400 font-bold block">Tarif de base: <strong className="text-violet-650">1 200 {merchant?.currency || 'FCFA'} / Kg</strong></span>
                            </div>

                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setWeightKg(prev => Math.max(1, prev - 1))}
                                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-white rounded-lg transition-all font-black animate-none"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                step="0.5"
                                value={weightKg}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setWeightKg(isNaN(val) || val < 1 ? 1 : val);
                                }}
                                className="w-14 bg-transparent border-none text-center text-xs font-black text-gray-900 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setWeightKg(prev => prev + 1)}
                                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-white rounded-lg transition-all font-black animate-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECTION 3: PRESTATIONS OPTIONNELLES */}
                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-gray-155">
                          <span className="w-1.5 h-3 bg-[#7C3AED] rounded-full"></span>
                          <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">Prestations Optionnelles</h4>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {[
                            { key: 'repassage', label: '🧺 Repassage', price: 1000 },
                            { key: 'express', label: '✨ Lavage Express', price: 1500 },
                            { key: 'detachage', label: '🧴 Détachage spécial', price: 1000 },
                            { key: 'livraison', label: '🚚 Livraison à domicile', price: 1500 },
                            { key: 'emballage', label: '🛡️ Emballage Premium', price: 500 },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setOptionalServices(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all ${
                                optionalServices[opt.key]
                                  ? 'bg-violet-50 border-violet-400 text-[#7C3AED] shadow-sm shadow-violet-100 font-bold'
                                  : 'bg-white border-gray-150 text-gray-600 hover:bg-gray-50/60'
                              }`}
                            >
                              <span className="font-extrabold text-[11px] tracking-wide">{opt.label}</span>
                              <span className="text-[9px] font-bold text-gray-400">+{opt.price.toLocaleString()} {merchant?.currency || 'FCFA'}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Total Summary Box (Client Estimation) */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-violet-50 p-5 rounded-2xl border border-violet-150">
                        <div className="text-left space-y-0.5">
                          <span className="text-xs font-bold text-gray-800">Estimation Tarifaire :</span>
                          <div className="text-[10px] text-gray-500 font-bold">
                            Base: {pressingTotalDetails.basePrice.toLocaleString()} {merchant?.currency} • Prestations: {pressingTotalDetails.addonPrice.toLocaleString()} {merchant?.currency}
                          </div>
                        </div>
                        <span className="text-xl font-black text-violet-700 self-end md:self-auto uppercase">
                          {pressingTotalDetails.finalTotal.toLocaleString()} {merchant?.currency || 'FCFA'}
                        </span>
                      </div>

                    </div>
                  ) : (
                    // ORIGINAL FALLBACK STYLE FOR OTHER SECTORS
                    <>
                      {/* Basic Client Contact info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-455 block">Nom complet *</label>
                          <input
                            type="text"
                            required
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Ex: Fatou Sy"
                            className="w-full bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-455 block">Téléphone *</label>
                          <input
                            type="tel"
                            required
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="Ex: +221 77 432 10 98"
                            className="w-full bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-455 block">Adresse Mail (Optionnel)</label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="Ex: client@exemple.sn"
                          className="w-full bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      {/* Dynamic Quantity Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase text-gray-455 block">Quantité de Commande *</label>
                            <span className="text-[9px] font-black text-violet-500 bg-violet-50 px-2 py-0.5 rounded">
                              Max: {orderingProduct.stockQuantity || 0} u
                            </span>
                          </div>
                          <div className="flex items-center bg-gray-50 border border-gray-200/80 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => setOrderQuantity(prev => Math.max(1, prev - 1))}
                              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-white rounded-lg transition-all font-black text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              required
                              min="1"
                              max={orderingProduct.stockQuantity || 1}
                              value={orderQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const maxVal = orderingProduct.stockQuantity || 1;
                                if (isNaN(val) || val < 1) {
                                  setOrderQuantity(1);
                                } else {
                                  setOrderQuantity(Math.min(val, maxVal));
                                }
                              }}
                              className="flex-1 bg-transparent border-none text-center text-xs font-black text-gray-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => setOrderQuantity(prev => Math.min(orderingProduct.stockQuantity || 1, prev + 1))}
                              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-white rounded-lg transition-all font-black text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-455 block">Prix Unitaire</label>
                          <div className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-3.5 text-xs font-black text-gray-900 flex items-center justify-between h-[46px]">
                            <span>{orderingProduct.price.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{merchant?.currency || 'FCFA'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fully Adapted Specific Input Fields depending on SaaS Merchant Subtype! */}
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-violet-500 block">Champs spécifiques : {saasMeta.tagLabel}</span>
                        
                        {saasType === 'medical' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Nom du Patient</label>
                              <input
                                type="text"
                                placeholder="Ex: Awa Ndiaye"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, patientName: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Motif de Consultation</label>
                              <input
                                type="text"
                                placeholder="Ex: Check-up pédiatrique"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, motif: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {saasType === 'scolaire' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Identité Éleve / Étudiant</label>
                              <input
                                type="text"
                                placeholder="Ex: Abdou Ndiaye Jr."
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, student: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Niveau de Scolarité / Classe</label>
                              <input
                                type="text"
                                placeholder="Ex: CM1, 6ème"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, level: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {saasType === 'entreprise' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Description du Problème</label>
                              <input
                                type="text"
                                placeholder="Ex: Faux contact disjoncteur"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Urgence</label>
                              <select 
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, urgent: e.target.value === 'oui' }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              >
                                <option value="non">Normal (Planning sous 48h)</option>
                                <option value="oui">⚠️ Très urgent (Dépannage immédiat)</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {saasType === 'chantier' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Nom du Chantier / Lieu de Dépose</label>
                              <input
                                type="text"
                                placeholder="Ex: Villa Ngor Almadies"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, deliverySite: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Quantité / Volume estimé</label>
                              <input
                                type="text"
                                placeholder="Ex: 50 sacs de Ciment"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, item: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {saasType === 'transport' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Point de Départ</label>
                              <input
                                type="text"
                                placeholder="Ex: Almadies, Dakar"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, from: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Point d'Arrivée</label>
                              <input
                                type="text"
                                placeholder="Ex: Aéroport AIBD"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, to: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {saasType === 'rh' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500 font-bold">Poste souhaité</label>
                              <input
                                type="text"
                                placeholder="Ex: Agent commercial junior"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, candidate: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Années d'expérience</label>
                              <input
                                type="text"
                                placeholder="Ex: 3 ans"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, experience: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {saasType !== 'pressing' && saasType !== 'medical' && saasType !== 'scolaire' && saasType !== 'entreprise' && saasType !== 'chantier' && saasType !== 'transport' && saasType !== 'rh' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Articles ou Précisions</label>
                              <input
                                type="text"
                                placeholder="Ex: Taille XL, Couleur Bleue"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, items: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500 font-normal">Adresse de Livraison précise</label>
                              <input
                                type="text"
                                placeholder="Ex: Plateau, Dakar"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Summary Pricing box */}
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-150">
                        <span className="text-xs text-gray-500 font-bold">Total Facturation Estimée :</span>
                        <span className="text-base font-black text-[#7C3AED]">
                          {orderingProduct.price > 0 ? `${(orderingProduct.price * orderQuantity).toLocaleString()} FCFA` : "Gratuit / Devis personnalisé"}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setOrderingProduct(null)}
                      className="px-5 py-3.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-colors active:scale-95"
                    >
                      Annuler
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="px-6 py-3.5 bg-[#7C3AED] hover:bg-violet-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-violet-200"
                    >
                      {isSubmittingOrder ? "Transmission en cours..." : saasMeta.btnSubmitLabel}
                    </button>
                  </div>

                </form>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛒 FLOATING CART BUTTON */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-[#7C3AED] text-white p-5 rounded-full shadow-2xl flex items-center justify-center gap-3 active:scale-95 hover:bg-violet-700 transition-all border border-violet-500/35 shadow-purple-500/20"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-3.5 -right-3.5 bg-rose-500 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-[#7C3AED]">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider pr-1.5 hidden sm:inline">Mon Panier ({cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString()} FCFA)</span>
        </motion.button>
      )}

      {/* 🛒 INTERACTIVE CART SIDEBAR DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex justify-end p-0"
          >
            {/* Click backdrop to close */}
            <div className="absolute inset-0 z-0" onClick={() => setIsCartOpen(false)} />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white h-full w-full max-w-md shadow-2xl relative z-10 flex flex-col border-l border-gray-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg animate-fade-in">Votre Panier</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AcomZone • Synchronisé</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-150/40 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Votre panier est vide</p>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Explorez les produits et services ci-dessous pour les ajouter à votre panier intelligent.</p>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs bg-violet-50 text-violet-700 px-4 py-2 rounded-xl font-bold hover:bg-violet-100"
                    >
                      Retourner au catalogue
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Selected Products List */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">Articles Sélectionnés ({cart.length})</span>
                      <div className="divide-y divide-gray-100 border border-gray-150/50 rounded-2xl bg-white overflow-hidden shadow-sm">
                        {cart.map((item) => {
                          const available = Number(item.product.stockQuantity !== undefined ? item.product.stockQuantity : 0);
                          const isAlert = available > 0 && available <= (item.product.minStockLevel || 2);
                          
                          return (
                            <div key={item.product.id} className="p-4 flex gap-3 hover:bg-gray-50/30 transition-colors">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                                {item.product.image ? (
                                  <img referrerPolicy="no-referrer" src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-300" />
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">{item.product.name}</h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                  <span>{item.product.price.toLocaleString()} {merchant?.currency || 'FCFA'} / u</span>
                                  <span>•</span>
                                  <span className={`font-medium ${isAlert ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {available} dispo
                                  </span>
                                </div>

                                {/* Stepper & Trash row */}
                                <div className="flex items-center justify-between pt-1">
                                  <div className="flex items-center bg-gray-100 border border-gray-200/50 rounded-lg p-0.5 shadow-inner">
                                    <button
                                      type="button"
                                      onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                                      className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md text-gray-500 hover:text-violet-600 transition-colors"
                                    >
                                      <Minus className="w-2.5 h-2.5" />
                                    </button>
                                    <span className="w-6 text-center text-xs font-black text-gray-100 bg-[#7C3AED] rounded">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                                      className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md text-gray-500 hover:text-violet-600 transition-colors"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                                    title="Retirer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total Summary */}
                    <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 hover:border-[#7C3AED]/35 rounded-[1.3rem] p-4 flex items-center justify-between shadow-sm transition-all">
                      <div>
                        <p className="text-xs font-bold text-gray-500">Estimation Total :</p>
                        <p className="text-[10px] text-gray-400">Toutes taxes comprises • Direct Commerçant</p>
                      </div>
                      <span className="text-lg font-black text-violet-700">
                        {cart.reduce((tot, item) => tot + (item.product.price * item.quantity), 0).toLocaleString()} {merchant?.currency || 'FCFA'}
                      </span>
                    </div>

                    {/* Checkout Form */}
                    <form onSubmit={handlePlaceCartOrder} className="space-y-4 pt-4 border-t border-gray-150">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED] block">Coordonnées de Livraison / Contact</span>

                      <div className="space-y-3.5">
                        <div className="space-y-1 bg-white">
                          <label className="text-[10px] font-black uppercase text-gray-455 block">Nom complet *</label>
                          <input
                            type="text"
                            required
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Ex: Fatou Sy"
                            className="w-full bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500 shadow-inner"
                          />
                        </div>

                        <div className="space-y-1 bg-white">
                          <label className="text-[10px] font-black uppercase text-gray-455 block">Téléphone de contact *</label>
                          <input
                            type="tel"
                            required
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="Ex: +221 77 432 10 98"
                            className="w-full bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500 shadow-inner"
                          />
                        </div>

                        <div className="space-y-1 bg-white">
                          <label className="text-[10px] font-black uppercase text-gray-455 block">Adresse Mail (Optionnel)</label>
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="Ex: client@exemple.sn"
                            className="w-full bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#7C3AED] shadow-inner"
                          />
                        </div>

                        {/* Specific field address */}
                        <div className="space-y-1 bg-white text-left">
                          <label className="text-[10px] font-black uppercase text-gray-455 block">Adresse de Livraison précise</label>
                          <input
                            type="text"
                            placeholder="Ex: HLM Grand Yoff, Villa 432, Dakar"
                            onChange={(e) => setSpecificFields(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-violet-500 shadow-inner font-bold"
                          />
                        </div>

                        {/* Adapting specific fields directly in Cart checkout! */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 text-left">
                          <span className="text-[9px] font-black uppercase tracking-wider text-violet-500 block">Détails d'adaptation sectorielle ({saasMeta.tagLabel})</span>
                          
                          {saasType === 'pressing' && (
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Type de linge déposé</label>
                              <input
                                type="text"
                                placeholder="Costume, linge de maison..."
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, items: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          )}

                          {saasType === 'medical' && (
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Nom du patient de consultation</label>
                              <input
                                type="text"
                                placeholder="Patient"
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, patientName: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          )}

                          {saasType === 'transport' && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-gray-500">Départ</label>
                                <input
                                  type="text"
                                  placeholder="Départ"
                                  onChange={(e) => setSpecificFields(prev => ({ ...prev, from: e.target.value }))}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-gray-500">Arrivée</label>
                                <input
                                  type="text"
                                  placeholder="Arrivée"
                                  onChange={(e) => setSpecificFields(prev => ({ ...prev, to: e.target.value }))}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {saasType !== 'pressing' && saasType !== 'medical' && saasType !== 'transport' && (
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-gray-500">Notes complémentaires pour le gérant</label>
                              <input
                                type="text"
                                placeholder="Taille, couleur, ou préférences..."
                                onChange={(e) => setSpecificFields(prev => ({ ...prev, customNotes: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Checkout Buttons */}
                      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                        <button
                          type="button"
                          onClick={() => setIsCartOpen(false)}
                          className="px-5 py-3.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-colors active:scale-95"
                        >
                          Fermer
                        </button>
                        
                        <button
                          type="submit"
                          disabled={isSubmittingCartOrder}
                          className="px-6 py-3.5 bg-[#7C3AED] hover:bg-violet-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-violet-200 flex-1 flex items-center justify-center gap-1.5"
                        >
                          {isSubmittingCartOrder ? "Synchronisation..." : "Confirmer la commande"}
                        </button>
                      </div>

                    </form>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Utility mapper for adapted client booking view
function getSaasSpecialtyMeta(type: string) {
  switch (type) {
    case 'pressing':
      return {
        icon: Shirt,
        tagLabel: "Pressing & Blanchisserie",
        formTitle: "Dépôt de linge en ligne",
        btnSubmitLabel: "Prendre en charge mon linge",
        bgColor: "bg-teal-50 text-teal-600 border-teal-200",
      };
    case 'medical':
      return {
        icon: Stethoscope,
        tagLabel: "Soin Médical et Clinique",
        formTitle: "Réservation de RDV Docteur",
        btnSubmitLabel: "Demander le RDV",
        bgColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
      };
    case 'scolaire':
      return {
        icon: GraduationCap,
        tagLabel: "Enseignement & École",
        formTitle: "Candidature d'Inscription",
        btnSubmitLabel: "Soumettre ma Candidature",
        bgColor: "bg-blue-50 text-blue-600 border-blue-200",
      };
    case 'entreprise':
      return {
        icon: Wrench,
        tagLabel: "Intervention & Maintenance",
        formTitle: "Demande de Dépannage Urgente",
        btnSubmitLabel: "Signaler la Panne",
        bgColor: "bg-pink-50 text-pink-600 border-pink-200",
      };
    case 'chantier':
      return {
        icon: HardHat,
        tagLabel: "Approvisionnement Securisé",
        formTitle: "Commande de Matériaux Gros-Œuvre",
        btnSubmitLabel: "Commander sur mon Chantier",
        bgColor: "bg-amber-50 text-amber-600 border-amber-200",
      };
    case 'transport':
      return {
        icon: Car,
        tagLabel: "Flotte Libre / Transport",
        formTitle: "Réservation d'une Course Express",
        btnSubmitLabel: "Confirmer mon itinéraire",
        bgColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
      };
    case 'rh':
      return {
        icon: Users,
        tagLabel: "Cabinet Recrutement / RH",
        formTitle: "Transmission de Candidature Spontanée",
        btnSubmitLabel: "Déposer mon Dossier",
        bgColor: "bg-purple-50 text-purple-600 border-purple-200",
      };
    default:
      return {
        icon: ShoppingBag,
        tagLabel: "Boutique & Distribution",
        formTitle: "Panier de Validation Boutique",
        btnSubmitLabel: "Finaliser la commande",
        bgColor: "bg-orange-50 text-orange-600 border-orange-200",
      };
  }
}
