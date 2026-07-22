import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../db/db';
import { Merchant } from '../../../types';
import { PressingTicket, PressingTarifs, PressingClosure, DetergentSale, DetergentProduct, DetergentQuote, DEFAULT_DETERGENTS } from '../types';
import { OptimizedImage } from '../../../components/OptimizedImage';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { AcomAlertPopup } from '../../../components/AcomAlertPopup';
import ScannerModal from '../../../components/ScannerModal';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { printDetergentSaleDirect, printDetergentQuoteDirect } from '../../billing/utils/pdfGenerator';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';
import { showMailSuccessToast } from '../../../components/MailSuccessToast';
import { jsPDF } from 'jspdf';
import { 
    Save, X, Loader2, Trash2, Printer, Search, 
    Filter, FileText, Check, DollarSign, Clock,
    Download, MessageSquare, Mail, RefreshCw, ScanLine, Upload, Edit2, Eye,
    ShoppingCart, Package, AlertCircle, Trash2 as Trash, TrendingUp, Plus
} from 'lucide-react';

const DETERGENT_CATEGORY_IMAGES: Record<string, string> = {
  liquid: "https://images.unsplash.com/photo-1610555356070-d0efb6505f81?auto=format&fit=crop&w=250&q=80",
  softener: "https://images.unsplash.com/photo-1551462147-3a90ced63b95?auto=format&fit=crop&w=250&q=80",
  stain_remover: "https://images.unsplash.com/photo-1610555355600-47b85002ba5a?auto=format&fit=crop&w=250&q=80",
  bleach: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=250&q=80",
  powder: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=250&q=80",
  other: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=250&q=80"
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

const CATEGORY_LABELS: Record<string, string> = {
  liquid: "Détergent Liquide",
  softener: "Adoucissant",
  stain_remover: "Détachant",
  bleach: "Eau de Javel",
  powder: "Détergent en Poudre",
  other: "Autres Accessoires"
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

export const PressingStockManager = ({ merchant }: { merchant: Merchant }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'inventory' | 'history' | 'quotes'>('sales');

  // Unified pop-up state for PressingStockManager
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
  
  // Quotes (proforma) state
  const [quotes, setQuotes] = useState<DetergentQuote[]>(() => {
    const saved = localStorage.getItem(`pressing_stock_quotes_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [viewingQuote, setViewingQuote] = useState<DetergentQuote | null>(null);

  // Suivi Gérant Temps Réel à Distance local history
  const [managerNotifsHistory, setManagerNotifsHistory] = useState<{ id: string; ticketNumber: string; type: 'entrée' | 'sortie'; method: 'whatsapp' | 'email'; timestamp: string }[]>(() => {
    const saved = localStorage.getItem(`pressing_manager_notifs_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`pressing_manager_notifs_${merchant.id}`, JSON.stringify(managerNotifsHistory));
  }, [managerNotifsHistory, merchant.id]);

  // Relance & Notification Temps Réel Client pour les Devis Boutiques/Directes
  const [selectedQuoteNotifTemplate, setSelectedQuoteNotifTemplate] = useState<string>('deposit');
  const [quoteNotifMessage, setQuoteNotifMessage] = useState('');
  const [editedQuotePhone, setEditedQuotePhone] = useState('');
  const [editedQuoteEmail, setEditedQuoteEmail] = useState('');
  const [quoteMailFeedback, setQuoteMailFeedback] = useState<Record<string, boolean>>({});

  const QUOTE_NOTIFICATION_TEMPLATES = useMemo<{ [key: string]: { label: string; subject: string; body: (q: DetergentQuote) => string } }>(() => ({
    deposit: {
      label: '📥 Réception / Dépôt enregistré',
      subject: `Confirmation de dépôt - ${merchant.name || 'Pressing'}`,
      body: (q: DetergentQuote) => `Bonjour ${q.customerName}, votre dépôt du ${new Date(q.date).toISOString().split('T')[0]} au pressing ${merchant.name || 'ACOM'} a bien été enregistré. Ticket N°: ${q.quoteNumber}. Prix : ${q.total} FCFA. Versé: 0 FCFA. Retrait prévu: N/A. Merci de votre fidélité !`
    },
    in_progress: {
      label: '🧼 Lavage en cours',
      subject: `Traitement de votre linge - ${merchant.name || 'Pressing'}`,
      body: (q: DetergentQuote) => `Bonjour ${q.customerName}, votre linge du ticket N°: ${q.quoteNumber} est actuellement en cours de traitement et de lavage par notre équipe.`
    },
    ready: {
      label: '👔 Linge Prêt pour Retrait',
      subject: `Votre commande est prête ! - ${merchant.name || 'Pressing'}`,
      body: (q: DetergentQuote) => `Bonjour ${q.customerName}, bonne nouvelle ! Votre linge est lavé, repassé et disponible (Ticket N°: ${q.quoteNumber}). Montant total: ${q.total} FCFA, reste à payer: ${q.total} FCFA. À très bientôt !`
    },
    delivered: {
      label: '✅ Commande Livrée',
      subject: `Merci pour votre visite ! - ${merchant.name || 'Pressing'}`,
      body: (q: DetergentQuote) => `Bonjour ${q.customerName}, votre commande ticket N°: ${q.quoteNumber} vous a été délivrée. Merci pour votre confiance !`
    },
    payment_reminder: {
      label: '💰 Solde dû (Rappel de paiement)',
      subject: `Rappel de règlement - ${merchant.name || 'Pressing'}`,
      body: (q: DetergentQuote) => `Bonjour ${q.customerName}, nous vous rappelons qu'un solde de ${q.total} FCFA reste à régler pour votre commande N°: ${q.quoteNumber}. Merci de régler lors du retrait.`
    }
  }), [merchant]);

  useEffect(() => {
    if (viewingQuote) {
      setEditedQuotePhone(viewingQuote.customerPhone || '');
      setEditedQuoteEmail(viewingQuote.customerEmail || '');
    }
  }, [viewingQuote]);

  useEffect(() => {
    if (viewingQuote) {
      const tmpl = QUOTE_NOTIFICATION_TEMPLATES[selectedQuoteNotifTemplate];
      if (tmpl) {
        setQuoteNotifMessage(tmpl.body(viewingQuote));
      }
    }
  }, [viewingQuote, selectedQuoteNotifTemplate, QUOTE_NOTIFICATION_TEMPLATES]);

  const logQuoteNotificationSent = (method: 'whatsapp' | 'email', templateKey: string, msg: string) => {
    if (!viewingQuote) return;
    const newLog = {
      id: `qlog_${Date.now()}`,
      type: method,
      templateName: QUOTE_NOTIFICATION_TEMPLATES[templateKey]?.label || templateKey,
      message: msg,
      timestamp: new Date().toISOString()
    };
    const updatedQuote: DetergentQuote = {
      ...viewingQuote,
      sentNotifications: [...(viewingQuote.sentNotifications || []), newLog]
    };
    const updatedQuotes = quotes.map(q => q.id === viewingQuote.id ? updatedQuote : q);
    setQuotes(updatedQuotes);
    localStorage.setItem(`pressing_stock_quotes_${merchant.id}`, JSON.stringify(updatedQuotes));
    setViewingQuote(updatedQuote);
  };

  const getManagerQuoteNotificationMessage = useCallback((q: DetergentQuote, type: 'entrée' | 'sortie') => {
    const isEntry = type === 'entrée';
    const itemsDesc = q.items
      .map(item => `${item.quantity}x ${item.productName}`)
      .join(', ');

    if (isEntry) {
      return `📢 [SUIVI GÉRANT - ENTRÉE DEVIS] 📥\n` +
             `--------------------------------\n` +
             `• Devis N° : ${q.quoteNumber}\n` +
             `• Client : ${q.customerName} (${q.customerPhone || 'Aucun contact'})\n` +
             `• Articles : ${itemsDesc || '0 article'}\n` +
             `• Sous-total : ${q.subtotal} FCFA\n` +
             (q.discount > 0 ? `• Remise : ${q.discount} FCFA\n` : '') +
             `• Valeur Nette : ${q.total} FCFA\n` +
             `• Date d'émission : ${new Date(q.date).toLocaleDateString('fr-FR')}\n` +
             `--------------------------------\n` +
             `Rapport de devis temps réel généré sur l'application SaaS ${merchant.name || 'ACOM'}.`;
    } else {
      return `📢 [SUIVI GÉRANT - SORTIE DEVIS] 👔\n` +
             `--------------------------------\n` +
             `• Devis N° : ${q.quoteNumber}\n` +
             `• Client : ${q.customerName}\n` +
             `• Statut : Devis Converti / Livré ✅\n` +
             `• Valeur Nette : ${q.total} FCFA\n` +
             `--------------------------------\n` +
             `Rapport de devis temps réel généré sur l'application SaaS ${merchant.name || 'ACOM'}.`;
    }
  }, [merchant]);

  const dispatchManagerQuoteNotif = async (q: DetergentQuote, flowType: 'entrée' | 'sortie', method: 'whatsapp' | 'email') => {
    const message = getManagerQuoteNotificationMessage(q, flowType);
    if (method === 'whatsapp') {
      if (!managerPhone.trim()) {
        showAlert('Numéro non configuré', "Veuillez configurer le numéro WhatsApp du Gérant dans l'onglet Réglages.", 'error');
        return;
      }
      let cleaned = managerPhone.replace(/[^0-9]/g, '');
      if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '221' + cleaned;
      }
      const waUrl = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      showAlert('Rapport Envoyé', "Le rapport de suivi pour WhatsApp a été généré et ouvert !", 'success');
      
      // Add to local history
      const newLog = {
        id: `mnotif_${Date.now()}`,
        ticketNumber: q.quoteNumber,
        type: flowType,
        method,
        timestamp: new Date().toISOString()
      };
      setManagerNotifsHistory(prev => [newLog, ...prev]);
    } else {
      if (!managerEmail.trim()) {
        showAlert('Email non configuré', "Veuillez configurer l'adresse email du Gérant dans l'onglet Réglages.", 'error');
        return;
      }
      const subject = `⚡ [${flowType.toUpperCase()}] Devis n°${q.quoteNumber} - ${merchant.name || 'Pressing'}`;
      const mailtoUrl = `mailto:${managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(mailtoUrl, '_blank');
      showAlert("Messagerie Ouverte", "Nous avons configuré l'email de suivi. Veuillez appuyer sur Envoyer dans votre boîte mail !", 'success');
      
      // Add to local history
      const newLog = {
        id: `mnotif_${Date.now()}`,
        ticketNumber: q.quoteNumber,
        type: flowType,
        method,
        timestamp: new Date().toISOString()
      };
      setManagerNotifsHistory(prev => [newLog, ...prev]);
    }
  };

  const [saleMailFeedback, setSaleMailFeedback] = useState<Record<string, boolean>>({});
  
  // Custom categories state initialized from localStorage
  const [customCategories, setCustomCategories] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem(`pressing_custom_categories_${merchant.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const allCategories = useMemo(() => {
    return {
      ...CATEGORY_LABELS,
      ...customCategories
    };
  }, [customCategories]);

  // Products stock state
  const [products, setProducts] = useState<DetergentProduct[]>(() => {
    const saved = localStorage.getItem(`pressing_stock_products_${merchant.id}`);
    return saved ? JSON.parse(saved) : DEFAULT_DETERGENTS;
  });

  // Sales state
  const [sales, setSales] = useState<DetergentSale[]>(() => {
    const saved = localStorage.getItem(`pressing_stock_sales_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  
  // POS Cart State
  const [cart, setCart] = useState<{ product: DetergentProduct; quantity: number }[]>([]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Modals / Creators
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DetergentProduct | null>(null);
  const [selectedSale, setSelectedSale] = useState<DetergentSale | null>(null);
  const [viewingSale, setViewingSale] = useState<DetergentSale | null>(null);

  // Configuration Suivi Gérant (WhatsApp & Email automatique)
  const managerPhone = merchant.managerNotifications?.whatsappPhone || '';
  const managerEmail = merchant.managerNotifications?.email || '';
  const autoEmailManager = merchant.managerNotifications?.notifyOnPOSSale !== false;

  const getManagerSaleNotificationMessage = useCallback((s: DetergentSale) => {
    const itemsList = s.items
      .map(item => `• ${item.quantity}x ${item.productName} (${item.price} FCFA/u) = ${item.total} FCFA`)
      .join('\n');

    return `📢 [SUIVI GÉRANT - VENTE DE DÉTERGENT] 🛒\n` +
           `--------------------------------\n` +
           `• N° Vente : ${s.saleNumber}\n` +
           `• Acheteur : ${s.customerName} (${s.customerPhone || 'Client de Passage'})\n` +
           `• Date/Heure : ${new Date(s.date).toLocaleString('fr-FR')}\n` +
           `--------------------------------\n` +
           `DÉTAIL DU PANIER :\n` +
           `${itemsList}\n` +
           `--------------------------------\n` +
           `• Sous-total : ${s.subtotal} FCFA\n` +
           `• Remise : ${s.discount || 0} FCFA\n` +
           `• TOTAL PAYÉ : ${s.total} FCFA ✅\n` +
           `--------------------------------\n` +
           `Rapport d'activité de vente de détergent généré en temps réel sur l'application SaaS ${merchant.name || 'ACOM'}.`;
  }, [merchant]);

  const sendSilentBackgroundSaleEmailToManager = async (sale: DetergentSale) => {
    if (!managerEmail || !managerEmail.trim()) return;

    const itemsDesc = sale.items
      .map(item => `<li style="margin: 4px 0;"><strong>${item.quantity}x</strong> ${item.productName} (${item.price} FCFA/u) — <strong>${item.total} FCFA</strong></li>`)
      .join('');

    const title = `🛒 Notification de Vente (Produits Détergents)`;
    const themeColor = '#10b981'; // Green for sales

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="background-color: ${themeColor}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">${merchant.name || 'Pressing'}</h2>
          <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">Suivi d'Activité en Temps Réel — Gérant</p>
        </div>

        <div style="margin-top: 20px;">
          <h3 style="color: ${themeColor}; border-bottom: 2px solid ${themeColor}; padding-bottom: 5px; margin-bottom: 15px;">${title}</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 150px;"><strong>N° Vente :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${sale.saleNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Client / Acheteur :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${sale.customerName} (${sale.customerPhone || 'Client de Passage'})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;" valign="top"><strong>Articles Achetés :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <ul style="margin: 0; padding-left: 20px;">${itemsDesc}</ul>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Sous-Total :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${sale.subtotal} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Remise Accordée :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${sale.discount || 0} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Montant Total Encaissé :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981; font-size: 15px;">${sale.total} FCFA (PAYÉ EN CAISSE ✅)</td>
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
        subject: `🛒 [VENTE PRODUIT] Vente n°${sale.saleNumber} - ${merchant.name || 'Pressing'}`,
        html: mailHtml
      }, {
        resendApiKey: merchant.managerNotifications?.resendApiKey,
        defaultFrom: merchant.managerNotifications?.emailFrom
      });

      const resData = await response.json().catch(() => null);
      if (response.ok && resData?.success !== false) {
        showMailSuccessToast("Ce mail envoyé en arrière-plan avec succès !");
        
        // Add to history
        const newLog = {
          id: `mnotif_s_${Date.now()}`,
          ticketNumber: sale.saleNumber,
          type: 'sortie' as const,
          method: 'email' as const,
          timestamp: new Date().toISOString()
        };
        const savedNotifs = localStorage.getItem(`pressing_manager_notifs_${merchant.id}`);
        const currentNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
        localStorage.setItem(`pressing_manager_notifs_${merchant.id}`, JSON.stringify([newLog, ...currentNotifs]));
        return true;
      } else {
        console.warn('Failed to send background email to manager for sale:', resData || response.statusText);
        const errMsg = resData?.error ? ` (${resData.error})` : '';
        toast.error(`Rapport e-mail de vente non envoyé${errMsg}`);
        return false;
      }
    } catch (err) {
      console.error('Error dispatching silent manager background sale mail:', err);
      return false;
    }
  };

  const dispatchManagerSaleNotif = async (s: DetergentSale, method: 'whatsapp' | 'email') => {
    const message = getManagerSaleNotificationMessage(s);
    if (method === 'whatsapp') {
      if (!managerPhone.trim()) {
        showAlert('Numéro non configuré', "Veuillez configurer le numéro de téléphone WhatsApp du Gérant.", 'error');
        return;
      }
      let cleaned = managerPhone.replace(/[^0-9]/g, '');
      if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '221' + cleaned;
      }
      const waUrl = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      showAlert('Suivi WhatsApp', "Le lien de suivi WhatsApp pour le Gérant a été préparé et ouvert !", 'success');
      
      // Add to history
      const newLog = {
        id: `mnotif_s_${Date.now()}`,
        ticketNumber: s.saleNumber,
        type: 'sortie' as const,
        method,
        timestamp: new Date().toISOString()
      };
      const savedNotifs = localStorage.getItem(`pressing_manager_notifs_${merchant.id}`);
      const currentNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
      localStorage.setItem(`pressing_manager_notifs_${merchant.id}`, JSON.stringify([newLog, ...currentNotifs]));
    } else {
      if (!managerEmail.trim()) {
        showAlert('Email non configuré', "Veuillez configurer l'adresse email du Gérant.", 'error');
        return;
      }
      toast.loading('Envoi du rapport par mail...');
      const ok = await sendSilentBackgroundSaleEmailToManager(s);
      toast.dismiss();
      if (ok) {
        setSaleMailFeedback(prev => ({ ...prev, [s.id]: true }));
        showAlert('Rapport Envoyé', "Le rapport de vente de détergent a été transmis avec succès par mail au Gérant !", 'success');
      } else {
        const subject = `🛒 [DÉTERGENTS] Rapport de Vente ${s.saleNumber} - ${merchant.name || 'Pressing'}`;
        const mailtoUrl = `mailto:${managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoUrl, '_blank');
        showAlert('Messagerie Ouverte', "Le brouillon d'e-mail de suivi de vente de détergent a été ouvert. Veuillez cliquer sur Envoyer !", 'success');
        
        // Add to history
        const newLog = {
          id: `mnotif_s_${Date.now()}`,
          ticketNumber: s.saleNumber,
          type: 'sortie' as const,
          method,
          timestamp: new Date().toISOString()
        };
        const savedNotifs = localStorage.getItem(`pressing_manager_notifs_${merchant.id}`);
        const currentNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
        localStorage.setItem(`pressing_manager_notifs_${merchant.id}`, JSON.stringify([newLog, ...currentNotifs]));
      }
    }
  };

  // Form states (Create / Edit)
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(3);
  const [formCategory, setFormCategory] = useState<string>('liquid');
  const [formDescription, setFormDescription] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [showFormSkuScanner, setShowFormSkuScanner] = useState(false);
  const [showSearchScanner, setShowSearchScanner] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryLabelInput, setNewCategoryLabelInput] = useState('');

  const deleteCustomCategory = (keyToDel: string) => {
    showAlert(
      'Supprimer la catégorie ?',
      `Voulez-vous supprimer la catégorie "${customCategories[keyToDel]}" ? Les produits de cette catégorie resteront mais leur rayon sera à réajuster.`,
      'warning',
      () => {
        const updated = { ...customCategories };
        delete updated[keyToDel];
        setCustomCategories(updated);
        localStorage.setItem(`pressing_custom_categories_${merchant.id}`, JSON.stringify(updated));
        
        if (formCategory === keyToDel) {
          setFormCategory('liquid');
        }
        if (categoryFilter === keyToDel) {
          setCategoryFilter('all');
        }
        showAlert('Catégorie Supprimée', 'Le rayon personnalisé a été supprimé avec succès.', 'success');
      },
      true,
      'SUPPRIMER',
      'RAYONS'
    );
  };

  // Calculate cart total
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.floor((cartSubtotal * discountValue) / 100);
    }
    return discountValue;
  }, [cartSubtotal, discountType, discountValue]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount);
  }, [cartSubtotal, discountAmount]);

  // Alert count (low stock)
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  }, [products]);

  // Alert count (out of stock)
  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stock <= 0).length;
  }, [products]);

  // Save stocks to storage
  const saveProductsToStorage = (updatedProducts: DetergentProduct[]) => {
    setProducts(updatedProducts);
    localStorage.setItem(`pressing_stock_products_${merchant.id}`, JSON.stringify(updatedProducts));
  };

  // Add Item to cart
  const addToCart = (product: DetergentProduct) => {
    if (product.stock <= 0) {
      showAlert('Rupture de Stock', 'Ce produit est en rupture de stock totale !', 'error');
      return;
    }
    const existing = cart.find(it => it.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        showAlert('Stock Insuffisant', `Stock disponible insuffisant (${product.stock} max) !`, 'warning');
        return;
      }
      setCart(cart.map(it => it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    showAlert('Ajouté au Panier', `${product.name} ajouté au panier.`, 'success');
  };

  // Update cart item quantity
  const updateCartQuantity = (productId: string, qty: number) => {
    const item = cart.find(it => it.product.id === productId);
    if (!item) return;

    if (qty <= 0) {
      setCart(cart.filter(it => it.product.id !== productId));
    } else if (qty > item.product.stock) {
      showAlert('Maximum Atteint', `Maximum de stock disponible : ${item.product.stock}`, 'warning');
    } else {
      setCart(cart.map(it => it.product.id === productId ? { ...it, quantity: qty } : it));
    }
  };

  // Finalize Sale
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showAlert('Panier Vide', 'Votre panier est totalement vide !', 'warning');
      return;
    }

    // Verify stock one last time
    for (const item of cart) {
      const realProduct = products.find(p => p.id === item.product.id);
      if (!realProduct || realProduct.stock < item.quantity) {
        showAlert('Stock Indisponible', `Stock indisponible pour ${item.product.name} !`, 'error');
        return;
      }
    }

    const saleNumber = `D-SL-${Date.now().toString().slice(-6)}`;
    const newSaleItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      costPrice: item.product.costPrice || 0,
      quantity: item.quantity,
      total: item.product.price * item.quantity
    }));
    
    const newSaleTotalCost = newSaleItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);

    const newSale: DetergentSale = {
      id: `sale_${Date.now()}`,
      saleNumber,
      customerName: customerName.trim() || 'Client de Passage',
      customerPhone: customerPhone.trim(),
      date: new Date().toISOString(),
      items: newSaleItems,
      discount: discountAmount,
      discountType,
      discountValue,
      subtotal: cartSubtotal,
      total: cartTotal,
      totalCost: newSaleTotalCost
    };

    // Update stocks
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(it => it.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });

    saveProductsToStorage(updatedProducts);

    // Save sales
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem(`pressing_stock_sales_${merchant.id}`, JSON.stringify(updatedSales));

    // Register Sale in dexie central system DB for Accounting / Compta
    try {
      db.sales.add({
        id: newSale.id,
        merchantId: merchant.id,
        items: cart.map(item => ({
          id: item.product.id,
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.quantity * item.product.price
        })),
        totalAmount: cartTotal,
        paidAmount: cartTotal,
        balance: 0,
        payments: [{
          id: `p_${Date.now()}`,
          amount: cartTotal,
          method: 'cash',
          date: new Date().toISOString()
        }],
        paymentMethod: 'cash',
        customerName: newSale.customerName,
        customerPhone: newSale.customerPhone,
        processedBy: 'system',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Dexie integration failed:', err);
    }

    // Reset checkout fields
    setCart([]);
    setDiscountValue(0);
    setDiscountType('amount');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedSale(newSale); // show details simulator
    showAlert('Encaissement Validé', `Encaissement validé ! N° ${saleNumber}`, 'success');

    // Auto-email summary to the manager in the background
    if (autoEmailManager && managerEmail && managerEmail.trim()) {
      sendSilentBackgroundSaleEmailToManager(newSale);
    }
  };

  // Generate Proforma Quote Handler
  const handleGenerateQuote = () => {
    if (cart.length === 0) {
      showAlert('Panier Vide', "Votre panier est vide ! Impossible d'émettre un devis proforma.", 'warning');
      return;
    }

    const quoteNumber = `D-QT-${Date.now().toString().slice(-6)}`;
    const newQuoteItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      costPrice: item.product.costPrice || 0,
      quantity: item.quantity,
      total: item.product.price * item.quantity
    }));

    const newQuoteTotalCost = newQuoteItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);

    const newQuote: DetergentQuote = {
      id: `quote_${Date.now()}`,
      quoteNumber,
      customerName: customerName.trim() || 'Client de Passage',
      customerPhone: customerPhone.trim(),
      date: new Date().toISOString(),
      items: newQuoteItems,
      discount: discountAmount,
      discountType,
      discountValue,
      subtotal: cartSubtotal,
      total: cartTotal,
      totalCost: newQuoteTotalCost
    };

    const updatedQuotes = [newQuote, ...quotes];
    setQuotes(updatedQuotes);
    localStorage.setItem(`pressing_stock_quotes_${merchant.id}`, JSON.stringify(updatedQuotes));

    const mockSaleFromQuote: DetergentSale = {
      id: newQuote.id,
      saleNumber: newQuote.quoteNumber,
      customerName: newQuote.customerName,
      customerPhone: newQuote.customerPhone,
      date: newQuote.date,
      items: newQuote.items.map(it => ({
        productId: it.productId,
        productName: it.productName,
        price: it.price,
        costPrice: it.costPrice,
        quantity: it.quantity,
        total: it.total
      })),
      discount: newQuote.discount,
      discountType: newQuote.discountType,
      discountValue: newQuote.discountValue,
      subtotal: newQuote.subtotal,
      total: newQuote.total,
      totalCost: newQuote.totalCost
    };

    // Reset fields & clear cart
    setCart([]);
    setDiscountValue(0);
    setDiscountType('amount');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedSale(mockSaleFromQuote); // Render as a mock sale inside the sidebar ticket simulator!
    showAlert('Devis Enregistré', `Devis proforma enregistré ! N° ${quoteNumber}`, 'success');
  };

  // Convert Quote To Cart
  const handleConvertQuoteToCart = (quote: DetergentQuote) => {
    const loadedCart: { product: DetergentProduct; quantity: number }[] = [];
    
    quote.items.forEach(it => {
      const foundProd = products.find(p => p.id === it.productId);
      if (foundProd) {
        loadedCart.push({ product: foundProd, quantity: it.quantity });
      } else {
        loadedCart.push({
          product: {
            id: it.productId,
            name: it.productName,
            price: it.price,
            stock: 0,
            minStock: 2,
            category: 'other',
            description: 'Produit du Devis'
          },
          quantity: it.quantity
        });
      }
    });

    setCart(loadedCart);
    setDiscountValue(quote.discountValue || quote.discount);
    setDiscountType(quote.discountType || 'amount');
    setCustomerName(quote.customerName === 'Client de Passage' ? '' : quote.customerName);
    setCustomerPhone(quote.customerPhone);
    setActiveSubTab('sales');
    showAlert('Devis Chargé', `Le devis ${quote.quoteNumber} a été chargé avec succès dans votre panier de vente active !`, 'success');
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (window.confirm('Voulez-vous supprimer définitivement ce devis proforma ?')) {
      const updated = quotes.filter(q => q.id !== quoteId);
      setQuotes(updated);
      localStorage.setItem(`pressing_stock_quotes_${merchant.id}`, JSON.stringify(updated));
      showAlert('Devis Supprimé', 'Devis proforma supprimé.', 'success');
      if (viewingQuote?.id === quoteId) {
        setViewingQuote(null);
      }
    }
  };

  // Add/Edit Product Handler
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) {
      showAlert('Formulaire Invalide', 'Veuillez renseigner le nom et un prix valide.', 'warning');
      return;
    }

    if (editingProduct) {
      const updated = products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: formName,
        price: formPrice,
        costPrice: formCostPrice,
        stock: formStock,
        minStock: formMinStock,
        category: formCategory,
        description: formDescription,
        sku: formSku.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined
      } : p);
      saveProductsToStorage(updated);
      showAlert('Produit Mis à Jour', 'Caractéristiques du détergent ou produit mises à jour !', 'success');
      setEditingProduct(null);
    } else {
      const newProd: DetergentProduct = {
        id: `det_${Date.now()}`,
        name: formName,
        price: formPrice,
        costPrice: formCostPrice,
        stock: formStock,
        minStock: formMinStock,
        category: formCategory,
        description: formDescription,
        sku: formSku.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined
      };
      saveProductsToStorage([newProd, ...products]);
      showAlert('Produit Crée', 'Nouveau détergent référencé avec succès au catalogue !', 'success');
      setShowAddModal(false);
    }

    // Reset Form
    setFormName('');
    setFormPrice(0);
    setFormCostPrice(0);
    setFormStock(0);
    setFormMinStock(3);
    setFormCategory('liquid');
    setFormDescription('');
    setFormSku('');
    setFormImageUrl('');
  };

  // Load form for editing
  const startEditProduct = (prod: DetergentProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(prod.price);
    setFormCostPrice(prod.costPrice || 0);
    setFormStock(prod.stock);
    setFormMinStock(prod.minStock);
    setFormCategory(prod.category);
    setFormDescription(prod.description);
    setFormSku(prod.sku || '');
    setFormImageUrl(prod.imageUrl || '');
  };

  // Delete product
  const deleteProduct = (id: string) => {
    if (window.confirm('Voulez-vous supprimer définitivement ce produit du catalogue ?')) {
      const updated = products.filter(p => p.id !== id);
      saveProductsToStorage(updated);
      showAlert('Produit Supprimé', 'Produit retiré du catalogue pressing.', 'success');
    }
  };

  // Quick Restock increment
  const quickRestock = (productId: string, units: number) => {
    const updated = products.map(p => p.id === productId ? { ...p, stock: p.stock + units } : p);
    saveProductsToStorage(updated);
    showAlert('Approvisionnement Réussi', `Stock approvisionné de +${units} unités !`, 'success');
  };

  // Print Sale/Detergent receipt PDF
  const handleDownloadSalePDF = (sale: DetergentSale, formatType: '80mm' | '58mm' = '80mm') => {
    const isQuote = sale.saleNumber.startsWith('D-QT') || sale.saleNumber.startsWith('DEV') || sale.saleNumber.includes('QT');
    const widthMm = formatType === '58mm' ? 58 : 80;
    const heightMm = formatType === '58mm' ? 145 : 140;
    const pdf = new jsPDF('p', 'mm', [widthMm, heightMm]);
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(formatType === '58mm' ? 8.5 : 10);
    
    let y = 10;
    const centerX = formatType === '58mm' ? 29 : 40;
    const lineStartX = formatType === '58mm' ? 3 : 5;
    const lineEndX = formatType === '58mm' ? 55 : 75;
    const linePadding = formatType === '58mm' ? 3 : 4;
    
    pdf.text(merchant.name || 'ACOM Pressing', centerX, y, { align: 'center' });
    y += 5;
    pdf.setFontSize(formatType === '58mm' ? 7 : 8);
    pdf.text(merchant.address || 'Service de Lavage Professionnel', centerX, y, { align: 'center' });
    y += 7;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 6;
    
    pdf.setFont('courier', 'bold');
    pdf.text(`${isQuote ? 'DEVIS CLIENT' : 'RECU CLIENT'} : ${sale.saleNumber}`, lineStartX, y);
    y += 5;
    pdf.setFont('courier', 'normal');
    pdf.text(`Client  : ${sale.customerName}`, lineStartX, y);
    y += 4;
    pdf.text(`Contact : ${sale.customerPhone || 'N/A'}`, lineStartX, y);
    y += 4;
    pdf.text(`Date    : ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}`, lineStartX, y);
    y += 5;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;

    pdf.setFont('courier', 'bold');
    pdf.text(isQuote ? 'Services & Produits' : 'Detergents & Produits', lineStartX, y);
    y += 5;
    pdf.setFont('courier', 'normal');

    sale.items.forEach(item => {
      pdf.text(`- ${item.productName.slice(0, formatType === '58mm' ? 10 : 14).padEnd(formatType === '58mm' ? 10 : 14, ' ')} ${item.quantity}x : ${item.total} F`, lineStartX, y);
      y += 4;
    });

    y += 2;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;

    pdf.text(`Sous-total  : ${sale.subtotal} FCFA`, lineStartX, y);
    y += 4;
    if (sale.discount > 0) {
      pdf.text(`Remise accordé: -${sale.discount} FCFA`, lineStartX, y);
      y += 4;
    }
    
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(formatType === '58mm' ? 8.5 : 10);
    pdf.text(`${isQuote ? 'TOTAL ESTIME' : 'TOTAL PAYE'}  : ${sale.total} FCFA`, lineStartX, y);
    y += 7;
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(formatType === '58mm' ? 7 : 8);
    pdf.text(isQuote ? 'Valable 15 jours.' : 'Merci de votre achat !', centerX, y, { align: 'center' });
    y += 4;
    pdf.text('ACOM Technologie Workspace', centerX, y, { align: 'center' });

    pdf.save(`${isQuote ? 'Devis' : 'Recu_Achat'}_Produit_${sale.saleNumber}_${formatType}.pdf`);
    showAlert(isQuote ? 'Devis Généré' : 'Reçu Généré', `Impression lancée... Le document PDF pour ${sale.customerName} au format ${formatType} a bien été généré et téléchargé !`, 'success');
  };

  // Print Sale/Detergent receipt A4 PDF as requested
  const handleDownloadSaleA4PDF = (sale: DetergentSale) => {
    const isQuote = sale.saleNumber.startsWith('D-QT') || sale.saleNumber.startsWith('DEV') || sale.saleNumber.includes('QT');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header Style
    pdf.setFillColor(30, 41, 59); // Dark blue grey matching #1e293b
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(merchant.name || 'ACOM Pressing', 20, 18);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Point de Vente Direct & Produits', 20, 25);
    pdf.text((merchant.address || 'Sénégal') + ' | ' + (merchant.phone || ''), 20, 31);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(isQuote ? 'DEVIS PROFORMA' : 'FACTURE DE VENTE', 190, 18, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`N° Réf: ${sale.saleNumber}`, 190, 25, { align: 'right' });
    pdf.text(`Date: ${new Date(sale.date).toLocaleDateString('fr-FR')}`, 190, 31, { align: 'right' });
    
    // Main Content
    pdf.setTextColor(30, 41, 59);
    
    // Bill To
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('CLIENT / ACHETEUR', 20, 55);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Nom: ${sale.customerName}`, 20, 62);
    pdf.text(`Téléphone: ${sale.customerPhone || 'Client de Passage'}`, 20, 68);
    
    // Table Header
    let y = 80;
    pdf.setFillColor(241, 245, 249); // light blue gray
    pdf.rect(20, y, 170, 8, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Description du Détergent', 25, y + 5.5);
    pdf.text('Qté', 115, y + 5.5, { align: 'center' });
    pdf.text('P.U (FCFA)', 145, y + 5.5, { align: 'right' });
    pdf.text('Total (FCFA)', 185, y + 5.5, { align: 'right' });
    
    pdf.setFont('helvetica', 'normal');
    y += 8;
    
    // Table Rows
    sale.items.forEach((item, index) => {
      // Row highlighting
      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(20, y, 170, 8, 'F');
      }
      pdf.text(item.productName, 25, y + 5.5);
      pdf.text(item.quantity.toString(), 115, y + 5.5, { align: 'center' });
      pdf.text(item.price.toLocaleString(), 145, y + 5.5, { align: 'right' });
      pdf.text(item.total.toLocaleString(), 185, y + 5.5, { align: 'right' });
      y += 8;
    });
    
    y += 5;
    pdf.line(20, y, 190, y);
    y += 8;
    
    // Totals
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sous-total:', 140, y);
    pdf.text(`${sale.subtotal.toLocaleString()} FCFA`, 185, y, { align: 'right' });
    y += 6;
    
    if (sale.discount > 0) {
      pdf.setFillColor(225, 29, 72); // rose dark
      pdf.text('Remise accordée:', 140, y);
      pdf.text(`-${sale.discount.toLocaleString()} FCFA`, 185, y, { align: 'right' });
      pdf.setTextColor(30, 41, 59);
      y += 6;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(isQuote ? 'TOTAL ESTIMÉ NET:' : 'TOTAL PAYÉ CAISSE:', 140, y);
    pdf.text(`${sale.total.toLocaleString()} FCFA`, 185, y, { align: 'right' });
    
    // Footer message
    y = 260;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(isQuote ? 'Ce devis est valable pendant 15 jours.' : 'Merci pour votre confiance & votre fidélité !', 105, y, { align: 'center' });
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Document généré numériquement via Acom Gestion Workspace', 105, y, { align: 'center' });
    
    pdf.save(`${isQuote ? 'Devis' : 'Facture_A4'}_Produit_${sale.saleNumber}.pdf`);
    showAlert(isQuote ? 'Devis A4 Généré' : 'Facture A4 Générée', `Le document A4 pour ${sale.customerName} a bien été généré en PDF ! N° Réf: ${sale.saleNumber}`, 'success');
  };

  // WhatsApp Client sending for DetergentQuote as requested
  const handleSendQuoteClientWhatsApp = (quote: DetergentQuote) => {
    if (!quote.customerPhone) {
      showAlert('Téléphone Manquant', "Veuillez renseigner le contact téléphone du client pour envoyer par WhatsApp.", 'warning');
      return;
    }
    
    const itemsList = quote.items
      .map(item => `• ${item.quantity}x ${item.productName} (${item.price} FCFA/u) = ${item.total} FCFA`)
      .join('\n');
      
    const textNotif = `🛒 *DEVIS PROFORMA BOUTIQUE - ${merchant.name || 'ACOM Pressing'}* ✅\n` +
           `--------------------------------\n` +
           `• N° Devis : *${quote.quoteNumber}*\n` +
           `• Client : *${quote.customerName}*\n` +
           `• Date : ${new Date(quote.date).toLocaleDateString('fr-FR')}\n` +
           `--------------------------------\n` +
           `*DÉTAILS DES ARTICLES :*\n` +
           `${itemsList}\n` +
           `--------------------------------\n` +
           `• Sous-total : ${quote.subtotal} FCFA\n` +
           (quote.discount > 0 ? `• Remise : ${quote.discount} FCFA\n` : '') +
           `• *TOTAL ESTIMÉ : ${quote.total} FCFA* 📋\n` +
           `--------------------------------\n` +
           `Ce devis est valable pendant 15 jours. Merci de votre confiance !`;
           
    let cleaned = quote.customerPhone.replace(/[^0-9]/g, '');
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      cleaned = '221' + cleaned;
    }
    
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = `https://${isMobile ? 'api' : 'web'}.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(textNotif)}`;
    window.open(waUrl, '_blank');
    showAlert('Message Prêt', 'Lien Message WhatsApp client prêt !', 'success');
  };

  // WhatsApp Client sending for DetergentSale as requested
  const handleSendSaleClientWhatsApp = (sale: DetergentSale) => {
    if (!sale.customerPhone) {
      showAlert('Téléphone Manquant', "Veuillez renseigner le contact téléphone du client pour envoyer par WhatsApp.", 'warning');
      return;
    }
    
    const itemsList = sale.items
      .map(item => `• ${item.quantity}x ${item.productName} (${item.price} FCFA/u) = ${item.total} FCFA`)
      .join('\n');
      
    const textNotif = `🛒 *REÇU CLIENT - ${merchant.name || 'ACOM Pressing'}* ✅\n` +
           `--------------------------------\n` +
           `• N° Facture : *${sale.saleNumber}*\n` +
           `• Client : *${sale.customerName}*\n` +
           `• Date : ${new Date(sale.date).toLocaleDateString('fr-FR')}\n` +
           `--------------------------------\n` +
           `*DÉTAILS DES ARTICLES :*\n` +
           `${itemsList}\n` +
           `--------------------------------\n` +
           `• Sous-total : ${sale.subtotal} FCFA\n` +
           (sale.discount > 0 ? `• Remise : ${sale.discount} FCFA\n` : '') +
           `• *TOTAL PAYÉ : ${sale.total} FCFA* 🎉\n` +
           `--------------------------------\n` +
           `Merci pour votre achat chez ${merchant.name || 'notre établissement'} ! À bientôt.`;
           
    let cleaned = sale.customerPhone.replace(/[^0-9]/g, '');
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      cleaned = '221' + cleaned;
    }
    
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = `https://${isMobile ? 'api' : 'web'}.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(textNotif)}`;
    window.open(waUrl, '_blank');
    showAlert('Message Prêt', 'Lien Message WhatsApp client prêt !', 'success');
  };

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  }, [products]);

  const totalStockQty = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  // Filters search product
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchStock = true;
      if (stockFilter === 'out_of_stock') {
        matchStock = p.stock <= 0;
      } else if (stockFilter === 'low') {
        matchStock = p.stock <= p.minStock && p.stock > 0;
      } else if (stockFilter === 'ok') {
        matchStock = p.stock > p.minStock;
      }
      return matchSearch && matchCat && matchStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  // Filters search quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return q.quoteNumber.toLowerCase().includes(query) ||
             q.customerName.toLowerCase().includes(query) ||
             (q.customerPhone && q.customerPhone.includes(query)) ||
             q.items.some(it => it.productName.toLowerCase().includes(query));
    });
  }, [quotes, searchQuery]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header section with low stock metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              🧪 Gestion du Stock & Vente Directe
            </h2>
            {outOfStockCount > 0 && (
              <span className="px-2.5 py-1 bg-red-50 text-red-600 font-bold text-[10px] uppercase rounded-full border border-red-200 animate-pulse flex items-center gap-1">
                🔴 {outOfStockCount} Rupture{outOfStockCount > 1 ? 's' : ''}
              </span>
            )}
            {lowStockCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 font-bold text-[10px] uppercase rounded-full border border-amber-200 animate-pulse">
                ⚠️ {lowStockCount} Stock Bas
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Approvisionnement des détergents et point de vente directe de produits nettoyants pour pressing.
          </p>
        </div>

        {/* Local Mini Tabs selector */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit border border-black/5 shrink-0 self-end lg:self-auto">
          <button
            onClick={() => { setActiveSubTab('sales'); setSelectedSale(null); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider tracking-wider transition-all duration-200 ${
              activeSubTab === 'sales' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            💸 Encaisser Vente
          </button>
          <button
            onClick={() => { setActiveSubTab('inventory'); setEditingProduct(null); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'inventory' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🧪 Stock Produits
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'history' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📜 Historique ({sales.length})
          </button>
          <button
            onClick={() => setActiveSubTab('quotes')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'quotes' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📋 Devis ({quotes.length})
          </button>
        </div>
      </div>

      {activeSubTab !== 'history' && activeSubTab !== 'quotes' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#fcfcf9] p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Valeur Marchande Stock</span>
                <span className="text-sm font-mono font-black text-ink">{(totalStockValue).toLocaleString()} F</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100 text-[#5c2197]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#fcfcf9] p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Unités en Stock</span>
                <span className="text-sm font-mono font-black text-[#5c2197]">{totalStockQty} u</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100 text-[#5c2197]">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#fcfcf9] p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Alertes Niveau Bas</span>
                <span className="text-sm font-mono font-black text-amber-500 flex items-center gap-1">
                  {lowStockCount} {lowStockCount > 0 && <span className="animate-pulse">⚠️</span>}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100 text-amber-500">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#fcfcf9] p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Alertes En Rupture</span>
                <span className="text-sm font-mono font-black text-rose-600 flex items-center gap-1">
                  {outOfStockCount} {outOfStockCount > 0 && <span className="animate-pulse">🔴</span>}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100 text-rose-500">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Unified Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-xs gap-4">
            <div className="flex gap-2 w-full md:w-auto items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, usage, code-barres..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-[#5c2197]/20 profile-search-input"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
                  >
                    ×
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSearchScanner(true)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c2197] hover:text-[#481977] transition-colors"
                    title="Scanner code-barres"
                  >
                    <ScanLine className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSearchScanner(true)}
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-colors uppercase tracking-wider shrink-0"
              >
                <ScanLine className="w-4 h-4" /> Scanner
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Rayon :</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-transparent focus:border-primary/20 rounded-2xl text-xs font-black uppercase tracking-wider text-[#1e293b] outline-none"
                >
                  <option value="all">Tous les Rayons (Catégories)</option>
                  {Object.entries(allCategories).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Niveau :</span>
                <select
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-transparent focus:border-primary/20 rounded-2xl text-xs font-black uppercase tracking-wider text-[#1e293b] outline-none"
                >
                  <option value="all">Tous les Etats</option>
                  <option value="out_of_stock">Rupture de Stock 🔴</option>
                  <option value="low">Stock Bas / Réassort ⚠️</option>
                  <option value="ok">Disponible en Stock ✅</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'sales' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* POS Catalog Left */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map(p => {
                const isUnderStock = p.stock <= p.minStock;
                const isOutOfStock = p.stock <= 0;
                return (
                  <div 
                    key={p.id} 
                    className={`bg-white rounded-3xl p-4 border shadow-sm transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-md ${
                      isOutOfStock ? 'opacity-75 border-rose-100 bg-gray-50/50' : isUnderStock ? 'border-amber-200 bg-amber-50/5' : 'border-gray-100'
                    }`}
                  >
                    <div>
                      {/* Beautiful product image banner */}
                      <div className="relative h-32 w-full mb-3 rounded-2xl overflow-hidden bg-white border border-slate-100 p-2">
                        <img 
                          src={p.imageUrl || DETERGENT_CATEGORY_IMAGES[p.category] || DETERGENT_CATEGORY_IMAGES['other']} 
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 bg-rose-500 text-white font-bold text-[8px] rounded uppercase shadow-sm">Rupture 🔴</span>
                          ) : isUnderStock ? (
                            <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[8px] rounded uppercase shadow-sm">Stock Bas ⚠️</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white font-bold text-[8px] rounded uppercase shadow-sm">Disponible</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 font-bold text-[9px] rounded uppercase tracking-wider">
                          {allCategories[p.category] || p.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-ink group-hover:text-primary transition-colors leading-snug">{p.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                        <div>
                          <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">Prix unitaire</p>
                          <p className="font-mono font-black text-sm text-primary">{p.price.toLocaleString()} F</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">Stock Restant</p>
                          <p className={`font-mono text-xs font-black ${isOutOfStock ? 'text-rose-600 font-black' : isUnderStock ? 'text-amber-600' : 'text-gray-800'}`}>
                            {p.stock} unités
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        disabled={isOutOfStock}
                        className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-gray-100 disabled:text-gray-400 font-bold text-xs uppercase tracking-wider text-white rounded-xl transition shadow shadow-primary/15 flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-4 h-4" /> Vendre cet article
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold text-xs">Aucun detergent ou produit ne correspond à ces critères.</p>
                </div>
              )}
            </div>
          </div>

          {/* POS Cart Sidebar Right */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Panier de Vente Directe</h4>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500" />

              {cart.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100/50 mx-auto">
                    <ShoppingCart className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-xs text-gray-400 font-bold">Sélectionnez des détergents à droite pour alimenter le panier.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product.id} className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[11px] font-black text-ink truncate leading-tight">{item.product.name}</h5>
                        <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">{(item.product.price).toLocaleString()} F/u</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 flex items-center justify-center text-xs hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-black px-1.5 min-w-[16px] text-center text-ink">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 flex items-center justify-center text-xs hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[70px] shrink-0">
                        <span className="font-mono font-black text-xs text-ink">{(item.product.price * item.quantity).toLocaleString()} F</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nom du client</label>
                      <input
                        type="text"
                        placeholder="Client de Passage"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold ring-offset-white border border-transparent focus:ring-1 focus:ring-primary/20 focus:border-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contact Téléphone</label>
                      <input
                        type="text"
                        placeholder="ex: 77 123 45 67"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold ring-offset-white border border-transparent focus:ring-1 focus:ring-primary/20 focus:border-primary/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Type de remise</label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percent')}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold ring-offset-white border border-transparent focus:ring-1 focus:ring-primary/20 outline-none"
                      >
                        <option value="amount">Fixe (FCFA)</option>
                        <option value="percent">Taux (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">{discountType === 'percent' ? 'Valeur (%)' : 'Remise immédiate (FCFA)'}</label>
                      <input
                        type="number"
                        placeholder={discountType === 'percent' ? "ex: 10" : "Remise immédiate"}
                        value={discountValue || ''}
                        onChange={e => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl font-mono text-xs font-bold ring-offset-white border border-transparent focus:ring-1 focus:ring-primary/20 outline-none text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#fbfbf9] p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                      <span>Total brut articles :</span>
                      <span className="font-mono">{(cartSubtotal).toLocaleString()} FCFA</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-[10px] text-rose-500 font-bold">
                        <span>Remise octroyée :</span>
                        <span className="font-mono">-{discountAmount.toLocaleString()} FCFA</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-ink font-black pt-2 border-t border-gray-100">
                      <span>Total Net Encaissé :</span>
                      <span className="text-sm font-mono text-primary font-black">{(cartTotal).toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="submit"
                      className="py-3.5 bg-[#1e293b] hover:bg-black font-bold text-xs uppercase tracking-widest text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      🛒 Encaisser
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateQuote}
                      className="py-3.5 bg-indigo-50 hover:bg-slate-200 hover:text-indigo-700 font-extrabold text-xs uppercase tracking-widest text-indigo-600 border border-indigo-100 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      📋 Etablissez DEVIS
                    </button>
                  </div>
                </form>
              )}

              {selectedSale && (
                <div className="flex flex-col gap-5">
                  {/* Real Paper Receipt Simulator style ticket */}
                  <div className="space-y-4 font-mono text-[11px] text-gray-700 leading-relaxed bg-[#fbfbf9] p-5 rounded-2xl border border-dashed border-gray-200 shadow-inner">
                    <div className="text-center pb-3 border-b border-dashed border-gray-200">
                      <p className="font-black text-xs uppercase tracking-wider text-ink block">{merchant.name || 'ACOM'}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{merchant.address || 'Touba Mbacké'}</p>
                    </div>

                    <div className="space-y-1 text-gray-500">
                      <p className="text-gray-950 font-black">
                        {selectedSale.saleNumber.startsWith('DEV') ? `N° de Devis : ${selectedSale.saleNumber}` : `N° d'enregistrement : ${selectedSale.saleNumber}`}
                      </p>
                      <p>Client : <span className="text-ink font-bold">{selectedSale.customerName || 'Client de Passage'}</span></p>
                      <p>Contact : <span className="text-ink font-bold">{selectedSale.customerPhone || 'N/A'}</span></p>
                      <p>Date : <span className="font-bold">{selectedSale.date || new Date().toISOString().split('T')[0]}</span></p>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3">
                      <p className="font-bold uppercase text-ink mb-1.5 text-xs">PRESTATIONS :</p>
                      <div className="space-y-1">
                        {selectedSale.items.map(item => (
                          <div key={item.productId} className="flex justify-between">
                            <span>- {item.productName} x{item.quantity}</span>
                            <span className="font-bold">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-500 text-[10px]">
                        <span>Sous-total prestations :</span>
                        <span className="font-bold">{(selectedSale.subtotal || selectedSale.total).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-[10px]">
                        <span>Total suppléments :</span>
                        <span className="font-bold">0 FCFA</span>
                      </div>
                      {selectedSale.discount > 0 && (
                        <div className="flex justify-between text-red-500 text-[10px]">
                          <span>Remise octroyée :</span>
                          <span>-{selectedSale.discount.toLocaleString()} FCFA</span>
                        </div>
                      )}
                      <div className="flex justify-between text-ink font-black pt-1.5 border-t border-gray-200 text-sm">
                        <span>{selectedSale.saleNumber.startsWith('DEV') ? 'Montant Devis :' : 'Net à Payer :'}</span>
                        <span className="text-[#5c2197] font-black text-sm">{(selectedSale.total).toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <div className="border-t border-dotted border-gray-200 pt-1.5 space-y-0.5 mt-1 text-[10px]">
                      <div className="flex justify-between text-gray-500 text-[9px] font-bold">
                        <span>Règlement :</span>
                        <span>PAYÉ EN CAISSE ✅</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 text-[9px] font-bold">
                        <span className="text-[#10b981]">Montant Versé :</span>
                        <span>{(selectedSale.total).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-rose-500 text-[9px] font-extrabold">
                        <span>Reste dû :</span>
                        <span>0 FCFA</span>
                      </div>
                    </div>

                    <div className="text-center pt-3 border-t border-dashed border-gray-200 text-[9px] text-gray-400 space-y-1">
                      <p className="font-bold text-ink">Merci de votre confiance !</p>
                      <p>Ticket requis pour toute réclamation.</p>
                    </div>
                  </div>

                  {/* Cohesive Purple Action Box */}
                  <div className="flex flex-col gap-2.5 bg-[#faf5ff] p-5 rounded-2xl border border-purple-100 shadow-inner">
                    <p className="text-xs font-black text-[#5c2197] text-center animate-pulse">🎉 Nouveau ticket enregistré : {selectedSale.saleNumber}</p>
                    
                    {/* Print buttons grid */}
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => printDetergentSaleDirect(merchant, selectedSale, '80mm', handleDownloadSalePDF)}
                        className="bg-[#1e293b] hover:bg-black text-white font-bold text-[9px] py-3 rounded-xl flex items-center justify-center gap-1 transition text-center shadow-sm cursor-pointer"
                        title="Imprimer direct Roll 80mm"
                      >
                        <Printer className="w-3.5 h-3.5" /> Roll (80)
                      </button>
                      <button
                        type="button"
                        onClick={() => printDetergentSaleDirect(merchant, selectedSale, '58mm', handleDownloadSalePDF)}
                        className="bg-[#4b5563] hover:bg-gray-800 text-white font-bold text-[9px] py-3 rounded-xl flex items-center justify-center gap-1 transition text-center shadow-sm cursor-pointer"
                        title="Imprimer direct Roll 58mm"
                      >
                        <Printer className="w-3.5 h-3.5" /> Roll (58)
                      </button>
                      <button
                        type="button"
                        onClick={() => printDetergentSaleDirect(merchant, selectedSale, 'A4', handleDownloadSaleA4PDF)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] py-3 rounded-xl flex items-center justify-center gap-1 transition text-center shadow-sm cursor-pointer"
                        title="Imprimer direct A4"
                      >
                        <FileText className="w-3.5 h-3.5" /> Format A4
                      </button>
                    </div>

                    {/* Actions Area */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadSalePDF(selectedSale)}
                        className="py-2 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm border border-gray-200 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Télécharger PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSaleClientWhatsApp(selectedSale)}
                        className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Client
                      </button>
                    </div>

                    {/* Supervisor notifications */}
                    <div className="border-t border-indigo-200/50 mt-1.5 pt-2">
                      <p className="text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-widest text-center flex items-center justify-center gap-1.5 mb-1.5">
                        <span>📧</span> SUIVI TEMPS RÉEL DU GÉRANT (VENTE / STOCK)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => dispatchManagerSaleNotif(selectedSale, 'whatsapp')}
                          className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp Gérant
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatchManagerSaleNotif(selectedSale, 'email')}
                          className="py-1.5 px-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <Mail className="w-3 h-3 text-indigo-600" /> E-mail Gérant
                        </button>
                      </div>
                      {saleMailFeedback[selectedSale.id] && (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600 font-semibold bg-emerald-50 p-1.5 rounded-lg justify-center border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Ce mail envoyé en arrière-plan avec succès !
                        </div>
                      )}
                      {autoEmailManager && managerEmail ? (
                        <p className="text-[8px] text-emerald-600 font-bold font-mono text-center mt-1">
                          📨 Rapport automatique expédié en arrière-plan à {managerEmail}
                        </p>
                      ) : (
                        <p className="text-[8px] text-gray-400 font-bold font-mono text-center mt-1">
                          ⚠️ Mail automatique inactif ou adresse non configurée
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reset form for a fresh client order */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSale(null);
                        setCart([]);
                        setDiscountValue(0);
                        setDiscountType('amount');
                        setCustomerName('');
                        setCustomerPhone('');
                      }}
                      className="w-full py-4 px-6 bg-[#ff1f59] hover:bg-[#e0144c] text-white font-extrabold text-xs md:text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg cursor-pointer animate-none"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>COMMENCER UN NOUVEAU CLIENT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'inventory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Creator form Drawer Left */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-md font-black text-ink pb-2 border-b border-gray-100 flex items-center gap-1.5">
              {editingProduct ? '📝 Éditer le Detergent' : '🧪 Référencer un Détergent'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom du détergent</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Lessive Liquide Eucalyptus 1.5L"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-primary/25 bg-gray-50/30 text-xs font-bold text-ink"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1 flex justify-between items-center">
                  <span>Code-barres / SKU (Optionnel)</span>
                  <button
                    type="button"
                    onClick={() => setShowFormSkuScanner(true)}
                    className="text-[11px] text-primary hover:text-primary-hover font-extrabold flex items-center gap-1.5 uppercase bg-primary/15 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-xs border border-primary/10"
                  >
                    <ScanLine className="w-3.5 h-3.5 animate-pulse" /> Scanner
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ex: 123456789123"
                    value={formSku}
                    onChange={e => setFormSku(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-primary/25 bg-gray-50/30 text-xs font-mono font-bold text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormSkuScanner(true)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors"
                    title="Ouvrir l'appareil de scan"
                  >
                    <ScanLine className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Prix Vente (FCFA)</label>
                  <input
                    type="number"
                    required
                    placeholder="3500"
                    value={formPrice || ''}
                    onChange={e => setFormPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-primary/25 bg-gray-50/30 text-xs font-mono font-bold text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono font-bold text-amber-500 uppercase tracking-widest mb-1">Coût par unité</label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={formCostPrice || ''}
                    onChange={e => setFormCostPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-dashed border-amber-200 outline-none focus:ring-1 focus:ring-amber-300 bg-amber-50/30 text-xs font-mono font-bold text-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Rayon / Catégorie</label>
                  {!isAddingNewCategory ? (
                    <select
                      value={formCategory}
                      onChange={e => {
                        if (e.target.value === 'ADD_NEW_CATEGORY') {
                          setIsAddingNewCategory(true);
                          setNewCategoryLabelInput('');
                        } else {
                          setFormCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-black text-ink uppercase outline-none focus:ring-1 focus:ring-primary/25"
                    >
                      {Object.entries(allCategories).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                      <option value="ADD_NEW_CATEGORY" className="text-primary font-bold">+ ➕ AJOUTER UNE CATÉGORIE</option>
                    </select>
                  ) : (
                    <div className="flex flex-col gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                      <input
                        type="text"
                        placeholder="Nom de la catégorie (ex: Désodorisant)"
                        value={newCategoryLabelInput}
                        onChange={e => setNewCategoryLabelInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-ink outline-none"
                        autoFocus
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewCategory(false);
                            setFormCategory('liquid');
                          }}
                          className="px-2 py-1 text-[9px] font-mono font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-md uppercase tracking-wider transition"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newCategoryLabelInput.trim();
                            if (trimmed) {
                              const newCatKey = `custom_${Date.now()}`;
                              const updated = { ...customCategories, [newCatKey]: trimmed };
                              setCustomCategories(updated);
                              localStorage.setItem(`pressing_custom_categories_${merchant.id}`, JSON.stringify(updated));
                              setFormCategory(newCatKey);
                              setIsAddingNewCategory(false);
                              showAlert('Catégorie Créée', `La catégorie de rayon "${trimmed}" a été ajoutée avec succès !`, 'success');
                            } else {
                              showAlert('Nom Invalide', "Veuillez entrer un nom valide.", 'warning');
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-mono font-bold text-white bg-[#1e293b] hover:bg-black rounded-md uppercase tracking-wider transition"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  )}
                  {Object.keys(customCategories).length > 0 && (
                    <div className="mt-2 text-left">
                      <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Catégories Perso (cliquer sur × pour supprimer) :
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-gray-50/50 rounded-lg border border-dashed border-gray-100">
                        {Object.entries(customCategories).map(([key, label]) => (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-white border border-gray-200 text-gray-700 rounded text-[9px] font-bold"
                          >
                            {label}
                            <button
                              type="button"
                              onClick={() => deleteCustomCategory(key)}
                              className="text-gray-400 hover:text-red-500 font-extrabold text-xs ml-0.5 transition"
                              title="Supprimer cette catégorie"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Stock Initial</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formStock || ''}
                    onChange={e => setFormStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-primary/25 bg-gray-50/30 text-xs font-mono font-bold text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Seuil Alerte</label>
                  <input
                    type="number"
                    placeholder="3"
                    value={formMinStock || ''}
                    onChange={e => setFormMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-primary/25 bg-gray-50/30 text-xs font-mono font-bold text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Brève Description d'usage</label>
                <textarea
                  rows={2}
                  placeholder="Informations ou dosage du produit..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-primary/25 bg-gray-50/30 text-xs font-medium text-gray-600"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Illustration / Image du Produit (Optionnel)</label>
                <div className="flex flex-col sm:flex-row gap-3 items-center bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                  <div className="relative w-16 h-16 rounded-2xl bg-white border border-gray-200/60 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-3xs group/pimg">
                    {formImageUrl ? (
                      <>
                        <img 
                          src={formImageUrl} 
                          alt="Aperçu" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:scale-105 active:scale-95 transition"
                          title="Supprimer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-1 w-full h-full cursor-pointer relative bg-slate-50">
                        <Upload className="w-4 h-4 text-gray-400 group-hover/pimg:text-primary transition" />
                        <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Joindre</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setFormImageUrl(base64);
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-1.5 text-left">
                    <input
                      type="url"
                      placeholder="Collez un lien d'image direct..."
                      value={formImageUrl}
                      onChange={e => setFormImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-primary/25 bg-white text-[10px] font-mono"
                    />
                    <span className="block text-[7px] text-gray-400 font-bold">Sélectionnez un fichier image local OU collez un lien Unsplash/Web.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-50 flex gap-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setFormName('');
                      setFormPrice(0);
                      setFormCostPrice(0);
                      setFormStock(0);
                      setFormMinStock(3);
                      setFormCategory('liquid');
                      setFormDescription('');
                      setFormSku('');
                      setFormImageUrl('');
                    }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs uppercase text-gray-600 transition"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md"
                >
                  {editingProduct ? 'Enregistrer Modif.' : 'Créer l\'Article'}
                </button>
              </div>
            </form>
          </div>

          {/* Listings Table Right */}
          <div className="lg:col-span-8 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden space-y-4">
            <h3 className="text-md font-black text-ink uppercase tracking-wider">Catalogue & Niveau de Stock</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                    <th className="px-6 py-4">Nom du produit</th>
                    <th className="px-6 py-4">Rayon</th>
                    <th className="px-6 py-4 text-right">Prix Habituel</th>
                    <th className="px-6 py-4 text-center">Niveau de Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action Approvisionneur</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredProducts.map(p => {
                    const isUnderStock = p.stock <= p.minStock;
                    const isOutOfStock = p.stock <= 0;
                    const isEditingThis = editingProduct?.id === p.id;
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50/30 transition-all ${isEditingThis ? 'bg-primary/5 border-l-2 border-l-primary font-bold' : ''}`}>
                        <td className="px-6 py-3 font-bold">
                          <div className="flex items-center gap-3">
                            <img 
                              src={p.imageUrl || DETERGENT_CATEGORY_IMAGES[p.category] || DETERGENT_CATEGORY_IMAGES['other']} 
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-contain border border-slate-200/60 bg-white p-0.5 flex-shrink-0 shadow-3xs"
                            />
                            <div>
                              <div className="font-bold text-ink text-xs">{p.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium limit-1 max-w-[200px] truncate">{p.description}</div>
                              {p.sku && (
                                <div className="text-[9px] font-mono font-bold text-primary mt-1 flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-md w-fit">
                                  <ScanLine className="w-2.5 h-2.5" /> {p.sku}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-black text-[9px] uppercase tracking-wider">
                            {allCategories[p.category] || p.category}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-ink">{(p.price).toLocaleString()} F</td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-xs text-ink">{p.stock} u</span>
                            <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full rounded-full ${isOutOfStock ? 'bg-red-500' : isUnderStock ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (p.stock / (p.minStock * 4)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {isOutOfStock ? (
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider">Rupture ⛔</span>
                          ) : isUnderStock ? (
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Réassort 🚨</span>
                          ) : (
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Sain OK</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => quickRestock(p.id, 5)}
                              className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[9px] rounded uppercase tracking-wider transition"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => quickRestock(p.id, 15)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] rounded uppercase tracking-wider transition"
                            >
                              +15
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => startEditProduct(p)}
                            className="p-1 px-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(p.id)}
                            className="p-1 px-1.5 hover:bg-red-50 text-red-500 rounded"
                            title="Retirer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400 font-bold text-xs bg-gray-50/20">
                        Aucun detergent ou produit ne correspond à ces critères de recherche ou de filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'history' ? (
        /* Sales history listings subtab */
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-ink uppercase tracking-wider">Historique de Ventes Produits</h3>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Ventes directes détergent</span>
          </div>

          {sales.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-xs">Aucune vente directe enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest bg-gray-50/40">
                    <th className="px-6 py-4">N° Transaction</th>
                    <th className="px-6 py-4">Date de Vente</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Articles achetés</th>
                    <th className="px-6 py-4 text-right">Remise</th>
                    <th className="px-6 py-4 text-right">Recette Net</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition cursor-pointer" onClick={() => setViewingSale(s)}>
                      <td className="px-6 py-4 font-mono font-black text-ink">{s.saleNumber}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{format(new Date(s.date), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-6 py-4 font-bold">
                        <div>{s.customerName}</div>
                        <div className="text-[10px] text-gray-400">{s.customerPhone || 'Sans contact'}</div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="truncate font-bold text-gray-600">
                          {s.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-500">{s.discount.toLocaleString()} F</td>
                      <td className="px-6 py-4 text-right font-mono font-black text-primary">{(s.total).toLocaleString()} F</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          {/* Split Print Custom Buttons inside Vente & Stock */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); printDetergentSaleDirect(merchant, s, '80mm', handleDownloadSalePDF); }}
                            className="px-2 py-1 bg-[#1a2333] hover:bg-black text-white font-bold text-[9px] uppercase tracking-widest rounded-lg transition flex items-center gap-1"
                            title="Imprimer direct Caisse (80mm)"
                          >
                            <Printer className="w-3 h-3" /> Roll (80)
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); printDetergentSaleDirect(merchant, s, '58mm', handleDownloadSalePDF); }}
                            className="px-2 py-1 bg-[#4b5563] hover:bg-gray-800 text-white font-bold text-[9px] uppercase tracking-widest rounded-lg transition flex items-center gap-1"
                            title="Imprimer direct Caisse (58mm)"
                          >
                            <Printer className="w-3 h-3" /> Roll (58)
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); printDetergentSaleDirect(merchant, s, 'A4', handleDownloadSaleA4PDF); }}
                            className="px-2.5 py-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-[9px] uppercase tracking-widest rounded-lg transition flex items-center gap-1"
                            title="Imprimer direct Facture (A4)"
                          >
                            <FileText className="w-3 h-3" /> A4 Client
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); dispatchManagerSaleNotif(s, 'whatsapp'); }}
                            className="px-2 py-1.5 bg-[#e6fbf2] hover:bg-[#d1fae5] text-[#047857] border border-[#a7f3d0] font-bold text-[9px] uppercase tracking-widest rounded-lg transition flex items-center gap-1"
                            title="Relayer au gérant par WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" /> WA
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); dispatchManagerSaleNotif(s, 'email'); }}
                            className="px-2 py-1.5 bg-[#eef2ff] hover:bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe] font-bold text-[9px] uppercase tracking-widest rounded-lg transition flex items-center gap-1"
                            title="Relayer au gérant par Mail"
                          >
                            <Mail className="w-3 h-3" /> Mail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeSubTab === 'quotes' ? (
        /* Quotes history listings subtab */
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-black text-ink uppercase tracking-wider flex items-center gap-2">
              📋 Devis Proforma Vente Directe
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Chercher N° Ticket, Client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-sm">Aucun devis proforma correspondant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest bg-gray-50/40">
                    <th className="px-6 py-4">N° Devis</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Émission</th>
                    <th className="px-6 py-4">Facturation</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Action Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredQuotes.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50/80 transition group">
                      <td className="px-6 py-4 font-mono font-black text-ink">{q.quoteNumber}</td>
                      <td className="px-6 py-4 font-bold">
                        <div>{q.customerName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{q.customerPhone || 'Aucun contact'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">
                        <div>{format(new Date(q.date), 'yyyy-MM-dd')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-indigo-50 border border-indigo-100/40 text-indigo-600 font-bold text-[9px] rounded-lg">
                          Articles ({q.items.reduce((acc, item) => acc + item.quantity, 0)})
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <div className="font-bold text-ink">{(q.total).toLocaleString()} FCFA</div>
                        <div className="mt-1">
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded border border-indigo-100/40">DEVIS</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleConvertQuoteToCart(q)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] tracking-wider rounded-lg px-3 py-1.5 shadow-sm inline-flex items-center cursor-pointer"
                        >
                          Convertir Panier
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingQuote(q)}
                          className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-[9px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Détails"
                        >
                          <Eye className="w-3 h-3" /> Détails
                        </button>
                        <button
                          type="button"
                          onClick={() => printDetergentQuoteDirect(merchant, q, '80mm')}
                          className="p-1 px-2.5 bg-[#5c2197] text-white rounded-lg hover:bg-[#481977] font-bold text-[9px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Imprimer Devis (80mm)"
                        >
                          <Printer className="w-3 h-3" /> Roll (80mm)
                        </button>
                        <button
                          type="button"
                          onClick={() => printDetergentQuoteDirect(merchant, q, 'A4')}
                          className="p-1 px-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-[9px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Imprimer Format A4"
                        >
                          <FileText className="w-3 h-3" /> A4
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuote(q.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg group-hover:opacity-100 transition inline-flex items-center cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Scanner Modals for Pressing */}
      <ScannerModal
        isOpen={showFormSkuScanner}
        onClose={() => setShowFormSkuScanner(false)}
        onScanSuccess={(code) => {
          setFormSku(code);
          setShowFormSkuScanner(false);
          showAlert('Code Scanné', `Code-barres associé : ${code}`, 'success');
        }}
        title="Scanner le code-barres de l'article"
      />

      <ScannerModal
        isOpen={showSearchScanner}
        onClose={() => setShowSearchScanner(false)}
        onScanSuccess={(code) => {
          setSearchQuery(code);
          setShowSearchScanner(false);
          const matched = products.find(p => p.sku && p.sku.trim().toLowerCase() === code.trim().toLowerCase());
          if (matched) {
            triggerAcomAlert('Produit Trouvé', `Produit : ${matched.name} (${matched.stock}u restants)`, 'success', 'SUCCÈS');
          } else {
            triggerAcomAlert('Non Référencé', `Aucun détergent ou produit n'est associé au code : ${code}. Le code a été pré-rempli dans le formulaire de création.`, 'info', 'ALERTE');
            // Populate form code to help them create it right away!
            setFormSku(code);
            setActiveSubTab('inventory');
          }
        }}
        title="Rechercher par Code-barres / SKU"
      />

      {viewingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setViewingSale(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#111827] to-[#1f2937] text-white p-6 relative">
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-[10px] font-mono tracking-widest text-[#6366f1] font-bold uppercase mb-1">Détails de la vente de boutique</div>
              <h3 className="text-xl font-black">{viewingSale.saleNumber}</h3>
              <p className="text-xs text-slate-300 mt-1">Transaction directe - Boutique & Produits</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Customer info */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-left">
                <div>
                  <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Acheteur</span>
                  <span className="font-bold text-sm text-ink">{viewingSale.customerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Téléphone</span>
                    <span className="font-bold text-xs text-ink font-mono">{viewingSale.customerPhone || 'Client de Passage'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date & Heure</span>
                    <span className="font-mono text-xs text-ink font-bold">{new Date(viewingSale.date).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-left">
                <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Articles Achetés</span>
                <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {viewingSale.items.map((it, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-black text-ink">{it.productName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{it.price.toLocaleString()} F x {it.quantity}</p>
                      </div>
                      <span className="font-mono font-black text-ink">{(it.price * it.quantity).toLocaleString()} F</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
                <div className="flex justify-between text-xs text-gray-500 font-bold">
                  <span>Sous-total articles :</span>
                  <span className="font-mono">{viewingSale.subtotal.toLocaleString()} FCFA</span>
                </div>
                {viewingSale.discount > 0 && (
                  <div className="flex justify-between text-xs text-rose-500 font-bold">
                    <span>Remise accordée :</span>
                    <span className="font-mono">-{viewingSale.discount.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-ink font-black pt-2 border-t border-slate-200">
                  <span>TOTAL PAYÉ NET :</span>
                  <span className="font-mono text-primary font-black">{viewingSale.total.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                {/* Roll 80mm */}
                <button
                  type="button"
                  onClick={() => printDetergentSaleDirect(merchant, viewingSale, '80mm', handleDownloadSalePDF)}
                  className="py-3 px-1.5 bg-[#1a2333] hover:bg-black text-white text-[9.5px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Rouleau 80mm"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Roll (80)</span>
                </button>

                {/* Roll 58mm */}
                <button
                  type="button"
                  onClick={() => printDetergentSaleDirect(merchant, viewingSale, '58mm', handleDownloadSalePDF)}
                  className="py-3 px-1.5 bg-[#4b5563] hover:bg-gray-800 text-white text-[9.5px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Rouleau 58mm"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Roll (58)</span>
                </button>

                {/* Client A4 */}
                <button
                  type="button"
                  onClick={() => printDetergentSaleDirect(merchant, viewingSale, 'A4', handleDownloadSaleA4PDF)}
                  className="py-3 px-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[9.5px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>Client A4</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp client */}
                <button
                  type="button"
                  onClick={() => handleSendSaleClientWhatsApp(viewingSale)}
                  className="py-2.5 px-3 bg-[#e6fbf2] hover:bg-[#d1fae5] text-[#047857] border border-[#a7f3d0] text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WA Client</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setViewingSale(null)}
                  className="py-2.5 px-3 bg-white hover:bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-black rounded-lg flex items-center justify-center transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {viewingQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5c2197] to-[#481977] text-white p-6 relative text-left">
              <button
                type="button"
                onClick={() => setViewingQuote(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase mb-1">Devis Proforma Vente Directe</div>
              <h3 className="text-xl font-black">{viewingQuote.quoteNumber}</h3>
              <p className="text-xs text-slate-300 mt-1">Géré par la boutique professionnelle ACOM</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Client info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left">
                <div>
                  <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Client</span>
                  <span className="font-bold text-sm text-ink">{viewingQuote.customerName}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Téléphone / Contact</span>
                  <span className="font-bold text-sm text-ink font-mono">{viewingQuote.customerPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</span>
                  <span className="font-bold text-xs text-ink break-all font-mono">{viewingQuote.customerEmail || 'Non spécifié'}</span>
                </div>
              </div>

              {/* Dates & Notes */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Date de dépôt</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {new Date(viewingQuote.date).toISOString().split('T')[0]}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Retrait prévu ⚠️</span>
                  <span className="font-mono text-xs text-indigo-700 bg-indigo-50 font-bold px-2 py-1 rounded">
                    Non spécifié
                  </span>
                </div>
              </div>

              {viewingQuote.notes && (
                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-left">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-1">Observations / Remarques :</span>
                  <p className="text-xs text-amber-900 font-medium">{viewingQuote.notes}</p>
                </div>
              )}

              {/* Prestations */}
              <div className="space-y-2 text-left">
                <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Détail des Prestations</span>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                  {viewingQuote.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between p-3 text-xs">
                      <span className="capitalize font-medium text-ink">- {it.productName} <span className="text-gray-400 font-mono">x{it.quantity}</span></span>
                      <span className="font-mono font-bold text-ink">{(it.total).toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="pt-3 border-t border-dashed border-gray-200 space-y-1.5 font-mono text-xs text-left">
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Sous-total prest. :</span>
                  <span>{viewingQuote.subtotal.toLocaleString()} FCFA</span>
                </div>
                {viewingQuote.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Remise accordée :</span>
                    <span>-{viewingQuote.discount.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-100">
                  <span>Montant Devis :</span>
                  <span>{viewingQuote.total.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* 🔔 Module de Suivi & Notifications en Temps Réel */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <h4 className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 text-left">
                    <span>🔔</span> Suivi & Relance Client (Temps Réel)
                  </h4>
                  <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full uppercase">
                    WhatsApp & Mail
                  </span>
                </div>

                {/* Destinataires variables */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Téléphone/WhatsApp</label>
                    <input
                      type="text"
                      placeholder="N° de téléphone"
                      value={editedQuotePhone}
                      onChange={e => setEditedQuotePhone(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono font-semibold rounded-lg border border-gray-200 focus:ring-1 focus:ring-indigo-500 bg-white text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Adresse E-mail</label>
                    <input
                      type="email"
                      placeholder="Adresse email client"
                      value={editedQuoteEmail}
                      onChange={e => setEditedQuoteEmail(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono font-semibold rounded-lg border border-gray-200 focus:ring-1 focus:ring-indigo-500 bg-white text-ink"
                    />
                  </div>
                </div>

                {/* Template quick selects */}
                <div className="text-left">
                  <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sélectionner un modèle :</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.keys(QUOTE_NOTIFICATION_TEMPLATES).map(key => {
                      const template = QUOTE_NOTIFICATION_TEMPLATES[key as keyof typeof QUOTE_NOTIFICATION_TEMPLATES];
                      const isSelected = selectedQuoteNotifTemplate === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setSelectedQuoteNotifTemplate(key as any)}
                          className={`p-2 text-left rounded-xl border text-[10px] font-bold transition-all relative ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white hover:bg-gray-100 text-slate-700 border-gray-200'
                          }`}
                        >
                          <span className="block truncate">{template.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview Editor */}
                <div className="text-left">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider">Aperçu du message à envoyer :</label>
                    <span className="text-[8px] font-mono text-gray-400 font-semibold">({quoteNotifMessage.length} caract.)</span>
                  </div>
                  <textarea
                    value={quoteNotifMessage}
                    onChange={e => setQuoteNotifMessage(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 outline-none leading-relaxed text-ink"
                  />
                </div>

                {/* Action Dispatchers */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Send WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!editedQuotePhone.trim()) {
                        showAlert('Téléphone Requis', 'Veuillez renseigner un numéro de téléphone.', 'warning');
                        return;
                      }
                      let cleaned = editedQuotePhone.replace(/[^0-9]/g, '');
                      if (cleaned.length === 9 && cleaned.startsWith('7')) {
                        cleaned = '221' + cleaned;
                      }
                      
                      const waUrl = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(quoteNotifMessage)}`;
                      window.open(waUrl, '_blank');
                      
                      logQuoteNotificationSent('whatsapp', selectedQuoteNotifTemplate, quoteNotifMessage);
                      showAlert('Lien Généré', 'Le lien de suivi WhatsApp client a bien été généré !', 'success');
                    }}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm border border-emerald-500 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Suivi par WhatsApp
                  </button>

                  {/* Send Email Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!editedQuoteEmail.trim()) {
                        showAlert('E-mail Requis', 'Veuillez renseigner une adresse e-mail valide.', 'warning');
                        return;
                      }
                      const subject = QUOTE_NOTIFICATION_TEMPLATES[selectedQuoteNotifTemplate]?.subject || 'Suivi Pressing';
                      const mailtoUrl = `mailto:${editedQuoteEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(quoteNotifMessage)}`;
                      window.open(mailtoUrl, '_blank');
                      
                      logQuoteNotificationSent('email', selectedQuoteNotifTemplate, quoteNotifMessage);
                      showAlert('Messagerie Ouverte', 'Le message de relance client a bien été généré et ouvert dans votre application mail !', 'success');
                    }}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm border border-indigo-500 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> Suivi par Email
                  </button>
                </div>

                {/* Timeline Logs inside the modal */}
                {viewingQuote.sentNotifications && viewingQuote.sentNotifications.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-left">
                    <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">Historique des envois :</span>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                      {viewingQuote.sentNotifications.map((l, idx) => (
                        <div key={l.id || idx} className="flex items-start justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-100 text-[10px] font-medium text-slate-600">
                          <span className="flex items-center gap-1 shrink-0 truncate max-w-[210px]">
                            {l.type === 'whatsapp' ? '🟢 WhatsApp :' : '🔵 Email :'} <strong className="font-bold text-slate-800">{l.templateName}</strong>
                          </span>
                          <span className="text-[8px] font-mono text-gray-400 shrink-0">
                            {new Date(l.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 👑 Relais en Temps Réel au Gérant */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/40 pb-2">
                  <h4 className="text-[11px] font-mono font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-1.5">
                    <span>👑</span> Relais Temps Réel Gérant
                  </h4>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono uppercase">
                    Manager Alert
                  </span>
                </div>

                <p className="text-[10px] text-gray-500 leading-relaxed font-semibold text-left">
                  Notification formatée envoyée au Gérant pour le suivi des <strong className="text-indigo-600 font-bold">entrées et les sorties (depuis la distance)</strong>.
                </p>

                <div className="grid grid-cols-2 gap-2 pb-1 bg-white p-2.5 rounded-xl border border-indigo-100/50">
                  <div className="col-span-2 text-[9px] font-mono font-black text-indigo-700 uppercase tracking-wider mb-0.5 text-center">
                    📥 ENTRÉE (Dépôt Enregistré)
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatchManagerQuoteNotif(viewingQuote, 'entrée', 'whatsapp')}
                    className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchManagerQuoteNotif(viewingQuote, 'entrée', 'email')}
                    className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <Mail className="w-3 h-3" /> E-mail
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-indigo-100/50">
                  <div className="col-span-2 text-[9px] font-mono font-black text-indigo-700 uppercase tracking-wider mb-0.5 text-center">
                    👔 SORTIE (Prêt / Livré)
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatchManagerQuoteNotif(viewingQuote, 'sortie', 'whatsapp')}
                    className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchManagerQuoteNotif(viewingQuote, 'sortie', 'email')}
                    className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <Mail className="w-3 h-3" /> E-mail
                  </button>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={() => printDetergentQuoteDirect(merchant, viewingQuote, '80mm')}
                className="flex-1 bg-[#5c2197] hover:bg-[#481977] text-white font-bold text-[10px] sm:text-[11px] py-3 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Roll (80)
              </button>
              <button
                type="button"
                onClick={() => printDetergentQuoteDirect(merchant, viewingQuote, '58mm')}
                className="flex-1 bg-[#7b2cbe] hover:bg-[#6a24aa] text-white font-bold text-[10px] sm:text-[11px] py-3 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Roll (58)
              </button>
              <button
                type="button"
                onClick={() => printDetergentQuoteDirect(merchant, viewingQuote, 'A4')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] sm:text-[11px] py-3 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Client A4
              </button>
              <button
                type="button"
                onClick={() => setViewingQuote(null)}
                className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AcomAlertPopup
        isOpen={popup.isOpen}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
        {...popup}
      />
    </motion.div>
  );
};