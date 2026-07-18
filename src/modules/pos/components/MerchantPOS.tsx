import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Tag, CreditCard, Banknote, Smartphone, CheckCircle, Clock, Save, FileText, MapPin, Phone, Mail, Loader2, ArrowRight, Printer, HardDrive, Database, Upload, RefreshCw, ScanLine, AlertCircle, Palette, Scissors, ArrowUpDown, Package, Download, User } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';

import { useAuth } from '../../../context/AuthContext';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';
import { printDirectHTML, generateReceiptPDF, generateA4InvoicePDF } from '../../billing/utils/pdfGenerator';

import { Merchant, MerchantProduct, MerchantSale } from '../../../types';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { OptimizedImage } from '../../../components/OptimizedImage';
import ScannerModal from '../../../components/ScannerModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';


const PaymentMethodBtn = ({ active, onClick, label }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-xs rounded-full border ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

const MerchantPOS = ({ merchant, setShowUpgradeModal }: { merchant: Merchant, setShowUpgradeModal?: (s: boolean) => void }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<{ productId: string, name: string, quantity: number, price: number, costPrice: number, sizes?: string, colors?: string }[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'split'>('cash');
  const [isPartial, setIsPartial] = useState(false);
  const [initialPaidAmount, setInitialPaidAmount] = useState<number | string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState<{ show: boolean, saleData: any, whatsappUrl?: string } | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const cartErrorTimeoutRef = useRef<any>(null);
  const [sendToWhatsApp, setSendToWhatsApp] = useState(() => merchant.managerNotifications?.notifyOnPOSSale !== false);
  const [sendToWhatsAppClient, setSendToWhatsAppClient] = useState(false);
  const [managerPhone, setManagerPhone] = useState(() => merchant.managerNotifications?.whatsappPhone || merchant.phone || '');
  const [sendToEmail, setSendToEmail] = useState(() => merchant.managerNotifications?.notifyOnPOSSale !== false);
  const [managerEmail, setManagerEmail] = useState(() => merchant.managerNotifications?.email || merchant.email || '');

  // Keep POS manager notification states in sync with unified settings
  useEffect(() => {
    setSendToWhatsApp(merchant.managerNotifications?.notifyOnPOSSale !== false);
    setSendToEmail(merchant.managerNotifications?.notifyOnPOSSale !== false);
    setManagerPhone(merchant.managerNotifications?.whatsappPhone || merchant.phone || '');
    setManagerEmail(merchant.managerNotifications?.email || merchant.email || '');
  }, [merchant.managerNotifications, merchant.phone, merchant.email]);

  const [modalManagerPhone, setModalManagerPhone] = useState('');
  const [modalCustomerPhone, setModalCustomerPhone] = useState('');

  // Sync modal inputs on modal open
  useEffect(() => {
    if (showReceiptModal?.show && showReceiptModal?.saleData) {
      setModalManagerPhone(managerPhone || '');
      setModalCustomerPhone(showReceiptModal.saleData.customerPhone || '');
    }
  }, [showReceiptModal, managerPhone]);

  // Handle auto-checking WhatsApp client when client phone has content
  useEffect(() => {
    if (customerPhone.trim().length >= 8) {
      setSendToWhatsAppClient(true);
    } else {
      setSendToWhatsAppClient(false);
    }
  }, [customerPhone]);

  const getSaleWhatsappUrl = (sale: any, phone: string) => {
    if (!sale || !phone) return '';
    let cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
      cleanPhone = '221' + cleanPhone;
    }
    const cleanNumber = cleanPhone.replace(/[^0-9]/g, '');
    if (!cleanNumber) return '';

    const itemsText = (sale.items || []).map((item: any) => {
      let itemStr = `• *${item.name}* : ${item.quantity} x ${item.price.toLocaleString()} ${merchant.currency}`;
      const details = [];
      if (item.sizes) details.push(`T: ${item.sizes}`);
      if (item.colors) details.push(`C: ${item.colors}`);
      if (details.length > 0) itemStr += ` (${details.join(', ')})`;
      return itemStr;
    }).join('\n');

    const methodLabels: Record<string, string> = {
      cash: 'Espèces 💵',
      card: 'Carte Bancaire 💳',
      mobile_money: 'Mobile Money 📱',
      split: 'Paiement partiel (Acompte) 💸'
    };
    const methodLabel = methodLabels[sale.paymentMethod || 'cash'] || 'Espèces 💵';
    const isPartial = sale.paymentMethod === 'split' || (sale.balance && sale.balance > 0);
    const isPartialLabel = isPartial ? `\n*Montant reçu :* ${sale.paidAmount?.toLocaleString()} ${merchant.currency}\n*Reste dû :* ${sale.balance?.toLocaleString()} ${merchant.currency}` : '';

    const receiptText = `🧾 *NOUVELLE VENTE - CAISSE POS* 🧾\n` +
      `----------------------------------------\n` +
      `🌐 *Boutique :* ${merchant.name}\n` +
      `👤 *Opérateur :* ${user?.displayName || user?.email || 'N/A'}\n` +
      `📅 *Date :* ${new Date(sale.createdAt || new Date()).toLocaleString('fr-FR')}\n` +
      `----------------------------------------\n` +
      `📦 *DÉTAILS DES ARTICLES :*\n${itemsText}\n` +
      `----------------------------------------\n` +
      `💰 *TOTAL :* *${sale.totalAmount?.toLocaleString()} ${merchant.currency}*\n` +
      `💳 *Mode de Règlement :* ${methodLabel}${isPartialLabel}\n` +
      `----------------------------------------\n` +
      `👥 *CLIENT :*\n` +
      `• *Nom :* ${sale.customerName || 'Client de passage'}\n` +
      `• *Téléphone :* ${sale.customerPhone || 'Non renseigné'}\n` +
      `----------------------------------------\n` +
      `_Envoyé instantanément depuis l'application de Caisse_`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(receiptText)}`;
  };

  const [emailSendStatus, setEmailSendStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'simulated'>('idle');
  const [emailSendError, setEmailSendError] = useState<string | null>(null);

  const triggerCartError = (message: string) => {
    setCartError(message);
    if (cartErrorTimeoutRef.current) {
      clearTimeout(cartErrorTimeoutRef.current);
    }
    cartErrorTimeoutRef.current = setTimeout(() => {
      setCartError(null);
    }, 5000);
  };

  // Ensure we define availableColors BEFORE we use products in useMemo for availableColors etc...
  // Wait, products is defined above these states, which is fine.

  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // --- Handlers ---
  const handleBarcodeScanned = useCallback((code: string) => {
    if (!code) return;
    const searchCode = code.trim().toLowerCase();
    const searchAlphanumeric = searchCode.replace(/[^a-z0-9]/g, '');
    const searchNoZ = searchAlphanumeric.replace(/^0+/, '');

    // Advanced, highly intelligent finder supporting EAN leading zeros, hyphens, and spaces
    const match = products.find(p => {
      if (!p.sku) return false;
      const pSku = p.sku.trim().toLowerCase();
      const pAlphanumeric = pSku.replace(/[^a-z0-9]/g, '');
      const pNoZ = pAlphanumeric.replace(/^0+/, '');

      return (
        pSku === searchCode ||             // Exact match
        pAlphanumeric === searchAlphanumeric || // Strip hyphens/spaces and compare (e.g. "978-020" vs "978020")
        (pNoZ !== '' && pNoZ === searchNoZ) ||  // Strip leading zeros & compare (e.g. "000789" vs "789")
        (pAlphanumeric.length > 4 && searchAlphanumeric.length > 4 && 
         (pAlphanumeric.includes(searchAlphanumeric) || searchAlphanumeric.includes(pAlphanumeric))) // Substring tolerance
      );
    });

    if (match) {
      if (Number(match.stockQuantity || 0) <= 0) {
        triggerCartError("ARTICLE EN RUPTURE : " + match.name);
      } else {
        addToCart(match);
        triggerAcomAlert('Succès', `Ajouté : ${match.name}`, 'success', 'SYSTÈME');
      }
    } else {
      triggerAcomAlert('Erreur', `Code non reconnu : ${code}`, 'error', 'ALERTE');
    }
  }, [products]);

  // Physical Barcode Scanner Effect
  const scannedCodeRef = useRef('');
  useEffect(() => {
    let timeoutId: any;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in generic input fields unless it's our POS search explicitly
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.target.id !== 'pos-search') return;
      }
      
      if (e.key === 'Enter') {
        const code = scannedCodeRef.current;
        if (code.length > 2) {
          handleBarcodeScanned(code);
          setSearchTerm(''); // clear search input if they were positioned there
        }
        scannedCodeRef.current = '';
      } else if (e.key.length === 1) { 
        scannedCodeRef.current += e.key;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          scannedCodeRef.current = '';
        }, 150); // Increased debounce to 150ms to support slightly slower hardware/simulators
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [handleBarcodeScanned]);

  // Smart filters states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('instock');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock_desc' | 'newest'>('name');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');

  const availableSizes = useMemo(() => {
    if (selectedCategory === 'all') return []; // Hide sizes to prevent confusing mix of laptop and shoe sizes
    const list = new Set<string>();
    const categoryFiltered = products.filter(p => {
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
  }, [products, selectedCategory, selectedSubCategory]);

  const availableColors = useMemo(() => {
    if (selectedCategory === 'all') return []; // Hide colors to prevent confusing mixture if no category is isolated
    const list = new Set<string>();
    const categoryFiltered = products.filter(p => {
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
  }, [products, selectedCategory, selectedSubCategory]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const subCategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const subs = new Set<string>();
    products.forEach(p => {
      if (p.category === selectedCategory && p.subCategory) {
        subs.add(p.subCategory);
      }
    });
    return Array.from(subs).sort((a, b) => a.localeCompare(b));
  }, [products, selectedCategory]);

  // Reset subcategory, sizes and colors when category changes
  useEffect(() => {
    setSelectedSubCategory('all');
    setSelectedSize('all');
    setSelectedColor('all');
  }, [selectedCategory]);

  // Reset sizes and colors when subcategory changes
  useEffect(() => {
    setSelectedSize('all');
    setSelectedColor('all');
  }, [selectedSubCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter (name, SKU, category, description, sizes or colors match)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.sizes && p.sizes.toLowerCase().includes(term)) ||
        (p.colors && p.colors.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
      // Subcategory filter
      if (selectedSubCategory !== 'all') {
        result = result.filter(p => p.subCategory === selectedSubCategory);
      }
    }

    // Stock Filter
    if (stockFilter === 'instock') {
      result = result.filter(p => Number(p.stockQuantity || 0) > 0);
    } else if (stockFilter === 'lowstock') {
      result = result.filter(p => {
        const stock = Number(p.stockQuantity || 0);
        const minLevel = Number(p.minStockLevel || 5);
        return stock > 0 && stock <= minLevel;
      });
    } else if (stockFilter === 'outofstock') {
      result = result.filter(p => Number(p.stockQuantity || 0) <= 0);
    }

    // Size Filter
    if (selectedSize !== 'all') {
      result = result.filter(p => p.sizes && p.sizes.split(',').map(s => s.trim().toUpperCase()).includes(selectedSize));
    }

    // Color Filter
    if (selectedColor !== 'all') {
      result = result.filter(p => p.colors && p.colors.split(',').map(c => c.trim().toUpperCase()).includes(selectedColor.toUpperCase()));
    }

    // Sort order
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => {
        const dateA = a.id; // fallback comparison
        const dateB = b.id;
        return dateB.localeCompare(dateA);
      });
    }

    return result;
  }, [products, searchTerm, selectedCategory, selectedSubCategory, stockFilter, sortBy, selectedSize, selectedColor]);

  const addToCart = (product: MerchantProduct) => {
    if (Number(product.stockQuantity || 0) <= 0) {
      triggerCartError("ARTICLE EN RUPTURE, LA VENTE EST ANNULÉE.");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= (product.stockQuantity || 0)) {
          triggerAcomAlert('Erreur', 'Stock insuffisant', 'error', 'ALERTE');
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: product.price, 
        costPrice: product.costPrice || 0,
        sizes: product.sizes || '',
        colors: product.colors || ''
      }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.productId !== productId));

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    setIsSubmitting(true);
    
    // Check limit for TESTE plan
    if (merchant.plan === 'FREE') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const salesTodayCount = await db.sales
        .where('merchantId')
        .equals(merchant.id)
        .filter(sale => new Date(sale.createdAt || sale.created_at || new Date()) >= startOfDay)
        .count();

      if (salesTodayCount >= 2) {
        triggerAcomAlert('Erreur', 'Vous avez atteint la limite de 2 ventes par jour pour le plan TESTE. Veuillez passer au forfait supérieur.', 'error', 'ALERTE');
        if (setShowUpgradeModal) setShowUpgradeModal(true);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const actualPaid = isPartial ? (Number(initialPaidAmount) || 0) : total;
      
      const saleData: Partial<MerchantSale> = {
        merchantId: merchant.id,
        items: cart.map(item => ({ ...item, total: item.price * item.quantity })),
        totalAmount: total,
        paidAmount: actualPaid,
        balance: total - actualPaid,
        payments: actualPaid > 0 ? [{
          id: uuidv4(),
          amount: actualPaid,
          method: paymentMethod as any,
          date: new Date()
        }] : [],
        paymentMethod: isPartial ? 'split' : paymentMethod as any,
        customerName,
        customerPhone,
        processedBy: user.uid,
        createdAt: new Date()
      };
      
      // Save the sale (service handles stock update)
      const saleId = await dbService.merchantSales.save(saleData);

      // 1. Prepare WhatsApp URL if tracking is enabled
      let whatsappUrl: string | undefined = undefined;
      let methodLabel = isPartial ? 'Paiement partiel (Acompte) 💸' : 'Espèces 💵';
      if (!isPartial) {
        const paymentMethodLabels: Record<string, string> = {
          cash: 'Espèces 💵',
          card: 'Carte Bancaire 💳',
          mobile_money: 'Mobile Money 📱'
        };
        methodLabel = paymentMethodLabels[paymentMethod] || paymentMethod;
      }

      if (sendToWhatsApp && managerPhone) {
        let cleanManagerPhone = managerPhone.replace(/[^0-9+]/g, '');
        if (cleanManagerPhone.startsWith('7') && cleanManagerPhone.length === 9) {
          cleanManagerPhone = '221' + cleanManagerPhone; // Default to Senegal code
        }
        const cleanNumber = cleanManagerPhone.replace(/[^0-9]/g, '');
        if (cleanNumber) {
          const isPartialLabel = isPartial ? `\n*Montant reçu :* ${actualPaid.toLocaleString()} ${merchant.currency}\n*Reste dû :* ${(total - actualPaid).toLocaleString()} ${merchant.currency}` : '';

          const itemsText = cart.map(item => {
            let itemStr = `• *${item.name}* : ${item.quantity} x ${item.price.toLocaleString()} ${merchant.currency}`;
            if (item.sizes || item.colors) {
              const details = [];
              if (item.sizes) details.push(`T: ${item.sizes}`);
              if (item.colors) details.push(`C: ${item.colors}`);
              itemStr += ` (${details.join(', ')})`;
            }
            return itemStr;
          }).join('\n');

          const receiptText = `🧾 *NOUVELLE VENTE - CAISSE POS* 🧾\n` +
            `----------------------------------------\n` +
            `🌐 *Boutique :* ${merchant.name}\n` +
            `👤 *Opérateur :* ${user.displayName || user.email || 'N/A'}\n` +
            `📅 *Date :* ${new Date().toLocaleString('fr-FR')}\n` +
            `----------------------------------------\n` +
            `📦 *DÉTAILS DES ARTICLES :*\n${itemsText}\n` +
            `----------------------------------------\n` +
            `💰 *TOTAL :* *${total.toLocaleString()} ${merchant.currency}*\n` +
            `💳 *Mode de Règlement :* ${isPartial ? 'Acompte' : methodLabel}${isPartialLabel}\n` +
            `----------------------------------------\n` +
            `👥 *CLIENT :*\n` +
            `• *Nom :* ${customerName || 'Client de passage'}\n` +
            `• *Téléphone :* ${customerPhone || 'Non renseigné'}\n` +
            `----------------------------------------\n` +
            `_Envoyé instantanément depuis l'application de Caisse_`;

          whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(receiptText)}`;
        }
      }

      // 2. Prepare and send background Email tracking if enabled
      if (sendToEmail && managerEmail) {
        try {
          const isPartialLabelEmail = isPartial ? `
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="color: #64748b; padding-top: 8px;">Montant Reçu :</td>
            <td style="color: #16a34a; font-weight: 800; text-align: right; padding-top: 8px;">${actualPaid.toLocaleString()} ${merchant.currency}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 8px;">Reste Dû :</td>
            <td style="color: #dc2626; font-weight: 800; text-align: right; padding-bottom: 8px;">${(total - actualPaid).toLocaleString()} ${merchant.currency}</td>
          </tr>` : '';

          const emailHtml = `
            <div style="background-color: #f8f9fa; padding: 40px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eee;">
                <div style="background-color: #4f46e5; padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">NOUVELLE VENTE POS</h2>
                  <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Boutique : ${merchant.name}</p>
                </div>
                
                <div style="padding: 30px; color: #1e293b;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 36px; font-weight: 900; color: #4f46e5;">${total.toLocaleString()} ${merchant.currency}</div>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Règlement : ${isPartial ? 'Acompte' : methodLabel}</p>
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                        <th style="padding: 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b;">Article</th>
                        <th width="80" style="padding: 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b; text-align: center;">Qté</th>
                        <th width="120" style="padding: 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b; text-align: right;">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${cart.map(item => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1e293b;">
                            ${item.name}
                            ${item.sizes || item.colors ? `<div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">${[item.sizes ? `Taille: ${item.sizes}` : '', item.colors ? `Couleur: ${item.colors}` : ''].filter(Boolean).join(' | ')}</div>` : ''}
                          </td>
                          <td style="padding: 12px 0; font-size: 14px; color: #475569; text-align: center;">${item.quantity}</td>
                          <td style="padding: 12px 0; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600;">${(item.price * item.quantity).toLocaleString()} ${merchant.currency}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  
                  <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; font-size: 14px; margin-bottom: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Date de transaction &nbsp;:</td>
                        <td style="color: #1e293b; font-weight: 600; text-align: right; padding-bottom: 8px;">${new Date().toLocaleString('fr-FR')}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Opérateur :</td>
                        <td style="color: #1e293b; font-weight: 600; text-align: right; padding-bottom: 8px;">${user?.displayName || user?.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Client :</td>
                        <td style="color: #1e293b; font-weight: 600; text-align: right; padding-bottom: 8px;">${customerName || 'Client de passage'}</td>
                      </tr>
                      ${customerPhone ? `
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Téléphone :</td>
                        <td style="color: #1e293b; font-weight: 600; text-align: right; padding-bottom: 8px;">${customerPhone}</td>
                      </tr>
                      ` : ''}
                      ${isPartialLabelEmail}
                    </table>
                  </div>
                </div>
                
                <div style="background-color: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
                  <p style="margin: 0; color: white; font-weight: bold; font-size: 13px;">${merchant.name}</p>
                  <p style="margin: 4px 0 0 0;">Notification de Suivi de Caisse en Temps Réel</p>
                </div>
              </div>
            </div>
          `;

          setEmailSendStatus('sending');
          setEmailSendError(null);
          sendEmailDirectlyOrViaBackend({
            to: managerEmail,
            from: merchant.managerNotifications?.emailFrom || undefined,
            subject: `[PRO POS - ${merchant.name}] Vente Réussie : ${total.toLocaleString()} ${merchant.currency}`,
            html: emailHtml
          }, { 
            resendApiKey: merchant.managerNotifications?.resendApiKey, 
            defaultFrom: merchant.managerNotifications?.emailFrom 
          })
          .then(async (res) => {
            let data: any = {};
            try {
              const text = await res.text();
              data = text ? JSON.parse(text) : {};
            } catch (e) {
              console.error("Failed to parse response as JSON:", e);
              data = { error: `Format de réponse invalide (Erreur serveur)` };
            }
            if (res.ok) {
              if (data.message && data.message.includes("missing")) {
                setEmailSendStatus('simulated');
              } else if (data.success) {
                setEmailSendStatus('success');
                triggerAcomAlert('Notification Gérant', "Ce mail envoyé en arrière-plan avec succès !", 'success', "ENVOI D'E-MAIL");
              } else {
                setEmailSendStatus('error');
                setEmailSendError(data.error || "Erreur de transmission");
              }
            } else {
              setEmailSendStatus('error');
              setEmailSendError(data.error || `Erreur serveur (${res.status})`);
            }
          })
          .catch(err => {
            console.error("Error sending automatic email tracking:", err);
            setEmailSendStatus('error');
            setEmailSendError(err.message || "Erreur réseau");
          });
        } catch (emailErr) {
          console.error("Error sending background email:", emailErr);
          setEmailSendStatus('error');
          setEmailSendError(String(emailErr));
        }
      }

      // 3. Set Receipt modal data and whatsappUrl
      setShowReceiptModal({ show: true, saleData: { ...saleData, id: saleId }, whatsappUrl: whatsappUrl });

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      triggerAcomAlert('Succès', 'Vente enregistrée !', 'success', 'SYSTÈME');
    } catch (error) {
      console.error('Checkout error:', error);
      triggerAcomAlert('Erreur', 'Erreur lors de la vente', 'error', 'ALERTE');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCartContent = (isMobile = false) => {
    return (
      <>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-ink flex items-center">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-3">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            {isMobile ? `Panier Mobile (${cart.reduce((sum, item) => sum + item.quantity, 0)})` : "Panier"}
          </h3>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
            merchant.licenseType === 'local' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            {merchant.licenseType === 'local' ? <HardDrive className="w-2.5 h-2.5" /> : <Database className="w-2.5 h-2.5" />}
            {merchant.licenseType === 'local' ? 'Mode Local' : 'Sync Cloud'}
          </div>
        </div>

        <AnimatePresence>
          {cartError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-rose-50 border border-rose-100/80 rounded-2xl flex items-start gap-3 shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-[11px] font-black text-rose-900 uppercase tracking-wide leading-snug">
                  {cartError}
                </p>
                <p className="text-[8px] text-rose-500 font-black uppercase tracking-widest mt-1">
                  Sélection annulée par précaution
                </p>
              </div>
              <button
                onClick={() => setCartError(null)}
                className="absolute top-2 right-2 p-1 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-100 transition-all cursor-pointer animate-fadeIn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`space-y-4 mb-8 pr-2 custom-scrollbar ${isMobile ? 'max-h-[220px]' : 'max-h-[350px]'} overflow-y-auto`}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">Panier vide</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                      {item.quantity} x {item.price.toLocaleString()} {merchant.currency}
                    </p>
                    {item.sizes && (
                      <span className="text-[9px] font-mono font-semibold bg-blue-50 text-blue-600 px-1 py-0.5 rounded">T: {item.sizes}</span>
                    )}
                    {item.colors && (
                      <span className="text-[9px] font-mono font-semibold bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded">C: {item.colors}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-black text-ink">{(item.price * item.quantity).toLocaleString()}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6 border-t border-gray-100 pt-8">
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="text" placeholder="Nom du client (optionnel)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="tel" placeholder="Téléphone client" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <PaymentMethodBtn active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} label="ESPÈCES" />
            <PaymentMethodBtn active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} label="CARTE" />
            <PaymentMethodBtn active={paymentMethod === 'mobile_money'} onClick={() => setPaymentMethod('mobile_money')} label="MOBILE" />
          </div>

          <div className="pt-4 border-t border-black/5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setIsPartial(!isPartial)}
                className={`w-10 h-6 rounded-full transition-all relative ${isPartial ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPartial ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Paiement partiel (Acompte)</span>
            </label>

            {isPartial && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Montant de l'acompte</label>
                <input 
                  type="number" 
                  value={initialPaidAmount}
                  onChange={e => setInitialPaidAmount(e.target.value)}
                  placeholder="Entrez le montant reçu..."
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm font-black outline-none focus:border-primary/30"
                />
                {initialPaidAmount && Number(initialPaidAmount) < total && (
                  <p className="text-[9px] font-bold text-amber-500 italic">Reste à payer: {(total - Number(initialPaidAmount)).toLocaleString()} {merchant.currency}</p>
                )}
              </motion.div>
            )}
          </div>

          <div className="pt-4 border-t border-black/5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* WhatsApp follow-up */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={sendToWhatsApp}
                    onChange={e => setSendToWhatsApp(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary/20 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 inline-block mr-1"></span>
                    Suivi WhatsApp Manager
                  </span>
                </label>

                {sendToWhatsApp && (
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input 
                      type="tel" 
                      placeholder="Téléphone du Manager (ex: +22177...)" 
                      value={managerPhone} 
                      onChange={e => setManagerPhone(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-emerald-100/80 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-emerald-500/10 font-mono font-bold text-gray-700"
                    />
                  </div>
                )}
              </div>

              {/* WhatsApp Client follow-up */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={sendToWhatsAppClient}
                    onChange={e => setSendToWhatsAppClient(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary/20 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shrink-0 inline-block mr-1"></span>
                    WhatsApp Client
                  </span>
                </label>

                {sendToWhatsAppClient && (
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                    <input 
                      type="tel" 
                      placeholder="Téléphone du Client" 
                      value={customerPhone} 
                      onChange={e => setCustomerPhone(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-teal-100/80 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-teal-500/10 font-mono font-bold text-gray-700"
                    />
                  </div>
                )}
              </div>

              {/* Email follow-up */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={sendToEmail}
                    onChange={e => setSendToEmail(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary/20 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0 inline-block mr-1"></span>
                    Suivi Email Manager
                  </span>
                </label>

                {sendToEmail && (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                    <input 
                      type="email" 
                      placeholder="Email du Manager" 
                      value={managerEmail} 
                      onChange={e => setManagerEmail(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-indigo-100/80 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-indigo-500/10 font-mono font-bold text-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
            <span className="text-gray-400 text-[10px] font-mono font-black uppercase tracking-widest">Total à payer</span>
            <div className="text-right">
              <span className="text-3xl font-black text-ink">{total.toLocaleString()}</span>
              <span className="text-xs font-mono font-bold text-gray-400 ml-1 uppercase">{merchant.currency}</span>
            </div>
          </div>

          <button 
            onClick={async () => {
              await handleCheckout();
              if (isMobile) {
                setIsMobileCartOpen(false);
              }
            }} 
            disabled={cart.length === 0 || isSubmitting} 
            className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-hover transition-all disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Valider la vente'}
          </button>
        </div>
      </>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col lg:flex-row gap-8"
    >
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              id="pos-search"
              placeholder="Rechercher un produit ou scanner le code-barres (SKU)..."
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                
                // Fine-tuned auto-detector for barcode scanning or manual entry matching exact SKU
                const trimmed = val.trim();
                if (trimmed.length >= 3) {
                  const searchCode = trimmed.toLowerCase();
                  const searchAlphanumeric = searchCode.replace(/[^a-z0-9]/g, '');
                  const searchNoZ = searchAlphanumeric.replace(/^0+/, '');

                  const match = products.find(p => {
                    if (!p.sku) return false;
                    const pSku = p.sku.trim().toLowerCase();
                    const pAlphanumeric = pSku.replace(/[^a-z0-9]/g, '');
                    const pNoZ = pAlphanumeric.replace(/^0+/, '');

                    return (
                      pSku === searchCode ||
                      pAlphanumeric === searchAlphanumeric ||
                      (pNoZ !== '' && pNoZ === searchNoZ)
                    );
                  });

                  if (match) {
                    if (Number(match.stockQuantity || 0) <= 0) {
                      triggerCartError("ARTICLE EN RUPTURE : " + match.name);
                      setSearchTerm('');
                    } else {
                      addToCart(match);
                      triggerAcomAlert('Succès', `Ajouté : ${match.name}`, 'success', 'SYSTÈME');
                      setSearchTerm('');
                    }
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim().length > 2) {
                  // Prioritize searchTerm if user manually typed or scanned directly into the focus
                  handleBarcodeScanned(searchTerm.trim());
                  setSearchTerm('');
                }
              }}
              autoFocus
              className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-primary/10 shadow-sm outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="h-auto px-5 bg-indigo-50 text-indigo-600 rounded-[1.5rem] border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center shadow-sm whitespace-nowrap"
            title="Scanner un code-barres avec la caméra"
          >
            <ScanLine className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline font-bold uppercase tracking-wider text-xs">Scanner</span>
          </button>
        </div>

        {/* Filtres Intelligents */}
        <div className="space-y-4 bg-gray-50/50 p-4 rounded-3xl border border-black/5">
          {/* Ligne 1: Catégories (Filtre rapide) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Catégories de l'établissement
              </span>
              {selectedCategory !== 'all' && (
                <button 
                  onClick={() => setSelectedCategory('all')} 
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            
            <div className="flex gap-2 w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200 shadow-sm'
                }`}
              >
                <span>Tous</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {products.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === cat
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ligne 1.5: Sous-catégories (Filtre rapide) */}
          {selectedCategory !== 'all' && subCategories.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-black/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Sous-catégories associées
                </span>
              </div>
              
              <div className="flex gap-2 w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setSelectedSubCategory('all')}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    selectedSubCategory === 'all'
                      ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                      : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                  }`}
                >
                  <span>Toutes</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    selectedSubCategory === 'all' ? 'bg-primary/20 text-primary' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {products.filter(p => p.category === selectedCategory).length}
                  </span>
                </button>

                {subCategories.map((subCat) => {
                  const count = products.filter(p => p.category === selectedCategory && p.subCategory === subCat).length;
                  return (
                    <button
                      key={subCat}
                      onClick={() => setSelectedSubCategory(subCat)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                        selectedSubCategory === subCat
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                      }`}
                    >
                      <span>{subCat}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        selectedSubCategory === subCat ? 'bg-primary/20 text-primary' : 'bg-gray-50 text-gray-400'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-black/5">
              {availableSizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-gray-400" />
                      Filtrer par Taille
                    </span>
                    {selectedSize !== 'all' && (
                      <button 
                        onClick={() => setSelectedSize('all')} 
                        className="text-[9px] font-bold text-primary hover:underline-offset-4 hover:underline"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                      onClick={() => setSelectedSize('all')}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                        selectedSize === 'all'
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                      }`}
                    >
                      Toutes
                    </button>
                    {availableSizes.map(size => {
                      const count = products.filter(p => p.sizes && p.sizes.split(',').map(s => s.trim().toUpperCase()).includes(size)).length;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                            selectedSize === size
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200'
                          }`}
                        >
                          <span>{size}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            selectedSize === size ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-gray-400" />
                      Filtrer par Couleur
                    </span>
                    {selectedColor !== 'all' && (
                      <button 
                        onClick={() => setSelectedColor('all')} 
                        className="text-[9px] font-bold text-primary hover:underline-offset-4 hover:underline"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                      onClick={() => setSelectedColor('all')}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                        selectedColor === 'all'
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                      }`}
                    >
                      Toutes
                    </button>
                    {availableColors.map(color => {
                      const count = products.filter(p => p.colors && p.colors.split(',').map(c => c.trim().toUpperCase()).includes(color.toUpperCase())).length;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                            selectedColor === color
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200'
                          }`}
                        >
                          <span>{color}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            selectedColor === color ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
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

          {/* Ligne 2: Disponibilité & Tri */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-t border-black/5 pt-3">
            {/* Disponibilité Segmented Control */}
            <div className="flex items-center gap-2 w-full overflow-x-auto pb-2 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
              <span className="text-[10px] shrink-0 font-black text-gray-400 uppercase tracking-widest mr-1">Filtrer Stock :</span>
              <div className="bg-white border border-black/5 rounded-2xl p-1 flex gap-1 shadow-sm shrink-0">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    stockFilter === 'all'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Tout
                </button>
                <button
                  onClick={() => setStockFilter('instock')}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    stockFilter === 'instock'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  En Stock
                </button>
                <button
                  onClick={() => setStockFilter('lowstock')}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    stockFilter === 'lowstock'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>Alerte Stock</span>
                  {products.filter(p => {
                    const st = Number(p.stockQuantity || 0);
                    const ml = Number(p.minStockLevel || 5);
                    return st > 0 && st <= ml;
                  }).length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${stockFilter === 'lowstock' ? 'bg-white' : 'bg-amber-500 animate-pulse'}`} />
                  )}
                </button>
                <button
                  onClick={() => setStockFilter('outofstock')}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    stockFilter === 'outofstock'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>Rupture</span>
                  {products.filter(p => Number(p.stockQuantity || 0) <= 0).length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${stockFilter === 'outofstock' ? 'bg-white' : 'bg-rose-500 animate-pulse'}`} />
                  )}
                </button>
              </div>
            </div>

            {/* Tri Selector & Stats Info */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Tri Selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Trier par :</span>
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white border border-black/5 rounded-2xl pl-3 pr-8 py-1.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm cursor-pointer w-full"
                  >
                    <option value="name">Nom (A-Z)</option>
                    <option value="price_asc">Prix : Croissant</option>
                    <option value="price_desc">Prix : Décroissant</option>
                    <option value="stock_desc">Niveau de Stock</option>
                    <option value="name">Défaut</option>
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Résumé badge */}
              <div className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1.5 rounded-2xl border border-primary/10 tracking-wider whitespace-nowrap">
                {filteredProducts.length} PRODUITS
              </div>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-black/5 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold text-sm">Aucun produit ne correspond à vos filtres</p>
            <p className="text-gray-400 text-xs mt-1">Essayez de réinitialiser les critères ou de modifier votre recherche.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setStockFilter('all');
                setSortBy('name');
                setSelectedSize('all');
                setSelectedColor('all');
              }} 
              className="mt-4 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all text-left group relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-3 flex items-center justify-center overflow-hidden border border-black/5 group-hover:scale-105 transition-transform">
                    {product.image ? (
                      <OptimizedImage src={product.image} alt={product.name} width={300} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-200" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{product.name}</h4>
                  {product.sku && (
                    <p className="text-[9px] font-mono font-bold text-gray-400 mt-0.5 uppercase">SKU: {product.sku}</p>
                  )}
                  {product.category && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold uppercase">{product.category}</span>
                      {product.sizes && (
                        <span className="text-[9px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold">T: {product.sizes}</span>
                      )}
                      {product.colors && (
                        <span className="text-[9px] font-mono bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold">C: {product.colors}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <p className="text-sm text-primary font-black">{product.price.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span></p>
                  <div className={`px-2 py-0.5 rounded-lg border ${
                    (product.stockQuantity || 0) <= (product.minStockLevel || 5)
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}>
                    <p className="text-[9px] font-mono font-bold">STOCK: {product.stockQuantity || 0}</p>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block w-full lg:w-[400px]">
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl sticky top-32">
          {renderCartContent(false)}
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button
            key="mobile-cart-button"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            onClick={() => setIsMobileCartOpen(true)}
            className="lg:hidden fixed bottom-6 left-6 max-md:bottom-4 max-md:left-4 z-[9998] bg-gray-900 text-white p-4 rounded-full shadow-2xl flex items-center justify-center border border-white/10"
            whileTap={{ scale: 0.9 }}
          >
            <ShoppingCart className="w-6 h-6" />
            
            {/* Pulsing notification badge */}
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 text-white text-[10px] font-bold items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Drawer (Paiement) */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileCartOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Drawer container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Drawer Handle (visual cue) */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />

              {/* Close Button at top right of header */}
              <div className="absolute top-3 right-5 z-[10001]">
                <button 
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content inside drawer */}
              <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
                {renderCartContent(true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={(code) => {
          setShowBarcodeScanner(false);
          handleBarcodeScanned(code);
        }}
        title="Scanner pour la caisse"
      />

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal?.show && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`bg-white w-full rounded-2xl shadow-2xl p-6 md:p-8 transition-all ${
                showReceiptModal.whatsappUrl ? 'max-w-2xl' : 'max-w-sm text-center'
              }`}
            >
              {showReceiptModal.whatsappUrl ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Left Column: Vente Réussie & Printers */}
                  <div className="space-y-4 md:space-y-6 flex flex-col justify-between">
                    <div>
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-1 text-center md:text-left">Vente Réussie !</h3>
                      <p className="text-gray-500 text-xs md:text-sm mb-4 text-center md:text-left">La transaction a été enregistrée.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Section Ticket */}
                      <div>
                        <div className="text-[9px] font-mono font-black uppercase text-amber-500 tracking-[0.2em] mb-1.5">Format Ticket POS</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => {
                              printDirectHTML(merchant, 'receipt', showReceiptModal.saleData);
                            }}
                            className="py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer</span>
                          </button>
                          <button 
                            onClick={() => {
                              generateReceiptPDF(merchant, showReceiptModal.saleData, 'download');
                            }}
                            className="py-2.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger</span>
                          </button>
                        </div>
                      </div>

                      {/* Section Facture A4 */}
                      <div>
                        <div className="text-[9px] font-mono font-black uppercase text-emerald-500 tracking-[0.2em] mb-1.5">Format Facture A4</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => {
                              printDirectHTML(merchant, 'invoice', showReceiptModal.saleData);
                            }}
                            className="py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer</span>
                          </button>
                          <button 
                            onClick={() => {
                              generateA4InvoicePDF(merchant, showReceiptModal.saleData, 'download');
                            }}
                            className="py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => setShowReceiptModal(null)}
                        className="w-full py-3 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-black/5 text-center"
                      >
                        Nouveau Client
                      </button>
                    </div>
                  </div>

                  {/* Right Column: WhatsApp & Live Tracking Panel */}
                  <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                          <Smartphone className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="text-base font-black text-gray-900 mb-1">Détails de Suivi</h4>
                        <p className="text-gray-400 text-[11px] leading-relaxed mb-4">Envoyez les détails de la vente ou vérifiez l'email automatique.</p>
                      </div>

                      <div className="space-y-3">
                        {/* WhatsApp Gérant Section */}
                        <div>
                          <label className="block text-[8px] font-mono font-black uppercase text-emerald-600 tracking-[0.1em] mb-1">Destinataire WhatsApp (Gérant)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={modalManagerPhone}
                              onChange={e => setModalManagerPhone(e.target.value)}
                              placeholder="Numéro du Gérant"
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono font-bold text-gray-600 outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button 
                              onClick={() => {
                                const url = getSaleWhatsappUrl(showReceiptModal.saleData, modalManagerPhone);
                                if (url) {
                                  window.open(url, '_blank');
                                } else {
                                  triggerAcomAlert('Erreur', 'Numéro de gérant invalide ou manquant.', 'error', 'ALERTE');
                                }
                              }}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Envoyer</span>
                            </button>
                          </div>
                        </div>

                        {/* WhatsApp Client Section */}
                        <div className="pt-2 border-t border-dashed border-gray-100">
                          <label className="block text-[8px] font-mono font-black uppercase text-teal-600 tracking-[0.1em] mb-1">WhatsApp Client</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={modalCustomerPhone}
                              onChange={e => setModalCustomerPhone(e.target.value)}
                              placeholder="Numéro du Client"
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono font-bold text-gray-600 outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <button 
                              onClick={() => {
                                const url = getSaleWhatsappUrl(showReceiptModal.saleData, modalCustomerPhone);
                                if (url) {
                                  window.open(url, '_blank');
                                } else {
                                  triggerAcomAlert('Erreur', 'Numéro de client invalide ou manquant.', 'error', 'ALERTE');
                                }
                              }}
                              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Envoyer</span>
                            </button>
                          </div>
                        </div>

                        {/* Email section details */}
                        {sendToEmail && managerEmail && (
                          <div className="pt-2 border-t border-dashed border-gray-100">
                            <label className="block text-[8px] font-mono font-black uppercase text-indigo-500 tracking-[0.1em] mb-1">Rapport de Vente Email</label>
                            <input 
                              type="text" 
                              readOnly
                              value={managerEmail}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono font-bold text-gray-600 outline-none"
                            />
                            {emailSendStatus === 'sending' && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-blue-600 font-semibold bg-blue-50/50 p-2 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Envoi de l'email de suivi en arrière-plan...
                              </div>
                            )}
                            {emailSendStatus === 'success' && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-emerald-600 font-semibold bg-emerald-50/50 p-2 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Ce mail envoyé en arrière-plan avec succès !
                              </div>
                            )}
                            {emailSendStatus === 'simulated' && (
                              <div className="mt-1.5 flex flex-col gap-1 text-[9px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  Simulation d'envoi (Aucun e-mail émis)
                                </div>
                                <span className="text-[8px] text-amber-600 font-normal leading-relaxed">
                                  Raison : <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">RESEND_API_KEY</code> manquante dans l'environnement.
                                </span>
                              </div>
                            )}
                            {emailSendStatus === 'error' && (
                              <div className="mt-1.5 flex flex-col gap-1 text-[9px] text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                  Échec de l'envoi de l'email
                                </div>
                                <span className="text-[8px] text-red-600 font-mono font-bold leading-normal truncate">
                                  {emailSendError || "Erreur de configuration ou domaine non vérifié"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mt-4">
                      <div className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Aperçu du texte :</div>
                      <div className="text-[9px] text-gray-500 font-mono leading-relaxed line-clamp-3 select-all">
                        🧾 *NOUVELLE VENTE - CAISSE POS* 🧾<br/>
                        🌐 *Boutique :* {merchant.name}<br/>
                        💰 *TOTAL :* {showReceiptModal.saleData?.totalAmount?.toLocaleString()} {merchant.currency}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback centered template without WhatsApp tracking */
                <>
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Vente Réussie !</h3>
                  <p className="text-gray-500 mb-8">La transaction a été enregistrée avec succès.</p>
                  
                  <div className="space-y-4 text-left">
                    <div>
                      <div className="text-[9px] font-mono font-black uppercase text-amber-500 tracking-[0.2em] mb-2">Format Ticket POS</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            printDirectHTML(merchant, 'receipt', showReceiptModal.saleData);
                          }}
                          className="py-3 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer</span>
                        </button>
                        <button 
                          onClick={() => {
                            generateReceiptPDF(merchant, showReceiptModal.saleData, 'download');
                          }}
                          className="py-3 bg-amber-50 text-amber-600 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono font-black uppercase text-emerald-500 tracking-[0.2em] mb-2">Format Facture A4</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            printDirectHTML(merchant, 'invoice', showReceiptModal.saleData);
                          }}
                          className="py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer</span>
                        </button>
                        <button 
                          onClick={() => {
                            generateA4InvoicePDF(merchant, showReceiptModal.saleData, 'download');
                          }}
                          className="py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => setShowReceiptModal(null)}
                        className="w-full py-3 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-black/5 text-center"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default MerchantPOS;
