import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../db/db';
import { Merchant } from '../../../types';
import { PressingTicket, PressingTarifs, PressingClosure, DetergentSale } from '../types';
import { OptimizedImage } from '../../../components/OptimizedImage';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { AcomAlertPopup } from '../../../components/AcomAlertPopup';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';
import { 
    Save, X, Loader2, Trash2, Printer, Search, 
    Filter, FileText, Check, DollarSign, Clock,
    MessageSquare, Mail
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

export const PressingClosureManager = ({ merchant }: { merchant: Merchant }) => {
  const [closures, setClosures] = useState<PressingClosure[]>(() => {
    const saved = localStorage.getItem(`pressing_closures_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [closureMailFeedback, setClosureMailFeedback] = useState<Record<string, boolean>>({});

  const [closureDate, setClosureDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [cashierName, setCashierName] = useState('');
  const [actualCash, setActualCash] = useState<number>(0);
  const [closureNotes, setClosureNotes] = useState('');

  // Unified pop-up state for PressingClosureManager
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

  const managerPhone = merchant.managerNotifications?.whatsappPhone || '';
  const managerEmail = merchant.managerNotifications?.email || '';
  const autoEmailManager = merchant.managerNotifications?.notifyOnCashClosure !== false;

  useEffect(() => {
    localStorage.setItem(`pressing_closures_${merchant.id}`, JSON.stringify(closures));
  }, [closures, merchant.id]);

  // Read direct database inputs
  const tickets = useMemo<PressingTicket[]>(() => {
    try {
      const saved = localStorage.getItem(`pressing_tickets_${merchant.id}`);
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('📦 [PressingClosure] Loaded tickets:', parsed.length, 'for date:', closureDate);
      return parsed;
    } catch (err) {
      console.error('Error loading pressing tickets:', err);
      return [];
    }
  }, [merchant.id, closures, closureDate]);

  const detergentSales = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(`pressing_stock_sales_${merchant.id}`);
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('🛒 [PressingClosure] Loaded sales:', parsed.length);
      return parsed;
    } catch (err) {
      console.error('Error loading detergent sales:', err);
      return [];
    }
  }, [merchant.id, closures, closureDate]);

  // Fetch local expenses using safe useLiveQuery
  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , []) || [];

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

  // Memos for daily stats
  const dailyPressingTickets = useMemo(() => {
    return tickets.filter(t => {
      if (t.status === 'quotation') return false;
      if (!t.depositDate) return false;
      if (t.depositDate === closureDate || t.depositDate.startsWith(closureDate)) return true;
      if (t.depositDate.includes('T')) {
        try {
          if (format(new Date(t.depositDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);

  const dailyDepositsRevenue = useMemo(() => {
    return dailyPressingTickets.reduce((sum, t) => {
      let atDeposit = 0;
      if (t.amountPaidAtDeposit !== undefined && t.amountPaidAtDeposit !== null && !isNaN(parseFloat(String(t.amountPaidAtDeposit)))) {
        atDeposit = parseFloat(String(t.amountPaidAtDeposit));
      } else if (t.amountPaid !== undefined && t.amountPaid !== null && !isNaN(parseFloat(String(t.amountPaid)))) {
        atDeposit = parseFloat(String(t.amountPaid));
      } else if (t.paymentStatus === 'paid') {
        atDeposit = parseFloat(String(t.total || 0));
      } else if (t.paymentStatus === 'partial') {
        atDeposit = parseFloat(String(t.total || 0)) / 2;
      } else {
        atDeposit = t.paymentStatus === 'unpaid' ? 0 : parseFloat(String(t.total || 0));
      }
      if (isNaN(atDeposit)) atDeposit = 0;
      return sum + atDeposit;
    }, 0);
  }, [dailyPressingTickets]);

  const dailyBalancesCollected = useMemo(() => {
    return tickets.filter(t => {
      if (!t.balanceCollectedDate) return false;
      if (t.balanceCollectedDate === closureDate || t.balanceCollectedDate.startsWith(closureDate)) return true;
      if (t.balanceCollectedDate.includes('T')) {
        try {
          if (format(new Date(t.balanceCollectedDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);

  const dailyBalancesRevenue = useMemo(() => {

    return dailyBalancesCollected.reduce((sum, t) => {
      let balance = parseFloat(String(t.balanceCollectedAmount));
      if (isNaN(balance)) balance = 0;
      return sum + balance;
    }, 0);
  }, [dailyBalancesCollected]);

  const dailyPressingRevenue = useMemo(() => {
    return dailyDepositsRevenue + dailyBalancesRevenue;
  }, [dailyDepositsRevenue, dailyBalancesRevenue]);

  const dailyDetergentSales = useMemo(() => {
    return detergentSales.filter(s => {
      if (!s.date) return false;
      if (s.date.startsWith(closureDate)) return true;
      if (s.date.includes('T')) {
        try {
          if (format(new Date(s.date), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [detergentSales, closureDate]);

  const dailyDetergentRevenue = useMemo(() => {
    return dailyDetergentSales.reduce((sum, s) => {
      let total = parseFloat(String(s.total));
      if (isNaN(total)) total = 0;
      return sum + total;
    }, 0);
  }, [dailyDetergentSales]);

  // Expenses filter
  const dailyExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.date && e.date.startsWith(closureDate)) return true;
      if (e.createdAt) {
        try {
          const d = e.createdAt.seconds ? new Date(e.createdAt.seconds * 1000) : new Date(e.createdAt);
          return d.toISOString().startsWith(closureDate);
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [expenses, closureDate]);

  const dailyExpensesTotal = useMemo(() => {
    return dailyExpenses.reduce((sum, e) => {
      let amount = parseFloat(String(e.amount));
      if (isNaN(amount)) amount = 0;
      return sum + amount;
    }, 0);
  }, [dailyExpenses]);

  // Expected cash in hand including expenditures
  const totalTheoreticalRevenue = useMemo(() => {
    return dailyPressingRevenue + dailyDetergentRevenue - dailyExpensesTotal;
  }, [dailyPressingRevenue, dailyDetergentRevenue, dailyExpensesTotal]);

  const getManagerClosureNotificationMessage = useCallback((c: PressingClosure) => {
    const diffSign = c.discrepancy >= 0 ? '+' : '';
    const diffText = c.discrepancy === 0 ? 'Parfait (0 FCFA)' : `${diffSign}${c.discrepancy} FCFA`;
    
    let message = `👑 [CLÔTURE DE CAISSE DE PRESSING] 📊\n` +
           `--------------------------------\n` +
           `• Date d'Activité : ${c.date}\n` +
           `• Date Clôture : ${new Date(c.timestamp).toLocaleString('fr-FR')}\n` +
           `• Caissier / Opérateur : ${c.cashierName || 'Non renseigné'}\n` +
           `--------------------------------\n` +
           `RÉSUMÉ DES FLUX :\n` +
           `• Recettes Services Pressing : +${c.totalPressingRevenue.toLocaleString()} FCFA\n` +
           `• Ventes Produits Détergents : +${c.totalDetergentRevenue.toLocaleString()} FCFA\n` +
           `• Dépenses Enregistrées : -${(c.totalExpenses || 0).toLocaleString()} FCFA\n` +
           `--------------------------------\n` +
           `• SOLDE ATTENDU (Théorique) : ${c.totalTheoreticalRevenue.toLocaleString()} FCFA\n` +
           `• ESPÈCES RÉELLES COMPTÉES : ${c.actualCashCounted.toLocaleString()} FCFA\n` +
           `• ÉCART DE CAISSE : ${diffText} (${c.discrepancy < 0 ? '⚠️ MANQUANT' : c.discrepancy > 0 ? '🟢 SURPLUS' : '✅ EQUILIBRE'})\n` +
           `--------------------------------\n`;

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
  }, [merchant, lowStockItems, outOfStockItems]);

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
          <h3 style="color: ${themeColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">📊 État de la Caisse (Intègre les dépenses)</h3>
          
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
              <td colspan="2" style="padding: 15px 0 5px 0; font-weight: bold; color: ${themeColor}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">DÉTAIL DES FLUX :</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">• Recettes Services Pressing :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">+${c.totalPressingRevenue.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">• Ventes Détergents & Produits :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">+${c.totalDetergentRevenue.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">• Total Dépenses du Jour :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #ef4444;">-${(c.totalExpenses || 0).toLocaleString()} FCFA</td>
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

        <div style="margin-top: 35px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
          Ce rapport de clôture intégrant les dépenses a été expédié automatiquement en temps réel au gérant.<br/>
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

      const resData = await response.json().catch(() => null);
      if (response.ok && resData?.success !== false) {
        return true;
      } else {
        console.warn('Error dispatching silent manager background mail:', resData || response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error dispatching silent manager background mail:', error);
      return false;
    }
  }, [managerEmail, merchant, lowStockItems, outOfStockItems]);

  const dispatchManagerClosureNotif = (c: PressingClosure, method: 'whatsapp' | 'email') => {
    const textNotif = getManagerClosureNotificationMessage(c);
    
    if (method === 'whatsapp') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const url = `https://${isMobile ? 'api' : 'web'}.whatsapp.com/send?phone=${managerPhone.replace(/\s+/g, '')}&text=${encodeURIComponent(textNotif)}`;
      window.open(url, '_blank');
      showAlert('Rapport WhatsApp', 'Rapport de clôture prêt pour envoi via WhatsApp ! Nous avons ouvert la messagerie.', 'success', undefined, false, "D'ACCORD", "COMMUNICATION EN COURS");
    } else {
      const url = `mailto:${managerEmail}?subject=${encodeURIComponent(`📊 CLÔTURE DE CAISSE JOURNALIÈRE — ${c.date}`)}&body=${encodeURIComponent(textNotif)}`;
      window.open(url, '_blank');
      showAlert('Rapport Email', "Rapport de clôture prêt dans votre logiciel d'e-mail !", 'success', undefined, false, "D'ACCORD", "COMMUNICATION EN COURS");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-ink">🔒 Clôture de Caisse & Rapport Journalier</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Supervision journalière & rapprochement financier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Closure Form & Reconciliation Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-ink">🔑 Clôturer la caisse d'aujourd'hui</h3>
                <p className="text-gray-400 text-xs mt-0.5">Vérifiez les calculs puis saisissez l'encours en espèces.</p>
              </div>
              <input
                type="date"
                value={closureDate}
                onChange={e => setClosureDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#5c2197]/20 bg-gray-50/50"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100/40 text-center">
                  <span className="block text-[8px] font-mono text-[#5c2197] uppercase tracking-wider">Recettes Pressing (+)</span>
                  <strong className="block text-base font-black text-[#481977] mt-1">{dailyPressingRevenue.toLocaleString()} F</strong>
                  <span className="text-[8px] text-[#5c2197] font-mono mt-0.5 block">
                    {dailyDepositsRevenue.toLocaleString()} F ({dailyPressingTickets.length} dép) + {dailyBalancesRevenue.toLocaleString()} F ({dailyBalancesCollected.length} soldes)
                  </span>
                </div>
                <div className="p-4 bg-cyan-50/60 rounded-2xl border border-cyan-100/40 text-center">
                  <span className="block text-[8px] font-mono text-cyan-400 uppercase tracking-wider">Ventes Produits (+)</span>
                  <strong className="block text-base font-black text-cyan-900 mt-1">{dailyDetergentRevenue.toLocaleString()} F</strong>
                  <span className="text-[8px] text-cyan-500 font-mono mt-0.5 block">{dailyDetergentSales.length} ventes de boutique</span>
                </div>
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100/45 text-center">
                  <span className="block text-[8px] font-mono text-rose-400 uppercase tracking-wider">Dépenses du Jour (-)</span>
                  <strong className="block text-base font-black text-rose-900 mt-1">{dailyExpensesTotal.toLocaleString()} F</strong>
                  <span className="text-[8px] text-rose-500 font-mono mt-0.5 block">{dailyExpenses.length} justificatifs saisis</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">📊 Chiffre d'Affaires Théorique Attendu</span>
                <strong className="text-2xl font-black text-ink mt-1 block">
                  {totalTheoreticalRevenue.toLocaleString()} <span className="text-sm font-medium">{merchant.currency || 'FCFA'}</span>
                </strong>
                <p className="text-[9px] text-gray-400 mt-1">Calcul : Recettes Pressing + Produits boutique - Dépenses du jour</p>
              </div>

              {/* Input section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nom du Caissier / Opérateur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kouamé Marc"
                    value={cashierName}
                    onChange={e => setCashierName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 text-xs font-bold bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Espèces Réelles Comptées * ({merchant.currency || 'F'})</label>
                  <input
                    type="number"
                    required
                    value={actualCash || ''}
                    onChange={e => setActualCash(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5c2197]/20 text-xs font-mono font-black bg-gray-50/50"
                  />
                </div>
              </div>

              {actualCash > 0 && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  actualCash === totalTheoreticalRevenue 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : actualCash > totalTheoreticalRevenue 
                      ? 'bg-blue-50 border-blue-200 text-blue-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
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

              {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                  <h4 className="text-sm font-bold text-orange-800 mb-2">🚨 Alertes de Stock</h4>
                  {outOfStockItems.length > 0 && (
                    <div className="text-xs text-orange-900 mb-1">
                      <span className="font-bold text-red-600">❌ Épuisés :</span> {outOfStockItems.map(p => p.name).join(', ')}
                    </div>
                  )}
                  {lowStockItems.length > 0 && (
                    <div className="text-xs text-orange-900">
                      <span className="font-bold text-orange-600">⚠️ Point de rupture :</span> {lowStockItems.map(p => `${p.name} (${p.stock || 0})`).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Observations / Justifications</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Écart de caisse justifié par les dépenses de détergents ou petite monnaie manquante..."
                  value={closureNotes}
                  onChange={e => setClosureNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 text-xs text-ink font-sans"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!cashierName.trim()) {
                    showAlert('Nom Opérateur Manquant', 'Veuillez spécifier votre nom de Caissier.', 'error');
                    return;
                  }
                  
                  const runClosureCreation = async () => {
                    const newClosure: PressingClosure = {
                      id: `closure_${Date.now()}`,
                      date: closureDate,
                      timestamp: new Date().toISOString(),
                      cashierName: cashierName.trim(),
                      totalPressingRevenue: dailyPressingRevenue,
                      totalDetergentRevenue: dailyDetergentRevenue,
                      totalExpenses: dailyExpensesTotal,
                      totalTheoreticalRevenue,
                      actualCashCounted: actualCash,
                      discrepancy: actualCash - totalTheoreticalRevenue,
                      notes: closureNotes.trim(),
                      status: 'closed',
                      sentToManager: false
                    };

                    let sentEmail = false;
                    let hasAttemptedEmail = false;
                    if (autoEmailManager && managerEmail && managerEmail.trim()) {
                      hasAttemptedEmail = true;
                      const toastId = toast.loading('Envoi automatique du rapport de clôture au Gérant...');
                      const success = await sendSilentBackgroundClosureEmailToManager(newClosure);
                      sentEmail = success;
                      newClosure.sentToManager = success;
                      toast.dismiss(toastId);
                      if (success) {
                        toast.success('Rapport de clôture envoyé par e-mail au gérant !');
                      } else {
                        toast.error("Rapport par e-mail non envoyé (clé Resend non configurée ou invalide).");
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

                    // User feedback
                    if (hasAttemptedEmail && !sentEmail) {
                      showAlert(
                        'Caisse Clôturée avec Succès',
                        `La caisse du jour (${closureDate}) a été clôturée et verrouillée avec succès !\n\n⚠️ Remarque : Le rapport automatique par e-mail n'a pas pu être délivré au gérant (clé API Resend invalide ou non configurée dans les Paramètres > Notifications Gérant). Vous pouvez partager le rapport via WhatsApp ou Mail direct.`,
                        'success',
                        undefined,
                        false,
                        "D'ACCORD",
                        "CLÔTURE EFFECTUÉE"
                      );
                    } else {
                      showAlert(
                        'Caisse Clôturée avec Succès',
                        `La caisse du jour (${closureDate}) a été clôturée et verrouillée avec succès !`,
                        'success',
                        undefined,
                        false,
                        "D'ACCORD",
                        "CLÔTURE EFFECTUÉE"
                      );
                    }
                    
                    if (!hasAttemptedEmail) {
                      showAlert('Clôture Enregistrée', `Clôture du ${closureDate} enregistrée à l'instant avec succès !`, 'success', undefined, false, "D'ACCORD", "COFFRE FORT");
                    }
                  };

                  // Check if closure already exists for this date to prevent duplicate
                  if (closures.some(c => c.date === closureDate)) {
                    showAlert(
                      'Écraser la clôture existante ?',
                      `Une clôture de caisse existe déjà pour le ${closureDate}.\nVoulez-vous la remplacer par ce nouveau rapprochement ?`,
                      'warning',
                      runClosureCreation,
                      true,
                      'REMPLACER'
                    );
                  } else {
                    await runClosureCreation();
                  }
                }}
                className="w-full bg-primary hover:bg-[#c93b3b] text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow"
              >
                🔒 Valider & Verrouiller la Caisse
              </button>
            </div>
          </div>
        </div>

        {/* Historical Closures List */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-black text-ink flex items-center gap-2">
            📜 Historique des Clôtures Journalières
          </h3>

          {closures.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 space-y-2 shadow-sm">
              <p className="text-xs font-bold font-mono">Aucun rapport de clôture archivé pour le moment.</p>
              <p className="text-[10px]">Utilisez le formulaire de gauche pour effectuer votre premier rapprochement.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
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

                    <div className="grid grid-cols-4 gap-1.5 bg-gray-50 p-2.5 rounded-xl text-[10px] text-gray-500 font-mono text-center font-bold">
                      <div>
                        <span className="block text-[7px] text-gray-400">Recettes Pressing</span>
                        <strong className="text-ink text-[11px] block mt-1">{c.totalPressingRevenue.toLocaleString()} F</strong>
                      </div>
                      <div>
                        <span className="block text-[7px] text-gray-400">Détergents</span>
                        <strong className="text-ink text-[11px] block mt-1">{c.totalDetergentRevenue.toLocaleString()} F</strong>
                      </div>
                      <div>
                        <span className="block text-[7px] text-rose-500">Dépenses</span>
                        <strong className="text-rose-600 text-[11px] block mt-1">{(c.totalExpenses || 0).toLocaleString()} F</strong>
                      </div>
                      <div>
                        <span className="block text-[7px] text-gray-400 font-bold">Total Réel</span>
                        <strong className="text-primary text-[11px] block mt-1 font-black">{c.actualCashCounted.toLocaleString()} F</strong>
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
                            const toastId = toast.loading('Envoi du rapport par mail...');
                            const ok = await sendSilentBackgroundClosureEmailToManager(c);
                            toast.dismiss(toastId);
                            if (ok) {
                              showAlert(
                                'Notification Gérant',
                                'Ce mail envoyé en arrière-plan avec succès !',
                                'success',
                                undefined,
                                false,
                                "D'ACCORD",
                                "ENVOI D'E-MAIL"
                              );
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

      {/* Modern custom Alert Popup for all messages and notifications in closure manager */}
      <AcomAlertPopup
        isOpen={popup.isOpen}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
        {...popup}
      />
    </motion.div>
  );
};