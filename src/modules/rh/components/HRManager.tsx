import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, Mail, Phone, Edit2, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant } from '../../../types';

const HRManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(10);

  const employees = useLiveQuery(() => 
    db.employees.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.employees.save({
        ...currentEmployee,
        merchantId: merchant.id
      });
      toast.success('Employé enregistré');
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
          <h2 className="text-2xl font-bold text-ink">Gestion du Personnel</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Effectif total: {employees.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentEmployee({ firstName: '', lastName: '', position: '', department: '', salary: 0, hireDate: new Date().toISOString().split('T')[0], status: 'active', email: '', phone: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Employé</span>
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
                  <th className="px-8 py-5">Collaborateur</th>
                  <th className="px-8 py-5">Poste / Dept</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Embauche</th>
                  <th className="px-8 py-5 text-right">Salaire Mensuel</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.slice(0, employeeLimit).map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:scale-110 transition-transform">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-ink text-base leading-tight">{emp.firstName} {emp.lastName}</span>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${emp.status === 'active' ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {emp.status === 'active' ? 'EN POSTE' : emp.status === 'on_leave' ? 'EN CONGÉ' : 'SORTI'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ink leading-tight">{emp.position}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mt-1">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1.5">
                        <span className="flex items-center text-[10px] font-black text-ink tracking-tight"><Mail className="w-3 h-3 mr-2 opacity-40 text-primary" /> {emp.email || '---'}</span>
                        <span className="flex items-center text-[10px] font-black text-ink tracking-tight"><Phone className="w-3 h-3 mr-2 opacity-40 text-primary" /> {emp.phone || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-gray-400 uppercase">{emp.hireDate}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-mono font-black text-ink text-sm">
                        {emp.salary.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentEmployee(emp); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length > employeeLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setEmployeeLimit(prev => prev + 10)}
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
                <h3 className="text-xl font-bold text-ink">Fiche Collaborateur</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des ressources humaines</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentEmployee.firstName} onChange={e => setCurrentEmployee({...currentEmployee, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentEmployee.lastName} onChange={e => setCurrentEmployee({...currentEmployee, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email Professionnel</label>
                  <input type="email" value={currentEmployee.email} onChange={e => setCurrentEmployee({...currentEmployee, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="email@entreprise.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                  <input type="text" value={currentEmployee.phone} onChange={e => setCurrentEmployee({...currentEmployee, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="+221 ..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Poste / Fonction</label>
                  <input type="text" required value={currentEmployee.position} onChange={e => setCurrentEmployee({...currentEmployee, position: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Département</label>
                  <select value={currentEmployee.department} onChange={e => setCurrentEmployee({...currentEmployee, department: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="">Sélectionner...</option>
                    <option value="Direction">Direction</option>
                    <option value="Ventes">Ventes</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Technique">Technique</option>
                    <option value="RH">RH</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Salaire Mensuel</label>
                  <div className="relative">
                    <input type="number" required value={currentEmployee.salary} onChange={e => setCurrentEmployee({...currentEmployee, salary: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'embauche</label>
                  <input type="date" required value={currentEmployee.hireDate} onChange={e => setCurrentEmployee({...currentEmployee, hireDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</label>
                <div className="flex gap-4">
                  {['active', 'on_leave', 'terminated'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentEmployee({...currentEmployee, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentEmployee.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Actif' : status === 'on_leave' ? 'Congé' : 'Sorti'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le collaborateur'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default HRManager;
