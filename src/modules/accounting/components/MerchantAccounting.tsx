import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2, X, Receipt, Check, RefreshCw, Wrench, Truck, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { syncService } from '../../../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant } from '../../../types';
import { SchoolAccountingSaaS } from '../../../components/admin/SchoolAccountingSaaS';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';
import { EventBus } from '../../../ai-demo/BusinessEvents/EventBus';
import { TutorialEngine } from '../../../ai-demo/Tutorial/TutorialEngine';

interface AccountingOutflow {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  description?: string;
  source: 'general' | 'delivery' | 'maintenance';
  syncStatus?: string;
  sortKey: number;
}

const EXPENSE_CATEGORIES = [
  'Loyer',
  'Électricité',
  'Eau',
  'Internet & Télécommunications',
  'Transport & Livraison',
  'Entretien & Réparations',
  'Machines & Équipements',
  'Fournitures administratives',
  'Marketing & Communication',
  'Taxes & Frais administratifs',
  'Prestations externes',
  'Autres dépenses'
];

const PAYMENT_METHODS = [
  { id: 'espèces', label: '💵 Espèces (Caisse physique)', shortLabel: 'Espèces' },
  { id: 'mobile_money', label: '📱 Mobile Money (Wave / Orange Money / Free)', shortLabel: 'Mobile Money' },
  { id: 'carte', label: '💳 Carte bancaire', shortLabel: 'Carte bancaire' },
  { id: 'virement', label: '🏦 Virement bancaire', shortLabel: 'Virement' },
  { id: 'cheque', label: '📄 Chèque bancaire', shortLabel: 'Chèque' }
];

const MerchantAccounting = ({ merchant, subTab }: { merchant: Merchant, subTab?: string }) => {
  if (merchant.type === 'scolaire') {
    return <SchoolAccountingSaaS merchant={merchant as any} subTab={subTab} />;
  }

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseDate, setExpenseDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: 0,
    category: 'Loyer',
    paymentMethod: 'espèces',
    reference: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [expenseLimit, setExpenseLimit] = useState(10);
  const [filterSource, setFilterSource] = useState('all');

  useEffect(() => {
    syncService.syncExpenses(merchant.id);
  }, [merchant.id]);

  useEffect(() => {
    if (isAddingExpense) {
      TutorialEngine.onModalOpened('accounting.expense_modal');
    } else {
      TutorialEngine.onModalClosed('accounting.expense_modal');
    }
  }, [isAddingExpense]);

  // Live queries for real-time offline-first updates
  const manualExpenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const deliveries = useLiveQuery(() => 
    db.delivery_assignments.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const fleetMaintenances = useLiveQuery(() => 
    db.vehicle_maintenances.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  // Calculate stats
  const stats = useMemo(() => {
    let totalGeneral = 0;
    let totalDeliveries = 0;
    let totalMaintenances = 0;

    manualExpenses.forEach(e => {
      totalGeneral += (e.amount || 0);
    });
    deliveries.forEach(d => {
      totalDeliveries += (d.fee || 0);
    });
    fleetMaintenances.forEach(m => {
      totalMaintenances += (m.cost || 0);
    });

    const totalOutflow = totalGeneral + totalDeliveries + totalMaintenances;

    return {
      totalGeneral,
      totalDeliveries,
      totalMaintenances,
      totalOutflow
    };
  }, [manualExpenses, deliveries, fleetMaintenances]);

  // Combine and map into unified list
  const combinedOutflows = useMemo(() => {
    const list: AccountingOutflow[] = [];

    // 1. Manual General Expenses
    manualExpenses.forEach(exp => {
      const dateVal = exp.date || exp.createdAt;
      let dateStr = '';
      let sortKey = 0;
      if (dateVal) {
        try {
          const d = (dateVal as any).seconds ? new Date((dateVal as any).seconds * 1000) : new Date(dateVal);
          dateStr = d.toISOString();
          sortKey = d.getTime();
        } catch {
          dateStr = new Date().toISOString();
          sortKey = Date.now();
        }
      } else {
        dateStr = new Date().toISOString();
        sortKey = Date.now();
      }
      list.push({
        id: exp.id,
        title: exp.title,
        category: exp.category || 'Autres dépenses',
        date: dateStr,
        amount: exp.amount || 0,
        paymentMethod: exp.paymentMethod || 'espèces',
        reference: exp.reference,
        description: exp.description,
        source: 'general',
        syncStatus: (exp as any).syncStatus,
        sortKey
      });
    });

    // 2. Deliveries (courses / runs)
    deliveries.forEach(del => {
      if (del.fee && del.fee > 0) {
        let sortKey = del.createdAt || Date.now();
        let dateStr = '';
        if (del.date) {
          try {
            const d = new Date(del.date);
            dateStr = d.toISOString();
            sortKey = d.getTime();
          } catch {
            dateStr = new Date(del.createdAt || Date.now()).toISOString();
          }
        } else if (del.createdAt) {
          dateStr = new Date(del.createdAt).toISOString();
        } else {
          dateStr = new Date().toISOString();
        }
        list.push({
          id: del.id,
          title: `Course / Livraison #${del.ticketNumber || del.id.slice(0, 6)}`,
          category: 'Course & Logistique',
          date: dateStr,
          amount: del.fee,
          description: `Livreur : ${del.agentName || 'Non assigné'} | Statut : ${del.status === 'delivered' ? 'Livré' : del.status === 'in_transit' ? 'En cours' : del.status === 'failed' ? 'Échoué' : 'Assigné'} | Client : ${del.clientName || 'N/A'}`,
          source: 'delivery',
          syncStatus: (del as any).syncStatus,
          sortKey
        });
      }
    });

    // 3. Vehicle Maintenance Logs
    fleetMaintenances.forEach(maint => {
      if (maint.cost && maint.cost > 0) {
        let sortKey = maint.updatedAt || Date.now();
        let dateStr = '';
        if (maint.date) {
          try {
            const d = new Date(maint.date);
            dateStr = d.toISOString();
            sortKey = d.getTime();
          } catch {
            dateStr = new Date(maint.updatedAt || Date.now()).toISOString();
          }
        } else if (maint.updatedAt) {
          dateStr = new Date(maint.updatedAt).toISOString();
        } else {
          dateStr = new Date().toISOString();
        }

        const typeLabels: Record<string, string> = {
          vidange: 'Vidange',
          pneus: 'Pneus',
          freins: 'Freins',
          moteur: 'Moteur',
          assurance: 'Assurance',
          controle_technique: 'Contrôle technique',
          autre: 'Autre d’entretien'
        };
        const friendlyType = typeLabels[maint.type] || 'Entretien';

        list.push({
          id: maint.id,
          title: `${friendlyType} (Véhicule : ${maint.vehiclePlate || 'N/A'})`,
          category: 'Maintenance Flotte',
          date: dateStr,
          amount: maint.cost,
          description: `Modèle : ${maint.vehicleModel || 'N/A'} | Garage : ${maint.garage || 'Non spécifié'} ${maint.notes ? `| Note : ${maint.notes}` : ''}`,
          source: 'maintenance',
          syncStatus: (maint as any).syncStatus,
          sortKey
        });
      }
    });

    // Sort descending
    return list.sort((a, b) => b.sortKey - a.sortKey);
  }, [manualExpenses, deliveries, fleetMaintenances]);

  // Filter outcomes
  const filteredOutflows = useMemo(() => {
    if (filterSource === 'all') return combinedOutflows;
    return combinedOutflows.filter(item => item.source === filterSource);
  }, [combinedOutflows, filterSource]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation désignation
    if (!newExpense.title || !newExpense.title.trim()) {
      triggerAcomAlert(
        'Champ Requis',
        'Veuillez renseigner un titre ou une désignation précise pour la dépense.',
        'warning',
        'VALIDATION'
      );
      return;
    }

    // 2. Validation montant
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      triggerAcomAlert(
        'Montant Invalide',
        'Veuillez saisir un montant supérieur à zéro.',
        'warning',
        'VALIDATION'
      );
      return;
    }

    // 3. Règle obligatoire pour "Autres dépenses"
    if (newExpense.category === 'Autres dépenses' && (!newExpense.description || !newExpense.description.trim())) {
      triggerAcomAlert(
        'Justification Requise',
        'Pour la catégorie "Autres dépenses", une désignation précise et une justification détaillée sont obligatoires.',
        'warning',
        'VALIDATION'
      );
      return;
    }

    setSaving(true);
    try {
      const savedDateIso = expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString();
      
      const expenseData = {
        merchantId: merchant.id,
        title: newExpense.title.trim(),
        amount: Number(newExpense.amount),
        category: newExpense.category || 'Autres dépenses',
        paymentMethod: newExpense.paymentMethod || 'espèces',
        reference: newExpense.reference?.trim() || undefined,
        description: newExpense.description?.trim() || undefined,
        date: savedDateIso,
        createdAt: savedDateIso
      };

      await dbService.merchantExpenses.save(expenseData);
      syncService.syncExpenses(merchant.id);

      EventBus.emit({
        type: 'EXPENSE_CREATED',
        saas: 'pressing',
        merchantId: merchant.id,
        payload: {
          title: newExpense.title.trim(),
          amount: Number(newExpense.amount),
          category: newExpense.category || 'Autres dépenses',
          paymentMethod: newExpense.paymentMethod || 'espèces',
          reference: newExpense.reference?.trim() || '',
          description: newExpense.description?.trim() || '',
          date: savedDateIso
        },
        triggeredBy: 'user'
      });

      setIsAddingExpense(false);

      // --- SUIVI GÉRANT (TEMPS RÉEL) ---
      const managerEmail = merchant.managerNotifications?.email || merchant.email || '';
      const managerPhone = merchant.managerNotifications?.whatsappPhone || merchant.phone || '';
      const currency = merchant.currency || 'FCFA';
      const operatorName = merchant.name || 'Utilisateur Atelier';

      const pmObj = PAYMENT_METHODS.find(p => p.id === newExpense.paymentMethod) || PAYMENT_METHODS[0];
      const pmLabel = pmObj.label;
      const isCash = newExpense.paymentMethod === 'espèces';

      let emailSent = false;
      let whatsappOpened = false;

      // 1. Send Email Notification
      if (managerEmail && managerEmail.trim()) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="background-color: #ef4444; padding: 20px; border-radius: 12px; text-align: center; color: #ffffff; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                💸 SUIVI GÉRANT — NOUVELLE DÉPENSE
              </h2>
              <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">
                SaaS Comptabilité & Gestion — ${merchant.name || 'Atelier'}
              </p>
            </div>

            <div style="padding: 10px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1e293b;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold; width: 40%;">Désignation :</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${newExpense.title.trim()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Montant :</td>
                  <td style="padding: 10px 0; font-weight: 900; color: #dc2626; font-size: 16px;">
                    ${Number(newExpense.amount).toLocaleString('fr-FR')} ${currency}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Catégorie :</td>
                  <td style="padding: 10px 0; font-weight: bold;">${newExpense.category}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Mode de paiement :</td>
                  <td style="padding: 10px 0; font-weight: bold; color: ${isCash ? '#15803d' : '#0369a1'};">${pmLabel}</td>
                </tr>
                ${newExpense.reference ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">N° Justificatif / Réf :</td>
                  <td style="padding: 10px 0; font-family: monospace; font-weight: bold;">${newExpense.reference}</td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Date :</td>
                  <td style="padding: 10px 0;">${format(new Date(savedDateIso), 'dd/MM/yyyy')}</td>
                </tr>
                ${newExpense.description ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Justification :</td>
                  <td style="padding: 10px 0; color: #334155; font-style: italic;">${newExpense.description}</td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Opérateur :</td>
                  <td style="padding: 10px 0; font-weight: bold;">${operatorName}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 25px; padding: 12px; background-color: ${isCash ? '#fef2f2' : '#f0f9ff'}; border: 1px solid ${isCash ? '#fecaca' : '#bae6fd'}; border-radius: 10px; font-size: 12px; color: ${isCash ? '#991b1b' : '#075985'}; text-align: center;">
              <strong>Impact Caisse :</strong> ${isCash ? 'Cette dépense est déduite des espèces lors de la clôture de caisse.' : 'Cette dépense est enregistrée en comptabilité hors caisse physique (Banque/Mobile Money).'}
            </div>

            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
              Notification automatique transmise en temps réel au Gérant.<br/>
              <strong>Système ACOM Technologie — ${merchant.name || 'Atelier'}</strong>
            </div>
          </div>
        `;

        try {
          await sendEmailDirectlyOrViaBackend({
            to: managerEmail,
            from: merchant.managerNotifications?.emailFrom || undefined,
            subject: `💸 [NOUVELLE DÉPENSE] ${newExpense.title} (${Number(newExpense.amount).toLocaleString('fr-FR')} ${currency}) - ${merchant.name || 'Atelier'}`,
            html: emailHtml
          }, {
            resendApiKey: merchant.managerNotifications?.resendApiKey,
            defaultFrom: merchant.managerNotifications?.emailFrom
          });
          emailSent = true;
        } catch (err) {
          console.error("Erreur lors de l'envoi de l'e-mail au gérant pour la dépense:", err);
        }
      }

      // 2. Open WhatsApp Window for Transmission
      if (managerPhone && managerPhone.trim()) {
        const waMessage = 
          `💸 [SUIVI GÉRANT - NOUVELLE DÉPENSE COMPTA] 🧾\n` +
          `----------------------------------------\n` +
          `📌 *Libellé :* ${newExpense.title}\n` +
          `💰 *Montant :* ${Number(newExpense.amount).toLocaleString('fr-FR')} ${currency}\n` +
          `🏷️ *Catégorie :* ${newExpense.category}\n` +
          `💳 *Mode de Paiement :* ${pmObj.shortLabel}\n` +
          (newExpense.reference ? `📑 *Référence :* ${newExpense.reference}\n` : '') +
          `📅 *Date :* ${format(new Date(savedDateIso), 'dd/MM/yyyy')}\n` +
          (newExpense.description ? `📝 *Justification :* ${newExpense.description}\n` : '') +
          `👤 *Opérateur :* ${operatorName}\n` +
          `----------------------------------------\n` +
          `✅ *Comptabilité :* ${isCash ? 'Enregistré et déduit des espèces en caisse.' : 'Enregistré hors caisse physique (Banque/Mobile Money).'}`;

        const cleaned = managerPhone.replace(/\s+/g, '').replace(/^\+/, '');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const waUrl = `https://${isMobile ? 'api' : 'web'}.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank');
        whatsappOpened = true;
      }

      // Single Standardized Alert Popup for Suivi Gérant
      const alertMsg = managerEmail || managerPhone
        ? `La dépense "${newExpense.title}" (${Number(newExpense.amount).toLocaleString('fr-FR')} ${currency} via ${pmObj.shortLabel}) a été enregistrée. Le Gérant a été notifié par E-mail${whatsappOpened ? ' et une fenêtre WhatsApp a été ouverte pour transmission' : ''}.`
        : `La dépense "${newExpense.title}" (${Number(newExpense.amount).toLocaleString('fr-FR')} ${currency} via ${pmObj.shortLabel}) a été enregistrée avec succès.`;

      triggerAcomAlert(
        'Dépense Enregistrée — Suivi Gérant',
        alertMsg,
        'success',
        'COMPTABILITÉ'
      );

      setNewExpense({
        title: '',
        amount: 0,
        category: 'Loyer',
        paymentMethod: 'espèces',
        reference: '',
        description: ''
      });
      setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de l\'enregistrement de la dépense', 'error', 'ALERTE');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      data-acom-id="accounting.container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 data-acom-id="accounting.title" className="text-2xl font-bold text-ink">Comptabilité</h2>
          <p data-acom-id="accounting.subtitle" className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des flux financiers & dépenses générales de l'atelier</p>
        </div>
        <button 
          data-acom-id="accounting.btn.new_expense"
          onClick={() => {
            setNewExpense({
              title: '',
              amount: 0,
              category: 'Loyer',
              paymentMethod: 'espèces',
              reference: '',
              description: ''
            });
            setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
            setIsAddingExpense(true);
          }} 
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div 
        data-acom-id="accounting.kpi_cards"
        className={`grid grid-cols-1 sm:grid-cols-2 ${merchant.type === 'transport' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}
      >
        {/* Card 1: Total outflows */}
        <div data-acom-id="accounting.kpi.charges_totales" className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Charges Totales</span>
              <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-ink font-mono mt-1">
              {stats.totalOutflow.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
            </p>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-rose-500 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2: General expenses */}
        <div data-acom-id="accounting.kpi.depenses_generales" className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Dépenses Générales</span>
              <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-500 font-mono mt-1">
              {stats.totalGeneral.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
            </p>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-amber-500 h-full" 
              style={{ width: `${stats.totalOutflow > 0 ? (stats.totalGeneral / stats.totalOutflow) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {merchant.type === 'transport' && (
          <>
            {/* Card 3: Deliveries costs */}
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Coût des Courses</span>
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-blue-500 font-mono mt-1">
                  {stats.totalDeliveries.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
                </p>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${stats.totalOutflow > 0 ? (stats.totalDeliveries / stats.totalOutflow) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Card 4: Fleet maintenances */}
            <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">Entretien de la Flotte</span>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-500 font-mono mt-1">
                  {stats.totalMaintenances.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{merchant.currency}</span>
                </p>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${stats.totalOutflow > 0 ? (stats.totalMaintenances / stats.totalOutflow) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div data-acom-id="accounting.filters_row" className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Tout le flux de trésorerie' },
          { id: 'general', label: 'Dépenses Générales' },
          ...(merchant.type === 'transport' ? [
            { id: 'delivery', label: 'Courses & Logistique' },
            { id: 'maintenance', label: 'Entretien Véhicules' }
          ] : [])
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterSource(btn.id)}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
              filterSource === btn.id
                ? 'bg-ink text-white border-ink shadow-sm'
                : 'bg-white text-gray-500 border-black/5 hover:bg-gray-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Outflows List Table */}
      <div data-acom-id="accounting.outflows_table" className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Désignation & Détails</th>
                <th className="px-8 py-5">Catégorie</th>
                <th className="px-8 py-5">Date d'émission</th>
                <th className="px-8 py-5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOutflows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Receipt className="w-6 h-6 text-gray-200" />
                      </div>
                      <p data-acom-id="accounting.empty_state" className="text-gray-400 text-sm font-medium">Aucune charge enregistrée pour ce filtre</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOutflows.slice(0, expenseLimit).map((outflow) => (
                  <tr key={outflow.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-start gap-4">
                        {outflow.source === 'general' && (
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mt-0.5 shadow-sm border border-amber-100/50">
                            <Receipt className="w-5 h-5" />
                          </div>
                        )}
                        {outflow.source === 'delivery' && (
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mt-0.5 shadow-sm border border-blue-100/50">
                            <Truck className="w-5 h-5" />
                          </div>
                        )}
                        {outflow.source === 'maintenance' && (
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mt-0.5 shadow-sm border border-emerald-100/50">
                            <Wrench className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-ink text-sm leading-tight truncate">{outflow.title}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {outflow.paymentMethod && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                                outflow.paymentMethod === 'mobile_money' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                                outflow.paymentMethod === 'carte' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                outflow.paymentMethod === 'virement' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                outflow.paymentMethod === 'cheque' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {outflow.paymentMethod === 'mobile_money' ? '📱 Mobile Money' :
                                 outflow.paymentMethod === 'carte' ? '💳 Carte' :
                                 outflow.paymentMethod === 'virement' ? '🏦 Virement' :
                                 outflow.paymentMethod === 'cheque' ? '📄 Chèque' :
                                 '💵 Espèces'}
                              </span>
                            )}
                            {outflow.reference && (
                              <span className="text-[9px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                                Réf: {outflow.reference}
                              </span>
                            )}
                          </div>
                          {outflow.description && (
                            <p className="text-xs text-gray-500 mt-1 italic font-medium leading-relaxed">✏️ {outflow.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">REF: {outflow.id.slice(0, 8)}</p>
                            {outflow.syncStatus && (
                              <>
                                <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                                  outflow.syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  outflow.syncStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-gray-50 text-gray-400 border-gray-100'
                                }`}>
                                  {outflow.syncStatus === 'synced' ? <Check className="w-2 h-2" /> : <RefreshCw className="w-2 h-2 animate-spin" />}
                                  <span className="text-[7px] font-black uppercase">{outflow.syncStatus}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {outflow.source === 'general' && (
                        <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {outflow.category}
                        </span>
                      )}
                      {outflow.source === 'delivery' && (
                        <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          🚚 Course
                        </span>
                      )}
                      {outflow.source === 'maintenance' && (
                        <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          🔧 Maintenance
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-ink uppercase">
                        {(() => {
                          if (!outflow.date) return '-';
                          try {
                            const d = new Date(outflow.date);
                            return format(d, 'dd/MM/yyyy');
                          } catch {
                            return '-';
                          }
                        })()}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-rose-600 font-mono">
                        -{outflow.amount.toLocaleString()} <span className="text-[10px] opacity-60">{merchant.currency}</span>
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredOutflows.length > expenseLimit && (
            <div className="p-4 flex justify-center border-t border-gray-100">
              <button 
                onClick={() => setExpenseLimit(prev => prev + 10)}
                className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Voir plus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              data-acom-id="accounting.expense.form_card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 data-acom-id="accounting.expense.form_title" className="text-lg font-bold text-ink">Nouvelle dépense manuelle</h3>
                  <p data-acom-id="accounting.expense.form_subtitle" className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">Comptabilité & Suivi Gérant</p>
                </div>
                <button onClick={() => setIsAddingExpense(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-8 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Désignation / Intitulé *
                  </label>
                  <input 
                    data-acom-id="accounting.expense.title"
                    type="text" 
                    required 
                    placeholder="Ex: Facture Senelec Janvier, Loyer Atelier, Transport coursier..." 
                    value={newExpense.title} 
                    onChange={e => setNewExpense({...newExpense, title: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/50 font-bold text-sm" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Montant ({merchant.currency}) *
                    </label>
                    <input 
                      data-acom-id="accounting.expense.amount"
                      type="number" 
                      min="1" 
                      required 
                      placeholder="0" 
                      value={newExpense.amount || ''} 
                      onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/50 font-mono font-bold text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Date de Dépense *
                    </label>
                    <input 
                      data-acom-id="accounting.expense.date"
                      type="date" 
                      required 
                      value={expenseDate} 
                      onChange={e => setExpenseDate(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/50 font-mono font-bold text-sm" 
                    />
                  </div>
                </div>

                {/* Catégorie */}
                <div data-acom-id="accounting.expense.category_grid">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Catégorie Comptable *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        data-acom-id={`accounting.expense.cat_${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
                        onClick={() => setNewExpense({ ...newExpense, category: cat })}
                        className={`py-2 px-2.5 text-[10px] font-bold rounded-xl border transition-all text-left truncate ${
                          newExpense.category === cat 
                            ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/10 shadow-sm font-black' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode de Paiement */}
                <div data-acom-id="accounting.expense.payment_methods">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Mode de Paiement *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        data-acom-id={`accounting.expense.pm_${pm.id}`}
                        onClick={() => setNewExpense({ ...newExpense, paymentMethod: pm.id })}
                        className={`py-2 px-2.5 text-[10px] font-bold rounded-xl border transition-all text-left truncate ${
                          newExpense.paymentMethod === pm.id 
                            ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500/10 shadow-sm font-black' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                  {newExpense.paymentMethod !== 'espèces' && (
                    <p className="text-[10px] text-sky-600 font-medium mt-1.5 flex items-center gap-1">
                      ℹ️ Cette dépense ne sera pas déduite des espèces physiques de la caisse journalière.
                    </p>
                  )}
                </div>

                {/* Référence / N° Justificatif */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    N° Référence / Justificatif (Optionnel)
                  </label>
                  <input 
                    data-acom-id="accounting.expense.reference"
                    type="text" 
                    placeholder="Ex: N° Chèque, Réf Virement, N° Reçu..." 
                    value={newExpense.reference} 
                    onChange={e => setNewExpense({...newExpense, reference: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/50 font-mono text-xs font-bold" 
                  />
                </div>

                {/* Description / Justification */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                      Description / Justification {newExpense.category === 'Autres dépenses' ? '*' : '(Optionnel)'}
                    </label>
                  </div>
                  <textarea 
                    data-acom-id="accounting.expense.description"
                    rows={2}
                    placeholder={
                      newExpense.category === 'Autres dépenses' 
                        ? 'Justification obligatoire pour la catégorie "Autres dépenses"...' 
                        : 'Saisissez des détails ou commentaires explicatifs...'
                    } 
                    value={newExpense.description} 
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-xs font-medium ${
                      newExpense.category === 'Autres dépenses' && !newExpense.description?.trim()
                        ? 'border-amber-300 bg-amber-50/20 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-rose-500/20'
                    }`} 
                  />
                  {newExpense.category === 'Autres dépenses' && (
                    <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                      ⚠️ Pour "Autres dépenses", la désignation et la justification détaillée sont obligatoires.
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                  <button 
                    data-acom-id="accounting.expense.cancel_btn"
                    type="button" 
                    onClick={() => setIsAddingExpense(false)} 
                    className="flex-1 py-3.5 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors text-xs"
                  >
                    Annuler
                  </button>
                  <button 
                    data-acom-id="accounting.expense.submit_btn"
                    type="submit" 
                    disabled={saving} 
                    className="flex-[2] py-3.5 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 text-xs"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer la dépense & Notifier'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MerchantAccounting;
