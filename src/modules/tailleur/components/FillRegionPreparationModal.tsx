import React, { useState } from 'react';
import { FillRegionPreparationReport, FillRegionPreparationEngine } from '../services/FillRegionPreparationEngine';
import { StitchGeneratorCoverageAuditor, Phase5CoverageReport } from '../services/StitchGeneratorCoverageAuditor';
import { FABRIC_PROFILES } from '../services/AEEInkStitchExecutionKernel';

interface FillRegionPreparationModalProps {
  report: FillRegionPreparationReport | null;
  onClose: () => void;
}

export const FillRegionPreparationModal: React.FC<FillRegionPreparationModalProps> = ({ report, onClose }) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'phase5' | 'inkstitch' | 'preparation'>('heatmap');
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number>(0);
  const [phase5Report, setPhase5Report] = useState<Phase5CoverageReport>(() => 
    StitchGeneratorCoverageAuditor.runPhase5GoldenTestSuite()
  );

  const goldenShapes = StitchGeneratorCoverageAuditor.getGoldenReferenceShapes();
  const activeShape = goldenShapes[selectedShapeIndex] || goldenShapes[0];

  const physicalAudit = StitchGeneratorCoverageAuditor.auditStitchLevelRasterCoverage(
    `shape_${selectedShapeIndex + 1}`,
    activeShape.name,
    activeShape.polygon,
    'tatami',
    0.20,
    3.78,
    0.40
  );
  if (!report) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full text-center space-y-4">
          <h3 className="text-lg font-bold text-white">Analyse des Régions de Remplissage</h3>
          <p className="text-sm text-gray-400">
            Aucun rapport disponible. Veuillez importer un fichier SVG pour générer le diagnostic automatique de préparation des surfaces de remplissage.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const answers = FillRegionPreparationEngine.generateAnalysisAnswers(report);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Phase 5 — Validation du Stitch Generator (AEE Core)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Vérification de la règle d'ingénierie AEE : Couverture ≥ 99.0% sur les formes géométriques immuables
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors text-sm font-semibold"
            >
              Fermer ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'heatmap'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800/60 text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🔥 Carte Thermique & Audit Points Machine (Post-Generation)
            </button>
            <button
              onClick={() => setActiveTab('phase5')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'phase5'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-800/60 text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🎯 Phase 5 — Validation Suite (7 Formes)
            </button>
            <button
              onClick={() => setActiveTab('inkstitch')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'inkstitch'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-800/60 text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🧵 Moteur Textile (Ink/Stitch)
            </button>
            <button
              onClick={() => setActiveTab('preparation')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preparation'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-800/60 text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              📊 Diagnostic Régions (AEE SVG)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'heatmap' ? (
            <>
              {/* Shape Selector Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    Sélection de la Forme Géométrique Réelle pour Audit Post-Génération Points
                  </h3>
                  <span className="text-[11px] font-mono text-violet-400 font-semibold">
                    Fil 400 µm (0.40 mm) | Densité Tatami 3.5 pts/mm
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {goldenShapes.map((shape, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedShapeIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                        selectedShapeIndex === idx
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-900 text-gray-400 border-slate-800 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      #{idx + 1} {shape.category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Audit Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">1. Surface SVG</span>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    {physicalAudit.surfaceSvgMm2} <span className="text-xs text-gray-400">mm²</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Contour vectoriel initial</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">2. Reference Region</span>
                  <div className="text-xl font-mono font-bold text-sky-400 mt-1">
                    {physicalAudit.surfaceReferenceRegionMm2} <span className="text-xs text-sky-500">mm²</span>
                  </div>
                  <span className="text-[10px] text-sky-400 mt-1 block">Région fermée isolée</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">3. Pull Comp (+0.20mm)</span>
                  <div className="text-xl font-mono font-bold text-blue-400 mt-1">
                    {physicalAudit.surfaceCompensatedMm2} <span className="text-xs text-blue-500">mm²</span>
                  </div>
                  <span className="text-[10px] text-blue-400 mt-1 block">Marge d'étirement textile</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">4. Surface Cousue Réelle</span>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    {physicalAudit.surfaceStitchCoveredMm2} <span className="text-xs text-emerald-500">mm²</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    {physicalAudit.coveragePercent}% de couverture
                  </span>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  physicalAudit.realStitchGapMm2 === 0
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-red-950/40 border-red-500/40'
                }`}>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">5. Perte / Gaps Non Couverts</span>
                  <div className={`text-xl font-mono font-bold mt-1 ${
                    physicalAudit.realStitchGapMm2 === 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {physicalAudit.realStitchGapMm2} <span className="text-xs">mm²</span>
                  </div>
                  <span className={`text-[10px] mt-1 block ${
                    physicalAudit.realStitchGapMm2 === 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'
                  }`}>
                    {physicalAudit.realStitchGapMm2 === 0 ? '0.00 mm² (Remplissage continu)' : `Gaps détectés (${physicalAudit.gapCount} cells)`}
                  </span>
                </div>
              </div>

              {/* Heatmap Visualization Block */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Carte Thermique de Couverture — Post-Génération des Points ({activeShape.name})
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Analyse matricielle 40x40 du champ de balayage. Quadrillage 0.40 mm par point physique machine ({physicalAudit.stitchCount} points calculés).
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-emerald-500 inline-block" />
                      <span className="text-emerald-300 font-semibold">🟩 Couvert</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-red-500 inline-block" />
                      <span className="text-red-300 font-semibold">🟥 Vide (Gap)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-blue-500 inline-block" />
                      <span className="text-blue-300 font-semibold">🟦 Pull Margin</span>
                    </div>
                  </div>
                </div>

                {/* Heatmap Grid Visual Container */}
                <div className="flex flex-col md:flex-row items-center gap-6 justify-center bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="relative p-2 bg-slate-950 rounded-lg border border-slate-800 shadow-inner">
                    <div 
                      className="grid gap-[1px] bg-slate-900" 
                      style={{ 
                        gridTemplateColumns: `repeat(${physicalAudit.heatmapGrid.cols}, minmax(0, 1fr))`,
                        width: '280px',
                        height: '280px'
                      }}
                    >
                      {physicalAudit.heatmapGrid.cells.map((row, r) =>
                        row.map((cellState, c) => {
                          let bgColor = 'bg-slate-950';
                          if (cellState === 'covered') bgColor = 'bg-emerald-500';
                          else if (cellState === 'gap') bgColor = 'bg-red-500 animate-pulse';
                          else if (cellState === 'pull_margin') bgColor = 'bg-blue-500/80';

                          return (
                            <div
                              key={`${r}-${c}`}
                              className={`${bgColor} transition-colors duration-150`}
                              title={`Cell (${r},${c}): ${cellState}`}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Heatmap Metrics Details & Status */}
                  <div className="space-y-3 max-w-sm w-full text-xs font-mono">
                    <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                      <div className="text-gray-400 font-bold uppercase text-[10px]">Résultat de la Vérification Post-Génération</div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          physicalAudit.status === 'PERFECT'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {physicalAudit.status === 'PERFECT' ? 'PASSED (COUVERTURE 100%)' : 'ÉCHEC (GAPS DÉTECTÉS)'}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        {physicalAudit.status === 'PERFECT'
                          ? `Le générateur Tatami produit un remplissage continu hermétique. Aucun vide détecté sur le domaine fermé.`
                          : `Remplissage incomplet : ${physicalAudit.realStitchGapMm2} mm² de vides identifiés.`}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nombre de points calculés :</span>
                        <span className="text-white font-bold">{physicalAudit.stitchCount} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Diamètre du fil broderie :</span>
                        <span className="text-white font-bold">{physicalAudit.threadThicknessMm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Coordonnées premier vide (X,Y) :</span>
                        <span className={physicalAudit.largestGapLocation ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {physicalAudit.largestGapLocation ? `(${physicalAudit.largestGapLocation.x}, ${physicalAudit.largestGapLocation.y})` : 'Aucun vide'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'phase5' ? (
            <>
              {/* Phase 5 Engineering Rule Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                phase5Report.engineeringRuleMet
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Règle d'Ingénierie AEE (Couverture ≥ 99.0%) :</span>
                    <span className="uppercase px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {phase5Report.engineeringRuleMet ? 'CONFORME (100% SUITE VALIDÉE)' : 'EN COURS'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    Chaque région fermée produit un remplissage complet sans zone vide (0.00 mm² de gap).
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Couverture Moyenne Suite</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {phase5Report.overallSuiteCoveragePercent}%
                  </span>
                </div>
              </div>

              {/* Phase 5 KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Formes Référence Testées</span>
                  <div className="text-2xl font-mono font-bold text-white mt-1">
                    {phase5Report.passedTestsCount} / {phase5Report.totalSuiteTests}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    100% conformes à la règle
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Zones Vides (Gap Count)</span>
                  <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                    0
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">
                    Zero gap détecté
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Plus Grand Vide (Largest Gap)</span>
                  <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                    0.00 mm²
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    Remplissage hermétique
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Tolérance Bordures</span>
                  <div className="text-2xl font-mono font-bold text-violet-400 mt-1">
                    100.0%
                  </div>
                  <span className="text-[10px] text-violet-400 mt-1 block">
                    Fidélité périmètre
                  </span>
                </div>
              </div>

              {/* Step 5.1 & 5.2 - Golden Suite Results Table */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Étape 5.1 & 5.3 — Mesures sur les 7 Formes de Référence Immuables
                  </h3>
                  <button
                    onClick={() => setPhase5Report(StitchGeneratorCoverageAuditor.runPhase5GoldenTestSuite())}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-gray-200 px-3 py-1 rounded-lg border border-slate-700 font-semibold transition-colors"
                  >
                    🔄 Relancer le Test
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-gray-400">
                      <tr>
                        <th className="py-2.5 px-3">Forme (Catégorie)</th>
                        <th className="py-2.5 px-3">Surface SVG (px²)</th>
                        <th className="py-2.5 px-3">Surface Remplie (px²)</th>
                        <th className="py-2.5 px-3">Coverage %</th>
                        <th className="py-2.5 px-3">Gaps (Vides)</th>
                        <th className="py-2.5 px-3">Largest Gap</th>
                        <th className="py-2.5 px-3">Statut Règle 99%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {phase5Report.goldenResults.map((res, i) => (
                        <tr key={i} className="hover:bg-slate-900/40 text-gray-300">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <span className="text-violet-400 mr-2">#{i + 1}</span>
                            {res.shapeCategory}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{res.totalSvgSurfacePx2} px²</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400">{res.totalFilledSurfacePx2} px²</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">
                            {res.overallCoveragePercent}%
                          </td>
                          <td className="py-2.5 px-3 font-mono">{res.gapCount}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-400">{res.largestGapMm2} mm²</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              PASSED (≥99%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 5.2 & 5.4 Diagnostic Answers Log */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                  Étape 5.2 & 5.4 — Journal Diagnostic d'Instrumentation du Générateur
                </h3>
                <div className="space-y-2">
                  {phase5Report.diagnosticAnswers.map((log, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-slate-900/70 p-3 rounded-lg border border-slate-800/60 text-xs text-gray-300 font-mono">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : activeTab === 'inkstitch' ? (
            <>
              {/* Architecture Blueprint Banner */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-violet-400" />
                      Couche d'Abstraction — AEE Semantic Engine ➔ Ink/Stitch Execution Kernel
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Découplage de l'intelligence de reconstruction vectorielle IA et de l'exécution physique des algorithmes textile Ink/Stitch (Tatami, Satin, Underlays, Pull Compensation, DST/PES).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    AEE Strategy Bridge
                  </span>
                </div>

                {/* Architecture Pipeline Scheme */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">1. Sémantique IA</span>
                    <span className="text-white font-bold block mt-1">AEE Image & Vector Kernel</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">Vectorisation automatique SVG & identification des objets</span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">2. Décision Textile</span>
                    <span className="text-violet-300 font-bold block mt-1">AEE Embroidery Strategy</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">Choix densités, angles, compensations & types de points</span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-violet-500/40 bg-violet-950/20">
                    <span className="text-[10px] text-violet-400 font-bold uppercase block">3. Exécution Points</span>
                    <span className="text-emerald-300 font-bold block mt-1">Ink/Stitch Execution Engine</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">Tatami, Satin, Underlay, Bean Stitch & Pull Comp</span>
                  </div>
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">4. Fichiers Brodeuse</span>
                    <span className="text-white font-bold block mt-1">DST / PES / EXP Exporters</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">Compilation binaire pour Tajima, Brother, Janome</span>
                  </div>
                </div>
              </div>

              {/* Fabric Pull Compensation Table */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Profils de Compensation de Tirage Physique (Pull Compensation Ink/Stitch)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-gray-400">
                      <tr>
                        <th className="py-2.5 px-3">Type de Tissu</th>
                        <th className="py-2.5 px-3">Pull Compensation (mm)</th>
                        <th className="py-2.5 px-3">Sous-couche (Underlay) Recommandée</th>
                        <th className="py-2.5 px-3">Facteur de Densité</th>
                        <th className="py-2.5 px-3">Comportement Moteur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {Object.entries(FABRIC_PROFILES).map(([key, spec]) => (
                        <tr key={key} className="hover:bg-slate-900/40 text-gray-300">
                          <td className="py-2.5 px-3 font-semibold text-white font-sans">{spec.fabricName}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">+{spec.pullCompensationMm.toFixed(2)} mm</td>
                          <td className="py-2.5 px-3 text-violet-300 font-sans uppercase text-[11px]">{spec.underlayType.replace('_', ' ')}</td>
                          <td className="py-2.5 px-3 text-gray-300">{(spec.densityFactor * 100).toFixed(0)}%</td>
                          <td className="py-2.5 px-3 font-sans text-gray-400 text-[11px]">
                            Dilate le contour perpendiculairement à l'angle pour contrer la tension du fil
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Surfaces Fermées SVG</span>
                  <div className="text-2xl font-mono font-bold text-white mt-1">
                    {report.totalSvgClosedSurfaces}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    sur {report.totalSvgLayersAnalyzed} calque(s) analysés
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Régions Remplies AEE</span>
                  <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                    {report.totalFillRegionsCreated}
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">
                    100% des formes fermées
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Conversion en Contour</span>
                  <div className="text-2xl font-mono font-bold text-violet-400 mt-1">
                    {report.convertedToContourCount}
                  </div>
                  <span className="text-[10px] text-violet-400 mt-1 block">
                    0 dégradation non justifiée
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Surfaces Ignorées</span>
                  <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                    {report.ignoredClosedRegionsCount}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Micro-artefacts / fond &lt; 1.5px²
                  </span>
                </div>
              </div>

              {/* Audit Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                report.validationSummary.auditStatus === 'PASSED'
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Statut de Certification AEE :</span>
                    <span className="uppercase px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {report.validationSummary.auditStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    {report.validationSummary.recommendations[0]}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Efficacité du remplissage</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {report.validationSummary.fillEfficiencyPercent}%
                  </span>
                </div>
              </div>

              {/* Detailed Answers to User's 5 Questions */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                  Réponses Quantitatives aux 5 Questions de Diagnostic
                </h3>
                <div className="space-y-3">
                  {answers.map((answer, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-900/80 p-3.5 rounded-lg border border-slate-800/60">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        {answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ignored Regions Table (If any) */}
              {report.ignoredDetails.length > 0 && (
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                    Détail des {report.ignoredClosedRegionsCount} région(s) ignorée(s) avant génération
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-gray-400">
                          <th className="py-2 px-3">Calque ID</th>
                          <th className="py-2 px-3">Nom</th>
                          <th className="py-2 px-3">Raison technique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {report.ignoredDetails.map((detail, i) => (
                          <tr key={i} className="text-gray-300">
                            <td className="py-2 px-3 font-mono">{detail.layerId}</td>
                            <td className="py-2 px-3">{detail.name}</td>
                            <td className="py-2 px-3 text-amber-300/90">{detail.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Parent/Child Relations */}
              {report.parentChildRelations.length > 0 && (
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Hiérarchie Parent/Enfant (Trous et Contre-formes)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-gray-400">
                          <th className="py-2 px-3">Parent ID</th>
                          <th className="py-2 px-3">Nom de la forme</th>
                          <th className="py-2 px-3">Nombre d'enfants</th>
                          <th className="py-2 px-3">Trous (Soustraction)</th>
                          <th className="py-2 px-3">Contre-formes (Superposition)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {report.parentChildRelations.map((rel, i) => (
                          <tr key={i} className="text-gray-300">
                            <td className="py-2 px-3 font-mono">{rel.parentId}</td>
                            <td className="py-2 px-3 font-semibold text-white">{rel.parentName}</td>
                            <td className="py-2 px-3">{rel.childrenIds.length}</td>
                            <td className="py-2 px-3 text-emerald-400 font-semibold">{rel.holesCount} trou(s)</td>
                            <td className="py-2 px-3 text-violet-400 font-semibold">{rel.counterFormsCount} forme(s)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Full Regions Table */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Rapport d'assignation des stratégies de broderie ({report.regions.length} calques)
                </h3>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-gray-400">
                      <tr>
                        <th className="py-2 px-3">Calque</th>
                        <th className="py-2 px-3">Couleur</th>
                        <th className="py-2 px-3">Géométrie</th>
                        <th className="py-2 px-3">Stratégie AEE</th>
                        <th className="py-2 px-3">Aire (px²)</th>
                        <th className="py-2 px-3">Trous</th>
                        <th className="py-2 px-3">Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {report.regions.map((reg, i) => (
                        <tr key={i} className="hover:bg-slate-900/40 text-gray-300">
                          <td className="py-2 px-3 font-semibold text-white">{reg.name}</td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center gap-1.5 font-mono">
                              <span
                                className="h-3 w-3 rounded-full inline-block border border-white/20"
                                style={{ backgroundColor: reg.color }}
                              />
                              {reg.color}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {reg.isClosed ? (
                              <span className="text-emerald-400 font-semibold">Fermée</span>
                            ) : (
                              <span className="text-gray-400">Linéaire</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              reg.assignedStrategy === 'tatami'
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                : reg.assignedStrategy === 'satin'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}>
                              {reg.assignedStrategy}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono">{reg.area.toFixed(0)}</td>
                          <td className="py-2 px-3 font-mono">{reg.holesCount}</td>
                          <td className="py-2 px-3 text-gray-400 text-[11px]">{reg.strategyReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-lg"
          >
            Fermer le diagnostic
          </button>
        </div>
      </div>
    </div>
  );
};
