import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, FileText, Check, Download, AlertCircle, ShoppingCart, Trash2, Edit2, Package, Save } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant, MerchantQuote, MerchantProduct, MerchantQuoteItem } from '../../../types';
import { billingService } from '../../../services/billingService';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { OptimizedImage } from '../../../components/OptimizedImage';

const QuoteModal = ({ isOpen, onClose, merchant, quote }: { isOpen: boolean, onClose: () => void, merchant: Merchant, quote?: MerchantQuote | null }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<MerchantQuoteItem[]>([]);
  const [notes, setNotes] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quote) {
      setCustomerName(quote.customerName || '');
      setCustomerPhone(quote.customerPhone || '');
      setCustomerEmail(quote.customerEmail || '');
      setCustomerAddress(quote.customerAddress || '');
      setItems(quote.items || []);
      setNotes(quote.notes || '');
      // Calculate expiry days from validUntil
      const expiry = quote.validUntil?.seconds ? new Date(quote.validUntil.seconds * 1000) : new Date(quote.validUntil);
      const diff = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      setExpiryDays(diff > 0 ? diff : 30);
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setItems([]);
      setNotes('');
      setExpiryDays(30);
    }
  }, [quote, isOpen]);

  const products = useLiveQuery(() => db.products.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];

  const addItem = (product?: MerchantProduct) => {
    if (product) {
      setItems([...items, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: product.price, 
        total: product.price,
        sizes: product.sizes || '',
        colors: product.colors || ''
      }]);
    } else {
      setItems([...items, { name: '', quantity: 1, price: 0, total: 0, sizes: '', colors: '' }]);
    }
  };

  const updateItem = (index: number, updates: Partial<MerchantQuoteItem>) => {
    const newItems = [...items];
    const item = { ...newItems[index], ...updates };
    item.total = (item.quantity || 0) * (item.price || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((acc, item) => acc + item.total, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !customerName) {
      toast.error('Veuillez remplir les informations obligatoires');
      return;
    }

    setIsSaving(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + expiryDays);

      if (quote) {
        await db.quotes.update(quote.id, {
          items,
          totalAmount: total,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          validUntil,
          notes,
          updatedAt: new Date()
        });
        toast.success('Devis mis à jour');
      } else {
        await billingService.createQuote({
          merchantId: merchant.id,
          items,
          totalAmount: total,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          validUntil,
          notes,
          status: 'draft',
          processedBy: merchant.ownerId
        });
        toast.success('Devis enregistré');
      }

      onClose();
      setCustomerName('');
      setCustomerPhone('');
      setItems([]);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-black text-ink">Nouveau Devis</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Créez une proposition commerciale</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Informations Client</h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom / Entreprise *</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Téléphone</label>
                    <input 
                      type="tel" 
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Validité (Jours)</label>
                     <input 
                       type="number" 
                       value={expiryDays}
                       onChange={e => setExpiryDays(parseInt(e.target.value))}
                       className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none"
                     />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Détails Expédition (Optionnel)</h4>
               <textarea 
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full h-[120px] px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none resize-none"
                  placeholder="Adresse complète du client..."
               />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Articles du Devis</h4>
              <div className="flex gap-2">
                <select 
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === e.target.value);
                    if (p) addItem(p);
                    e.target.value = "";
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-[10px] font-bold outline-none border-none cursor-pointer"
                >
                  <option value="">+ Ajouter un produit</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.price} {merchant.currency}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => addItem()}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                >
                  + Manuel
                </button>
              </div>
            </div>

            <div className="space-y-3">
               {items.map((item, idx) => (
                 <div key={idx} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:border-primary/20">
                    <div className="flex flex-wrap md:flex-nowrap gap-3 items-end">
                      <div className="flex-1 min-w-[200px] space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Désignation</label>
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={e => updateItem(idx, { name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl text-xs font-bold font-mono outline-none focus:border-primary/50"
                          placeholder="Nom de l'article"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Qté</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl text-xs font-black font-mono outline-none text-center"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Prix Unitaire</label>
                        <input 
                          type="text" 
                          value={item.price === 0 ? '' : item.price}
                          onChange={e => updateItem(idx, { price: parseFloat(e.target.value.replace(/\D/g, '')) || 0 })}
                          className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl text-xs font-black font-mono outline-none text-right"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary ml-1">Total</label>
                        <div className="w-full px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl text-xs font-black font-mono text-right text-primary">
                          {item.total.toLocaleString()}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100/50">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Taille (Optionnel)</label>
                         <input 
                           type="text" 
                           value={item.sizes || ''} 
                           onChange={e => updateItem(idx, { sizes: e.target.value })} 
                           className="w-full px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-semibold font-mono outline-none placeholder:text-gray-300" 
                           placeholder="ex: M, XL, 42"
                         />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Couleur (Optionnel)</label>
                         <input 
                           type="text" 
                           value={item.colors || ''} 
                           onChange={e => updateItem(idx, { colors: e.target.value })} 
                           className="w-full px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-semibold font-mono outline-none placeholder:text-gray-300" 
                           placeholder="ex: Noir, Rouge"
                         />
                       </div>
                    </div>
                 </div>
               ))}
               {items.length === 0 && (
                 <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Aucun article ajouté</p>
                 </div>
               )}
            </div>
          </div>

          <div className="p-8 bg-ink rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
            <div className="flex-1 w-full">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 block">Conditions de règlement & Notes</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-medium text-xs outline-none focus:border-primary/50 text-white placeholder-white/20 h-24 resize-none"
                placeholder="Ex: Acompte de 50% à la commande, solde à la livraison..."
              />
            </div>
            <div className="text-right shrink-0 min-w-[200px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Devis Estimé</p>
              <p className="text-5xl font-black">{total.toLocaleString()} <span className="text-lg opacity-40 font-mono">{merchant.currency}</span></p>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-8 py-4 bg-white border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer le Devis
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default QuoteModal;
