import React, { useState } from 'react';
import { PsdParseResult, PsdLayerItem } from '../services/PsdImportService';
import { Layers, Image as ImageIcon, CheckCircle2, Sparkles, X, FileImage, Cpu, Eye, EyeOff } from 'lucide-react';

interface PsdImportModalProps {
  psdData: PsdParseResult;
  onClose: () => void;
  onImportComposite: (compositeDataUrl: string, fileName: string) => void;
  onImportSelectedLayers: (selectedLayers: PsdLayerItem[]) => void;
}

export const PsdImportModal: React.FC<PsdImportModalProps> = ({
  psdData,
  onClose,
  onImportComposite,
  onImportSelectedLayers
}) => {
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(
    psdData.layers.map(l => l.id)
  );
  const [activeTab, setActiveTab] = useState<'composite' | 'layers'>('composite');

  const toggleLayer = (id: string) => {
    setSelectedLayerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedLayerIds(psdData.layers.map(l => l.id));
  };

  const deselectAll = () => {
    setSelectedLayerIds([]);
  };

  const handleImportSelected = () => {
    const selected = psdData.layers.filter(l => selectedLayerIds.includes(l.id));
    if (selected.length === 0) return;
    onImportSelectedLayers(selected);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-auto text-white text-left font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
              <FileImage className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-100">Analyse du Fichier Photoshop (PSD)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PSD STUDIO PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {psdData.fileName} • {psdData.width} × {psdData.height} px • {psdData.fileSizeKb} KB • {psdData.layers.length} calques détectés
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/60 flex items-center gap-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('composite')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'composite'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Globale Composite</span>
          </button>

          {psdData.layers.length > 0 && (
            <button
              onClick={() => setActiveTab('layers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'layers'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Calques Photoshop ({psdData.layers.length})</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'composite' ? (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/2 aspect-square bg-slate-950 rounded-2xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden relative shadow-inner">
                <img 
                  src={psdData.compositeDataUrl} 
                  alt="Aperçu PSD" 
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              <div className="w-full md:w-1/2 space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Vectorisation Directe</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    L'image complète du fichier PSD sera envoyée directement dans le studio de vectorisation HD pour être transformée en surfaces brodables (Satin / Tatami).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Largeur</span>
                    <span className="font-bold text-slate-200">{psdData.width} px</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hauteur</span>
                    <span className="font-bold text-slate-200">{psdData.height} px</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Taille Fichier</span>
                    <span className="font-bold text-slate-200">{psdData.fileSizeKb} KB</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nb Calques</span>
                    <span className="font-bold text-slate-200">{psdData.layers.length}</span>
                  </div>
                </div>

                <button
                  onClick={() => onImportComposite(psdData.compositeDataUrl, psdData.fileName)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Cpu className="w-5 h-5 text-violet-200" />
                  <span>Importer & Vectoriser l'Image PSD</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="text-xs font-semibold text-slate-300">
                  Sélectionnez les calques Photoshop à convertir en éléments de broderie :
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={selectAll}
                    className="text-[11px] text-cyan-400 hover:underline font-bold"
                  >
                    Tout sélectionner
                  </button>
                  <span className="text-slate-600">•</span>
                  <button 
                    onClick={deselectAll}
                    className="text-[11px] text-slate-400 hover:underline font-bold"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {psdData.layers.map((layer) => {
                  const isChecked = selectedLayerIds.includes(layer.id);
                  return (
                    <div
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isChecked 
                          ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-950/30' 
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]" title={layer.name}>
                          {layer.name}
                        </span>
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                        )}
                      </div>

                      <div className="h-28 bg-slate-900 rounded-xl border border-slate-850 p-1 flex items-center justify-center overflow-hidden">
                        <img 
                          src={layer.dataUrl} 
                          alt={layer.name} 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{layer.width} × {layer.height} px</span>
                        <span className="flex items-center gap-1">
                          {layer.visible ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-amber-400" />}
                          {Math.round((layer.opacity ?? 1) * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleImportSelected}
                  disabled={selectedLayerIds.length === 0}
                  className="py-3 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-cyan-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Importer les {selectedLayerIds.length} Calques Sélectionnés</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
