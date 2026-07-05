import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Edit2, Trash2, X, Mail, Phone, Truck, User } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant, MerchantSupplier } from '../../../types';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';

const SupplierManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<MerchantSupplier> | null>(null);
  const [saving, setSaving] = useState(false);

  const suppliers = useLiveQuery(() => 
    db.suppliers.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier?.name) return;
    setSaving(true);
    try {
      await dbService.merchantSuppliers.save({
        ...currentSupplier,
        merchantId: merchant.id
      });
      triggerAcomAlert('Succès', currentSupplier.id ? 'Fournisseur mis à jour' : 'Fournisseur ajouté', 'success', 'SYSTÈME');
      setIsEditing(false);
      setCurrentSupplier(null);
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de l\'enregistrement', 'error', 'ALERTE');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce fournisseur ?')) return;
    try {
      await dbService.merchantSuppliers.delete(id);
      triggerAcomAlert('Succès', 'Fournisseur supprimé', 'success', 'SYSTÈME');
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de la suppression', 'error', 'ALERTE');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Partenaires Logistiques</h2>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Fournisseurs actifs: {suppliers.length.toString().padStart(2, '0')}</p>
        </div>
        <button
          onClick={() => {
            setCurrentSupplier({ name: '', contactName: '', email: '', phone: '', category: 'Général' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setCurrentSupplier(supplier); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl border border-transparent hover:border-rose-200 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-ink mb-1 leading-tight">{supplier.name}</h3>
              <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mb-6">{supplier.category}</p>
              
              <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <User className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="font-black text-ink">{supplier.contactName || '---'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <Phone className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="font-mono font-bold">{supplier.phone || '---'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <Mail className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="truncate font-medium text-gray-500">{supplier.email || '---'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">{currentSupplier?.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des partenaires logistiques</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom de l'entreprise</label>
                    <input type="text" required value={currentSupplier?.name || ''} onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Personne de contact</label>
                    <input type="text" value={currentSupplier?.contactName || ''} onChange={e => setCurrentSupplier({...currentSupplier, contactName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                    <input type="tel" value={currentSupplier?.phone || ''} onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                    <input type="email" value={currentSupplier?.email || ''} onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                    <input type="text" value={currentSupplier?.category || ''} onChange={e => setCurrentSupplier({...currentSupplier, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le fournisseur'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default SupplierManager;
