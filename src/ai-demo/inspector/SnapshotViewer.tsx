// src/ai-demo/inspector/SnapshotViewer.tsx
import React, { useState } from 'react';
import { SaiVisualSnapshot } from '../types';
import { Image as ImageIcon, Maximize2, Shield, Eye, Layers } from 'lucide-react';

interface SnapshotViewerProps {
  snapshots: SaiVisualSnapshot[];
}

export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ snapshots }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const activeSnap = snapshots[selectedIndex];

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
        <ImageIcon className="h-10 w-10 text-slate-600 mx-auto" />
        <p className="text-sm font-medium text-slate-400">Aucune capture visuelle (snapshot) enregistrée.</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Le Visual Capture Engine associe automatiquement une capture fidèle de l'interface utilisateur à chaque étape clé du Scénario Applicatif Intelligent.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Thumbnail Gallery List */}
      <div className="lg:col-span-1 space-y-2 max-h-[450px] overflow-y-auto pr-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
          <span>Captures ({snapshots.length})</span>
          <span className="text-[10px] text-blue-400 font-mono">Visual Capture Engine</span>
        </div>
        {snapshots.map((snap, idx) => (
          <button
            key={snap.id || idx}
            onClick={() => setSelectedIndex(idx)}
            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
              selectedIndex === idx
                ? 'bg-blue-950/60 border-blue-500/80 shadow-md ring-1 ring-blue-500/50'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div className="h-12 w-16 bg-slate-950 rounded border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
              {snap.dataUrl ? (
                <img src={snap.dataUrl} alt={`Snap ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-slate-600" />
              )}
              <span className="absolute bottom-0.5 right-0.5 bg-slate-900/90 text-slate-300 text-[9px] px-1 rounded font-mono">
                #{idx + 1}
              </span>
            </div>

            <div className="flex-1 min-w-0 text-xs space-y-0.5">
              <div className="font-semibold text-slate-200 truncate">Snapshot #{idx + 1}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {(snap.timestamp / 1000).toFixed(2)}s • {snap.width}×{snap.height}
              </div>
              {snap.privacyMasksApplied && (
                <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 font-medium">
                  <Shield className="h-2.5 w-2.5" /> Masque appliqué
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Main Snapshot Preview Canvas */}
      <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <span className="font-bold text-slate-200">Aperçu Haute Définition</span>
            <span className="text-slate-500 font-mono">({activeSnap.width}×{activeSnap.height}px)</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            Fidélité DOM 100%
          </span>
        </div>

        <div className="relative aspect-video bg-slate-900/80 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
          {activeSnap.dataUrl ? (
            <img src={activeSnap.dataUrl} alt="Real Screenshot" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-center p-6 space-y-2 text-slate-500">
              <ImageIcon className="h-12 w-12 mx-auto text-slate-600" />
              <p className="text-xs">Rendu SVG/DOM synthétique</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 text-xs grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-400">
          <div>
            <span className="text-slate-500">Horodatage :</span> {(activeSnap.timestamp / 1000).toFixed(2)}s
          </div>
          <div>
            <span className="text-slate-500">Confidentialité :</span>{' '}
            {activeSnap.privacyMasksApplied ? 'Anonymisé' : 'Standard'}
          </div>
          <div>
            <span className="text-slate-500">ID Capture :</span>{' '}
            <span className="font-mono text-[10px] text-slate-300">{activeSnap.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
