import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, MapPin, Search, Edit2, Trash2, X, AlertTriangle, Truck, Wrench, Calendar } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant } from '../../../types';

const FleetManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [vehicleLimit, setVehicleLimit] = useState(10);

  const vehicles = useLiveQuery(() => 
    db.vehicles.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.vehicles.save({
        ...currentVehicle,
        merchantId: merchant.id
      });
      toast.success('Véhicule enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion de la Flotte</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Véhicules: {vehicles.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentVehicle({ plateNumber: '', model: '', type: 'car', status: 'active', lastMaintenance: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Véhicule</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Véhicule / Plaque</th>
                  <th className="px-8 py-5">Modèle / Type</th>
                  <th className="px-8 py-5">Dernier Entretien</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.slice(0, vehicleLimit).map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-ink bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 inline-block w-fit text-sm shadow-sm tracking-widest">
                          {v.plateNumber}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-2">ID: {v.id?.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ink leading-tight">{v.model}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mt-1">{v.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-gray-400 uppercase">{v.lastMaintenance || '---'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        v.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        v.status === 'maintenance' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {v.status === 'active' ? 'DISPONIBLE' : v.status === 'maintenance' ? 'MAINTENANCE' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentVehicle(v); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vehicles.length > vehicleLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setVehicleLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Fiche Véhicule</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion de la flotte logistique</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Immatriculation</label>
                  <input type="text" required value={currentVehicle.plateNumber} onChange={e => setCurrentVehicle({...currentVehicle, plateNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" placeholder="AA-000-AA" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Modèle / Marque</label>
                  <input type="text" required value={currentVehicle.model} onChange={e => setCurrentVehicle({...currentVehicle, model: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de véhicule</label>
                  <select value={currentVehicle.type} onChange={e => setCurrentVehicle({...currentVehicle, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="car">Voiture</option>
                    <option value="truck">Camion</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date du dernier entretien</label>
                  <input type="date" required value={currentVehicle.lastMaintenance} onChange={e => setCurrentVehicle({...currentVehicle, lastMaintenance: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut opérationnel</label>
                <div className="flex gap-4">
                  {['active', 'maintenance', 'inactive'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentVehicle({...currentVehicle, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentVehicle.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Actif' : status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le véhicule'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default FleetManager;
