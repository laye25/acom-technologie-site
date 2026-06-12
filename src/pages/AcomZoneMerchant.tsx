import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MapPin, Phone, Mail, Globe, Clock, Star, Package, Check, Share2, 
  Info, ArrowRight, Search, Scan, ArrowUpDown, SlidersHorizontal, Sparkles, X, 
  HelpCircle, CheckCircle2, ChevronDown, ListFilter, RefreshCw, Smartphone, 
  Shirt, Stethoscope, GraduationCap, Wrench, HardHat, Car, Users, ShoppingBag,
  Tag, Scissors, Palette
} from 'lucide-react';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { Merchant, MerchantProduct, Order } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

export default function AcomZoneMerchant() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  
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

  // Client booking form fields state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [specificFields, setSpecificFields] = useState<Record<string, any>>({});
  
  // Fallbacks using local Dexie data
  const localMerchants = useLiveQuery(() => db.merchants.toArray()) || [];
  const localProducts = useLiveQuery(() => merchantId ? db.products.where('merchantId').equals(merchantId).toArray() : []) || [];
  
  const { data: merchants, loading: loadingMerchants } = useFirestoreData<Merchant>({
    tableName: 'merchants',
    realtime: true
  });

  const { data: products, loading: loadingProducts } = useFirestoreData<MerchantProduct>({
    tableName: 'merchant_products',
    realtime: true,
    where: merchantId ? [['merchantId', '==', merchantId]] : undefined
  });

  useEffect(() => {
    const sourceMerchants = merchants.length > 0 ? merchants : localMerchants;
    if (sourceMerchants && sourceMerchants.length > 0) {
      const found = sourceMerchants.find(m => m.id === merchantId);
      if (found) {
        setMerchant(found);
      }
    }
  }, [merchants, localMerchants, merchantId]);

  const sourceProducts = products.length > 0 ? products : localProducts;
  const saasType = merchant?.type || 'boutique';

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

    setIsSubmittingOrder(true);
    try {
      const bookingData: any = {
        userId: "acom_client_" + Math.random().toString(36).substr(2, 9),
        merchantId: merchant.id,
        partnerId: merchant.id, // For dual role compatibility
        status: 'pending',
        serviceId: orderingProduct.id,
        serviceName: orderingProduct.name,
        totalPrice: orderingProduct.price,
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
          ...specificFields
        }
      };

      await dbService.orders.save(bookingData);
      toast.success("Votre demande a été transmise avec succès au commerçant !");
      setOrderingProduct(null);
      // Reset forms
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setSpecificFields({});
    } catch (e) {
      console.error(e);
      toast.error("Erreur technique lors de l'enregistrement de votre commande.");
    } finally {
      setIsSubmittingOrder(false);
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
  const isLoading = (loadingMerchants || loadingProducts) && merchants.length === 0 && localMerchants.length === 0;

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
        
        {/* Navigation back with customized label */}
        <Link to="/acomzone" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all mb-6 text-xs font-black uppercase tracking-widest backdrop-blur-md bg-black/45 px-5 py-3 rounded-full shadow-lg hover:bg-black/60 active:scale-95">
          <ArrowLeft className="w-4 h-4 text-violet-400" />
          Retour au Plan de Ville
        </Link>

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
                placeholder="Rechercher un produit ou scanner le code-barres (SKU)..."
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 font-medium focus:ring-0 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* SCANNER button triggers active scan simulation */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-6 py-4 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all text-violet-700 font-bold text-xs uppercase tracking-widest rounded-3xl border border-indigo-100 shadow-sm flex items-center justify-center gap-3 md:w-48"
            >
              <Scan className="w-5 h-5 animate-pulse" />
              <span>SCANNER</span>
            </button>

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
            <div className="pt-5 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
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
                    {isOutOfStock ? (
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
                      
                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
                        <div className="text-base font-black text-gray-900">
                          {product.price.toLocaleString()} <span className="text-[10px] text-gray-400 font-medium">{merchant?.currency || 'FCFA'}</span>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setOrderingProduct(product);
                            // Set initial adapted specific values
                            setSpecificFields({
                              saasSector: saasType,
                              productName: product.name,
                              price: product.price
                            });
                          }}
                          className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm group-hover:scale-105 active:scale-95"
                          title="Faire une réservation"
                        >
                          <ArrowRight className="w-5 h-5 pointer-events-none" />
                        </button>
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
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-xl w-full shadow-2xl relative my-8"
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

                  {/* Fully Adapted Specific Input Fields depending on SaaS Merchant Subtype! */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-violet-500 block">Champs spécifiques : {saasMeta.tagLabel}</span>
                    
                    {saasType === 'pressing' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-gray-500">Type de Vêtements (Ex: Costume, Rideaux)</label>
                          <input
                            type="text"
                            placeholder="Ex: 1 Costume 3 pièces, 2 jupes"
                            onChange={(e) => setSpecificFields(prev => ({ ...prev, items: e.target.value }))}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-gray-500">Mode de Lavage</label>
                          <select 
                            onChange={(e) => setSpecificFields(prev => ({ ...prev, mode: e.target.value }))}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none"
                          >
                            <option value="Nettoyage à sec">Nettoyage à sec délicat</option>
                            <option value="Lavage & Repassage">Lavage standard & Repassage</option>
                            <option value="Détachage seul">Détachage cible</option>
                          </select>
                        </div>
                      </div>
                    )}

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
                    <span className="text-base font-black text-violet-700">
                      {orderingProduct.price > 0 ? `${orderingProduct.price.toLocaleString()} FCFA` : "Gratuit / Devis personnalisé"}
                    </span>
                  </div>

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
