import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, FileText, Check, Download, ClipboardCheck, Clock, RefreshCw, Printer, Edit2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant, MerchantSale, MerchantQuote } from '../../../types';
import { billingService } from '../../../services/billingService';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { Receipt } from 'lucide-react';
import { printDirectHTML, generateReceiptPDF, generateA4InvoicePDF, generateA4QuotePDF } from '../utils/pdfGenerator'; // Warning: cyclical import, will need to extract these
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QuoteModal from './QuoteModal';
import PaymentModal from './PaymentModal';

const MerchantBilling = ({ merchant }: { merchant: Merchant }) => {
  const [subTab, setSubTab] = useState<'invoices' | 'quotes' | 'pending'>('invoices');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<MerchantQuote | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<MerchantSale | null>(null);
  const [activePrintDoc, setActivePrintDoc] = useState<{ type: 'sale' | 'quote'; item: any } | null>(null);

  const [invoiceLimit, setInvoiceLimit] = useState(10);
  const [pendingLimit, setPendingLimit] = useState(10);
  const [quoteLimit, setQuoteLimit] = useState(10);

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , []) || [];

  const quotes = useLiveQuery(() => 
    db.quotes.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , []) || [];

  const handleConvertQuote = async (quote: MerchantQuote) => {
    try {
      await billingService.convertQuoteToInvoice(quote, merchant);
      triggerAcomAlert('Succès', 'Devis converti en facture avec succès', 'success', 'SYSTÈME');
    } catch (error: any) {
      triggerAcomAlert('Erreur', error.message, 'error', 'ALERTE');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Facturation & Devis</h2>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Gestion des documents commerciaux</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setSubTab('invoices')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'invoices' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-ink'}`}
          >
            Factures
          </button>
          <button 
            onClick={() => setSubTab('pending')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'pending' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-rose-500'}`}
          >
            Impayés
          </button>
          <button 
            onClick={() => setSubTab('quotes')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'quotes' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-ink'}`}
          >
            Devis
          </button>
        </div>
      </div>

      {subTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Receipt className="w-5 h-5 text-primary" />
              Historique des Factures
            </h3>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{sales.length} Documents</span>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Référence & Date</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Mode</th>
                    <th className="px-8 py-5 text-right">Montant TTC</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 text-sm">Aucune facture enregistrée</td></tr>
                  ) : (
                    sales.slice(0, invoiceLimit).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-mono font-black text-ink">#INV-{sale.id.slice(0, 8).toUpperCase()}</p>
                            {(sale as any).syncStatus && (
                              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                                (sale as any).syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                (sale as any).syncStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-gray-50 text-gray-400 border-gray-100'
                              }`}>
                                {(sale as any).syncStatus === 'synced' ? <Check className="w-2 h-2" /> : <RefreshCw className="w-2 h-2 animate-spin" />}
                                <span className="text-[7px] font-black uppercase">{(sale as any).syncStatus}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                            {sale.createdAt?.seconds ? format(new Date(sale.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-ink text-sm">{sale.customerName || 'Client POS'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit ${
                              sale.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {sale.paymentMethod}
                            </span>
                            {sale.balance !== undefined && sale.balance > 0 && (
                              <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest w-fit">
                                Reste: {sale.balance.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-ink">
                          {sale.totalAmount.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-3">
                             {sale.balance !== undefined && sale.balance > 0 && (
                               <button 
                                 onClick={() => { setSelectedSale(sale as any); setIsPaymentModalOpen(true); }} 
                                 className="px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all border border-primary/20 text-[10px] font-black uppercase tracking-wider"
                                 title="Encaisser"
                               >
                                 Encaisser
                               </button>
                             )}
                             
                             {/* Centralized Print Action Button */}
                             <button 
                               onClick={() => setActivePrintDoc({ type: 'sale', item: sale })} 
                               className="px-4 py-2 bg-gray-50 border border-black/5 hover:border-primary/20 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                               title="Imprimer / Exporter le document (Reçus, Facture, Impayés)"
                             >
                               <Printer className="w-3.5 h-3.5 text-primary" />
                               <span>Imprimer / Exp.</span>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {sales.length > invoiceLimit && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <button 
                    onClick={() => setInvoiceLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'pending' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              Factures avec Impayés
            </h3>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{sales.filter(s => s.balance && s.balance > 0).length} En attente</span>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Référence</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5 text-right">Total</th>
                    <th className="px-8 py-5 text-right text-rose-500">Reste à payer</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.filter(s => s.balance !== undefined && s.balance > 0).length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 text-sm italic uppercase tracking-widest font-black opacity-40">Toutes les créances sont recouvrées !</td></tr>
                  ) : (
                    sales.filter(s => s.balance !== undefined && s.balance > 0).slice(0, pendingLimit).map((sale) => (
                      <tr key={sale.id} className="hover:bg-rose-50/20 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-[11px] font-mono font-black text-ink">#INV-{sale.id.slice(0, 8).toUpperCase()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-ink text-sm">{sale.customerName || 'Client POS'}</p>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-gray-400">
                          {sale.totalAmount.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-rose-500">
                          {sale.balance?.toLocaleString()} <span className="text-[9px] font-bold">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-3">
                             <button 
                               onClick={() => { setSelectedSale(sale as any); setIsPaymentModalOpen(true); }} 
                               className="px-3 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition-all"
                             >
                               Encaisser
                             </button>
                             
                             {/* Centralized Print Action Button */}
                             <button 
                               onClick={() => setActivePrintDoc({ type: 'sale', item: sale })} 
                               className="px-4 py-2 bg-gray-50 border border-black/5 hover:border-rose-100 hover:bg-rose-50/50 text-gray-700 hover:text-rose-600 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                               title="Imprimer / Exporter le document (Reçus, Facture, Impayés)"
                             >
                               <Printer className="w-3.5 h-3.5 text-rose-500" />
                               <span>Imprimer / Exp.</span>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {sales.filter(s => s.balance !== undefined && s.balance > 0).length > pendingLimit && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <button 
                    onClick={() => setPendingLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'quotes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
              Gestion des Devis
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{quotes.length} Devis</span>
              <button 
                onClick={() => { setSelectedQuote(null); setIsQuoteModalOpen(true); }}
                className="px-6 py-3 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all"
              >
                + Nouveau Devis
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Référence & Date</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Montant Estimé</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 text-sm">Aucun devis enregistré</td></tr>
                  ) : (
                    quotes.slice(0, quoteLimit).map((quote) => (
                      <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-[11px] font-mono font-black text-ink">#QT-{quote.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                            {quote.createdAt?.seconds ? format(new Date(quote.createdAt.seconds * 1000), 'dd/MM/yyyy') : format(new Date(quote.createdAt), 'dd/MM/yyyy')}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-ink text-sm">{quote.customerName || 'Prospect'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            quote.status === 'invoiced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            quote.status === 'draft' ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-blue-50 text-blue-500 border-blue-100'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-ink">
                          {quote.totalAmount.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-3">
                             {/* Centralized Print Action Button */}
                             <button 
                               onClick={() => setActivePrintDoc({ type: 'quote', item: quote })} 
                               className="px-4 py-2 bg-gray-50 border border-black/5 hover:border-blue-100 hover:bg-blue-50/50 text-gray-700 hover:text-blue-600 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                               title="Imprimer / Exporter le devis"
                             >
                               <Printer className="w-3.5 h-3.5 text-blue-500" />
                               <span>Imprimer / Exp.</span>
                             </button>

                             {quote.status === 'draft' && (
                               <button 
                                 onClick={() => { setSelectedQuote(quote); setIsQuoteModalOpen(true); }} 
                                 className="p-2.5 bg-gray-50 hover:bg-amber-50 text-gray-400 hover:text-amber-500 rounded-xl transition-all border border-black/5"
                                 title="Modifier Devis"
                               >
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                             )}
                             {quote.status !== 'invoiced' && (
                               <button 
                                 onClick={() => handleConvertQuote(quote)} 
                                 className="p-2.5 bg-gray-50 hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 rounded-xl transition-all border border-black/5"
                                 title="Convertir en Facture"
                               >
                                 <Plus className="w-3.5 h-3.5" />
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {quotes.length > quoteLimit && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <button 
                    onClick={() => setQuoteLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        merchant={merchant} 
        quote={selectedQuote}
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        merchant={merchant}
        sale={selectedSale}
      />

      {/* Centralized Beautiful Document Printing Modal */}
      <AnimatePresence>
        {activePrintDoc && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setActivePrintDoc(null)} 
              className="absolute inset-0 bg-ink/65 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5"
            >
              {/* Header */}
              <div className="bg-gray-50/80 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <Printer className="w-5 h-5 text-primary" />
                    Centre d'Impression & d'Export
                  </h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.15em] mt-0.5">
                    {activePrintDoc.type === 'sale' 
                      ? `Facture #INV-${activePrintDoc.item.id.slice(0, 8).toUpperCase()}` 
                      : `Devis #QT-${activePrintDoc.item.id.slice(0, 8).toUpperCase()}`
                    }
                  </p>
                </div>
                <button 
                  onClick={() => setActivePrintDoc(null)} 
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Overview */}
              <div className="px-8 py-5 bg-primary/2 flex justify-between items-center text-xs font-mono font-black border-b border-gray-100/50">
                <div className="text-gray-500">
                  CLIENT: <span className="text-ink font-bold font-sans">{activePrintDoc.item.customerName || 'Client POS'}</span>
                </div>
                <div className="text-primary font-mono font-bold">
                  TOTAL: <span>{Number(activePrintDoc.item.totalAmount || 0).toLocaleString()} {merchant.currency}</span>
                </div>
              </div>

              {/* Options Section */}
              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                {activePrintDoc.type === 'sale' ? (
                  <>
                    {/* OPTION 1: Receipt standard (THERMIQUE) */}
                    <div className="p-4 bg-white hover:bg-amber-50/10 border border-gray-100 hover:border-amber-200 rounded-2xl transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-105 transition-transform">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm">Reçu de Caisse (Ticket Thermique)</h4>
                          <p className="text-xs text-gray-500 max-w-sm mt-0.5">Format de poche (80mm), optimal pour les imprimantes thermiques de caisse et justificatifs légers.</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 min-w-[120px]">
                        <button 
                          onClick={() => printDirectHTML(merchant, 'receipt', activePrintDoc.item)}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                        <button 
                          onClick={() => generateReceiptPDF(merchant, activePrintDoc.item, 'download')}
                          className="flex-1 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>

                    {/* OPTION 2: Facture A4 (OFFICIELLE) */}
                    <div className="p-4 bg-white hover:bg-emerald-50/10 border border-gray-100 hover:border-emerald-200 rounded-2xl transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm">Facture Standard (Format A4)</h4>
                          <p className="text-xs text-gray-500 max-w-sm mt-0.5">Facture réglementaire complète avec en-tête d'entreprise, totaux détaillés et cadres de signatures.</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 min-w-[120px]">
                        <button 
                          onClick={() => printDirectHTML(merchant, 'invoice', activePrintDoc.item)}
                          className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                        <button 
                          onClick={() => generateA4InvoicePDF(merchant, activePrintDoc.item, 'download', 'invoice')}
                          className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* OPTION 4: Devis Proforma (Quotes) */}
                    <div className="p-4 bg-white hover:bg-blue-50/10 border border-gray-100 hover:border-blue-200 rounded-2xl transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:scale-105 transition-transform">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm">Devis Proforma (Format A4)</h4>
                          <p className="text-xs text-gray-500 max-w-sm mt-0.5">Proposition budgétaire officielle A4 avec validité d'offre et grilles de prix prévisionnels.</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 min-w-[120px]">
                        <button 
                          onClick={() => printDirectHTML(merchant, 'quote', activePrintDoc.item)}
                          className="flex-1 py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                        <button 
                          onClick={() => generateA4QuotePDF(merchant, activePrintDoc.item, 'download')}
                          className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setActivePrintDoc(null)}
                  className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-xs text-gray-600 uppercase tracking-widest transition-colors shadow-sm"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default MerchantBilling;
