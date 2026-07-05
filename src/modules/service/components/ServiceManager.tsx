import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Edit2, X, Calendar, MapPin, User, Wrench, FileText } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant } from '../../../types';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { format, subDays, addDays, eachDayOfInterval, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const ServiceManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [interventionLimit, setInterventionLimit] = useState(10);

  const interventions = useLiveQuery(() => 
    db.interventions.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('interventionId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('interventionId');
    if (!id) return;
    
    try {
      const item = interventions.find((i:any) => i.id === id);
      if (item && item.status !== status) {
        await dbService.interventions.save({
          ...item,
          status
        });
        toast.success(`Statut mis à jour`);
      }
    } catch(err) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleGenerateInvoice = async (intervention: any) => {
    try {
      setSaving(true);
      const saleData = {
        merchantId: merchant.id,
        items: [{
          productId: `intervention_${intervention.id}`, // Placeholder or a generic service product
          name: intervention.title || intervention.serviceType,
          quantity: 1,
          price: intervention.price
        }],
        totalAmount: intervention.price,
        customerInfo: {
          name: intervention.customerName,
          phone: intervention.customerPhone,
          email: intervention.customerEmail
        },
        paymentMethod: 'invoice', // Marked as awaiting payment
        status: 'pending',
        date: new Date().toISOString()
      };
      await dbService.merchantSales.save(saleData);
      
      // Update the intervention to mark it as billed
      await dbService.interventions.save({
        ...intervention,
        billed: true
      });
      
      toast.success('Facture générée avec succès');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de la génération de la facture');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { id: 'pending', title: 'En Attente', color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' },
    { id: 'in-progress', title: 'En Cours', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
    { id: 'completed', title: 'Terminé', color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
    { id: 'cancelled', title: 'Annulé', color: 'bg-rose-500', bgColor: 'bg-rose-50', textColor: 'text-rose-600', borderColor: 'border-rose-200' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.interventions.save({
        ...currentIntervention,
        merchantId: merchant.id
      });
      toast.success('Intervention enregistrée');
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
          <h2 className="text-2xl font-bold text-ink">Gestion des Interventions</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-xs text-gray-400 font-mono uppercase tracking-widest pl-1">Total: {interventions.length.toString().padStart(3, '0')}</p>
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button 
                onClick={() => setViewMode('list')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}
              >
                Liste
              </button>
              <button 
                onClick={() => setViewMode('kanban')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}
              >
                Kanban
              </button>
              <button 
                onClick={() => setViewMode('calendar')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}
              >
                Calendrier
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            setCurrentIntervention({ 
              title: '',
              customerName: '', 
              customerPhone: '',
              customerEmail: '',
              serviceType: '', 
              description: '',
              status: 'pending', 
              priority: 'normal',
              date: new Date().toISOString().split('T')[0], 
              time: '09:00',
              address: '',
              assignedTo: '',
              price: 0 
            });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Intervention</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'En attente', value: interventions.filter((i:any) => i.status === 'pending').length, color: 'text-amber-600', bgColor: 'bg-amber-50' },
              { label: 'En cours', value: interventions.filter((i:any) => i.status === 'in-progress').length, color: 'text-blue-600', bgColor: 'bg-blue-50' },
              { label: 'CA Potentiel', value: interventions.filter((i:any) => i.status !== 'cancelled').reduce((acc: number, i:any) => acc + (Number(i.price) || 0), 0).toLocaleString() + ' ' + merchant.currency, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
              { label: 'Terminés', value: interventions.filter((i:any) => i.status === 'completed').length, color: 'text-purple-600', bgColor: 'bg-purple-50' }
            ].map((kpi, idx) => (
              <div key={idx} className={`${kpi.bgColor} p-4 rounded-2xl flex flex-col justify-center`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                <p className={`text-xl font-black ${kpi.color} mt-1`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {viewMode === 'list' ? (
            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Intervention / Client</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Planification</th>
                  <th className="px-8 py-5">Statut & Priorité</th>
                  <th className="px-8 py-5 text-right">Montant TTC</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interventions.slice(0, interventionLimit).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                          <Wrench className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="font-black text-ink text-sm leading-tight truncate" title={item.title || item.serviceType}>{item.title || item.serviceType || 'Intervention'}</span>
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5 truncate" title={item.customerName}>{item.customerName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        {item.customerPhone ? <span className="font-bold text-ink text-xs">{item.customerPhone}</span> : <span className="text-gray-300 text-xs">-</span>}
                        {item.customerEmail && <span className="text-[10px] text-gray-400 truncate">{item.customerEmail}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-black text-ink uppercase">{item.date}</span>
                        {item.time && <span className="text-[10px] text-gray-400 font-mono mt-0.5">{item.time}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          item.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          item.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {item.status === 'pending' ? 'EN ATTENTE' : item.status === 'in-progress' ? 'EN COURS' : item.status === 'cancelled' ? 'ANNULÉ' : 'TERMINÉ'}
                        </span>
                        {item.priority && item.priority !== 'normal' && (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                            item.priority === 'urgent' ? 'bg-rose-500 text-white' : 
                            item.priority === 'high' ? 'bg-orange-100 text-orange-600' : 
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {item.priority === 'urgent' ? 'URGENT' : item.priority === 'high' ? 'HAUTE PRIORITÉ' : 'BASSE'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-mono font-black text-ink text-sm">
                        {Number(item.price || 0).toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentIntervention(item); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {interventions.length > interventionLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setInterventionLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar">
          {columns.map((col) => {
            const columnItems = interventions.filter((item:any) => item.status === col.id);
            return (
              <div 
                key={col.id} 
                className={`flex-shrink-0 w-80 flex flex-col rounded-3xl ${col.bgColor} border ${col.borderColor} snap-start`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="p-5 border-b border-black/5 flex justify-between items-center bg-white/50 rounded-t-3xl backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.color}`} />
                    <h3 className={`font-black text-sm uppercase tracking-widest ${col.textColor}`}>{col.title}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded-lg border border-black/5 text-gray-500 shadow-sm">{columnItems.length}</span>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto space-y-4 min-h-[500px]">
                  {columnItems.map((item: any) => (
                    <div 
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="font-bold text-ink text-sm leading-tight truncate" title={item.title || item.serviceType}>{item.title || item.serviceType || 'Intervention'}</h4>
                          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1 truncate" title={item.customerName}>{item.customerName}</p>
                        </div>
                        <button 
                          onClick={() => { setCurrentIntervention(item); setIsEditing(true); }}
                          className="p-1.5 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                          <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                          <span className="font-mono">{item.date} {item.time && `- ${item.time}`}</span>
                        </div>
                        {item.address && (
                          <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-primary flex-shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                        )}
                        {item.assignedTo && (
                          <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                            <User className="w-3.5 h-3.5 mr-2 text-primary" />
                            <span className="truncate">{item.assignedTo}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex flex-col gap-1">
                          {item.priority && item.priority !== 'normal' ? (
                            <span className={`px-2 py-0.5 w-fit rounded text-[9px] font-bold uppercase tracking-widest ${
                              item.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                              item.priority === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {item.priority === 'urgent' ? 'URGENT' : item.priority === 'high' ? 'HAUTE PRIORITÉ' : 'BASSE'}
                            </span>
                          ) : (
                            <div />
                          )}
                          {item.billed && (
                             <span className="px-2 py-0.5 w-fit rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center">
                               <FileText className="w-2.5 h-2.5 mr-1" />
                               Facturé
                             </span>
                          )}
                        </div>
                        <span className="font-mono font-black text-ink text-sm">
                          {Number(item.price || 0).toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                  {columnItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-black/5 rounded-2xl">
                      <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Glisser ici</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg text-ink capitalize">{format(currentDate, 'MMMM yyyy', { locale: fr })}</h3>
            <div className="flex space-x-2">
              <button onClick={() => setCurrentDate(subDays(currentDate, 30))} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100">&lt;</button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100">Aujourd'hui</button>
              <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100">&gt;</button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="bg-gray-50 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
            
            {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) }).map((day, idx) => {
              const dayInterventions = interventions.filter((i:any) => i.date === format(day, 'yyyy-MM-dd'));
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={idx} className={`bg-white min-h-[120px] p-2 ${!isCurrentMonth ? 'opacity-50 bg-gray-50/50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayInterventions.map((item:any) => (
                      <div 
                        key={item.id} 
                        onClick={() => { setCurrentIntervention(item); setIsEditing(true); }}
                        className={`text-[9px] p-1.5 rounded-md cursor-pointer truncate font-bold ${
                          item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                          item.status === 'in-progress' ? 'bg-blue-50 text-blue-600' : 
                          item.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}
                        title={item.title || item.serviceType}
                      >
                        {item.time && <span className="mr-1 opacity-60">{item.time}</span>}
                        {item.title || item.serviceType}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
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
                <h3 className="text-xl font-bold text-ink">Détails de l'Intervention</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Configuration technique du service</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Titre de l'intervention</label>
                  <input type="text" required value={currentIntervention.title || ''} onChange={e => setCurrentIntervention({...currentIntervention, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="Ex: Maintenance annuelle climatisation" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de Service</label>
                  <input type="text" list="service-types" required value={currentIntervention.serviceType} onChange={e => setCurrentIntervention({...currentIntervention, serviceType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  <datalist id="service-types">
                    {Array.from(new Set(interventions.map((i:any) => i.serviceType).filter(Boolean))).map(type => (
                      <option key={type as string} value={type as string} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Assigné à (Intervenant)</label>
                  <input type="text" value={currentIntervention.assignedTo || ''} onChange={e => setCurrentIntervention({...currentIntervention, assignedTo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="Nom du technicien/employé" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Description / Notes techniques</label>
                  <textarea rows={3} value={currentIntervention.description || ''} onChange={e => setCurrentIntervention({...currentIntervention, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm resize-none" placeholder="Détails de l'intervention, pièces requises, etc." />
                </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-ink mb-4">Informations Client</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Client</label>
                    <input type="text" required value={currentIntervention.customerName} onChange={e => setCurrentIntervention({...currentIntervention, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone Client</label>
                    <input type="tel" value={currentIntervention.customerPhone || ''} onChange={e => setCurrentIntervention({...currentIntervention, customerPhone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email Client</label>
                    <input type="email" value={currentIntervention.customerEmail || ''} onChange={e => setCurrentIntervention({...currentIntervention, customerEmail: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Lieu d'intervention</label>
                    <input type="text" value={currentIntervention.address || ''} onChange={e => setCurrentIntervention({...currentIntervention, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white" placeholder="Adresse complète" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'intervention</label>
                  <input type="date" required value={currentIntervention.date} onChange={e => setCurrentIntervention({...currentIntervention, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Heure prévue</label>
                  <input type="time" value={currentIntervention.time || ''} onChange={e => setCurrentIntervention({...currentIntervention, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Montant de la prestation</label>
                  <div className="relative">
                    <input type="text" required value={currentIntervention.price === 0 ? '' : currentIntervention.price} onChange={e => setCurrentIntervention({...currentIntervention, price: Number(e.target.value.replace(/\D/g, ''))})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut de l'intervention</label>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setCurrentIntervention({...currentIntervention, status})}
                        className={`flex-1 min-w-[100px] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          currentIntervention.status === status 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {status === 'pending' ? 'En attente' : status === 'in-progress' ? 'En cours' : status === 'completed' ? 'Terminé' : 'Annulé'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Priorité</label>
                  <div className="flex gap-2">
                    {['low', 'normal', 'high', 'urgent'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setCurrentIntervention({...currentIntervention, priority})}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          currentIntervention.priority === priority 
                            ? (priority === 'urgent' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : priority === 'high' ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-ink text-white border-ink shadow-lg shadow-black/20')
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {priority === 'low' ? 'Basse' : priority === 'normal' ? 'Normale' : priority === 'high' ? 'Haute' : 'Urgente'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              
              {currentIntervention.id && currentIntervention.status === 'completed' && !currentIntervention.billed && (
                <button type="button" onClick={() => handleGenerateInvoice(currentIntervention)} disabled={saving} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Facturer
                </button>
              )}

              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default ServiceManager;
