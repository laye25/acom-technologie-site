import React, { useState } from 'react';
import { Eye, ShieldAlert, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export const AeosVisionInspector: React.FC = () => {
  const [denoiseThreshold, setDenoiseThreshold] = useState<number>(1.2);
  const [contrastRatio, setContrastRatio] = useState<number>(1.8);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    'Module de vision initialisé.',
    'Suppresseur de fond en attente...',
    'Détecteur de contours vectoriels en attente...'
  ]);

  const colors = [
    { name: 'Bleu Royal', hex: '#1E3A8A', coverage: '42%' },
    { name: 'Or Doré', hex: '#FFD700', coverage: '28%' },
    { name: 'Rouge Éclatant', hex: '#DC2626', coverage: '18%' },
    { name: 'Vert Émeraude', hex: '#059669', coverage: '12%' },
  ];

  const handleRecalculateVision = () => {
    setIsCleaning(true);
    setLogs(prev => ['Recalcul des contrastes (ImageCleaner)...', ...prev]);
    setTimeout(() => {
      setLogs(prev => [
        `Contrastes ajustés à ${contrastRatio}x. Bruit réduit de ${denoiseThreshold}px.`,
        'Segmentation des 4 teintes Madeira polyneon terminée.',
        'Contours vectorisés par spline de Bézier.',
        ...prev
      ]);
      setIsCleaning(false);
    }, 1200);
  };

  return (
    <div id="aeos-vision-inspector-container" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Vision & OCR Engine (Moteur de Vision par Ordinateur)</h4>
            <p className="text-[10px] text-gray-400">Segmentation de couleur, détection d'objets, suppression du fond et vectorisation automatique</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-mono font-bold">
          VISION ENGINE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Color segmenter and detector list */}
        <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Segmentation des Couleurs</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md font-mono">
              Madeira Certifiée
            </span>
          </div>

          <div className="space-y-2.5">
            {colors.map((color, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-850">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: color.hex }} />
                  <span className="text-xs font-bold text-white">{color.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-gray-300">{color.coverage}</span>
                  <span className="text-[8px] text-gray-500 block">Présence surfacique</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vision preprocessing thresholds */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Seuils de Prétraitement d'Image</span>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Réduction de Bruit (Denoise)</span>
                <span className="font-mono text-indigo-400">{denoiseThreshold.toFixed(1)} px</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="4.0" 
                step="0.1"
                value={denoiseThreshold} 
                onChange={(e) => setDenoiseThreshold(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Seuil de Contraste Local</span>
                <span className="font-mono text-indigo-400">{contrastRatio.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="3.0" 
                step="0.1"
                value={contrastRatio} 
                onChange={(e) => setContrastRatio(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleRecalculateVision}
            disabled={isCleaning}
            id="vision-recalculate-btn"
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-4"
          >
            {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
            <span>Nettoyer & Extraire Couches</span>
          </button>
        </div>

        {/* Live Image Cleaner Diagnostics */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Console de Vision & OCR</span>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 h-[110px] overflow-y-auto font-mono text-[9px] text-indigo-400 space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="truncate">&gt; {log}</div>
              ))}
            </div>
          </div>

          <div className="text-[9px] text-gray-500 mt-3 flex items-start gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Le débruitage supprime les artéfacts de compression JPG afin de garantir une vectorisation Bézier lisse et continue sans crénelage.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
