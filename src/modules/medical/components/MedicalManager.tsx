import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant } from '../../../types';
import { motion } from 'motion/react';
import { Plus, Loader2, Phone, Mail, Edit2, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const MedicalManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [patientLimit, setPatientLimit] = useState(10);

  const patients = useLiveQuery(() => 
    db.patients.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.patients.save({
        ...currentPatient,
        merchantId: merchant.id
      });
      toast.success('Patient enregistré');
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
          <h2 className="text-2xl font-bold text-ink">Gestion des Patients</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Dossiers actifs: {patients.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentPatient({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', bloodType: '', phone: '', email: '', address: '', allergies: '', medicalHistory: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Patient</span>
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
                  <th className="px-8 py-5">Patient</th>
                  <th className="px-8 py-5">Infos Vitales</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Dernière Visite</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.slice(0, patientLimit).map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 font-black text-sm border border-rose-100 group-hover:scale-110 transition-transform">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm leading-tight">{p.firstName} {p.lastName}</span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">REF: {p.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-ink uppercase tracking-tighter">{p.gender === 'M' ? 'MASCULIN' : 'FÉMININ'}</span>
                          <span className="text-[10px] font-mono text-gray-400 font-bold">{p.dateOfBirth || '---'}</span>
                        </div>
                        {p.bloodType && (
                          <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg shadow-sm shadow-rose-200">
                            {p.bloodType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1">
                        <span className="flex items-center text-[10px] font-black text-ink"><Phone className="w-3 h-3 mr-1.5 opacity-40 text-primary" /> {p.phone || '---'}</span>
                        <span className="flex items-center text-[10px] font-medium text-gray-500"><Mail className="w-3 h-3 mr-1.5 opacity-40" /> {p.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-bold text-gray-400">
                        {p.updatedAt ? format(new Date(p.updatedAt), 'dd/MM/yyyy') : '---'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentPatient(p); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length > patientLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setPatientLimit(prev => prev + 10)}
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
                <h3 className="text-xl font-bold text-ink">Dossier Médical Patient</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Confidentialité & Suivi médical</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentPatient.firstName} onChange={e => setCurrentPatient({...currentPatient, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentPatient.lastName} onChange={e => setCurrentPatient({...currentPatient, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date de Naissance</label>
                  <input type="date" required value={currentPatient.dateOfBirth} onChange={e => setCurrentPatient({...currentPatient, dateOfBirth: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Sexe</label>
                  <select value={currentPatient.gender} onChange={e => setCurrentPatient({...currentPatient, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="O">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Groupe Sanguin</label>
                  <select value={currentPatient.bloodType} onChange={e => setCurrentPatient({...currentPatient, bloodType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="">Inconnu</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                  <input type="text" required value={currentPatient.phone} onChange={e => setCurrentPatient({...currentPatient, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={currentPatient.email} onChange={e => setCurrentPatient({...currentPatient, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Allergies connues</label>
                <textarea value={currentPatient.allergies} onChange={e => setCurrentPatient({...currentPatient, allergies: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-rose-50/30 text-rose-700 text-sm min-h-[60px]" placeholder="Liste des allergies..." />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Antécédents Médicaux</label>
                <textarea value={currentPatient.medicalHistory} onChange={e => setCurrentPatient({...currentPatient, medicalHistory: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm min-h-[100px]" placeholder="Historique des pathologies, chirurgies..." />
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le dossier'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
