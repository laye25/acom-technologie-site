import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Users, Activity, FileText } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant } from '../../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { jsPDF } from 'jspdf';
import { CheckCircle, Clock, ShoppingCart, Banknote } from 'lucide-react';
import { pdfFormatNum, saveOrSharePDF } from '../../billing/utils/pdfGenerator';
import { fr } from 'date-fns/locale';
// Removed unavailable imports
import { PressingTicket, DetergentSale } from '../../pressing/types';

const ReportKPI = ({ label, value, currency, suffix, icon: Icon, trend, cardColor }: any) => {
  const colors: any = {
    primary: 'bg-primary/10 text-primary border-primary/10',
    rose: 'bg-rose-50 text-rose-500 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-500 border-blue-100',
    amber: 'bg-amber-50 text-amber-500 border-amber-100',
    orange: 'bg-orange-50 text-orange-500 border-orange-100',
  };

  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[cardColor] || 'bg-gray-50'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">
           {trend}
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">{label}</h4>
        <div className="flex items-baseline mt-1.5">
          <span className="text-2xl font-black text-ink">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          <span className="text-[10px] font-mono font-bold text-gray-400 ml-1.5 uppercase">{suffix || currency}</span>
        </div>
      </div>
    </div>
  );
};
const MerchantReports = ({ merchant }: { merchant: Merchant }) => {
  const [reportSelectedMonth, setReportSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const sales = useLiveQuery(() => db.sales.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];
  const expenses = useLiveQuery(() => db.expenses.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];
  const products = useLiveQuery(() => db.products.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];

  const pressingTickets = useMemo<PressingTicket[]>(() => {
    if (merchant.type !== 'pressing') return [];
    try {
      const saved = localStorage.getItem(`pressing_tickets_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, merchant.type]);

  const pressingProductSales = useMemo<DetergentSale[]>(() => {
    if (merchant.type !== 'pressing') return [];
    try {
      const saved = localStorage.getItem(`pressing_stock_sales_${merchant.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, merchant.type]);

  const pressingTarifs = useMemo(() => {
    if (merchant.type !== 'pressing') return null;
    try {
      const saved = localStorage.getItem(`pressing_tarifs_${merchant.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [merchant.id, merchant.type]);

  const financialSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalCollected = 0;
    let totalPending = 0;
    
    const filteredExpenses = reportSelectedMonth
      ? expenses.filter(e => {
          const d = e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000) : new Date(e.createdAt);
          return d.toISOString().startsWith(reportSelectedMonth);
        })
      : expenses;
      
    let totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    let totalCOGS = 0;

    if (merchant.type === 'pressing') {
      const filteredTickets = (reportSelectedMonth
        ? pressingTickets.filter(t => t.depositDate && t.depositDate.startsWith(reportSelectedMonth))
        : pressingTickets).filter(t => t.status !== 'quotation');
        
      const filteredProducts = reportSelectedMonth
        ? pressingProductSales.filter(s => s.date && s.date.startsWith(reportSelectedMonth))
        : pressingProductSales;

      const ticketsAmount = filteredTickets.reduce((sum, t) => sum + t.total, 0);
      const ticketsPaid = filteredTickets.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
      
      const ticketsCost = filteredTickets.reduce((sum, t) => {
        if (typeof t.totalCost === 'number') return sum + t.totalCost;
        
        // Retro-compute cost for old tickets without totalCost
        let retroCost = 0;
        const aCosts = pressingTarifs?.articles_costs || {};
        const pCosts = pressingTarifs?.poids_costs || {};
        const sCosts = pressingTarifs?.supplements_costs || {};

        if (t.billingType === 'article' && t.articles) {
          retroCost += Object.keys(t.articles).reduce((acc, key) => {
             // Fallbacks for default values if not explicitly in custom tarifs
             let defaultCost = 0;
             if (key === 'chemise') defaultCost = 100;
             if (key === 'pantalon') defaultCost = 150;
             if (key === 'costume') defaultCost = 300;
             if (key === 'robe') defaultCost = 200;
             if (key === 'drap') defaultCost = 150;
             if (key === 'couverture') defaultCost = 400;
             if (key === 'rideau') defaultCost = 300;
             if (key === 'autre') defaultCost = 100;
             return acc + (t.articles[key] * (aCosts[key] !== undefined ? aCosts[key] : defaultCost));
          }, 0);
        } else if (t.billingType === 'poids' && t.weightKg) {
           let defaultCost = 0;
           if (t.weightService === 'standard') defaultCost = 200;
           if (t.weightService === 'premium') defaultCost = 300;
           if (t.weightService === 'express') defaultCost = 400;
           retroCost += t.weightKg * (pCosts[t.weightService] !== undefined ? pCosts[t.weightService] : defaultCost);
        }

        if (t.supplements) {
          retroCost += Object.keys(t.supplements).reduce((acc, key) => {
             if (!t.supplements[key]) return acc;
             let defaultCost = 0;
             if (key === 'repassage') defaultCost = 100;
             if (key === 'express') defaultCost = 200;
             if (key === 'detachage') defaultCost = 150;
             if (key === 'livraison') defaultCost = 400;
             if (key === 'premiumPack') defaultCost = 100;
             return acc + (sCosts[key] !== undefined ? sCosts[key] : defaultCost);
          }, 0);
        }
        return sum + retroCost;
      }, 0);

      const productsAmount = filteredProducts.reduce((sum, s) => sum + s.total, 0);
      const productsCost = filteredProducts.reduce((sum, s) => sum + (s.totalCost || 0), 0);
      
      totalRevenue = ticketsAmount + productsAmount;
      totalCollected = ticketsPaid + productsAmount; // Product sales are 100% paid
      totalPending = Math.max(0, ticketsAmount - ticketsPaid);
      totalCOGS = ticketsCost + productsCost;
    } else {
      const filteredSales = reportSelectedMonth
        ? sales.filter(s => {
            const d = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000) : new Date(s.createdAt);
            return d.toISOString().startsWith(reportSelectedMonth);
          })
        : sales;

      totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
      totalCollected = filteredSales.reduce((acc, s) => acc + (s.paidAmount !== undefined ? s.paidAmount : s.totalAmount), 0);
      totalPending = filteredSales.reduce((acc, s) => acc + (s.balance || 0), 0);
      
      totalCOGS = filteredSales.reduce((acc, sale) => {
        if (typeof sale.totalCost === 'number') {
          return acc + sale.totalCost;
        }
        return acc + (sale.items || []).reduce((itemAcc, item) => {
          const product = products.find(p => p.id === item.productId);
          const cost = (item as any).costPrice || (product?.costPrice || 0);
          return itemAcc + ((item.quantity || 0) * cost);
        }, 0);
      }, 0);
    }

    const grossMargin = totalCollected - totalCOGS;
    const netProfit = totalCollected - totalCOGS - totalExpenses;
    const margin = totalCollected > 0 ? (netProfit / totalCollected) * 100 : 0;
    const cashFlow = totalCollected - totalExpenses; // Approximate cash flow

    return { totalRevenue, totalCollected, totalPending, totalExpenses, netProfit, margin, totalCOGS, grossMargin, cashFlow };
  }, [sales, expenses, products, merchant.type, pressingTickets, pressingProductSales, reportSelectedMonth]);

  const monthlyData = useMemo(() => {
    // Group sales and expenses by month for the last 6 months
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subDays(now, 180),
      end: now
    });

    return months.map(month => {
      const label = format(month, 'MMM yy', { locale: fr });
      
      const monthExpenses = expenses.filter(e => {
        const d = e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000) : new Date(e.createdAt);
        return isSameMonth(d, month);
      });
      const exp = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

      let rev = 0;
      let cogs = 0;

      if (merchant.type === 'pressing') {
        const monthTickets = pressingTickets.filter(t => isSameMonth(new Date(t.depositDate), month));
        const monthProductSales = pressingProductSales.filter(s => isSameMonth(new Date(s.date), month));
        
        rev = monthTickets.reduce((acc, t) => acc + t.total, 0) + monthProductSales.reduce((acc, s) => acc + s.total, 0);
        cogs = monthTickets.reduce((acc, t) => acc + (t.totalCost || 0), 0) + monthProductSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
      } else {
        const monthSales = sales.filter(s => {
          const d = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000) : new Date(s.createdAt);
          return isSameMonth(d, month);
        });
        
        rev = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);
        cogs = monthSales.reduce((acc, sale) => {
          if (typeof sale.totalCost === 'number') {
            return acc + sale.totalCost;
          }
          return acc + (sale.items || []).reduce((itemAcc, item) => {
            const product = products.find(p => p.id === item.productId);
            const cost = (item as any).costPrice || (product?.costPrice || 0);
            return itemAcc + ((item.quantity || 0) * cost);
          }, 0);
        }, 0);
      }
      
      return {
        name: label,
        Revenus: rev,
        Dépenses: exp,
        Profit: rev - cogs - exp
      };
    });
  }, [sales, expenses, products, merchant.type, pressingTickets, pressingProductSales]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    const filteredExpenses = reportSelectedMonth
      ? expenses.filter(e => {
          const d = e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000) : new Date(e.createdAt);
          return d.toISOString().startsWith(reportSelectedMonth);
        })
      : expenses;
      
    filteredExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    
    // Sort and take top 4
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, value]) => {
        const percentage = financialSummary.totalExpenses > 0 ? (value / financialSummary.totalExpenses * 100) : 0;
        return { name, value, percentage: percentage.toFixed(0) };
      });
  }, [expenses, financialSummary.totalExpenses, reportSelectedMonth]);

  // Export financial transactions to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Type de flux', 'Catégorie', 'Description', 'Montant', 'Devise', 'Moyen de paiement / Statut'];
      
      const transactions: any[] = [];
      
      sales.forEach(s => {
        const t = s.createdAt?.seconds ? s.createdAt.seconds * 1000 : new Date(s.createdAt).getTime();
        transactions.push({
          timestamp: t,
          date: s.createdAt,
          type: 'Entrée (Vente)',
          category: 'Vente de produits',
          description: s.items?.map((it: any) => `${it.name} (x${it.quantity})`).join(', ') + (s.customerName ? ` - Client: ${s.customerName}` : ''),
          amount: s.totalAmount,
          status: s.balance > 0 ? `Reste à recouvrir: ${s.balance}` : 'Encaissé entièrement'
        });
      });

      expenses.forEach(e => {
        const t = e.createdAt?.seconds ? e.createdAt.seconds * 1000 : new Date(e.createdAt).getTime();
        transactions.push({
          timestamp: t,
          date: e.createdAt,
          type: 'Sortie (Dépense)',
          category: e.category || 'Général',
          description: e.description || '',
          amount: e.amount,
          status: (e as any).paymentMethod || 'Espèces'
        });
      });

      // Sort chronological descending (newest first)
      transactions.sort((a, b) => b.timestamp - a.timestamp);

      // Map to rows with semi-colons for perfect French Excel support
      const csvRows = [
        headers.join(';'),
        ...transactions.map(t => {
          const dateStr = t.date?.seconds 
            ? format(new Date(t.date.seconds * 1000), 'dd/MM/yyyy HH:mm')
            : format(new Date(t.date), 'dd/MM/yyyy HH:mm');
          
          const typeClean = (t.type || '').replace(/;/g, ',').replace(/"/g, '""');
          const categoryClean = (t.category || '').replace(/;/g, ',').replace(/"/g, '""');
          const descClean = (t.description || '').replace(/;/g, ',').replace(/"/g, '""');
          const statusClean = (t.status || '').replace(/;/g, ',').replace(/"/g, '""');
          
          return `"${dateStr}";"${typeClean}";"${categoryClean}";"${descClean}";"${t.amount}";"${merchant.currency}";"${statusClean}"`;
        })
      ];

      const csvContent = "\uFEFF" + csvRows.join("\n"); // UTF-8 BOM byte
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `rapport_financier_${merchant.name.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerAcomAlert('Succès', 'Rapport exporté sous format CSV !', 'success', 'SYSTÈME');
    } catch (error) {
      console.error(error);
      triggerAcomAlert('Erreur', "Échec de l'exportation CSV.", 'error', 'ALERTE');
    }
  };

  // Export financial report to beautiful PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      // Header Brand Accent
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(margin, y, 170, 1.5, 'F');
      y += 8;

      // Header Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text('RAPPORT FINANCIER', margin, y);
      
      // Right metadata
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 190, y, { align: 'right' });
      y += 5.5;
      doc.text(`Établissement : ${merchant.name}`, 190, y, { align: 'right' });
      y += 12;

      // Divider line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, y, 190, y);
      y += 10;

      // Section: Synthèse Financière (Financial Summary)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('SYNTHÈSE DE LA PÉRIODE', margin, y);
      y += 6;

      // KPI boxes renderer helper
      const drawKpi = (label: string, value: number, x: number, yPos: number, width: number, height: number, colorArr: [number, number, number]) => {
        // Background card
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, yPos, width, height, 2.5, 2.5, 'FD');

        // Color ribbon side
        doc.setFillColor(...colorArr);
        doc.rect(x, yPos, 2, height, 'F');

        // Text
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(label.toUpperCase(), x + 5, yPos + 6);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(`${pdfFormatNum(value)} ${merchant.currency}`, x + 5, yPos + 13);
      };

      const boxWidth = 39;
      const boxHeight = 18;
      const bGap = 42;

      // Draw first row of KPIs (4 columns)
      drawKpi('Chiffre d\'Affaires', financialSummary.totalRevenue, margin, y, boxWidth, boxHeight, [99, 102, 241]); // Indigo
      drawKpi('Total Encaissé', financialSummary.totalCollected, margin + bGap, y, boxWidth, boxHeight, [16, 185, 129]); // Emerald
      drawKpi('Reste à Recouvrer', financialSummary.totalPending, margin + bGap * 2, y, boxWidth, boxHeight, [245, 158, 11]); // Amber
      drawKpi('Coût Achat (COGS)', financialSummary.totalCOGS || 0, margin + bGap * 3, y, boxWidth, boxHeight, [249, 115, 22]); // Orange

      y += boxHeight + 4;

      // Draw second row of KPIs (4 columns)
      drawKpi('Marge Brute', financialSummary.grossMargin || 0, margin, y, boxWidth, boxHeight, [6, 182, 212]); // Cyan
      drawKpi('Total Dépenses', financialSummary.totalExpenses, margin + bGap, y, boxWidth, boxHeight, [244, 63, 94]); // Rose
      drawKpi('Flux Trésorerie', financialSummary.cashFlow || 0, margin + bGap * 2, y, boxWidth, boxHeight, [99, 102, 241]); // Indigo
      drawKpi('Bénéfice Net', financialSummary.netProfit, margin + bGap * 3, y, boxWidth, boxHeight, [59, 130, 246]); // Blue
      
      y += boxHeight + 14;

      // Write Category Breakdown summary if there's any expense
      if (categoryData.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('RÉPARTITION MAJEURE DES DÉPENSES', margin, y);
        y += 5;

        // Display category items side-by-side
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const catStrList = categoryData.map(c => `${c.name}: ${pdfFormatNum(c.value)} ${merchant.currency} (${c.percentage}%)`);
        doc.text(catStrList.slice(0, 3).join('   |   '), margin, y);
        y += 11;
      }

      // Section: Detailed Tables
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('DERNIÈRES OPÉRATIONS DE REVENUS (VENTES)', margin, y);
      y += 5;

      // Sales Table Header
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(margin, y, 170, 6, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('Date', margin + 3, y + 4.5);
      doc.text('Client', margin + 25, y + 4.5);
      doc.text('Statut de Paiement', margin + 95, y + 4.5);
      doc.text('Montant', 190 - 3, y + 4.5, { align: 'right' });
      
      y += 6;

      // Render top 5 sales
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85); // Slate-700
      
      const topSales = [...sales].sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
        const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
        return tB - tA;
      }).slice(0, 5);

      if (topSales.length === 0) {
        doc.text('Aucune vente enregistrée', margin + 3, y + 4.5);
        y += 8;
      } else {
        topSales.forEach(s => {
          const dateStr = s.createdAt?.seconds 
            ? format(new Date(s.createdAt.seconds * 1000), 'dd/MM/yyyy')
            : format(new Date(s.createdAt), 'dd/MM/yyyy');
          
          doc.text(dateStr, margin + 3, y + 4.5);
          doc.text(s.customerName || 'Client de passage', margin + 25, y + 4.5);
          doc.text(s.balance > 0 ? `Incomplet (Reste ${pdfFormatNum(s.balance)})` : 'Payé complétement', margin + 95, y + 4.5);
          doc.text(`${pdfFormatNum(s.totalAmount)} ${merchant.currency}`, 190 - 3, y + 4.5, { align: 'right' });
          
          y += 6;
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(margin, y, 190, y);
        });
        y += 8;
      }

      // Expenses Section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('DERNIÈRES OPÉRATIONS DE CHARGES (DÉPENSES)', margin, y);
      y += 5;

      // Expenses Table Header
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(margin, y, 170, 6, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('Date', margin + 3, y + 4.5);
      doc.text('Catégorie', margin + 25, y + 4.5);
      doc.text('Description / Motif', margin + 65, y + 4.5);
      doc.text('Montant', 190 - 3, y + 4.5, { align: 'right' });
      
      y += 6;

      // Render top 5 expenses
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85); // Slate-700

      const topExpenses = [...expenses].sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
        const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
        return tB - tA;
      }).slice(0, 5);

      if (topExpenses.length === 0) {
        doc.text('Aucune dépense enregistrée', margin + 3, y + 4.5);
        y += 8;
      } else {
        topExpenses.forEach(e => {
          const dateStr = e.createdAt?.seconds 
            ? format(new Date(e.createdAt.seconds * 1000), 'dd/MM/yyyy')
            : format(new Date(e.createdAt), 'dd/MM/yyyy');
          
          const expDesc = e.description && e.description.length > 42 ? e.description.substring(0, 40) + '...' : (e.description || '-');
          
          doc.text(dateStr, margin + 3, y + 4.5);
          doc.text(e.category, margin + 25, y + 4.5);
          doc.text(expDesc, margin + 65, y + 4.5);
          doc.text(`${pdfFormatNum(e.amount)} ${merchant.currency}`, 190 - 3, y + 4.5, { align: 'right' });
          
          y += 6;
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(margin, y, 190, y);
        });
        y += 8;
      }

      // Final signature row of financial balance
      y = Math.min(265, Math.max(y + 10, 255));
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(`Rapport financier généré électroniquement par ACOM Technologie. Établissement : ${merchant.name}`, 105, y, { align: 'center' });

      saveOrSharePDF(doc, `rapport_financier_${merchant.name.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error(error);
      triggerAcomAlert('Erreur', 'Échec de la génération du PDF.', 'error', 'ALERTE');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Rapports Financiers</h2>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Analyse de performance et rentabilité</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="px-5 py-2.5 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <BarChart3 className="w-3 h-3" />
            Exporter CSV
          </button>
          <button 
            onClick={exportToPDF}
            className="px-5 py-2.5 bg-ink text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-primary" />
            Rapport PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-violet-600 font-bold">
          <Calendar className="w-5 h-5 text-violet-600" />
          <span>Période des statistiques de vente</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="month"
            value={reportSelectedMonth}
            onChange={(e) => setReportSelectedMonth(e.target.value)}
            className="relative pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer font-medium text-slate-700 bg-slate-50 hover:bg-white transition-all text-sm outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10 z-0"
            max={new Date().toISOString().slice(0, 7)}
          />
          <Calendar className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none z-0" />
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportKPI cardColor="primary" label="Ventes Totales" value={financialSummary.totalRevenue} currency={merchant.currency} icon={DollarSign} />
        <ReportKPI cardColor="emerald" label="Total Encaissé" value={financialSummary.totalCollected} currency={merchant.currency} icon={CheckCircle} />
        <ReportKPI cardColor="amber" label="Reste à Recouvrer" value={financialSummary.totalPending} currency={merchant.currency} icon={Clock} />
        <ReportKPI cardColor="orange" label="Coût d'Achat" value={financialSummary.totalCOGS || 0} currency={merchant.currency} icon={ShoppingCart} />
        
        <ReportKPI cardColor="cyan" label="Marge Brute" value={financialSummary.grossMargin || 0} currency={merchant.currency} icon={BarChart3} />
        <ReportKPI cardColor="rose" label="Total Dépenses" value={financialSummary.totalExpenses} currency={merchant.currency} icon={TrendingDown} />
        <ReportKPI cardColor="indigo" label="Flux de Trésorerie" value={financialSummary.cashFlow || 0} currency={merchant.currency} icon={Banknote} />
        <ReportKPI cardColor="blue" label="Bénéfice Net" value={financialSummary.netProfit} currency={merchant.currency} icon={TrendingUp} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-ink uppercase tracking-widest text-xs">Évolution Mensuelle</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Revenus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Dépenses</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
               <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ff0000" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#ff0000" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} dy={10} />
                 <YAxis hide />
                 <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                 <Area type="monotone" dataKey="Revenus" stroke="#ff0000" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                 <Area type="monotone" dataKey="Dépenses" stroke="#fb7185" strokeWidth={4} fill="transparent" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-ink p-8 rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
             <BarChart3 className="w-32 h-32 text-white" />
          </div>
          <div className="relative">
            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8">Part des Dépenses</h3>
            <div className="space-y-6">
              {categoryData.length === 0 ? (
                <p className="text-white/40 text-[10px] uppercase font-bold italic text-center py-12">Aucune catégorie de dépense</p>
              ) : (
                categoryData.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-black">
                      <span className="text-white/60">{cat.name}</span>
                      <span className="text-white">{cat.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        className={`h-full ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-purple-400' : 'bg-rose-400'}`} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-[9px] text-white/40 uppercase font-black mb-1 tracking-widest text-center">Optimisation suggérée</p>
              <p className="text-white text-[11px] font-medium text-center leading-relaxed antialiased">
                {categoryData[0] ? (
                  <>Vos dépenses en <span className="text-primary font-bold">{categoryData[0].name}</span> représentent le poste le plus important. Un audit est conseillé.</>
                ) : (
                  "Capturez davantage de dépenses pour obtenir des conseils personnalisés."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default MerchantReports;
