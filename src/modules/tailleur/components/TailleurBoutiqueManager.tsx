import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../db/db'; // Dexie
import { Merchant } from '../../../types';
import { motion } from 'motion/react';
import { 
  ShoppingCart, Download, Plus, ShoppingBag, BarChart3, Search, Eye, Sparkles, 
  Edit2, Trash2, Printer, TrendingUp, X, Upload
} from 'lucide-react';
import { 
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';

export const TailleurBoutiqueManager = ({ merchant }: { merchant: Merchant }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'sales' | 'stats'>('stock');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string, title?: string, size?: string, category?: string, notes?: string, price?: number } | null>(null);

  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [cart, setCart] = useState<{article: any, qty: number}[]>([]);
  const [saleClientName, setSaleClientName] = useState('');
  const [saleClientPhone, setSaleClientPhone] = useState('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'cash' | 'wave' | 'orange_money' | 'card'>('cash');
  const [selectedBoutiqueSale, setSelectedBoutiqueSale] = useState<any | null>(null);
  const [saleMailFeedback, setSaleMailFeedback] = useState<Record<string, boolean>>({});

  const managerEmail = merchant.managerNotifications?.email || '';
  const autoEmailManager = merchant.managerNotifications?.notifyOnPOSSale !== false;

  // Load datasets
  useEffect(() => {
    try {
      const savedArticles = localStorage.getItem(`tailleur_boutique_${merchant.id}`);
      if (savedArticles) {
        setArticles(JSON.parse(savedArticles));
      } else {
        // Seed initial African tailor presets
        const defaultArticles = [
          {
            id: 'art-1',
            name: "Robe Wax Moderne 'Soleil'",
            category: 'robe',
            size: 'M',
            price: 35000,
            cost: 15000,
            quantity: 3,
            fabric: 'Wax Hollandais',
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60',
            notes: 'Coupe évasée avec col Claudine, fermeture éclair invisible dans le dos.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'art-2',
            name: 'Boubou Royal en Bazin',
            category: 'boubou',
            size: 'XL',
            price: 75000,
            cost: 35000,
            quantity: 2,
            fabric: 'Bazin Allemand',
            image: '',
            notes: 'Broderie blanche faite main sur col et poches, bazin de qualité supérieure.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'art-3',
            name: 'Kaftan Slim-Fit Homme Bleu',
            category: 'kaftan',
            size: 'L',
            price: 45000,
            cost: 20000,
            quantity: 4,
            fabric: 'Coton glacé',
            image: '',
            notes: 'Broderie fine bleu ciel et fil d\'argent. Manches longues.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'art-4',
            name: 'Ensemble Wax & Crêpe Chic',
            category: 'ensemble',
            size: 'S',
            price: 50000,
            cost: 22000,
            quantity: 1,
            fabric: 'Wax Wax & Crêpe',
            image: '',
            notes: 'Comprend un pantalon carotte en wax et un haut en crêpe assorti.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setArticles(defaultArticles);
        localStorage.setItem(`tailleur_boutique_${merchant.id}`, JSON.stringify(defaultArticles));
      }

      const savedSales = localStorage.getItem(`tailleur_boutique_sales_${merchant.id}`);
      if (savedSales) setSales(JSON.parse(savedSales));

      const savedClients = localStorage.getItem(`tailleur_clients_${merchant.id}`);
      if (savedClients) setClients(JSON.parse(savedClients));
    } catch (e) {
      console.error(e);
    }
  }, [merchant.id]);

  // Persist articles
  const saveArticles = (updatedArticles: any[]) => {
    setArticles(updatedArticles);
    localStorage.setItem(`tailleur_boutique_${merchant.id}`, JSON.stringify(updatedArticles));
  };

  // Persist sales
  const saveSales = (updatedSales: any[]) => {
    setSales(updatedSales);
    localStorage.setItem(`tailleur_boutique_sales_${merchant.id}`, JSON.stringify(updatedSales));
  };

  // Handle article submit (add/edit)
  const handleArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArticle.name) {
      toast.error('Veuillez saisir un nom pour l\'article');
      return;
    }

    let updated;
    if (currentArticle.id) {
      updated = articles.map(art => art.id === currentArticle.id ? { ...currentArticle, updatedAt: new Date().toISOString() } : art);
      toast.success('Article de prêt-à-porter mis à jour');
    } else {
      const newArt = {
        ...currentArticle,
        id: 'art-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updated = [newArt, ...articles];
      toast.success('Nouvel article ajouté au stock de la boutique');
    }
    saveArticles(updated);
    setIsFormOpen(false);
    setCurrentArticle(null);
  };

  // Handle sales registration
  const handleRegisterSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Check stocks
    for (const item of cart) {
      if (item.qty <= 0) {
        toast.error(`La quantité pour ${item.article.name} doit être > 0`);
        return;
      }
      if (item.qty > item.article.quantity) {
        toast.error(`Stock insuffisant pour ${item.article.name}. Seulement ${item.article.quantity} dispo.`);
        return;
      }
    }

    // Decrement stock
    let updatedArticles = [...articles];
    for (const item of cart) {
      updatedArticles = updatedArticles.map(art => {
        if (art.id === item.article.id) {
          return {
            ...art,
            quantity: Math.max(0, art.quantity - item.qty),
            updatedAt: new Date().toISOString()
          };
        }
        return art;
      });
    }

    const saleNumber = 'BT-SL-' + Date.now().toString().slice(-6);

    // Calculate totals
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.article.price * item.qty), 0);
    const totalCost = cart.reduce((acc, item) => acc + ((item.article.cost || 0) * item.qty), 0);
    const profit = totalPrice - totalCost;

    // Record sale transaction
    const newSale = {
      id: 'sale-' + Date.now(),
      saleNumber,
      articleId: cart.length === 1 ? cart[0].article.id : 'multi',
      articleName: cart.length === 1 ? cart[0].article.name : `${cart.length} articles`,
      category: cart.length === 1 ? cart[0].article.category : 'multi',
      unitPrice: cart.length === 1 ? cart[0].article.price : 0,
      costPrice: cart.length === 1 ? (cart[0].article.cost || 0) : 0,
      
      quantity: totalQty,
      totalPrice: totalPrice,
      totalCost: totalCost,
      profit: profit,
      clientName: saleClientName || 'Client de Passage',
      clientPhone: saleClientPhone || '',
      paymentMethod: salePaymentMethod,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        id: item.article.id,
        productId: item.article.id,
        name: item.article.name,
        category: item.article.category,
        quantity: item.qty,
        price: item.article.price,
        total: item.qty * item.article.price
      }))
    };

    const updatedSales = [newSale, ...sales];

    saveArticles(updatedArticles);
    saveSales(updatedSales);

    // Register Sale in dexie central system DB for Accounting / Compta
    try {
      db.sales.add({
        id: newSale.id,
        merchantId: merchant.id,
        items: newSale.items,
        totalAmount: totalPrice,
        paidAmount: totalPrice,
        balance: 0,
        payments: [{
          id: `p_${Date.now()}`,
          amount: totalPrice,
          method: salePaymentMethod as any,
          date: new Date().toISOString()
        }],
        paymentMethod: salePaymentMethod as any,
        customerName: newSale.clientName,
        customerPhone: newSale.clientPhone,
        processedBy: 'system',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Dexie integration failed:', err);
    }

    setCart([]);
    setSelectedBoutiqueSale(newSale);
    toast.success('Vente enregistrée avec succès ! 🎉');

    // Auto-email summary to the manager in the background
    if (autoEmailManager && managerEmail && managerEmail.trim()) {
      sendSilentBackgroundBoutiqueSaleEmailToManager(newSale);
    }
  };

  const sendSilentBackgroundBoutiqueSaleEmailToManager = async (sale: any) => {
    if (!managerEmail || !managerEmail.trim()) return;

    const itemsDesc = `<li style="margin: 4px 0;"><strong>${sale.quantity}x</strong> ${sale.articleName} — <strong>${sale.totalPrice} FCFA</strong></li>`;

    const title = `🛒 Notification de Vente (Boutique Prêt-à-porter)`;
    const themeColor = '#5c2197'; // Purple for Ready-to-wear

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="background-color: ${themeColor}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">${merchant.name || 'Atelier de Couture'}</h2>
          <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">Suivi d'Activité en Temps Réel — Gérant</p>
        </div>

        <div style="margin-top: 20px;">
          <h3 style="color: ${themeColor}; border-bottom: 2px solid ${themeColor}; padding-bottom: 5px; margin-bottom: 15px;">${title}</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 150px;"><strong>N° Vente :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${sale.saleNumber || sale.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Client / Acheteur :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${sale.clientName} (${sale.clientPhone || 'Client de Passage'})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;" valign="top"><strong>Article Acheté :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <ul style="margin: 0; padding-left: 20px;">${itemsDesc}</ul>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Sous-Total :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${sale.totalPrice} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Total suppléments :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">0 FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Montant Total Encaissé :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981; font-size: 15px;">${sale.totalPrice} FCFA (PAYÉ EN CAISSE ✅)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Date / Heure :</strong></td>
              <td style="padding: 8px 0;">${new Date(sale.date).toLocaleString('fr-FR')}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
          Ce rapport automatique en direct a été envoyé en arrière-plan sans action requise de l'opérateur.<br/>
          <strong>Système de Suivi de Ventes SaaS ${merchant.name || 'ACOM'}</strong>.
        </div>
      </div>
    `;

    try {
      const response = await sendEmailDirectlyOrViaBackend({
        to: managerEmail,
        from: merchant.managerNotifications?.emailFrom || undefined,
        subject: `🛒 [VENTE BOUTIQUE] Vente n°${sale.saleNumber || sale.id} - ${merchant.name || 'Atelier'}`,
        html: mailHtml
      }, {
        resendApiKey: merchant.managerNotifications?.resendApiKey,
        defaultFrom: merchant.managerNotifications?.emailFrom
      });

      if (response.ok) {
        setSaleMailFeedback(prev => ({ ...prev, [sale.id]: true }));
        return true;
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Failed to send background email to manager for boutique sale:', errorData || response.statusText);
        return false;
      }
    } catch (err) {
      console.error('Error dispatching silent manager background boutique sale mail:', err);
      return false;
    }
  };

  const dispatchBoutiqueManagerSaleNotif = async (s: any, method: 'whatsapp' | 'email') => {
    if (method === 'email') {
      const success = await sendSilentBackgroundBoutiqueSaleEmailToManager(s);
      if (success) {
        toast.success("E-mail envoyé avec succès au gérant !");
      } else {
        toast.error("Échec de l'envoi de l'e-mail.");
      }
    } else if (method === 'whatsapp') {
      const managerPhone = merchant.managerNotifications?.whatsappPhone || '';
      if (!managerPhone.trim()) {
        toast.error("Veuillez configurer le numéro de téléphone WhatsApp du Gérant dans les paramètres.");
        return;
      }

      const text = 
        `*${merchant.name || 'ACOM'} - RAPPORT DE VENTE BOUTIQUE* 👔\n` +
        `----------------------------------------\n` +
        `*Ticket N°* : ${s.saleNumber || s.id}\n` +
        `*Client* : ${s.clientName}\n` +
        `*Date* : ${format(new Date(s.date), 'dd/MM/yyyy HH:mm')}\n\n` +
        `*ARTICLE VENDU* :\n` +
        `- ${s.articleName} x${s.quantity} : ${s.totalPrice.toLocaleString()} FCFA\n\n` +
        `*Total encaissé* : ${s.totalPrice.toLocaleString()} FCFA (PAYÉ ✅)\n\n` +
        `_Notification automatique de suivi d'activité._`;

      let cleaned = managerPhone.replace(/[^0-9]/g, '');
      if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '221' + cleaned;
      }
      const waUrl = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  // Soft delete article
  const handleDeleteArticle = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article de la boutique ?')) {
      const updated = articles.filter(art => art.id !== id);
      saveArticles(updated);
      toast.success('Article retiré de la collection');
    }
  };

  // Restock action
  const handleRestock = (article: any) => {
    const qtyStr = prompt(`Entrez la quantité à ajouter pour "${article.name}" :`, '5');
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantité invalide');
      return;
    }

    const updated = articles.map(art => {
      if (art.id === article.id) {
        return {
          ...art,
          quantity: art.quantity + qty,
          updatedAt: new Date().toISOString()
        };
      }
      return art;
    });
    saveArticles(updated);
    toast.success(`Le stock de "${article.name}" a été augmenté de +${qty}`);
  };

  // Export Stock CSV
  const exportStockCSV = () => {
    try {
      if (articles.length === 0) {
        toast.error("Aucun article en stock à exporter");
        return;
      }

      let csvContent = "\uFEFF";
      csvContent += "Article,Catégorie,Taille,Matière,Stock Disponible,Prix Vente,Coût Revient,Bénéfice Unitaire,Date d'Ajout\n";

      articles.forEach(art => {
        const benefit = art.price - (art.cost || 0);
        const row = [
          art.name || '',
          art.category || '',
          art.size || '',
          art.fabric || '',
          art.quantity || 0,
          art.price || 0,
          art.cost || 0,
          benefit,
          art.createdAt || ''
        ].map(val => `"${String(val).replace(/\n/g, ' ')}"`).join(",");
        csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Inventaire_Boutique_Pret_A_Porter_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Inventaire de la boutique exporté en CSV");
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'exportation CSV");
    }
  };

  // Advanced Boutique direct print
  const printBoutiqueReceipt = (sale: any, formatType: '80mm' | '58mm' | 'A4' = '80mm') => {
    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
    if (isMobile) {
      toast.success("Impression Boutique mobile : Préparation du document PDF...", { position: 'top-center' });
      handleDownloadBoutiqueSalePDF(sale, formatType === 'A4' ? '80mm' : formatType as any);
      return;
    }

    const fmt = (num: number) => {
      if (num === undefined || num === null || isNaN(num)) return '0';
      return Math.round(num).toLocaleString();
    };

    const formattedSaleDate = new Date(sale.date).toLocaleDateString('fr-FR') + ' ' + new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});

    let htmlContent = "";

    if (formatType === '80mm' || formatType === '58mm') {
      const rollWidth = formatType === '58mm' ? '58mm' : '80mm';
      const contentWidth = formatType === '58mm' ? '43mm' : '68mm';
      const paddingPrint = formatType === '58mm' ? '1mm 3.5mm 1mm 1mm' : '3mm';
      const paddingScreen = formatType === '58mm' ? '4mm' : '6mm';
      const fontSize = formatType === '58mm' ? '9.5px' : '11px';
      const logoWidth = formatType === '58mm' ? '24mm' : '32mm';

      htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Ticket Vente - ${sale.saleNumber || sale.id}</title>
    <style>
      * { box-sizing: border-box; }
      @media print {
        @page {
          size: ${rollWidth} auto;
          margin: 0;
        }
        body {
          margin: 0;
          padding: ${paddingPrint};
          width: ${contentWidth};
        }
      }
      body {
        font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
        font-size: ${fontSize};
        line-height: 1.4;
        color: #000;
        background-color: #fff;
        margin: 0 auto;
        padding: ${paddingScreen};
        width: ${contentWidth};
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-bold { font-weight: bold; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .logo-container { text-align: center; margin-bottom: 3mm; }
      .logo { max-width: ${logoWidth}; max-height: 16mm; object-fit: contain; }
      .divider { border-top: 1px dashed #000; margin: 3mm 0; }
      .merchant-name { font-size: 13px; font-weight: bold; margin-bottom: 1mm; text-transform: uppercase; }
      .doc-title { font-size: 11px; font-weight: bold; margin: 2mm 0; letter-spacing: 1px; text-transform: uppercase; }
      .item-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
      .item-table th { border-bottom: 1px solid #000; font-weight: bold; text-align: left; padding-bottom: 1mm; }
      .item-table td { padding: 1.5mm 0; vertical-align: top; }
      .total-section { margin-top: 3mm; font-size: 11px; }
      .footer { margin-top: 6mm; font-size: 9px; text-align: center; line-height: 1.5; }
    </style>
  </head>
  <body>
    ${merchant.logo ? `<div class="logo-container"><img class="logo" src="${merchant.logo}" alt="Logo" /></div>` : ''}
    <div class="text-center">
      <div class="merchant-name">${(merchant.name || 'ACOM').replace(/"/g, '&quot;')}</div>
      <div>${(merchant.address || 'Touba Mbacké').replace(/"/g, '&quot;')}</div>
      ${merchant.phone ? `<div>Tél: ${merchant.phone}</div>` : ''}
    </div>
    
    <div class="divider"></div>
    
    <div class="flex justify-between">
      <span>Ticket N°: ${sale.saleNumber || sale.id}</span>
    </div>
    <div style="margin-top: 1mm;">Client : <span class="text-bold">${(sale.clientName || sale.customerName || 'Client de Passage').replace(/"/g, '&quot;')}</span></div>
    ${(sale.clientPhone || sale.customerPhone) ? `<div>Tél    : ${sale.clientPhone || sale.customerPhone}</div>` : ''}
    <div>Date : ${formattedSaleDate}</div>
    
    <div class="divider"></div>
    
    <div class="text-center text-bold doc-title">VENTE DIRECTE BOUTIQUE</div>
    
    <table class="item-table">
      <thead>
        <tr>
          <th style="width: 50%;">Article</th>
          <th class="text-center" style="width: 15%;">Qté</th>
          <th class="text-right" style="width: 35%;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-transform: capitalize;">${sale.articleName || sale.items?.[0]?.productName}</td>
          <td class="text-center">${sale.quantity}</td>
          <td class="text-right">${fmt(sale.totalPrice || sale.total)}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="divider"></div>
    
    <div class="total-section">
      <div class="flex justify-between">
        <span>Sous-total prestations:</span>
        <span>${fmt(sale.totalPrice || sale.total)} FCFA</span>
      </div>
      <div class="flex justify-between">
        <span>Total suppléments:</span>
        <span>0 FCFA</span>
      </div>
      <div class="flex justify-between text-bold" style="font-size: 13px; margin-top: 1.5mm; margin-bottom: 2mm;">
        <span>Net à Payer:</span>
        <span>${fmt(sale.totalPrice || sale.total)} FCFA</span>
      </div>
      <div class="flex justify-between text-bold">
        <span>Règlement:</span>
        <span>PAYÉ EN CAISSE ✅</span>
      </div>
      <div class="flex justify-between">
        <span>Montant Versé:</span>
        <span>${fmt(sale.totalPrice || sale.total)} FCFA</span>
      </div>
      <div class="flex justify-between">
        <span>Reste dû:</span>
        <span>0 FCFA</span>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer">
      Merci de votre confiance !<br>
      Les articles de prêt-à-porter de l'atelier<br>
      sont échangeables sous 48h sur présentation<br>
      de ce ticket, en parfait état.
    </div>
    
    <script>
      window.onload = function() {
        window.print();
        setTimeout(() => { window.close(); }, 500);
      };
    </script>
  </body>
  </html>
  `;
    } else {
      // Format A4
      htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Facture Boutique A4 - ${sale.saleNumber || sale.id}</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333; font-size: 14px; }
      .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .logo { max-width: 150px; }
      .title { font-size: 24px; font-weight: bold; color: #5c2197; text-align: right; }
      .meta-box { width: 100%; margin-bottom: 30px; }
      .meta-box td { vertical-align: top; width: 50%; }
      .item-table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
      .item-table th { background-color: #f3f4f6; padding: 12px; font-weight: bold; text-align: left; border-bottom: 2px solid #e5e7eb; }
      .item-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
      .total-table { float: right; width: 300px; margin-top: 20px; }
      .total-table td { padding: 8px 12px; }
      .total-row { font-size: 16px; font-weight: bold; color: #5c2197; border-top: 2px solid #5c2197; }
      .footer { margin-top: 80px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td>
          ${merchant.logo ? `<img class="logo" src="${merchant.logo}" alt="Logo" />` : `<h2>${merchant.name || 'ACOM'}</h2>`}
          <p>${merchant.address || 'Touba Mbacké'}<br>Tél: ${merchant.phone || ''}</p>
        </td>
        <td class="title">
          FACTURE DE VENTE DIRECTE<br>
          <span style="font-size: 14px; color: #6b7280; font-weight: normal;">N°: ${sale.saleNumber || sale.id}</span>
        </td>
      </tr>
    </table>
  
    <table class="meta-box">
      <tr>
        <td>
          <strong>Facturé à :</strong><br>
          ${sale.clientName || sale.customerName || 'Client de Passage'}<br>
          Tél : ${sale.clientPhone || sale.customerPhone || 'N/A'}
        </td>
        <td style="text-align: right;">
          <strong>Date d'émission :</strong> ${formattedSaleDate}<br>
          <strong>Mode de paiement :</strong> ${sale.paymentMethod || 'cash'}<br>
          <strong>Statut :</strong> <span style="color: #10b981; font-weight: bold;">PAYÉ ✅</span>
        </td>
      </tr>
    </table>
  
    <table class="item-table">
      <thead>
        <tr>
          <th>Description de l'article</th>
          <th style="text-align: center;">Catégorie</th>
          <th style="text-align: center;">Quantité</th>
          <th style="text-align: right;">Prix unitaire</th>
          <th style="text-align: right;">Montant Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${sale.articleName || sale.items?.[0]?.productName}</td>
          <td style="text-align: center; text-transform: uppercase;">${sale.category || ''}</td>
          <td style="text-align: center;">${sale.quantity}</td>
          <td style="text-align: right;">${fmt(sale.unitPrice || sale.items?.[0]?.price)} FCFA</td>
          <td style="text-align: right;">${fmt(sale.totalPrice || sale.total)} FCFA</td>
        </tr>
      </tbody>
    </table>
  
    <table class="total-table">
      <tr>
        <td>Sous-total :</td>
        <td style="text-align: right;">${fmt(sale.totalPrice || sale.total)} FCFA</td>
      </tr>
      <tr>
        <td>Total suppléments :</td>
        <td style="text-align: right;">0 FCFA</td>
      </tr>
      <tr class="total-row">
        <td>Net à Payer :</td>
        <td style="text-align: right;">${fmt(sale.totalPrice || sale.total)} FCFA</td>
      </tr>
      <tr>
        <td style="color: #10b981; font-weight: bold;">Montant Versé :</td>
        <td style="text-align: right; color: #10b981; font-weight: bold;">${fmt(sale.totalPrice || sale.total)} FCFA</td>
      </tr>
      <tr>
        <td style="color: #ef4444; font-weight: bold;">Reste dû :</td>
        <td style="text-align: right; color: #ef4444; font-weight: bold;">0 FCFA</td>
      </tr>
    </table>
  
    <div style="clear: both;"></div>
  
    <div class="footer">
      Merci de votre confiance !<br>
      Cette facture sert de justificatif de paiement.<br>
      ACOM - Logiciel de gestion professionnelle.
    </div>
  
    <script>
      window.onload = function() {
        window.print();
        setTimeout(() => { window.close(); }, 500);
      };
    </script>
  </body>
  </html>
  `;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Veuillez autoriser les fenêtres surgissantes pour l'impression");
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadBoutiqueSalePDF = (sale: any, formatType: '80mm' | '58mm' = '80mm') => {
    const widthMm = formatType === '58mm' ? 58 : 80;
    const heightMm = formatType === '58mm' ? 145 : 140;
    const pdf = new jsPDF('p', 'mm', [widthMm, heightMm]);
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(formatType === '58mm' ? 8.5 : 10);
    
    let y = 10;
    const centerX = formatType === '58mm' ? 29 : 40;
    const lineStartX = formatType === '58mm' ? 3 : 5;
    const lineEndX = formatType === '58mm' ? 55 : 75;
    
    pdf.setFont('courier', 'bold');
    pdf.text(merchant.name || 'ACOM', centerX, y, { align: 'center' });
    y += 5;
    pdf.setFontSize(formatType === '58mm' ? 7 : 8);
    pdf.setFont('courier', 'normal');
    pdf.text(merchant.address || 'Touba Mbacké', centerX, y, { align: 'center' });
    y += 7;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 6;
    
    pdf.setFont('courier', 'bold');
    pdf.text(`N° d'enregistrement : ${sale.saleNumber || sale.id}`, lineStartX, y);
    y += 5;
    pdf.setFont('courier', 'normal');
    pdf.text(`Client  : ${sale.clientName || sale.customerName || 'Client de Passage'}`, lineStartX, y);
    y += 4;
    pdf.text(`Contact : ${sale.clientPhone || sale.customerPhone || 'N/A'}`, lineStartX, y);
    y += 4;
    pdf.text(`Date    : ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}`, lineStartX, y);
    y += 5;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;

    pdf.setFont('courier', 'bold');
    pdf.text('PRESTATIONS :', lineStartX, y);
    y += 5;
    pdf.setFont('courier', 'normal');

    const artName = (sale.articleName || sale.items?.[0]?.productName || 'Article').slice(0, 20);
    pdf.text(`- ${artName} x${sale.quantity}`, lineStartX, y);
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} F`, lineEndX - 15, y, { align: 'right' });
    y += 6;

    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;

    pdf.text(`Sous-total prestations:`, lineStartX, y);
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} F`, lineEndX, y, { align: 'right' });
    y += 4;
    pdf.text(`Total suppléments:`, lineStartX, y);
    pdf.text(`0 F`, lineEndX, y, { align: 'right' });
    y += 5;

    pdf.setFont('courier', 'bold');
    pdf.text(`Net à Payer:`, lineStartX, y);
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} F`, lineEndX, y, { align: 'right' });
    y += 5;

    pdf.text(`Règlement:`, lineStartX, y);
    pdf.text(`PAYÉ EN CAISSE ✅`, lineEndX, y, { align: 'right' });
    y += 4;
    pdf.text(`Montant Versé:`, lineStartX, y);
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} F`, lineEndX, y, { align: 'right' });
    y += 4;
    pdf.text(`Reste dû:`, lineStartX, y);
    pdf.text(`0 F`, lineEndX, y, { align: 'right' });
    y += 6;

    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;

    pdf.setFontSize(formatType === '58mm' ? 7 : 8);
    pdf.text('Merci de votre confiance !', centerX, y, { align: 'center' });
    y += 4;
    pdf.text('Ticket requis pour toute réclamation.', centerX, y, { align: 'center' });

    pdf.save(`Ticket_Boutique_${sale.saleNumber || sale.id}.pdf`);
  };

  const handleDownloadBoutiqueSaleA4PDF = (sale: any) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFont('helvetica', 'normal');
    
    // Header
    pdf.setFontSize(22);
    pdf.setTextColor(92, 33, 151); // purple
    pdf.text(merchant.name || 'ACOM', 20, 25);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(merchant.address || 'Touba Mbacké', 20, 32);
    if (merchant.phone) pdf.text(`Tél: ${merchant.phone}`, 20, 37);
    
    pdf.setFontSize(18);
    pdf.setTextColor(92, 33, 151);
    pdf.text("FACTURE DE VENTE DIRECTE", 190, 25, { align: 'right' });
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`N°: ${sale.saleNumber || sale.id}`, 190, 32, { align: 'right' });
    
    pdf.line(20, 42, 190, 42);
    
    // Meta information
    let y = 52;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 50, 50);
    pdf.text("Facturé à :", 20, y);
    pdf.text("Informations Facture :", 120, y);
    
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text(sale.clientName || sale.customerName || 'Client de Passage', 20, y);
    pdf.text(`Date d'émission : ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}`, 120, y);
    
    y += 5;
    pdf.text(`Tél : ${sale.clientPhone || sale.customerPhone || 'N/A'}`, 20, y);
    pdf.text(`Mode de paiement : ${sale.paymentMethod?.toUpperCase() || 'CASH'}`, 120, y);
    
    y += 5;
    pdf.text(`Statut : PAYÉ ✅`, 120, y);
    
    pdf.line(20, y + 8, 190, y + 8);
    y += 18;
    
    // Item Table
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 50, 50);
    pdf.text("Description de l'article", 22, y);
    pdf.text("Catégorie", 90, y, { align: 'center' });
    pdf.text("Quantité", 120, y, { align: 'center' });
    pdf.text("Prix unitaire", 150, y, { align: 'right' });
    pdf.text("Total", 188, y, { align: 'right' });
    
    y += 4;
    pdf.line(20, y, 190, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text(sale.articleName || sale.items?.[0]?.productName || 'Article', 22, y);
    pdf.text(sale.category?.toUpperCase() || '', 90, y, { align: 'center' });
    pdf.text(String(sale.quantity), 120, y, { align: 'center' });
    pdf.text(`${(sale.unitPrice || sale.items?.[0]?.price || 0).toLocaleString()} F`, 150, y, { align: 'right' });
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} F`, 188, y, { align: 'right' });
    
    y += 6;
    pdf.line(20, y, 190, y);
    y += 12;
    
    // Totals on the right
    const rightAlignX = 190;
    const labelsX = 135;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text("Sous-total :", labelsX, y);
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} FCFA`, rightAlignX, y, { align: 'right' });
    
    y += 6;
    pdf.text("Total suppléments :", labelsX, y);
    pdf.text("0 FCFA", rightAlignX, y, { align: 'right' });
    
    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(92, 33, 151);
    pdf.text("Net à Payer :", labelsX, y);
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} FCFA`, rightAlignX, y, { align: 'right' });
    
    y += 6;
    pdf.setTextColor(16, 185, 129); // emerald green
    pdf.text("Montant Versé :", labelsX, y);
    pdf.text(`${(sale.totalPrice || sale.total).toLocaleString()} FCFA`, rightAlignX, y, { align: 'right' });
    
    y += 6;
    pdf.setTextColor(239, 68, 68); // rose
    pdf.text("Reste dû :", labelsX, y);
    pdf.text("0 FCFA", rightAlignX, y, { align: 'right' });
    
    // Footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Merci de votre confiance !", 105, 270, { align: 'center' });
    pdf.text("Cette facture sert de justificatif de paiement.", 105, 275, { align: 'center' });
    pdf.text(`${merchant.name || 'ACOM'} - Logiciel de gestion professionnelle.`, 105, 280, { align: 'center' });
    
    pdf.save(`Facture_Boutique_A4_${sale.saleNumber || sale.id}.pdf`);
  };

  const handleSendBoutiqueSaleWhatsApp = (sale: any) => {
    const text = 
      `*${merchant.name || 'ACOM'} - REÇU DE VENTE DIRECTE* 🛍️\n` +
      `----------------------------------------\n` +
      `*Ticket N°* : ${sale.saleNumber || sale.id}\n` +
      `*Client* : ${sale.clientName || sale.customerName || 'Client de Passage'}\n` +
      `*Date* : ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}\n\n` +
      `*PRESTATIONS* :\n` +
      `- ${sale.articleName || sale.items?.[0]?.productName} x${sale.quantity} : ${(sale.totalPrice || sale.total).toLocaleString()} FCFA\n\n` +
      `*Sous-total* : ${(sale.totalPrice || sale.total).toLocaleString()} FCFA\n` +
      `*Total suppléments* : 0 FCFA\n` +
      `*Net à Payer* : ${(sale.totalPrice || sale.total).toLocaleString()} FCFA\n` +
      `*Montant Versé* : ${(sale.totalPrice || sale.total).toLocaleString()} FCFA\n` +
      `*Reste dû* : 0 FCFA\n\n` +
      `*Règlement* : PAYÉ EN CAISSE ✅\n\n` +
      `Merci pour votre confiance ! A bientôt chez ${merchant.name || 'nous'}.`;
      
    const phone = sale.clientPhone || sale.customerPhone;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith('221') ? cleanPhone : '221' + cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Filtered Articles list
  const filteredArticles = useMemo(() => {
    return articles
      .filter(art => {
        const matchesSearch = art.name.toLowerCase().includes(search.toLowerCase()) || 
                              (art.fabric && art.fabric.toLowerCase().includes(search.toLowerCase())) ||
                              (art.notes && art.notes.toLowerCase().includes(search.toLowerCase()));
        
        const matchesCategory = filterCategory === 'all' ? true : art.category === filterCategory;
        
        let matchesStock = true;
        if (filterStock === 'instock') matchesStock = art.quantity > 0;
        if (filterStock === 'outofstock') matchesStock = art.quantity === 0;

        return matchesSearch && matchesCategory && matchesStock;
      });
  }, [articles, search, filterCategory, filterStock]);

  // Sales statistics calculation
  const statsSummary = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.totalPrice, 0);
    const totalCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
    const itemsCount = sales.reduce((acc, s) => acc + s.quantity, 0);
    
    // Payment breakdown
    const paymentBreakdown = sales.reduce((acc: any, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.totalPrice;
      return acc;
    }, { cash: 0, wave: 0, orange_money: 0, card: 0 });

    // Category breakdown
    const categoryBreakdown = sales.reduce((acc: any, s) => {
      acc[s.category] = (acc[s.category] || 0) + s.totalPrice;
      return acc;
    }, {});

    return {
      totalSales,
      totalCost,
      totalProfit,
      itemsCount,
      paymentBreakdown,
      categoryBreakdown
    };
  }, [sales]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-ink">Boutique Prêt-à-porter</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            Vente directe de tenues déjà confectionnées à l'atelier
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {cart.length > 0 && (
            <button
              onClick={() => setIsSaleOpen(true)}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Voir le Panier ({cart.reduce((a, b) => a + b.qty, 0)})</span>
            </button>
          )}

          <button
            onClick={exportStockCSV}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter Stock (CSV)</span>
          </button>

          <button
            onClick={() => {
              setCurrentArticle({
                name: '',
                category: 'robe',
                size: 'M',
                price: 25000,
                cost: 10000,
                quantity: 1,
                fabric: '',
                image: '',
                notes: ''
              });
              setIsFormOpen(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Tenue</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-gray-100 gap-6 text-sm">
        <button
          onClick={() => setActiveSubTab('stock')}
          className={`pb-3 font-bold transition-colors flex items-center gap-2 relative ${activeSubTab === 'stock' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Collection & Stock ({articles.length})</span>
          {activeSubTab === 'stock' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
        </button>
        <button
          onClick={() => setActiveSubTab('sales')}
          className={`pb-3 font-bold transition-colors flex items-center gap-2 relative ${activeSubTab === 'sales' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Registre des Ventes ({sales.length})</span>
          {activeSubTab === 'sales' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
        </button>
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`pb-3 font-bold transition-colors flex items-center gap-2 relative ${activeSubTab === 'stats' ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistiques & Profits</span>
          {activeSubTab === 'stats' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
        </button>
      </div>

      {/* SUBTAB CONTENT: STOCK (COLLECTION) */}
      {activeSubTab === 'stock' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-black/[0.03]">
            <div className="relative md:col-span-2 text-left">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une tenue, tissu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-150 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-xs font-medium"
              />
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-150 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-xs font-bold text-gray-600 cursor-pointer"
              >
                <option value="all">👚 Toutes catégories</option>
                <option value="robe">👗 Robes</option>
                <option value="boubou">🧥 Boubous</option>
                <option value="kaftan">🪡 Kaftans</option>
                <option value="ensemble">👔 Ensembles</option>
                <option value="chemise">👕 Chemises</option>
                <option value="autre">✨ Autres créations</option>
              </select>
            </div>

            <div>
              <select
                value={filterStock}
                onChange={e => setFilterStock(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-150 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-xs font-bold text-gray-600 cursor-pointer"
              >
                <option value="all">📦 Tous les stocks</option>
                <option value="instock">✅ En stock</option>
                <option value="outofstock">❌ Rupture de stock</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredArticles.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-150 rounded-[2rem] shadow-sm">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold">Aucun vêtement de prêt-à-porter trouvé</p>
              <p className="text-xs text-slate-400 max-w-[300px] mx-auto mt-1 leading-normal">
                Modifiez vos critères de recherche ou ajoutez une nouvelle confection prête à la vente directe.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredArticles.map(art => {
                const isOutOfStock = art.quantity === 0;
                const isLowStock = art.quantity === 1;
                
                return (
                  <div key={art.id} className="bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Image section */}
                      <div 
                        onClick={() => {
                          if (art.image) {
                            setPreviewImage({ url: art.image, title: art.name, size: art.size, category: art.category, notes: art.notes, price: art.price });
                          }
                        }}
                        className={`h-80 md:h-[420px] w-full bg-violet-50/50 relative overflow-hidden flex items-center justify-center border-b border-slate-100 ${art.image ? 'cursor-zoom-in group/img' : ''}`}
                      >
                        {art.image ? (
                          <>
                            <img
                              src={art.image}
                              alt={art.name}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            {/* Zoom Hover Overlay */}
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                              <div className="bg-white/90 backdrop-blur-md p-3 rounded-full text-slate-900 transform scale-90 group-hover/img:scale-100 transition-all duration-300 shadow-xl">
                                <Eye className="w-5 h-5 text-violet-600" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-violet-400 p-4">
                            <Sparkles className="w-10 h-10 mb-1 opacity-70" />
                            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-violet-500">Prêt-à-porter</span>
                          </div>
                        )}

                        {/* Badges Overlay */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                          <span className="text-[8px] bg-violet-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            {art.category}
                          </span>
                          {art.size && (
                            <span className="text-[8px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              Taille {art.size}
                            </span>
                          )}
                        </div>

                        {/* Stock status indicator overlay */}
                        <div className="absolute bottom-3 right-3">
                          {isOutOfStock ? (
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-lg border border-rose-200">
                              Rupture ❌
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-lg border border-amber-200">
                              Dernier ! ⏳
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-lg border border-emerald-200">
                              En stock : {art.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info section */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-extrabold text-ink text-sm leading-snug line-clamp-1">{art.name}</h3>
                          {art.fabric && (
                            <p className="text-[10px] text-violet-600 font-bold mt-0.5 flex items-center gap-1">
                              🎨 Tissu : <span className="text-gray-600 font-semibold">{art.fabric}</span>
                            </p>
                          )}
                        </div>

                        {art.notes && (
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2">
                            {art.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer & Actions */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-50 space-y-4">
                      {/* Price Tag & Profit */}
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 block">PRIX DE VENTE</span>
                          <span className="font-black text-sm text-slate-900">
                            {art.price.toLocaleString()} {merchant.currency || 'FCFA'}
                          </span>
                        </div>
                        {art.cost ? (
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-emerald-500 block">MARGE +{(art.price - art.cost).toLocaleString()} {merchant.currency || 'FCFA'}</span>
                            <span className="text-[8px] font-mono text-gray-400">Coût: {art.cost.toLocaleString()}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const existing = cart.find(c => c.article.id === art.id);
                            if (existing) {
                              setCart(cart.map(c => c.article.id === art.id ? { ...c, qty: c.qty + 1 } : c));
                            } else {
                              setCart([...cart, { article: art, qty: 1 }]);
                            }
                            toast.success(`${art.name} ajouté au panier`);
                          }}
                          disabled={isOutOfStock}
                          className={`col-span-2 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isOutOfStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Ajouter au Panier 🛒</span>
                        </button>

                        <button
                          onClick={() => {
                            setCurrentArticle(art);
                            setIsFormOpen(true);
                          }}
                          className="py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-gray-500" /> Modifier
                        </button>

                        <button
                          onClick={() => handleRestock(art)}
                          className="py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-150 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Restocker
                        </button>

                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          className="col-span-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Retirer du stock
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

      {/* SUBTAB CONTENT: SALES LOG */}
      {activeSubTab === 'sales' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-black/[0.03]">
            <div className="relative w-full md:max-w-md text-left">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par client ou article..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-150 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-xs font-medium"
              />
            </div>
            <div className="text-xs text-gray-500 font-mono font-bold uppercase tracking-widest bg-white px-3.5 py-1.5 rounded-xl border border-slate-150">
              CA Boutique : {statsSummary.totalSales.toLocaleString()} {merchant.currency || 'FCFA'}
            </div>
          </div>

          {sales.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-150 rounded-[2rem] shadow-sm">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold">Aucune vente enregistrée pour le moment</p>
              <p className="text-xs text-slate-400 max-w-[300px] mx-auto mt-1 leading-normal">
                Les transactions s'afficheront ici au fur et à mesure que vous vendez des tenues confectionnées de la boutique.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-black/5 rounded-[2rem] shadow-sm overflow-hidden text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-4 px-6">ID Vente</th>
                      <th className="py-4 px-6">Date & Heure</th>
                      <th className="py-4 px-6">Article Vendu</th>
                      <th className="py-4 px-6">Client</th>
                      <th className="py-4 px-6">Qté</th>
                      <th className="py-4 px-6">Mode de Paiement</th>
                      <th className="py-4 px-6 text-right">Total Reçu</th>
                      <th className="py-4 px-6 text-center">Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {sales
                      .filter(s => s.articleName.toLowerCase().includes(search.toLowerCase()) || s.clientName.toLowerCase().includes(search.toLowerCase()))
                      .map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-6 font-mono text-[10px] text-gray-400 font-bold uppercase">
                            #{sale.id?.slice(-6)}
                          </td>
                          <td className="py-4 px-6 text-[11px] text-gray-500">
                            {format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-ink">{sale.articleName}</div>
                            <div className="text-[9px] text-violet-600 font-mono uppercase tracking-widest mt-0.5">{sale.category}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold">{sale.clientName}</div>
                            {sale.clientPhone && <div className="text-[10px] text-gray-400 font-mono">{sale.clientPhone}</div>}
                          </td>
                          <td className="py-4 px-6 font-mono text-gray-900 font-bold">
                            {sale.quantity}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${sale.paymentMethod === 'wave' ? 'bg-sky-50 text-sky-700 border border-sky-100' : sale.paymentMethod === 'orange_money' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                              {sale.paymentMethod === 'cash' ? ' Espèces' : sale.paymentMethod === 'wave' ? ' Wave' : sale.paymentMethod === 'orange_money' ? ' O. Money' : ' Carte'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-extrabold text-slate-900">
                            {sale.totalPrice.toLocaleString()} {merchant.currency || 'FCFA'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => {
                                setSelectedBoutiqueSale(sale);
                                setIsSaleOpen(true);
                              }}
                              className="p-1.5 border border-slate-100 hover:border-violet-100 bg-white hover:bg-violet-50 text-slate-500 hover:text-violet-600 rounded-lg transition-all hover:scale-105 cursor-pointer"
                              title="Aperçu & Impression Ticket"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB CONTENT: STATS & CHARTS */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6 text-left">
          {/* Key Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Chiffre d'Affaires</span>
              <span className="font-black text-2xl text-slate-900 block">{statsSummary.totalSales.toLocaleString()} {merchant.currency || 'FCFA'}</span>
              <span className="text-[10px] text-emerald-600 font-bold mt-2 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Volume total des ventes directes
              </span>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Bénéfice Réel Estimé</span>
              <span className="font-black text-2xl text-violet-600 block">{statsSummary.totalProfit.toLocaleString()} {merchant.currency || 'FCFA'}</span>
              <span className="text-[10px] text-violet-500 font-bold mt-2 block">
                Marge nette de la boutique : {statsSummary.totalSales > 0 ? ((statsSummary.totalProfit / statsSummary.totalSales) * 100).toFixed(0) : 0}%
              </span>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Articles Confectionnés Soldés</span>
              <span className="font-black text-2xl text-slate-900 block">{statsSummary.itemsCount} pièces</span>
              <span className="text-[10px] text-gray-500 font-bold mt-2 block">
                Quantité vendue hors commande sur-mesure
              </span>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valeur de l'Inventaire Actuel</span>
              <span className="font-black text-2xl text-slate-900 block">
                {articles.reduce((acc, a) => acc + (a.price * a.quantity), 0).toLocaleString()} {merchant.currency || 'FCFA'}
              </span>
              <span className="text-[10px] text-gray-500 font-bold mt-2 block">
                {articles.reduce((acc, a) => acc + a.quantity, 0)} articles actuellement en rayon
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Payment Mode distribution */}
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
              <h3 className="font-extrabold text-ink text-sm uppercase tracking-wider mb-4">Répartition des Paiements Boutique</h3>
              <div className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Espèces', montant: statsSummary.paymentBreakdown.cash },
                    { name: 'Wave', montant: statsSummary.paymentBreakdown.wave },
                    { name: 'Orange Money', montant: statsSummary.paymentBreakdown.orange_money },
                    { name: 'Carte', montant: statsSummary.paymentBreakdown.card }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} ${merchant.currency || 'FCFA'}`, 'Montant']} />
                    <Bar dataKey="montant" fill="#7c3aed" radius={[4, 4, 0, 0]}>
                      <Cell fill="#10b981" />
                      <Cell fill="#0284c7" />
                      <Cell fill="#f97316" />
                      <Cell fill="#6366f1" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top sellers */}
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-ink text-sm uppercase tracking-wider mb-4">Meilleures Ventes de Prêt-à-porter</h3>
                <div className="space-y-4">
                  {Object.entries(
                    sales.reduce((acc: any, s) => {
                      acc[s.articleName] = (acc[s.articleName] || 0) + s.quantity;
                      return acc;
                    }, {})
                  )
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([name, qty]: any, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 bg-violet-100 text-violet-700 text-[10px] font-black rounded-full flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800">{name}</span>
                        </div>
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {qty} vendus
                        </span>
                      </div>
                    ))}
                  {sales.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      Aucune vente enregistrée pour déterminer les meilleures ventes.
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 text-center">
                <span className="text-[10px] font-mono text-violet-600 uppercase tracking-widest font-bold">
                  Boutique Pro - Confection d'Atelier
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE CREATE / EDIT FORM DIALOG */}
      {isFormOpen && currentArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col text-left">
            <div className="px-8 py-6 border-b border-gray-100 bg-violet-50/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-ink">{currentArticle.id ? 'Modifier l\'Article' : 'Ajouter une Confection'}</h3>
                <p className="text-[10px] font-mono text-violet-600 uppercase tracking-widest mt-0.5">Enregistrement d'un modèle prêt-à-porter</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleArticleSubmit} className="p-8 overflow-y-auto space-y-5 flex-1 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nom ou Modèle de la Tenue *</label>
                <input
                  type="text"
                  required
                  value={currentArticle.name}
                  onChange={e => setCurrentArticle({ ...currentArticle, name: e.target.value })}
                  placeholder="Ex: Robe Bazin Royal Broderie fine"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Catégorie *</label>
                  <select
                    value={currentArticle.category}
                    onChange={e => setCurrentArticle({ ...currentArticle, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-sm bg-white cursor-pointer"
                  >
                    <option value="robe">👗 Robe</option>
                    <option value="boubou">🧥 Boubou</option>
                    <option value="kaftan">🪡 Kaftan</option>
                    <option value="ensemble">👔 Ensemble</option>
                    <option value="chemise">👕 Chemise</option>
                    <option value="autre">✨ Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Taille *</label>
                  <select
                    value={currentArticle.size}
                    onChange={e => setCurrentArticle({ ...currentArticle, size: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-sm bg-white cursor-pointer"
                  >
                    <option value="Taille unique">Taille Unique</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="XXXL">XXXL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Prix de Vente ({merchant.currency || 'FCFA'}) *</label>
                  <input
                    type="number"
                    required
                    value={currentArticle.price}
                    onChange={e => setCurrentArticle({ ...currentArticle, price: Number(e.target.value) })}
                    placeholder="Ex: 45000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Quantité en Stock *</label>
                  <input
                    type="number"
                    required
                    value={currentArticle.quantity}
                    onChange={e => setCurrentArticle({ ...currentArticle, quantity: Number(e.target.value) })}
                    placeholder="Ex: 5"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Coût de Revient Estimé ({merchant.currency || 'FCFA'})</label>
                  <input
                    type="number"
                    value={currentArticle.cost || ''}
                    onChange={e => setCurrentArticle({ ...currentArticle, cost: Number(e.target.value) })}
                    placeholder="Ex: 20000 (Tissu + Main d'œuvre)"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Type de Tissu / Matière</label>
                  <input
                    type="text"
                    value={currentArticle.fabric || ''}
                    onChange={e => setCurrentArticle({ ...currentArticle, fabric: e.target.value })}
                    placeholder="Ex: Wax Hollandais, Lin, Soie..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                  />
                </div>
              </div>

              {/* Photo Input (Base64) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Lien de l'image ou Importation Photo</label>
                {currentArticle.image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-32 group">
                    <img src={currentArticle.image} alt="Aperçu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setCurrentArticle({ ...currentArticle, image: '' })}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase cursor-pointer"
                    >
                      Retirer l'image 🗑️
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-violet-500 transition-colors bg-slate-50/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCurrentArticle({ ...currentArticle, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="boutique-image-upload"
                    />
                    <label htmlFor="boutique-image-upload" className="cursor-pointer block">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 font-bold">Cliquez pour importer la photo du vêtement</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Sera affiché sur la fiche d'inventaire</p>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Notes Particulières & Finitions</label>
                <textarea
                  value={currentArticle.notes || ''}
                  onChange={e => setCurrentArticle({ ...currentArticle, notes: e.target.value })}
                  placeholder="Ex: Broderie col V, manches bouffantes, doublure satin douce..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-xs h-16"
                />
              </div>

              <div className="border-t border-gray-150 pt-4 flex justify-end gap-3 shrink-0 text-right">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/20 transition cursor-pointer"
                >
                  Enregistrer l'Article 🚀
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* QUICK SALE FLOW DIALOG */}
      {isSaleOpen && (cart.length > 0 || selectedBoutiqueSale) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col text-left">
            <div className={`px-8 py-6 border-b border-gray-100 ${selectedBoutiqueSale ? 'bg-violet-50/50' : 'bg-emerald-50/50'} flex justify-between items-center shrink-0`}>
              <div>
                <h3 className="text-xl font-black text-ink">
                  {selectedBoutiqueSale ? 'Ticket Boutique Enregistré' : 'Facturer le Panier'}
                </h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                  {selectedBoutiqueSale ? `N° d'enregistrement : ${selectedBoutiqueSale.saleNumber}` : `${cart.length} article(s) dans le panier`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSaleOpen(false);
                  setSelectedBoutiqueSale(null);
                  setCart([]);
                  setSaleClientName('');
                  setSaleClientPhone('');
                  setSalePaymentMethod('cash');
                }}
                className="p-2 hover:bg-gray-200/50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-5 flex-1">
              {selectedBoutiqueSale ? (
                <div className="flex flex-col gap-5 text-left">
                  {/* Real Paper Receipt Simulator style ticket */}
                  <div className="space-y-4 font-mono text-[11px] text-gray-700 leading-relaxed bg-[#fbfbf9] p-5 rounded-2xl border border-dashed border-gray-200 shadow-inner">
                    <div className="text-center pb-3 border-b border-dashed border-gray-200">
                      <p className="font-black text-xs uppercase tracking-wider text-ink block">{merchant.name || 'ACOM'}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{merchant.address || 'Touba Mbacké'}</p>
                    </div>

                    <div className="space-y-1 text-gray-500">
                      <p className="text-gray-950 font-black">
                        N° d'enregistrement : {selectedBoutiqueSale.saleNumber}
                      </p>
                      <p>Client : <span className="text-ink font-bold">{selectedBoutiqueSale.clientName || 'Client de Passage'}</span></p>
                      <p>Contact : <span className="text-ink font-bold">{selectedBoutiqueSale.clientPhone || 'N/A'}</span></p>
                      <p>Date : <span className="font-bold">{format(new Date(selectedBoutiqueSale.date), 'dd/MM/yyyy HH:mm')}</span></p>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3">
                      <p className="font-bold uppercase text-ink mb-1.5 text-xs">PRESTATIONS :</p>
                      <div className="space-y-1">
                        {selectedBoutiqueSale.items ? (
                          selectedBoutiqueSale.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between">
                              <span>- {item.name} x{item.quantity}</span>
                              <span className="font-bold">{item.total.toLocaleString()} FCFA</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between">
                            <span>- {selectedBoutiqueSale.articleName} x{selectedBoutiqueSale.quantity}</span>
                            <span className="font-bold">{selectedBoutiqueSale.totalPrice.toLocaleString()} FCFA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-500 text-[10px]">
                        <span>Sous-total prestations :</span>
                        <span className="font-bold">{selectedBoutiqueSale.totalPrice.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-[10px]">
                        <span>Total suppléments :</span>
                        <span className="font-bold">0 FCFA</span>
                      </div>
                      <div className="flex justify-between text-ink font-black text-xs pt-1.5 border-t border-dashed border-gray-200/50">
                        <span>NET À PAYER :</span>
                        <span>{selectedBoutiqueSale.totalPrice.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold text-[11px] pt-1">
                        <span>Règlement :</span>
                        <span>PAYÉ EN CAISSE ✅</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Imprimer Ticket Client</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => printBoutiqueReceipt(selectedBoutiqueSale, '80mm')}
                        className="py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> 80mm
                      </button>
                      <button
                        onClick={() => printBoutiqueReceipt(selectedBoutiqueSale, '58mm')}
                        className="py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> 58mm
                      </button>
                      <button
                        onClick={() => printBoutiqueReceipt(selectedBoutiqueSale, 'A4')}
                        className="py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Facture A4
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleDownloadBoutiqueSalePDF(selectedBoutiqueSale, '80mm')}
                        className="py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold transition cursor-pointer"
                      >
                        📥 Télécharger PDF Ticket
                      </button>
                      <button
                        onClick={() => handleDownloadBoutiqueSaleA4PDF(selectedBoutiqueSale)}
                        className="py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold transition cursor-pointer"
                      >
                        📥 Télécharger PDF A4
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleSendBoutiqueSaleWhatsApp(selectedBoutiqueSale)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      💬 Envoyer par WhatsApp
                    </button>
                  </div>

                  {managerEmail && (
                    <div className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-2xl flex items-center justify-between text-xs text-violet-800">
                      <div className="font-semibold text-left">
                        <p className="font-bold">Rapport Gérant en Direct</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{managerEmail}</p>
                      </div>
                      <button
                        onClick={() => dispatchBoutiqueManagerSaleNotif(selectedBoutiqueSale, 'email')}
                        disabled={saleMailFeedback[selectedBoutiqueSale.id]}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${saleMailFeedback[selectedBoutiqueSale.id] ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'}`}
                      >
                        {saleMailFeedback[selectedBoutiqueSale.id] ? 'Envoyé ✓' : 'Renvoyer Mail ✉'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5 text-left">
                  {/* Cart items listing */}
                  <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Articles conglomérés :</span>
                    {cart.map(item => (
                      <div key={item.article.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          {item.article.image ? (
                            <img src={item.article.image} alt={item.article.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-black/5" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {item.article.category?.slice(0, 3)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-ink text-xs leading-snug">{item.article.name}</h4>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[9px] bg-slate-900 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                {item.article.price.toLocaleString()} FCFA
                              </span>
                              <span className="text-[8px] bg-violet-100 text-violet-800 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Stock: {item.article.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={item.article.quantity}
                            required
                            value={item.qty}
                            onChange={e => {
                              const newQty = Math.min(item.article.quantity, Math.max(1, Number(e.target.value)));
                              setCart(cart.map(c => c.article.id === item.article.id ? { ...c, qty: newQty } : c));
                            }}
                            className="w-14 px-1 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-xs text-center bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setCart(cart.filter(c => c.article.id !== item.article.id))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-left">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Mode de Paiement *</label>
                      <select
                        value={salePaymentMethod}
                        onChange={e => setSalePaymentMethod(e.target.value as any)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm bg-white cursor-pointer"
                      >
                        <option value="cash">💵 Espèces</option>
                        <option value="wave">🔵 Wave Mobile Money</option>
                        <option value="orange_money">🍊 Orange Money</option>
                        <option value="card">💳 Carte de crédit</option>
                      </select>
                    </div>
                  </div>

                  {/* Linked Client selector */}
                  <div className="text-left">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nom du Client (Optionnel)</label>
                    <select
                      value={clients.find(c => `${c.firstName} ${c.lastName}` === saleClientName)?.id || ''}
                      onChange={e => {
                        const selected = clients.find(c => c.id === e.target.value);
                        if (selected) {
                          setSaleClientName(`${selected.firstName} ${selected.lastName}`);
                          setSaleClientPhone(selected.phone || '');
                        } else {
                          setSaleClientName('');
                          setSaleClientPhone('');
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-150 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-gray-600 cursor-pointer bg-white mb-2"
                    >
                      <option value="">-- Client de passage ou sélectionner existant --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phone || 'Pas de numéro'})</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={saleClientName}
                      onChange={e => setSaleClientName(e.target.value)}
                      placeholder="Saisissez un nom s'il n'est pas déjà dans vos clients"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-sm"
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Téléphone du Client (Optionnel)</label>
                    <input
                      type="text"
                      value={saleClientPhone}
                      onChange={e => setSaleClientPhone(e.target.value)}
                      placeholder="Ex: +221 77 123 45 67"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                    />
                  </div>

                  {/* Total calculation indicator box */}
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center text-emerald-800 text-left">
                    <span className="text-xs font-bold">TOTAL À SOLDER DIRECTEMENT :</span>
                    <span className="font-mono font-black text-lg">
                      {cart.reduce((sum, item) => sum + (item.article.price * item.qty), 0).toLocaleString()} {merchant.currency || 'FCFA'}
                    </span>
                  </div>

                  {/* Form buttons */}
                  <div className="border-t border-gray-150 pt-4 flex justify-end gap-3 shrink-0 text-right">
                    <button
                      type="button"
                      onClick={() => setIsSaleOpen(false)}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={handleRegisterSale}
                      className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                    >
                      Confirmer la vente 🚀
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox Image Preview Dialog */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-3xl w-full flex flex-col items-center">
            <div className="w-full flex justify-end mb-2">
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img src={previewImage.url} alt={previewImage.title || 'Previsualisation'} className="max-h-[70vh] rounded-3xl object-contain shadow-2xl border border-white/5" referrerPolicy="no-referrer" />
            <div className="mt-4 text-center text-white">
              <h4 className="font-black text-lg">{previewImage.title}</h4>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">Taille : {previewImage.size} • Catégorie : {previewImage.category}</p>
              {previewImage.price && <p className="text-emerald-400 font-extrabold text-sm mt-1">{previewImage.price.toLocaleString()} FCFA</p>}
              {previewImage.notes && <p className="text-xs text-gray-300 mt-2 max-w-md mx-auto font-medium">{previewImage.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
