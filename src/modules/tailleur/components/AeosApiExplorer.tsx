import React, { useState } from 'react';
import { Terminal, Play, Clipboard, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ApiMethod {
  id: string;
  name: string;
  signature: string;
  snippet: string;
  response: any;
  description: string;
}

export const AeosApiExplorer: React.FC = () => {
  const [selectedApiId, setSelectedApiId] = useState<string>('a1');
  const [copied, setCopied] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [apiLogs, setApiLogs] = useState<string[]>(['Console d\'API initialisée. Prêt pour l\'appel...']);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const methods: ApiMethod[] = [
    {
      id: 'a1',
      name: 'Vision.analyze()',
      signature: 'AEOS.Vision.analyze(imageUri: string, options?: VisionOptions): Promise<VisionResult>',
      snippet: `import { AEOS } from '@acom/aeos-sdk';\n\nconst result = await AEOS.Vision.analyze('https://acom-store.com/designs/rose.png', {\n  detectColors: true,\n  removeBackground: true,\n  segmentRegions: true\n});\nconsole.log(result.objects.length);`,
      response: {
        success: true,
        executionTimeMs: 142,
        colorsDetected: ['#DC2626', '#FFD700', '#059669'],
        objects: [
          { id: 'obj_petal_1', type: 'petal', confidence: 0.98, areaPx: 4200 },
          { id: 'obj_leaf_1', type: 'leaf', confidence: 0.95, areaPx: 1800 },
          { id: 'obj_stem_1', type: 'stem', confidence: 0.91, areaPx: 600 }
        ]
      },
      description: "Analyse une image par vision d'ordinateur pour détecter les contours, régions, couleurs de fils Madeira optimales et structures géométriques."
    },
    {
      id: 'a2',
      name: 'Geometry.vectorize()',
      signature: 'AEOS.Geometry.vectorize(visionObjects: VisionObject[]): Promise<GeometryLayer[]>',
      snippet: `import { AEOS } from '@acom/aeos-sdk';\n\nconst layers = await AEOS.Geometry.vectorize([\n  { id: 'obj_petal_1', type: 'petal', bounds: { minX: -50, maxX: 50, minY: -50, maxY: 50 } }\n]);\nconsole.log(layers[0].bezierCurves);`,
      response: {
        success: true,
        executionTimeMs: 84,
        layers: [
          {
            id: 'layer_petal_1',
            type: 'pétale_rose',
            controlPoints: [
              { x: 0, y: -10 },
              { x: 30, y: -45 },
              { x: 10, y: 15 }
            ]
          }
        ]
      },
      description: "Transforme les formes matricielles ou segments de détection en courbes de Bézier de haute fidélité mathématique prêtes pour l'implantation de points de couture."
    },
    {
      id: 'a3',
      name: 'Stitch.build()',
      signature: 'AEOS.Stitch.build(geometryLayer: GeometryLayer, parameters: StitchParameters): Promise<StitchResult>',
      snippet: `import { AEOS } from '@acom/aeos-sdk';\n\nconst stitches = await AEOS.Stitch.build(myLayer, {\n  stitchType: 'satin',\n  density: 0.5,\n  pullComp: 0.2,\n  underlay: true\n});\nconsole.log('Stitches generated:', stitches.length);`,
      response: {
        success: true,
        executionTimeMs: 189,
        stitchesGenerated: 420,
        pullCompensationApplied: 0.2,
        underlayStitches: 84,
        speedRecommendationRpm: 850
      },
      description: "Calcule les trajectoires de l'aiguille pour un calque géométrique en appliquant la compensation d'étirement, les sous-couches et les spécifications de tissu."
    },
    {
      id: 'a4',
      name: 'Compiler.compile()',
      signature: 'AEOS.Compiler.compile(stitches: Stitch[], format: "dst" | "pes" | "jef" | "exp"): Promise<ArrayBuffer>',
      snippet: `import { AEOS } from '@acom/aeos-sdk';\n\nconst binaryBuffer = await AEOS.Compiler.compile(stitches, 'dst');\n// Écrire le buffer dans un fichier pour machine industrielle\n`,
      response: {
        success: true,
        executionTimeMs: 32,
        fileSize: 12560,
        bytesWritten: 12560,
        format: 'dst',
        headerInfo: 'LA:Rose_Pattern    ST:   4250\rCO:  2\r+X:  120\r-X:  120'
      },
      description: "Compile la suite de points de broderie en un fichier binaire standard industriel (DST, PES, JEF, EXP, etc.) directement téléchargeable sur clé USB."
    }
  ];

  const activeApi = methods.find(a => a.id === selectedApiId) || methods[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeApi.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeApiCall = () => {
    setExecuting(true);
    setApiLogs(prev => [`Appel d'API sortant: AEOS.${activeApi.name}...`, ...prev]);
    setTimeout(() => {
      setLastResponse(activeApi.response);
      setApiLogs(prev => [`Appel d'API réussi (200 OK) - Exécution en ${activeApi.response.executionTimeMs}ms`, ...prev]);
      setExecuting(false);
    }, 1000);
  };

  return (
    <div id="aeos-api-explorer-container" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Public API Explorer (Console d'intégration de l'intelligence)</h4>
            <p className="text-[10px] text-gray-400">Bac à sable interactif pour développeurs et services tiers de l'AEOS SDK</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-mono font-bold">
          CONSOLES DEV
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: API List (3/12 cols) */}
        <div className="lg:col-span-3 space-y-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Méthodes d'API</span>
          <div className="space-y-1">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedApiId(m.id); setLastResponse(null); }}
                id={`api-method-btn-${m.id}`}
                className={`w-full p-2.5 text-left rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${selectedApiId === m.id ? 'bg-violet-600/10 border-violet-500 text-white' : 'bg-slate-950/60 border-slate-850 text-gray-400 hover:text-white'}`}
              >
                <span>AEOS.{m.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Middle Column: Code Snippet (5/12 cols) */}
        <div className="lg:col-span-5 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Exemple de code JavaScript</span>
              <button 
                onClick={handleCopyCode}
                id="api-copy-code-btn"
                className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-white transition-colors"
              >
                <Clipboard className="w-3 h-3" />
                {copied ? 'Copié !' : 'Copier Code'}
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-850 font-mono text-[10px] text-gray-300 overflow-x-auto min-h-[160px] whitespace-pre-wrap select-all">
              {activeApi.snippet}
            </pre>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-gray-400 max-w-[280px]">
              {activeApi.description}
            </p>
            <button
              onClick={executeApiCall}
              disabled={executing}
              id="api-execute-call-btn"
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-1 cursor-pointer transition-all shrink-0"
            >
              {executing ? (
                <span className="animate-spin">🔄</span>
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Exécuter API</span>
            </button>
          </div>
        </div>

        {/* Right Column: Console Log and Response (4/12 cols) */}
        <div className="lg:col-span-4 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Réponse JSON (200 OK)</span>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 h-[160px] overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1">
              {lastResponse ? (
                <pre className="text-emerald-400 whitespace-pre">{JSON.stringify(lastResponse, null, 2)}</pre>
              ) : (
                <div className="text-gray-500 italic flex h-full items-center justify-center">
                  Cliquez sur "Exécuter API" pour voir la réponse
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-850 pt-2 text-[9px] font-mono text-slate-500 max-h-[60px] overflow-y-auto">
            {apiLogs.map((log, i) => (
              <div key={i}>&gt; {log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
