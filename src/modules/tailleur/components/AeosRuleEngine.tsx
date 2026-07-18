import React, { useState } from 'react';
import { Sliders, CheckCircle2, Info, RefreshCw, GitCommit, Settings, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  isActive: boolean;
  category: 'stitch' | 'density' | 'fabric' | 'underlay';
}

export const AeosRuleEngine: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([
    { id: 'r1', name: 'Règle Satin Radiale', condition: 'Largeur entre 2.0mm et 8.0mm', action: 'Générer point Satin radial avec angle de pénétration auto', isActive: true, category: 'stitch' },
    { id: 'r2', name: 'Règle Tatami Structuré', condition: 'Largeur supérieure à 8.0mm', action: 'Générer point Tatami (Woven Fill) d\'angle stabilisé', isActive: true, category: 'stitch' },
    { id: 'r3', name: 'Règle Running Contour', condition: 'Largeur inférieure à 2.0mm', action: 'Générer point de contour Running simple ou triple', isActive: true, category: 'stitch' },
    { id: 'r4', name: 'Compensation Cuir & Simili', condition: 'Type Tissu === "Cuir"', action: 'Compensation d\'étirement à +0.4mm, désactiver sous-couche', isActive: true, category: 'fabric' },
    { id: 'r5', name: 'Densité Protection Soie', condition: 'Type Tissu === "Soie"', action: 'Multiplier la densité par 1.15x pour éviter la déchirure', isActive: true, category: 'density' },
    { id: 'r6', name: 'Stabilisation Double Fond', condition: 'Type de point === "Tatami"', action: 'Ajouter sous-couche double (Grid + Edge run) pour stabiliser', isActive: true, category: 'underlay' },
  ]);

  const [testWidth, setTestWidth] = useState<number>(4.5);
  const [testFabric, setTestFabric] = useState<string>('cotton');
  const [version, setVersion] = useState<string>('v1.8.4');
  const [logs, setLogs] = useState<string[]>(['Moteur de règles initialisé.']);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    const ruleName = rules.find(r => r.id === id)?.name;
    setLogs(prev => [`Rule "${ruleName}" ${rules.find(r => r.id === id)?.isActive ? 'désactivée' : 'activée'}.`, ...prev]);
  };

  // Run a quick trigger simulation
  const runRuleSimulation = () => {
    let matched: string[] = [];
    if (testWidth < 2.0) {
      matched.push('r3: Règle Running Contour');
    } else if (testWidth >= 2.0 && testWidth <= 8.0) {
      matched.push('r1: Règle Satin Radiale');
    } else {
      matched.push('r2: Règle Tatami Structuré');
    }

    if (testFabric === 'leather') {
      matched.push('r4: Compensation Cuir & Simili');
    } else if (testFabric === 'silk') {
      matched.push('r5: Densité Protection Soie');
    }

    setLogs(prev => [
      `Simulation lancée avec Largeur: ${testWidth}mm, Tissu: ${testFabric}`,
      `Règles appliquées : ${matched.length > 0 ? matched.join(', ') : 'Aucune'}`,
      ...prev
    ]);
  };

  return (
    <div id="aeos-rule-engine-container" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-violet-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Rule Engine (Moteur de Règles Professionnel)</h4>
            <p className="text-[10px] text-gray-400">Version du compilateur : {version}</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full font-mono font-bold">
          RÈGLES DYNAMIQUES
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Rule List & Toggles */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Base de Règles Active</span>
            <button 
              onClick={() => {
                setVersion('v1.8.5');
                setLogs(prev => ['Nouvelle révision de règles compilée (v1.8.5).', ...prev]);
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Compiler Base
            </button>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {rules.map(rule => (
              <div 
                key={rule.id}
                id={`rule-item-${rule.id}`}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${rule.isActive ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/20 border-slate-900/40 opacity-50'}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className="text-xs font-bold text-white">{rule.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md font-mono uppercase">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    <span className="text-violet-400 font-semibold">SI :</span> {rule.condition}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    <span className="text-emerald-400 font-semibold">ALORS :</span> {rule.action}
                  </p>
                </div>

                <button
                  onClick={() => toggleRule(rule.id)}
                  id={`toggle-btn-${rule.id}`}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${rule.isActive ? 'bg-violet-600/10 border-violet-500 text-violet-400 hover:bg-violet-600 hover:text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  {rule.isActive ? 'Activée' : 'Désactivée'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Rule testing sandbox */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Bac à Sable de Règles</span>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Largeur mesurée du segment</span>
                <span className="font-mono text-violet-400">{testWidth.toFixed(1)} mm</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="15.0" 
                step="0.5"
                value={testWidth} 
                onChange={(e) => setTestWidth(parseFloat(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold block">Type de Tissu</label>
              <select 
                value={testFabric} 
                onChange={(e) => setTestFabric(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-[11px] text-white focus:outline-none"
              >
                <option value="cotton">Coton Standard</option>
                <option value="leather">Cuir & Simili (Épais)</option>
                <option value="silk">Soie & Satin (Délicat)</option>
                <option value="denim">Denim (Dense)</option>
              </select>
            </div>

            <button 
              onClick={runRuleSimulation}
              id="btn-run-rule-simulation"
              className="w-full py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-xs font-bold text-white rounded-xl shadow-lg hover:shadow-violet-500/10 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <GitCommit className="w-4 h-4" />
              Tester les Règles
            </button>
          </div>

          <div className="border-t border-slate-800/80 pt-2">
            <span className="text-[9px] text-slate-500 font-semibold block uppercase">Résultat de compilation</span>
            <div className="text-[9px] font-mono text-emerald-400/90 mt-1 max-h-[80px] overflow-y-auto space-y-1">
              {logs.slice(0, 3).map((log, i) => (
                <div key={i} className="truncate">&gt; {log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
