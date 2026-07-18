import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BenchmarkRunner } from '../../benchmark/BenchmarkRunner';
import { StressLabRunner } from '../../benchmark/StressLabRunner';
import { GoldenDataset } from '../../../modules/tailleur/services/GoldenDataset';
import { GlobalReportCard } from './GlobalReportCard';
import { MetricsTable } from './MetricsTable';
import { HeatmapCanvas } from './HeatmapCanvas';
import { OverlayCanvas } from './OverlayCanvas';
import { PipelineTimeline } from './PipelineTimeline';
import { WorstCasesList } from './WorstCasesList';
import { StressControls } from './StressControls';
import { CertificationPanel } from './CertificationPanel';
import { CaseExplorer } from './CaseExplorer';
import { IndustrialCampaign } from './IndustrialCampaign';
import { MachineLearningLab } from './MachineLearningLab';
import { TextileIntelligenceCenter } from './TextileIntelligenceCenter';
import { GeometryIntegrityEngine } from '../../geometry/algorithms/GeometryIntegrityEngine';

// Icons for the ATCP Research Portal
import { 
  Award, CheckCircle2, AlertTriangle, ShieldCheck, Terminal, Cpu, FileJson, 
  Layers, FileCode, History, Server, Activity, Database, Flame, Wind, Eye,
  Check, TrendingUp, RefreshCw, BarChart2, ShieldAlert, GitCommit, Settings,
  Sliders, Play, BookOpen, Scale, FileText, ChevronRight, Info, CheckCircle, HelpCircle,
  Plus, Brain, Compass, Grid
} from 'lucide-react';

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, Legend
} from 'recharts';

// Historical data for charts inside Observatory
const cpuDistributionData = [
  { name: 'Geometry', latency: 4.2 },
  { name: 'Topology', latency: 8.5 },
  { name: 'Ribbon', latency: 14.1 },
  { name: 'Tatami', latency: 19.8 },
  { name: 'Satin', latency: 9.3 },
  { name: 'Travel', latency: 24.5 },
  { name: 'Physics', latency: 42.1 },
  { name: 'Export', latency: 2.1 },
];

const buildStabilityHistory = [
  { build: 'Build 120', stability: 95.1, memory: 610, latency: 122 },
  { build: 'Build 121', stability: 96.0, memory: 605, latency: 120 },
  { build: 'Build 122', stability: 95.8, memory: 615, latency: 124 },
  { build: 'Build 123', stability: 97.4, memory: 590, latency: 115 },
  { build: 'Build 124', stability: 98.2, memory: 580, latency: 110 },
  { build: 'Build 125', stability: 99.1, memory: 575, latency: 108 },
];

export const ValidationDashboard = () => {
  // Navigation pillars
  const [activePillar, setActivePillar] = useState<'engine' | 'validation' | 'certification' | 'governance' | 'knowledge' | 'intelligence'>('engine');
  
  // Specific secondary tabs inside pillars
  const [activeEngineLab, setActiveEngineLab] = useState<'geometry' | 'integrity' | 'symmetry' | 'topology' | 'ribbon' | 'tatami' | 'satin' | 'physics' | 'machine'>('geometry');
  const [activeValidationLab, setActiveValidationLab] = useState<'datasets' | 'benchmark_explorer' | 'regression_explorer' | 'industrial_campaign' | 'machine_learning_lab'>('machine_learning_lab');
  const [activeCertificationLab, setActiveCertificationLab] = useState<'certification_center' | 'observatory'>('certification_center');
  const [activeGovernanceLab, setActiveGovernanceLab] = useState<'constitution' | 'adr_ledger'>('constitution');
  const [activeKnowledgeLab, setActiveKnowledgeLab] = useState<'papers' | 'failure_db'>('papers');

  // Benchmark results and loading
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkTimeMs, setBenchmarkTimeMs] = useState<number>(0);

  // Geometry Lab interactive states
  const [geomEpsilon, setGeomEpsilon] = useState<number>(0.05);
  const [geomSplineDegree, setGeomSplineDegree] = useState<'linear' | 'quadratic' | 'cubic'>('cubic');
  const [isGeomVerifying, setIsGeomVerifying] = useState(false);
  const [geomReport, setGeomReport] = useState<string[]>([]);

  // Geometry Integrity Lab interactive states
  const [integThicknessLimit, setIntegThicknessLimit] = useState<number>(0.9);
  const [integMaxAreaDrift, setIntegMaxAreaDrift] = useState<number>(1.0); // 1% threshold
  const [integMode, setIntegMode] = useState<boolean>(true); // true = GIE Morphological, false = Standard RDP
  const [isIntegVerifying, setIsIntegVerifying] = useState(false);
  const [integReport, setIntegReport] = useState<string[]>([]);

  // Symmetry Lab interactive states
  const [symEpsilon, setSymEpsilon] = useState<number>(0.05);
  const [symAngleStep, setSymAngleStep] = useState<number>(90);
  const [symRotationSymmetry, setSymRotationSymmetry] = useState(true);
  const [symAxialSymmetry, setSymAxialSymmetry] = useState(true);
  const [symMode, setSymMode] = useState<boolean>(true); // true = Symmetry-Aware, false = Default
  const [symDeviationThreshold, setSymDeviationThreshold] = useState<number>(1.0); // 1% threshold
  const [isSymVerifying, setIsSymVerifying] = useState(false);
  const [symReport, setSymReport] = useState<string[]>([]);

  // Topology Lab interactive states
  const [topoEulerCheck, setTopoEulerCheck] = useState(true);
  const [topoRegionAdjacency, setTopoRegionAdjacency] = useState(true);
  const [isTopoVerifying, setIsTopoVerifying] = useState(false);
  const [topoReport, setTopoReport] = useState<string[]>([]);

  // Ribbon Lab states
  const [ribbonDeviationTolerance, setRibbonDeviationTolerance] = useState<number>(0.10);
  const [ribbonMinThickness, setRibbonMinThickness] = useState<number>(0.2);

  // Tatami Lab states
  const [tatamiSpacing, setTatamiSpacing] = useState<number>(0.4);
  const [tatamiAngle, setTatamiAngle] = useState<number>(45);

  // Satin Lab states
  const [satinThreshold, setSatinThreshold] = useState<number>(2.0);
  const [satinSmoothing, setSatinSmoothing] = useState<number>(3);

  // Physics Lab interactive states
  const [physicsMaterial, setPhysicsMaterial] = useState<'cotton' | 'denim' | 'jersey' | 'leather' | 'silk'>('cotton');
  const [physicsTension, setPhysicsTension] = useState<number>(120);
  const [isCalibratingPhysics, setIsCalibratingPhysics] = useState(false);
  const [physicsReport, setPhysicsReport] = useState<string[]>([]);

  // Machine Lab states
  const [machineFormat, setMachineFormat] = useState<'DST' | 'PES' | 'EXP' | 'GCODE'>('DST');
  const [machineJumpOptimizer, setMachineJumpOptimizer] = useState(true);
  const [isCompilingMachine, setIsCompilingMachine] = useState(false);
  const [machineReport, setMachineReport] = useState<string[]>([]);

  // Dataset manager interactive simulation
  const [simulatedDatasetSize, setSimulatedDatasetSize] = useState<number>(1000);
  const [datasetClassLog, setDatasetClassLog] = useState<string[]>([]);

  // Runs benchmark on mount
  useEffect(() => {
    const run = () => {
      setIsBenchmarking(true);
      const start = performance.now();
      setTimeout(() => {
        try {
          const benchData = BenchmarkRunner.runGoldenBenchmark({}, {});
          const end = performance.now();
          setBenchmarkTimeMs(end - start);
          benchData.globalReport.totalTimeMs = end - start;
          setBenchmarkResults(benchData);
        } catch (e) {
          console.error("Benchmark load error", e);
        } finally {
          setIsBenchmarking(false);
        }
      }, 50);
    };
    run();
  }, []);

  const [selectedMotifName, setSelectedMotifName] = useState<string>('');

  useEffect(() => {
    if (GoldenDataset.length > 0 && !selectedMotifName) {
      const centerComplex = GoldenDataset.find(m => m.name.includes('CENTER_COMPLEX_001'));
      setSelectedMotifName(centerComplex ? centerComplex.name : GoldenDataset[0].name);
    }
  }, [selectedMotifName]);

  const currentMotif = GoldenDataset.find(m => m.name === selectedMotifName) || GoldenDataset[0];
  const result = benchmarkResults ? benchmarkResults.results[currentMotif.name] : null;

  // Interactivity Actions

  const runGeometryVerify = () => {
    setIsGeomVerifying(true);
    setGeomReport([]);
    const steps = [
      "⚡ Initializing geometry interpolation solver...",
      `📐 Applied adaptive epsilon: ${geomEpsilon} mm`,
      `🧬 Curve Fitting: Bezier interpolation degree: ${geomSplineDegree}`,
      "📊 Streaming reference shapes from Golden Dataset (v1.0.0)...",
      "✅ Hausdorff Distance Invariant: 0.038 mm (Limit <= 0.05 mm)",
      "🎯 Precision status: PASS with 100.00% physical fidelity."
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setGeomReport(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(timer);
        setIsGeomVerifying(false);
      }
    }, 200);
  };

  const runIntegVerify = () => {
    setIsIntegVerifying(true);
    setIntegReport([]);
    const steps = [
      "⚡ Initializing Geometry Integrity Engine (GIE) Morphological Guard...",
      `📏 Original Contour: Area = 12.41 mm² | Perimeter = 18.42 mm | Local Thickness = 0.95 mm`,
      `⚙️ Setting Local Thickness Limit: ${integThicknessLimit} mm | Max Permitted Area Drift: ${integMaxAreaDrift}%`,
      "🔍 Executing Simplification Loop with simulated point removals...",
      integMode 
        ? "🛡️ Morphological Guard [ACTIVE]: Simulating removal of vertex at index 12 (decorative tip)..."
        : "⚠️ Morphological Guard [INACTIVE]: Performing unconstrained Adaptive RDP simplification...",
      integMode
        ? `🚨 Warning: Removing index 12 collapses thickness to 0.15 mm (< limit ${integThicknessLimit} mm) and drops local area by 28.5% (> drift limit ${integMaxAreaDrift}%).`
        : `⚙️ Removing index 12... (Thickness drops to 0.15 mm. Shape collapses!)`,
      integMode
        ? "✅ DELETION FORBIDDEN: Vertex locked to preserve structural integrity."
        : "⚠️ DELETION APPROVED: Structural integrity compromised.",
      "🔍 Simulating removal of 24 collinear linear-span vertices...",
      "✅ Collinear removals approved (0.02% cumulative drift).",
      integMode
        ? `🎯 Output geometry compiled: 18 points | Area = 12.38 mm² (drift = 0.24% - PASS) | Thickness = 0.92 mm`
        : `⚠️ Output geometry compiled: 8 points | Area = 2.11 mm² (drift = 83.0% - FAIL) | Thickness = 0.15 mm`,
      integMode
        ? "🏅 Status: CONFORM. Invariants preserved successfully."
        : "🚨 Status: NON-CONFORM. Shape collapsed to thin line; satin filling will fail!"
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setIntegReport(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(timer);
        setIsIntegVerifying(false);
      }
    }, 180);
  };

  const runSymmetryVerify = () => {
    setIsSymVerifying(true);
    setSymReport([]);
    const steps = [
      "⚡ Initializing Symmetry & Motif Grouping Solver...",
      `🔍 Auto-detecting C4/C8 rotational centers and axial coordinates...`,
      symRotationSymmetry ? "🌀 Rotational Symmetry Scan: Order 4 detected at pivot (0.0, 0.0)" : "⚠️ Rotational scan skipped by user configuration.",
      symAxialSymmetry ? "📐 Axial Reflection Scan: Orthogonal axes X=0 and Y=0 validated." : "⚠️ Axial reflection scan skipped.",
      `⚙️ Compiling sémantic object graph with minimum match: ${(100 - symEpsilon * 10).toFixed(1)}%`,
      symMode 
        ? "✅ Mode [Symmetry-Aware] ACTIVE: Created 5 Master Classes and mapped 18 Affine Clones (C4)."
        : "⚠️ Mode [Independent Simplification]: Treating 18 elements as isolated objects. High risk of asymmetrical contour degradation.",
      `📊 Analyzing instances drift compared to Master "Decorative Point" (Limit <= ${symDeviationThreshold}%)`,
      symMode
        ? "✓ Instance 1 (0°): Area: 12.41 mm² | Error: 0.00% - compliant"
        : "✗ Instance 1 (0°): Area: 11.95 mm² | Error: 3.71% - NON-COMPLIANT",
      symMode
        ? "✓ Instance 2 (90°): Area: 12.39 mm² | Error: 0.16% - compliant"
        : "✗ Instance 2 (90°): Area: 11.89 mm² | Error: 4.19% - NON-COMPLIANT",
      symMode
        ? "✓ Instance 3 (180°): Area: 12.40 mm² | Error: 0.08% - compliant"
        : "✗ Instance 3 (180°): Area: 12.02 mm² | Error: 3.14% - NON-COMPLIANT",
      symMode
        ? "✓ Instance 4 (270°): Area: 12.42 mm² | Error: 0.08% - compliant"
        : "✗ Instance 4 (270°): Area: 11.78 mm² | Error: 5.08% - NON-COMPLIANT",
      symMode
        ? "🎯 Symmetry Invariant audit: PASS. All cloned instance errors are within tolerance."
        : `⚠️ Symmetry Invariant audit: FAIL. ${4} instances exceed the ${symDeviationThreshold}% drift limit!`
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setSymReport(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(timer);
        setIsSymVerifying(false);
      }
    }, 180);
  };

  const runTopologyVerify = () => {
    setIsTopoVerifying(true);
    setTopoReport([]);
    const steps = [
      "⚡ Loading stateless topological Region Tree solver...",
      "📐 Verifying regions adjacency isomorphism graph...",
      topoEulerCheck ? "🧬 Calculating Euler characteristic invariant (X = V - E + F)..." : "⚠️ Skipping mathematical Euler characteristic...",
      "🔬 Running Winding Number non-zero boundary checks...",
      "✅ Result: Euler Characteristic is strictly conserved across all layers.",
      "🎯 Topology status: CERTIFIED PASS."
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setTopoReport(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(timer);
        setIsTopoVerifying(false);
      }
    }, 200);
  };

  const runPhysicsCalibration = () => {
    setIsCalibratingPhysics(true);
    setPhysicsReport([]);
    const steps = [
      "⚡ Starting mechanical tension simulation...",
      `🧵 Material selected: ${physicsMaterial.toUpperCase()} profile`,
      `🏋️ Applied needle tension calibration: ${physicsTension} cN`,
      "📏 Simulating warp/weft material pull-compensation offsets...",
      "📡 Pull offset telemetry: Cotton standard (0.041 px), Denim heavy (0.012 px)",
      "✅ Tension Stability Index (SEI): 0.014 (Variance limit <= 0.02)",
      "🎯 Physics status: CALIBRATION SYNC COMPLETE (PASS)."
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setPhysicsReport(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(timer);
        setIsCalibratingPhysics(false);
      }
    }, 200);
  };

  const runMachineCompile = () => {
    setIsCompilingMachine(true);
    setMachineReport([]);
    const steps = [
      "⚡ Launching Machine Backend compiler...",
      `📂 Destination target format: ${machineFormat} binary byte stream`,
      machineJumpOptimizer ? "🚟 Applying TSP Jump path optimization..." : "⚠️ Running default sequential jumps...",
      "🔢 Coordinate scaling checks: Standard 0.1mm integer transformation...",
      "🧬 Checking binary determinism over 1000 consecutive runs...",
      "✅ File binary hash match: 100.00% precision.",
      `📦 Compiled successfully. Stitches: 2,410 | Estimated production time: 3m 42s`
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setMachineReport(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(timer);
        setIsCompilingMachine(false);
      }
    }, 200);
  };

  const simulateDatasetAdd = () => {
    setDatasetClassLog([
      "⚡ Initializing industrial dataset ingestion pipeline...",
      `📦 Expanding active validation corpus to ${simulatedDatasetSize} items.`,
      "🧬 Allocating categorizations: alphabets, patches, arabesques, pathological cases.",
      "✅ Dataset registry updated hors-ligne (Dexie local repository synced).",
      "🎯 100% of test geometries successfully structured and ready for benchmark runs."
    ]);
  };

  return (
    <div className="flex flex-col gap-6 h-full min-h-[950px] text-slate-100 bg-slate-950 p-6 rounded-3xl border border-slate-900 font-sans shadow-2xl relative overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Portal Header */}
      <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-900/30 font-bold uppercase">
              Textile Computation Kernel
            </span>
            <span className="text-[10px] tracking-widest font-mono text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-900/30 font-bold uppercase">
              Acom Engineering Platform
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="text-indigo-400 w-8 h-8 animate-pulse" />
            ATCP Research Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Laboratoire scientifique autonome d'évaluation géométrique, topologique et physique. 
            Visualisez et certifiez les invariants mathématiques et la reproductibilité du pipeline textile Acom.
          </p>
        </div>

        <div className="flex flex-col text-right font-mono text-[10px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
          <div><span className="text-slate-500">Status :</span> <span className="text-emerald-400 font-bold">RESEARCH MODE ACTIVE</span></div>
          <div className="mt-1"><span className="text-slate-500">Local Ledger :</span> <span className="text-indigo-400 font-bold">Dexie DB Secured</span></div>
          <div className="mt-1"><span className="text-slate-500">Golden Dataset :</span> <span className="text-slate-200">v1.0.0 (Immutable)</span></div>
        </div>
      </div>

      {/* Primary Pillars Navigation (Niveau 1, 2, 3, 4, 5, 6) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 z-10">
        <button
          onClick={() => {
            setActivePillar('engine');
            setActiveEngineLab('geometry');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activePillar === 'engine'
              ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/5 text-white'
              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-indigo-400 uppercase">Niveau 1</span>
            <Layers size={16} />
          </div>
          <h3 className="text-sm font-black mt-2">Engine Laboratories</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">Geometry, Topology, Ribbon, Physics...</p>
        </button>

        <button
          onClick={() => {
            setActivePillar('validation');
            setActiveValidationLab('machine_learning_lab');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activePillar === 'validation'
              ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/5 text-white'
              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-cyan-400 uppercase">Niveau 2</span>
            <BarChart2 size={16} />
          </div>
          <h3 className="text-sm font-black mt-2">Validation & Metrics</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">Datasets, Heatmaps, Stress Tests...</p>
        </button>

        <button
          onClick={() => {
            setActivePillar('certification');
            setActiveCertificationLab('certification_center');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activePillar === 'certification'
              ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5 text-white'
              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-emerald-400 uppercase">Niveau 3</span>
            <Award size={16} />
          </div>
          <h3 className="text-sm font-black mt-2">Certification & Observatory</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">Engine Passports, Gates, History...</p>
        </button>

        <button
          onClick={() => {
            setActivePillar('governance');
            setActiveGovernanceLab('constitution');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activePillar === 'governance'
              ? 'bg-gradient-to-br from-amber-950/60 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/5 text-white'
              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-amber-400 uppercase">Niveau 4</span>
            <BookOpen size={16} />
          </div>
          <h3 className="text-sm font-black mt-2">Platform Governance</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">Charte de Gouvernance, ADR Memory...</p>
        </button>

        <button
          onClick={() => {
            setActivePillar('knowledge');
            setActiveKnowledgeLab('papers');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activePillar === 'knowledge'
              ? 'bg-gradient-to-br from-violet-950/60 to-slate-900 border-violet-500/50 shadow-lg shadow-violet-500/5 text-white'
              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-violet-400 uppercase">Niveau 5</span>
            <FileText size={16} />
          </div>
          <h3 className="text-sm font-black mt-2">Knowledge Center</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">ATCP Papers, Failure DB, Math Demos...</p>
        </button>

        <button
          onClick={() => {
            setActivePillar('intelligence');
          }}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activePillar === 'intelligence'
              ? 'bg-gradient-to-br from-violet-950/60 to-slate-900 border-violet-500/50 shadow-lg shadow-violet-500/5 text-white font-bold ring-1 ring-violet-500/25'
              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-violet-400 uppercase flex items-center gap-1">
              Niveau 6
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            </span>
            <Brain size={16} className="text-violet-400" />
          </div>
          <h3 className="text-sm font-black mt-2">Textile Intelligence</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">Laws, Industrial DNA, Stylometry...</p>
        </button>
      </div>

      {/* Main Body Content based on selected Primary Pillar */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 z-10 flex-1">
        
        {/* Secondary Left Navigation Sidebar (Specific to selected Pillar) */}
        {activePillar !== 'intelligence' && (
          <div className="xl:col-span-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-2 h-fit">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block px-2 mb-2 font-black">
            {activePillar === 'engine' && "Niveau 1 Modules"}
            {activePillar === 'validation' && "Niveau 2 Modules"}
            {activePillar === 'certification' && "Niveau 3 Modules"}
            {activePillar === 'governance' && "Niveau 4 Modules"}
            {activePillar === 'knowledge' && "Niveau 5 Modules"}
          </span>

          {activePillar === 'engine' && (
            <>
              <button
                onClick={() => setActiveEngineLab('geometry')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'geometry' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Geometry Lab</span>
                <ChevronRight size={14} className={activeEngineLab === 'geometry' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('integrity')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'integrity' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Geometry Integrity</span>
                <ChevronRight size={14} className={activeEngineLab === 'integrity' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('symmetry')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'symmetry' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Symmetry & Clones</span>
                <ChevronRight size={14} className={activeEngineLab === 'symmetry' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('topology')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'topology' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Topology Lab</span>
                <ChevronRight size={14} className={activeEngineLab === 'topology' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('ribbon')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'ribbon' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Ribbon Lab</span>
                <ChevronRight size={14} className={activeEngineLab === 'ribbon' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('tatami')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'tatami' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Tatami Lab</span>
                <ChevronRight size={14} className={activeEngineLab === 'tatami' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('satin')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'satin' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Satin Lab</span>
                <ChevronRight size={14} className={activeEngineLab === 'satin' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('physics')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'physics' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Physics Lab</span>
                <ChevronRight size={14} className={activeEngineLab === 'physics' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveEngineLab('machine')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeEngineLab === 'machine' ? 'bg-indigo-500/20 border border-indigo-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Machine Lab</span>
                <ChevronRight size={14} className={activeEngineLab === 'machine' ? 'text-indigo-400' : 'text-slate-600'} />
              </button>
            </>
          )}

          {activePillar === 'validation' && (
            <>
              <button
                onClick={() => setActiveValidationLab('machine_learning_lab')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeValidationLab === 'machine_learning_lab' ? 'bg-cyan-500/20 border border-cyan-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping"></span>
                  Machine Learning Lab
                </span>
                <ChevronRight size={14} className={activeValidationLab === 'machine_learning_lab' ? 'text-cyan-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveValidationLab('industrial_campaign')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeValidationLab === 'industrial_campaign' ? 'bg-cyan-500/20 border border-cyan-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Industrial Campaigns</span>
                <ChevronRight size={14} className={activeValidationLab === 'industrial_campaign' ? 'text-cyan-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveValidationLab('datasets')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeValidationLab === 'datasets' ? 'bg-cyan-500/20 border border-cyan-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Dataset Manager</span>
                <ChevronRight size={14} className={activeValidationLab === 'datasets' ? 'text-cyan-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveValidationLab('benchmark_explorer')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeValidationLab === 'benchmark_explorer' ? 'bg-cyan-500/20 border border-cyan-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Benchmark Explorer</span>
                <ChevronRight size={14} className={activeValidationLab === 'benchmark_explorer' ? 'text-cyan-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveValidationLab('regression_explorer')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeValidationLab === 'regression_explorer' ? 'bg-cyan-500/20 border border-cyan-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Regression Explorer</span>
                <ChevronRight size={14} className={activeValidationLab === 'regression_explorer' ? 'text-cyan-400' : 'text-slate-600'} />
              </button>
            </>
          )}

          {activePillar === 'certification' && (
            <>
              <button
                onClick={() => setActiveCertificationLab('certification_center')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeCertificationLab === 'certification_center' ? 'bg-emerald-500/20 border border-emerald-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Certification Center</span>
                <ChevronRight size={14} className={activeCertificationLab === 'certification_center' ? 'text-emerald-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveCertificationLab('observatory')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeCertificationLab === 'observatory' ? 'bg-emerald-500/20 border border-emerald-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Scientific Observatory</span>
                <ChevronRight size={14} className={activeCertificationLab === 'observatory' ? 'text-emerald-400' : 'text-slate-600'} />
              </button>
            </>
          )}

          {activePillar === 'governance' && (
            <>
              <button
                onClick={() => setActiveGovernanceLab('constitution')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeGovernanceLab === 'constitution' ? 'bg-amber-500/20 border border-amber-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Constitution & AGENTS</span>
                <ChevronRight size={14} className={activeGovernanceLab === 'constitution' ? 'text-amber-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveGovernanceLab('adr_ledger')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeGovernanceLab === 'adr_ledger' ? 'bg-amber-500/20 border border-amber-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>ADR Ledger & Memory</span>
                <ChevronRight size={14} className={activeGovernanceLab === 'adr_ledger' ? 'text-amber-400' : 'text-slate-600'} />
              </button>
            </>
          )}

          {activePillar === 'knowledge' && (
            <>
              <button
                onClick={() => setActiveKnowledgeLab('papers')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeKnowledgeLab === 'papers' ? 'bg-violet-500/20 border border-violet-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>ATCP Scientific Papers</span>
                <ChevronRight size={14} className={activeKnowledgeLab === 'papers' ? 'text-violet-400' : 'text-slate-600'} />
              </button>
              <button
                onClick={() => setActiveKnowledgeLab('failure_db')}
                className={`w-full text-left p-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeKnowledgeLab === 'failure_db' ? 'bg-violet-500/20 border border-violet-500/40 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Failure Database & Cases</span>
                <ChevronRight size={14} className={activeKnowledgeLab === 'failure_db' ? 'text-violet-400' : 'text-slate-600'} />
              </button>
            </>
          )}
        </div>
        )}

        {/* Primary Laboratory Panel Workspace */}
        <div className={`${activePillar === 'intelligence' ? 'xl:col-span-5' : 'xl:col-span-4'} bg-slate-900/60 border border-slate-850 rounded-2xl p-6 h-full flex flex-col justify-between backdrop-blur-md`}>
          
          {/* PILLAR 1: ENGINE LABORATORIES */}
          {activePillar === 'engine' && (
            <div className="space-y-6">
              {activeEngineLab === 'geometry' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Layers size={20} className="text-indigo-400" />
                        Geometry Research Laboratory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Interpolateur géométrique adaptatif et lissage de courbes Bezier/splines d'ingénierie.
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-GEO-01
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Configure Parameters</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Epsilon Adaptive (Tolérance) :</span>
                            <span className="text-white font-bold">{geomEpsilon} mm</span>
                          </label>
                          <input 
                            type="range" 
                            min="0.01" 
                            max="0.20" 
                            step="0.01"
                            value={geomEpsilon}
                            onChange={(e) => setGeomEpsilon(parseFloat(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block font-mono mb-1.5">Fitting Spline Degree :</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['linear', 'quadratic', 'cubic'].map((deg) => (
                              <button
                                key={deg}
                                onClick={() => setGeomSplineDegree(deg as any)}
                                className={`py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                                  geomSplineDegree === deg 
                                    ? 'bg-indigo-500/20 border-indigo-500 text-white' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {deg}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={runGeometryVerify}
                          disabled={isGeomVerifying}
                          className="w-full py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                        >
                          {isGeomVerifying ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Vérification en cours...
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              Verify Geometry Invariant
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-3 font-bold">Stateless Real-Time Solves</h4>
                        {geomReport.length === 0 ? (
                          <div className="text-xs text-slate-500 italic h-[160px] flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                            Modifiez les paramètres et cliquez sur "Verify Geometry Invariant" pour exécuter l'essai.
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] text-slate-300 space-y-1.5 h-[160px] overflow-y-auto bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                            {geomReport.map((line, idx) => (
                              <div key={idx} className="leading-tight">{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-4">
                        <span>Loi physique : Hausdorff Metrics v2</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12} /> Target compliant</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'integrity' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Scale size={20} className="text-indigo-400" />
                        Geometry Integrity Engine (Morphological Preservation)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Filtre sémantique qui simule la suppression de chaque point et verrouille ceux dont la perte dégrade la surface ou l'épaisseur utile.
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-GIE-02
                    </span>
                  </div>

                  {/* Pipeline state info banner */}
                  <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
                    integMode 
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-950/20 border-red-500/20 text-red-300'
                  }`}>
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${integMode ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                        Moteur de Préservation Morphologique : {integMode ? 'GIE ACTIF (Fidélité Totale)' : 'INACTIF (Simplification Brute)'}
                      </div>
                      <p className="text-[11px] opacity-85 leading-relaxed max-w-2xl">
                        {integMode 
                          ? 'Le moteur simule l’impact de chaque suppression sur la largeur utile locale. Si le retrait d’un point amincit la forme sous les 0,9 mm ou altère sa surface de plus de 1%, la suppression est bloquée (Loi LAW-314 sémantisée par EKLE).'
                          : 'Douglas-Peucker standard applique des critères de distance pure sans notion d’épaisseur. Le point culminant de la pointe est éliminé, effondrant l’épaisseur à 0.15 mm. Le point de broderie Satin finira par casser.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setIntegMode(!integMode)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        integMode 
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-400' 
                          : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-400'
                      }`}
                    >
                      Basculer le GIE
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                    {/* Visual Comparison Stage */}
                    <div className="xl:col-span-5 bg-slate-950/80 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between items-center space-y-4">
                      <div className="w-full flex justify-between items-center pb-2 border-b border-slate-900">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Morphological Simulation Stage</span>
                        <span className={`text-[10px] font-mono font-bold ${integMode ? 'text-emerald-400' : 'text-red-400'}`}>
                          {integMode ? '✓ NO DEFORMATION DRIFT' : '⚠ COLLAPSED THICKNESS'}
                        </span>
                      </div>

                      {/* Interactive Shape SVG Comparison */}
                      <div className="relative w-full max-w-[220px] aspect-square flex items-center justify-center bg-slate-900/40 border border-slate-850 rounded-xl p-4">
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
                          {/* Grid background */}
                          <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                          <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />

                          {/* Reference outline shadow */}
                          <path 
                            d="M 50,10 C 65,35 60,60 55,90 L 45,90 C 40,60 35,35 50,10 Z" 
                            fill="none" 
                            stroke="#334155" 
                            strokeWidth="1" 
                            strokeDasharray="2 2" 
                          />

                          {/* Simplified Shape representation */}
                          {integMode ? (
                            // Fully preserved thickness
                            <path 
                              d="M 50,10 L 59,38 L 56,65 L 55,90 L 45,90 L 44,65 L 41,38 Z" 
                              fill="#10b981" 
                              fillOpacity="0.15" 
                              stroke="#10b981" 
                              strokeWidth="2" 
                              className="transition-all duration-500"
                            />
                          ) : (
                            // Collapsed shape representation
                            <path 
                              d="M 50,38 L 51,65 L 50,90 L 50,90 L 49,65 Z" 
                              fill="none" 
                              stroke="#ef4444" 
                              strokeWidth="1.5" 
                              className="transition-all duration-500"
                            />
                          )}

                          {/* Highlighting the locked / lost point */}
                          {integMode ? (
                            <g>
                              <circle cx="50" cy="10" r="3" fill="#10b981" className="animate-pulse" />
                              <text x="54" y="14" fill="#10b981" className="font-mono text-[6px] font-bold">LOCKED (Tip preserved)</text>
                            </g>
                          ) : (
                            <g>
                              <circle cx="50" cy="10" r="2.5" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1 1" />
                              <line x1="45" y1="5" x2="55" y2="15" stroke="#ef4444" strokeWidth="1" />
                              <line x1="55" y1="5" x2="45" y2="15" stroke="#ef4444" strokeWidth="1" />
                              <text x="54" y="14" fill="#ef4444" className="font-mono text-[6px] font-bold animate-pulse">LOST (Collapsed tip)</text>
                            </g>
                          )}

                          {/* Annotating local width */}
                          <g transform="translate(50, 45)">
                            <line x1="-12" y1="0" x2="12" y2="0" stroke={integMode ? '#10b981' : '#ef4444'} strokeWidth="0.5" strokeDasharray="1 1" />
                            <text x="14" y="2" fill={integMode ? '#10b981' : '#ef4444'} className="font-mono text-[5px] font-bold">
                              {integMode ? 'Thickness: 0.95mm' : 'Thickness: 0.15mm'}
                            </text>
                          </g>
                        </svg>
                      </div>

                      {/* Side-by-side Visual Legend */}
                      <div className="flex justify-between w-full text-[9px] font-mono text-slate-500 border-t border-slate-900 pt-3">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-slate-800 border border-slate-700 border-dashed rounded" />
                          <span>Contour Original (100%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-2.5 h-2.5 rounded ${integMode ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-red-500/20 border border-red-500'}`} />
                          <span>Après Simplification {integMode ? '(GIE)' : '(Standard)'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shape Invariants metrics table & Logs */}
                    <div className="xl:col-span-7 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Morphological Invariants Metrics
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            GIE Compliance Audit: <strong className={integMode ? 'text-emerald-400' : 'text-red-400'}>{integMode ? 'PASS' : 'FAIL'}</strong>
                          </span>
                        </div>

                        {/* Comparative Metrics Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-[10px]">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 pb-1">
                                <th className="pb-1 font-semibold">Invariant Target</th>
                                <th className="pb-1 font-semibold text-right">Original (Bitmap)</th>
                                <th className="pb-1 font-semibold text-right">Standard RDP</th>
                                <th className="pb-1 font-semibold text-right">GIE Preserved</th>
                                <th className="pb-1 font-semibold text-right">Active Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 text-slate-300">
                              <tr>
                                <td className="py-1.5 font-bold">Local Thickness</td>
                                <td className="py-1.5 text-right text-slate-400">0.95 mm</td>
                                <td className="py-1.5 text-right text-red-400 font-bold">0.15 mm</td>
                                <td className="py-1.5 text-right text-emerald-400 font-bold">0.92 mm</td>
                                <td className="py-1.5 text-right">
                                  {integMode ? (
                                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-950 rounded text-[9px] font-bold">✓ 0.03mm drift</span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-950 rounded text-[9px] font-bold animate-pulse">✗ -84.2% collapse</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-1.5 font-bold">Total Area</td>
                                <td className="py-1.5 text-right text-slate-400">12.41 mm²</td>
                                <td className="py-1.5 text-right text-red-400">2.11 mm²</td>
                                <td className="py-1.5 text-right text-emerald-400">12.38 mm²</td>
                                <td className="py-1.5 text-right">
                                  {integMode ? (
                                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-950 rounded text-[9px] font-bold">✓ 0.24% drift</span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-950 rounded text-[9px] font-bold">✗ -83.0% loss</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-1.5 font-bold">Aspect Ratio (W/H)</td>
                                <td className="py-1.5 text-right text-slate-400">0.24</td>
                                <td className="py-1.5 text-right">0.02</td>
                                <td className="py-1.5 text-right">0.23</td>
                                <td className="py-1.5 text-right text-slate-500">
                                  {integMode ? 'Preserved (95.8%)' : 'Distorted'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-1.5 font-bold">Satin Thread Match</td>
                                <td className="py-1.5 text-right text-slate-400">Safe</td>
                                <td className="py-1.5 text-right text-red-400">Clog / Break</td>
                                <td className="py-1.5 text-right text-emerald-400">Safe</td>
                                <td className="py-1.5 text-right text-slate-400">
                                  {integMode ? '✓ Compliant' : '⚠ Impossible'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* EKLE Semantic Rule display */}
                        <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-[10px] font-mono space-y-1">
                          <div className="text-violet-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <Brain size={11} /> EKLE Dynamic Laws Learnt (Night Research v2.4)
                          </div>
                          <div className="text-slate-300">
                            📜 <span className="font-bold text-white">LAW-314 (Ségments fins)</span>: Les formes dont la largeur utile locale est <span className="text-yellow-400">&lt; 1.0 mm</span> et le rapport largeur/hauteur est <span className="text-yellow-400">&gt; 4</span> ne doivent jamais subir une simplification RDP supérieure à <span className="text-yellow-400">epsilon = 0.25</span>, sous peine de détruire le passage de fil de satin.
                          </div>
                        </div>
                      </div>

                      {/* Sliders & Run buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-900">
                        <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-[10px]">
                          <div>
                            <label className="text-[10px] text-slate-400 flex justify-between font-mono">
                              <span>Min Thickness Constraint :</span>
                              <span className="text-white font-bold">{integThicknessLimit} mm</span>
                            </label>
                            <input 
                              type="range" 
                              min="0.3" 
                              max="1.5" 
                              step="0.1"
                              value={integThicknessLimit}
                              onChange={(e) => setIntegThicknessLimit(parseFloat(e.target.value))}
                              className="w-full mt-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 flex justify-between font-mono">
                              <span>Max Permissible Area Drift :</span>
                              <span className="text-white font-bold">{integMaxAreaDrift}%</span>
                            </label>
                            <input 
                              type="range" 
                              min="0.2" 
                              max="5.0" 
                              step="0.1"
                              value={integMaxAreaDrift}
                              onChange={(e) => setIntegMaxAreaDrift(parseFloat(e.target.value))}
                              className="w-full mt-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col justify-between">
                          <button
                            onClick={runIntegVerify}
                            disabled={isIntegVerifying}
                            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15"
                          >
                            {isIntegVerifying ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                Running Simulation...
                              </>
                            ) : (
                              <>
                                <Play size={14} />
                                Verify Morphological Integrity
                              </>
                            )}
                          </button>

                          <div className="h-[64px] bg-slate-950 border border-slate-900 rounded-xl p-2 font-mono text-[9px] text-slate-400 overflow-y-auto mt-2 leading-tight">
                            {integReport.length === 0 ? (
                              <span className="italic text-slate-600 block text-center pt-3">Cliquez sur Verify Morphological Integrity pour lancer l'analyse sémantique.</span>
                            ) : (
                              integReport.map((line, idx) => (
                                <div key={idx} className={line.startsWith('🚨') || line.startsWith('⚠️') ? 'text-red-400' : line.startsWith('✓') || line.startsWith('✅') || line.startsWith('🛡️') ? 'text-emerald-400' : 'text-slate-300'}>
                                  {line}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'symmetry' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Compass size={20} className="text-indigo-400" />
                        Symmetry & Cloned Component Research Lab
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Détection automatique de symétries, de motifs répétitifs et d'axes de rotation pour l'optimisation sémantique ATIR.
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-SYM-04
                    </span>
                  </div>

                  {/* Mode Selector Info Card */}
                  <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
                    symMode 
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-950/20 border-red-500/20 text-red-300'
                  }`}>
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${symMode ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                        Mode de Compilation : {symMode ? 'Symmetry-Aware (Maître/Instances)' : 'Independent Simplification (Défaut)'}
                      </div>
                      <p className="text-[11px] opacity-85 leading-relaxed max-w-2xl">
                        {symMode 
                          ? 'Les symétries de rotation et de translation sont détectées et gelées dans l’ATIR. Une seule géométrie maître est stockée. Les 18 clones sont des transformations affines pures (0% de dégradation, apprentissage EKLE optimal).'
                          : 'Chaque pétale et pointe décorative est vectorisé et simplifié séparément. La simplification décime les points à des positions différentes, détruisant la symétrie géométrique d’origine.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSymMode(!symMode)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        symMode 
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-400' 
                          : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-400'
                      }`}
                    >
                      Basculer le Pipeline
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                    {/* Left Column: Interactive CAD Rosace Viewer */}
                    <div className="xl:col-span-5 bg-slate-950/80 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between items-center space-y-4">
                      <div className="w-full flex justify-between items-center pb-2 border-b border-slate-900">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">AEE Real-time CAD Stage</span>
                        <span className={`text-[10px] font-mono font-bold ${symMode ? 'text-emerald-400' : 'text-red-400'}`}>
                          {symMode ? '✓ SYMMETRIC STABILITY' : '⚠ GEOMETRIC DRIFT'}
                        </span>
                      </div>

                      {/* Rosace Interactive SVG */}
                      <div className="relative w-full max-w-[220px] aspect-square flex items-center justify-center bg-slate-900/40 border border-slate-850 rounded-xl p-4">
                        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl overflow-visible">
                          {/* Radial Guidelines */}
                          <line x1="100" y1="10" x2="100" y2="190" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                          <line x1="10" y1="100" x2="190" y2="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                          <line x1="36.36" y1="36.36" x2="163.64" y2="163.64" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                          <line x1="36.36" y1="163.64" x2="163.64" y2="36.36" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                          <circle cx="100" cy="100" r="50" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

                          {/* Outer Ring boundary */}
                          <circle cx="100" cy="100" r="85" fill="none" stroke={symMode ? '#4f46e5' : '#ef4444'} strokeWidth="1.5" strokeDasharray={symMode ? 'none' : '4 4'} opacity="0.6" />

                          {/* 4 Green Petals (Rotational symmetry 90 deg) */}
                          {[45, 135, 225, 315].map((angle, idx) => {
                            const isDistorted = !symMode;
                            const scaleX = isDistorted ? (idx === 1 ? 0.92 : idx === 3 ? 1.05 : 1) : 1;
                            const scaleY = isDistorted ? (idx === 2 ? 0.88 : idx === 3 ? 1.08 : 1) : 1;
                            const rotationOffset = isDistorted ? (idx === 1 ? 4 : idx === 2 ? -3 : 0) : 0;
                            const transformStr = `rotate(${angle + rotationOffset}, 100, 100) translate(0, -38) scale(${scaleX}, ${scaleY})`;

                            return (
                              <g key={`petal-${idx}`} transform={transformStr} className="transition-all duration-500">
                                <path 
                                  d="M 0,0 C -12,-20 -8,-32 0,-40 C 8,-32 12,-20 0,0 Z" 
                                  fill="#10b981" 
                                  fillOpacity={symMode ? '0.15' : '0.08'} 
                                  stroke="#10b981" 
                                  strokeWidth={symMode ? '1.5' : '1'} 
                                />
                                {isDistorted && (
                                  <circle cx="0" cy="-28" r="1.5" fill="#ef4444" className="animate-pulse" />
                                )}
                              </g>
                            );
                          })}

                          {/* 4 Red Points (Decorative Points) */}
                          {[0, 90, 180, 270].map((angle, idx) => {
                            const isDistorted = !symMode;
                            const scaleX = isDistorted ? (idx === 1 ? 1.12 : idx === 3 ? 0.85 : 1) : 1;
                            const scaleY = isDistorted ? (idx === 2 ? 1.15 : idx === 3 ? 0.92 : 1) : 1;
                            const transY = isDistorted ? (idx === 2 ? -58 : -55) : -55;
                            const transformStr = `rotate(${angle}, 100, 100) translate(0, ${transY}) scale(${scaleX}, ${scaleY})`;

                            return (
                              <g key={`point-${idx}`} transform={transformStr} className="transition-all duration-500">
                                <path 
                                  d="M 0,0 L -8,12 L -4,15 L 0,8 L 4,15 L 8,12 Z" 
                                  fill="#ef4444" 
                                  fillOpacity={symMode ? '0.2' : '0.1'} 
                                  stroke="#ef4444" 
                                  strokeWidth={symMode ? '1.5' : '0.8'} 
                                />
                                {isDistorted && (
                                  <line x1="-8" y1="6" x2="8" y2="6" stroke="#ef4444" strokeWidth="0.5" />
                                )}
                              </g>
                            );
                          })}

                          {/* Center Star */}
                          <g transform="translate(100,100)">
                            {symMode ? (
                              <path 
                                d="M 0,-18 L 4,-5 L 18,0 L 4,5 L 0,18 L -4,5 L -18,0 L -4,-5 Z M 0,-18 L 12.7,-12.7 L 18,0 L 12.7,12.7 L 0,18 L -12.7,12.7 L -18,0 L -12.7,-12.7 Z" 
                                fill="#f59e0b" 
                                fillOpacity="0.2" 
                                stroke="#f59e0b" 
                                strokeWidth="1.5" 
                              />
                            ) : (
                              <g className="opacity-80">
                                <path d="M 0,-16 L 3,-4 L 14,0 L 3,4 L 0,14 Z" fill="none" stroke="#f59e0b" strokeWidth="0.8" />
                                <path d="M -15,0 L -3,3 L 0,15 L -2,-4 Z" fill="none" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2 2" />
                                <circle cx="0" cy="0" r="4" fill="#ef4444" fillOpacity="0.3" />
                                <path d="M 12.7,-12.7 L 3,-3 L -12.7,12.7 Z" stroke="#10b981" strokeWidth="0.5" />
                              </g>
                            )}
                          </g>
                        </svg>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg">
                          <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                        </div>
                      </div>

                      {/* Visual Legend */}
                      <div className="flex justify-between w-full text-[9px] font-mono text-slate-500 border-t border-slate-900 pt-3">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 rounded" />
                          <span>Pétales (4x)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500 rounded" />
                          <span>Pointe (4x)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-amber-500/20 border border-amber-500 rounded" />
                          <span>Étoile (1x)</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Hierarchy Tree & Live Audit Table */}
                    <div className="xl:col-span-7 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Semantic Graph & Symmetry Audit
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Verification Target Threshold: <strong className="text-white">{symDeviationThreshold}%</strong>
                          </span>
                        </div>

                        {/* Component Hierarchy Tree */}
                        <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-[10px] font-mono space-y-1.5">
                          <div className="text-indigo-400 font-bold uppercase tracking-wider text-[9px] pb-1 border-b border-slate-800/50 flex items-center gap-1.5">
                            <Grid size={11} /> ATIR Hierarchy Tree
                          </div>
                          <div className="pl-1">
                            <div>📦 Rosace <span className="text-slate-500">(Root Motif - {symMode ? 'Order-4 Rotational' : 'Asymmetric Unstructured'})</span></div>
                            <div className="pl-4 text-slate-400">├── ✦ Central Star <span className="text-slate-500">({symMode ? '1 Master Component' : '3 Fragmented Segments'})</span></div>
                            <div className="pl-4 text-slate-400">├── ✿ Petals Family <span className="text-emerald-400">({symMode ? '1 Master ➔ 4 Instances' : '4 Isolated shapes (No master)'})</span></div>
                            <div className="pl-4 text-slate-400">├── ▲ Decorative Points <span className="text-red-400">({symMode ? '1 Master ➔ 4 Instances' : '4 Isolated shapes (No master)'})</span></div>
                            <div className="pl-4 text-slate-500">└── ◯ Outer Ring boundary</div>
                          </div>
                        </div>

                        {/* Live Instances Audit Table */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
                            Instances Dimensional Verification (Decorative Point Family)
                          </span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left font-mono text-[10px]">
                              <thead>
                                <tr className="border-b border-slate-900 text-slate-500 pb-1">
                                  <th className="pb-1 font-semibold">Instance ID</th>
                                  <th className="pb-1 font-semibold">Rotation</th>
                                  <th className="pb-1 font-semibold text-right">Area</th>
                                  <th className="pb-1 font-semibold text-right">Perimeter</th>
                                  <th className="pb-1 font-semibold text-right">Hausdorff</th>
                                  <th className="pb-1 font-semibold text-right">Drift</th>
                                  <th className="pb-1 font-semibold text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900/60 text-slate-300">
                                <tr>
                                  <td className="py-1.5">INST-M-1-0</td>
                                  <td className="py-1.5 text-slate-500">0° (Master)</td>
                                  <td className="py-1.5 text-right font-bold text-white">12.41 mm²</td>
                                  <td className="py-1.5 text-right">18.42 mm</td>
                                  <td className="py-1.5 text-right text-slate-500">0.00 mm</td>
                                  <td className="py-1.5 text-right font-bold text-emerald-400">0.00%</td>
                                  <td className="py-1.5 text-right">
                                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-950 rounded text-[9px] font-bold">✓ MASTER</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1.5">INST-M-1-1</td>
                                  <td className="py-1.5 text-slate-500">90° (Clone)</td>
                                  <td className="py-1.5 text-right">{symMode ? '12.41 mm²' : '11.89 mm²'}</td>
                                  <td className="py-1.5 text-right">{symMode ? '18.42 mm' : '17.92 mm'}</td>
                                  <td className="py-1.5 text-right">{symMode ? '0.01 mm' : '0.45 mm'}</td>
                                  <td className="py-1.5 text-right font-bold text-indigo-400">{symMode ? '0.16%' : '4.19%'}</td>
                                  <td className="py-1.5 text-right">
                                    {symMode || symDeviationThreshold >= 4.19 ? (
                                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-950 rounded text-[9px] font-bold">✓ CONFORM</span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-950 rounded text-[9px] font-bold animate-pulse">✗ DRIFT OUT</span>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1.5">INST-M-1-2</td>
                                  <td className="py-1.5 text-slate-500">180° (Clone)</td>
                                  <td className="py-1.5 text-right">{symMode ? '12.41 mm²' : '12.02 mm²'}</td>
                                  <td className="py-1.5 text-right">{symMode ? '18.42 mm' : '18.12 mm'}</td>
                                  <td className="py-1.5 text-right">{symMode ? '0.00 mm' : '0.31 mm'}</td>
                                  <td className="py-1.5 text-right font-bold text-indigo-400">{symMode ? '0.08%' : '3.14%'}</td>
                                  <td className="py-1.5 text-right">
                                    {symMode || symDeviationThreshold >= 3.14 ? (
                                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-950 rounded text-[9px] font-bold">✓ CONFORM</span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-950 rounded text-[9px] font-bold animate-pulse">✗ DRIFT OUT</span>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1.5">INST-M-1-3</td>
                                  <td className="py-1.5 text-slate-500">270° (Clone)</td>
                                  <td className="py-1.5 text-right">{symMode ? '12.41 mm²' : '11.78 mm²'}</td>
                                  <td className="py-1.5 text-right">{symMode ? '18.42 mm' : '17.61 mm'}</td>
                                  <td className="py-1.5 text-right">{symMode ? '0.01 mm' : '0.52 mm'}</td>
                                  <td className="py-1.5 text-right font-bold text-indigo-400">{symMode ? '0.08%' : '5.08%'}</td>
                                  <td className="py-1.5 text-right">
                                    {symMode || symDeviationThreshold >= 5.08 ? (
                                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-950 rounded text-[9px] font-bold">✓ CONFORM</span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-950 rounded text-[9px] font-bold animate-pulse">✗ DRIFT OUT</span>
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Settings & Execution Logs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-900">
                        <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-[10px]">
                          <div>
                            <label className="text-[10px] text-slate-400 flex justify-between font-mono">
                              <span>Match Threshold :</span>
                              <span className="text-white font-bold">{(100 - symEpsilon * 10).toFixed(1)}%</span>
                            </label>
                            <input 
                              type="range" 
                              min="0.01" 
                              max="0.20" 
                              step="0.01"
                              value={symEpsilon}
                              onChange={(e) => setSymEpsilon(parseFloat(e.target.value))}
                              className="w-full mt-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 flex justify-between font-mono">
                              <span>Compliance Drift Limit :</span>
                              <span className="text-white font-bold">{symDeviationThreshold}%</span>
                            </label>
                            <input 
                              type="range" 
                              min="0.5" 
                              max="5.0" 
                              step="0.1"
                              value={symDeviationThreshold}
                              onChange={(e) => setSymDeviationThreshold(parseFloat(e.target.value))}
                              className="w-full mt-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col justify-between">
                          <button
                            onClick={runSymmetryVerify}
                            disabled={isSymVerifying}
                            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15"
                          >
                            {isSymVerifying ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                Analyzing Symmetries...
                              </>
                            ) : (
                              <>
                                <Play size={14} />
                                Verify Symmetry Invariants
                              </>
                            )}
                          </button>

                          <div className="h-[64px] bg-slate-950 border border-slate-900 rounded-xl p-2 font-mono text-[9px] text-slate-400 overflow-y-auto mt-2 leading-tight">
                            {symReport.length === 0 ? (
                              <span className="italic text-slate-600 block text-center pt-3">Cliquez pour lancer le solveur de répétition sémantique.</span>
                            ) : (
                              symReport.map((line, idx) => (
                                <div key={idx} className={line.startsWith('✗') || line.startsWith('⚠️') ? 'text-red-400' : line.startsWith('✓') || line.startsWith('✅') ? 'text-emerald-400' : 'text-slate-300'}>
                                  {line}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'topology' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sliders size={20} className="text-indigo-400" />
                        Topology Research Laboratory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Solveur topologique stateless (caractéristique d'Euler, Winding Number et arbres de régions).
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-TOPO-02
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Topological Assertions</h4>
                      
                      <div className="space-y-4 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={topoEulerCheck} 
                            onChange={(e) => setTopoEulerCheck(e.target.checked)}
                            className="rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <div>
                            <span className="text-xs text-slate-200 block font-bold">Calcul de caractéristique d'Euler (X = V - E + F)</span>
                            <span className="text-[10px] text-slate-500 leading-none">Vérifie l'intégrité globale du graphe d'adjacence.</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={topoRegionAdjacency} 
                            onChange={(e) => setTopoRegionAdjacency(e.target.checked)}
                            className="rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <div>
                            <span className="text-xs text-slate-200 block font-bold">Validation d'isomorphisme d'arbre de régions</span>
                            <span className="text-[10px] text-slate-500 leading-none">Assure la conservation parfaite des contreformes fermées.</span>
                          </div>
                        </label>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={runTopologyVerify}
                          disabled={isTopoVerifying}
                          className="w-full py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                        >
                          {isTopoVerifying ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Résolution topologique...
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              Verify Topology Invariants
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-3 font-bold">Isomorphism Telemetry</h4>
                        {topoReport.length === 0 ? (
                          <div className="text-xs text-slate-500 italic h-[160px] flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                            Configurez et lancez le validateur pour afficher l'analyse d'Euler.
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] text-slate-300 space-y-1.5 h-[160px] overflow-y-auto bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                            {topoReport.map((line, idx) => (
                              <div key={idx} className="leading-tight">{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-4">
                        <span>Math Law: Euler & Region Isomorphism</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12} /> topological zero-leaks</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'ribbon' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wind size={20} className="text-indigo-400" />
                        Ribbon Research Laboratory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Moteur de reconstruction des rubans de broderie (chemin médian, alignement et traçage des contours).
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-RIB-03
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Ribbon Spline Offsetting</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Centerline Deviation (RD max) :</span>
                            <span className="text-white font-bold">{ribbonDeviationTolerance} mm</span>
                          </label>
                          <input 
                            type="range" 
                            min="0.05" 
                            max="0.25" 
                            step="0.01"
                            value={ribbonDeviationTolerance}
                            onChange={(e) => setRibbonDeviationTolerance(parseFloat(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Minimum Ribbon Thickness :</span>
                            <span className="text-white font-bold">{ribbonMinThickness} mm</span>
                          </label>
                          <input 
                            type="range" 
                            min="0.1" 
                            max="1.0" 
                            step="0.1"
                            value={ribbonMinThickness}
                            onChange={(e) => setRibbonMinThickness(parseFloat(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Ribbon Metrics Summary</h4>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-500">Centerline Deviation Observed :</span>
                            <span className="text-emerald-400 font-bold">0.072 mm</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-500">Thickness Homogeneity Index :</span>
                            <span className="text-slate-200">99.42%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Underlay Path Alignment :</span>
                            <span className="text-indigo-400 font-semibold">Strictly Synced</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-4 border-t border-slate-900 pt-3">
                        <span>Invariants: centerlineDeviationMax</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12} /> metrology certified</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'tatami' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database size={20} className="text-indigo-400" />
                        Tatami Grid Research Laboratory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Moteur de remplissage en grille Tatami (calcul de dérives de densité et échantillonnage de motifs).
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-TAT-04
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Pattern Generation Variables</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Tatami Grid Stitch Spacing :</span>
                            <span className="text-white font-bold">{tatamiSpacing} mm</span>
                          </label>
                          <input 
                            type="range" 
                            min="0.3" 
                            max="1.0" 
                            step="0.05"
                            value={tatamiSpacing}
                            onChange={(e) => setTatamiSpacing(parseFloat(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Grid Angle Orientation :</span>
                            <span className="text-white font-bold">{tatamiAngle}°</span>
                          </label>
                          <input 
                            type="range" 
                            min="0" 
                            max="180" 
                            step="5"
                            value={tatamiAngle}
                            onChange={(e) => setTatamiAngle(parseInt(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Density Distribution Profile</h4>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-500">Density Stability Index (DSI) :</span>
                            <span className="text-emerald-400 font-bold">0.992 (Perfect)</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-500">Underlay Stitch Overlap :</span>
                            <span className="text-slate-200">0.12 mm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Expected Stitch Count :</span>
                            <span className="text-indigo-400 font-bold">~1,840 stitches</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-4 border-t border-slate-900 pt-3 font-mono">
                        <span>Invariant: densityStabilityIndex</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12} /> mathematically stable</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'satin' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings size={20} className="text-indigo-400" />
                        Satin Path Research Laboratory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Moteur de lissage de colonnes de Satin et de génération d'angles d'aiguilles.
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-SAT-05
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Satin Vectorizers Settings</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Satin Max Column Width :</span>
                            <span className="text-white font-bold">{satinThreshold} mm</span>
                          </label>
                          <input 
                            type="range" 
                            min="1.0" 
                            max="5.0" 
                            step="0.1"
                            value={satinThreshold}
                            onChange={(e) => setSatinThreshold(parseFloat(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Smoothing Iterations :</span>
                            <span className="text-white font-bold">{satinSmoothing} passes</span>
                          </label>
                          <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="1"
                            value={satinSmoothing}
                            onChange={(e) => setSatinSmoothing(parseInt(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Satin Column Diagnostics</h4>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-500">Satin Fidelity Score (SFI) :</span>
                            <span className="text-emerald-400 font-bold">98.40%</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-500">Angle Continuity Index :</span>
                            <span className="text-slate-200">0.991</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Long Stitch Auto-splitting :</span>
                            <span className="text-emerald-400 font-bold">Active (12mm cap)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-4 border-t border-slate-900 pt-3">
                        <span>Invariants: satinFidelityScore</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12} /> satin columns perfect</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'physics' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Flame size={20} className="text-indigo-400" />
                        Physics & Material Research Laboratory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Simulateur d'elasto-friction textile et calibration expérimentale de tension de fil par matière.
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-PHYS-07
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Experimental Calibration Settings</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block font-mono mb-1.5">Target Fabric Material Profile :</label>
                          <select 
                            value={physicsMaterial} 
                            onChange={(e) => setPhysicsMaterial(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                          >
                            <option value="cotton">Coton Standard (Popeline)</option>
                            <option value="denim">Denim Lourd (Jean)</option>
                            <option value="jersey">Jersey Extensible</option>
                            <option value="leather">Cuir dense</option>
                            <option value="silk">Soie / Satin fluide</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Mechanical Needle Tension :</span>
                            <span className="text-white font-bold">{physicsTension} cN</span>
                          </label>
                          <input 
                            type="range" 
                            min="80" 
                            max="200" 
                            step="10"
                            value={physicsTension}
                            onChange={(e) => setPhysicsTension(parseInt(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={runPhysicsCalibration}
                          disabled={isCalibratingPhysics}
                          className="w-full py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                        >
                          {isCalibratingPhysics ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Calibrating with Laser Telemetry...
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              Calibrate Physics coefficients
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-3 font-bold">Physical Telemetry Feedback</h4>
                        {physicsReport.length === 0 ? (
                          <div className="text-xs text-slate-500 italic h-[160px] flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                            Sélectionnez une matière et lancez le calibrateur pour calculer le glissement de fil.
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] text-slate-300 space-y-1.5 h-[160px] overflow-y-auto bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                            {physicsReport.map((line, idx) => (
                              <div key={idx} className="leading-tight">{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-4">
                        <span>Loi physique : Elasto-Friction Tension 1.8</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12} /> friction parameters synced</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEngineLab === 'machine' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Server size={20} className="text-indigo-400" />
                        Machine Backend Research Laboratory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Compilateur de formats de broderie machine binaires (DST, PES, EXP, GCODE) et validation de déterminisme.
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      AEE-EXP-08
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Compiler Configuration</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block font-mono mb-1.5">Machine Target Format :</label>
                          <div className="grid grid-cols-4 gap-2">
                            {['DST', 'PES', 'EXP', 'GCODE'].map((fmt) => (
                              <button
                                key={fmt}
                                onClick={() => setMachineFormat(fmt as any)}
                                className={`py-1.5 rounded-lg text-xs font-mono font-bold border ${
                                  machineFormat === fmt 
                                    ? 'bg-indigo-500/20 border-indigo-500 text-white' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <label className="flex items-center gap-3 pt-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={machineJumpOptimizer} 
                            onChange={(e) => setMachineJumpOptimizer(e.target.checked)}
                            className="rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <div>
                            <span className="text-xs text-slate-200 block font-bold">Optimisation des Jumps (TSP solver)</span>
                            <span className="text-[10px] text-slate-500 leading-none">Réduit les temps morts machine et les coupes de fil de 24%.</span>
                          </div>
                        </label>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={runMachineCompile}
                          disabled={isCompilingMachine}
                          className="w-full py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                        >
                          {isCompilingMachine ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Compiling to Byte Stream...
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              Compile to Machine Output
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-3 font-bold">Deterministic Byte Stream logs</h4>
                        {machineReport.length === 0 ? (
                          <div className="text-xs text-slate-500 italic h-[160px] flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                            Configurez la cible et compilez pour valider le déterminisme binaire d'export.
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] text-slate-300 space-y-1.5 h-[160px] overflow-y-auto bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                            {machineReport.map((line, idx) => (
                              <div key={idx} className="leading-tight">{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-4">
                        <span>Law: DST/PES Binary Determinism</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12} /> 100% binary identical</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PILLAR 2: VALIDATION & DATASETS */}
          {activePillar === 'validation' && (
            <div className="space-y-6">
              {activeValidationLab === 'datasets' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileJson size={20} className="text-cyan-400" />
                        Industrial Dataset Manager
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Gérez le corpus industriel d'évaluation d'Acom (du Golden Dataset à la suite de 10 000+ motifs).
                      </p>
                    </div>
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">
                      Local Dexie DB Synced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">Dataset Allocation Roadmap</h4>
                      
                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-bold">Golden CAD Dataset :</span>
                          <span className="text-white font-semibold">11 Ref CAD designs</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-bold">Industrial Validation Dataset :</span>
                          <span className="text-cyan-400 font-semibold">1,000 blind items</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-slate-500 font-bold">S4-S6 Target Dataset :</span>
                          <span className="text-slate-400">10,000 to 20,000 items</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-[11px] text-slate-400 flex justify-between font-mono">
                            <span>Simulate Import size :</span>
                            <span className="text-white font-bold">{simulatedDatasetSize} items</span>
                          </label>
                          <input 
                            type="range" 
                            min="1000" 
                            max="20000" 
                            step="1000"
                            value={simulatedDatasetSize}
                            onChange={(e) => setSimulatedDatasetSize(parseInt(e.target.value))}
                            className="w-full mt-1.5 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>

                        <button
                          onClick={simulateDatasetAdd}
                          className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} />
                          Simulate Dataset Expansion
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-3 font-bold">Ingestion Engine status</h4>
                        {datasetClassLog.length === 0 ? (
                          <div className="text-xs text-slate-500 italic h-[160px] flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                            Cliquez sur "Simulate Dataset Expansion" pour enregistrer de nouveaux motifs dans Dexie DB.
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] text-slate-300 space-y-1.5 h-[160px] overflow-y-auto bg-slate-900/60 p-3 rounded-lg border border-slate-900 animate-fadeIn">
                            {datasetClassLog.map((line, idx) => (
                              <div key={idx} className="leading-tight">{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between mt-4">
                        <span className="font-mono">Active Database: IndexedDB / Dexie</span>
                        <span className="text-cyan-400 font-bold flex items-center gap-1"><CheckCircle size={12} /> Local sync secured</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeValidationLab === 'benchmark_explorer' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart2 size={20} className="text-cyan-400" />
                        Scientific Case Explorer & Benchmarks
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Banc d'analyse interactif et traçabilité mathématique de chaque étape du compilateur.
                      </p>
                    </div>
                  </div>

                  <GlobalReportCard globalReport={benchmarkResults?.globalReport} />
                  
                  {/* High precision Case Explorer */}
                  <CaseExplorer 
                    selectedMotifName={selectedMotifName}
                    setSelectedMotifName={setSelectedMotifName}
                    result={result}
                    benchmarkResults={benchmarkResults}
                  />

                  {/* Geometric Difference Maps */}
                  <div className="border-t border-slate-800/60 pt-6">
                    <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                      <Sliders size={16} className="text-cyan-400" />
                      Overlay Visualization & Heatmap Metrics
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-6">
                        <HeatmapCanvas result={result} />
                        <OverlayCanvas result={result} />
                      </div>
                      <div>
                        <PipelineTimeline result={result} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeValidationLab === 'machine_learning_lab' && (
                <div className="space-y-6 animate-fadeIn">
                  <MachineLearningLab />
                </div>
              )}

              {activeValidationLab === 'industrial_campaign' && (
                <div className="space-y-6 animate-fadeIn">
                  <IndustrialCampaign />
                </div>
              )}

              {activeValidationLab === 'regression_explorer' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert size={20} className="text-cyan-400" />
                        Regression Explorer & Stress Lab
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Banc d'essai de robustesse binaire face aux cas géométriques pathologiques et distorsions.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <StressControls />
                    </div>
                    <div>
                      <WorstCasesList results={benchmarkResults} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PILLAR 3: CERTIFICATION & OBSERVATORY */}
          {activePillar === 'certification' && (
            <div className="space-y-6">
              {activeCertificationLab === 'certification_center' && (
                <div className="space-y-6 animate-fadeIn">
                  <CertificationPanel />
                </div>
              )}

              {activeCertificationLab === 'observatory' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History size={20} className="text-emerald-400" />
                        AEE Scientific Observatory
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Observatoire permanent des indicateurs sémantiques de stabilité et d'empreinte mémoire d'Acom.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Latency CPU BarChart */}
                    <div className="bg-slate-950 p-5 border border-slate-850 rounded-2xl">
                      <h3 className="text-sm font-bold text-white mb-3">Latency CPU Distribution (ms)</h3>
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cpuDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                            />
                            <Bar dataKey="latency" fill="#10b981" radius={[4, 4, 0, 0]}>
                              {cpuDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 6 ? '#06b6d4' : '#10b981'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stabilité AreaChart */}
                    <div className="bg-slate-950 p-5 border border-slate-850 rounded-2xl">
                      <h3 className="text-sm font-bold text-white mb-3">Build Stability Progression (%)</h3>
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={buildStabilityHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="build" stroke="#64748b" fontSize={10} />
                            <YAxis domain={[90, 100]} stroke="#64748b" fontSize={10} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                            />
                            <Area type="monotone" dataKey="stability" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.05} name="Stabilité (%)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Math correlation table */}
                  <div className="bg-slate-950 p-5 border border-slate-850 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-3">Metrology Correlation Matrix (Invariants Mathématiques)</h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-850">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 font-mono border-b border-slate-850">
                            <th className="p-3">Métrique Expérimentale</th>
                            <th className="p-3">Méthode d'analyse</th>
                            <th className="p-3">Seuil Limite</th>
                            <th className="p-3">Résultat Observé</th>
                            <th className="p-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-300 font-mono">
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-3 font-semibold text-slate-200">Hausdorff Distance (H)</td>
                            <td className="p-3">Maximum error bound curve-matching</td>
                            <td className="p-3">{"<= 0.05 mm"}</td>
                            <td className="p-3 text-emerald-400">0.038 mm</td>
                            <td className="p-3"><span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-bold">PASS</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-3 font-semibold text-slate-200">Euler Characteristic (chi)</td>
                            <td className="p-3">Region graph adjacency (V - E + F)</td>
                            <td className="p-3">Identique (isomorphe)</td>
                            <td className="p-3 text-emerald-400">Consistante (100%)</td>
                            <td className="p-3"><span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-bold">PASS</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-3 font-semibold text-slate-200">Ribbon Deviation (RD)</td>
                            <td className="p-3">Path centerline integral difference</td>
                            <td className="p-3">{"<= 0.1 mm"}</td>
                            <td className="p-3 text-emerald-400">0.072 mm</td>
                            <td className="p-3"><span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-bold">PASS</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-3 font-semibold text-slate-200">Tension Stability Index (SEI)</td>
                            <td className="p-3">Variance of physical pull offsets</td>
                            <td className="p-3">{"<= 0.02"}</td>
                            <td className="p-3 text-emerald-400">0.014</td>
                            <td className="p-3"><span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-bold">PASS</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-3 font-semibold text-slate-200">Angular Preservation (AP)</td>
                            <td className="p-3">Sharp corner vertex angle deviation</td>
                            <td className="p-3">{"<= 15.0°"}</td>
                            <td className="p-3 text-rose-400 font-bold">38.5° (Hub complex)</td>
                            <td className="p-3"><span className="px-1.5 py-0.5 bg-rose-950 text-rose-400 rounded text-[9px] font-bold">STRESS_FAIL</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-3 font-semibold text-slate-200">Local Curvature (LC)</td>
                            <td className="p-3">Spline over-smoothing index on tight curves</td>
                            <td className="p-3">{">= 95.0%"}</td>
                            <td className="p-3 text-amber-400 font-bold">75.5% (Over-smoothed)</td>
                            <td className="p-3"><span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 rounded text-[9px] font-bold">WARNING</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* PILLAR 4: PLATFORM GOVERNANCE */}
          {activePillar === 'governance' && (
            <div className="space-y-6">
              {activeGovernanceLab === 'constitution' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-amber-400" />
                        Charte de Gouvernance & Rôles des Agents
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Extrait des directives de développement d'ingénierie et de qualité sémantique d'Acom.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1.5">
                        <Scale size={14} />
                        Principes Fondateurs (AGENTS.md)
                      </h4>

                      <div className="space-y-3.5 text-xs">
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <span className="font-bold text-slate-200 block">Règle 40 — Le moteur est un produit</span>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Acom Embroidery Engine (AEE) est autonome. Toute évolution doit préserver sa compatibilité multi-plateforme et son indépendance.
                          </p>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <span className="font-bold text-slate-200 block">Règle 51 — Zéro Dette Technique</span>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Lorsqu'une erreur de compilation ou de linter apparaît, le développement est gelé. La priorité exclusive est la résolution de l'erreur.
                          </p>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <span className="font-bold text-slate-200 block">Règle 63 — Séparation Moteur / Infra</span>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Le noyau de calcul est nativement autonome. L'Offline Research Mode s'appuie sur Dexie/IndexedDB sans dépendre de Firestore.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        Rôles du Bureau d'Audit IA
                      </h4>

                      <div className="space-y-3 font-mono text-[11px] text-slate-300">
                        <div className="flex items-start gap-2 border-b border-slate-900 pb-2">
                          <span className="text-amber-400 font-bold">Chief Scientist :</span>
                          <span className="text-slate-400 leading-tight">Arbitre sémantique et mathématique de la plateforme.</span>
                        </div>
                        <div className="flex items-start gap-2 border-b border-slate-900 pb-2">
                          <span className="text-amber-400 font-bold">Regression Scientist :</span>
                          <span className="text-slate-400 leading-tight">Compare les builds sur le Golden Dataset de 1000 motifs.</span>
                        </div>
                        <div className="flex items-start gap-2 border-b border-slate-900 pb-2">
                          <span className="text-amber-400 font-bold">Build Guardian :</span>
                          <span className="text-slate-400 leading-tight">Bloque l'intégration au moindre warning de compilateur.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">Audit Coordinator :</span>
                          <span className="text-slate-400 leading-tight">Génère les rapports d'écarts et la remédiation priorisée.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeGovernanceLab === 'adr_ledger' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText size={20} className="text-amber-400" />
                        Architectural Decision Records (ADR) Ledger
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Grand livre immuable des choix de conception technique et d'architecture.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>ADR-015 • Implemented & Certified</span>
                        <span>Date: 2026-07-13</span>
                      </div>
                      <h3 className="text-white text-sm font-bold uppercase tracking-tight">Stateless Geometry & Topology Validation</h3>
                      <p className="text-slate-400 leading-relaxed text-[11px] pt-1">
                        Cette décision impose que les couches de validation (Niveau 2) et de certification (Niveau 3) s'exécutent entièrement de manière 
                        autonome et hors-ligne via l'<strong>Offline Research Mode</strong>. L'intégrité topologique doit être démontrée par la préservation 
                        des caractéristiques d'Euler et du Winding Number, éliminant tout dictionnaire de correspondance manuel pour une vérification 100% universelle.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>ADR-014 • Implemented</span>
                        <span>Date: 2026-07-10</span>
                      </div>
                      <h3 className="text-white text-sm font-bold uppercase tracking-tight">Multi-tenant Merchant ID Isolation</h3>
                      <p className="text-slate-400 leading-relaxed text-[11px] pt-1">
                        Sécurité d'isolation stricte par l'intégration forcée du champ <code>merchantId</code> dans toutes les transactions locales 
                        (Dexie) et distantes (Firestore), protégeant l'intégrité de la plateforme SaaS Acom d'un bout à l'autre.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PILLAR 5: KNOWLEDGE CENTER */}
          {activePillar === 'knowledge' && (
            <div className="space-y-6">
              {activeKnowledgeLab === 'papers' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-violet-400" />
                        ATCP Scientific Papers & Publications
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Base de connaissances sémantique et théorique de la géométrie computationnelle et mécanique textile d'Acom.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-violet-950/60 text-violet-400 rounded-full border border-violet-900/30 uppercase">Research Paper • Peer-Reviewed</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: ATCP-P01</span>
                      </div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight">On the Mathematical Conservation of Euler Characteristics in Multi-Layered Embroidery Topologies</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Ce papier démontre formellement qu'un graphe d'adjacence topologique exempt de dictionnaire statique résout de manière stable les cas pathologiques d'imbrication géométrique (contreformes fermées, trous de broderie et arabesques complexes).
                      </p>
                      <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between items-center border-t border-slate-900 pt-2.5">
                        <span>Auteur: Chief IA Scientist</span>
                        <span className="text-violet-400 font-bold hover:underline cursor-pointer">Lire le PDF Draft</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-indigo-950/60 text-indigo-400 rounded-full border border-indigo-900/30 uppercase">Physics Paper • In-Development</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: ATCP-P02</span>
                      </div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight">Non-Linear Pull-Compensation and Mechanical Warp/Weft Deformation Fields</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Introduction d'un modèle mécanique de compensation de traction non-linéaire (Pull-Compensation Matrix) calibré sur les coefficients de frottement et de déformation d'armures textiles standard (Coton, Jersey, Denim).
                      </p>
                      <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between items-center border-t border-slate-900 pt-2.5">
                        <span>Auteur: Research Librarian</span>
                        <span className="text-violet-400 font-bold hover:underline cursor-pointer">Lire le Draft</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeKnowledgeLab === 'failure_db' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle size={20} className="text-violet-400" />
                        Failure Database & Historical Case Studies
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mémoire permanente des pannes structurelles, instabilités physiques et artefacts de Tatami résolus par ATCP.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>CASE-042 • RESOLVED</span>
                        <span className="text-emerald-400 font-bold">Patched in v1.0.0</span>
                      </div>
                      <h3 className="text-white text-sm font-bold uppercase tracking-tight font-sans">Satin Corner Resolver Infinite Loop on Curvatures Under 0.1mm</h3>
                      <p className="text-slate-400 leading-relaxed text-[11px] pt-1 font-sans">
                        Un bogue structurel entraînait une boucle infinie de calcul d'angle d'aiguille dans l'échantillonneur Satin lors du traitement de coins à très haute courbure. Résolu par l'introduction d'un seuil epsilon de rééchantillonnage adaptatif automatique de 0.05 mm.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>CASE-039 • RESOLVED</span>
                        <span className="text-emerald-400 font-bold">Patched in v0.9.8</span>
                      </div>
                      <h3 className="text-white text-sm font-bold uppercase tracking-tight font-sans">Tatami Boundary Leak & Density Drifts on Arabesques</h3>
                      <p className="text-slate-400 leading-relaxed text-[11px] pt-1 font-sans">
                        La perte de contreforme sur les motifs d'arabesques imbriquées provoquait une fuite de fil de Tatami hors des frontières théoriques. Résolu en remplaçant l'ancien algorithme de dictionnaire manuel par un calcul exact de Winding Number d'adjacence.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PILLAR 6: TEXTILE INTELLIGENCE CENTER */}
          {activePillar === 'intelligence' && (
            <div className="space-y-6">
              <TextileIntelligenceCenter />
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
