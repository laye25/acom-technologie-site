// src/ai-demo/inspector/EventViewer.tsx
import React, { useState } from 'react';
import { SaiInteractionEvent, SaiPrivacyLevel } from '../types';
import { Filter, Search, Shield, Target, Clock, Activity, CheckCircle } from 'lucide-react';

interface EventViewerProps {
  events: SaiInteractionEvent[];
  privacyLevel: SaiPrivacyLevel;
}

export const EventViewer: React.FC<EventViewerProps> = ({ events, privacyLevel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.targetId && evt.targetId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || evt.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const eventTypes = Array.from(new Set(events.map((e) => e.type)));

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer événements (page, action...)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
              typeFilter === 'ALL' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tous ({events.length})
          </button>
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === type ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / List */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Aucun événement ne correspond aux critères de recherche.
            </div>
          ) : (
            filteredEvents.map((evt, idx) => {
              const isConfidential = evt.privacyLevel === 'CONFIDENTIAL';
              return (
                <div key={evt.id || idx} className="p-3 hover:bg-slate-800/40 transition-colors flex items-start gap-3 text-xs">
                  <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400 font-mono font-bold text-[11px] shrink-0">
                    #{idx + 1}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{evt.action}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
                          {evt.type}
                        </span>
                        {isConfidential && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/50">
                            <Shield className="h-2.5 w-2.5" /> Masqué
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(evt.timestamp / 1000).toFixed(2)}s
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>
                        <span className="text-slate-500">Module:</span> {evt.module}
                      </div>
                      <div>
                        <span className="text-slate-500">Page:</span> {evt.page}
                      </div>
                      <div>
                        <span className="text-slate-500">Composant:</span> {evt.component}
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500">Target ID:</span> {evt.targetId || 'N/A'}
                      </div>
                    </div>

                    {evt.valueMasked && (
                      <div className="mt-1 bg-slate-950 px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 border border-slate-800/80 flex items-center justify-between">
                        <span>
                          Valeur:{' '}
                          {privacyLevel === 'PUBLIC'
                            ? '••••••••'
                            : evt.valueMasked}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          Isolation Privacy
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
