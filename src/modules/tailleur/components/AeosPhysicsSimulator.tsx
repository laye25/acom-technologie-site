import React, { useState } from 'react';
import { Activity, Percent, Layers, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import { motion } from 'motion/react';

export const AeosPhysicsSimulator: React.FC<{ selectedFabric?: string }> = ({ selectedFabric }) => {
  const [threadTension, setThreadTension] = useState<number>(3.5); // grams tension
  
  // Mettre à jour les paramètres physiques par défaut selon le tissu sélectionné
  React.useEffect(() => {
    if (selectedFabric === 'denim') {
      setThreadTension(4.5);
      setRetractionPercent(1.5);
      setElasticity(1.0);
    } else if (selectedFabric === 'silk') {
      setThreadTension(2.5);
      setRetractionPercent(4.0);
      setElasticity(1.5);
    } else if (selectedFabric === 'leather') {
      setThreadTension(5.0);
      setRetractionPercent(1.0);
      setElasticity(1.0);
    } else if (selectedFabric === 'cotton') {
      setThreadTension(3.5);
      setRetractionPercent(2.0);
      setElasticity(1.2);
    }
  }, [selectedFabric]);
  const [retractionPercent, setRetractionPercent] = useState<number>(4.2); // retraction rate
  const [foamThickness, setFoamThickness] = useState<number>(0.0); // 3D puff embroidery foam thickness in mm
  const [elasticity, setElasticity] = useState<number>(1.5); // fabric elasticity

  // Generate simulated dynamic physical tension wave values
  const pointsCount = 40;
  const linePoints = Array.from({ length: pointsCount }).map((_, i) => {
    // Generate organic tension spike simulation
    const x = (i / (pointsCount - 1)) * 340 + 20;
    const baseSine = Math.sin((i / 4) + (threadTension * 0.8));
    const noise = Math.cos(i / 1.5) * 0.2;
    const peak = (i > 15 && i < 22) ? (threadTension * 0.5) : 0; // Simulate jump knot tension spike
    const y = 100 - (baseSine * 15 + noise * 5 + peak * 12 + 40);
    return { x, y };
  }).map(p => `${p.x},${p.y}`).join(' ');

  const calculatedPullCompensation = (elasticity * 0.12 + retractionPercent * 0.05 + foamThickness * 0.1).toFixed(2);

  return (
    <div id="aeos-physics-simulator-container" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Physics Engine (Simulateur Physique Textiles & Tensions)</h4>
            <p className="text-[10px] text-gray-400">Calcul du comportement mécanique du fil, du tissu et de la compensation d'étirement</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono font-bold">
          DYNAMIQUE TEXTILE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sliders input */}
        <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
          <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Paramètres de Contrainte Physique</span>
          
          <div className="space-y-3">
            {/* Thread tension */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Tension de fil recommandée</span>
                <span className="font-mono text-emerald-400">{threadTension.toFixed(1)} g</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="8.0" 
                step="0.5"
                value={threadTension} 
                onChange={(e) => setThreadTension(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Fabric retraction */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Retrait du tissu de fond</span>
                <span className="font-mono text-emerald-400">{retractionPercent.toFixed(1)} %</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="10.0" 
                step="0.5"
                value={retractionPercent} 
                onChange={(e) => setRetractionPercent(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Foam thickness (3D puff) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Épaisseur mousse 3D Puff</span>
                <span className="font-mono text-emerald-400">{foamThickness.toFixed(1)} mm</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="4.0" 
                step="0.5"
                value={foamThickness} 
                onChange={(e) => setFoamThickness(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Fabric elasticity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Élasticité de la matière</span>
                <span className="font-mono text-emerald-400">{elasticity.toFixed(1)}x (Stretch)</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="3.0" 
                step="0.1"
                value={elasticity} 
                onChange={(e) => setElasticity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Wave Chart */}
        <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-mono font-bold uppercase">Oscilloscope de Tension de Fil (Grams)</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-mono">
              Live Feed
            </span>
          </div>

          <div className="h-[120px] w-full relative mt-2">
            <svg className="w-full h-full" viewBox="0 0 380 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <g className="stroke-slate-800/60" strokeDasharray="3 3">
                <line x1="0" y1="30" x2="380" y2="30" />
                <line x1="0" y1="60" x2="380" y2="60" />
                <line x1="0" y1="90" x2="380" y2="90" />
              </g>
              <polyline 
                fill="url(#chartGrad)" 
                stroke="none" 
                points={`20,120 ${linePoints} 360,120`}
              />
              <polyline 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                points={linePoints}
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-slate-900 pt-2 mt-2">
            <span>Minimum: {(threadTension * 0.65).toFixed(1)}g</span>
            <span className="text-emerald-400 font-bold">Moyenne: {threadTension.toFixed(1)}g</span>
            <span>Maximum: {(threadTension * 1.55).toFixed(1)}g</span>
          </div>
        </div>

        {/* Calculated Results */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="space-y-3.5">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Résultats Analytiques AEOS</span>

            <div className="space-y-2">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] uppercase text-gray-500 font-bold block">Pull Compensation recommandée</span>
                <p className="text-xl font-mono font-bold text-emerald-400 mt-1">+{calculatedPullCompensation} mm</p>
                <span className="text-[8px] text-gray-400 block mt-1">
                  Évite les espaces blancs entre les contours satinés et le fond
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] uppercase text-gray-500 font-bold block">Effet Bulle 3D Puff</span>
                <p className="text-xs font-bold text-gray-300 mt-1">
                  {foamThickness > 0 ? `Génération automatique de points d'obturation à 90°` : 'Aucun effet 3D Puff configuré.'}
                </p>
                {foamThickness > 0 && (
                  <span className="text-[8px] text-violet-400 font-semibold block mt-0.5">
                    Coupe-mousse actif aux extrémités du lettrage
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-[9px] text-gray-500 mt-3 flex items-start gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Le retrait du tissu se produit lors de l'application de points de forte densité. Augmenter le pull compensation sur les tissus stretchs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
