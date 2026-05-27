import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ScheduleManager } from './ScheduleManager';
import { BookOpen } from 'lucide-react';

export const SchoolScheduleManager = ({ merchantId }: { merchantId: string }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const classes = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchantId).toArray()
  , [merchantId]) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Gestion des Emplois du Temps</h3>
        <select 
          value={selectedClassId} 
          onChange={e => setSelectedClassId(e.target.value)} 
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold"
        >
          <option value="">Sélectionner une classe</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      
      {selectedClassId && (
        <ScheduleManager merchantId={merchantId} classId={selectedClassId} />
      )}
    </div>
  );
};
