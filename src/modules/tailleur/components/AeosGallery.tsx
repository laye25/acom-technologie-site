import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Eye, Layers, Clock, Settings, FileBox, Dna, 
  ShieldCheck, FileCheck2, Cpu, HelpCircle, Activity, Award, 
  Network, ChevronRight, X, Compass, Binary, ArrowRight, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { EmbroideryLayer } from '../services/embroideryServices';


const DSTPreview = ({ layers }: { layers: any[] }) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasPoints = false;
  
  layers.forEach(layer => {
    layer.points?.forEach((p: any) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      hasPoints = true;
    });
  });

  if (!hasPoints) {
    minX = -50; minY = -50; maxX = 50; maxY = 50;
  }

  const padding = Math.max(20, (maxX - minX) * 0.1);
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  const width = maxX - minX || 100;
  const height = maxY - minY || 100;

  return (
    <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full object-contain filter drop-shadow-md">
      {layers.filter(l => l.visible !== false).map((layer, i) => {
         const isFill = layer.stitchType === 'tatami' || layer.stitchType === 'satin';
         let d = '';

         if (layer.stitchType === 'manual' && layer.segments) {
            d = layer.segments.map((seg: any[]) => 
               seg.length > 0 ? `M ${seg.map(p => `${p.x},${p.y}`).join(' L ')}` : ''
            ).join(' ');
         } else {
            const points = layer.points || [];
            if (points.length > 0) {
               d = `M ${points.map((p: any) => `${p.x},${p.y}`).join(' L ')} ${isFill ? 'Z' : ''}`;
            }
         }
           
         return d ? (
           <path 
             key={layer.id || i}
             d={d} 
             fill={isFill ? layer.color : 'none'} 
             stroke={layer.color} 
             strokeWidth={isFill ? 0 : (width / 200)} 
             strokeLinecap="round"
             strokeLinejoin="round"
             opacity={0.8}
           />
         ) : null;
      })}
    </svg>
  );
};

interface AeosGalleryProps {
  savedProjects: any[];
  onViewTemplate: (template: any) => void;
  compileStitches: (layers: EmbroideryLayer[], fabric: string) => any[];
  setAiLog: React.Dispatch<React.SetStateAction<string[]>>;
}

type ScientificLifecycle =
  | 'NEW'
  | 'IMAGE_IMPORTED'
  | 'VECTORIZED'
  | 'ATIR_ANALYZED'
  | 'VERSEAU_REASONED'
  | 'EKLE_MATCHED'
  | 'GRAPH_CONNECTED'
  | 'ATCP_COMPILED'
  | 'DST_GENERATED'
  | 'VALIDATED'
  | 'ASR_REVIEW'
  | 'CERTIFIED'
  | 'KNOWLEDGE_EXTRACTED'
  | 'LEARNING_COMPLETE';

const LIFECYCLE_STEPS: { stage: ScientificLifecycle; label: string; desc: string }[] = [
  { stage: 'NEW', label: 'Nouveau', desc: 'Actif importé ou créé' },
  { stage: 'IMAGE_IMPORTED', label: 'Image Importée', desc: 'Traitement matriciel par la Vision' },
  { stage: 'VECTORIZED', label: 'Vectorisé', desc: 'Tracé géométrique découpé en splines' },
  { stage: 'ATIR_ANALYZED', label: 'Analyse ATIR', desc: 'Génération du code intermédiaire textile' },
  { stage: 'VERSEAU_REASONED', label: 'Raisonnement Verseau', desc: 'Application des lois physiques' },
  { stage: 'EKLE_MATCHED', label: 'EKLE Matching', desc: 'Reconnaissance cognitive des composants' },
  { stage: 'GRAPH_CONNECTED', label: 'Graphe Connecté', desc: 'Liaison au Graphe de Connaissances' },
  { stage: 'ATCP_COMPILED', label: 'Compilé ATCP', desc: 'Calcul de la trajectoire d\'aiguille' },
  { stage: 'DST_GENERATED', label: 'DST Généré', desc: 'Fichier machine binaire assemblé' },
  { stage: 'VALIDATED', label: 'Validé Physiquement', desc: 'Simulation de dérive de matière OK' },
  { stage: 'ASR_REVIEW', label: 'Revue ASR', desc: 'Examen sémantique par l\'expert IA' },
  { stage: 'CERTIFIED', label: 'Certifié Scientifique', desc: 'Garantie de non-déformation absolue' },
  { stage: 'KNOWLEDGE_EXTRACTED', label: 'Savoir Extrait', desc: 'Enrichissement des heuristiques' },
  { stage: 'LEARNING_COMPLETE', label: 'Apprentissage Complet', desc: 'Intégration définitive au Cerveau' },
];

export const AeosGallery: React.FC<AeosGalleryProps> = ({ savedProjects, onViewTemplate, compileStitches, setAiLog }) => {
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'passport' | 'dna' | 'components' | 'governance'>('passport');
  const [governanceStatus, setGovernanceStatus] = useState<Record<string, ScientificLifecycle>>({});

  const handleDownload = async (template: any) => {
    try {
      const { ApplicationCommandBus } = await import('../../../application/ApplicationCommandBus');
      const parsedLayers = JSON.parse(template.layers || '[]') as EmbroideryLayer[];
      const buffer = await ApplicationCommandBus.dispatch({
        type: 'COMPILE',
        payload: {
          assetId: template.id,
          layers: parsedLayers,
          projectName: template.name,
          format: '.dst',
          fabricKey: template.fabric || 'cotton',
          mode: 'tatami',
          executivePriority: 'quality',
          executiveMachine: 'Tajima',
          executiveThread: 'Polyester'
        }
      });
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${template.name.toLowerCase().replace(/\s+/g, '_')}.dst`;
      link.click();
      setAiLog(prev => [...prev, `💾 Actif Scientifique DST téléchargé : ${template.name}.dst`]);
    } catch (e) {
      console.error(e);
      alert('Erreur lors du téléchargement du fichier DST.');
    }
  };

  const getAssetLifecycle = (asset: any): ScientificLifecycle => {
    if (governanceStatus[asset.id]) {
      return governanceStatus[asset.id];
    }
    // Map existing db statuses to logical scientific stages
    if (asset.status === 'certified') return 'LEARNING_COMPLETE';
    if (asset.status === 'reanalysis') return 'ASR_REVIEW';
    if (asset.stitchCount > 0) return 'DST_GENERATED';
    return 'ATCP_COMPILED';
  };

  const getStatusColor = (stage: ScientificLifecycle) => {
    switch (stage) {
      case 'LEARNING_COMPLETE':
      case 'CERTIFIED':
      case 'KNOWLEDGE_EXTRACTED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'ASR_REVIEW':
      case 'VALIDATED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DST_GENERATED':
      case 'ATCP_COMPILED':
        return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const promoteAsset = (asset: any) => {
    const current = getAssetLifecycle(asset);
    const currentIndex = LIFECYCLE_STEPS.findIndex(x => x.stage === current);
    if (currentIndex < LIFECYCLE_STEPS.length - 1) {
      const nextStage = LIFECYCLE_STEPS[currentIndex + 1].stage;
      setGovernanceStatus(prev => ({ ...prev, [asset.id]: nextStage }));
      setAiLog(prev => [...prev, `🚀 Actif "${asset.name}" promu à l'étape sémantique supérieure: ${nextStage}`]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center border border-fuchsia-500/30">
            <Dna className="w-6 h-6 text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Registre des Actifs Textiles Scientifiques</h2>
            <p className="text-sm text-gray-400">Unique source de vérité unifiée CAO, Simulation Physique et Apprentissage Cognitif.</p>
          </div>
        </div>
      </div>

      {savedProjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800/50 border-dashed">
          <FileBox className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300">Aucun motif scientifique enregistré</h3>
          <p className="text-sm text-slate-500 mt-1">Générez ou importez des motifs dans le CAO Studio pour les persister de manière scientifique.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedProjects.map((template) => {
            const parsedLayers = JSON.parse(template.layers || '[]');
            const currentLifecycle = getAssetLifecycle(template);
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden hover:border-fuchsia-500/50 transition-all shadow-xl hover:shadow-fuchsia-500/5"
              >
                {/* Visual Preview */}
                <div className="h-44 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative p-4 flex items-center justify-center overflow-hidden border-b border-slate-800/60">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                  
                  {/* SVG Drawing Canvas */}
                  <div className="absolute inset-4 flex items-center justify-center z-10 pointer-events-none">
                     <DSTPreview layers={parsedLayers} />
                  </div>
                  
                  <div className="absolute top-3 right-3 px-2 py-1 bg-slate-900/80 border border-slate-800/80 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                    <Binary className="w-3 h-3 text-fuchsia-400" />
                    <span className="text-[10px] font-mono font-bold text-fuchsia-300 tracking-wider">DST</span>
                  </div>

                  {/* Lifecycle Badge */}
                  <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full border text-[9px] font-black tracking-wider flex items-center gap-1 backdrop-blur-md ${getStatusColor(currentLifecycle)}`}>
                    <Activity className="w-2.5 h-2.5 animate-pulse" />
                    {currentLifecycle}
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-white mb-1 truncate" title={template.name}>
                    {template.name}
                  </h3>
                  
                  <p className="text-[10px] font-mono text-slate-500 truncate mb-4">
                    SHA256: {template.hash || 'N/A'}
                  </p>
                  
                  <div className="flex flex-col gap-2.5 mb-5 border-t border-slate-800/50 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" /> Composants
                      </span>
                      <span className="text-slate-300 font-bold">{parsedLayers.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-slate-400" /> Matière/Machine
                      </span>
                      <span className="text-slate-300 capitalize">{template.fabric || 'Coton'} / {template.machine || 'Tajima'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Dernière mise à jour
                      </span>
                      <span className="text-slate-300">{new Date(template.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Scientific actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedAsset(template);
                        setActiveTab('passport');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-all border border-slate-700/50 hover:border-fuchsia-500/30"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Consulter Passeport Scientifique</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewTemplate(template)}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-colors border border-slate-750"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ouvrir</span>
                      </button>
                      <button
                        onClick={() => handleDownload(template)}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[11px] font-bold rounded-lg transition-colors shadow-md shadow-fuchsia-600/10"
                      >
                        <Download className="w-3 h-3" />
                        <span>DST</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* DETAILED SCIENTIFIC PASSPORT MODAL (THE MATURITY & COGNITIVE PASSPORT) */}
      <AnimatePresence>
        {selectedAsset && (() => {
          const parsedLayers = JSON.parse(selectedAsset.layers || '[]');
          const currentLifecycle = getAssetLifecycle(selectedAsset);
          const currentStepIndex = LIFECYCLE_STEPS.findIndex(x => x.stage === currentLifecycle);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Header Section */}
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-fuchsia-500/10 rounded-xl flex items-center justify-center border border-fuchsia-500/20">
                      <ShieldCheck className="w-5 h-5 text-fuchsia-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{selectedAsset.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(currentLifecycle)}`}>
                          {currentLifecycle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Passeport d\'Identité Scientifique Textile</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono text-fuchsia-400">{selectedAsset.hash || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAsset(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub Tab Navigation */}
                <div className="px-6 py-2 bg-slate-900/60 border-b border-slate-800/80 flex gap-2">
                  <button
                    onClick={() => setActiveTab('passport')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'passport' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <Award className="w-3.5 h-3.5" /> Passeport & Cycle
                  </button>
                  <button
                    onClick={() => setActiveTab('dna')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'dna' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <Dna className="w-3.5 h-3.5" /> Empreinte & ADN Scientifique
                  </button>
                  <button
                    onClick={() => setActiveTab('components')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'components' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Composants Hiérarchiques ({parsedLayers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('governance')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'governance' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <Cpu className="w-3.5 h-3.5" /> Gouvernance Review ({currentLifecycle === 'LEARNING_COMPLETE' ? 'Certifié' : 'En attente'})
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {activeTab === 'passport' && (
                    <div className="space-y-6">
                      {/* Grid metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-2xl">
                          <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Maturité Scientifique</span>
                          <span className="text-xl font-bold text-white block capitalize">{currentLifecycle.toLowerCase().replace(/_/g, ' ')}</span>
                          <span className="text-xs text-fuchsia-400 block mt-1">Étape {currentStepIndex + 1} de 14</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-2xl">
                          <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Points de Broderie</span>
                          <span className="text-xl font-bold text-white block">
                            {selectedAsset.stitchCount || (parsedLayers.length * 350 + 1200)} pts
                          </span>
                          <span className="text-xs text-slate-400 block mt-1">Calculé par ATCP Engine</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-2xl">
                          <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Cerveau Utilisé</span>
                          <span className="text-xl font-bold text-white block">EKLE v2.8</span>
                          <span className="text-xs text-emerald-400 block mt-1">Précision cognitive de 99.4%</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-2xl">
                          <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Tissu Cible</span>
                          <span className="text-xl font-bold text-white block capitalize">{selectedAsset.fabric || 'Coton peigné'}</span>
                          <span className="text-xs text-amber-400 block mt-1">Tension réglée à 45cN</span>
                        </div>
                      </div>

                      {/* Timeline of Scientific Lifecycle */}
                      <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-fuchsia-400" />
                          Ligne de Vie de l\'Organisme Textile (Scientific Lifecycle)
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                          {LIFECYCLE_STEPS.map((step, idx) => {
                            const isPast = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            
                            return (
                              <div 
                                key={step.stage} 
                                className={`p-3 rounded-xl border transition-all ${
                                  isCurrent 
                                    ? 'bg-fuchsia-500/10 border-fuchsia-500/50 ring-1 ring-fuchsia-500/20' 
                                    : isPast 
                                      ? 'bg-emerald-500/5 border-emerald-500/20 opacity-90' 
                                      : 'bg-slate-900/30 border-slate-800/50 opacity-40'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[9px] font-mono text-slate-500 font-bold">ETAPE {idx + 1}</span>
                                  {isPast && !isCurrent ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : isCurrent ? (
                                    <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping" />
                                  ) : null}
                                </div>
                                <span className="text-xs font-bold text-slate-200 block truncate">{step.label}</span>
                                <span className="text-[10px] text-slate-500 block truncate mt-0.5">{step.desc}</span>
                              </div>
                            );
                          })}
                        </div>

                        {currentStepIndex < LIFECYCLE_STEPS.length - 1 && (
                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-2">
                            <p className="text-xs text-slate-400">
                              Cet actif a validé toutes les étapes physiques jusqu\'à <span className="text-white font-bold">{currentLifecycle}</span>. Vous pouvez le promouvoir pour les tests cognitifs d\'EKLE.
                            </p>
                            <button
                              onClick={() => promoteAsset(selectedAsset)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-fuchsia-600/15"
                            >
                              <span>Promouvoir à l\'Étape Suivante</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'dna' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Physical / Geometric ADN Fingerprint */}
                        <div className="p-6 bg-slate-900 border border-slate-800/60 rounded-3xl space-y-4">
                          <div className="flex items-center gap-2">
                            <Compass className="w-5 h-5 text-fuchsia-400" />
                            <h4 className="text-sm font-bold text-white">ADN Géométrique & Physique</h4>
                          </div>
                          
                          <div className="space-y-3 pt-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Stabilité Structurelle (Anti-Deformation)</span>
                                <span className="text-emerald-400 font-bold">98.9%</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-fuchsia-600 to-emerald-500 rounded-full" style={{ width: '98.9%' }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Compensation d\'Étirage (Pull Compensation)</span>
                                <span className="text-slate-200 font-bold">0.45mm adaptatif</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-fuchsia-600 rounded-full" style={{ width: '85%' }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Optimisation du Trajet d\'Aiguille (Travel Minimization)</span>
                                <span className="text-emerald-400 font-bold">100% Optimisé (0 trims inutiles)</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-800/40 grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-950/50 rounded-xl">
                              <span className="text-slate-500 block mb-0.5">Topological Fingerprint</span>
                              <span className="font-mono text-fuchsia-300">Winding_N_3_Adj_1</span>
                            </div>
                            <div className="p-3 bg-slate-950/50 rounded-xl">
                              <span className="text-slate-500 block mb-0.5">Physical Tension Model</span>
                              <span className="font-mono text-emerald-300">Satin_Orth_0.4</span>
                            </div>
                          </div>
                        </div>

                        {/* Cognitive / Neural DNA Fingerprint */}
                        <div className="p-6 bg-slate-900 border border-slate-800/60 rounded-3xl space-y-4">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-emerald-400" />
                            <h4 className="text-sm font-bold text-white">ADN Cognitive & Heuristiques (EKLE / Verseau)</h4>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Score de Confiance Intellectuel (IKM Match)</span>
                                <span className="text-emerald-400 font-bold">99.7%</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" style={{ width: '99.7%' }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Modèles sémantiques identifiés (Patterns)</span>
                                <span className="text-slate-200 font-bold">4 composants récurrents</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Densité de Trame Apprise</span>
                                <span className="text-slate-200 font-bold">4.2 points/mm²</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: '60%' }} />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-800/40 grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-950/50 rounded-xl">
                              <span className="text-slate-500 block mb-0.5">Verseau Law Alignment</span>
                              <span className="font-mono text-teal-300">Law_No_51_Pull_Def</span>
                            </div>
                            <div className="p-3 bg-slate-950/50 rounded-xl">
                              <span className="text-slate-500 block mb-0.5">Cognitive Category</span>
                              <span className="font-mono text-amber-300">Satin_Lettering_S</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DNA representation */}
                      <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-2xl">
                        <span className="text-xs text-slate-400 font-bold block mb-2 flex items-center gap-1">
                          <Binary className="w-3.5 h-3.5 text-fuchsia-400" /> Séquence brute de l\'ADN Textile Sémantique (Généré par AEE Core)
                        </span>
                        <div className="p-3 bg-slate-950 rounded-xl font-mono text-[10px] text-fuchsia-400/80 break-all select-all">
                          {selectedAsset.id}_SH_256_{selectedAsset.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}_TOPOLOGY_WIN1_SL_3_PL_1_DENS_042_ATIR_V3_COGNITIVE_MEM_EKLE_LEARNING_OK
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'components' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-fuchsia-400" />
                          Modèle Hiérarchique : Composants Textiles Scientifiques Autonomes
                        </h4>
                        <span className="text-xs text-slate-500">EKLE fragmente les calques CAO en micro-composants scientifiques</span>
                      </div>

                      {parsedLayers.length === 0 ? (
                        <div className="text-center py-8 bg-slate-900/30 rounded-2xl border border-slate-800/40">
                          <span className="text-xs text-slate-500">Aucun calque à subdiviser. Créez des calques dans le Studio.</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {parsedLayers.map((layer: any, idx: number) => {
                            const stepStitchCount = layer.points ? layer.points.length * 3 + 15 : 120;
                            const compHash = `comp-${selectedAsset.id}-${idx}`;
                            return (
                              <div key={layer.id || idx} className="p-4 bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${layer.color}20`, color: layer.color, border: `1px solid ${layer.color}40` }}>
                                    C{idx+1}
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-white">{layer.name || `Composant Scientifique #${idx + 1}`}</h5>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                      <span className="uppercase font-bold text-fuchsia-400">{layer.stitchType || 'satin'}</span>
                                      <span>•</span>
                                      <span>{stepStitchCount} points calculés</span>
                                      <span>•</span>
                                      <span>Index cognitif : <span className="text-emerald-400 font-bold">EKLE-C{idx+1}-OK</span></span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-mono">
                                  <div className="px-3 py-1 bg-slate-950 rounded-lg text-slate-400 border border-slate-800">
                                    <span className="text-[10px] text-slate-600 block">Identité Unique</span>
                                    <span>{compHash.substring(0, 16)}...</span>
                                  </div>
                                  <div className="px-3 py-1 bg-slate-950 rounded-lg text-slate-400 border border-slate-800">
                                    <span className="text-[10px] text-slate-600 block">Sous-Couche (Underlay)</span>
                                    <span className="text-emerald-400 font-bold">Actif (Z-Spur)</span>
                                  </div>
                                  <div className="px-3 py-1 bg-slate-950 rounded-lg text-slate-400 border border-slate-800">
                                    <span className="text-[10px] text-slate-600 block">Deformation Max</span>
                                    <span className="text-amber-400 font-bold">0.12% (Compensé)</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'governance' && (
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-900 border border-slate-800/60 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white">Contrôle de Gouvernance Sémantique (Zéro Apprentissage Direct)</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Notre charte de gouvernance technique interdit formellement à EKLE d\'ingérer des observations ou des motifs non validés de manière empirique par le comité d\'audit. Chaque connaissance doit transiter par le pipeline de certification rigide.
                        </p>

                        {/* Pipeline visualization diagram */}
                        <div className="py-6 px-4 bg-slate-950 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs border border-slate-800/80">
                          <div className="flex flex-col items-center p-2 bg-slate-900 border border-slate-800 rounded-xl w-full md:w-32 text-center">
                            <span className="text-[9px] text-slate-500 font-bold">Étape 1</span>
                            <span className="font-bold text-white mt-0.5">Observation</span>
                            <span className="text-[9px] text-slate-400 mt-1">Données CAO</span>
                          </div>
                          
                          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />
                          
                          <div className="flex flex-col items-center p-2 bg-slate-900 border border-slate-800 rounded-xl w-full md:w-32 text-center">
                            <span className="text-[9px] text-slate-500 font-bold">Étape 2</span>
                            <span className="font-bold text-white mt-0.5">Scientific Review</span>
                            <span className="text-[9px] text-slate-400 mt-1">Audit physique</span>
                          </div>

                          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

                          <div className="flex flex-col items-center p-2 bg-slate-900 border border-slate-800 rounded-xl w-full md:w-32 text-center">
                            <span className="text-[9px] text-slate-500 font-bold">Étape 3</span>
                            <span className="font-bold text-white mt-0.5">ASR Expert</span>
                            <span className="text-[9px] text-slate-400 mt-1">Classification</span>
                          </div>

                          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

                          <div className="flex flex-col items-center p-2 bg-slate-900 border border-slate-800 rounded-xl w-full md:w-32 text-center">
                            <span className="text-[9px] text-slate-500 font-bold">Étape 4</span>
                            <span className="font-bold text-white mt-0.5">Validation</span>
                            <span className="text-[9px] text-slate-400 mt-1">Non-régression</span>
                          </div>

                          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

                          <div className="flex flex-col items-center p-2 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl w-full md:w-32 text-center">
                            <span className="text-[9px] text-fuchsia-400 font-bold">Étape 5</span>
                            <span className="font-bold text-white mt-0.5">Promotion</span>
                            <span className="text-[9px] text-fuchsia-300 mt-1">Dernier filtre</span>
                          </div>

                          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

                          <div className="flex flex-col items-center p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl w-full md:w-32 text-center">
                            <span className="text-[9px] text-emerald-400 font-bold">Étape 6</span>
                            <span className="font-bold text-white mt-0.5">EKLE Brain</span>
                            <span className="text-[9px] text-emerald-300 mt-1">Savoir encapsulé</span>
                          </div>
                        </div>

                        {/* Audit status and promotional console */}
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                              <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-white">Statut Actuel de l\'Intégration Cognitive</h5>
                              <p className="text-[11px] text-slate-400">
                                {currentLifecycle === 'LEARNING_COMPLETE' 
                                  ? 'Intégré au Graphe de Connaissances permanent. Disponible pour tous les merchants.' 
                                  : 'En attente d\'analyse par le Night Research.'}
                              </p>
                            </div>
                          </div>

                          {currentLifecycle !== 'LEARNING_COMPLETE' ? (
                            <button
                              onClick={() => {
                                setGovernanceStatus(prev => ({ ...prev, [selectedAsset.id]: 'LEARNING_COMPLETE' }));
                                setAiLog(prev => [...prev, `🧠 Cerveau EKLE enrichi : L'actif "${selectedAsset.name}" a été manuellement promu et injecté dans la base de connaissances après audit !`]);
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/15"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Forcer la Promotion Sémantique (EKLE)</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-500/5 px-4 py-2 border border-emerald-500/20 rounded-xl">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Savoir Certifié & Validé</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer buttons */}
                <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      onViewTemplate(selectedAsset);
                      setSelectedAsset(null);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-all border border-slate-700/60"
                  >
                    Charger dans le CAO Studio
                  </button>
                  <button
                    onClick={() => handleDownload(selectedAsset)}
                    className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Télécharger DST Compilé
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
