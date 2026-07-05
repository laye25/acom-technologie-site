import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../db/db';
import { Merchant } from '../../../types';
import { PressingTicket, PressingTarifs, PressingClosure, DetergentSale } from '../types';
import { OptimizedImage } from '../../../components/OptimizedImage';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { AcomAlertPopup } from '../../../components/AcomAlertPopup';
import { printPressingTicketDirect } from '../../billing/utils/pdfGenerator';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';
import { showMailSuccessToast } from '../../../components/MailSuccessToast';
import { jsPDF } from 'jspdf';
import { 
    Save, X, Loader2, Trash2, Printer, Search, 
    Filter, FileText, Check, DollarSign, Clock,
    Eye, MessageSquare, Mail, ClipboardList, RefreshCw, Plus, Download
} from 'lucide-react';

const DEFAULT_TARIFS: PressingTarifs = {
    articles: {},
    poids: {},
    supplements: {},
    articles_costs: {},
    poids_costs: {},
    supplements_costs: {},
    articles_images: {}
};

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

export const PressingReceiptManager = ({ merchant }: { merchant: Merchant }) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'active' | 'history' | 'closures' | 'quotes'>('create');
  
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

  // Re-sync tariffs from localStorage whenever the component is active to ensure newly added items display instantly
  useEffect(() => {
    const saved = localStorage.getItem(`pressing_tarifs_${merchant.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
        setTarifs(parsed);
      } catch (err) {
        console.error("Syntax loading tariffs in PressingReceiptManager", err);
      }
    }
  }, [merchant.id]);

  const getSupplementDisplayName = (key: string) => {
    const staticLabels: Record<string, string> = {
      repassage: '👔 Repassage',
      express: '⚡ Lavage Express (unit.)',
      detachage: '🔬 Détachage spécial',
      livraison: '🚚 Livraison à domicile',
      premiumPack: '💎 Emballage Premium',
    };
    const rawName = (tarifs as any).supplements_display_names?.[key];
    if (rawName) return `✨ ${rawName}`;
    return staticLabels[key] || `✨ ${key.charAt(0).toUpperCase() + key.slice(1)}`;
  };

  const [tickets, setTickets] = useState<PressingTicket[]>(() => {
    const saved = localStorage.getItem(`pressing_tickets_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Unified pop-up state for PressingReceiptManager
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

  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [depositDate, setDepositDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return format(d, 'yyyy-MM-dd');
  });
  const [billingType, setBillingType] = useState<'article' | 'poids'>('article');
  
  const [articlesQty, setArticlesQty] = useState<{ [key: string]: number }>(() => {
    const initialQty: { [key: string]: number } = {};
    Object.keys(tarifs.articles).forEach(key => {
      initialQty[key] = 0;
    });
    return initialQty;
  });

  // Dynamic articlesQty keys synchronization with current tarifs.articles keys
  useEffect(() => {
    setArticlesQty(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(tarifs.articles).forEach(key => {
        if (next[key] === undefined) {
          next[key] = 0;
          changed = true;
        }
      });
      Object.keys(next).forEach(key => {
        if (tarifs.articles[key] === undefined) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tarifs]);

  const [weightService, setWeightService] = useState<string>(() => {
    const keys = Object.keys(tarifs.poids);
    return keys.includes('standard') ? 'standard' : keys[0] || '';
  });

  useEffect(() => {
    const keys = Object.keys(tarifs.poids);
    if (keys.length > 0 && !keys.includes(weightService)) {
      setWeightService(keys[0]);
    }
  }, [tarifs, weightService]);

  const [weightKg, setWeightKg] = useState<number>(0);

  const [supplements, setSupplements] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const currentSupps = tarifs.supplements || DEFAULT_TARIFS.supplements || {};
    Object.keys(currentSupps).forEach(key => {
      initial[key] = false;
    });
    return initial;
  });

  const supplementTarifs = useMemo(() => {
    const prices: Record<string, number> = {};
    const defaultSupps = DEFAULT_TARIFS.supplements || {};
    const currentSupps = tarifs.supplements || {};
    const keys = new Set([...Object.keys(defaultSupps), ...Object.keys(currentSupps)]);
    keys.forEach(key => {
      prices[key] = currentSupps[key] !== undefined ? currentSupps[key] : (defaultSupps[key] || 0);
    });
    return prices;
  }, [tarifs]);

  // Synchronize dynamic keys of supplements when tarifs change
  useEffect(() => {
    setSupplements(prev => {
      const next = { ...prev };
      let changed = false;
      const currentSupps = tarifs.supplements || DEFAULT_TARIFS.supplements || {};
      Object.keys(currentSupps).forEach(key => {
        if (next[key] === undefined) {
          next[key] = false;
          changed = true;
        }
      });
      Object.keys(next).forEach(key => {
        if (currentSupps[key] === undefined) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tarifs]);

  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [selectedTicket, setSelectedTicket] = useState<PressingTicket | null>(null);

  // Enhanced additional state fields
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card' | 'other'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [viewingTicket, setViewingTicket] = useState<PressingTicket | null>(null);
  const [washStatusFilter, setWashStatusFilter] = useState<'all' | 'deposed' | 'in_progress' | 'ready'>('all');

  // Relance & Notification Temps Réel Client
  const [selectedNotifTemplate, setSelectedNotifTemplate] = useState<string>('deposit');
  const [notifMessage, setNotifMessage] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  // Suivi Gérant Temps Réel à Distance
  const managerPhone = merchant.managerNotifications?.whatsappPhone || '';
  const managerEmail = merchant.managerNotifications?.email || '';
  const autoEmailManager = merchant.managerNotifications?.notifyOnCashClosure !== false;
  
  const [ticketMailFeedback, setTicketMailFeedback] = useState<Record<string, boolean>>({});
  const [closureMailFeedback, setClosureMailFeedback] = useState<Record<string, boolean>>({});
  
  const [managerNotifsHistory, setManagerNotifsHistory] = useState<{ id: string; ticketNumber: string; type: 'entrée' | 'sortie'; method: 'whatsapp' | 'email'; timestamp: string }[]>(() => {
    const saved = localStorage.getItem(`pressing_manager_notifs_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`pressing_manager_notifs_${merchant.id}`, JSON.stringify(managerNotifsHistory));
  }, [managerNotifsHistory, merchant.id]);

  // Clôture de caisse states
  const [closures, setClosures] = useState<PressingClosure[]>(() => {
    const saved = localStorage.getItem(`pressing_closures_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [closureDate, setClosureDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [cashierName, setCashierName] = useState('');
  const [actualCash, setActualCash] = useState<number>(0);
  const [closureNotes, setClosureNotes] = useState('');

  useEffect(() => {
    localStorage.setItem(`pressing_closures_${merchant.id}`, JSON.stringify(closures));
  }, [closures, merchant.id]);

  // Totals computations
  const subtotal = useMemo(() => {
    if (billingType === 'article') {
      return Object.keys(articlesQty).reduce((acc, key) => {
        const qty = articlesQty[key];
        const price = tarifs.articles[key as keyof typeof tarifs.articles] || 0;
        return acc + (qty * price);
      }, 0);
    } else {
      const pricePerKg = tarifs.poids[weightService] || 0;
      return weightKg * pricePerKg;
    }
  }, [billingType, articlesQty, weightService, weightKg, tarifs]);

  const supplementTotal = useMemo(() => {
    return Object.keys(supplements).reduce((acc, key) => {
      const active = supplements[key as keyof typeof supplements];
      const cost = supplementTarifs[key as keyof typeof supplementTarifs] || 0;
      return acc + (active ? cost : 0);
    }, 0);
  }, [supplements]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.floor(((subtotal + supplementTotal) * discountValue) / 100);
    }
    return discountValue;
  }, [discountType, discountValue, subtotal, supplementTotal]);

  const total = useMemo(() => {
    const val = (subtotal + supplementTotal) - discountAmount;
    return Math.max(0, val);
  }, [subtotal, supplementTotal, discountAmount]);

  const totalCost = useMemo(() => {
    let cost = 0;
    if (billingType === 'article') {
      cost += Object.keys(articlesQty).reduce((acc, key) => {
        const qty = articlesQty[key];
        const unitCost = tarifs.articles_costs?.[key as keyof typeof tarifs.articles_costs] || (DEFAULT_TARIFS.articles_costs as any)[key] || 0;
        return acc + (qty * unitCost);
      }, 0);
    } else {
      const costPerKg = tarifs.poids_costs?.[weightService] || (DEFAULT_TARIFS.poids_costs as any)[weightService] || 0;
      cost += weightKg * costPerKg;
    }

    cost += Object.keys(supplements).reduce((acc, key) => {
      const active = supplements[key as keyof typeof supplements];
      const suppCost = tarifs.supplements_costs?.[key as keyof typeof tarifs.supplements_costs] || (DEFAULT_TARIFS.supplements_costs as any)[key] || 0;
      return acc + (active ? suppCost : 0);
    }, 0);
    return cost;
  }, [billingType, articlesQty, weightService, weightKg, supplements, tarifs]);

  // Synchronize amountPaid automatically with dynamic changes
  useEffect(() => {
    if (paymentStatus === 'paid') {
      setAmountPaid(total);
    } else if (paymentStatus === 'unpaid') {
      setAmountPaid(0);
    }
  }, [total, paymentStatus]);

  // Calculate high-fidelity stats for subheader
  const pressingStats = useMemo(() => {
    const activeOnes = tickets.filter(t => t.status !== 'delivered' && t.status !== 'quotation');
    const totalDue = activeOnes.reduce((acc, t) => {
      const paid = t.amountPaid || 0;
      return acc + Math.max(0, t.total - paid);
    }, 0);
    const inProgressCount = activeOnes.filter(t => t.status === 'in_progress').length;
    const readyCount = activeOnes.filter(t => t.status === 'ready').length;
    const deposedCount = activeOnes.filter(t => t.status === 'deposed').length;
    const totalActiveValue = activeOnes.reduce((acc, t) => acc + t.total, 0);

    const activePaid = activeOnes.filter(t => t.paymentStatus === 'paid').length;
    const activeUnpaid = activeOnes.filter(t => t.paymentStatus === 'unpaid').length;
    const activePartial = activeOnes.filter(t => t.paymentStatus === 'partial').length;

    return {
      activeCount: activeOnes.length,
      totalDue,
      inProgressCount,
      readyCount,
      deposedCount,
      totalActiveValue,
      activePaid,
      activeUnpaid,
      activePartial
    };
  }, [tickets]);

  // Templates Map for client notifications
  const NOTIFICATION_TEMPLATES = useMemo<{ [key: string]: { label: string; subject: string; body: (ticket: PressingTicket) => string } }>(() => ({
    deposit: {
      label: '📥 Réception / Dépôt enregistré',
      subject: `Confirmation de dépôt - ${merchant.name || 'Pressing'}`,
      body: (t: PressingTicket) => `Bonjour ${t.clientName}, votre dépôt du ${t.depositDate} au pressing ${merchant.name || 'ACOM'} a bien été enregistré. Ticket N°: ${t.ticketNumber}. Prix : ${t.total} FCFA. Versé: ${t.amountPaid || 0} FCFA. Retrait prévu: ${t.expectedDeliveryDate || 'N/A'}. Merci de votre fidélité !`
    },
    in_progress: {
      label: '🧼 Lavage en cours',
      subject: `Traitement de votre linge - ${merchant.name || 'Pressing'}`,
      body: (t: PressingTicket) => `Bonjour ${t.clientName}, votre linge du ticket N°: ${t.ticketNumber} est actuellement en cours de traitement et de lavage par notre équipe.`
    },
    ready: {
      label: '👔 Linge Prêt pour Retrait',
      subject: `Votre commande est prête ! - ${merchant.name || 'Pressing'}`,
      body: (t: PressingTicket) => `Bonjour ${t.clientName}, bonne nouvelle ! Votre linge est lavé, repassé et disponible (Ticket N°: ${t.ticketNumber}). Montant total: ${t.total} FCFA, reste à payer: ${Math.max(0, t.total - (t.amountPaid || 0))} FCFA. À très bientôt !`
    },
    delivered: {
      label: '✅ Commande Livrée',
      subject: `Merci pour votre visite ! - ${merchant.name || 'Pressing'}`,
      body: (t: PressingTicket) => `Bonjour ${t.clientName}, votre commande ticket N°: ${t.ticketNumber} vous a été délivrée. Merci pour votre confiance !`
    },
    payment_reminder: {
      label: '💰 Solde dû (Rappel de paiement)',
      subject: `Rappel de règlement - ${merchant.name || 'Pressing'}`,
      body: (t: PressingTicket) => `Bonjour ${t.clientName}, nous vous rappelons qu'un solde de ${Math.max(0, t.total - (t.amountPaid || 0))} FCFA reste à régler pour votre commande N°: ${t.ticketNumber}. Merci de régulariser lors du retrait.`
    }
  }), [merchant]);

  // Synchronise edited recipient coordinates and message draught upon viewing modifications
  useEffect(() => {
    if (viewingTicket) {
      setEditedPhone(viewingTicket.clientPhone || '');
      setEditedEmail(viewingTicket.clientEmail || '');
      const tmpl = NOTIFICATION_TEMPLATES[selectedNotifTemplate];
      if (tmpl) {
        setNotifMessage(tmpl.body(viewingTicket));
      }
    }
  }, [viewingTicket, selectedNotifTemplate, NOTIFICATION_TEMPLATES]);

  const logNotificationSent = (type: 'whatsapp' | 'email', templateKey: string, matchedMsg: string) => {
    if (!viewingTicket) return;
    
    const newLog = {
      id: `notif_${Date.now()}`,
      type,
      templateName: NOTIFICATION_TEMPLATES[templateKey]?.label || templateKey,
      msg: matchedMsg,
      timestamp: new Date().toISOString()
    };
    
    const updatedNotifications = [...(viewingTicket.sentNotifications || []), newLog];
    
    const updatedTicket: PressingTicket = {
      ...viewingTicket,
      clientPhone: editedPhone,
      clientEmail: editedEmail,
      sentNotifications: updatedNotifications
    };
    
    const updatedTickets = tickets.map(t => t.id === viewingTicket.id ? updatedTicket : t);
    setTickets(updatedTickets);
    localStorage.setItem(`pressing_tickets_${merchant.id}`, JSON.stringify(updatedTickets));
    setViewingTicket(updatedTicket);
    if (selectedTicket && selectedTicket.id === viewingTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  };

  const getManagerNotificationMessage = useCallback((t: PressingTicket, type: 'entrée' | 'sortie') => {
    const isEntry = type === 'entrée';
    const statusLabel = t.status === 'delivered' ? 'LIVRÉ ✅' : t.status === 'ready' ? 'PRÊT 👔' : t.status === 'in_progress' ? 'EN LAVAGE 🧼' : 'REÇU COMPTÉ 🧺';
    
    const articlesDesc = t.billingType === 'article' 
      ? Object.entries(t.articles || {})
          .filter(([_, qty]) => (qty as number) > 0)
          .map(([name, qty]) => `${qty}x ${name}`)
          .join(', ')
      : `${t.weightKg} Kg (${t.weightService})`;

    const paidText = t.paymentStatus === 'paid' ? 'ENTIÈREMENT PAYÉ 👍' : (t.paymentStatus === 'partial' && (t.amountPaid || 0) > 0) ? `ACOMPTE PAYÉ DE ${t.amountPaid} FCFA 🟡` : 'NON REGLE (À payer au retrait) 🔴';

    if (isEntry) {
      return `📢 [SUIVI GÉRANT - ENTRÉE REÇUE] 📥\n` +
             `--------------------------------\n` +
             `• Ticket N° : ${t.ticketNumber}\n` +
             `• Client : ${t.clientName} (${t.clientPhone || 'Aucun contact'})\n` +
             `• Linge / Lots : ${articlesDesc || '0 article'}\n` +
             (t.discount > 0 ? `• Remise : ${t.discount} FCFA\n` : '') +
             `• Valeur Nette : ${t.total} FCFA\n` +
             `• Versé initial : ${t.amountPaid || 0} FCFA\n` +
             `• Reste à encaisser : ${Math.max(0, t.total - (t.amountPaid || 0))} FCFA\n` +
             `• Statut de paiement : ${paidText}\n` +
             `• Date dépôt : ${t.depositDate}\n` +
             `• Retrait prévu : ${t.expectedDeliveryDate || 'N/A'}\n` +
             `--------------------------------\n` +
             `Rapport d'activité temps réel généré sur l'application SaaS ${merchant.name || 'ACOM'}.`;
    } else {
      return `📢 [SUIVI GÉRANT - SORTIE / STATUT CHANGÉ] 👔\n` +
             `--------------------------------\n` +
             `• Ticket N° : ${t.ticketNumber}\n` +
             `• Client : ${t.clientName}\n` +
             `• Nouveau Statut : ${statusLabel}\n` +
             (t.discount > 0 ? `• Remise : ${t.discount} FCFA\n` : '') +
             `• Valeur Nette : ${t.total} FCFA\n` +
             `• Total Perçu : ${t.amountPaid || 0} FCFA\n` +
             `• Solde Résiduel : ${Math.max(0, t.total - (t.amountPaid || 0))} FCFA\n` +
             `• Statut de règlement : ${paidText}\n` +
             `--------------------------------\n` +
             `Rapport d'activité temps réel généré sur l'application SaaS ${merchant.name || 'ACOM'}.`;
    }
  }, [merchant]);

  const dispatchManagerNotif = async (t: PressingTicket, flowType: 'entrée' | 'sortie', method: 'whatsapp' | 'email') => {
    const message = getManagerNotificationMessage(t, flowType);
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
        ticketNumber: t.ticketNumber,
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
      toast.loading('Envoi du rapport par mail...');
      const ok = await sendSilentBackgroundEmailToManager(t, flowType);
      toast.dismiss();
      if (ok) {
        setTicketMailFeedback(prev => ({ ...prev, [t.id]: true }));
        showAlert('Rapport Envoyé', "Le rapport de suivi par e-mail a été envoyé avec succès au Gérant !", 'success');
      } else {
        const subject = `[TEMPS RÉEL] ${flowType.toUpperCase()} - Ticket ${t.ticketNumber} - ${merchant.name || 'Pressing'}`;
        const mailtoUrl = `mailto:${managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoUrl, '_blank');
        showAlert("Messagerie Ouverte", "Nous avons configuré l'email de suivi. Veuillez appuyer sur Envoyer dans votre boîte mail !", 'success');
        
        // Add to local history
        const newLog = {
          id: `mnotif_${Date.now()}`,
          ticketNumber: t.ticketNumber,
          type: flowType,
          method,
          timestamp: new Date().toISOString()
        };
        setManagerNotifsHistory(prev => [newLog, ...prev]);
      }
    }
  };

  const sendSilentBackgroundEmailToManager = async (ticket: PressingTicket, flowType: 'entrée' | 'sortie') => {
    if (!managerEmail || !managerEmail.trim()) {
      return;
    }

    const isEntry = flowType === 'entrée';
    const title = isEntry ? `📥 Notification d'Entrée (Nouveau Dépôt)` : `👔 Notification de Sortie / Changement de Statut`;
    const themeColor = isEntry ? '#0d9488' : '#4f46e5'; // Teal for entries, Indigo for exits
    
    // Format articles list
    const articlesDesc = ticket.billingType === 'article'
      ? Object.entries(ticket.articles || {})
          .filter(([_, qty]) => (qty as number) > 0)
          .map(([name, qty]) => `<li style="margin: 4px 0;"><strong>${qty}x</strong> ${name}</li>`)
          .join('')
      : `<li style="margin: 4px 0;"><strong>${ticket.weightKg} Kg</strong> (${ticket.weightService})</li>`;

    // Supplements HTML
    const activeSupps = Object.entries(ticket.supplements || {})
      .filter(([_, active]) => active)
      .map(([name]) => `<span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px; display: inline-block;">${name}</span>`)
      .join(' ');

    const statusLabel = ticket.status === 'delivered' ? 'LIVRÉ ✅' : ticket.status === 'ready' ? 'PRÊT 👔' : ticket.status === 'in_progress' ? 'EN LAVAGE 🧼' : 'REÇU COMPTÉ 🧺';
    const paymentLabel = ticket.paymentStatus === 'paid' ? 'ENTIÈREMENT PAYÉ 👍' : (ticket.paymentStatus === 'partial' && (ticket.amountPaid || 0) > 0) ? `ACOMPTE DE ${ticket.amountPaid} FCFA 🟡` : 'NON RÉGLÉ 🔴';

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
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 150px;"><strong>N° Ticket :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${ticket.ticketNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Client :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${ticket.clientName} (${ticket.clientPhone || 'Aucun contact'})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Type Facturation :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-transform: capitalize;">Par ${ticket.billingType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;" valign="top"><strong>Articles / Poids :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <ul style="margin: 0; padding-left: 20px;">${articlesDesc || 'Aucun article renseigné'}</ul>
              </td>
            </tr>
            ${activeSupps ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Suppléments :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${activeSupps}</td>
            </tr>
            ` : ''}
            ${ticket.discount > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Remise :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #ef4444; font-weight: bold;">-${ticket.discount} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Valeur Nette :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e293b; font-size: 14px;">${ticket.total} FCFA</td>
            </tr>
            ` : `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Montant Total :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e293b; font-size: 14px;">${ticket.total} FCFA</td>
            </tr>
            `}
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Acompte Payé :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0d9488; font-weight: bold;">${ticket.amountPaid || 0} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Reste à Payer :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #ef4444; font-weight: bold; font-size: 14px;">${Math.max(0, ticket.total - (ticket.amountPaid || 0))} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Règlement :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${paymentLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Statut Linge :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: ${themeColor};">${statusLabel}</td>
            </tr>
            ${ticket.notes ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Notes :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-style: italic; color: #475569;">"${ticket.notes}"</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Date Dépôt :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${ticket.depositDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Date Retrait Prévue :</strong></td>
              <td style="padding: 8px 0; font-weight: bold;">${ticket.expectedDeliveryDate || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
          Ce rapport automatique en direct a été envoyé en arrière-plan sans action requise de l'opérateur.<br/>
          <strong>Système de Suivi SaaS ${merchant.name || 'ACOM'}</strong>.
        </div>
      </div>
    `;

    try {
      const response = await sendEmailDirectlyOrViaBackend({
        to: managerEmail,
        from: merchant.managerNotifications?.emailFrom || undefined,
        subject: `⚡ [${flowType.toUpperCase()}] Ticket n°${ticket.ticketNumber} - ${merchant.name || 'Pressing'}`,
        html: mailHtml
      }, {
        resendApiKey: merchant.managerNotifications?.resendApiKey,
        defaultFrom: merchant.managerNotifications?.emailFrom
      });

      if (response.ok) {
        showMailSuccessToast("Ce mail envoyé en arrière-plan avec succès !");
        
        // Add to local history
        const newLog = {
          id: `mnotif_${Date.now()}`,
          ticketNumber: ticket.ticketNumber,
          type: flowType,
          method: 'email' as const,
          timestamp: new Date().toISOString()
        };
        setManagerNotifsHistory(prev => [newLog, ...prev]);
        return true;
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Failed to send background email to manager:', errorData || response.statusText);
        showAlert("Erreur d'envoi", `L'envoi automatique au gérant a échoué. ${errorData?.error || response.statusText}`, "error");
        return false;
      }
    } catch (error) {
      console.error('Error dispatching silent manager background mail:', error);
      return false;
    }
  };

  const sendSilentBackgroundBalanceCollectionEmailToManager = async (ticket: PressingTicket, dueAmount: number, method: PressingTicket['paymentMethod']) => {
    if (!managerEmail || !managerEmail.trim()) {
      return;
    }

    const title = `💸 Encaissement de Solde (Règlement Restant)`;
    const themeColor = '#16a34a'; // Beautiful Green for revenue/payment success
    const methodLabel = method === 'cash' ? 'Espèces 💵' : method === 'mobile_money' ? 'Mobile Money 📱' : method === 'card' ? 'Carte Bancaire 💳' : 'Autre Moyen 🔄';
    const previousPaid = (ticket.total - dueAmount);

    const articlesDesc = ticket.billingType === 'article'
      ? Object.entries(ticket.articles || {})
          .filter(([_, qty]) => (qty as number) > 0)
          .map(([name, qty]) => `<li style="margin: 4px 0;"><strong>${qty}x</strong> ${name}</li>`)
          .join('')
      : `<li style="margin: 4px 0;"><strong>${ticket.weightKg} Kg</strong> (${ticket.weightService})</li>`;

    const statusLabel = ticket.status === 'delivered' ? 'LIVRÉ ✅' : ticket.status === 'ready' ? 'PRÊT 👔' : ticket.status === 'in_progress' ? 'EN LAVAGE 🧼' : 'REÇU COMPTÉ 🧺';

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="background-color: ${themeColor}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">${merchant.name || 'Pressing'}</h2>
          <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">Alerte de Règlement de Solde — Gérant</p>
        </div>

        <div style="margin-top: 20px;">
          <h3 style="color: ${themeColor}; border-bottom: 2px solid ${themeColor}; padding-bottom: 5px; margin-bottom: 15px;">${title}</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 150px;"><strong>N° Ticket :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${ticket.ticketNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Client :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>${ticket.clientName}</strong> (${ticket.clientPhone || 'Aucun contact'})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;" valign="top"><strong>Articles / Poids :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <ul style="margin: 0; padding-left: 20px;">${articlesDesc || 'Aucun article'}</ul>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Montant Total Fiche :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e293b; font-size: 14px;">${ticket.total.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Acompte Déposé Précédemment :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0d9488; font-weight: bold;">${previousPaid.toLocaleString()} FCFA</td>
            </tr>
            <tr style="background-color: #f0fdf4;">
              <td style="padding: 10px 6px; border-bottom: 1px solid #bbf7d0; color: #14532d;"><strong>SOLDE ENCAISSÉ DU JOUR :</strong></td>
              <td style="padding: 10px 6px; border-bottom: 1px solid #bbf7d0; color: #15803d; font-weight: bold; font-size: 15px;">+${dueAmount.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Moyen de Règlement :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e293b;">${methodLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Reste à Payer :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #16a34a; font-weight: bold; font-size: 14px;">0 FCFA (RÈGLEMENT DE SOLDE TERMINÉ ✅)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Date Encaissement :</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${new Date().toLocaleDateString('fr-FR')} &agrave; ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Statut Actuel Linge :</strong></td>
              <td style="padding: 8px 0; font-weight: bold; color: #4f46e5;">${statusLabel}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
          Ce message d'alerte à l'encaissement de solde s'est exécuté automatiquement en tâche de fond.<br/>
          <strong>Système de Suivi SaaS ${merchant.name || 'ACOM'}</strong>.
        </div>
      </div>
    `;

    try {
      const response = await sendEmailDirectlyOrViaBackend({
        to: managerEmail,
        from: merchant.managerNotifications?.emailFrom || undefined,
        subject: `💸 [SOLDE PAYÉ] Ticket n°${ticket.ticketNumber} - ${merchant.name || 'Pressing'}`,
        html: mailHtml
      }, {
        resendApiKey: merchant.managerNotifications?.resendApiKey,
        defaultFrom: merchant.managerNotifications?.emailFrom
      });

      if (response.ok) {
        showMailSuccessToast("Mail d'encaissement de solde envoyé au gérant avec succès !");
        
        // Add to local history
        const newLog = {
          id: `mnotif_${Date.now()}`,
          ticketNumber: ticket.ticketNumber,
          type: 'sortie' as const,
          method: 'email' as const,
          timestamp: new Date().toISOString()
        };
        setManagerNotifsHistory(prev => [newLog, ...prev]);
        return true;
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Failed to send background balance email to manager:', errorData || response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error dispatching silent manager background balance mail:', error);
      return false;
    }
  };

  const products = useMemo(() => {
    try {
      const saved = localStorage.getItem(`pressing_stock_products_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id]);

  const lowStockItems = useMemo(() => products.filter((p: any) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= (Number(p.minStock) || 5)), [products]);
  const outOfStockItems = useMemo(() => products.filter((p: any) => Number(p.stock || 0) <= 0), [products]);

  const dailyPressingTickets = useMemo(() => {
    return tickets.filter(t => t.depositDate === closureDate && t.status !== 'quotation');
  }, [tickets, closureDate]);

  const dailyDepositsRevenue = useMemo(() => {
    return dailyPressingTickets.reduce((sum, t) => {
      const atDeposit = t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0);
      return sum + atDeposit;
    }, 0);
  }, [dailyPressingTickets]);

  const dailyBalancesCollected = useMemo(() => {
    return tickets.filter(t => t.balanceCollectedDate === closureDate);
  }, [tickets, closureDate]);

  const dailyBalancesRevenue = useMemo(() => {
    return dailyBalancesCollected.reduce((sum, t) => sum + (t.balanceCollectedAmount || 0), 0);
  }, [dailyBalancesCollected]);

  const dailyPressingRevenue = useMemo(() => {
    return dailyDepositsRevenue + dailyBalancesRevenue;
  }, [dailyDepositsRevenue, dailyBalancesRevenue]);

  const dailyDetergentSales = useMemo(() => {
    try {
      const savedSales = localStorage.getItem(`pressing_stock_sales_${merchant.id}`);
      const parsedSales: DetergentSale[] = savedSales ? JSON.parse(savedSales) : [];
      return parsedSales.filter(s => s.date.startsWith(closureDate));
    } catch {
      return [];
    }
  }, [closureDate, merchant.id]);

  const dailyDetergentRevenue = useMemo(() => {
    return dailyDetergentSales.reduce((sum, s) => sum + (s.total || 0), 0);
  }, [dailyDetergentSales]);

  const totalTheoreticalRevenue = dailyPressingRevenue + dailyDetergentRevenue;

  const getManagerClosureNotificationMessage = useCallback((c: PressingClosure) => {
    const diffSign = c.discrepancy >= 0 ? '+' : '';
    const diffText = c.discrepancy === 0 ? 'Parfait (0 FCFA)' : `${diffSign}${c.discrepancy} FCFA`;
    
    let message = `👑 [CLÔTURE DE CAISSE DE PRESSING] 📊\n` +
           `--------------------------------\n` +
           `• Date d'Activité : ${c.date}\n` +
           `• Date Clôture : ${new Date(c.timestamp).toLocaleString('fr-FR')}\n` +
           `• Caissier / Opérateur : ${c.cashierName || 'Non renseigné'}\n` +
           `--------------------------------\n` +
           `RÉSUMÉ DES RECETTES :\n` +
           `• Recettes Services Pressing : ${c.totalPressingRevenue} FCFA\n` +
           `• Ventes Produits Détergents : ${c.totalDetergentRevenue} FCFA\n` +
           `--------------------------------\n` +
           `• TOTAL ATTENDU : ${c.totalTheoreticalRevenue} FCFA\n` +
           `• ESPÈCES RÉELLES : ${c.actualCashCounted} FCFA\n` +
           `• ÉCART DE CAISSE : ${diffText} (${c.discrepancy < 0 ? '⚠️ MANQUANT' : c.discrepancy > 0 ? '🟢 SURPLUS' : '✅ EQUILIBRE'})\n` +
           `--------------------------------\n`;

    if (dailyPressingTickets.length > 0) {
      message += `📥 DETAIL ENREGISTREMENTS ACOMPTES (${dailyPressingTickets.length}) :\n`;
      dailyPressingTickets.forEach(t => {
        const depositPaid = t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0);
        message += `• ${t.ticketNumber} - ${t.clientName} : ${depositPaid.toLocaleString()} FCFA\n`;
      });
      message += `--------------------------------\n`;
    }

    if (dailyBalancesCollected.length > 0) {
      message += `💸 DETAIL SOLDES PERCUS AU RETRAIT (${dailyBalancesCollected.length}) :\n`;
      dailyBalancesCollected.forEach(t => {
        message += `• ${t.ticketNumber} - ${t.clientName} : ${(t.balanceCollectedAmount || 0).toLocaleString()} FCFA\n`;
      });
      message += `--------------------------------\n`;
    }

    if (lowStockItems.length > 0 || outOfStockItems.length > 0) {
      message += `🚨 ALERTES STOCK :\n`;
      if (outOfStockItems.length > 0) {
        message += `❌ Épuisés : ${outOfStockItems.map(p => p.name).join(', ')}\n`;
      }
      if (lowStockItems.length > 0) {
        message += `⚠️ Point de rupture : ${lowStockItems.map(p => `${p.name} (${p.stock || 0})`).join(', ')}\n`;
      }
      message += `--------------------------------\n`;
    }

    message += `OBSERVATIONS :\n` +
           `"${c.notes || 'Aucun commentaire.'}"\n` +
           `--------------------------------\n` +
           `Rapport de clôture journalier transmis en Temps Réel via l'application SaaS ${merchant.name || 'ACOM'}.`;

    return message;
  }, [merchant, lowStockItems, outOfStockItems, dailyPressingTickets, dailyBalancesCollected]);

  const sendSilentBackgroundClosureEmailToManager = useCallback(async (c: PressingClosure) => {
    if (!managerEmail || !managerEmail.trim()) return false;

    const title = `📊 CLÔTURE DE CAISSE JOURNALIÈRE — ${c.date}`;
    const themeColor = '#1e1b4b'; // Deep Navy indigo
    const diffColor = c.discrepancy < 0 ? '#ef4444' : c.discrepancy > 0 ? '#10b981' : '#64748b';
    const diffLabel = c.discrepancy < 0 ? 'MANQUANT (Perte) ⚠️' : c.discrepancy > 0 ? 'SURPLUS (Excédent) 🟢' : 'ÉQUILIBRÉ 👍';

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="background-color: ${themeColor}; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">${merchant.name || 'Pressing'}</h2>
          <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Rapport de Clôture de Caisse Journalier</p>
        </div>

        <div style="margin-top: 25px;">
          <h3 style="color: ${themeColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">📊 État de la Caisse</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 200px;"><strong>Date d'Activité :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${c.date}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Heure de Clôture :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${new Date(c.timestamp).toLocaleTimeString('fr-FR')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Caissier / Gestionnaire :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${c.cashierName || 'Non renseigné'}</td>
            </tr>
            
            <tr>
              <td colspan="2" style="padding: 15px 0 5px 0; font-weight: bold; color: ${themeColor}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">DÉTAIL DES ENCAISSEMENTS :</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">• Recettes Services Pressing :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${c.totalPressingRevenue.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">• Ventes Détergents & Produits :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${c.totalDetergentRevenue.toLocaleString()} FCFA</td>
            </tr>
            
            <tr>
              <td colspan="2" style="padding: 15px 0 5px 0; font-weight: bold; color: ${themeColor}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">RAPPROCHEMENT DE CAISSE :</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Total Théorique Attendu :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 14px;">${c.totalTheoreticalRevenue.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Espèces Réelles Comptées :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 14px; color: #1e1b4b;">${c.actualCashCounted.toLocaleString()} FCFA</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px 10px; color: #0f172a; font-weight: bold;"><strong>ÉCART DE CAISSE :</strong></td>
              <td style="padding: 12px 10px; font-weight: bold; font-size: 15px; color: ${diffColor};">
                ${c.discrepancy >= 0 ? '+' : ''}${c.discrepancy.toLocaleString()} FCFA
                <div style="font-size: 11px; font-weight: normal; margin-top: 2px;">${diffLabel}</div>
              </td>
            </tr>
            ${c.notes ? `
            <tr>
              <td style="padding: 12px 0 0 0; color: #64748b;" valign="top"><strong>Notes & Observations :</strong></td>
              <td style="padding: 12px 0 0 0; font-style: italic; color: #475569;">"${c.notes}"</td>
            </tr>
            ` : ''}
            ${(lowStockItems.length > 0 || outOfStockItems.length > 0) ? `
            <tr>
              <td colspan="2" style="padding: 15px 0 5px 0; font-weight: bold; color: #ef4444; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🚨 ALERTES STOCK :</td>
            </tr>
            ${outOfStockItems.length > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">❌ Articles Épuisés :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #ef4444;">${outOfStockItems.map(p => p.name).join(', ')}</td>
            </tr>
            ` : ''}
            ${lowStockItems.length > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">⚠️ Point de Rupture :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #f59e0b;">${lowStockItems.map(p => `${p.name} (${p.stock || 0})`).join(', ')}</td>
            </tr>
            ` : ''}
            ` : ''}
          </table>
        </div>

        <div style="margin-top: 25px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
          <h3 style="color: ${themeColor}; font-size: 14px; text-transform: uppercase; margin-bottom: 12px; font-weight: bold; letter-spacing: 0.5px;">🔍 Traces des Encaisses du Jour</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${dailyPressingTickets.length > 0 ? `
            <tr>
              <td colspan="3" style="padding: 8px 0; font-weight: bold; color: ${themeColor}; border-bottom: 1px font-weight: bold;">📥 Acomptes reçus le jour du dépôt :</td>
            </tr>
            ${dailyPressingTickets.map(t => {
              const depositPaid = t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0);
              return `
              <tr>
                <td style="padding: 6px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: bold;">${t.ticketNumber}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${t.clientName}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: #16a34a;">+${depositPaid.toLocaleString()} F</td>
              </tr>`;
            }).join('')}
            ` : ''}

            ${dailyBalancesCollected.length > 0 ? `
            <tr>
              <td colspan="3" style="padding: 15px 0 8px 0; font-weight: bold; color: ${themeColor};">💸 Règlements de soldes reçus au retrait :</td>
            </tr>
            ${dailyBalancesCollected.map(t => {
              return `
              <tr>
                <td style="padding: 6px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: bold;">${t.ticketNumber}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${t.clientName}</td>
                <td style="padding: 6px; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: #2563eb;">+${(t.balanceCollectedAmount || 0).toLocaleString()} F</td>
              </tr>`;
            }).join('')}
            ` : ''}

            ${(dailyPressingTickets.length === 0 && dailyBalancesCollected.length === 0) ? `
            <tr>
              <td colspan="3" style="padding: 10px; text-align: center; color: #94a3b8; font-style: italic;">Aucun encaissement pressing aujourd'hui.</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="margin-top: 35px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
          Ce rapport de clôture a été expédié automatiquement en temps réel au gérant.<br/>
          <strong>Système de Suivi SaaS ${merchant.name || 'ACOM'}</strong>.
        </div>
      </div>
    `;

    try {
      const response = await sendEmailDirectlyOrViaBackend({
        to: managerEmail,
        from: merchant.managerNotifications?.emailFrom || undefined,
        subject: `📊 [CLÔTURE CAISSE] Rapport du ${c.date} - ${merchant.name || 'Pressing'}`,
        html: mailHtml
      }, {
        resendApiKey: merchant.managerNotifications?.resendApiKey,
        defaultFrom: merchant.managerNotifications?.emailFrom
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error dispatching silent manager background mail:', errorData || response.statusText);
        showAlert("Erreur d'envoi Email (Clôture)", `L'envoi automatique au gérant a échoué. ${errorData?.error || response.statusText}`, "error");
      }
      return response.ok;
    } catch {
      return false;
    }
  }, [managerEmail, merchant, lowStockItems, outOfStockItems]);

  const dispatchManagerClosureNotif = useCallback((c: PressingClosure, method: 'whatsapp' | 'email') => {
    const message = getManagerClosureNotificationMessage(c);
    if (method === 'whatsapp') {
      if (!managerPhone.trim()) {
        showAlert('Numéro non configuré', 'Veuillez configurer le numéro de téléphone WhatsApp du Gérant.', 'error');
        return;
      }
      let cleaned = managerPhone.replace(/[^0-9]/g, '');
      if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '221' + cleaned;
      }
      const waUrl = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      showAlert('Rapport WhatsApp', 'Rapport de clôture WhatsApp ouvert avec succès ! Vous pouvez maintenant l\'envoyer.', 'success', undefined, false, "D'ACCORD", "RAPPORTS");
    } else {
      if (!managerEmail.trim()) {
        showAlert('Email non configuré', "Veuillez configurer l'adresse email du Gérant.", 'error');
        return;
      }
      const subject = `📊 [CLÔTURE CAISSE] Rapport du ${c.date} - ${merchant.name || 'Pressing'}`;
      const mailtoUrl = `mailto:${managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(mailtoUrl, '_blank');
      showAlert('Rapport Email', 'Le rapport Email de clôture a été ouvert dans votre messagerie avec succès !', 'success', undefined, false, "D'ACCORD", "RAPPORTS");
    }
  }, [managerPhone, managerEmail, merchant, getManagerClosureNotificationMessage, showAlert]);

  const resetFormFields = () => {
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    const resetQty: { [key: string]: number } = {};
    Object.keys(tarifs.articles).forEach(k => {
      resetQty[k] = 0;
    });
    setArticlesQty(resetQty);
    setWeightKg(0);
    setSupplements(prev => {
      const reset: Record<string, boolean> = {};
      Object.keys(prev).forEach(k => {
        reset[k] = false;
      });
      return reset;
    });
    setDiscountValue(0);
    setDiscountType('amount');
    setNotes('');
    setPaymentStatus('unpaid');
    setPaymentMethod('cash');
    setAmountPaid(0);
    setSelectedTicket(null);
    showAlert('Formulaire Réinitialisé', 'Le formulaire de réception a été vidé.', 'success');
  };

  const handleSendClientWhatsApp = (t: PressingTicket) => {
    if (!t.clientPhone || !t.clientPhone.trim()) {
      showAlert('Téléphone Manquant', "Veuillez renseigner le téléphone du client.", 'warning');
      return;
    }
    const message = `Bonjour ${t.clientName}, votre dépôt du ${t.depositDate} au pressing ${merchant.name || 'ACOM'} a bien été enregistré. Ticket N°: ${t.ticketNumber}. Prix : ${t.total} FCFA. Versé: ${t.amountPaid || 0} FCFA. Retrait prévu: ${t.expectedDeliveryDate || 'N/A'}. Merci de votre confiance !`;
    let cleaned = t.clientPhone.replace(/[^0-9]/g, '');
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      cleaned = '221' + cleaned;
    }
    const url = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    showAlert('Message Prêt', 'Le message de suivi WhatsApp pour le client a bien été généré.', 'success');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      showAlert('Nom Client Obligatoire', 'Veuillez renseigner le nom du client pour enregistrer la réception.', 'warning');
      return;
    }

    const nextNumber = tickets.length + 1;
    const ticketNumber = `PR-2026-${String(nextNumber).padStart(4, '0')}`;

    const newTicket: PressingTicket = {
      id: `t_${Date.now()}`,
      ticketNumber,
      clientName,
      clientPhone,
      clientEmail,
      depositDate,
      expectedDeliveryDate,
      billingType,
      articles: billingType === 'article' ? { ...articlesQty } : {},
      weightService,
      weightKg: billingType === 'poids' ? weightKg : 0,
      supplements: { ...supplements },
      supplementTarifs: { ...supplementTarifs },
      discount: discountAmount,
      discountType,
      discountValue,
      subtotal,
      supplementTotal,
      total,
      totalCost,
      status: 'deposed',
      paymentStatus,
      paymentMethod,
      amountPaid: paymentStatus === 'unpaid' ? 0 : amountPaid,
      amountPaidAtDeposit: paymentStatus === 'unpaid' ? 0 : amountPaid,
      notes,
      sentNotifications: []
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    localStorage.setItem(`pressing_tickets_${merchant.id}`, JSON.stringify(updated));
    showAlert('Fiche Enregistrée', `La fiche de réception a été enregistrée avec succès !\nTicket N° : ${ticketNumber}`, 'success', undefined, false, "D'ACCORD", "RÉCEPTION");

    // Track as Sales inside system DB
    try {
      db.sales.add({
        id: newTicket.id,
        merchantId: merchant.id,
        items: [],
        totalAmount: total,
        paidAmount: paymentStatus === 'unpaid' ? 0 : amountPaid,
        balance: Math.max(0, total - amountPaid),
        payments: [{
          id: `p_${Date.now()}`,
          amount: paymentStatus === 'unpaid' ? 0 : amountPaid,
          method: paymentMethod === 'other' ? 'transfer' : paymentMethod,
          date: new Date().toISOString()
        }],
        paymentMethod: paymentMethod === 'other' ? 'mobile_money' : paymentMethod,
        customerName: clientName,
        customerPhone: clientPhone,
        processedBy: 'system',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }

    // Do not reset form states immediately to allow printing/WhatsApp/PDF options
    // Open detail simulator immediately
    setSelectedTicket(newTicket);

    // Auto-email to manager in background on entry
    if (autoEmailManager && managerEmail && managerEmail.trim()) {
      sendSilentBackgroundEmailToManager(newTicket, 'entrée');
    }
  };

  const handleGenerateTicketQuote = () => {
    if (!clientName.trim()) {
      showAlert('Nom Client Obligatoire', 'Le nom du client est obligatoire pour établir un devis.', 'warning');
      return;
    }
    if (billingType === 'article' && Object.values(articlesQty).every(qty => qty === 0)) {
      showAlert('Linge Obligatoire', 'Veuillez ajouter au moins un article pour le devis.', 'warning');
      return;
    }
    if (billingType === 'poids' && weightKg <= 0) {
      showAlert('Poids Non Valide', 'Le poids doit être supérieur à 0 pour le devis.', 'warning');
      return;
    }

    const nextNumber = tickets.length + 1;
    const quoteNumber = `D-PR-${String(nextNumber).padStart(4, '0')}`;

    const newQuote: PressingTicket = {
      id: `q_${Date.now()}`,
      ticketNumber: quoteNumber,
      clientName,
      clientPhone,
      clientEmail,
      depositDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      billingType,
      articles: billingType === 'article' ? { ...articlesQty } : {},
      weightService,
      weightKg: billingType === 'poids' ? weightKg : 0,
      supplements: { ...supplements },
      supplementTarifs: { ...supplementTarifs },
      discount: discountAmount,
      discountType,
      discountValue,
      subtotal,
      supplementTotal,
      total,
      totalCost,
      status: 'quotation',
      paymentStatus: 'unpaid',
      paymentMethod: 'other',
      amountPaid: 0,
      notes,
      sentNotifications: []
    };

    const updated = [newQuote, ...tickets];
    setTickets(updated);
    localStorage.setItem(`pressing_tickets_${merchant.id}`, JSON.stringify(updated));
    setSelectedTicket(newQuote);
    showAlert('Devis Généré', `Le devis proforma ${quoteNumber} a été généré avec succès !`, 'success', undefined, false, "D'ACCORD", "COMMERCIAL");
  };

  const updateStatus = (ticketId: string, nextStatus: PressingTicket['status']) => {
    const targetTicketBefore = tickets.find(t => t.id === ticketId);
    if (nextStatus === 'delivered' && targetTicketBefore) {
      const due = targetTicketBefore.total - (targetTicketBefore.amountPaid || 0);
      if (due > 0) {
        showAlert(
          'Paiement requis 💸',
          `Impossible de passer le linge en statut "Livré" ! Il reste un solde de ${due.toLocaleString()} FCFA à régler. Veuillez d'abord encaisser le solde restant ou l'acompte avant de livrer.`,
          'warning',
          undefined,
          false,
          "COMPRIS",
          "CONTRÔLE DE LIVRAISON"
        );
        return;
      }
    }

    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const isConvertingFromQuote = t.status === 'quotation' && nextStatus === 'deposed';
        
        if (isConvertingFromQuote) {
          try {
            db.sales.add({
              id: t.id,
              merchantId: merchant.id,
              items: [],
              totalAmount: t.total,
              paidAmount: t.amountPaid || 0,
              balance: Math.max(0, t.total - (t.amountPaid || 0)),
              payments: [{
                id: `p_${Date.now()}`,
                amount: t.amountPaid || 0,
                method: (t.paymentMethod === 'other' ? 'transfer' : t.paymentMethod) as any,
                date: new Date().toISOString()
              }],
              paymentMethod: (t.paymentMethod === 'other' ? 'mobile_money' : t.paymentMethod) as any,
              customerName: t.clientName,
              customerPhone: t.clientPhone,
              processedBy: 'system',
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.error("Error adding converted quote to sales DB:", err);
          }
        }

        return {
          ...t,
          status: nextStatus,
          amountPaidAtDeposit: isConvertingFromQuote ? (t.amountPaid || 0) : (t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0))
        };
      }
      return t;
    });
    setTickets(updated);
    localStorage.setItem(`pressing_tickets_${merchant.id}`, JSON.stringify(updated));
    
    const targetTicket = updated.find(t => t.id === ticketId);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: nextStatus });
    }
    showAlert('Statut Mis à Jour', 'Le statut de suivi réception a été mis à jour avec succès !', 'success', undefined, false, "D'ACCORD", "SUIVI AUTOMATIQUE");

    // Auto-email to manager in background on status change (exit/outing alerts)
    if (targetTicket && autoEmailManager && managerEmail && managerEmail.trim()) {
      sendSilentBackgroundEmailToManager(targetTicket, 'sortie');
    }
  };

  const deleteTicket = (ticketId: string) => {
    showAlert(
      'Suppression Ticket ?',
      'Voulez-vous supprimer définitivement ce ticket ? Cette action efface définitivement la fiche locale.',
      'warning',
      () => {
        const updated = tickets.filter(t => t.id !== ticketId);
        setTickets(updated);
        localStorage.setItem(`pressing_tickets_${merchant.id}`, JSON.stringify(updated));
        setSelectedTicket(null);
        if (viewingTicket && viewingTicket.id === ticketId) {
          setViewingTicket(null);
        }
        showAlert('Ticket Supprimé', 'Le ticket de pressing a été supprimé de la base locale !', 'success', undefined, false, "D'ACCORD", "CORBEILLE");
      },
      true,
      'SUPPRIMER'
    );
  };

  const handleCollectBalance = (ticketId: string, method: PressingTicket['paymentMethod'] = 'cash') => {
    const targetTicket = tickets.find(t => t.id === ticketId);
    if (!targetTicket) return;
    const due = targetTicket.total - (targetTicket.amountPaid || 0);
    if (due <= 0) return;

    let methodLabel = method === 'cash' ? 'Espèces 💵' : method === 'mobile_money' ? 'Mobile Money 📱' : 'Carte 💳';

    showAlert(
      'Encaisser le solde dû',
      `Voulez-vous encaisser le solde restant de ${due.toLocaleString()} FCFA par ${methodLabel} pour le ticket ${targetTicket.ticketNumber} ?`,
      'info',
      () => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const updated = tickets.map(t => {
          if (t.id === ticketId) {
            const initialPaidAtDeposit = t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0);
            return {
              ...t,
              paymentStatus: 'paid' as const,
              paymentMethod: method,
              amountPaid: t.total,
              amountPaidAtDeposit: initialPaidAtDeposit,
              balanceCollectedAmount: due,
              balanceCollectedDate: todayStr,
              balanceCollectedMethod: method,
            };
          }
          return t;
        });
        setTickets(updated);
        localStorage.setItem(`pressing_tickets_${merchant.id}`, JSON.stringify(updated));

        // Track payment update in deep local db.sales
        try {
          db.sales.get(ticketId).then(existingSale => {
            if (existingSale) {
              const currentPayments = existingSale.payments || [];
              const newPaymentRecord = {
                id: `p_${Date.now()}`,
                amount: due,
                method: (method === 'other' ? 'transfer' : method) as 'cash' | 'card' | 'mobile_money' | 'transfer',
                date: new Date().toISOString()
              };
              db.sales.update(ticketId, {
                paidAmount: targetTicket.total,
                balance: 0,
                payments: [...currentPayments, newPaymentRecord]
              });
            }
          });
        } catch (err) {
          console.error("Erreur de traçabilité de vente :", err);
        }

        const ticketUpdateData = {
          paymentStatus: 'paid' as const,
          paymentMethod: method,
          amountPaid: targetTicket.total,
          amountPaidAtDeposit: targetTicket.amountPaidAtDeposit !== undefined ? targetTicket.amountPaidAtDeposit : (targetTicket.amountPaid || 0),
          balanceCollectedAmount: due,
          balanceCollectedDate: todayStr,
          balanceCollectedMethod: method,
        };

        if (viewingTicket && viewingTicket.id === ticketId) {
          setViewingTicket({
            ...viewingTicket,
            ...ticketUpdateData
          });
        }
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({
            ...selectedTicket,
            ...ticketUpdateData
          });
        }
        showAlert('Paiement Enregistré', `Le solde de ${due.toLocaleString()} FCFA a été encaissé avec succès via ${methodLabel} !`, 'success', undefined, false, "D'ACCORD", "RÈGLEMENT");
        
        // Auto-email summary to the manager in background on balance payment collection
        if (autoEmailManager && managerEmail && managerEmail.trim()) {
          sendSilentBackgroundBalanceCollectionEmailToManager(targetTicket, due, method);
        }
      },
      true,
      'ENCAISSER'
    );
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.clientPhone.includes(searchQuery);
      
      if (activeSubTab === 'active') {
        const isNotDelivered = t.status !== 'delivered' && t.status !== 'quotation';
        const isWashMatched = washStatusFilter === 'all' || t.status === washStatusFilter;
        return matchSearch && isNotDelivered && isWashMatched;
      } else if (activeSubTab === 'history') {
        return matchSearch && t.status === 'delivered';
      } else if (activeSubTab === 'quotes') {
        return matchSearch && t.status === 'quotation';
      }
      return matchSearch;
    });
  }, [tickets, searchQuery, activeSubTab, washStatusFilter]);

  const handleDownloadPDF = (ticket: PressingTicket, formatType: '80mm' | '58mm' = '80mm') => {
    const widthMm = formatType === '58mm' ? 58 : 80;
    const heightMm = formatType === '58mm' ? (ticket.status === 'quotation' ? 240 : 225) : (ticket.status === 'quotation' ? 220 : 205);
    const pdf = new jsPDF('p', 'mm', [widthMm, heightMm]);
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(formatType === '58mm' ? 8.5 : 10);
    
    let y = 10;
    const centerX = formatType === '58mm' ? 29 : 40;
    const lineStartX = formatType === '58mm' ? 3 : 5;
    const lineEndX = formatType === '58mm' ? 55 : 75;
    const paddingLeft = formatType === '58mm' ? 3 : 5;
    const splitWidth = formatType === '58mm' ? 52 : 70;
    const maxCharName = formatType === '58mm' ? 18 : 25;
    const maxCharItem = formatType === '58mm' ? 8 : 10;
    const smallFontSize = formatType === '58mm' ? 7 : 8;
    const extraSmallFontSize = formatType === '58mm' ? 6 : 7;
    
    pdf.text(merchant.name || 'ACOM Pressing', centerX, y, { align: 'center' });
    y += 5;
    pdf.setFontSize(smallFontSize);
    pdf.text(merchant.address || 'Service de Pressing', centerX, y, { align: 'center' });
    y += 7;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 6;
    
    pdf.setFont('courier', 'bold');
    const docTitle = ticket.status === 'quotation' ? 'DEVIS PROFORMA' : 'TICKET RÉCEPTION';
    pdf.text(docTitle, centerX, y, { align: 'center' });
    y += 5;
    pdf.text(`NUMÉRO : ${ticket.ticketNumber}`, paddingLeft, y);
    y += 5;
    pdf.setFont('courier', 'normal');
    pdf.text(`Client  : ${ticket.clientName.slice(0, maxCharName)}`, paddingLeft, y);
    y += 4;
    pdf.text(`Contact : ${ticket.clientPhone || 'N/A'}`, paddingLeft, y);
    y += 4;
    if (ticket.clientEmail) {
      const emailTrunc = ticket.clientEmail.length > maxCharName ? ticket.clientEmail.slice(0, maxCharName - 2) + '..' : ticket.clientEmail;
      pdf.text(`E-mail  : ${emailTrunc}`, paddingLeft, y);
      y += 4;
    }
    pdf.text(`Dépôt   : ${ticket.depositDate}`, paddingLeft, y);
    y += 4;
    if (ticket.expectedDeliveryDate) {
      pdf.text(`Retrait : ${ticket.expectedDeliveryDate} (Prévu)`, paddingLeft, y);
      y += 4;
    }
    if (ticket.notes) {
      const trimmedNotes = ticket.notes.length > maxCharName ? ticket.notes.slice(0, maxCharName - 2) + '..' : ticket.notes;
      pdf.text(`Note    : ${trimmedNotes}`, paddingLeft, y);
      y += 4;
    }
    y += 1;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;

    pdf.setFont('courier', 'bold');
    pdf.text('Détails Prestation', paddingLeft, y);
    y += 5;
    pdf.setFont('courier', 'normal');

    if (ticket.billingType === 'article') {
      Object.keys(ticket.articles).forEach(key => {
        const qty = ticket.articles[key];
        if (qty > 0) {
          const price = tarifs.articles[key as keyof typeof tarifs.articles] || 0;
          const totalItem = qty * price;
          pdf.text(`- ${key.slice(0, maxCharItem).padEnd(maxCharItem, ' ')} x${qty} : ${totalItem} FCFA`, paddingLeft, y);
          y += 4;
        }
      });
    } else {
      const serviceName = ticket.weightService === 'standard' ? 'Stnd.' : ticket.weightService === 'premium' ? 'Prem.' : 'Exp.';
      const pricePerKg = tarifs.poids[ticket.weightService] || 0;
      pdf.text(`- Poids : ${ticket.weightKg} Kg (${serviceName})`, paddingLeft, y);
      y += 4;
      pdf.text(`  Tarif : ${pricePerKg} FCFA/Kg`, paddingLeft, y);
      y += 4;
    }

    const activeSupps = Object.keys(ticket.supplements).filter(k => ticket.supplements[k as keyof typeof ticket.supplements]);
    if (activeSupps.length > 0) {
      pdf.text('Suppléments :', paddingLeft, y);
      y += 4;
      activeSupps.forEach(k => {
        const cost = ticket.supplementTarifs[k] || 0;
        let displayName = (tarifs as any).supplements_display_names?.[k] || k;
        displayName = displayName.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
        if (!displayName) {
          const fallbackLabels: Record<string, string> = {
            repassage: 'Repassage',
            express: 'Lavage Express',
            detachage: 'Detachage',
            livraison: 'Livraison',
            premiumPack: 'Emballage Premium'
          };
          displayName = fallbackLabels[k] || k;
        }
        pdf.text(`  + ${displayName.slice(0, maxCharItem + 3).padEnd(maxCharItem + 3, ' ')} : ${cost} FCFA`, paddingLeft, y);
        y += 4;
      });
    }

    y += 2;
    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;

    pdf.text(`Sous-total: ${ticket.subtotal + ticket.supplementTotal} FCFA`, paddingLeft, y);
    y += 4;
    if (ticket.discount > 0) {
      pdf.text(`Remise: -${ticket.discount} FCFA`, paddingLeft, y);
      y += 4;
    }
    
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(formatType === '58mm' ? 8.5 : 10);
    pdf.text(ticket.status === 'quotation' ? `MONTANT DEVIS : ${ticket.total} FCFA` : `TOTAL NET : ${ticket.total} FCFA`, paddingLeft, y);
    y += 5;

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(smallFontSize);
    
    if (ticket.status !== 'quotation') {
      const pStatusLabel = ticket.paymentStatus === 'paid' ? 'PAYE D\'AVANCE' : (ticket.paymentStatus === 'partial' && (ticket.amountPaid || 0) > 0) ? 'ACOMPTE PAYE' : 'IMPAYE AT RETRAIT';
      pdf.text(`Règlement : ${pStatusLabel}`, paddingLeft, y);
      y += 4;

      const paidVal = ticket.amountPaid || 0;
      const remainingVal = Math.max(0, ticket.total - paidVal);
      pdf.text(`Versé     : ${paidVal} FCFA`, paddingLeft, y);
      y += 4;
      pdf.setFont('courier', 'bold');
      pdf.text(`Reste dû  : ${remainingVal} FCFA`, paddingLeft, y);
      y += 5;
    }

    pdf.line(lineStartX, y, lineEndX, y);
    y += 5;
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(smallFontSize);

    if (ticket.status === 'quotation') {
      pdf.setFont('courier', 'bold');
      pdf.text('Conditions Générales de Dépôt', centerX, y, { align: 'center' });
      y += 5;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(extraSmallFontSize);
      
      const p1 = "Nous apportons le plus grand soin au traitement de votre linge. Toutefois, les articles délicats ou ne comportant pas d’étiquette d’entretien claire sont pris en charge sous l’entière responsabilité de leur propriétaire.";
      const p2 = "Le linge est à retirer à la date prévue et mentionnée sur la facture. Tout retrait effectué au-delà de cette date pourra entraîner l'application de frais de garde.";
      const p3 = "Ce devis devra être présenté lors de la confirmation du dépôt afin de valider les prestations demandées.";
      
      const lines1 = pdf.splitTextToSize(p1, splitWidth);
      lines1.forEach((line: string) => {
        pdf.text(line, centerX, y, { align: 'center' });
        y += 4;
      });
      y += 2.5;
      
      const lines2 = pdf.splitTextToSize(p2, splitWidth);
      lines2.forEach((line: string) => {
        pdf.text(line, centerX, y, { align: 'center' });
        y += 4;
      });
      y += 3;

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(extraSmallFontSize + 0.5);
      const lines3 = pdf.splitTextToSize(p3, splitWidth);
      lines3.forEach((line: string) => {
        pdf.text(line, centerX, y, { align: 'center' });
        y += 4;
      });
    } else {
      pdf.text('Merci de votre confiance !', centerX, y, { align: 'center' });
      y += 5;

      pdf.setFontSize(extraSmallFontSize);
      const noticeMsg = "Le linge est à retirer à la date prévue et mentionnée sur la facture. Tout retrait effectué au-delà de cette date pourra entraîner l'application de frais de garde.";
      const noticeLines = pdf.splitTextToSize(noticeMsg, splitWidth);
      noticeLines.forEach((line: string) => {
        pdf.text(line, centerX, y, { align: 'center' });
        y += 4;
      });
      y += 2.5;

      pdf.setFontSize(smallFontSize);
      let statusMsg = "";
      if (ticket.status === 'in_progress') {
        statusMsg = "Votre linge est actuellement en cours de traitement. Ce document devra être présenté lors du retrait de votre commande.";
      } else if (ticket.status === 'ready') {
        statusMsg = "Votre linge est prêt à être retiré. Veuillez présenter ce document lors de la remise de vos articles.";
      } else if (ticket.status === 'delivered') {
        statusMsg = "Le linge a été retiré et la prestation est considérée comme terminée. Merci d'avoir fait confiance à notre service de pressing.";
      } else if ((ticket.status as string) === 'cancelled') {
        statusMsg = "Cette commande a été annulée. Ce document est conservé à titre d'archive et ne peut plus être utilisé pour un retrait.";
      } else {
        statusMsg = "Ce bon de réception / facture devra être présenté obligatoirement lors du retrait de votre linge. Veuillez le conserver soigneusement jusqu'à la restitution complète de vos articles.";
      }

      const lines = pdf.splitTextToSize(statusMsg, splitWidth);
      lines.forEach((line: string) => {
        pdf.text(line, centerX, y, { align: 'center' });
        y += 4;
      });
    }

    pdf.save(`Ticket_Pressing_${ticket.ticketNumber}_${formatType}.pdf`);
    showAlert('Reçu Téléchargé', `Le reçu au format ticket ${formatType} a été généré et téléchargé avec succès !`, 'success');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-[#faf5ff] text-[#5c2197] rounded-2xl border border-purple-100 flex items-center justify-center">
            <ClipboardList className="w-7 h-7" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-ink tracking-tight">Fiche de Réception Client</h2>
            <p className="text-gray-500 text-xs mt-1">Enregistrement et suivi des dépôts, factures unitaires et par kg.</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit border border-black/5 shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => { setActiveSubTab('create'); setSelectedTicket(null); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeSubTab === 'create' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🧾 Nouveau Ticket
          </button>
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeSubTab === 'active' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ⏳ En Cours ({tickets.filter(t => t.status !== 'delivered' && t.status !== 'quotation').length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeSubTab === 'history' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ✅ Historique ({tickets.filter(t => t.status === 'delivered').length})
          </button>
          <button
            onClick={() => setActiveSubTab('quotes')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeSubTab === 'quotes' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📋 Devis ({tickets.filter(t => t.status === 'quotation').length})
          </button>
          <button
            onClick={() => setActiveSubTab('closures')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeSubTab === 'closures' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            👑 Clôtures ({closures.length})
          </button>
        </div>
      </div>

      {/* KPI Stats Bar Widget */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#faf5ff] p-5 rounded-2xl border border-purple-100/60 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-[#5c2197]/70 uppercase tracking-widest">⏳ Dépôts Actifs</span>
          <span className="text-2xl font-black text-[#5c2197] mt-1">{pressingStats.activeCount}</span>
        </div>
        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest">💰 À Récupérer</span>
          <span className="text-2xl font-black text-rose-600 mt-1">{pressingStats.totalDue.toLocaleString()} F</span>
        </div>
        <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-emerald-600/80 uppercase tracking-widest">🟢 Payés</span>
          <span className="text-2xl font-black text-emerald-600 mt-1">{pressingStats.activePaid}</span>
        </div>
        <div className="bg-[#fffbeb] p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-amber-600/80 uppercase tracking-widest">🟡 Acomptes</span>
          <span className="text-2xl font-black text-amber-500 mt-1">{pressingStats.activePartial}</span>
        </div>
        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest">🔴 Impayés</span>
          <span className="text-2xl font-black text-rose-600 mt-1">{pressingStats.activeUnpaid}</span>
        </div>
      </div>

      {activeSubTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Panel */}
          <form onSubmit={handleCreateTicket} className="lg:col-span-12 xl:col-span-7 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h3 className="text-lg font-black text-ink">Informations de la Commande</h3>
              <button
                type="button"
                onClick={resetFormFields}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-rose-200"
              >
                <RefreshCw className="w-3.5 h-3.5" /> NOUVEAU CLIENT
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nom du Client</label>
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-bold text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Téléphone / WhatsApp Contacts</label>
                <input
                  type="text"
                  placeholder="ex: +221771234567"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-bold text-sm text-ink font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Adresse Email <span className="text-gray-400 font-normal">(Optionnel)</span></label>
                <input
                  type="email"
                  placeholder="client@mail.com"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-bold text-sm text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date de dépôt</label>
                <input
                  type="date"
                  required
                  value={depositDate}
                  onChange={e => {
                    setDepositDate(e.target.value);
                    const parts = e.target.value.split('-');
                    if (parts.length === 3) {
                      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                      d.setDate(d.getDate() + 3);
                      setExpectedDeliveryDate(format(d, 'yyyy-MM-dd'));
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date de retrait prévue 📅</label>
                <input
                  type="date"
                  required
                  value={expectedDeliveryDate}
                  onChange={e => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Observations / État du linge</label>
                <input
                  type="text"
                  placeholder="ex: Col sale, bouton manquant, linge délicat..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Type de facturation</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBillingType('article')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      billingType === 'article' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    ◉ Par Article
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingType('poids')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      billingType === 'poids' ? 'bg-white text-[#5c2197] shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    ◉ Par Poids (Kg)
                  </button>
                </div>
              </div>
            </div>

            {/* Mode: Article */}
            {billingType === 'article' && (
              <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Quantité d'articles à laver</h4>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#faf5ff] text-[#5c2197]">Tarification unitaire</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(articlesQty).map((key) => {
                    const price = tarifs.articles[key as keyof typeof tarifs.articles] || 0;
                    return (
                      <div key={key} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 hover:border-purple-200 hover:bg-white transition-all shadow-3xs">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={tarifs.articles_images?.[key] || tarifs.articles_images?.[key.toLowerCase()] || ARTICLE_IMAGES[key.toLowerCase()] || ARTICLE_IMAGES['autre']} 
                            alt={key}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200/60 bg-slate-100 flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-xs text-ink uppercase tracking-wider block capitalize">{key}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{price} FCFA/u</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const val = Math.max(0, articlesQty[key] - 1);
                              setArticlesQty({ ...articlesQty, [key]: val });
                            }}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 flex items-center justify-center transition-all"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-sm text-ink w-6 text-center">{articlesQty[key]}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setArticlesQty({ ...articlesQty, [key]: articlesQty[key] + 1 });
                            }}
                            className="w-8 h-8 rounded-lg bg-[#5c2197]/10 hover:bg-[#5c2197]/20 font-bold text-[#5c2197] flex items-center justify-center transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {billingType === 'poids' && (
              <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Poids total du linge</h4>
                
                <div className="p-6 bg-[#faf5ff]/50 rounded-3xl border border-purple-100/60 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Forfait de Lavage</label>
                      <select
                        value={weightService}
                        onChange={(e) => setWeightService(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-xs text-ink outline-none focus:ring-2 focus:ring-[#5c2197]/20"
                      >
                        {Object.keys(tarifs.poids).map(key => {
                          const labels: { [key: string]: string } = {
                            standard: 'Lavage Standard',
                            premium: 'Lavage Premium / Délicat',
                            express: 'Lavage Express 24h'
                          };
                          return (
                            <option key={key} value={key}>
                              {labels[key] || key.charAt(0).toUpperCase() + key.slice(1)} ({tarifs.poids[key]} FCFA/Kg)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Poids Estimé (Kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="ex: 6.5"
                        value={weightKg || ''}
                        onChange={(e) => setWeightKg(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-right font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-[#5c2197]/20"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700 pt-2 border-t border-purple-100">
                    <span>Base de facturation :</span>
                    <span className="font-mono text-[#5c2197]">{subtotal.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Supplementary Options */}
            <div className="space-y-3 pt-4 border-t border-dashed border-gray-100">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Prestations optionnelles</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(supplements).map((key) => {
                  const active = supplements[key as keyof typeof supplements];
                  const price = supplementTarifs[key as keyof typeof supplementTarifs];
                  const staticLabels: Record<string, string> = {
                    repassage: '👔 Repassage',
                    express: '⚡ Lavage Express (unit.)',
                    detachage: '🔬 Détachage spécial',
                    livraison: '🚚 Livraison à domicile',
                    premiumPack: '💎 Emballage Premium',
                  };
                  const rawName = (tarifs as any).supplements_display_names?.[key];
                  const displayName = rawName ? `✨ ${rawName}` : (staticLabels[key] || `✨ ${key.charAt(0).toUpperCase() + key.slice(1)}`);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSupplements({ ...supplements, [key]: !active })}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 text-[10px] ${
                        active 
                          ? 'bg-[#5c2197]/5 border-[#5c2197] text-[#5c2197] font-bold' 
                          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="uppercase font-black leading-tight break-words line-clamp-2">{displayName}</span>
                      <span className="font-mono font-bold opacity-80">+{price} FCFA</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount Section */}
            <div className="pt-4 border-t border-dashed border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Type de remise</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percent')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 text-xs font-bold text-ink"
                >
                  <option value="amount">Montant Fixe (FCFA)</option>
                  <option value="percent">Pourcentage (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">{discountType === 'percent' ? 'Valeur en pourcentage (%)' : 'Remise immédiate (FCFA)'}</label>
                <input
                  type="number"
                  placeholder={discountType === 'percent' ? "ex: 10" : "ex: 500"}
                  value={discountValue || ''}
                  onChange={e => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-mono font-bold text-xs text-ink"
                />
              </div>
            </div>

            {/* Payment Section */}
            <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">🔒 Règlement de la Commande</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Statut de paiement</label>
                  <select
                    value={paymentStatus}
                    onChange={e => {
                      const status = e.target.value as 'unpaid' | 'partial' | 'paid';
                      setPaymentStatus(status);
                      if (status === 'paid') {
                        setAmountPaid(total);
                      } else if (status === 'unpaid') {
                        setAmountPaid(0);
                      } else {
                        setAmountPaid(Math.floor(total / 2));
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 font-bold text-xs text-ink outline-none"
                  >
                    <option value="paid">Payé d'avance 🟢</option>
                    <option value="unpaid">Impayé / Au retrait 🔴</option>
                    <option value="partial">Acompte versé 🟡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Montant Perçu (FCFA)</label>
                  <input
                    type="number"
                    disabled={paymentStatus === 'unpaid'}
                    value={paymentStatus === 'unpaid' ? 0 : amountPaid || ''}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setAmountPaid(Math.min(total, val));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50 font-mono font-bold text-xs text-ink"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Règlement via :</label>
                  <select
                    disabled={paymentStatus === 'unpaid'}
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 font-bold text-xs text-ink outline-none"
                  >
                    <option value="cash">Espèces 💵</option>
                    <option value="mobile_money">Wave / Orange Money 📱</option>
                    <option value="card">Carte Bancaire 💳</option>
                    <option value="other">Autre 📁</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-mono">
                <span className="text-gray-500 font-bold">Reste à encaisser :</span>
                <span className={`font-black ${total - amountPaid > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {(total - amountPaid).toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="submit"
                className="w-full bg-[#5c2197] hover:bg-[#481977] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Enregistrer le Ticket
              </button>
              <button
                type="button"
                onClick={handleGenerateTicketQuote}
                className="w-full bg-[#faf5ff] hover:bg-purple-100 hover:text-[#481977] font-extrabold text-xs uppercase tracking-widest text-[#5c2197] border border-purple-100 py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                📋 Etablissez DEVIS
              </button>
            </div>
          </form>

          {/* Simulator Ticket Preview */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Aperçu Réel du Ticket de Caisse</h4>
            
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#5c2197] to-[#8a33ed]" />
              
              <div className="space-y-4 font-mono text-[11px] text-gray-700 leading-relaxed bg-[#fbfbf9] p-5 rounded-2xl border border-dashed border-gray-200 shadow-inner">
                <div className="text-center pb-3 border-b border-dashed border-gray-200">
                  <p className="font-black text-xs uppercase tracking-wider text-ink block">{merchant.name || 'ACOM Pressing'}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{merchant.address || 'Service de Lavage Professionnel'}</p>
                </div>

                <div className="space-y-1 text-gray-500">
                  <p className="text-gray-900 font-bold">
                    {selectedTicket ? `N° d'enregistrement : ${selectedTicket.ticketNumber}` : "N° : PR-2026-#### (Généré à la création)"}
                  </p>
                  <p>Client : <span className="text-ink font-bold">{clientName || '________________'}</span></p>
                  <p>Contact : <span className="text-ink font-bold">{clientPhone || '________________'}</span></p>
                  <p>Dépôt : <span className="font-bold">{depositDate}</span></p>
                  <p className="text-[#5c2197] font-bold">Retrait prévu : <span>{expectedDeliveryDate}</span></p>
                  {notes.trim() && (
                    <p className="text-amber-600 italic text-[10px]">Notes : {notes}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3">
                  <p className="font-bold uppercase text-ink mb-1.5 text-xs">Prestations :</p>
                  {billingType === 'article' ? (
                    <div className="space-y-1">
                      {Object.keys(articlesQty).filter(k => articlesQty[k] > 0).map(k => (
                        <div key={k} className="flex justify-between">
                          <span>- {k} x{articlesQty[k]}</span>
                          <span className="font-bold">{(articlesQty[k] * tarifs.articles[k as keyof typeof tarifs.articles]).toLocaleString()} FCFA</span>
                        </div>
                      ))}
                      {Object.keys(articlesQty).filter(k => articlesQty[k] > 0).length === 0 && (
                        <p className="text-gray-400 italic">Aucun article sélectionné</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {weightKg > 0 ? (
                        <div className="flex justify-between">
                          <span>- Poids ({weightKg} Kg × {tarifs.poids[weightService]} FCFA)</span>
                          <span className="font-bold">{(weightKg * tarifs.poids[weightService]).toLocaleString()} FCFA</span>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic font-bold text-[10px]">Indiquez le poids total pour calculer</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Supplement active items list */}
                {Object.keys(supplements).some(k => supplements[k as keyof typeof supplements]) && (
                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="font-bold uppercase text-ink mb-1">Suppléments actifs :</p>
                    <div className="space-y-1">
                      {Object.keys(supplements).filter(k => supplements[k]).map(k => (
                        <div key={k} className="flex justify-between text-[#5c2197]">
                          <span>+ {getSupplementDisplayName(k)}</span>
                          <span>+{supplementTarifs[k] || 0} FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-500 text-[10px]">
                    <span>Sous-total prestations :</span>
                    <span className="font-bold">{(subtotal).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[10px]">
                    <span>Total suppléments :</span>
                    <span className="font-bold">{(supplementTotal).toLocaleString()} FCFA</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-500 text-[10px]">
                      <span>Remise adhérent :</span>
                      <span>-{discountAmount.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink font-black pt-1 border-t border-gray-200 text-sm">
                    <span>{selectedTicket?.status === 'quotation' ? 'Montant Devis :' : 'Net à Payer :'}</span>
                    <span className="text-[#5c2197]">{total.toLocaleString()} FCFA</span>
                  </div>
                  
                  {/* Enhanced settlement rows on ticket preview */}
                  {selectedTicket?.status !== 'quotation' && (
                    <div className="border-t border-dotted border-gray-200 pt-1.5 space-y-0.5 mt-1">
                      <div className="flex justify-between text-gray-500 text-[9px] font-bold">
                        <span>Règlement :</span>
                        <span>
                          {paymentStatus === 'paid' ? 'PAYÉ D\'AVANCE' : paymentStatus === 'partial' ? 'ACOMPTE VERSÉ' : 'À LA LIVRAISON'}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 text-[9px] font-bold">
                        <span>Montant Versé :</span>
                        <span>{(paymentStatus === 'unpaid' ? 0 : amountPaid).toLocaleString()} FCFA</span>
                      </div>
                      {total - (paymentStatus === 'unpaid' ? 0 : amountPaid) > 0 && (
                        <div className="flex justify-between text-rose-500 text-[9px] font-extrabold animate-pulse">
                          <span>Reste dû :</span>
                          <span>{(total - (paymentStatus === 'unpaid' ? 0 : amountPaid)).toLocaleString()} FCFA</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center pt-3 border-t border-dashed border-gray-200 text-[9px] text-gray-400 space-y-1">
                  <p className="font-bold text-ink">Merci de votre confiance !</p>
                  <p>Ticket requis pour retirer votre linge.</p>
                </div>
              </div>

              {selectedTicket && (
                <div className="flex flex-col gap-2.5 bg-[#faf5ff] p-5 rounded-2xl border border-purple-100 shadow-inner">
                  <p className="text-xs font-black text-[#5c2197] text-center animate-pulse">🎉 Nouveau ticket enregistré : {selectedTicket.ticketNumber}</p>
                  
                  {/* Print & PDF Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => printPressingTicketDirect(merchant, selectedTicket, '80mm', tarifs, handleDownloadPDF)}
                      className="bg-[#1e293b] hover:bg-black text-white font-bold text-[9px] py-3 rounded-xl flex items-center justify-center gap-1 transition text-center shadow-sm"
                      title="Imprimer direct Roll 80mm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Roll (80)
                    </button>
                    <button
                      type="button"
                      onClick={() => printPressingTicketDirect(merchant, selectedTicket, '58mm', tarifs, handleDownloadPDF)}
                      className="bg-[#4b5563] hover:bg-gray-800 text-white font-bold text-[9px] py-3 rounded-xl flex items-center justify-center gap-1 transition text-center shadow-sm"
                      title="Imprimer direct Roll 58mm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Roll (58)
                    </button>
                    <button
                      type="button"
                      onClick={() => printPressingTicketDirect(merchant, selectedTicket, 'A4', tarifs, handleDownloadPDF)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] py-3 rounded-xl flex items-center justify-center gap-1 transition text-center shadow-sm"
                      title="Imprimer direct A4"
                    >
                      <FileText className="w-3.5 h-3.5" /> Format A4
                    </button>
                  </div>

                  {/* Actions Area */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Download PDF button as requested ("téléchargement par pdf") */}
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(selectedTicket)}
                      className="py-2 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm border border-gray-200"
                    >
                      <Download className="w-3.5 h-3.5" /> Télécharger PDF
                    </button>

                    {/* WhatsApp Client button as requested ("envois de par WhatsApp") */}
                    <button
                      type="button"
                      onClick={() => handleSendClientWhatsApp(selectedTicket)}
                      className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Client
                    </button>
                  </div>

                  {/* Supervisor notifications */}
                  <div className="border-t border-indigo-200/50 mt-1.5 pt-2">
                    <p className="text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-widest text-center flex items-center justify-center gap-1.5 mb-1.5">
                      <span>👑</span> Suivi Temps Réel du Gérant (Dépôt / Entrée)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => dispatchManagerNotif(selectedTicket, 'entrée', 'whatsapp')}
                        className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 transition shadow-sm"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp Gérant
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatchManagerNotif(selectedTicket, 'entrée', 'email')}
                        className="py-1.5 px-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 transition shadow-sm"
                      >
                        <Mail className="w-3 h-3 text-indigo-600" /> E-mail Gérant
                      </button>
                    </div>
                    {ticketMailFeedback[selectedTicket.id] && (
                      <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600 font-semibold bg-emerald-50 p-1.5 rounded-lg justify-center border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Ce mail envoyé en arrière-plan avec succès !
                      </div>
                    )}
                  </div>

                  {/* Reset form for a fresh client order */}
                  <div className="border-t border-indigo-200/50 mt-1 pt-2">
                    <button
                      type="button"
                      onClick={resetFormFields}
                      className="w-full py-2.5 px-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition hover:scale-[1.02] duration-150 shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} /> Commencer un Nouveau Client
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'closures' ? (
        /* Clôture de caisse interactive view */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* New Closure Form */}
          <div className="lg:col-span-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-ink flex items-center gap-2">
                🔒 Nouvelle Clôture de Caisse
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Calculez les recettes théoriques de la journée et déclarez les espèces physiques en caisse.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date d'Activité</label>
                <input
                  type="date"
                  value={closureDate}
                  onChange={e => setClosureDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 font-bold text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Caissier / Opérateur</label>
                <input
                  type="text"
                  placeholder="Ex: Abdoulaye"
                  value={cashierName}
                  onChange={e => setCashierName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 font-bold text-sm text-ink"
                />
              </div>
            </div>

            {/* Recalculated Theoretical State */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">📊 Chiffre d'Affaires Théorique ({closureDate})</span>
              
              <div className="space-y-2.5">
                <div className="flex flex-col space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1.5 font-medium">🧺 Recettes Pressing (Total) :</span>
                    <span className="font-mono font-bold text-ink">{dailyPressingRevenue.toLocaleString()} FCFA</span>
                  </div>
                  <div className="pl-5 text-[10px] text-gray-400 flex flex-col space-y-0.5">
                    <span>• {dailyDepositsRevenue.toLocaleString()} FCFA (Acomptes sur {dailyPressingTickets.length} dépôts)</span>
                    <span>• {dailyBalancesRevenue.toLocaleString()} FCFA (Soldes sur {dailyBalancesCollected.length} retraits)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 flex items-center gap-1.5 font-medium">🛒 Ventes Détergents ({dailyDetergentSales.length} ventes) :</span>
                  <span className="font-mono font-bold text-ink">{dailyDetergentRevenue.toLocaleString()} FCFA</span>
                </div>
                <div className="border-t border-slate-200/60 pt-2.5 flex justify-between items-center">
                  <span className="font-black text-xs text-ink uppercase tracking-wider">💰 Total Théorique :</span>
                  <span className="font-mono font-black text-sm text-primary">{totalTheoreticalRevenue.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Traces and Detailed Receipts Ledger */}
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/60 space-y-4">
              <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest block">📜 Traces des Encaisses de la Journée ({closureDate})</span>
              
              {/* Deposits / Acomptes */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">📥 Acomptes reçus au Dépôt ({dailyPressingTickets.length}) :</span>
                {dailyPressingTickets.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic font-mono pl-3">Aucun acompte encaissé aujourd'hui.</p>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1 border border-indigo-100/50 rounded-xl p-2.5 bg-white">
                    {dailyPressingTickets.map(t => {
                      const depositPaid = t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0);
                      const methodLabel = t.paymentMethod === 'cash' ? '💵' : t.paymentMethod === 'mobile_money' ? '📱' : '💳';
                      return (
                        <div key={t.id} className="flex justify-between items-center text-[10px] py-0.5 border-b border-slate-50 last:border-0">
                          <span className="font-semibold text-gray-700">{t.ticketNumber} • {t.clientName}</span>
                          <span className="font-mono font-black text-emerald-600">{methodLabel} +{depositPaid.toLocaleString()} F</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Balances / Soldes */}
              <div className="space-y-2 pt-2 border-t border-indigo-100/30">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">💸 Règlements de Soldes au Retrait ({dailyBalancesCollected.length}) :</span>
                {dailyBalancesCollected.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic font-mono pl-3">Aucun solde collecté aujourd'hui.</p>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1 border border-indigo-100/50 rounded-xl p-2.5 bg-white">
                    {dailyBalancesCollected.map(t => {
                      const methodLabel = t.balanceCollectedMethod === 'cash' ? '💵' : t.balanceCollectedMethod === 'mobile_money' ? '📱' : '💳';
                      return (
                        <div key={t.id} className="flex justify-between items-center text-[10px] py-0.5 border-b border-slate-50 last:border-0">
                          <span className="font-semibold text-gray-700">{t.ticketNumber} • {t.clientName}</span>
                          <span className="font-mono font-black text-[#1e1b4b]">{methodLabel} +{(t.balanceCollectedAmount || 0).toLocaleString()} F</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Inputs */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Espèces Réelles Comptées</label>
                  <span className="text-[10px] font-mono font-semibold text-gray-400">Pour rapprochement</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="Entrez le montant cash réel"
                    value={actualCash || ''}
                    onChange={e => setActualCash(Number(e.target.value))}
                    className="w-full pl-4 pr-16 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 font-black text-sm text-ink font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">FCFA</span>
                </div>
              </div>

              {/* Rapprochement Renders */}
              {actualCash > 0 && (
                <div className={`p-4 rounded-xl border transition ${
                  actualCash === totalTheoreticalRevenue 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : actualCash > totalTheoreticalRevenue 
                      ? 'bg-blue-50 border-blue-100' 
                      : 'bg-rose-50 border-rose-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Rapprochement de caisse ({closureDate})</span>
                      <strong className={`text-sm font-black ${
                        actualCash === totalTheoreticalRevenue 
                          ? 'text-emerald-700' 
                          : actualCash > totalTheoreticalRevenue 
                            ? 'text-blue-700' 
                            : 'text-rose-700'
                      }`}>
                        {actualCash === totalTheoreticalRevenue 
                          ? '✅ Caisse parfaitement équilibrée' 
                          : actualCash > totalTheoreticalRevenue 
                            ? `🟢 Surplus de caisse (+${(actualCash - totalTheoreticalRevenue).toLocaleString()} FCFA)` 
                            : `⚠️ Manquant détecté (${(actualCash - totalTheoreticalRevenue).toLocaleString()} FCFA)`}
                      </strong>
                    </div>
                    <span className="font-mono font-bold text-xs">
                      {actualCash === totalTheoreticalRevenue ? 'OK' : `${actualCash - totalTheoreticalRevenue > 0 ? '+' : ''}${(actualCash - totalTheoreticalRevenue).toLocaleString()} F`}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Observations / Justifications</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Écart de caisse justifié par un acompte différé, commentaires..."
                  value={closureNotes}
                  onChange={e => setClosureNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 text-xs text-ink font-sans"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!cashierName.trim()) {
                    showAlert('Nom Opérateur Manquant', 'Veuillez spécifier votre nom de Caissier pour valider la clôture.', 'warning');
                    return;
                  }
                  
                  // Check if closure already exists for this date to prevent duplicate
                  if (closures.some(c => c.date === closureDate)) {
                    if (!confirm(`Une clôture de caisse existe déjà pour le ${closureDate}. Voulez-vous la remplacer ?`)) {
                      return;
                    }
                  }

                  const newClosure: PressingClosure = {
                    id: `closure_${Date.now()}`,
                    date: closureDate,
                    timestamp: new Date().toISOString(),
                    cashierName: cashierName.trim(),
                    totalPressingRevenue: dailyPressingRevenue,
                    totalDetergentRevenue: dailyDetergentRevenue,
                    totalExpenses: 0,
                    totalTheoreticalRevenue,
                    actualCashCounted: actualCash,
                    discrepancy: actualCash - totalTheoreticalRevenue,
                    notes: closureNotes.trim(),
                    status: 'closed',
                    sentToManager: false
                  };

                  let sentEmail = false;
                  if (autoEmailManager && managerEmail && managerEmail.trim()) {
                    toast.loading('Envoi automatique du rapport de clôture au Gérant...');
                    const success = await sendSilentBackgroundClosureEmailToManager(newClosure);
                    sentEmail = success;
                    newClosure.sentToManager = success;
                    if (success) {
                      showMailSuccessToast("Ce mail envoyé en arrière-plan avec succès !");
                    }
                  }

                  // Update State & localstorage
                  setClosures(prev => {
                    const filtered = prev.filter(c => c.date !== closureDate);
                    return [newClosure, ...filtered];
                  });

                  // Reset inputs
                  setActualCash(0);
                  setClosureNotes('');
                  toast.dismiss();
                  showAlert('Caisse Clause', `La clôture du ${closureDate} a bien été enregistrée avec succès !`, 'success');
                }}
                className="w-full bg-primary hover:bg-[#c93b3b] text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow"
              >
                🔒 Valider & Verrouiller la Caisse
              </button>
            </div>
          </div>

          {/* Historical Closures List */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-base font-black text-ink flex items-center gap-2">
              📜 Historique des Clôtures Journalières
            </h3>

            {closures.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center text-gray-400 space-y-2">
                <p className="text-xs font-bold font-mono">Aucun rapport de clôture archivé pour le moment.</p>
                <p className="text-[10px]">Utilisez le formulaire de gauche pour effectuer votre premier rapprochement.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {closures.map(c => {
                  const errorVal = c.discrepancy;
                  const isPerfect = errorVal === 0;
                  const isLoss = errorVal < 0;

                  return (
                    <div key={c.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition space-y-3 font-sans">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold font-mono rounded-md uppercase">
                            Date: {c.date}
                          </span>
                          <h4 className="text-xs font-black text-ink mt-1">Clôture par {c.cashierName}</h4>
                          <span className="text-[9px] text-gray-400 font-mono">Clos le {new Date(c.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 font-mono block">Écart caisse:</span>
                          <span className={`text-xs font-mono font-black ${
                            isPerfect ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-blue-600'
                          }`}>
                            {isPerfect ? '0 FCFA' : `${errorVal > 0 ? '+' : ''}${errorVal.toLocaleString()} FCFA`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl text-[10px] text-gray-500 font-mono text-center font-bold">
                        <div>
                          <span className="block text-[8px] text-gray-400">Pressing</span>
                          <strong className="text-ink text-xs block mt-1">{c.totalPressingRevenue.toLocaleString()} F</strong>
                        </div>
                        <div>
                          <span className="block text-[8px] text-gray-400">Détergents</span>
                          <strong className="text-ink text-xs block mt-1">{c.totalDetergentRevenue.toLocaleString()} F</strong>
                        </div>
                        <div>
                          <span className="block text-[8px] text-gray-400 font-bold">Total Réel</span>
                          <strong className="text-primary text-xs block mt-1 font-black">{c.actualCashCounted.toLocaleString()} F</strong>
                        </div>
                      </div>

                      {c.notes && (
                        <p className="text-[10px] text-gray-500 italic bg-amber-50/50 rounded-lg p-2 border border-amber-100/30">
                          <strong>Note :</strong> "{c.notes}"
                        </p>
                      )}

                      {/* Communication / manual Send buttons */}
                      <div className="border-t border-gray-100/80 pt-3 space-y-2">
                        <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest text-center">
                          Transférer au Manager
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => dispatchManagerClosureNotif(c, 'whatsapp')}
                            className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Gérant
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              toast.loading('Envoi du rapport par mail...');
                              const ok = await sendSilentBackgroundClosureEmailToManager(c);
                              toast.dismiss();
                              if (ok) {
                                showMailSuccessToast("Ce mail envoyé en arrière-plan avec succès !");
                                setClosureMailFeedback(prev => ({ ...prev, [c.id]: true }));
                              } else {
                                dispatchManagerClosureNotif(c, 'email');
                              }
                            }}
                            className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition"
                          >
                            <Mail className="w-3.5 h-3.5" /> E-mail Direct
                          </button>
                        </div>
                        {closureMailFeedback[c.id] && (
                          <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold bg-emerald-50 p-1.5 rounded-lg justify-center border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Ce mail envoyé en arrière-plan avec succès !
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tickets listings (Active vs History) */
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-black text-ink uppercase tracking-wider">
              {activeSubTab === 'active' ? '⏳ Dépôts En Cours / Prêt à Livrer' : activeSubTab === 'history' ? '✅ Historique des Livraisons Pressing' : '📋 Devis Proforma Pressing'}
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

          {/* Status Sub-Filters for Active Tickets */}
          {activeSubTab === 'active' && (
            <div className="flex flex-wrap gap-2 pb-2.5 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setWashStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  washStatusFilter === 'all'
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                Tous ({tickets.filter(t => t.status !== 'delivered' && t.status !== 'quotation').length})
              </button>
              <button
                type="button"
                onClick={() => setWashStatusFilter('deposed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  washStatusFilter === 'deposed'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100/60'
                }`}
              >
                🧺 Déposés ({tickets.filter(t => t.status === 'deposed').length})
              </button>
              <button
                type="button"
                onClick={() => setWashStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  washStatusFilter === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100/60'
                }`}
              >
                🧼 En Lavage ({tickets.filter(t => t.status === 'in_progress').length})
              </button>
              <button
                type="button"
                onClick={() => setWashStatusFilter('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  washStatusFilter === 'ready'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/60'
                }`}
              >
                👔 Prêts ({tickets.filter(t => t.status === 'ready').length})
              </button>
            </div>
          )}

          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-sm">Aucun ticket correspondant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest bg-gray-50/40">
                    <th className="px-6 py-4">N° Ticket</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Dépôt</th>
                    <th className="px-6 py-4">Facturation</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Action Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gray-50/80 transition group">
                      <td className="px-6 py-4 font-mono font-black text-ink">{ticket.ticketNumber}</td>
                      <td className="px-6 py-4 font-bold">
                        <div>{ticket.clientName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{ticket.clientPhone || 'Aucun contact'}</div>
                        {ticket.notes && (
                          <div className="text-[9px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 w-fit mt-1 max-w-[140px] truncate" title={ticket.notes}>
                            📝 {ticket.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">
                        <div>{ticket.depositDate}</div>
                        {ticket.expectedDeliveryDate && (
                          <div className="text-[10px] text-indigo-500 font-bold mt-1">📅 Retrait: {ticket.expectedDeliveryDate}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.billingType === 'article' ? (
                          <span className="px-2 py-1 bg-indigo-50 border border-indigo-100/40 text-indigo-600 font-bold text-[9px] rounded-lg">Articles ({Object.values(ticket.articles).reduce((a, b) => a + b, 0)})</span>
                        ) : (
                          <span className="px-2 py-1 bg-cyan-50 border border-cyan-100/40 text-cyan-600 font-bold text-[9px] rounded-lg">{ticket.weightKg} Kg ({ticket.weightService})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <div className="font-bold text-ink">{ticket.total.toLocaleString()} FCFA</div>
                        <div className="mt-1">
                          {ticket.status === 'quotation' ? (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded border border-indigo-100/40">DEVIS</span>
                          ) : ticket.paymentStatus === 'paid' ? (
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded border border-emerald-100/40">Payé 👍</span>
                          ) : (ticket.paymentStatus === 'partial' && (ticket.amountPaid || 0) > 0) ? (
                            <span className="text-[9px] bg-amber-50 text-amber-600 font-extrabold px-1.5 py-0.5 rounded border border-amber-100/40">Acompte: {ticket.amountPaid?.toLocaleString()} F</span>
                          ) : (
                            <span className="text-[9px] bg-rose-50 text-rose-600 font-extrabold px-1.5 py-0.5 rounded border border-rose-100/40">Reste: {ticket.total.toLocaleString()} F</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.status === 'quotation' ? (
                          <button
                            type="button"
                            onClick={() => {
                              updateStatus(ticket.id, 'deposed');
                              setActiveSubTab('active');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] tracking-wider rounded-lg px-3 py-1.5 shadow-sm inline-flex items-center"
                          >
                            Convertir Panier
                          </button>
                        ) : (
                          <select
                            value={ticket.status}
                            onChange={e => updateStatus(ticket.id, e.target.value as any)}
                            className={`font-black uppercase text-[10px] rounded-lg px-2 py-1 border outline-none ${
                              ticket.status === 'deposed' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                              ticket.status === 'in_progress' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                              ticket.status === 'ready' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                              'bg-gray-100 border-gray-200 text-gray-500'
                            }`}
                          >
                            <option value="deposed">Déposé 🧺</option>
                            <option value="in_progress">En Lavage 🧼</option>
                            <option value="ready">Prêt 👔</option>
                            <option value="delivered">Livré ✅</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 shrink-0">
                        {ticket.total - (ticket.amountPaid || 0) > 0 && ticket.status !== 'quotation' && (
                          <button
                            onClick={() => handleCollectBalance(ticket.id, 'cash')}
                            className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-lg font-black text-[9px] transition inline-flex items-center gap-1 cursor-pointer"
                            title="Encaisser le solde restant (Espèces por défaut)"
                          >
                            💸 Encaisser ({(ticket.total - (ticket.amountPaid || 0)).toLocaleString()} F)
                          </button>
                        )}
                        <button
                          onClick={() => setViewingTicket(ticket)}
                          className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-[9px] transition inline-flex items-center gap-1"
                          title="Détails"
                        >
                          <Eye className="w-3 h-3" /> Détails
                        </button>
                        <button
                          onClick={() => printPressingTicketDirect(merchant, ticket, '80mm', tarifs, handleDownloadPDF)}
                          className="p-1 px-2 bg-[#5c2197] text-white rounded-lg hover:bg-[#481977] font-bold text-[9px] transition inline-flex items-center gap-1"
                          title="Imprimer Ticket (80mm)"
                        >
                          <Printer className="w-3 h-3" /> Roll (80mm)
                        </button>
                        <button
                          onClick={() => printPressingTicketDirect(merchant, ticket, '58mm', tarifs, handleDownloadPDF)}
                          className="p-1 px-2 bg-[#7b2cbe] text-white rounded-lg hover:bg-[#6a24aa] font-bold text-[9px] transition inline-flex items-center gap-1"
                          title="Imprimer Ticket (58mm)"
                        >
                          <Printer className="w-3 h-3" /> Roll (58mm)
                        </button>
                        <button
                          onClick={() => printPressingTicketDirect(merchant, ticket, 'A4', tarifs, handleDownloadPDF)}
                          className="p-1 px-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-[9px] transition inline-flex items-center gap-1"
                          title="Imprimer Format A4"
                        >
                          <FileText className="w-3 h-3" /> A4
                        </button>
                        <button
                          onClick={() => deleteTicket(ticket.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg group-hover:opacity-100 transition inline-flex items-center"
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
      )}

      {/* Detail View Modal */}
      <AnimatePresence>
        {viewingTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#5c2197] to-[#481977] text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setViewingTicket(null)}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase mb-1">Ticket de Réception</div>
                <h3 className="text-xl font-black">{viewingTicket.ticketNumber}</h3>
                <p className="text-xs text-slate-300 mt-1">Géré par le pressing professionnel ACOM</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Client info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Client</span>
                    <span className="font-bold text-sm text-ink">{viewingTicket.clientName}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Téléphone / Contact</span>
                    <span className="font-bold text-sm text-ink font-mono">{viewingTicket.clientPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</span>
                    <span className="font-bold text-xs text-ink break-all font-mono">{viewingTicket.clientEmail || 'Non spécifié'}</span>
                  </div>
                </div>

                {/* Dates & Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Date de dépôt</span>
                    <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{viewingTicket.depositDate}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Retrait prévu ⚠️</span>
                    <span className="font-mono text-xs text-indigo-700 bg-indigo-50 font-bold px-2 py-1 rounded">
                      {viewingTicket.expectedDeliveryDate || 'Non spécifié'}
                    </span>
                  </div>
                </div>

                {viewingTicket.notes && (
                  <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-1">Observations / Remarques :</span>
                    <p className="text-xs text-amber-900 font-medium">{viewingTicket.notes}</p>
                  </div>
                )}

                {/* Prestations */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Détail des Prestations</span>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                    {viewingTicket.billingType === 'article' ? (
                      Object.keys(viewingTicket.articles).filter(k => viewingTicket.articles[k] > 0).map(k => {
                        const q = viewingTicket.articles[k];
                        const singlePrice = tarifs.articles[k as keyof typeof tarifs.articles] || 0;
                        return (
                          <div key={k} className="flex justify-between p-3 text-xs">
                            <span className="capitalize font-medium text-ink">- {k} <span className="text-gray-400 font-mono">x{q}</span></span>
                            <span className="font-mono font-bold text-ink">{(q * singlePrice).toLocaleString()} FCFA</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex justify-between p-3 text-xs">
                        <span className="font-medium text-ink">- Lavage au poids <span className="text-gray-400 font-mono">({viewingTicket.weightKg} Kg, {viewingTicket.weightService})</span></span>
                        <span className="font-mono font-bold text-ink">{(viewingTicket.weightKg * (tarifs.poids[viewingTicket.weightService] || 0)).toLocaleString()} FCFA</span>
                      </div>
                    )}

                    {/* Supplements */}
                    {Object.keys(viewingTicket.supplements).filter(k => viewingTicket.supplements[k]).map(k => {
                      const cost = viewingTicket.supplementTarifs[k] || 0;
                      const displayName = getSupplementDisplayName(k);
                      return (
                        <div key={k} className="flex justify-between p-3 text-xs bg-indigo-50/10 text-indigo-700">
                          <span>+ {displayName}</span>
                          <span className="font-mono font-bold">+{cost.toLocaleString()} FCFA</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="pt-3 border-t border-dashed border-gray-200 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-gray-500 font-bold">
                    <span>Sous-total prest. :</span>
                    <span>{(viewingTicket.subtotal + viewingTicket.supplementTotal).toLocaleString()} FCFA</span>
                  </div>
                  {viewingTicket.discount > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>Remise accordée :</span>
                      <span>-{viewingTicket.discount.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-100">
                    <span>{viewingTicket.status === 'quotation' ? 'Montant Devis :' : 'Prix global net :'}</span>
                    <span>{viewingTicket.total.toLocaleString()} FCFA</span>
                  </div>

                  {viewingTicket.status !== 'quotation' && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 mt-3">
                      <div className="flex justify-between text-[10px] text-gray-500 font-sans">
                        <span>Statut de paiement :</span>
                        <span className="font-bold uppercase tracking-wider">
                          {viewingTicket.paymentStatus === 'paid' ? "Payé d'avance 🟢" : (viewingTicket.paymentStatus === 'partial' && (viewingTicket.amountPaid || 0) > 0) ? 'Acompte versé 🟡' : 'Impayé au retrait 🔴'}
                        </span>
                      </div>
                      <div className="flex justify-between text-indigo-600 font-sans font-bold">
                        <span>Montant Versé :</span>
                        <span>{(viewingTicket.amountPaid || 0).toLocaleString()} FCFA</span>
                      </div>
                      {viewingTicket.total - (viewingTicket.amountPaid || 0) > 0 && (
                        <>
                          <div className="flex justify-between text-rose-600 font-sans font-black">
                            <span>Solde dû :</span>
                            <span>{(viewingTicket.total - (viewingTicket.amountPaid || 0)).toLocaleString()} FCFA</span>
                          </div>
                          <div className="mt-2.5 pt-2.5 border-t border-dashed border-gray-200">
                            <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-center">
                              💸 ENCAISSER LE SOLDE DÛ
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCollectBalance(viewingTicket.id, 'cash')}
                                className="py-1.5 px-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] rounded-lg transition text-center shadow-xs cursor-pointer uppercase tracking-wider"
                              >
                                Espèces
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCollectBalance(viewingTicket.id, 'mobile_money')}
                                className="py-1.5 px-1 bg-sky-600 hover:bg-sky-700 text-white font-black text-[9px] rounded-lg transition text-center shadow-xs cursor-pointer uppercase tracking-wider"
                              >
                                Mobile
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCollectBalance(viewingTicket.id, 'card')}
                                className="py-1.5 px-1 bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] rounded-lg transition text-center shadow-xs cursor-pointer uppercase tracking-wider"
                              >
                                Carte
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 🔔 Module de Suivi & Notifications en Temps Réel */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <h4 className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🔔</span> Suivi & Relance Client (Temps Réel)
                    </h4>
                    <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full uppercase">
                      WhatsApp & Mail
                    </span>
                  </div>

                  {/* Destinataires variables */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Téléphone/WhatsApp</label>
                      <input
                        type="text"
                        placeholder="N° de téléphone"
                        value={editedPhone}
                        onChange={e => setEditedPhone(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono font-semibold rounded-lg border border-gray-200 focus:ring-1 focus:ring-indigo-500 bg-white text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Adresse E-mail</label>
                      <input
                        type="email"
                        placeholder="Adresse email client"
                        value={editedEmail}
                        onChange={e => setEditedEmail(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono font-semibold rounded-lg border border-gray-200 focus:ring-1 focus:ring-indigo-500 bg-white text-ink"
                      />
                    </div>
                  </div>

                  {/* Template quick selects */}
                  <div>
                    <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sélectionner un modèle :</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {Object.keys(NOTIFICATION_TEMPLATES).map(key => {
                        const template = NOTIFICATION_TEMPLATES[key as keyof typeof NOTIFICATION_TEMPLATES];
                        const isSelected = selectedNotifTemplate === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setSelectedNotifTemplate(key as any)}
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
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider">Aperçu du message à envoyer :</label>
                      <span className="text-[8px] font-mono text-gray-400 font-semibold">({notifMessage.length} caract.)</span>
                    </div>
                    <textarea
                      value={notifMessage}
                      onChange={e => setNotifMessage(e.target.value)}
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
                        if (!editedPhone.trim()) {
                          showAlert('Téléphone Requis', 'Veuillez renseigner un numéro de téléphone.', 'warning');
                          return;
                        }
                        let cleaned = editedPhone.replace(/[^0-9]/g, '');
                        if (cleaned.length === 9 && cleaned.startsWith('7')) {
                          cleaned = '221' + cleaned;
                        }
                        
                        const waUrl = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(notifMessage)}`;
                        window.open(waUrl, '_blank');
                        
                        logNotificationSent('whatsapp', selectedNotifTemplate, notifMessage);
                        showAlert('Lien Généré', 'Le lien de suivi WhatsApp client a bien été généré !', 'success');
                      }}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm border border-emerald-500"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Suivi par WhatsApp
                    </button>

                    {/* Send Email Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!editedEmail.trim()) {
                          showAlert('E-mail Requis', 'Veuillez renseigner une adresse e-mail valide.', 'warning');
                          return;
                        }
                        const subject = NOTIFICATION_TEMPLATES[selectedNotifTemplate]?.subject || 'Suivi Pressing';
                        const mailtoUrl = `mailto:${editedEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(notifMessage)}`;
                        window.open(mailtoUrl, '_blank');
                        
                        logNotificationSent('email', selectedNotifTemplate, notifMessage);
                        showAlert('Messagerie Ouverte', 'Le message de relance client a bien été généré et ouvert dans votre application mail !', 'success');
                      }}
                      className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm border border-indigo-500"
                    >
                      <Mail className="w-3.5 h-3.5" /> Suivi par Email
                    </button>
                  </div>

                  {/* Timeline Logs in the modal */}
                  {viewingTicket.sentNotifications && viewingTicket.sentNotifications.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">Historique des envois :</span>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                        {viewingTicket.sentNotifications.map((l, idx) => (
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

                  <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                    Notification formatée envoyée au Gérant pour le suivi des <strong className="text-indigo-600 font-bold">entrées et les sorties (depuis la distance)</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pb-1 bg-white p-2.5 rounded-xl border border-indigo-100/50">
                    <div className="col-span-2 text-[9px] font-mono font-black text-indigo-700 uppercase tracking-wider mb-0.5 text-center">
                      📥 ENTRÉE (Dépôt Enregistré)
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatchManagerNotif(viewingTicket, 'entrée', 'whatsapp')}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchManagerNotif(viewingTicket, 'entrée', 'email')}
                      className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <Mail className="w-3 h-3" /> E-mail
                    </button>
                  </div>
                  {ticketMailFeedback[viewingTicket.id] && (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold bg-emerald-50 mt-2 p-1.5 rounded-lg justify-center border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ce mail envoyé en arrière-plan avec succès !
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-indigo-100/50">
                    <div className="col-span-2 text-[9px] font-mono font-black text-indigo-700 uppercase tracking-wider mb-0.5 text-center">
                      👔 SORTIE (Prêt / Livré)
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatchManagerNotif(viewingTicket, 'sortie', 'whatsapp')}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchManagerNotif(viewingTicket, 'sortie', 'email')}
                      className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <Mail className="w-3 h-3" /> E-mail
                    </button>
                  </div>
                  {ticketMailFeedback[viewingTicket.id] && (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold bg-emerald-50 mt-2 p-1.5 rounded-lg justify-center border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ce mail envoyé en arrière-plan avec succès !
                    </div>
                  )}
                </div>
              </div>

              {/* Actions footer */}
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => printPressingTicketDirect(merchant, viewingTicket, '80mm', tarifs, handleDownloadPDF)}
                  className="flex-1 bg-[#5c2197] hover:bg-[#481977] text-white font-bold text-[10px] sm:text-[11px] py-3 rounded-xl flex items-center justify-center gap-1 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Roll (80mm)
                </button>
                <button
                  type="button"
                  onClick={() => printPressingTicketDirect(merchant, viewingTicket, '58mm', tarifs, handleDownloadPDF)}
                  className="flex-1 bg-[#7b2cbe] hover:bg-[#6a24aa] text-white font-bold text-[10px] sm:text-[11px] py-3 rounded-xl flex items-center justify-center gap-1 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Roll (58mm)
                </button>
                <button
                  type="button"
                  onClick={() => printPressingTicketDirect(merchant, viewingTicket, 'A4', tarifs, handleDownloadPDF)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] sm:text-[11px] py-3 rounded-xl flex items-center justify-center gap-1 transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Client A4
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTicket(null)}
                  className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs py-3 rounded-xl transition"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AcomAlertPopup
        isOpen={popup.isOpen}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
        {...popup}
      />
    </motion.div>
  );
};