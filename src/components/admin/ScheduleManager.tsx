import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export const ScheduleManager = ({ merchantId, classId }: { merchantId: string, classId: string }) => {
  const [newPeriod, setNewPeriod] = useState({ day: 'Lundi', startTime: '08:00', endTime: '09:00', subject: '' });
  
  const schedules = useLiveQuery(() => 
    db.schedule?.where('merchantId').equals(merchantId).and(s => s.classId === classId).toArray()
  , [merchantId, classId]) || [];

  const subjects = useLiveQuery(() =>
    db.subjects?.where('merchantId').equals(merchantId).toArray()
  , [merchantId]) || [];

  const handleAdd = async () => {
    if (!newPeriod.subject) { toast.error("Matière requise"); return; }
    await db.schedule.put({
      id: uuidv4(),
      merchantId,
      classId,
      ...newPeriod,
      updatedAt: new Date().toISOString()
    });
    toast.success("Horaire ajouté");
    setNewPeriod(prev => ({ ...prev, subject: '' }));
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-8 space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Emploi du Temps</h3>
      
      <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl">
        <select value={newPeriod.day} onChange={e => setNewPeriod({...newPeriod, day: e.target.value})} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="time" value={newPeriod.startTime} onChange={e => setNewPeriod({...newPeriod, startTime: e.target.value})} className="px-4 py-2 rounded-xl border border-gray-200" />
        <input type="time" value={newPeriod.endTime} onChange={e => setNewPeriod({...newPeriod, endTime: e.target.value})} className="px-4 py-2 rounded-xl border border-gray-200" />
        <select value={newPeriod.subject} onChange={e => setNewPeriod({...newPeriod, subject: e.target.value})} className="px-4 py-2 rounded-xl border border-gray-200 flex-1">
          <option value="">Sélectionner une Matière</option>
          {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <button onClick={handleAdd} className="bg-primary text-white p-2 rounded-xl"><Plus /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => (
          <div key={day} className="border border-gray-100 rounded-2xl p-4">
            <h4 className="font-bold text-gray-700 mb-3">{day}</h4>
            <div className="space-y-2">
              {schedules.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(s => (
                <div key={s.id} className="flex justify-between items-center text-xs bg-indigo-50/50 p-2 rounded-lg">
                  <span>{s.startTime} - {s.endTime} : {s.subject}</span>
                  <button onClick={() => db.schedule.delete(s.id)} className="text-rose-500"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
