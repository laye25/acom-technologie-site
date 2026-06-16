import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Settings, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { showMailSuccessToast } from '../MailSuccessToast';
import { AcomAlertPopup } from '../AcomAlertPopup';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Merchant } from '../../types';

export interface CashClosure {
  id: string;
  date: string;
  timestamp: number;
  cashierName: string;
  totalSalesRevenue: number;
  totalExpenses: number;
  totalTheoreticalRevenue: number;
  actualCashCounted: number;
  discrepancy: number;
  notes: string;
}

export const CashClosureManager: React.FC<{ merchant: Merchant }> = ({ merchant }) => {
  const [closures, setClosures] = useState<CashClosure[]>(() => {
    const saved = localStorage.getItem(`cash_closures_${merchant.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`cash_closures_${merchant.id}`, JSON.stringify(closures));
  }, [closures, merchant.id]);

  const [closureDate, setClosureDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [cashierName, setCashierName] = useState('');
  const [actualCash, setActualCash] = useState<string>('');
  const [closureNotes, setClosureNotes] = useState('');

  const [popup, setPopup] = useState<any>({
    isOpen: false,
    onClose: () => setPopup(prev => ({ ...prev, isOpen: false })),
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    subtitle?: string,
    showCancel = false,
    confirmText = "D'ACCORD",
    onConfirm?: () => void
  ) => {
    setPopup({
      isOpen: true,
      onClose: () => setPopup(prev => ({ ...prev, isOpen: false })),
      title,
      message,
      type,
      subtitle,
      showCancel,
      confirmText,
      onConfirm
    });
  };


  const managerPhone = merchant.managerNotifications?.whatsappPhone || '';
  const managerEmail = merchant.managerNotifications?.email || '';
  const autoEmailManager = merchant.managerNotifications?.notifyOnCashClosure !== false;

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const dailySales = useMemo(() => sales.filter(s => {
      if (s.createdAt) {
          try {
              const d = typeof s.createdAt === 'string' ? new Date(s.createdAt) : new Date(s.createdAt);
              return d.toISOString().startsWith(closureDate);
          } catch {
              return false;
          }
      }
      return false;
  }), [sales, closureDate]);

  const dailyExpenses = useMemo(() => expenses.filter(e => {
      if (e.date && e.date.startsWith(closureDate)) return true;
      if (e.createdAt) {
          try {
             // @ts-ignore
              const d = e.createdAt.seconds ? new Date(e.createdAt.seconds * 1000) : new Date(e.createdAt);
              return d.toISOString().startsWith(closureDate);
          } catch {
              return false;
          }
      }
      return false;
  }), [expenses, closureDate]);

  const dailySalesRevenue = useMemo(() => {
    return dailySales.reduce((sum, s) => sum + Number((s as any).totalAmount || (s as any).total || 0), 0);
  }, [dailySales]);

  const dailyExpensesTotal = useMemo(() => {
    return dailyExpenses.reduce((sum, e) => sum + Number((e as any).amount || 0), 0);
  }, [dailyExpenses]);

  const totalTheoreticalRevenue = useMemo(() => {
    return Math.max(0, dailySalesRevenue - dailyExpensesTotal);
  }, [dailySalesRevenue, dailyExpensesTotal]);

  const actualCashNum = useMemo(() => {
    return parseFloat(actualCash.toString().replace(/\s/g, '').replace(',', '.')) || 0;
  }, [actualCash]);

  const lowStockItems = useMemo(() => products.filter(p => Number(p.stockQuantity || 0) > 0 && Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)), [products]);
  const outOfStockItems = useMemo(() => products.filter(p => Number(p.stockQuantity || 0) <= 0), [products]);

  const [closureMailFeedback, setClosureMailFeedback] = useState<Record<string, boolean>>({});

  const getManagerClosureNotificationMessage = useCallback((c: CashClosure) => {
    const diffSign = c.discrepancy >= 0 ? '+' : '';
    const diffText = c.discrepancy === 0 ? 'Parfait (0 FCFA)' : `${diffSign}${c.discrepancy} FCFA`;
    
    let message = `👑 [CLÔTURE DE CAISSE JOURNALIÈRE] 📊\n` +
           `--------------------------------\n` +
           `• Date d'Activité : ${c.date}\n` +
           `• Date Clôture : ${new Date(c.timestamp).toLocaleString('fr-FR')}\n` +
           `• Caissier / Opérateur : ${c.cashierName || 'Non renseigné'}\n` +
           `--------------------------------\n` +
           `RÉSUMÉ DES FLUX :\n` +
           `• Recettes Ventes : +${c.totalSalesRevenue.toLocaleString()} FCFA\n` +
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
        message += `⚠️ Point de rupture : ${lowStockItems.map(p => `${p.name} (${p.stockQuantity || 0})`).join(', ')}\n`;
      }
      message += `--------------------------------\n`;
    }

    message += `OBSERVATIONS :\n` +
           `"${c.notes || 'Aucun commentaire.'}"\n` +
           `--------------------------------\n` +
           `Rapport de clôture journalier transmis en Temps Réel via l'application SaaS ${merchant.name || 'ACOM'}.`;
           
    return message;
  }, [merchant, lowStockItems, outOfStockItems]);

  const sendSilentBackgroundClosureEmailToManager = useCallback(async (c: CashClosure) => {
    if (!managerEmail || !managerEmail.trim()) return false;

    const themeColor = '#1e1b4b'; // Deep Navy indigo
    const diffColor = c.discrepancy < 0 ? '#ef4444' : c.discrepancy > 0 ? '#10b981' : '#64748b';
    const diffLabel = c.discrepancy < 0 ? 'MANQUANT (Perte) ⚠️' : c.discrepancy > 0 ? 'SURPLUS (Excédent) 🟢' : 'ÉQUILIBRÉ 👍';

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
        <div style="background-color: ${themeColor}; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">${merchant.name || 'Boutique'}</h2>
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
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; padding-left: 10px;">• Recettes Ventes :</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">+${c.totalSalesRevenue.toLocaleString()} FCFA</td>
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
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #f59e0b;">${lowStockItems.map(p => `${p.name} (${p.stockQuantity || 0})`).join(', ')}</td>
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
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: managerEmail,
          subject: `📊 [CLÔTURE CAISSE] Rapport du ${c.date} - ${merchant.name || 'Boutique'}`,
          html: mailHtml
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error dispatching silent manager background mail:', error);
      return false;
    }
  }, [managerEmail, merchant, lowStockItems, outOfStockItems]);

  const dispatchManagerClosureNotif = async (c: CashClosure, method: 'whatsapp' | 'email') => {
    const textNotif = getManagerClosureNotificationMessage(c);
    
    if (method === 'whatsapp') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const url = `https://${isMobile ? 'api' : 'web'}.whatsapp.com/send?phone=${managerPhone.replace(/\s+/g, '')}&text=${encodeURIComponent(textNotif)}`;
      window.open(url, '_blank');
      showAlert('Notification Gérant', 'Rapport prêt pour envoi via WhatsApp !', 'success', "WHATSAPP");
    } else {
      const toastId = toast.loading('Envoi du rapport par mail...');
      const ok = await sendSilentBackgroundClosureEmailToManager(c);
      toast.dismiss(toastId);
      if (ok) {
        showAlert('Notification Gérant', 'Ce mail envoyé en arrière-plan avec succès !', 'success', "ENVOI D'E-MAIL");
        setClosureMailFeedback(prev => ({ ...prev, [c.id]: true }));
      } else {
        const url = `mailto:${managerEmail}?subject=${encodeURIComponent(`📊 CLÔTURE DE CAISSE JOURNALIÈRE — ${c.date}`)}&body=${encodeURIComponent(textNotif)}`;
        window.open(url, '_blank');
        showAlert('Notification Gérant', "Rapport prêt dans votre logiciel d'e-mail !", 'success', "EMAIL");
      }
    }
  };

  const handleCreateClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cashierName.trim()) {
      showAlert('Alerte', 'Veuillez indiquer le nom du caissier', 'error', 'Saisie Incomplète');
      return;
    }

    const actualCashNum = parseFloat(actualCash.replace(/\s/g, '').replace(',', '.')) || 0;
    const discrepancy = actualCashNum - totalTheoreticalRevenue;

    const newClosure: CashClosure = {
      id: crypto.randomUUID(),
      date: closureDate,
      timestamp: Date.now(),
      cashierName,
      totalSalesRevenue: dailySalesRevenue,
      totalExpenses: dailyExpensesTotal,
      totalTheoreticalRevenue,
      actualCashCounted: actualCashNum,
      discrepancy,
      notes: closureNotes
    };

    setClosures(prev => {
      const filtered = prev.filter(c => c.date !== closureDate);
      return [newClosure, ...filtered];
    });
    
    showAlert('Transaction Réussie', 'Clôture de caisse enregistrée avec succès !', 'success', 'Système');

    if (autoEmailManager && managerEmail) {
      const toastId = toast.loading('Envoi du rapport au gérant...');
      sendSilentBackgroundClosureEmailToManager(newClosure).then(ok => {
        toast.dismiss(toastId);
        if (ok) {
          showAlert('Notification Gérant', 'Ce mail envoyé en arrière-plan avec succès !', 'success', "ENVOI D'E-MAIL");
        }
      });
    }
    
    setCashierName('');
    setActualCash('');
    setClosureNotes('');
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
          <h2 className="text-2xl font-black text-slate-900">🔒 Clôture de Caisse & Rapport Journalier</h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Supervision journalière & rapprochement financier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleCreateClosure} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">🔑 Clôturer la caisse d'aujourd'hui</h3>
                <p className="text-gray-400 text-xs mt-0.5">Vérifiez les calculs puis saisissez l'encours en espèces.</p>
              </div>
              <input
                type="date"
                value={closureDate}
                onChange={e => setClosureDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
                  <span className="block text-[8px] font-mono text-emerald-500 uppercase tracking-wider">Recettes Ventes (+)</span>
                  <strong className="block text-base font-black text-emerald-900 mt-1">{dailySalesRevenue.toLocaleString()} F</strong>
                  <span className="text-[8px] text-emerald-600 font-mono mt-0.5 block">{dailySales.length} ventes du jour</span>
                </div>
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 text-center">
                  <span className="block text-[8px] font-mono text-rose-500 uppercase tracking-wider">Dépenses du Jour (-)</span>
                  <strong className="block text-base font-black text-rose-900 mt-1">{dailyExpensesTotal.toLocaleString()} F</strong>
                  <span className="text-[8px] text-rose-600 font-mono mt-0.5 block">{dailyExpenses.length} justificatifs saisis</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">📊 Chiffre d'Affaires Théorique Attendu</span>
                <strong className="text-2xl font-black text-slate-900 mt-1 block">
                  {totalTheoreticalRevenue.toLocaleString()} <span className="text-sm font-medium">{merchant.currency || 'FCFA'}</span>
                </strong>
                <p className="text-[9px] text-slate-400 mt-1">Calcul : Recettes Ventes - Dépenses du jour</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nom du Caissier / Opérateur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kouamé Marc"
                    value={cashierName}
                    onChange={e => setCashierName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold bg-gray-50 filter"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Espèces Comptées ({merchant.currency || 'F'})</label>
                  <input
                    type="text"
                    required
                    value={actualCash}
                    onChange={e => setActualCash(e.target.value.replace(/[^0-9\s.,]/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-black bg-gray-50"
                  />
                </div>
              </div>

              {actualCashNum > 0 && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  actualCashNum === totalTheoreticalRevenue 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : actualCashNum > totalTheoreticalRevenue 
                      ? 'bg-blue-50 border-blue-200 text-blue-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Rapprochement de caisse ({closureDate})</span>
                      <strong className={`text-sm font-black ${
                        actualCashNum === totalTheoreticalRevenue 
                          ? 'text-emerald-700' 
                          : actualCashNum > totalTheoreticalRevenue 
                            ? 'text-blue-700' 
                            : 'text-rose-700'
                      }`}>
                        {actualCashNum === totalTheoreticalRevenue 
                          ? '✅ Caisse parfaitement équilibrée' 
                          : actualCashNum > totalTheoreticalRevenue 
                            ? `🟢 Surplus de caisse (+${(actualCashNum - totalTheoreticalRevenue).toLocaleString()} FCFA)` 
                            : `⚠️ Manquant détecté (${(actualCashNum - totalTheoreticalRevenue).toLocaleString()} FCFA)`}
                      </strong>
                    </div>
                    <span className="font-mono font-bold text-xs">
                      {actualCashNum === totalTheoreticalRevenue ? 'OK' : `${actualCashNum - totalTheoreticalRevenue > 0 ? '+' : ''}${(actualCashNum - totalTheoreticalRevenue).toLocaleString()} F`}
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
                      <span className="font-bold text-orange-600">⚠️ Point de rupture :</span> {lowStockItems.map(p => `${p.name} (${p.stockQuantity || 0})`).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Observations / Justifications</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Écart de caisse justifié par la monnaie..."
                  value={closureNotes}
                  onChange={e => setClosureNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50 text-xs text-slate-900 font-sans"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                >
                  <Lock className="w-5 h-5" />
                  Valider la clôture du jour
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 block border-b border-gray-100 pb-2">Historique des Clôtures</h3>
          
          <div className="space-y-3">
            {closures.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Aucune clôture enregistrée pour cette caisse.</p>
              </div>
            ) : (
              closures.slice(0, 15).map((c) => (
                <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-100 transition">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-slate-900 border-r border-gray-200 pr-2">{c.date}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.cashierName || 'Inconnu'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono mt-2">
                      <span className="text-slate-500">Recettes: <strong className="text-emerald-600">{c.totalSalesRevenue.toLocaleString()} F</strong></span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">Dépenses: <strong className="text-rose-600">{c.totalExpenses.toLocaleString()} F</strong></span>
                    </div>
                    <div className="mt-2 text-xs font-bold">
                      <span className="text-slate-500 mr-2">Théorique: {c.totalTheoreticalRevenue.toLocaleString()} F</span>
                      <span className={c.discrepancy < 0 ? 'text-rose-600' : c.discrepancy > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                        Réel: {c.actualCashCounted.toLocaleString()} F
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                    <div className="flex flex-row sm:flex-col gap-2">
                      <button
                        onClick={() => dispatchManagerClosureNotif(c, 'whatsapp')}
                        disabled={!managerPhone}
                        className="text-[10px] font-bold px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366]/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => dispatchManagerClosureNotif(c, 'email')}
                        disabled={!managerEmail}
                        className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Renvoyer Mail
                      </button>
                    </div>
                    {closureMailFeedback[c.id] && (
                      <div className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 max-w-[120px] text-center leading-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        Ce mail envoyé en arrière-plan avec succès !
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    
      <AcomAlertPopup {...popup} />
    </motion.div>
  );
};
