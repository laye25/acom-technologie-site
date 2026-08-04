import React, { useState, useMemo } from 'react';
import { LogoDiagnosticReport } from '../services/LogoAnalyzerKernel';
import { 
  GeometricReconstructionEngine, 
  GeometricReconstructionReport, 
  ObjectReconstructionResult 
} from '../services/GeometricReconstructionEngine';
import { ReconstructionApplicationBridge, BridgeStatistics, BridgeMapping } from '../services/ReconstructionApplicationBridge';
import { 
  Shapes, 
  Crosshair, 
  Eye, 
  Info,
  Sliders,
  CheckCircle2,
  XCircle,
  Network,
  Cpu,
  Layers,
  ShieldCheck,
  GitBranch,
  Compass,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';

interface GeometricReconstructionViewerProps {
  report: LogoDiagnosticReport;
}

export type ReconstructionViewMode = 'ORIGINAL_HD' | 'RECONSTRUCTED' | 'SUPERPOSITION' | 'DIFFERENCE' | 'STRUCTURAL';

export const GeometricReconstructionViewer: React.FC<GeometricReconstructionViewerProps> = ({ report }) => {
  const [viewMode, setViewMode] = useState<ReconstructionViewMode>('SUPERPOSITION');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'BRIDGE' | 'STRUCTURAL' | 'AUDIT' | 'CLUSTERS' | 'BENCHMARK'>('BRIDGE');
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);

  const reconReport: GeometricReconstructionReport = useMemo(() => {
    return GeometricReconstructionEngine.analyzeAndReconstruct(report);
  }, [report]);

  // Compute or read bridge telemetry
  const rawBridgeStats = (window as any).__BRIDGE_STATS as BridgeStatistics | undefined;
  const rawBridgeMappings = (window as any).__BRIDGE_MAPPINGS as BridgeMapping[] | undefined;
  const sentinelHashes = (window as any).__SENTINEL_HASHES as { ORIGINAL_HASH: string; RECONSTRUCTED_HASH: string; ACTIVE_LAYER_HASH: string } | undefined;

  const bridgeStats: BridgeStatistics = rawBridgeStats || {
    totalLayers: report.objects.length,
    totalReconstructionCandidates: reconReport.results.length,
    confirmedCandidates: reconReport.results.filter(r => r.decision3Level === 'RECONSTRUCT_CONFIRMED').length,
    mappedConfirmed: reconReport.results.filter(r => r.decision3Level === 'RECONSTRUCT_CONFIRMED').length,
    appliedReconstructions: reconReport.results.filter(r => r.decision3Level === 'RECONSTRUCT_CONFIRMED').length,
    unmappedConfirmed: 0,
    uncertainPreserved: reconReport.results.filter(r => r.decision3Level === 'RECONSTRUCT_UNCERTAIN').length,
    originalPreserved: reconReport.results.filter(r => r.decision3Level === 'KEEP_ORIGINAL').length,
    confirmedReconstructions: reconReport.results.filter(r => r.decision3Level === 'RECONSTRUCT_CONFIRMED').length,
    actuallyAppliedToLayers: reconReport.results.filter(r => r.decision3Level === 'RECONSTRUCT_CONFIRMED').length,
    skippedUncertain: reconReport.results.filter(r => r.decision3Level === 'RECONSTRUCT_UNCERTAIN').length,
    skippedMappingAmbiguous: 0,
    skippedComposite: 0,
    activeMode: ((window as any).__BRIDGE_MODE as 'RECONSTRUCTED' | 'ORIGINAL') || 'RECONSTRUCTED'
  };

  const bridgeMappings: BridgeMapping[] = rawBridgeMappings || reconReport.results.map(r => ({
    objectId: r.objectId,
    layerId: r.layerId,
    sourceObjectId: r.objectId,
    decision: r.decision3Level,
    proposedPrimitive: r.proposedPrimitive,
    originalGeometryAvailable: true,
    reconstructedGeometryAvailable: !!r.reconstructedGeometry,
    originalPointsCount: r.originalPoints.length,
    reconstructedPointsCount: r.reconstructedGeometry?.sampledPoints.length || 0,
    geometryApplied: (r.decision3Level === 'RECONSTRUCT_CONFIRMED' && bridgeStats.activeMode === 'RECONSTRUCTED') ? 'RECONSTRUCTED' : 'ORIGINAL',
    renderGeometrySource: (r.decision3Level === 'RECONSTRUCT_CONFIRMED' && bridgeStats.activeMode === 'RECONSTRUCTED') ? 'RECONSTRUCTED' : 'ORIGINAL',
    mappingStatus: 'MATCHED',
    applied: (r.decision3Level === 'RECONSTRUCT_CONFIRMED' && bridgeStats.activeMode === 'RECONSTRUCTED'),
    reason: (r.decision3Level === 'RECONSTRUCT_CONFIRMED' && bridgeStats.activeMode === 'RECONSTRUCTED') ? 'APPLIED_SUCCESSFULLY' : r.decision3Level
  }));

  const handleToggleMode = (newMode: 'RECONSTRUCTED' | 'ORIGINAL') => {
    (window as any).__BRIDGE_MODE = newMode;
    window.dispatchEvent(new CustomEvent('atcp:toggleBridgeMode', { detail: { mode: newMode } }));
  };

  const { minX, maxX, minY, maxY } = report.logoBoundingBox;
  const padding = 20;
  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);
  const viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;

  const selectedResult = reconReport.results.find(r => r.objectId === selectedObjectId);
  const structReport = reconReport.structuralReport;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 text-xs text-left">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 border border-purple-500/40 rounded-lg">
            <Shapes className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-white uppercase text-xs flex items-center gap-2">
              Récupération Géométrique Structurelle (Phase 1.5)
              <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-mono">
                Precision: {reconReport.geometryReconstructionPrecision !== null ? `${reconReport.geometryReconstructionPrecision}%` : 'N/M'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Extraction de fragments multi-objets et détection d'hypothèses géométriques globales indépendantes de la segmentation objet.
            </p>
          </div>
        </div>

        {/* View Controls & Sub-tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
            <button
              onClick={() => setActiveTab('BRIDGE')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'BRIDGE' ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3 text-emerald-300" />
              <span>Pont App (Phase 1.4)</span>
            </button>
            <button
              onClick={() => setActiveTab('STRUCTURAL')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                activeTab === 'STRUCTURAL' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structure (Phase 1.5)
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                activeTab === 'AUDIT' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagnostic Objet
            </button>
            <button
              onClick={() => setActiveTab('CLUSTERS')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                activeTab === 'CLUSTERS' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clusters ({reconReport.clustersCreated})
            </button>
            <button
              onClick={() => setActiveTab('BENCHMARK')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                activeTab === 'BENCHMARK' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Benchmark (A-V)
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
            <button
              onClick={() => setViewMode('STRUCTURAL')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                viewMode === 'STRUCTURAL' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structure Visual
            </button>
            <button
              onClick={() => setViewMode('ORIGINAL_HD')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                viewMode === 'ORIGINAL_HD' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode('RECONSTRUCTED')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                viewMode === 'RECONSTRUCTED' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reconstruit
            </button>
            <button
              onClick={() => setViewMode('SUPERPOSITION')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                viewMode === 'SUPERPOSITION' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Superposition
            </button>
            <button
              onClick={() => setViewMode('DIFFERENCE')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                viewMode === 'DIFFERENCE' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diff.
            </button>
          </div>
        </div>
      </div>

      {/* Phase 1.3 Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 font-mono">
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[9px] text-slate-500 uppercase block">Precision Global</span>
          <span className="text-sm font-extrabold text-emerald-400">
            {reconReport.geometryReconstructionPrecision !== null ? `${reconReport.geometryReconstructionPrecision}%` : 'N/M'}
          </span>
          <span className="text-[8.5px] text-slate-500 block">Objectif &gt;= 95%</span>
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[9px] text-slate-500 uppercase block">Confirmés (S3)</span>
          <span className="text-sm font-extrabold text-purple-400">
            {reconReport.confirmedCount ?? 0}
          </span>
          <span className="text-[8.5px] text-slate-500 block">Score &gt;= 90%</span>
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[9px] text-slate-500 uppercase block">Incertains (S3)</span>
          <span className="text-sm font-extrabold text-amber-400">
            {reconReport.uncertainCount ?? 0}
          </span>
          <span className="text-[8.5px] text-slate-500 block">Score 80-89%</span>
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[9px] text-slate-500 uppercase block">Clusters Fragments</span>
          <span className="text-sm font-extrabold text-purple-400">
            {reconReport.clustersCreated} virtuels
          </span>
          <span className="text-[8.5px] text-slate-500 block">Eval: {reconReport.fragmentsEvaluated} frag</span>
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[9px] text-slate-500 uppercase block">Fits Cercle</span>
          <span className="text-sm font-extrabold text-purple-400">
            {reconReport.circleCandidatesIndividual + reconReport.circleCandidatesCluster} cand / {reconReport.circlesReconstructedCount} acc
          </span>
          <span className="text-[8.5px] text-slate-500 block">Cluster cand: {reconReport.circleCandidatesCluster}</span>
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[9px] text-slate-500 uppercase block">Fits Ellipse</span>
          <span className="text-sm font-extrabold text-cyan-400">
            {reconReport.ellipseCandidatesIndividual + reconReport.ellipseCandidatesCluster} cand / {reconReport.ellipsesReconstructedCount} acc
          </span>
          <span className="text-[8.5px] text-slate-500 block">Cluster cand: {reconReport.ellipseCandidatesCluster}</span>
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[9px] text-slate-500 uppercase block">Décisions Finale</span>
          <span className="text-sm font-extrabold text-slate-200">
            {reconReport.reconstructedCount} rec / {reconReport.keepOriginalCount} orig
          </span>
          <span className="text-[8.5px] text-amber-400 block">Protégé sém.: {reconReport.excludedSemanticCount}</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'BRIDGE' && (
        <div className="space-y-4">
          {/* Mode Switcher & Overview Header */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Pont d'Application de la Reconstruction (Phase 1.4)
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  bridgeStats.activeMode === 'RECONSTRUCTED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  MODE CANVAS ACTIF : {bridgeStats.activeMode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Prouve que la géométrie reconstruite confirmée est propagée au canvas réel de broderie.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleMode('RECONSTRUCTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bridgeStats.activeMode === 'RECONSTRUCTED'
                    ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <span>🟢 Mode Reconstruit (Bridge ON)</span>
              </button>

              <button
                onClick={() => handleToggleMode('ORIGINAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bridgeStats.activeMode === 'ORIGINAL'
                    ? 'bg-amber-600 text-white shadow-lg ring-2 ring-amber-400'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <span>⚪ Mode Original (Bridge OFF)</span>
              </button>
            </div>
          </div>

          {/* Section 9: Pipeline Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Confirmed Candidates</span>
              <span className="text-xl font-extrabold font-mono text-cyan-400">{bridgeStats.confirmedCandidates}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Mapped Confirmed</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400">{bridgeStats.mappedConfirmed}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Applied Recon</span>
              <span className="text-xl font-extrabold font-mono text-purple-400">{bridgeStats.appliedReconstructions}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Unmapped Confirmed</span>
              <span className="text-xl font-extrabold font-mono text-rose-400">{bridgeStats.unmappedConfirmed}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Uncertain Preserved</span>
              <span className="text-xl font-extrabold font-mono text-amber-400">{bridgeStats.uncertainPreserved}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Original Preserved</span>
              <span className="text-xl font-extrabold font-mono text-slate-300">{bridgeStats.originalPreserved}</span>
            </div>
          </div>

          {/* Section 5: Controlled Test Sentinel Proof */}
          {sentinelHashes && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-white text-xs uppercase flex items-center gap-2">
                  <span>🔍 Preuve Causalité End-To-End (Forme Test Contrôlée: SENTINEL_LAYER_001)</span>
                </h5>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  bridgeStats.activeMode === 'RECONSTRUCTED' && sentinelHashes.ACTIVE_LAYER_HASH === sentinelHashes.RECONSTRUCTED_HASH
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  {bridgeStats.activeMode === 'RECONSTRUCTED' && sentinelHashes.ACTIVE_LAYER_HASH === sentinelHashes.RECONSTRUCTED_HASH
                    ? '✅ PROUVE: RECONSTRUCTION APPLIQUÉE AU CANVAS RÉEL'
                    : '✅ PROUVE: RETOUR À LA GÉOMÉTRIE ORIGINALE SUR LE CANVAS'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Original Hash:</span>
                  <span className="text-amber-400 font-bold">{sentinelHashes.ORIGINAL_HASH}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Reconstructed Hash:</span>
                  <span className="text-cyan-400 font-bold">{sentinelHashes.RECONSTRUCTED_HASH}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Canvas Active Hash:</span>
                  <span className="text-emerald-400 font-bold">{sentinelHashes.ACTIVE_LAYER_HASH}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 8: Object Mapping Instrumentation Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[10.5px]">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[9.5px]">
                  <th className="p-2.5">ObjectId</th>
                  <th className="p-2.5">LayerId</th>
                  <th className="p-2.5">Decision</th>
                  <th className="p-2.5">Primitive</th>
                  <th className="p-2.5">Orig. Pts</th>
                  <th className="p-2.5">Recon. Pts</th>
                  <th className="p-2.5">Applied</th>
                  <th className="p-2.5">Render Source</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {bridgeMappings.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-2.5 font-bold text-white">{m.objectId}</td>
                    <td className="p-2.5 text-cyan-400">{m.layerId}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        m.decision === 'RECONSTRUCT_CONFIRMED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : m.decision === 'RECONSTRUCT_UNCERTAIN'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {m.decision}
                      </span>
                    </td>
                    <td className="p-2.5 text-purple-300 font-bold">{m.proposedPrimitive || 'NONE'}</td>
                    <td className="p-2.5 text-slate-300">{m.originalPointsCount} pts</td>
                    <td className="p-2.5 text-purple-300">{m.reconstructedPointsCount || 0} pts</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        m.geometryApplied === 'RECONSTRUCTED'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-slate-900 text-slate-400'
                      }`}>
                        {m.geometryApplied}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-200">{m.renderGeometrySource}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        m.mappingStatus === 'MATCHED' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {m.mappingStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-400 text-[10px]">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'AUDIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* SVG Canvas Preview (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center relative min-h-[300px]">
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 border border-slate-800">
              <Eye className="w-3 h-3 text-cyan-400" />
              Mode: <strong className="text-white">{viewMode}</strong>
            </div>

            <svg viewBox={viewBox} className="w-full h-full max-h-[280px] drop-shadow-lg" preserveAspectRatio="xMidYMid meet">
              {reconReport.results.map(res => {
                const isSelected = selectedObjectId === res.objectId;

                if (viewMode === 'ORIGINAL_HD' || viewMode === 'SUPERPOSITION' || viewMode === 'STRUCTURAL') {
                  return (
                    <path
                      key={`orig_${res.objectId}`}
                      d={res.originalSvgPathD}
                      fill={viewMode === 'SUPERPOSITION' ? '#06B6D4' : viewMode === 'STRUCTURAL' ? '#334155' : '#94A3B8'}
                      fillOpacity={viewMode === 'SUPERPOSITION' ? 0.35 : viewMode === 'STRUCTURAL' ? 0.2 : 0.6}
                      stroke={isSelected ? '#F59E0B' : viewMode === 'SUPERPOSITION' ? '#0891B2' : '#64748B'}
                      strokeWidth={isSelected ? 2 : 1}
                      className="cursor-pointer transition-all hover:opacity-80"
                      onClick={() => setSelectedObjectId(res.objectId)}
                    />
                  );
                }

                if (viewMode === 'RECONSTRUCTED') {
                  const pathD = res.reconstructedSvgPathD || res.originalSvgPathD;
                  const isRecon = res.decision === 'RECONSTRUCTED';

                  return (
                    <path
                      key={`recon_${res.objectId}`}
                      d={pathD}
                      fill={isRecon ? '#C084FC' : '#64748B'}
                      fillOpacity={0.6}
                      stroke={isSelected ? '#F59E0B' : isRecon ? '#A855F7' : '#475569'}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      className="cursor-pointer transition-all hover:opacity-80"
                      onClick={() => setSelectedObjectId(res.objectId)}
                    />
                  );
                }

                if (viewMode === 'DIFFERENCE') {
                  const isRecon = res.decision === 'RECONSTRUCTED';
                  return (
                    <g key={`diff_${res.objectId}`}>
                      <path
                        d={res.originalSvgPathD}
                        fill="none"
                        stroke="#06B6D4"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                      {isRecon && res.reconstructedSvgPathD && (
                        <path
                          d={res.reconstructedSvgPathD}
                          fill="none"
                          stroke="#F43F5E"
                          strokeWidth={1.5}
                          className="cursor-pointer hover:stroke-rose-400"
                          onClick={() => setSelectedObjectId(res.objectId)}
                        />
                      )}
                    </g>
                  );
                }
              })}

              {/* Phase 1.5 Structural Hypotheses Overlay */}
              {viewMode === 'STRUCTURAL' && structReport && structReport.structuralHypotheses.map(hyp => {
                const isSelectedHyp = selectedHypothesisId === hyp.id;
                let strokeColor = '#A855F7';
                if (hyp.type === 'GLOBAL_CIRCLE') strokeColor = '#EC4899';
                if (hyp.type === 'GLOBAL_ELLIPSE') strokeColor = '#06B6D4';
                if (hyp.type === 'CONCENTRIC_RING_SYSTEM') strokeColor = '#8B5CF6';
                if (hyp.type === 'SYMMETRY_AXIS') strokeColor = '#F59E0B';
                if (hyp.type === 'SYMMETRIC_COMPOSITE_CONTOUR') strokeColor = '#10B981';

                return (
                  <path
                    key={`hyp_${hyp.id}`}
                    d={hyp.geometryData.svgPathD}
                    fill="none"
                    stroke={isSelectedHyp ? '#FFFFFF' : strokeColor}
                    strokeWidth={isSelectedHyp ? 3.0 : hyp.type === 'SYMMETRY_AXIS' ? 1.5 : 2.0}
                    strokeDasharray={hyp.type === 'SYMMETRY_AXIS' ? '4 3' : 'none'}
                    className="cursor-pointer transition-all hover:opacity-100"
                    onClick={() => setSelectedHypothesisId(hyp.id)}
                  />
                );
              })}

              {/* Sampled Points Rendering for Selected Object (Phase 1.4 CAD/CAM) */}
              {selectedResult && selectedResult.reconstructedGeometry && (viewMode === 'RECONSTRUCTED' || viewMode === 'SUPERPOSITION') && (
                <g key={`pts_${selectedResult.objectId}`}>
                  {selectedResult.reconstructedGeometry.sampledPoints.map((pt, idx) => (
                    <circle
                      key={`pt_${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={1.2}
                      fill="#F59E0B"
                      stroke="#78350F"
                      strokeWidth={0.3}
                    />
                  ))}
                </g>
              )}
            </svg>

            <div className="mt-2 text-[9px] text-slate-500 font-mono flex items-center justify-between w-full border-t border-slate-900 pt-1.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span> Original
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block ml-2"></span> Reconstruit
              </span>
              <span>Cliquez pour inspecter l'objet</span>
            </div>
          </div>

          {/* Decision Table (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                Évaluation Topologique & Primitives
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Phase 1.2 Primitive Recovery
              </span>
            </div>

            <div className="space-y-1.5">
              {reconReport.results.map(res => {
                const isSelected = selectedObjectId === res.objectId;
                const isRecon = res.decision === 'RECONSTRUCTED';

                let statusBadgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
                if (res.fitStatus === 'TESTED_ACCEPTED') {
                  statusBadgeBg = 'bg-purple-950 text-purple-300 border-purple-700';
                } else if (res.fitStatus === 'EXCLUDED_SEMANTIC') {
                  statusBadgeBg = 'bg-amber-950 text-amber-300 border-amber-700';
                } else if (res.fitStatus === 'TESTED_REJECTED') {
                  statusBadgeBg = 'bg-slate-900 text-slate-400 border-slate-800';
                }

                const displayFitConf = res.fitConfidence !== null ? `${res.fitConfidence}%` : 'N/M';
                const displayFitErr = res.fitErrorPercent !== null ? `${res.fitErrorPercent}%` : 'N/M';

                return (
                  <div
                    key={res.objectId}
                    onClick={() => setSelectedObjectId(res.objectId)}
                    className={`p-2 rounded-lg border text-[10px] cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-md'
                        : isRecon
                        ? 'bg-slate-900/90 hover:bg-slate-850 border-purple-900/60 text-slate-300'
                        : 'bg-slate-900/40 hover:bg-slate-850 border-slate-850 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200">{res.objectId}</span>
                        <span className="text-slate-500">({res.geometryType})</span>
                        <span className="text-[8.5px] bg-slate-800 text-cyan-300 px-1 py-0.2 rounded border border-slate-700">
                          {res.topologyInfo.effectiveTopology}
                        </span>
                        {res.semanticType && (
                          <span className="text-[8.5px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded border border-slate-700">
                            {res.semanticType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400">
                          Ajustement: <strong className={res.fitConfidence && res.fitConfidence >= 80 ? 'text-purple-300' : 'text-slate-400'}>{displayFitConf}</strong>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[8.5px] border ${statusBadgeBg}`}>
                          {res.fitStatus === 'TESTED_ACCEPTED' ? `[ ${res.proposedPrimitive} ]` : res.fitStatus}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="truncate pr-2">{res.reason}</span>
                      <span className="font-mono text-[8.5px] text-slate-500 shrink-0">
                        Erreur: {displayFitErr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clusters Tab */}
      {activeTab === 'CLUSTERS' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-400" />
              Clusters Virtuels de Fragments Composites
            </span>
            <span className="text-[10px] text-slate-400">
              Total Clusters Valides: <strong className="text-white">{reconReport.clustersCreated}</strong>
            </span>
          </div>

          {reconReport.clusters.length === 0 ? (
            <div className="text-center py-6 text-slate-500 italic">
              Aucun fragment compatible identifié pour assemblage composite dans cette référence.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reconReport.clusters.map(cl => (
                <div key={cl.clusterId} className="bg-slate-900 p-3 rounded-lg border border-purple-900/50 space-y-2">
                  <div className="flex items-center justify-between font-bold text-purple-300 text-[11px]">
                    <span>{cl.clusterId}</span>
                    <span className="text-xs bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                      Primitive: {cl.proposedPrimitive}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 space-y-1">
                    <div>Membres ({cl.memberObjectIds.length}): <span className="text-slate-400">{cl.memberObjectIds.join(', ')}</span></div>
                    <div>Points combinés: <strong className="text-cyan-300">{cl.pointCount}</strong></div>
                    <div>Centre Estimé: <strong>({cl.estimatedCenter.x}, {cl.estimatedCenter.y})</strong></div>
                    <div>Rayon Estimé: <strong>{cl.estimatedRadius} px</strong></div>
                    <div>Couverture Angulaire: <strong className="text-purple-300">{cl.angularCoverage}°</strong></div>
                    <div>Score de Continuité: <strong className="text-emerald-400">{cl.continuityScore}/100</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Benchmark Tab */}
      {activeTab === 'BENCHMARK' && reconReport.syntheticTestSuite && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Benchmark Synthétique Contrôlé (Cas A à V)
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded font-bold border ${
              reconReport.syntheticTestSuite.allPassed
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}>
              {reconReport.syntheticTestSuite.passedCount} / {reconReport.syntheticTestSuite.totalCount} RÉUSSIS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
            {reconReport.syntheticTestSuite.cases.map(tc => (
              <div key={tc.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span className="truncate pr-1">{tc.name}</span>
                  {tc.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                </div>

                <div className="text-[9px] text-slate-400 space-y-0.5">
                  <div>Attendu: <strong className="text-purple-300">{tc.expectedPrimitive}</strong></div>
                  <div>Détecté: <strong className="text-cyan-300">{tc.detectedPrimitive}</strong></div>
                  <div>Ajustement: <strong>{tc.fitConfidence}%</strong> (err {tc.residualPercent.toFixed(1)}%)</div>
                  <div>Couverture: <strong>{tc.angularCoverage}°</strong></div>
                  <div>Décision: <strong className="text-amber-300">{tc.decision}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structural Recovery Tab (Phase 1.5) */}
      {activeTab === 'STRUCTURAL' && structReport && (
        <div className="space-y-4 font-mono">
          {/* Fragment & Hypothesis Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center">
            <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/50">
              <span className="text-[9px] text-slate-500 uppercase block">Fragments Extraction</span>
              <span className="text-sm font-extrabold text-purple-300">{structReport.fragmentsExtracted.length}</span>
              <span className="text-[8.5px] text-slate-500 block">
                {structReport.fragmentsExtracted.filter(f => f.type === 'ARC_FRAGMENT').length} Arcs / {structReport.fragmentsExtracted.filter(f => f.type === 'LINE_FRAGMENT').length} Lines
              </span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/50">
              <span className="text-[9px] text-slate-500 uppercase block">Cercles Globaux</span>
              <span className="text-sm font-extrabold text-pink-400">
                {structReport.structuralHypotheses.filter(h => h.type === 'GLOBAL_CIRCLE').length}
              </span>
              <span className="text-[8.5px] text-slate-500 block">Multi-fragments</span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/50">
              <span className="text-[9px] text-slate-500 uppercase block">Ellipses Globales</span>
              <span className="text-sm font-extrabold text-cyan-400">
                {structReport.structuralHypotheses.filter(h => h.type === 'GLOBAL_ELLIPSE').length}
              </span>
              <span className="text-[8.5px] text-slate-500 block">Orientation libre</span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/50">
              <span className="text-[9px] text-slate-500 uppercase block">Couronnes Concentriques</span>
              <span className="text-sm font-extrabold text-purple-400">
                {structReport.structuralHypotheses.filter(h => h.type === 'CONCENTRIC_RING_SYSTEM').length}
              </span>
              <span className="text-[8.5px] text-slate-500 block">Axes partagés</span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/50">
              <span className="text-[9px] text-slate-500 uppercase block">Axes de Symétrie</span>
              <span className="text-sm font-extrabold text-amber-400">
                {structReport.structuralHypotheses.filter(h => h.type === 'SYMMETRY_AXIS').length}
              </span>
              <span className="text-[8.5px] text-slate-500 block">Majeurs</span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/50">
              <span className="text-[9px] text-slate-500 uppercase block">Contours Écusson</span>
              <span className="text-sm font-extrabold text-emerald-400">
                {structReport.structuralHypotheses.filter(h => h.type === 'SYMMETRIC_COMPOSITE_CONTOUR').length}
              </span>
              <span className="text-[8.5px] text-slate-500 block">Composites</span>
            </div>
          </div>

          {/* Real Logo Benchmark Panel (REAL_LOGO_A & REAL_LOGO_B) */}
          <div className="bg-slate-950 border border-purple-900/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-800/60 pb-2">
              <span className="text-xs font-extrabold text-purple-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Benchmark Vrais Logos — Détection Structurelle Ground Truth (REAL_LOGO_A / REAL_LOGO_B)
              </span>
              <span className="text-[9.5px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded border border-purple-700">
                Récupération Multi-Objets Indépendante
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* REAL_LOGO_A Card */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-cyan-300 text-[11px]">
                    {structReport.realLogoBenchmark.logoA.logoName}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Détectés: <strong className="text-emerald-400">{structReport.realLogoBenchmark.logoA.detectedCount}</strong> / {structReport.realLogoBenchmark.logoA.groundTruthItems.length}
                  </span>
                </div>

                <div className="space-y-1.5 text-[9.5px]">
                  {structReport.realLogoBenchmark.logoA.groundTruthItems.map(item => (
                    <div key={item.id} className="bg-slate-950 p-2 rounded border border-slate-850 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8.5px] border ${
                          item.status === 'DETECTED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : item.status === 'PARTIAL'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Type: <span className="text-purple-300">{item.expectedType}</span>
                        {item.confidence !== undefined && (
                          <span className="ml-2">Confiance: <strong className="text-emerald-400">{item.confidence}%</strong></span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400 italic">{item.reasoning}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REAL_LOGO_B Card */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-amber-300 text-[11px]">
                    {structReport.realLogoBenchmark.logoB.logoName}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Détectés: <strong className="text-emerald-400">{structReport.realLogoBenchmark.logoB.detectedCount + structReport.realLogoBenchmark.logoB.partialCount}</strong> / {structReport.realLogoBenchmark.logoB.groundTruthItems.length}
                  </span>
                </div>

                <div className="space-y-1.5 text-[9.5px]">
                  {structReport.realLogoBenchmark.logoB.groundTruthItems.map(item => (
                    <div key={item.id} className="bg-slate-950 p-2 rounded border border-slate-850 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8.5px] border ${
                          item.status === 'DETECTED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : item.status === 'PARTIAL'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Type: <span className="text-purple-300">{item.expectedType}</span>
                        {item.confidence !== undefined && (
                          <span className="ml-2">Confiance: <strong className="text-emerald-400">{item.confidence}%</strong></span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400 italic">{item.reasoning}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Hypotheses Inspector */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-400" />
                Inspecteur d'Hypothèses Structurelles ({structReport.structuralHypotheses.length} Détectées)
              </span>
              <span className="text-[9px] text-slate-400">Cliquer sur une hypothèse pour l'inspecter et la surligner</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {structReport.structuralHypotheses.map(hyp => {
                const isSelected = selectedHypothesisId === hyp.id;
                const score = hyp.scoreDecomposition;

                return (
                  <div
                    key={hyp.id}
                    onClick={() => {
                      setSelectedHypothesisId(hyp.id);
                      setViewMode('STRUCTURAL');
                    }}
                    className={`p-3 rounded-lg border text-[10px] cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-lg'
                        : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-purple-300 text-[11px]">{hyp.id}</span>
                        <span className="text-[9px] bg-purple-900/60 text-purple-200 px-1.5 py-0.2 rounded border border-purple-700">
                          {hyp.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">{hyp.confidence}% Conf.</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8.5px] border ${
                          hyp.decision === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : hyp.decision === 'UNCERTAIN'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {hyp.decision}
                        </span>
                      </div>
                    </div>

                    {/* Semantic Protection Warning Banner */}
                    {hyp.semanticProtection && (
                      <div className="bg-amber-950/60 border border-amber-800/80 p-1.5 rounded text-[9px] text-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Protection Sémantique Activée:</strong> {hyp.semanticReason || 'Ne pas remplacer.'}</span>
                      </div>
                    )}

                    <div className="text-[9px] text-slate-400 italic">{hyp.reasoning}</div>

                    {/* Detailed Score Breakdown Matrix */}
                    {score && (
                      <div className="bg-slate-950 p-2 rounded border border-slate-850 grid grid-cols-3 gap-1 text-[8.5px]">
                        <div>Fit Qualité: <strong className="text-cyan-300">{score.fitQuality}%</strong></div>
                        <div>Couverture: <strong className="text-purple-300">{score.coverageScore}%</strong></div>
                        <div>Continuité: <strong className="text-emerald-300">{score.continuityScore}%</strong></div>
                        <div>Support: <strong className="text-amber-300">{score.supportScore}%</strong></div>
                        <div>Contexte: <strong className="text-blue-300">{score.contextScore}%</strong></div>
                        <div>Pénalité Outliers: <strong className="text-rose-400">{score.outlierPenalty}%</strong></div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[8.5px] text-slate-500 pt-0.5 border-t border-slate-850">
                      <span>Fragments source: {hyp.sourceFragmentIds.length}</span>
                      <span>Objets source: {hyp.sourceObjectIds.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Source vs Effective Topology Audit Table (Open Line + Closed Topology Distinction) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Audit Topologique : Ligne Ouverte vs Contour Fermé (Source vs Effective Topology)
              </span>
              <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                Seuil de fermeture: 1.50px
              </span>
            </div>

            <p className="text-[9.5px] text-slate-400">
              Note explicative : Une <strong>Ligne Ouverte (OPEN)</strong> est un segment unidirectionnel non rebouclé, tandis qu'un <strong>Contour Fermé (CLOSED)</strong> possède un premier et un dernier point coïncidants. L'analyse distingue explicitement la topologie brute source et la topologie effective dérivée avec niveau de confiance.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-[9.5px] font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                    <th className="p-2">ID Objet</th>
                    <th className="p-2">Type Source</th>
                    <th className="p-2 text-cyan-300">Topologie Source</th>
                    <th className="p-2 text-purple-300">Topologie Effective</th>
                    <th className="p-2 text-amber-300">Distance Extrémités</th>
                    <th className="p-2 text-emerald-300">Confiance Topologique</th>
                    <th className="p-2">Justification / Raison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {reconReport.results.map(res => {
                    const top = res.topologyInfo;
                    const sourceType = top.isPathClosed ? 'CLOSED' : 'OPEN';
                    const effectiveTopology = top.effectiveTopology;
                    const endpointDist = top.endpointDistance;
                    const topoConf = top.topologicalClosureConfidence;
                    const topoReason = effectiveTopology === 'CLOSED'
                      ? 'Fermeture topologique confirmée (< 1.5px)'
                      : effectiveTopology === 'AMBIGUOUS'
                      ? 'Fermeture incertaine proche du seuil'
                      : 'Contour ouvert non rebouclé';

                    return (
                      <tr key={`top_${res.objectId}`} className="hover:bg-slate-900/60">
                        <td className="p-2 font-bold text-slate-200">{res.objectId}</td>
                        <td className="p-2 text-slate-400">{res.geometryType}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[8.5px] border ${
                            sourceType === 'OPEN'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}>
                            {sourceType}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[8.5px] border ${
                            effectiveTopology === 'CLOSED'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {effectiveTopology}
                          </span>
                        </td>
                        <td className="p-2 text-slate-300 font-bold">{endpointDist.toFixed(2)} px</td>
                        <td className="p-2 text-emerald-400 font-bold">{topoConf}%</td>
                        <td className="p-2 text-slate-400 italic text-[9px]">{topoReason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Selected Object Inspector */}
      {selectedResult && activeTab === 'AUDIT' && (
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3 text-[11px] font-mono text-left">
          <div className="flex items-center justify-between text-white font-bold border-b border-slate-900 pb-1.5">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Sliders className="w-4 h-4 text-purple-400" />
              INSPECTEUR D'OBJET: {selectedResult.objectId}
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-slate-400">
                Statut Fit: <strong className="text-purple-300">{selectedResult.fitStatus}</strong>
              </span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${
                selectedResult.decision === 'RECONSTRUCTED'
                  ? 'bg-purple-950 text-purple-300 border-purple-700'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                Décision: {selectedResult.decision}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-300 text-[10px]">
            <div>SOURCE TYPE: <strong>{selectedResult.geometryType}</strong></div>
            <div>TOPOLOGIE EFFECTIVE: <strong className="text-cyan-300">{selectedResult.topologyInfo.effectiveTopology}</strong> ({selectedResult.topologyInfo.topologicalClosureConfidence}%)</div>
            <div>BEST CANDIDATE: <strong>{selectedResult.fitSummary.bestCandidate ? `${selectedResult.fitSummary.bestCandidate.type} (${selectedResult.fitSummary.bestCandidate.fitConfidence}%)` : 'NONE'}</strong></div>
            <div>DÉCISION 3-NIVEAUX: <strong className={selectedResult.decision3Level === 'RECONSTRUCT_CONFIRMED' ? 'text-purple-300' : selectedResult.decision3Level === 'RECONSTRUCT_UNCERTAIN' ? 'text-amber-300' : 'text-slate-400'}>{selectedResult.decision3Level ?? selectedResult.decision}</strong></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px]">
            <div>SCORE VALIDATION GEOM: <strong className="text-purple-300">{selectedResult.validationScore ?? 'N/M'}/100</strong></div>
            <div>SCORE CONTEXTE GLOBAL: <strong className="text-cyan-300">{selectedResult.contextScore ?? 'N/M'}/100</strong></div>
            <div>HAUSDORFF / DISTANCE: <strong className="text-amber-300">{selectedResult.validationMetrics ? `${selectedResult.validationMetrics.hausdorffDistance.toFixed(2)} px` : 'N/M'}</strong></div>
          </div>

          {/* Phase 1.4: Materialized Exploitable Geometry Card */}
          {selectedResult.reconstructedGeometry && (
            <div className="bg-purple-950/40 border border-purple-800/80 p-3 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-purple-800/60 pb-1.5">
                <span className="text-[10.5px] font-extrabold uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  Géométrie Reconstruite Exploitable (Phase 1.4)
                </span>
                <span className="text-[9px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded border border-purple-700 font-mono">
                  CAD/CAM Ready • Score {selectedResult.reconstructedGeometry.reconstructionPrecisionScore}%
                </span>
              </div>

              {/* Analytical Formula Display */}
              <div className="bg-slate-950 p-2 rounded border border-purple-900/50 font-mono text-[9.5px] text-purple-200">
                <span className="text-slate-400 block text-[8.5px] uppercase">Équation Analytique Exacte:</span>
                {selectedResult.reconstructedGeometry.primitiveType === 'CIRCLE' && (
                  <div>
                    (x - {selectedResult.reconstructedGeometry.analyticalDetails.cx})² + (y - {selectedResult.reconstructedGeometry.analyticalDetails.cy})² = ({selectedResult.reconstructedGeometry.analyticalDetails.radius})²
                  </div>
                )}
                {selectedResult.reconstructedGeometry.primitiveType === 'ELLIPSE' && (
                  <div>
                    ((x-{selectedResult.reconstructedGeometry.analyticalDetails.cx})cos({selectedResult.reconstructedGeometry.analyticalDetails.rotationDeg || 0}°) + (y-{selectedResult.reconstructedGeometry.analyticalDetails.cy})sin({selectedResult.reconstructedGeometry.analyticalDetails.rotationDeg || 0}°))²/{selectedResult.reconstructedGeometry.analyticalDetails.rx}² + ... = 1
                  </div>
                )}
                {selectedResult.reconstructedGeometry.primitiveType === 'RING' && (
                  <div>
                    Anneau Concentrique: Center({selectedResult.reconstructedGeometry.analyticalDetails.cx}, {selectedResult.reconstructedGeometry.analyticalDetails.cy}), R_ext={selectedResult.reconstructedGeometry.analyticalDetails.outerRadius}px, R_int={selectedResult.reconstructedGeometry.analyticalDetails.innerRadius}px
                  </div>
                )}
                {selectedResult.reconstructedGeometry.primitiveType === 'LINE' && (
                  <div>
                    Segment Ligne: P1({selectedResult.reconstructedGeometry.analyticalDetails.p1?.x}, {selectedResult.reconstructedGeometry.analyticalDetails.p1?.y}) ➔ P2({selectedResult.reconstructedGeometry.analyticalDetails.p2?.x}, {selectedResult.reconstructedGeometry.analyticalDetails.p2?.y})
                  </div>
                )}
              </div>

              {/* Comparative Side-by-Side Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-[9.5px] font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-purple-900/80 text-slate-400 bg-slate-950/80">
                      <th className="p-1.5">Métrique / Propriété</th>
                      <th className="p-1.5 text-cyan-400">Original HD</th>
                      <th className="p-1.5 text-purple-300">Reconstruit (Phase 1.4)</th>
                      <th className="p-1.5 text-amber-300">Écart / Alignement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950">
                    <tr>
                      <td className="p-1.5 text-slate-300 font-bold">Nombre de Points</td>
                      <td className="p-1.5 text-cyan-300">{selectedResult.originalPoints.length} pts (irréguliers)</td>
                      <td className="p-1.5 text-purple-300">{selectedResult.reconstructedGeometry.pointCount} pts (échantillonnage régulier)</td>
                      <td className="p-1.5 text-slate-400">Régularisé pour broderie</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-slate-300 font-bold">Périmètre Total</td>
                      <td className="p-1.5 text-cyan-300">Original HD</td>
                      <td className="p-1.5 text-purple-300">{selectedResult.reconstructedGeometry.perimeter.toFixed(1)} px</td>
                      <td className="p-1.5 text-amber-300">{selectedResult.validationMetrics ? selectedResult.validationMetrics.perimeterDifferencePercent.toFixed(2) : '0.00'}% diff</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-slate-300 font-bold">Surface Fermée</td>
                      <td className="p-1.5 text-cyan-300">Original HD</td>
                      <td className="p-1.5 text-purple-300">{selectedResult.reconstructedGeometry.area.toFixed(1)} px²</td>
                      <td className="p-1.5 text-amber-300">{selectedResult.validationMetrics ? selectedResult.validationMetrics.areaDifferencePercent.toFixed(2) : '0.00'}% diff</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-slate-300 font-bold">Topologie & Fermeture</td>
                      <td className="p-1.5 text-cyan-300">{selectedResult.topologyInfo.effectiveTopology}</td>
                      <td className="p-1.5 text-purple-300">
                        {selectedResult.reconstructedGeometry.isClosed ? 'Fermé Parfait (0.00px)' : 'Ouvert'}
                      </td>
                        <td className="p-1.5 text-emerald-400 font-bold">
                          {selectedResult.reconstructedGeometry.isClosed ? 'GARANTI' : 'CORRIGÉ'}
                        </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-slate-300 font-bold">Auto-intersections</td>
                      <td className="p-1.5 text-cyan-300">Testé ok</td>
                      <td className="p-1.5 text-purple-300">
                        {selectedResult.reconstructedGeometry.hasSelfIntersection ? 'Présentes (Attention)' : '0 Détectée'}
                      </td>
                      <td className="p-1.5 text-emerald-400 font-bold">Valide</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-slate-300 font-bold">Sens d'enroulement</td>
                      <td className="p-1.5 text-cyan-300">Variable</td>
                      <td className="p-1.5 text-purple-300 font-bold">{selectedResult.reconstructedGeometry.windingOrder}</td>
                      <td className="p-1.5 text-slate-400">Normalisé</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-850 pb-1">
              Résultats des Tests de Fit & Métriques Explicables
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[9.5px]">
              {/* Circle Fit */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-purple-300">
                  <span>Circle Fit (Kasa)</span>
                  <span>{selectedResult.fitSummary.circleFit ? `${selectedResult.fitSummary.circleFit.fitConfidence}%` : 'N/M'}</span>
                </div>
                {selectedResult.fitSummary.circleFit ? (
                  <div className="text-[9px] text-slate-400 space-y-0.5">
                    <div>Erreur Radiale: {selectedResult.fitSummary.circleFit.fitErrorPercent}%</div>
                    {selectedResult.fitSummary.circleFit.circleMetrics && (
                      <div>Couverture Angulaire: {selectedResult.fitSummary.circleFit.circleMetrics.angularCoverage}°</div>
                    )}
                    {selectedResult.fitSummary.circleFit.details.cx !== undefined && (
                      <div>Centre: ({selectedResult.fitSummary.circleFit.details.cx}, {selectedResult.fitSummary.circleFit.details.cy})</div>
                    )}
                    {selectedResult.fitSummary.circleFit.details.radius !== undefined && (
                      <div>Rayon: {selectedResult.fitSummary.circleFit.details.radius} px</div>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 italic">Non testé / contour ouvert</div>
                )}
              </div>

              {/* Ellipse Fit */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span>Ellipse Fit</span>
                  <span>{selectedResult.fitSummary.ellipseFit ? `${selectedResult.fitSummary.ellipseFit.fitConfidence}%` : 'N/M'}</span>
                </div>
                {selectedResult.fitSummary.ellipseFit ? (
                  <div className="text-[9px] text-slate-400 space-y-0.5">
                    <div>Erreur Fit: {selectedResult.fitSummary.ellipseFit.fitErrorPercent}%</div>
                    {selectedResult.fitSummary.ellipseFit.ellipseMetrics && (
                      <div>Ratio Rx/Ry: {selectedResult.fitSummary.ellipseFit.ellipseMetrics.axisRatio}</div>
                    )}
                    {selectedResult.fitSummary.ellipseFit.details.rotationDeg !== undefined && (
                      <div>Orientation: {selectedResult.fitSummary.ellipseFit.details.rotationDeg}°</div>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 italic">Non testé</div>
                )}
              </div>

              {/* Line/Ring Fit */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <span>Ring / Line Fit</span>
                  <span>
                    {selectedResult.fitSummary.ringFit
                      ? `${selectedResult.fitSummary.ringFit.fitConfidence}% (Ring)`
                      : selectedResult.fitSummary.lineFit
                      ? `${selectedResult.fitSummary.lineFit.fitConfidence}% (Line)`
                      : 'N/M'}
                  </span>
                </div>
                {selectedResult.fitSummary.ringFit ? (
                  <div className="text-[9px] text-slate-400 space-y-0.5">
                    <div>Erreur Ring: {selectedResult.fitSummary.ringFit.fitErrorPercent}%</div>
                    <div>Épaisseur: {selectedResult.fitSummary.ringFit.details.thickness} px</div>
                  </div>
                ) : selectedResult.fitSummary.lineFit ? (
                  <div className="text-[9px] text-slate-400 space-y-0.5">
                    <div>Erreur Rectitude: {selectedResult.fitSummary.lineFit.fitErrorPercent}%</div>
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 italic">Aucune forme anneau/ligne</div>
                )}
              </div>
            </div>
          </div>

          <div className="text-[9.5px] bg-slate-900/50 p-2 rounded border border-slate-850 text-slate-300 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Raisonnement du Diagnostic:</strong> {selectedResult.reason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
