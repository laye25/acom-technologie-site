import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../db/db';
import { Merchant } from '../../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { AcomAlertPopup } from '../../../components/AcomAlertPopup';
import { 
  Lock, ShieldCheck, DollarSign, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Printer, Search, FileText, Calendar, User, RefreshCw, ShoppingBag, Palette, Calculator,
  X, Mail, MessageSquare, Check, Info, Layers, Box, ChevronRight, Eye, Download, ChevronDown, ChevronUp
} from 'lucide-react';

export interface TailleurClosureExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  beneficiary?: string;
  description?: string;
}

export interface TailleurClosure {
  id: string;
  date: string;
  timestamp: string;
  cashierName: string;
  totalCoutureAdvances: number;
  totalCoutureBalances: number;
  totalBoutiqueRevenue: number;
  totalOtherRevenue: number;
  totalGeneralExpenses?: number;
  totalArtisanExpenses?: number;
  totalExpenses: number;
  totalTheoreticalRevenue: number;
  actualCashCounted: number;
  discrepancy: number;
  status: 'EQUILIBRE' | 'EXCEDENT' | 'DEFICIT';
  notes: string;
  sentToManagerEmail?: boolean;
  sentToManagerWA?: boolean;
  expensesDetails?: TailleurClosureExpenseItem[];
  stockAlertsSummary?: {
    boutiqueCount: number;
    tissusCount: number;
    mercerieCount: number;
  };
}

export const isArtisanExpense = (e: any): boolean => {
  if (!e) return false;
  const id = String(e.id || '').toLowerCase();
  const cat = String(e.category || '').toLowerCase();
  const title = String(e.title || '').toLowerCase();
  const desc = String(e.description || '').toLowerCase();

  return (
    id.includes('exp_artisan') ||
    id.includes('sal-pay') ||
    cat.includes('artisan') ||
    cat.includes('rémunération') ||
    cat.includes('remuneration') ||
    cat.includes('salaire') ||
    cat.includes('paie') ||
    cat.includes('équipe') ||
    cat.includes('equipe') ||
    cat.includes("main d'œuvre") ||
    cat.includes("main d'oeuvre") ||
    cat.includes('prestataire') ||
    title.includes('artisan') ||
    title.includes('rémunération') ||
    title.includes('remuneration') ||
    title.includes('salaire') ||
    title.includes('acompte artisan') ||
    title.includes('paie') ||
    title.includes('couturier') ||
    title.includes('brodeur') ||
    title.includes('presseurs') ||
    title.includes('tailleur') ||
    desc.includes('artisan') ||
    desc.includes('rémunération') ||
    desc.includes('remuneration') ||
    desc.includes('salaire artisan') ||
    desc.includes('couturier') ||
    desc.includes('brodeur') ||
    desc.includes('sal-pay')
  );
};

export const getClosureExpenseBreakdown = (c: TailleurClosure, allExpensesList: any[] = []) => {
  // 1. If stored breakdown is valid (non-zero or sums up to c.totalExpenses)
  const hasValidStoredBreakdown =
    typeof c.totalGeneralExpenses === 'number' &&
    typeof c.totalArtisanExpenses === 'number' &&
    (c.totalGeneralExpenses + c.totalArtisanExpenses === c.totalExpenses || c.totalExpenses === 0) &&
    (c.totalExpenses === 0 || c.totalGeneralExpenses > 0 || c.totalArtisanExpenses > 0);

  if (hasValidStoredBreakdown) {
    return {
      general: c.totalGeneralExpenses!,
      artisan: c.totalArtisanExpenses!,
      total: c.totalExpenses,
      details: c.expensesDetails || []
    };
  }

  // 2. If expensesDetails are attached on the closure object itself
  if (Array.isArray(c.expensesDetails) && c.expensesDetails.length > 0) {
    const artisanFromDetails = c.expensesDetails
      .filter(e => isArtisanExpense(e))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const generalFromDetails = c.expensesDetails
      .filter(e => !isArtisanExpense(e))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    if (artisanFromDetails + generalFromDetails > 0) {
      return {
        general: generalFromDetails,
        artisan: artisanFromDetails,
        total: c.totalExpenses || (artisanFromDetails + generalFromDetails),
        details: c.expensesDetails
      };
    }
  }

  // 3. Fallback: Lookup matching expenses from DB/allExpensesList for this closure date
  const cDate = c.date;
  const matchingExpenses = (allExpensesList || []).filter(e => {
    if (!e) return false;
    if (e.date && String(e.date).startsWith(cDate)) return true;
    if (e.createdAt) {
      try {
        const d = typeof e.createdAt === 'string' ? e.createdAt : (e.createdAt.seconds ? new Date(e.createdAt.seconds * 1000).toISOString() : new Date(e.createdAt).toISOString());
        return d.startsWith(cDate);
      } catch {
        return false;
      }
    }
    return false;
  });

  const artisanExps = matchingExpenses.filter(e => isArtisanExpense(e));
  const generalExps = matchingExpenses.filter(e => !isArtisanExpense(e));

  let artisanTot = artisanExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  let generalTot = generalExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Reconcile discrepancy if legacy totalExpenses exists but items don't sum up perfectly
  if (artisanTot + generalTot !== c.totalExpenses && c.totalExpenses > 0) {
    if (artisanTot > 0 && generalTot === 0) {
      artisanTot = c.totalExpenses;
    } else if (generalTot > 0 && artisanTot === 0) {
      generalTot = c.totalExpenses;
    } else if (artisanTot === 0 && generalTot === 0) {
      generalTot = c.totalExpenses;
    } else {
      generalTot = c.totalExpenses - artisanTot;
    }
  }

  const details: TailleurClosureExpenseItem[] = matchingExpenses.length > 0 ? matchingExpenses.map(e => ({
    id: e.id,
    title: e.title || e.description || 'Sortie de caisse',
    category: isArtisanExpense(e) ? 'Rémunérations Artisans & Équipe' : (e.category || 'Dépenses Générales'),
    amount: Number(e.amount || 0),
    date: e.date || e.createdAt || cDate,
    description: e.description
  })) : (c.expensesDetails || []);

  return {
    general: generalTot,
    artisan: artisanTot,
    total: c.totalExpenses,
    details
  };
};

interface TailleurClosureManagerProps {
  merchant: Merchant;
}

export const TailleurClosureManager: React.FC<TailleurClosureManagerProps> = ({ merchant }) => {
  const currency = merchant.currency || 'FCFA';

  // Saved Closures in localStorage
  const [closures, setClosures] = useState<TailleurClosure[]>(() => {
    try {
      const saved = localStorage.getItem(`tailleur_closures_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`tailleur_closures_${merchant.id}`, JSON.stringify(closures));
    } catch (e) {
      console.error('Error saving closures to localStorage:', e);
    }
  }, [closures, merchant.id]);

  // 6. DATA SOURCE: Dexie Expenses
  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  // Auto-repair inconsistent saved closures where breakdown is 0/0 despite totalExpenses > 0
  useEffect(() => {
    if (!closures || closures.length === 0 || !expenses) return;
    let needsUpdate = false;
    const repaired = closures.map(c => {
      const isZeroBreakdown = (c.totalGeneralExpenses === 0 && c.totalArtisanExpenses === 0) || (c.totalGeneralExpenses || 0) + (c.totalArtisanExpenses || 0) !== c.totalExpenses;
      if (c.totalExpenses > 0 && isZeroBreakdown) {
        const b = getClosureExpenseBreakdown(c, expenses);
        needsUpdate = true;
        return {
          ...c,
          totalGeneralExpenses: b.general,
          totalArtisanExpenses: b.artisan,
          expensesDetails: b.details.length > 0 ? b.details : c.expensesDetails
        };
      }
      return c;
    });

    if (needsUpdate) {
      setClosures(repaired);
    }
  }, [expenses]);

  // Form State
  const [closureDate, setClosureDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [cashierName, setCashierName] = useState('');
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [closureNotes, setClosureNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected closure for detailed modal view
  const [selectedClosure, setSelectedClosure] = useState<TailleurClosure | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Manager Notifications Settings
  const managerPhone = merchant.managerNotifications?.whatsappPhone || merchant.phone || '';
  const managerEmail = merchant.managerNotifications?.email || merchant.email || '';
  const autoNotifyManager = merchant.managerNotifications?.notifyOnCashClosure !== false;

  // 1. DATA SOURCE: Orders Couture (tailleur_orders_${merchant.id})
  const orders = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, closureDate, closures]);

  // 2. DATA SOURCE: Boutique Sales (tailleur_boutique_sales_${merchant.id})
  const boutiqueSales = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(`tailleur_boutique_sales_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, closureDate, closures]);

  // 3. DATA SOURCE: Boutique Articles (tailleur_boutique_${merchant.id})
  const boutiqueArticles = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(`tailleur_boutique_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id]);

  // 4. DATA SOURCE: Tissus & Wax (tailleur_tissus_${merchant.id})
  const tissus = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(`tailleur_tissus_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id]);

  // 5. DATA SOURCE: Mercerie (tailleur_mercerie_${merchant.id})
  const mercerie = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(`tailleur_mercerie_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id]);

  // 7. DATA SOURCE: Dexie Sales (other revenues)
  const dexieSales = useLiveQuery(() =>
    db.sales.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  // --- CALCULATIONS FOR THE SELECTED CLOSURE DATE ---

  // Acomptes Couture
  const dailyCoutureOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o) return false;
      const d = o.depositDate || o.createdAt || o.date;
      if (!d) return false;
      return String(d).startsWith(closureDate);
    });
  }, [orders, closureDate]);

  const dailyCoutureAdvancesTotal = useMemo(() => {
    return dailyCoutureOrders.reduce((sum, o) => {
      const adv = Number(o.advance || o.depositAmount || o.amountPaidAtDeposit || 0);
      return sum + (isNaN(adv) ? 0 : adv);
    }, 0);
  }, [dailyCoutureOrders]);

  // Règlements & Soldes Couture
  const dailyCoutureBalancesOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o) return false;
      const createdOnClosure = o.createdAt && String(o.createdAt).startsWith(closureDate);
      const updatedOnClosure = o.updatedAt && String(o.updatedAt).startsWith(closureDate);
      
      // If payment history array exists
      if (Array.isArray(o.paymentsHistory) && o.paymentsHistory.length > 0) {
        return o.paymentsHistory.some((p: any) => p.date && String(p.date).startsWith(closureDate));
      }
      
      // If updated today and advance > 0 and wasn't just created today
      if (updatedOnClosure && !createdOnClosure && Number(o.advance || 0) > 0) {
        return true;
      }

      // Explicit balance collected date
      if (o.balanceCollectedDate && String(o.balanceCollectedDate).startsWith(closureDate)) {
        return true;
      }

      return false;
    });
  }, [orders, closureDate]);

  const dailyCoutureBalancesTotal = useMemo(() => {
    return dailyCoutureBalancesOrders.reduce((sum, o) => {
      if (Array.isArray(o.paymentsHistory) && o.paymentsHistory.length > 0) {
        const todayPayments = o.paymentsHistory
          .filter((p: any) => p.date && String(p.date).startsWith(closureDate))
          .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
        return sum + todayPayments;
      }
      
      const price = Number(o.price || 0);
      const adv = Number(o.advance || 0);
      if (o.balanceCollectedAmount !== undefined) {
        return sum + Number(o.balanceCollectedAmount || 0);
      }
      // Fallback: if fully paid or updated balance
      return sum + (adv > 0 ? adv : price);
    }, 0);
  }, [dailyCoutureBalancesOrders, closureDate]);

  // Ventes Boutique Prêt-à-porter
  const dailyBoutiqueSales = useMemo(() => {
    return boutiqueSales.filter(s => {
      if (!s || !s.date) return false;
      return String(s.date).startsWith(closureDate);
    });
  }, [boutiqueSales, closureDate]);

  const dailyBoutiqueRevenueTotal = useMemo(() => {
    return dailyBoutiqueSales.reduce((sum, s) => {
      const tot = Number(s.totalPrice || s.total || 0);
      return sum + (isNaN(tot) ? 0 : tot);
    }, 0);
  }, [dailyBoutiqueSales]);

  // Autres Recettes
  const dailyOtherSales = useMemo(() => {
    return dexieSales.filter(s => {
      if (!s || !s.createdAt) return false;
      try {
        const d = typeof s.createdAt === 'string' ? s.createdAt : new Date(s.createdAt).toISOString();
        return d.startsWith(closureDate);
      } catch {
        return false;
      }
    });
  }, [dexieSales, closureDate]);

  const dailyOtherRevenueTotal = useMemo(() => {
    return dailyOtherSales.reduce((sum, s) => {
      const tot = Number((s as any).totalPrice || s.totalAmount || 0);
      return sum + (isNaN(tot) ? 0 : tot);
    }, 0);
  }, [dailyOtherSales]);

  // Dépenses du Jour
  const dailyExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e) return false;
      if (e.date && String(e.date).startsWith(closureDate)) return true;
      if (e.createdAt) {
        try {
          const d = typeof e.createdAt === 'string' ? e.createdAt : (e.createdAt.seconds ? new Date(e.createdAt.seconds * 1000).toISOString() : new Date(e.createdAt).toISOString());
          return d.startsWith(closureDate);
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [expenses, closureDate]);

  const dailyExpensesTotal = useMemo(() => {
    return dailyExpenses.reduce((sum, e) => {
      const amt = Number(e.amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [dailyExpenses]);

  // Distinction Dépenses Espèces vs Hors Espèces (Banque / Mobile Money / Carte / etc.)
  const dailyCashExpensesTotal = useMemo(() => {
    return dailyExpenses
      .filter(e => {
        const pm = String((e as any).paymentMethod || (e as any).modePaiement || 'espèces').toLowerCase();
        return pm === 'espèces' || pm === 'especes' || pm === 'cash';
      })
      .reduce((sum, e) => {
        const amt = Number(e.amount || 0);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
  }, [dailyExpenses]);

  const dailyNonCashExpensesTotal = useMemo(() => {
    return dailyExpenses
      .filter(e => {
        const pm = String((e as any).paymentMethod || (e as any).modePaiement || 'espèces').toLowerCase();
        return pm !== 'espèces' && pm !== 'especes' && pm !== 'cash';
      })
      .reduce((sum, e) => {
        const amt = Number(e.amount || 0);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
  }, [dailyExpenses]);

  // Breakdown Rémunérations Artisans & Équipe vs Dépenses Générales
  const dailyArtisanExpenses = useMemo(() => {
    return dailyExpenses.filter(e => isArtisanExpense(e));
  }, [dailyExpenses]);

  const dailyArtisanExpensesTotal = useMemo(() => {
    return dailyArtisanExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [dailyArtisanExpenses]);

  const dailyGeneralExpenses = useMemo(() => {
    return dailyExpenses.filter(e => !isArtisanExpense(e));
  }, [dailyExpenses]);

  const dailyGeneralExpensesTotal = useMemo(() => {
    return dailyGeneralExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [dailyGeneralExpenses]);

  // Total Recettes
  const totalRecettes = useMemo(() => {
    return dailyCoutureAdvancesTotal + dailyCoutureBalancesTotal + dailyBoutiqueRevenueTotal + dailyOtherRevenueTotal;
  }, [dailyCoutureAdvancesTotal, dailyCoutureBalancesTotal, dailyBoutiqueRevenueTotal, dailyOtherRevenueTotal]);

  // Total Théorique Attendu en Espèces (Recettes - Dépenses en Espèces uniquement)
  const totalTheoreticalRevenue = useMemo(() => {
    return totalRecettes - dailyCashExpensesTotal;
  }, [totalRecettes, dailyCashExpensesTotal]);

  // Espèces comptées
  const actualCash = useMemo(() => {
    const val = parseFloat(actualCashInput);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [actualCashInput]);

  // Écart de caisse
  const discrepancy = useMemo(() => {
    return actualCash - totalTheoreticalRevenue;
  }, [actualCash, totalTheoreticalRevenue]);

  // Statut
  const closureStatus = useMemo<'EQUILIBRE' | 'EXCEDENT' | 'DEFICIT'>(() => {
    if (discrepancy === 0) return 'EQUILIBRE';
    return discrepancy > 0 ? 'EXCEDENT' : 'DEFICIT';
  }, [discrepancy]);

  // --- 3 STOCKS AUDIT (Boutique, Tissus, Mercerie) ---

  // 1. Stock Prêt-à-porter
  const boutiqueStockAlerts = useMemo(() => {
    return boutiqueArticles.map(art => {
      const qty = Number(art.quantity ?? art.stock ?? 0);
      const min = Number(art.minStock ?? 5);
      const unit = art.unit || 'pièces';
      let level: 'NORMAL' | 'LOW' | 'OUT' = 'NORMAL';
      if (qty <= 0) level = 'OUT';
      else if (qty <= min) level = 'LOW';
      return { id: art.id, name: art.name, qty, min, unit, level, category: art.category || 'Prêt-à-porter' };
    }).filter(item => item.level !== 'NORMAL');
  }, [boutiqueArticles]);

  // 2. Stock Tissus & Wax
  const tissusStockAlerts = useMemo(() => {
    return tissus.map(tis => {
      const qty = Number(tis.quantity ?? 0);
      const min = Number(tis.minStock ?? 5.0);
      const unit = 'mètres';
      let level: 'NORMAL' | 'LOW' | 'OUT' = 'NORMAL';
      if (qty <= 0) level = 'OUT';
      else if (qty <= min) level = 'LOW';
      return { id: tis.id, name: tis.name, qty, min, unit, level, category: tis.category || 'Tissu' };
    }).filter(item => item.level !== 'NORMAL');
  }, [tissus]);

  // 3. Stock Mercerie
  const mercerieStockAlerts = useMemo(() => {
    return mercerie.map(mer => {
      const qty = Number(mer.quantity ?? mer.itemQuantity ?? mer.stock ?? 0);
      const min = Number(mer.minQuantity ?? mer.minStock ?? mer.itemMinQuantity ?? 5);
      const unit = mer.unit || mer.itemUnit || 'unités';
      let level: 'NORMAL' | 'LOW' | 'OUT' = 'NORMAL';
      if (qty <= 0) level = 'OUT';
      else if (qty <= min) level = 'LOW';
      return { id: mer.id, name: mer.name || mer.itemName, qty, min, unit, level, category: mer.category || mer.itemCategory || 'Mercerie' };
    }).filter(item => item.level !== 'NORMAL');
  }, [mercerie]);

  // Total count of stock alerts
  const totalStockAlertsCount = boutiqueStockAlerts.length + tissusStockAlerts.length + mercerieStockAlerts.length;

  // --- MANAGER NOTIFICATION GENERATOR ---

  const generateManagerMessage = useCallback((c: TailleurClosure) => {
    const b = getClosureExpenseBreakdown(c, expenses);
    const diffSign = c.discrepancy >= 0 ? '+' : '';
    const diffText = c.discrepancy === 0 ? 'Parfait (0 ' + currency + ')' : `${diffSign}${c.discrepancy.toLocaleString()} ${currency}`;
    const statusLabel = c.status === 'EQUILIBRE' ? '✅ ÉQUILIBRÉ' : c.status === 'EXCEDENT' ? '🟢 EXCÉDENT SURPLUS' : '⚠️ DÉFICIT MANQUANT';

    let msg = `👑 [CLÔTURE DE CAISSE COUTURE & ATELIER] 📊\n` +
      `--------------------------------\n` +
      `• Établissement : ${merchant.name || 'Atelier de Couture'}\n` +
      `• Date d'Activité : ${c.date}\n` +
      `• Heure de Clôture : ${new Date(c.timestamp).toLocaleString('fr-FR')}\n` +
      `• Caissier / Gestionnaire : ${c.cashierName}\n` +
      `--------------------------------\n` +
      `RÉSUMÉ DÉTAILLÉ DES FLUX ENCAISSÉS :\n` +
      `• Acomptes Commandes Mesures : +${c.totalCoutureAdvances.toLocaleString()} ${currency}\n` +
      `• Règlements & Soldes Commandes : +${c.totalCoutureBalances.toLocaleString()} ${currency}\n` +
      `• Ventes Boutique Prêt-à-porter : +${c.totalBoutiqueRevenue.toLocaleString()} ${currency}\n` +
      `• Autres Recettes d'Atelier : +${c.totalOtherRevenue.toLocaleString()} ${currency}\n` +
      `--------------------------------\n` +
      `VENTILATION DES SORTIES DE CAISSE :\n` +
      `• Dépenses Générales : -${b.general.toLocaleString()} ${currency}\n` +
      `• Rémunérations Artisans & Équipe : -${b.artisan.toLocaleString()} ${currency}\n` +
      `• TOTAL DÉPENSES DU JOUR : -${b.total.toLocaleString()} ${currency}\n` +
      `--------------------------------\n`;

    if (b.details && b.details.length > 0) {
      msg += `DÉTAIL DES SORTIES DE CAISSE (${b.details.length} op) :\n`;
      b.details.slice(0, 10).forEach(d => {
        const catTag = isArtisanExpense(d) ? 'ARTISAN' : 'GÉNÉRAL';
        msg += `• [${catTag}] ${d.title} : -${Number(d.amount).toLocaleString()} ${currency}\n`;
      });
      if (b.details.length > 10) {
        msg += `• ... et ${b.details.length - 10} autre(s) opération(s)\n`;
      }
      msg += `--------------------------------\n`;
    }

    msg += `• TOTAL THÉORIQUE ATTENDU : ${c.totalTheoreticalRevenue.toLocaleString()} ${currency}\n` +
      `• ESPÈCES RÉELLES COMPTÉES : ${c.actualCashCounted.toLocaleString()} ${currency}\n` +
      `• ÉCART DE CAISSE : ${diffText} (${statusLabel})\n` +
      `--------------------------------\n`;

    if (totalStockAlertsCount > 0) {
      msg += `🚨 ALERTES STOCKS D'ATELIER :\n`;
      if (boutiqueStockAlerts.length > 0) {
        msg += `👗 Boutique Prêt-à-porter : ${boutiqueStockAlerts.map(a => `${a.name} (${a.qty} ${a.unit} / seuil ${a.min})`).join(', ')}\n`;
      }
      if (tissusStockAlerts.length > 0) {
        msg += `🧵 Tissus & Wax : ${tissusStockAlerts.map(t => `${t.name} (${t.qty} ${t.unit} / seuil ${t.min})`).join(', ')}\n`;
      }
      if (mercerieStockAlerts.length > 0) {
        msg += `📦 Mercerie & Fournitures : ${mercerieStockAlerts.map(m => `${m.name} (${m.qty} ${m.unit} / seuil ${m.min})`).join(', ')}\n`;
      }
      msg += `--------------------------------\n`;
    } else {
      msg += `✅ STOCKS : Tous les stocks (Prêt-à-porter, Tissus, Mercerie) sont au-dessus des seuils.\n` +
        `--------------------------------\n`;
    }

    if (c.notes) {
      msg += `OBSERVATIONS :\n"${c.notes}"\n--------------------------------\n`;
    }

    msg += `Rapport transmis automatiquement en temps réel via l'application SaaS ${merchant.name || 'ACOM'}.`;
    return msg;
  }, [merchant, currency, totalStockAlertsCount, boutiqueStockAlerts, tissusStockAlerts, mercerieStockAlerts, expenses]);

  // Dispatch Email to Manager
  const dispatchManagerEmail = useCallback(async (c: TailleurClosure) => {
    if (!managerEmail || !managerEmail.trim()) return false;

    const b = getClosureExpenseBreakdown(c, expenses);
    const statusBg = c.status === 'EQUILIBRE' ? '#10b981' : c.status === 'EXCEDENT' ? '#3b82f6' : '#ef4444';
    const statusText = c.status === 'EQUILIBRE' ? '✅ ÉQUILIBRÉ (Conforme)' : c.status === 'EXCEDENT' ? '🟢 EXCÉDENT SURPLUS' : '⚠️ DÉFICIT MANQUANT';

    let detailsTableHtml = '';
    if (b.details && b.details.length > 0) {
      detailsTableHtml = `
        <tr>
          <td colspan="2" style="padding: 16px 0 6px 0; font-weight: bold; color: #4c1d95; font-size: 13px; text-transform: uppercase;">DÉTAIL DE TOUTES LES SORTIES DE CAISSE (${b.details.length} op) :</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; background-color: #f8fafc; border-radius: 8px;">
              <tr style="border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold; text-align: left;">
                <th style="padding: 6px 8px;">Libellé / Bénéficiaire</th>
                <th style="padding: 6px 8px;">Catégorie</th>
                <th style="padding: 6px 8px; text-align: right;">Montant</th>
              </tr>
              ${b.details.map(d => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 6px 8px; font-weight: bold; color: #1e293b;">${d.title}</td>
                  <td style="padding: 6px 8px; color: #64748b;">${isArtisanExpense(d) ? 'Rémunération Artisan' : (d.category || 'Dépenses Générales')}</td>
                  <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #dc2626;">-${Number(d.amount).toLocaleString()} ${currency}</td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b; background-color: #ffffff;">
        <div style="background-color: #4c1d95; color: white; padding: 24px; border-radius: 12px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">🪡 ${merchant.name || 'Atelier de Couture'}</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Rapport Officiel de Clôture de Caisse Journalière</p>
        </div>

        <div style="margin-top: 24px;">
          <h3 style="color: #4c1d95; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px; font-size: 16px;">📊 Bilan Financier & Rapprochement de Caisse</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 220px;"><strong>Date d'Activité :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${c.date}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Heure de Clôture :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${new Date(c.timestamp).toLocaleString('fr-FR')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Caissier / Gestionnaire :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4c1d95;">${c.cashierName}</td>
            </tr>

            <tr>
              <td colspan="2" style="padding: 16px 0 6px 0; font-weight: bold; color: #4c1d95; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">DÉTAIL DES FLUX ENCAISSÉS :</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 12px;">• Acomptes Commandes Mesures :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">+${c.totalCoutureAdvances.toLocaleString()} ${currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 12px;">• Règlements & Soldes Commandes :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">+${c.totalCoutureBalances.toLocaleString()} ${currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 12px;">• Ventes Boutique Prêt-à-porter :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">+${c.totalBoutiqueRevenue.toLocaleString()} ${currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 12px;">• Autres Recettes d'Atelier :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">+${c.totalOtherRevenue.toLocaleString()} ${currency}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 16px 0 6px 0; font-weight: bold; color: #4c1d95; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">VENTILATION DES SORTIES DE CAISSE :</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 12px;">• Dépenses Générales d'Atelier :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #ef4444;">-${b.general.toLocaleString()} ${currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 12px;">• Rémunérations Artisans & Équipe :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #dc2626;">-${b.artisan.toLocaleString()} ${currency}</td>
            </tr>
            <tr style="background-color: #fef2f2;">
              <td style="padding: 8px 10px; font-weight: bold; color: #991b1b;">• TOTAL DÉPENSES DE LA JOURNÉE :</td>
              <td style="padding: 8px 10px; font-weight: bold; color: #991b1b;">-${b.total.toLocaleString()} ${currency}</td>
            </tr>

            ${detailsTableHtml}

            <tr>
              <td colspan="2" style="padding: 16px 0 6px 0; font-weight: bold; color: #4c1d95; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">RAPPROCHEMENT ET ÉCART :</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Total Théorique Attendu :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 14px;">${c.totalTheoreticalRevenue.toLocaleString()} ${currency}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Espèces Réelles Comptées :</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 14px; color: #4c1d95;">${c.actualCashCounted.toLocaleString()} ${currency}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px 10px; color: #0f172a; font-weight: bold;"><strong>ÉCART DE CAISSE :</strong></td>
              <td style="padding: 12px 10px; font-weight: bold; font-size: 15px; color: ${statusBg};">
                ${c.discrepancy >= 0 ? '+' : ''}${c.discrepancy.toLocaleString()} ${currency}
                <div style="font-size: 11px; font-weight: normal; margin-top: 2px;">${statusText}</div>
              </td>
            </tr>
            ${c.notes ? `
            <tr>
              <td style="padding: 12px 0 0 0; color: #64748b;" valign="top"><strong>Observations :</strong></td>
              <td style="padding: 12px 0 0 0; font-style: italic; color: #475569;">"${c.notes}"</td>
            </tr>
            ` : ''}
          </table>

          ${totalStockAlertsCount > 0 ? `
          <div style="margin-top: 24px; padding: 16px; background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px;">
            <h4 style="margin: 0 0 10px 0; color: #c2410c; font-size: 14px; text-transform: uppercase;">🚨 ALERTES STOCKS D'ATELIER</h4>
            ${boutiqueStockAlerts.length > 0 ? `
              <div style="margin-bottom: 8px; font-size: 12px; color: #9a3412;">
                <strong>👗 Boutique Prêt-à-porter :</strong> ${boutiqueStockAlerts.map(a => `${a.name} (${a.qty} ${a.unit} / seuil ${a.min})`).join(', ')}
              </div>
            ` : ''}
            ${tissusStockAlerts.length > 0 ? `
              <div style="margin-bottom: 8px; font-size: 12px; color: #9a3412;">
                <strong>🧵 Tissus & Wax :</strong> ${tissusStockAlerts.map(t => `${t.name} (${t.qty} ${t.unit} / seuil ${t.min})`).join(', ')}
              </div>
            ` : ''}
            ${mercerieStockAlerts.length > 0 ? `
              <div style="font-size: 12px; color: #9a3412;">
                <strong>📦 Mercerie & Fournitures :</strong> ${mercerieStockAlerts.map(m => `${m.name} (${m.qty} ${m.unit} / seuil ${m.min})`).join(', ')}
              </div>
            ` : ''}
          </div>
          ` : `
          <div style="margin-top: 20px; padding: 12px; bg-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 10px; font-size: 12px; color: #166534;">
            ✅ <strong>Alerte Stock :</strong> Tous les stocks d'Atelier (Prêt-à-porter, Tissus, Mercerie) sont au-dessus de leurs seuils de sécurité.
          </div>
          `}
        </div>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
          Ce rapport de clôture a été généré et transmis en temps réel au Gérant.<br/>
          <strong>Système de Suivi SaaS ${merchant.name || 'ACOM'}</strong>.
        </div>
      </div>
    `;

    try {
      const response = await sendEmailDirectlyOrViaBackend({
        to: managerEmail,
        from: merchant.managerNotifications?.emailFrom || undefined,
        subject: `📊 [CLÔTURE CAISSE COUTURE] Rapport du ${c.date} - ${merchant.name || 'Atelier'}`,
        html
      }, {
        resendApiKey: merchant.managerNotifications?.resendApiKey,
        defaultFrom: merchant.managerNotifications?.emailFrom
      });

      const resData = await response.json().catch(() => null);
      return response.ok && resData?.success !== false;
    } catch (e) {
      console.error('Error sending closure email:', e);
      return false;
    }
  }, [managerEmail, merchant, currency, totalStockAlertsCount, boutiqueStockAlerts, tissusStockAlerts, mercerieStockAlerts, expenses]);

  // Dispatch WhatsApp to Manager
  const dispatchManagerWhatsApp = useCallback((c: TailleurClosure) => {
    if (!managerPhone || !managerPhone.trim()) return false;
    const msg = generateManagerMessage(c);
    const cleaned = managerPhone.replace(/\s+/g, '').replace(/^\+/, '');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = `https://${isMobile ? 'api' : 'web'}.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    return true;
  }, [managerPhone, generateManagerMessage]);

  // --- SUBMIT CLOSURE HANDLER ---

  const handleValidateClosure = async () => {
    if (!cashierName.trim()) {
      toast.error('Veuillez renseigner le nom du Caissier / Gestionnaire.');
      return;
    }

    // MANDATORY STRICT ACCOUNTING CONSISTENCY CHECK BEFORE FINALIZING
    const sumVentilated = dailyGeneralExpensesTotal + dailyArtisanExpensesTotal;
    if (Math.abs(sumVentilated - dailyExpensesTotal) > 0.01) {
      triggerAcomAlert(
        'Anomalie de Clôture - Non Conformité Comptable',
        `INCOHÉRENCE DÉTECTÉE : La somme des lignes ventilées (${sumVentilated.toLocaleString()} ${currency}) est différente du total des dépenses du jour (${dailyExpensesTotal.toLocaleString()} ${currency}). La clôture est immédiatement bloquée.`,
        'error',
        'ALERTE'
      );
      toast.error(`Blocage de sécurité : Somme ventilée (${sumVentilated}) ≠ Total (${dailyExpensesTotal})`);
      return;
    }

    setIsSubmitting(true);

    try {
      const expensesDetails: TailleurClosureExpenseItem[] = dailyExpenses.map(e => ({
        id: e.id || `exp_${Math.random()}`,
        title: e.title || e.description || 'Sortie de caisse',
        category: isArtisanExpense(e) ? 'Rémunérations Artisans & Équipe' : (e.category || 'Dépenses Générales'),
        amount: Number(e.amount || 0),
        date: e.date || e.createdAt || new Date().toISOString(),
        description: e.description
      }));

      const newClosure: TailleurClosure = {
        id: `closure_tailleur_${Date.now()}`,
        date: closureDate,
        timestamp: new Date().toISOString(),
        cashierName: cashierName.trim(),
        totalCoutureAdvances: dailyCoutureAdvancesTotal,
        totalCoutureBalances: dailyCoutureBalancesTotal,
        totalBoutiqueRevenue: dailyBoutiqueRevenueTotal,
        totalOtherRevenue: dailyOtherRevenueTotal,
        totalGeneralExpenses: dailyGeneralExpensesTotal,
        totalArtisanExpenses: dailyArtisanExpensesTotal,
        totalExpenses: dailyExpensesTotal,
        totalTheoreticalRevenue,
        actualCashCounted: actualCash,
        discrepancy,
        status: closureStatus,
        notes: closureNotes.trim(),
        expensesDetails,
        sentToManagerEmail: false,
        sentToManagerWA: false,
        stockAlertsSummary: {
          boutiqueCount: boutiqueStockAlerts.length,
          tissusCount: tissusStockAlerts.length,
          mercerieCount: mercerieStockAlerts.length
        }
      };

      let emailSentSuccess = false;
      let emailAttempted = false;
      let whatsappTriggeredSuccess = false;
      let whatsappAttempted = false;

      // Real-Time Manager Notification Dispatch
      if (autoNotifyManager) {
        // 1. Email Channel
        if (managerEmail && managerEmail.trim()) {
          emailAttempted = true;
          try {
            const emailOk = await dispatchManagerEmail(newClosure);
            if (emailOk) {
              emailSentSuccess = true;
              newClosure.sentToManagerEmail = true;
            } else {
              newClosure.sentToManagerEmail = false;
            }
          } catch (err) {
            console.error('Error dispatching manager email:', err);
            emailSentSuccess = false;
            newClosure.sentToManagerEmail = false;
          }
        }

        // 2. WhatsApp Channel
        if (managerPhone && managerPhone.trim()) {
          whatsappAttempted = true;
          try {
            const waOk = dispatchManagerWhatsApp(newClosure);
            if (waOk) {
              whatsappTriggeredSuccess = true;
              newClosure.sentToManagerWA = true;
            } else {
              newClosure.sentToManagerWA = false;
            }
          } catch (err) {
            console.error('Error dispatching manager WhatsApp:', err);
            whatsappTriggeredSuccess = false;
            newClosure.sentToManagerWA = false;
          }
        }
      }

      // Save into State and LocalStorage
      setClosures(prev => {
        const filtered = prev.filter(c => c.date !== closureDate);
        return [newClosure, ...filtered];
      });

      // Reset form
      setActualCashInput('');
      setClosureNotes('');

      // Trigger single unified Visual Confirmation (AcomAlertEventProvider)
      triggerAcomAlert(
        'Clôture Validée — E-mail & WhatsApp',
        'La clôture de caisse a été validée et le rapport transmis par e-mail au Gérant. Une fenêtre WhatsApp est ouverte pour permettre son envoi également via WhatsApp.',
        'success',
        'RÈGLEMENT'
      );

      toast.success('Clôture enregistrée et historisée avec succès ! 🔒');
    } catch (e) {
      console.error('Error during closure creation:', e);
      toast.error('Erreur lors de la clôture de caisse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PRINT / DOWNLOAD PDF REPORT ---

  const generatePDFReport = (c: TailleurClosure) => {
    const doc = new jsPDF();
    const b = getClosureExpenseBreakdown(c, expenses);

    // Header Banner
    doc.setFillColor(76, 29, 149);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(merchant.name || 'ATELIER DE COUTURE', 105, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RAPPORT OFFICIEL DE CLÔTURE DE CAISSE — ${c.date}`, 105, 22, { align: 'center' });

    // Metadata
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS GÉNÉRALES', 14, 40);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 196, 42);

    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'Activité : ${c.date}`, 14, 50);
    doc.text(`Heure de Clôture : ${new Date(c.timestamp).toLocaleString('fr-FR')}`, 14, 56);
    doc.text(`Caissier / Gestionnaire : ${c.cashierName}`, 14, 62);

    // Financial Breakdown
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAIL DES FLUX FINANCIERS ET SORTIES DE CAISSE', 14, 74);
    doc.line(14, 76, 196, 76);

    doc.setFont('helvetica', 'normal');
    let y = 84;
    doc.text(`• Acomptes Commandes Mesures :`, 14, y);
    doc.text(`+${c.totalCoutureAdvances.toLocaleString()} ${currency}`, 170, y, { align: 'right' });
    y += 7;
    doc.text(`• Règlements & Soldes Commandes :`, 14, y);
    doc.text(`+${c.totalCoutureBalances.toLocaleString()} ${currency}`, 170, y, { align: 'right' });
    y += 7;
    doc.text(`• Ventes Boutique Prêt-à-porter :`, 14, y);
    doc.text(`+${c.totalBoutiqueRevenue.toLocaleString()} ${currency}`, 170, y, { align: 'right' });
    y += 7;
    doc.text(`• Autres Recettes d'Atelier :`, 14, y);
    doc.text(`+${c.totalOtherRevenue.toLocaleString()} ${currency}`, 170, y, { align: 'right' });
    y += 7;
    doc.text(`• Dépenses Générales :`, 14, y);
    doc.text(`-${b.general.toLocaleString()} ${currency}`, 170, y, { align: 'right' });
    y += 7;
    doc.text(`• Rémunérations Artisans & Équipe :`, 14, y);
    doc.text(`-${b.artisan.toLocaleString()} ${currency}`, 170, y, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`• TOTAL DÉPENSES DU JOUR :`, 14, y);
    doc.text(`-${b.total.toLocaleString()} ${currency}`, 170, y, { align: 'right' });
    y += 10;

    // Reconciliation Block
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 32, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 32, 'S');

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL THÉORIQUE ATTENDU : ${c.totalTheoreticalRevenue.toLocaleString()} ${currency}`, 20, y + 8);
    doc.text(`ESPÈCES RÉELLES COMPTÉES : ${c.actualCashCounted.toLocaleString()} ${currency}`, 20, y + 16);
    const diffText = `${c.discrepancy >= 0 ? '+' : ''}${c.discrepancy.toLocaleString()} ${currency} (${c.status})`;
    doc.text(`ÉCART DE CAISSE : ${diffText}`, 20, y + 24);

    y += 42;

    // Expense Detail List (if any)
    if (b.details && b.details.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`DÉTAIL DES SORTIES DE CAISSE (${b.details.length} OPÉRATIONS)`, 14, y);
      doc.line(14, y + 2, 196, y + 2);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      b.details.slice(0, 15).forEach((d) => {
        if (y > 270) return; // Prevent page overflow
        const cat = isArtisanExpense(d) ? '[ARTISAN]' : '[GÉNÉRAL]';
        const titleStr = `${cat} ${d.title}`;
        doc.text(titleStr.substring(0, 55), 14, y);
        doc.text(`-${Number(d.amount).toLocaleString()} ${currency}`, 170, y, { align: 'right' });
        y += 5;
      });
      if (b.details.length > 15) {
        doc.text(`... et ${b.details.length - 15} autre(s) dépense(s).`, 14, y);
        y += 6;
      }
      y += 4;
    }

    // Stock Alerts
    if (y < 260) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ALERTES DE STOCKS (PRÊT-À-PORTER, TISSUS, MERCERIE)', 14, y);
      doc.line(14, y + 2, 196, y + 2);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (boutiqueStockAlerts.length > 0) {
        doc.text(`• Boutique Prêt-à-porter : ${boutiqueStockAlerts.map(a => `${a.name} (${a.qty} ${a.unit})`).join(', ')}`, 14, y);
        y += 6;
      }
      if (tissusStockAlerts.length > 0) {
        doc.text(`• Tissus & Wax : ${tissusStockAlerts.map(t => `${t.name} (${t.qty} ${t.unit})`).join(', ')}`, 14, y);
        y += 6;
      }
      if (mercerieStockAlerts.length > 0) {
        doc.text(`• Mercerie & Fournitures : ${mercerieStockAlerts.map(m => `${m.name} (${m.qty} ${m.unit})`).join(', ')}`, 14, y);
        y += 6;
      }
      if (totalStockAlertsCount === 0) {
        doc.text('• Tous les stocks sont au-dessus des seuils d\'alerte.', 14, y);
        y += 6;
      }
    }

    if (c.notes && y < 270) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVATIONS :', 14, y);
      y += 6;
      doc.setFont('helvetica', 'italic');
      doc.text(`"${c.notes}"`, 14, y);
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Document certifié généré par ACOM Technologie — ${new Date().toLocaleString('fr-FR')}`, 105, 285, { align: 'center' });

    doc.save(`Cloture_Caisse_Couture_${c.date}.pdf`);
  };

  // Filtered History Closures
  const filteredClosures = useMemo(() => {
    return closures.filter(c => {
      const matchSearch = c.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) || c.date.includes(searchTerm);
      return matchSearch;
    });
  }, [closures, searchTerm]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-violet-100 text-violet-800 rounded-2xl shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">
              Clôture de Caisse Journalière Couture
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Consolidation financière, rapprochement d'espèces, audit des stocks & suivi gérant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={closureDate}
            onChange={e => setClosureDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: CLOSURE FORM & FINANCIAL SUMMARY (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-violet-600" />
                <h2 className="text-base font-black text-slate-900">
                  Rapprochement de Caisse du {closureDate}
                </h2>
              </div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-100">
                ACOM AUTOMATIC ENGINE
              </span>
            </div>

            {/* FINANCIAL SUMMARY CARDS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-violet-50/60 rounded-2xl border border-violet-100/60 text-center">
                <span className="block text-[9px] font-mono font-bold text-violet-600 uppercase tracking-wider">Acomptes Mesures</span>
                <strong className="block text-xs sm:text-sm font-black text-violet-900 mt-1">{dailyCoutureAdvancesTotal.toLocaleString()} {currency}</strong>
                <span className="text-[8px] text-violet-500 font-mono block mt-0.5">{dailyCoutureOrders.length} cmd</span>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/60 text-center">
                <span className="block text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider">Soldes Mesures</span>
                <strong className="block text-xs sm:text-sm font-black text-indigo-900 mt-1">{dailyCoutureBalancesTotal.toLocaleString()} {currency}</strong>
                <span className="text-[8px] text-indigo-500 font-mono block mt-0.5">{dailyCoutureBalancesOrders.length} solde(s)</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/60 text-center">
                <span className="block text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-wider">Prêt-à-porter</span>
                <strong className="block text-xs sm:text-sm font-black text-emerald-900 mt-1">{dailyBoutiqueRevenueTotal.toLocaleString()} {currency}</strong>
                <span className="text-[8px] text-emerald-500 font-mono block mt-0.5">{dailyBoutiqueSales.length} vente(s)</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100/60 text-center">
                <span className="block text-[9px] font-mono font-bold text-amber-600 uppercase tracking-wider">Dépenses Générales</span>
                <strong className="block text-xs sm:text-sm font-black text-amber-900 mt-1">-{dailyGeneralExpensesTotal.toLocaleString()} {currency}</strong>
                <span className="text-[8px] text-amber-500 font-mono block mt-0.5">{dailyGeneralExpenses.length} op</span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100/60 text-center">
                <span className="block text-[9px] font-mono font-bold text-rose-600 uppercase tracking-wider">Paye Artisans</span>
                <strong className="block text-xs sm:text-sm font-black text-rose-900 mt-1">-{dailyArtisanExpensesTotal.toLocaleString()} {currency}</strong>
                <span className="text-[8px] text-rose-500 font-mono block mt-0.5">{dailyArtisanExpenses.length} versement(s)</span>
              </div>
            </div>

            {/* THEORETICAL TOTAL BOX */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                💰 TOTAL THÉORIQUE ATTENDU EN CAISSE
              </span>
              <strong className="text-3xl font-black block text-amber-400 font-mono tracking-tight">
                {totalTheoreticalRevenue.toLocaleString()} <span className="text-base font-sans text-slate-300">{currency}</span>
              </strong>
              <p className="text-[10px] text-slate-400 font-medium">
                Calculé à partir des espèces en caisse : Recettes ({totalRecettes.toLocaleString()}) - Dépenses Espèces ({dailyCashExpensesTotal.toLocaleString()}) {dailyNonCashExpensesTotal > 0 ? `| Dépenses Hors Caisse Physique (Banque/Mobile) : ${dailyNonCashExpensesTotal.toLocaleString()} ${currency}` : ''}
              </p>
            </div>

            {/* CASHIER INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom du Caissier / Gestionnaire *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fatou Ndiaye"
                    value={cashierName}
                    onChange={e => setCashierName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Espèces Réelles Comptées ({currency}) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Saisissez le montant en caisse..."
                    value={actualCashInput}
                    onChange={e => setActualCashInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black font-mono text-violet-900 outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
            </div>

            {/* RECONCILIATION RESULT BADGE */}
            {actualCashInput !== '' && (
              <div className={`p-4 rounded-2xl border transition-all ${
                closureStatus === 'EQUILIBRE' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : closureStatus === 'EXCEDENT' 
                    ? 'bg-blue-50 border-blue-200 text-blue-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-500">
                      Résultat de Rapprochement
                    </span>
                    <strong className={`text-sm font-black block mt-0.5 ${
                      closureStatus === 'EQUILIBRE' ? 'text-emerald-700' : closureStatus === 'EXCEDENT' ? 'text-blue-700' : 'text-rose-700'
                    }`}>
                      {closureStatus === 'EQUILIBRE' && '✅ Caisse parfaitement ÉQUILIBRÉE'}
                      {closureStatus === 'EXCEDENT' && `🟢 SURPLUS DE CAISSE (+${discrepancy.toLocaleString()} ${currency})`}
                      {closureStatus === 'DEFICIT' && `⚠️ DÉFICIT DE CAISSE (${discrepancy.toLocaleString()} ${currency})`}
                    </strong>
                  </div>
                  <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-white shadow-xs">
                    Écart : {discrepancy >= 0 ? '+' : ''}{discrepancy.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            )}

            {/* OBSERVATIONS NOTES */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Observations & Justifications (Optionnel)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Écart de caisse expliqué par l'achat de mercerie en urgence..."
                value={closureNotes}
                onChange={e => setClosureNotes(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* VALIDATION BUTTON */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleValidateClosure}
              className="w-full py-4 bg-violet-800 hover:bg-violet-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-800/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Valider & Clôturer la Caisse Journalière 🔒
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STOCKS CONTROL AUDIT (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">
                  Control & Alertes Stocks
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                {totalStockAlertsCount} Alerte(s)
              </span>
            </div>

            {/* 1. STOCK PRÊT-À-PORTER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  Stock Prêt-à-porter (Boutique)
                </span>
                <span className="text-[10px] font-mono text-slate-400">{boutiqueArticles.length} ref</span>
              </div>
              {boutiqueStockAlerts.length === 0 ? (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/60 text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tous les articles boutique sont au-dessus des seuils.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {boutiqueStockAlerts.map(item => (
                    <div key={item.id} className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-100 flex justify-between items-center text-xs">
                      <div>
                        <strong className="block font-bold text-amber-900">{item.name}</strong>
                        <span className="text-[10px] text-amber-700 font-mono">Seuil configuré : {item.min} {item.unit}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${item.level === 'OUT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {item.level === 'OUT' ? 'ÉPUISÉ (0)' : `${item.qty} ${item.unit}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. STOCK TISSUS & WAX */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-violet-600" />
                  Stock Tissus & Wax
                </span>
                <span className="text-[10px] font-mono text-slate-400">{tissus.length} ref</span>
              </div>
              {tissusStockAlerts.length === 0 ? (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/60 text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tous les coupons/rouleaux de tissu sont au-dessus des seuils.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {tissusStockAlerts.map(item => (
                    <div key={item.id} className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-100 flex justify-between items-center text-xs">
                      <div>
                        <strong className="block font-bold text-amber-900">{item.name}</strong>
                        <span className="text-[10px] text-amber-700 font-mono">Seuil configuré : {item.min} {item.unit}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${item.level === 'OUT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {item.level === 'OUT' ? 'ÉPUISÉ (0 m)' : `${item.qty} ${item.unit}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. STOCK MERCERIE */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  Stock Mercerie & Fournitures
                </span>
                <span className="text-[10px] font-mono text-slate-400">{mercerie.length} ref</span>
              </div>
              {mercerieStockAlerts.length === 0 ? (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/60 text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tous les articles de mercerie sont au-dessus des seuils.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {mercerieStockAlerts.map(item => (
                    <div key={item.id} className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-100 flex justify-between items-center text-xs">
                      <div>
                        <strong className="block font-bold text-amber-900">{item.name}</strong>
                        <span className="text-[10px] text-amber-700 font-mono">Seuil configuré : {item.min} {item.unit}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${item.level === 'OUT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                        {item.level === 'OUT' ? 'ÉPUISÉ (0)' : `${item.qty} ${item.unit}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIQUE DES CLÔTURES VALIDÉES */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Historique des Clôtures de Caisse
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Consultation des clôtures archivées, téléchargement de rapports & re-notifications
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher caissier, date..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {filteredClosures.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-100 text-slate-500 text-xs font-medium">
            Aucune clôture de caisse enregistrée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="p-3 rounded-l-xl">Date / Heure</th>
                  <th className="p-3">Caissier</th>
                  <th className="p-3 text-right">Recettes Net</th>
                  <th className="p-3 text-right">Espèces Comptées</th>
                  <th className="p-3 text-right">Écart</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-center rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredClosures.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono">
                      <span className="font-bold block text-slate-900">{c.date}</span>
                      <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString('fr-FR')}</span>
                    </td>
                    <td className="p-3 font-bold text-violet-900">{c.cashierName}</td>
                    <td className="p-3 text-right font-mono font-black">{c.totalTheoreticalRevenue.toLocaleString()} {currency}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700">{c.actualCashCounted.toLocaleString()} {currency}</td>
                    <td className={`p-3 text-right font-mono font-black ${c.discrepancy < 0 ? 'text-rose-600' : c.discrepancy > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {c.discrepancy >= 0 ? '+' : ''}{c.discrepancy.toLocaleString()} {currency}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono uppercase ${
                        c.status === 'EQUILIBRE' ? 'bg-emerald-100 text-emerald-800' : c.status === 'EXCEDENT' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedClosure(c)}
                          title="Voir Détails"
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDFReport(c)}
                          title="Télécharger PDF"
                          className="p-1.5 hover:bg-violet-100 text-violet-700 rounded-lg transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
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

      {/* MODAL DETAILED VIEW FOR SELECTED HISTORICAL CLOSURE */}
      {selectedClosure && (() => {
        const b = getClosureExpenseBreakdown(selectedClosure, expenses);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-5 bg-violet-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black">Rapport de Clôture du {selectedClosure.date}</h3>
                  <p className="text-xs text-violet-200">Enregistré à {new Date(selectedClosure.timestamp).toLocaleTimeString('fr-FR')} par {selectedClosure.cashierName}</p>
                </div>
                <button
                  onClick={() => setSelectedClosure(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
                <div className="p-4 bg-slate-50 rounded-xl space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span>Acomptes Mesures :</span>
                    <span className="font-bold text-violet-700">+{selectedClosure.totalCoutureAdvances.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Soldes & Règlements :</span>
                    <span className="font-bold text-indigo-700">+{selectedClosure.totalCoutureBalances.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Boutique Prêt-à-porter :</span>
                    <span className="font-bold text-emerald-700">+{selectedClosure.totalBoutiqueRevenue.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Autres Recettes :</span>
                    <span className="font-bold text-slate-700">+{selectedClosure.totalOtherRevenue.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 text-amber-800 font-bold">
                    <span>Dépenses Générales :</span>
                    <span>-{b.general.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Paye Artisans & Équipe :</span>
                    <span>-{b.artisan.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-black border-t pt-1">
                    <span>TOTAL DÉPENSES :</span>
                    <span>-{b.total.toLocaleString()} {currency}</span>
                  </div>
                </div>

                {b.details && b.details.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
                      Détail des {b.details.length} Sorties de Caisse :
                    </h4>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 space-y-1">
                      {b.details.map(d => (
                        <div key={d.id} className="flex justify-between items-center text-[11px] p-1.5 bg-white rounded-lg border border-slate-100">
                          <div className="truncate max-w-[280px]">
                            <span className="font-bold text-slate-900 block truncate">{d.title}</span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {isArtisanExpense(d) ? 'Rémunération Artisan' : (d.category || 'Dépenses Générales')}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-rose-600 shrink-0">
                            -{Number(d.amount).toLocaleString()} {currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-violet-50 rounded-xl space-y-2 border border-violet-100 font-mono">
                  <div className="flex justify-between">
                    <span>Solde Théorique Attendu :</span>
                    <span className="font-bold">{selectedClosure.totalTheoreticalRevenue.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Espèces Comptées :</span>
                    <span className="font-bold text-violet-900">{selectedClosure.actualCashCounted.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t pt-1">
                    <span>Écart de Caisse :</span>
                    <span className={selectedClosure.discrepancy < 0 ? 'text-rose-600' : selectedClosure.discrepancy > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                      {selectedClosure.discrepancy >= 0 ? '+' : ''}{selectedClosure.discrepancy.toLocaleString()} {currency} ({selectedClosure.status})
                    </span>
                  </div>
                </div>

                {selectedClosure.notes && (
                  <div className="p-3 bg-slate-50 rounded-xl italic text-slate-600">
                    &ldquo;{selectedClosure.notes}&rdquo;
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => generatePDFReport(selectedClosure)}
                    className="flex-1 py-3 bg-violet-800 text-white font-black rounded-xl text-xs uppercase tracking-wider hover:bg-violet-900 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Imprimer / Télécharger PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </motion.div>
  );
};
