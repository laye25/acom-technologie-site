import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant } from '../../../types';
import { motion } from 'motion/react';
import { Plus, Loader2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const AppointmentManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [appointmentLimit, setAppointmentLimit] = useState(10);

  const appointments = useLiveQuery(() => 
    db.appointments.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.appointments.save({
        ...currentAppointment,
        merchantId: merchant.id
      });
      toast.success('Rendez-vous enregistré');
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
          <h2 className="text-2xl font-bold text-ink">Gestion des Rendez-vous</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Total: {appointments.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentAppointment({ patientName: '', doctorName: '', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'scheduled', type: 'consultation' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Rendez-vous</span>
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
                  <th className="px-8 py-5">Patient / Client</th>
                  <th className="px-8 py-5">Praticien / Ressource</th>
                  <th className="px-8 py-5">Date & Heure</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.slice(0, appointmentLimit).map((app: any) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-ink text-sm leading-tight">{app.patientName}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">ID: {app.id?.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                          {app.doctorName?.[0]}
                        </div>
                        <span className="text-sm font-black text-ink">{app.doctorName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-black text-ink uppercase">{app.date}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">à {app.time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-200">
                        {app.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        app.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {app.status === 'scheduled' ? 'PROGRAMMÉ' : app.status === 'completed' ? 'TERMINÉ' : 'ANNULÉ'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentAppointment(app); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length > appointmentLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setAppointmentLimit(prev => prev + 10)}
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
                <h3 className="text-xl font-bold text-ink">Détails du Rendez-vous</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Planification & Ressources</p>
              </div>
              <button type="button" onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Patient / Client</label>
                  <input type="text" required value={currentAppointment.patientName} onChange={e => setCurrentAppointment({...currentAppointment, patientName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Praticien / Ressource</label>
                  <input type="text" required value={currentAppointment.doctorName} onChange={e => setCurrentAppointment({...currentAppointment, doctorName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date du rendez-vous</label>
                  <input type="date" required value={currentAppointment.date} onChange={e => setCurrentAppointment({...currentAppointment, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Heure</label>
                  <input type="time" required value={currentAppointment.time} onChange={e => setCurrentAppointment({...currentAppointment, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de prestation</label>
                  <input type="text" required value={currentAppointment.type} onChange={e => setCurrentAppointment({...currentAppointment, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="ex: Consultation" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</label>
                  <select value={currentAppointment.status} onChange={e => setCurrentAppointment({...currentAppointment, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="scheduled">Programmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                    <option value="no-show">Absent</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors border-none">Annuler</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le rendez-vous'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
