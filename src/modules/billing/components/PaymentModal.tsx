import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { billingService } from '../../../services/billingService';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant, MerchantSale } from '../../../types';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, merchant, sale }: { isOpen: boolean, onClose: () => void, merchant: Merchant, sale: MerchantSale | null }) => {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'cash' | 'card' | 'mobile_money' | 'transfer'>('cash');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (sale) {
      setAmount(sale.balance || 0);
    }
  }, [sale, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale || amount <= 0) return;

    if (amount > (sale.balance || sale.totalAmount)) {
      toast.error('Le montant dépasse le solde restant');
      return;
    }

    setIsSaving(true);
    try {
      await billingService.recordPayment(sale.id, amount, method);
      toast.success('Paiement enregistré');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-ink/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden">
        <div className="mb-6">
          <h3 className="text-xl font-black text-ink">Enregistrer un Paiement</h3>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mt-1">Facture #INV-{sale.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex justify-between items-center border border-black/5">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</p>
            <p className="font-bold text-ink">{sale.customerName || 'Client POS'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solde</p>
            <p className="text-xl font-black text-primary">{(sale.balance !== undefined ? sale.balance : sale.totalAmount).toLocaleString()} <span className="text-[10px] opacity-40 font-mono">{merchant.currency}</span></p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Montant à encaisser</label>
            <input 
              type="number" 
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              required
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-black text-lg outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mode de règlement</label>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'card', 'mobile_money', 'transfer'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m as any)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${method === m ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-gray-400 border-black/5 hover:border-primary/20'}`}
                >
                  {m === 'mobile_money' ? 'MOBILE' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-ink transition-all">Annuler</button>
            <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-ink text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmer l\'encaissement'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
export default PaymentModal;
