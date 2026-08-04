import React, { useState } from 'react';
import { 
  LogoDiagnosticReport, 
  LogoObjectAnalysis, 
  LogoObjectType, 
  LogoStructureTree,
  LogoSpecificType
} from '../services/LogoAnalyzerKernel';
import { GeometricReconstructionViewer } from './GeometricReconstructionViewer';
import { RealLogoEndToEndTracePanel } from './RealLogoEndToEndTracePanel';
import { SvgTopologyViewerPanel } from './SvgTopologyViewerPanel';
import { SemanticAssemblyViewerPanel } from './SemanticAssemblyViewerPanel';
import { 
  Type, 
  Shapes, 
  Sparkles, 
  Flower2, 
  Layers, 
  AlertTriangle, 
  HelpCircle, 
  Eye, 
  ChevronRight, 
  ChevronDown, 
  Info, 
  Crosshair, 
  RotateCw, 
  FileSearch, 
  CheckCircle2, 
  XCircle, 
  X, 
  Star, 
  Filter, 
  Layers2,
  Compass,
  Maximize2,
  Network,
  Boxes
} from 'lucide-react';

interface LogoDiagnosticViewerProps {
  report: LogoDiagnosticReport | null;
  onClose?: () => void;
  onSelectObject?: (layerId: string) => void;
}

export const CATEGORY_COLORS: Record<LogoObjectType, { bg: string; text: string; border: string; hex: string }> = {
  TEXT: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', hex: '#06B6D4' },
  GEOMETRY: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', hex: '#A855F7' },
  SYMBOL: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', hex: '#EAB308' },
  ORNAMENT: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#10B981' },
  SURFACE: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', hex: '#3B82F6' },
  NOISE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', hex: '#F43F5E' },
  UNKNOWN: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', hex: '#64748B' }
};

export const CATEGORY_ICONS: Record<LogoObjectType, React.ElementType> = {
  TEXT: Type,
  GEOMETRY: Shapes,
  SYMBOL: Sparkles,
  ORNAMENT: Flower2,
  SURFACE: Layers,
  NOISE: AlertTriangle,
  UNKNOWN: HelpCircle
};

export type FilterOption = 'ALL' | LogoObjectType | 'LOW_CONFIDENCE';
export type DiagnosticTab = 'DIAGNOSTIC' | 'RECONSTRUCTION' | 'REAL_LOGO_TRACE' | 'TOPOLOGY_GRAPH' | 'SEMANTIC_ASSEMBLY';

export const LogoDiagnosticViewer: React.FC<LogoDiagnosticViewerProps> = ({
  report,
  onClose,
  onSelectObject
}) => {
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('DIAGNOSTIC');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    node_root_logo: true,
    node_frame: true,
    node_text: true,
    node_symbols: true,
    node_ornaments: true,
    node_noise: true
  });

  if (!report || report.totalObjects === 0) {
    return (
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3">
        <FileSearch className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Diagnostic Logo non disponible
        </h3>
        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
          Pour lancer l'analyse sémantique et la décomposition structurelle, sélectionnez le mode <strong className="text-cyan-400">[ Logo ]</strong> dans l'onglet Numérisation puis cliquez sur <strong>Lancer Diagnostic</strong>.
        </p>
      </div>
    );
  }

  const selectedObject = report.objects.find(o => o.id === selectedObjectId);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleSelectObject = (obj: LogoObjectAnalysis) => {
    setSelectedObjectId(obj.id);
    if (onSelectObject) {
      onSelectObject(obj.layerId);
    }
  };

  // Filter objects based on active filter
  const filteredObjects = report.objects.filter(o => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'LOW_CONFIDENCE') return o.confidenceLevel === 'LOW' || o.confidence < 60;
    return o.category === activeFilter;
  });

  const renderTreeNode = (node: LogoStructureTree, depth = 0) => {
    const isExpanded = expandedNodes[node.id] ?? true;
    const hasChildren = node.children && node.children.length > 0;
    const catStyle = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.UNKNOWN;
    const IconComponent = CATEGORY_ICONS[node.category] || HelpCircle;

    const isNodeMatchingFilter = !node.analysis || (
      activeFilter === 'ALL' ||
      (activeFilter === 'LOW_CONFIDENCE' && (node.analysis.confidenceLevel === 'LOW' || node.analysis.confidence < 60)) ||
      node.analysis.category === activeFilter
    );

    if (!isNodeMatchingFilter && !hasChildren) {
      return null;
    }

    return (
      <div key={node.id} className="space-y-1">
        <div 
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            if (node.analysis) {
              handleSelectObject(node.analysis);
            }
          }}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all border text-xs ${
            selectedObjectId === node.analysis?.id 
              ? 'bg-cyan-950/90 border-cyan-500/80 text-white font-bold ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/50' 
              : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/60 text-slate-300'
          }`}
          style={{ marginLeft: `${depth * 12}px` }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <span className="w-3.5 h-3.5 shrink-0 inline-block text-center text-slate-600 font-mono text-[10px]">•</span>
          )}

          <IconComponent className={`w-3.5 h-3.5 shrink-0 ${catStyle.text}`} />
          
          <span className="truncate flex-1 font-mono text-[11px]">{node.name}</span>

          {node.analysis && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
              node.analysis.confidence >= 80 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                : node.analysis.confidence >= 60 
                ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              {node.analysis.confidence}%
            </span>
          )}

          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase font-semibold ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {node.category}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // SVG Mini Map Path renderer for selected object
  const renderObjectSvgPreview = (obj: LogoObjectAnalysis) => {
    const { minX, maxX, minY, maxY } = obj.boundingBox;
    const padding = 10;
    const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;

    let pathD = '';
    if (obj.subpaths && obj.subpaths.length > 0) {
      pathD = obj.subpaths.map(sp => {
        if (sp.length === 0) return '';
        return `M ${sp[0].x} ${sp[0].y} ` + sp.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + (obj.isClosed ? ' Z' : '');
      }).join(' ');
    } else if (obj.points && obj.points.length > 0) {
      pathD = `M ${obj.points[0].x} ${obj.points[0].y} ` + obj.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + (obj.isClosed ? ' Z' : '');
    }

    const catStyle = CATEGORY_COLORS[obj.category];

    return (
      <div className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-center relative overflow-hidden group">
        <svg viewBox={viewBox} className="w-full h-full max-h-28 drop-shadow-md" preserveAspectRatio="xMidYMid meet">
          <path 
            d={pathD} 
            fill={catStyle.hex} 
            fillOpacity={0.25} 
            stroke={catStyle.hex} 
            strokeWidth={1.5} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx={obj.centerOfMass.x} cy={obj.centerOfMass.y} r={3} fill="#06B6D4" />
        </svg>

        <div className="absolute bottom-1 right-2 bg-slate-900/90 text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
          Center: ({obj.centerOfMass.x}, {obj.centerOfMass.y})
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xl text-left max-w-6xl mx-auto">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-850 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-600/20 border border-cyan-500/40 rounded-xl">
            <Eye className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">Diagnostic Sémantique & Reconstruction Logo</h2>
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full">
                Mode Diagnostic v1.2
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Identification mesurable, explicable & reconstruction géométrique parallèle ({report.totalObjects} objets analysés)
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('DIAGNOSTIC')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DIAGNOSTIC'
                ? 'bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Diagnostic Sémantique</span>
          </button>

          <button
            onClick={() => setActiveTab('RECONSTRUCTION')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'RECONSTRUCTION'
                ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Reconstruction Géométrique (Phase 1)</span>
          </button>

          <button
            onClick={() => setActiveTab('REAL_LOGO_TRACE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REAL_LOGO_TRACE'
                ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-300" />
            <span>Trace Logo Réel (Phase 1.4C)</span>
          </button>

          <button
            onClick={() => setActiveTab('TOPOLOGY_GRAPH')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TOPOLOGY_GRAPH'
                ? 'bg-violet-600 text-white shadow-md ring-1 ring-violet-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-violet-300" />
            <span>Graphe Topologique (Phase 2.1)</span>
          </button>

          <button
            onClick={() => setActiveTab('SEMANTIC_ASSEMBLY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SEMANTIC_ASSEMBLY'
                ? 'bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-cyan-300" />
            <span>Objets Sémantiques</span>
          </button>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Fermer le diagnostic"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {activeTab === 'RECONSTRUCTION' ? (
        <GeometricReconstructionViewer report={report} />
      ) : activeTab === 'REAL_LOGO_TRACE' ? (
        <RealLogoEndToEndTracePanel report={report} />
      ) : activeTab === 'TOPOLOGY_GRAPH' ? (
        <SvgTopologyViewerPanel report={report} />
      ) : activeTab === 'SEMANTIC_ASSEMBLY' ? (
        <SemanticAssemblyViewerPanel report={report} />
      ) : (
        <>
      {/* 2. Interactive Category & Confidence Filters Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-cyan-400" /> FILTRES :
        </span>

        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          [ Tous ({report.totalObjects}) ]
        </button>

        {(Object.keys(CATEGORY_COLORS) as LogoObjectType[]).map(cat => {
          const count = report.categoryCounts[cat] || 0;
          const style = CATEGORY_COLORS[cat];
          const isSelected = activeFilter === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                isSelected 
                  ? `${style.bg} ${style.text} ${style.border} border ring-1 ring-violet-500/50` 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span>{cat}</span>
              <span className="font-mono text-[9px] opacity-80">({count})</span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveFilter('LOW_CONFIDENCE')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ml-auto ${
            activeFilter === 'LOW_CONFIDENCE'
              ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
              : 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Faible Confiance ({report.lowConfidenceObjects.length})</span>
        </button>
      </div>

      {/* 3. Main CAD Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Structural Tree (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              Arborescence ({filteredObjects.length} Objets Filtrés)
            </span>
          </div>

          <div className="space-y-1">
            {report.structureTree.map(rootNode => renderTreeNode(rootNode))}
          </div>
        </div>

        {/* Right Column: Deep Object Inspector (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3 max-h-[460px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Inspecteur d'Objet Diagnostic
            </span>

            {selectedObject && (
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                {selectedObject.id}
              </span>
            )}
          </div>

          {selectedObject ? (
            <div className="space-y-3 text-xs text-slate-300">
              {/* SVG Vector Path Mini-Map Preview */}
              {renderObjectSvgPreview(selectedObject)}

              {/* Header Badge: Category + Specific Type + 4 Levels */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">{selectedObject.layerName}</h4>
                    <p className="text-[10px] font-mono text-cyan-400 font-semibold mt-0.5">
                      Catégorie: {selectedObject.category} &rarr; Type: {selectedObject.specificType}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold uppercase border inline-block ${
                      selectedObject.confidence >= 80 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                        : selectedObject.confidence >= 60 
                        ? 'bg-amber-950 text-amber-300 border-amber-700' 
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}>
                      Global {selectedObject.confidence}%
                    </span>
                  </div>
                </div>

                {/* 4 Distinct Analysis Levels Grid */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-900 text-[10px] font-mono">
                  <div className="bg-slate-900/90 p-1.5 rounded border border-purple-500/30">
                    <div className="text-[9px] text-purple-400 font-sans font-bold">A. GÉOMÉTRIE</div>
                    <div className="text-white font-bold">{selectedObject.geometryType || 'INCONNUE'}</div>
                    <div className="text-purple-300 text-[9px]">{selectedObject.geometryConfidence || 0}% Confiance</div>
                  </div>

                  <div className="bg-slate-900/90 p-1.5 rounded border border-cyan-500/30">
                    <div className="text-[9px] text-cyan-400 font-sans font-bold">B. SÉMANTIQUE</div>
                    <div className="text-white font-bold flex items-center gap-1">
                      <span>{selectedObject.semanticType || 'UNKNOWN'}</span>
                      {selectedObject.candidateSemanticType && selectedObject.candidateSemanticType !== selectedObject.semanticType && (
                        <span className="text-[8px] text-slate-400 font-normal">({selectedObject.candidateSemanticType})</span>
                      )}
                    </div>
                    <div className="text-cyan-300 text-[9px]">
                      {selectedObject.memberSemanticConfidence !== undefined ? (
                        <span>Membre: {selectedObject.memberSemanticConfidence}%</span>
                      ) : (
                        <span>{selectedObject.semanticConfidence || 0}% Confiance</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-1.5 rounded border border-amber-500/30">
                    <div className="text-[9px] text-amber-400 font-sans font-bold">C. CONTEXTE / GROUPE</div>
                    <div className="text-white font-bold truncate">{selectedObject.groupType || 'NONE'}</div>
                    <div className="text-amber-300 text-[9px]">
                      {selectedObject.groupConfidence !== undefined ? (
                        <span>Groupe: {selectedObject.groupConfidence}%</span>
                      ) : (
                        <span>{selectedObject.contextConfidence || 0}% Confiance</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conflict Resolution Banner */}
                {selectedObject.conflictResolved && selectedObject.conflictDetails && (
                  <div className="mt-2 p-2 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-[10px] text-emerald-300 font-medium flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-200 uppercase font-mono mr-1">[Arbitrage de Conflit]</span>
                      {selectedObject.conflictDetails}
                    </div>
                  </div>
                )}
              </div>

              {/* Measured Evidence List Box */}
              {selectedObject.evidence && selectedObject.evidence.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl space-y-1.5 text-[10px]">
                  <div className="font-bold text-cyan-300 flex items-center justify-between border-b border-slate-850 pb-1 font-sans">
                    <span>D. PREUVES MESURÉES RÉELLES ({selectedObject.evidence.length})</span>
                    <span className="text-[9px] text-slate-500 font-mono">Explicabilité Médicale CAD</span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px]">
                    {selectedObject.evidence.map((ev, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostic Reasoning & Criteria Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl space-y-2 text-[11px]">
                <div className="font-bold text-slate-200 flex items-center justify-between border-b border-slate-850 pb-1">
                  <span>RAISON DU DIAGNOSTIC & CRITÈRES</span>
                  <span className="text-[9px] text-slate-500 font-mono">Explicabilité</span>
                </div>

                {/* Criteria */}
                <div className="space-y-1 text-[10px]">
                  {selectedObject.reasoning.criteria.map((crit, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{crit}</span>
                    </div>
                  ))}

                  {selectedObject.reasoning.counterCriteria.map((ccrit, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-amber-300">
                      <XCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <span>{ccrit}</span>
                    </div>
                  ))}
                </div>

                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-medium text-slate-300 italic">
                  <strong>Conclusion :</strong> {selectedObject.reasoning.conclusion}
                </div>
              </div>

              {/* Geometrical Metrics Table */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl space-y-1.5 text-[10px] font-mono">
                <div className="font-bold text-slate-200 border-b border-slate-850 pb-1 font-sans text-xs">
                  CARACTÉRISTIQUES GÉOMÉTRIQUES RÉELLES
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Bounding Box:</span>
                    <span>[{selectedObject.boundingBox.minX}, {selectedObject.boundingBox.minY}] - [{selectedObject.boundingBox.maxX}, {selectedObject.boundingBox.maxY}]</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Dimensions:</span>
                    <span>{selectedObject.dimensions.width} x {selectedObject.dimensions.height} px</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Aire / Périmètre:</span>
                    <span>{selectedObject.area} px² / {selectedObject.perimeter} px</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Sommets / Points:</span>
                    <span>{selectedObject.verticesCount} sommets / {selectedObject.pointsCount} pts</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Contour / Trous:</span>
                    <span>{selectedObject.isClosed ? 'Fermé' : 'Ouvert'} ({selectedObject.holesCount} trou(s))</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Circularité / Ratio:</span>
                    <span>{selectedObject.compactness} / {selectedObject.aspectRatio}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Orientation:</span>
                    <span>{selectedObject.orientation}°</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-900 py-0.5">
                    <span className="text-slate-500">Voisins Proches:</span>
                    <span>{selectedObject.nearbyObjectIds.length} objets</span>
                  </div>
                </div>
              </div>

              {/* Special Audit Box for Star or Primitive Features */}
              {selectedObject.specificType === 'STAR' && (
                <div className="bg-amber-950/30 border border-amber-500/40 p-2.5 rounded-xl space-y-1.5 text-[10px]">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    AUDIT SPÉCIFIQUE ÉTOILE (STAR)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-amber-200/90 font-mono">
                    <div>Pics (Branches): <strong>{selectedObject.primitiveDetails.starPoints || 0}</strong></div>
                    <div>Rayon Pic: <strong>{selectedObject.primitiveDetails.peakRadius || 0} px</strong></div>
                    <div>Rayon Vallée: <strong>{selectedObject.primitiveDetails.valleyRadius || 0} px</strong></div>
                    <div>Ratio Pic/Vallée: <strong>{selectedObject.primitiveDetails.peakToValleyRatio || 0}x</strong></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <Crosshair className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p className="text-xs font-bold text-slate-400">
                Sélectionnez un objet dans l'arborescence
              </p>
              <p className="text-[10px]">
                Son ID unique, sa classification à deux niveaux, sa confiance et sa géométrie seront affichés ici.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Text Groups & Primitives Summary Bar */}
      {report.textGroups && report.textGroups.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
          <div className="font-bold text-cyan-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-400" />
              <span>REGROUPEMENTS CONTEXTUELS DE TEXTES & CANDIDATS ({report.textGroups.length} Groupes)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Analyse Typographique</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {report.textGroups.map(grp => {
              const statusColor = grp.status === 'VALIDATED_TEXT'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : grp.status === 'CANDIDATE_TEXT'
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300';

              const statusBadge = grp.status === 'VALIDATED_TEXT'
                ? 'VALIDÉ (TEXT_CHARACTER)'
                : grp.status === 'CANDIDATE_TEXT'
                ? 'CANDIDAT (GLYPH_CANDIDATE)'
                : 'REJETÉ';

              return (
                <div key={grp.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{grp.id} - {grp.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border font-mono ${statusColor}`}>
                      {statusBadge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Membres: {grp.memberIds.length} | Dispo: {grp.arrangement}</span>
                    <span className="text-cyan-400 font-bold">Confiance: {grp.groupConfidence || 0}%</span>
                  </div>

                  {grp.metrics && (
                    <div className="space-y-1 pt-1 border-t border-slate-900 text-[9px] font-mono text-slate-400">
                      <div className="grid grid-cols-3 gap-1">
                        <div>Alignement: <span className="text-slate-200">{(grp.metrics.alignmentScore * 100).toFixed(0)}%</span></div>
                        <div>Tailles: <span className="text-slate-200">{(grp.metrics.sizeConsistencyScore * 100).toFixed(0)}%</span></div>
                        <div>
                          Espacement: <span className="text-slate-200">
                            {grp.metrics.spacingMeasurable && grp.metrics.spacingScore !== null
                              ? `${(grp.metrics.spacingScore * 100).toFixed(0)}%`
                              : 'N/M'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div>Glyph Compat: <span className="text-slate-200">{(grp.metrics.glyphCompatibilityScore * 100).toFixed(0)}%</span></div>
                        <div>Orientation: <span className="text-slate-200">{(grp.metrics.orientationScore * 100).toFixed(0)}%</span></div>
                        <div>Arc/Base Fit: <span className="text-slate-200">{(grp.metrics.baselineScore * 100).toFixed(0)}%</span></div>
                      </div>
                      {grp.metrics.groupGeometryConfidence !== undefined && (
                        <div className="flex items-center justify-between text-[8.5px] text-slate-400 pt-0.5 border-t border-slate-900/60">
                          <span>Géométrie: <strong className="text-slate-200">{grp.metrics.groupGeometryConfidence}%</strong></span>
                          <span>Typographie: <strong className="text-slate-200">{grp.metrics.typographicConfidence}%</strong></span>
                          <span>Score Final: <strong className="text-cyan-400">{grp.metrics.finalTextConfidence}%</strong></span>
                        </div>
                      )}
                      {grp.metrics.ornamentPenalty > 0 && (
                        <div className="flex items-center justify-between text-[8.5px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 font-mono">
                          <span>Motif Répétitif / Décoratif Détecté</span>
                          <span>Ornament Penalty: -{(grp.metrics.ornamentPenalty * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {grp.reasoningText && (
                    <div className="text-[9.5px] text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-850 italic">
                      {grp.reasoningText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
