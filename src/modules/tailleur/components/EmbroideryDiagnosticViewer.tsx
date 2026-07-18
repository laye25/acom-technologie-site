import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  Sliders, 
  Play, 
  History, 
  Eye, 
  RefreshCw, 
  FileText, 
  Maximize2, 
  ZoomIn, 
  TrendingUp, 
  Terminal, 
  Database, 
  Check, 
  Info, 
  ChevronRight,
  ShieldAlert,
  Fingerprint,
  ArrowDown
} from 'lucide-react';
import { 
  GeometryAutopsyService, 
  GeometryMetrics, 
  GeometryDrift, 
  GeometryAudit 
} from '../services/GeometryAutopsyService';
import { ScientificSnapshotService, GeometrySnapshot, ScientificRevision } from '../services/ScientificSnapshotService';
import { db } from '../../../db/db';

export function getLayersExecutionProof(layers: any[]): {
  hash: string;
  count: number;
  totalPoints: number;
  details: string;
} {
  if (!layers || layers.length === 0) {
    return { hash: 'EMPTY', count: 0, totalPoints: 0, details: '[]' };
  }
  
  let totalPoints = 0;
  const layerSummaries = layers.map((l, i) => {
    const pts = l.points || [];
    totalPoints += pts.length;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    
    pts.forEach((p: any) => {
      const x = p.x || 0;
      const y = p.y || 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      sumX += x;
      sumY += y;
    });
    
    const count = pts.length;
    const centroidX = count > 0 ? (sumX / count) : 0;
    const centroidY = count > 0 ? (sumY / count) : 0;
    
    return {
      index: i,
      id: l.id,
      name: l.name,
      color: l.color,
      pointsCount: count,
      centroid: { x: centroidX, y: centroidY },
      boundingBox: count > 0 ? { minX, maxX, minY, maxY } : null
    };
  });
  
  let stableStr = '';
  layers.forEach((l, i) => {
    const pts = l.points || [];
    stableStr += `L${i}_ID${l.id || ''}_T${l.stitchType || ''}_C${l.color || ''}_D${l.density || 0}_A${l.angle || 0}_P${pts.length}:` + pts.map((p: any) => `${(p.x || 0).toFixed(4)},${(p.y || 0).toFixed(4)}`).join(';');
  });
  
  let hash = 5381;
  for (let i = 0; i < stableStr.length; i++) {
    hash = ((hash << 5) + hash) + stableStr.charCodeAt(i);
    hash = hash & hash;
  }
  const hashHex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  
  const details = JSON.stringify(layerSummaries, null, 2);
  return {
    hash: hashHex,
    count: layers.length,
    totalPoints,
    details
  };
}

export interface ScientificTextileAsset {
  id: string;
  projectName: string;
}

interface EmbroideryDiagnosticViewerProps {
  asset?: ScientificTextileAsset;
  liveLayers?: any[];
  onApplyLayers?: (newLayers: any[], stepTitle?: string) => void;
  onRestoreCanvas?: () => void;
}

export const EmbroideryDiagnosticViewer: React.FC<EmbroideryDiagnosticViewerProps> = ({ 
  asset,
  liveLayers = [],
  onApplyLayers,
  onRestoreCanvas
}) => {
  const logLayerGeometry = (label: string, layersList: any[]) => {
    if (!layersList || layersList.length === 0) {
      console.log(`[${label}] - Aucune couche`);
      return;
    }
    let totalPts = 0;
    let firstPt: any = null;
    let lastPt: any = null;
    
    layersList.forEach((l) => {
      const pts = l.points || [];
      totalPts += pts.length;
      if (l.subpaths) {
        l.subpaths.forEach((sub: any) => {
          totalPts += sub.length;
        });
      }
    });

    for (let i = 0; i < layersList.length; i++) {
      const pts = layersList[i].points || [];
      if (pts.length > 0) {
        firstPt = pts[0];
        break;
      }
      if (layersList[i].subpaths && layersList[i].subpaths.length > 0) {
        for (let j = 0; j < layersList[i].subpaths.length; j++) {
          if (layersList[i].subpaths[j].length > 0) {
            firstPt = layersList[i].subpaths[j][0];
            break;
          }
        }
        if (firstPt) break;
      }
    }

    for (let i = layersList.length - 1; i >= 0; i--) {
      const pts = layersList[i].points || [];
      if (pts.length > 0) {
        lastPt = pts[pts.length - 1];
        break;
      }
      if (layersList[i].subpaths && layersList[i].subpaths.length > 0) {
        for (let j = layersList[i].subpaths.length - 1; j >= 0; j--) {
          if (layersList[i].subpaths[j].length > 0) {
            lastPt = layersList[i].subpaths[j][layersList[i].subpaths[j].length - 1];
            break;
          }
        }
        if (lastPt) break;
      }
    }

    console.log(`%c[${label}]`, 'color: #3b82f6; font-weight: bold;');
    console.log(`  - Nombre de couches: ${layersList.length}`);
    console.log(`  - Nombre total de points: ${totalPts}`);
    console.log(`  - Premier point: ${firstPt ? `(${firstPt.x.toFixed(2)}, ${firstPt.y.toFixed(2)})` : 'N/A'}`);
    console.log(`  - Dernier point: ${lastPt ? `(${lastPt.x.toFixed(2)}, ${lastPt.y.toFixed(2)})` : 'N/A'}`);
  };

  const [latestSnapshot, setLatestSnapshot] = useState<GeometrySnapshot | null>(null);
  const [latestRevision, setLatestRevision] = useState<ScientificRevision | null>(null);
  const lastProcessedRevId = useRef<string>('');
  
  // Pipeline simulation configuration state
  const [rdpEpsilon, setRdpEpsilon] = useState<number>(1.2);
  const [offsetFactor, setOffsetFactor] = useState<number>(0);
  const [filterThreshold, setFilterThreshold] = useState<number>(10);
  const [noiseStrength, setNoiseStrength] = useState<number>(1.0);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lineageError, setLineageError] = useState<boolean>(false);

  const [autopsyResult, setAutopsyResult] = useState<{
    audit: GeometryAudit;
    steps: {
      step: string;
      title: string;
      svg: string;
      metrics: GeometryMetrics;
      drift: GeometryDrift;
      layers?: any[];
    }[];
  } | null>(null);

  const [activeStepIndex, setActiveStepIndex] = useState<number>(4); // Default on RDP
  const [zoomMode, setZoomMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'visual' | 'spreadsheet' | 'journal' | 'history' | 'lineage'>('lineage');
  const [savedAudits, setSavedAudits] = useState<GeometryAudit[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const [lineageData, setLineageData] = useState<any>(null);

  // Live characteristics of the working state
  const livePointsCount = useMemo(() => {
    let count = 0;
    liveLayers.forEach(l => {
      count += l.points?.length || 0;
      if (l.subpaths) {
        l.subpaths.forEach((sp: any) => count += sp.length);
      }
    });
    return count;
  }, [liveLayers]);

  const [liveHash, setLiveHash] = useState<string>('');

  useEffect(() => {
    const calculateHash = async () => {
      try {
        const layersCopy = JSON.parse(JSON.stringify(liveLayers));
        const layerStr = JSON.stringify(layersCopy.map((l: any) => ({ points: l.points, subpaths: l.subpaths })));
        const hash = await GeometryAutopsyService.calculateHash(layerStr);
        setLiveHash(hash.toUpperCase());
      } catch (err) {
        console.error("Failed to compute live hash:", err);
      }
    };
    calculateHash();
  }, [liveLayers]);

  // strict check if working state is in perfect synchronization with Dexie snapshot
  const isSynchronized = useMemo(() => {
    if (!latestSnapshot) return false;
    const sameLayerCount = latestSnapshot.layerCount === liveLayers.length;
    const samePointsCount = latestSnapshot.pointsCount === livePointsCount;
    const sameHash = latestSnapshot.hash === liveHash;
    return sameLayerCount && samePointsCount && sameHash;
  }, [latestSnapshot, liveLayers.length, livePointsCount, liveHash]);

  const activeLayers = latestSnapshot?.layers || [];
  const projectName = asset?.projectName || "Projet Inconnu";
  const isValidAsset = liveLayers.length > 0;

  const executeAutopsyHelper = async (revId: string, snap: any) => {
    console.log("✓ handleRunAutopsy exécuté", new Date().toISOString());
    console.log("SNAPSHOT DATA:");
    console.log("  Snapshot ID:", snap?.id);
    console.log("  Snapshot Hash:", snap?.hash);
    console.log("  Layer Count:", snap?.layerCount);
    console.log("  Points Count:", snap?.pointsCount);
    console.log("  Revision ID:", revId);
    console.log("  Asset ID:", asset?.id);

    console.log("CONTENT VERIFICATION:");
    console.log("  snapshot.layers.length:", snap?.layers?.length || 0);
    if (snap?.layers) {
      snap.layers.forEach((layer: any, idx: number) => {
        console.log(`  snapshot.layers[${idx}]:`, layer);
      });
    }

    const result = await GeometryAutopsyService.runAutopsy(revId, {
      rdpEpsilon,
      offsetFactor,
      filterThreshold,
      noiseStrength
    });

    lastProcessedRevId.current = revId;

    console.log("RESULT RECU");
    console.log("  result == null ?", result == null);
    if (result) {
      const obsCount = result.steps.flatMap(s => s.drift.details).length;
      console.log("  Nombre d'observations:", obsCount);
      console.log("  Nombre de steps:", result.steps.length);
      console.log("  Audit ID:", result.audit.id);
    }

    return result;
  };

  // Pipeline Synchronization function: Canvas React -> Working State -> Dexie Snapshot -> Autopsy
  const handleSynchronizePipeline = async () => {
    if (!asset?.id) return;
    setIsSyncing(true);
    try {
      // 1. Ensure the asset is correctly saved or updated in Dexie
      let assetInDb = await db.scientific_textile_assets.get(asset.id);
      if (!assetInDb) {
        assetInDb = {
          id: asset.id,
          merchantId: 'M-DEFAULT',
          name: asset.projectName,
          status: 'draft',
          lifecycle: 'Active',
          currentRevisionId: null,
          latestCertifiedRevisionId: null,
          hash: liveHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.scientific_textile_assets.put(assetInDb);
      }

      // 2. Create the snapshot
      const snapshot = await ScientificSnapshotService.createSnapshot(asset.id, liveLayers, 'AUTOPSY');
      
      // 3. Create the revision record
      const revision = await ScientificSnapshotService.createRevision(asset.id, snapshot, 'Draft');
      
      setLatestSnapshot(snapshot);
      setLatestRevision(revision);
      setLineageError(false);

      // 4. Run Autopsy differential diagnostic automatically
      const result = await executeAutopsyHelper(revision.id, snapshot);
      setAutopsyResult(result);

      // 5. Refresh Saved Audits
      const audits = await db.geometry_audits.reverse().toArray();
      setSavedAudits(audits);
    } catch (e) {
      console.error("Pipeline synchronization failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Run scientific geometry autopsy with strict pipeline validation
  const handleRunAutopsy = useCallback(async () => {
    if (!isSynchronized) {
      setLineageError(true);
      return;
    }
    setLineageError(false);
    setIsRunning(true);
    
    setTimeout(async () => {
      try {
        if (!latestRevision) return;
        const result = await executeAutopsyHelper(latestRevision.id, latestSnapshot);
        setAutopsyResult(result);
        setIsRunning(false);
        const audits = await db.geometry_audits.reverse().toArray();
        setSavedAudits(audits);
      } catch (e) {
        console.error("Autopsy failed:", e);
        setIsRunning(false);
      }
    }, 300);
  }, [isSynchronized, latestRevision, latestSnapshot, rdpEpsilon, offsetFactor, filterThreshold, noiseStrength]);

  // Auto-synchronize / Initial setup effect on project mount
  useEffect(() => {
    if (!asset?.id || liveHash === '') return;

    const initLoadAndSync = async () => {
      try {
        const latestRev = await ScientificSnapshotService.getLatestRevision(asset.id);
        
        let livePoints = 0;
        liveLayers.forEach(l => {
          livePoints += l.points?.length || 0;
          if (l.subpaths) {
            l.subpaths.forEach((sp: any) => livePoints += sp.length);
          }
        });

        if (latestRev) {
          const snap = await ScientificSnapshotService.loadSnapshot(latestRev.snapshotId);
          if (snap) {
            const sameLayerCount = snap.layerCount === liveLayers.length;
            const samePointsCount = snap.pointsCount === livePoints;
            const sameHash = snap.hash === liveHash;

            if (sameLayerCount && samePointsCount && sameHash) {
              setLatestSnapshot(snap);
              setLatestRevision(latestRev);
              // Already synchronized, execute autopsy if not already set or different
              if (lastProcessedRevId.current !== latestRev.id) {
                const result = await executeAutopsyHelper(latestRev.id, snap);
                setAutopsyResult(result);
              }
            } else {
              console.log("Désynchronisation détectée dans initLoadAndSync. Synchronisation automatique...");
              // Out of sync or modified - auto-synchronise immediately for correctness
              const freshSnap = await ScientificSnapshotService.createSnapshot(asset.id, liveLayers, 'AUTOPSY');
              const freshRev = await ScientificSnapshotService.createRevision(asset.id, freshSnap, 'Draft');
              setLatestSnapshot(freshSnap);
              setLatestRevision(freshRev);
              const result = await executeAutopsyHelper(freshRev.id, freshSnap);
              setAutopsyResult(result);
            }
          } else {
            // Create snapshot
            const freshSnap = await ScientificSnapshotService.createSnapshot(asset.id, liveLayers, 'AUTOPSY');
            const freshRev = await ScientificSnapshotService.createRevision(asset.id, freshSnap, 'Draft');
            setLatestSnapshot(freshSnap);
            setLatestRevision(freshRev);
            const result = await executeAutopsyHelper(freshRev.id, freshSnap);
            setAutopsyResult(result);
          }
        } else {
          // First time loading - auto-synchronize
          const freshSnap = await ScientificSnapshotService.createSnapshot(asset.id, liveLayers, 'AUTOPSY');
          const freshRev = await ScientificSnapshotService.createRevision(asset.id, freshSnap, 'Draft');
          setLatestSnapshot(freshSnap);
          setLatestRevision(freshRev);
          const result = await executeAutopsyHelper(freshRev.id, freshSnap);
          setAutopsyResult(result);
        }
      } catch (err) {
        console.error("Auto load and sync failed:", err);
      }
    };
    initLoadAndSync();
  }, [asset?.id, liveHash, liveLayers]);

  // Point 10: Render and Autopsy Result State Logger
  useEffect(() => {
    console.log("React Render");
    console.log("  autopsyResult reçu:", autopsyResult !== null);
    if (autopsyResult) {
      console.log("  Audit:", autopsyResult.audit);
      const observations = autopsyResult.steps.flatMap(s => s.drift.details);
      console.log("  Observations:", observations);
      console.log("  Steps:", autopsyResult.steps.map(s => s.step));
    }
  }, [autopsyResult]);

  // Load audit history on mount
  useEffect(() => {
    db.geometry_audits.reverse().toArray().then(audits => {
      setSavedAudits(audits);
    }).catch(e => {
      console.warn("Could not load Dexie audits:", e);
    });
  }, []);

  useEffect(() => {
    if (latestSnapshot) {
      setLineageData({
        studio: {
          layersCount: liveLayers.length,
          pointsCount: livePointsCount,
          hash: liveHash,
        },
        viewer: {
          layersCount: latestSnapshot.layerCount,
          pointsCount: latestSnapshot.pointsCount,
          hash: latestSnapshot.hash,
        }
      });
    }
  }, [latestSnapshot, liveLayers, livePointsCount, liveHash]);

  // Handle audit loading from Dexie
  const handleLoadAudit = async (auditId: string) => {
    try {
      setSelectedAuditId(auditId);
      const audit = await db.geometry_audits.get(auditId);
      if (!audit) return;

      // Fetch related snapshots and metrics
      const snapshots = await db.geometry_snapshots.where('auditId').equals(auditId).toArray();
      const metricsList = await db.geometry_metrics.where('auditId').equals(auditId).toArray();
      const driftList = await db.geometry_drift.where('auditId').equals(auditId).toArray();

      // Reconstruct steps mapping
      const stepsMapped = snapshots.map(snap => {
        const metrics = metricsList.find(m => m.step === snap.step) as GeometryMetrics;
        const drift = driftList.find(d => d.step === snap.step) as GeometryDrift;
        return {
          step: snap.step,
          title: snap.title,
          svg: snap.svg,
          layers: snap.layers,
          metrics,
          drift
        };
      }).sort((a, b) => a.step.localeCompare(b.step));

      setAutopsyResult({
        audit,
        steps: stepsMapped
      });
    } catch (e) {
      console.warn("Could not load from Dexie:", e);
    }
  };

  // Get current and previous steps for comparing
  const currentStepData = autopsyResult?.steps[activeStepIndex];
  const previousStepData = activeStepIndex > 0 ? autopsyResult?.steps[activeStepIndex - 1] : autopsyResult?.steps[0];

  // Auto zoom/centering bounds helper
  const getAutoCenteringViewBox = () => {
    if (!currentStepData || !zoomMode) return "-250 -250 500 500";
    const box = currentStepData.metrics.boundingBox;
    // Add pad margin
    const margin = 20;
    const x = box.x - margin;
    const y = box.y - margin;
    const w = box.width + margin * 2;
    const h = box.height + margin * 2;
    return `${x} ${y} ${w} ${h}`;
  };

  if (!isValidAsset) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen p-6 rounded-3xl border border-slate-800/60 shadow-2xl flex flex-col items-center justify-center text-center gap-6">
        <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
        <div>
          <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2">
            Data Mismatch
          </h2>
          <p className="text-slate-400 font-mono text-sm max-w-lg">
            Le laboratoire n'a pas reçu de géométrie valide (ScientificTextileAsset).<br/><br/>
            L'analyse est interrompue. Pour préserver l'intégrité des résultats scientifiques, le système refuse de générer des données par défaut.
          </p>
        </div>
      </div>
    );
  }

  // Point 11: Render-time component console logger
  const uiObservations = autopsyResult ? autopsyResult.steps.flatMap(s => s.drift.details).length : 0;
  const uiAudit = autopsyResult ? (autopsyResult.audit.hasErrors ? "DÉRIVE" : "OK") : "null";
  const uiSteps = autopsyResult ? autopsyResult.steps.map(s => s.step) : [];
  console.log("UI RENDER VALUES:");
  console.log("  Observations:", uiObservations);
  console.log("  Audit:", uiAudit);
  console.log("  Steps:", uiSteps);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-6 rounded-3xl border border-slate-800/60 shadow-2xl flex flex-col gap-6 text-left">
      
      {/* Forensic Debug UI Metrics */}
      <div id="forensic-ui-debug" className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono flex flex-wrap gap-x-6 gap-y-2 text-slate-400 items-center">
        <span className="text-red-400 font-bold tracking-wider">FORENSIC MONITOR (UI):</span>
        <span>Observations: <strong className="text-slate-200">{uiObservations}</strong></span>
        <span>Audit: <strong className={autopsyResult ? "text-emerald-400" : "text-amber-500"}>{uiAudit}</strong></span>
        <span>Steps: <strong className="text-slate-200">{uiSteps.length}</strong></span>
      </div>
      
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl animate-pulse">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 to-amber-300 bg-clip-text text-transparent uppercase">
                ATCP Geometry Autopsy (Diagnostic Profond)
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Laboratoire de métrologie et d'analyse différentielle des déformations géométriques CAO/CAM
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-300">AUTOPSY ENGINE V1.2</span>
          </div>

          <button
            onClick={handleRunAutopsy}
            disabled={isRunning}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/10 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>LANCER L'ANALYSE</span>
          </button>
        </div>
      </div>

      {lineageError && (
        <div className="mb-6 p-6 bg-red-950/45 border-2 border-red-500/80 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-red-500/15 rounded-2xl border border-red-500/30 shrink-0 text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <h3 className="text-base font-black text-red-200 uppercase tracking-wider font-mono">DATA LINEAGE ERROR</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-mono">
                La géométrie du Canvas de travail (React) s'est désynchronisée du Snapshot enregistré en base de données local (Dexie).
                Pour garantir l'intégrité de la recherche, l'analyse différentielle a été interrompue.
              </p>
              <div className="flex gap-4 mt-2 text-[10px] font-mono text-slate-400">
                <div>Canvas Points : <span className="text-red-400 font-bold">{livePointsCount}</span> vs Snapshot : <span className="text-slate-300">{latestSnapshot?.pointsCount || 0}</span></div>
                <div>Canvas Couches : <span className="text-red-400 font-bold">{liveLayers.length}</span> vs Snapshot : <span className="text-slate-300">{latestSnapshot?.layerCount || 0}</span></div>
              </div>
            </div>
          </div>
          <button
            onClick={handleSynchronizePipeline}
            disabled={isSyncing}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>SYNCHRONISER ET DÉVERROUILLER</span>
          </button>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Diagnostics Controls & Presets (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Source Scientifique & Data Lineage Controls */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Source Scientifique
              </h2>
              {isSynchronized ? (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Check className="w-3 h-3" /> Synced
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> Out of Sync
                </span>
              )}
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800/50 rounded-xl flex flex-col gap-3 font-mono text-xs text-slate-300">
              <div className="flex flex-col gap-0.5 pb-2 border-b border-slate-800/60">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Nom du Projet</span>
                <span className="text-sm font-bold text-slate-200 truncate">{projectName}</span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10.5px]">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Canvas ID</span>
                  <span className="text-slate-200 truncate block">{asset?.id || 'Inconnu'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Snapshot ID</span>
                  <span className="text-slate-200 truncate block">{latestSnapshot?.id.substring(0, 12) || 'Aucun'}...</span>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-800/40">
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Empreinte SHA-256</span>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center bg-slate-900/50 p-1 px-1.5 rounded border border-slate-800/40">
                      <span className="text-[8px] text-slate-400">LIVE :</span>
                      <span className="text-emerald-400 font-bold">{liveHash.substring(0, 12) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/50 p-1 px-1.5 rounded border border-slate-800/40">
                      <span className="text-[8px] text-slate-400">SNAP :</span>
                      <span className={isSynchronized ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {latestSnapshot?.hash.substring(0, 12) || 'Aucun'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-800/40 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Couches (Live vs Snap)</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      {liveLayers.length} <span className="text-slate-600">/</span> {latestSnapshot?.layerCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Points (Live vs Snap)</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      {livePointsCount} <span className="text-slate-600">/</span> {latestSnapshot?.pointsCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!isSynchronized && (
              <button
                onClick={handleSynchronizePipeline}
                disabled={isSyncing}
                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-[11px] font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>SYNCHRONISER LE PIPELINE</span>
              </button>
            )}
          </div>

          {/* Simulation Stress Controllers */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
            <h2 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              Générateurs de Déviation
            </h2>

            {/* RDP Epsilon */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Simplification RDP (Epsilon)</span>
                <span className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${rdpEpsilon > 2.5 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                  {rdpEpsilon.toFixed(1)} px
                </span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="8.0" 
                step="0.1"
                value={rdpEpsilon} 
                onChange={(e) => setRdpEpsilon(parseFloat(e.target.value))}
                className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[9px] text-slate-500">
                Seuil de réduction des points de Douglas-Peucker. Élevé = Géométrie détruite !
              </span>
            </div>

            {/* Pull Compensation/Offset */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Offset de Compensation</span>
                <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                  {offsetFactor > 0 ? `+${offsetFactor.toFixed(1)}` : offsetFactor.toFixed(1)} px
                </span>
              </div>
              <input 
                type="range" 
                min="-15.0" 
                max="15.0" 
                step="0.5"
                value={offsetFactor} 
                onChange={(e) => setOffsetFactor(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[9px] text-slate-500">
                Simule les variations de tirage matière. Entraîne des distorsions d'aire.
              </span>
            </div>

            {/* Noise Strength */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Bruit de Discrétisation</span>
                <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                  {noiseStrength.toFixed(1)}x
                </span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="5.0" 
                step="0.2"
                value={noiseStrength} 
                onChange={(e) => setNoiseStrength(parseFloat(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[9px] text-slate-500">
                Simule les erreurs d'approximation lors de la numérisation initiale.
              </span>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-900/40 border border-slate-800/50 p-4 rounded-xl text-[10px] text-slate-400 flex gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <p>
              Pour observer une dérive critique, augmentez la valeur de <b>Douglas-Peucker (Epsilon)</b> au-delà de 3.0. Le diagnostic s'arrêtera automatiquement sur la première étape fautive.
            </p>
          </div>

        </div>

        {/* Middle Column: Pipeline Steps & Live Diagnosis (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-red-400" />
            Pipeline d'Observation
          </h2>

          {/* Error Banner */}
          {autopsyResult?.audit.firstFaultyStep ? (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase">
                <ShieldAlert className="w-4.5 h-4.5 text-red-500 animate-bounce" />
                <span>Première Étape Fautive Décelée</span>
              </div>
              <div className="text-base font-black text-white bg-red-950/60 p-2 rounded-lg border border-red-500/30 text-center">
                {autopsyResult.audit.firstFaultyStep}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Le pipeline d'analyse a bloqué l'algorithme suivant en raison d'un écart Hausdorff ou d'aire dépassant les seuils physiques tolérés.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase">Intégrité Parfaite</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Aucune dérive détectée sur l'ensemble du calcul.</div>
              </div>
            </div>
          )}

          {/* Pipeline Timeline list */}
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {autopsyResult?.steps.map((s, idx) => {
              const isActive = idx === activeStepIndex;
              const status = s.drift.status;
              
              let statusBadge = (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                  OK
                </span>
              );
              if (status === 'WARNING') {
                statusBadge = (
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                    WARN
                  </span>
                );
              } else if (status === 'CRITICAL') {
                statusBadge = (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                    CRIT
                  </span>
                );
              }

              return (
                <div 
                  key={s.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-slate-800/80 border-slate-700 shadow-md' 
                      : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-slate-200 font-bold truncate">
                      {s.title.replace(/^\d+\s*-\s*/, '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Interactive Comparator View (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
            <h2 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              Comparateur Différentiel Visuel
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomMode(!zoomMode)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${zoomMode ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                title="Zoom automatique sur zone dérivée"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Dual Frame Canvas */}
          <div className="flex flex-col gap-3">
            
            {/* Legend mapping colors */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Inchangé</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Supprimé</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Ajouté</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Déplacé</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Fusionné</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span>Trou Disparu</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Nouveau Trou</span>
            </div>

            <div className="relative aspect-square w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
              
              {/* Overlay renderer showing precise colors */}
              <svg 
                viewBox={getAutoCenteringViewBox()} 
                className="w-full h-full transition-all duration-500 ease-out"
              >
                {/* Draw previous/reference step as dashed trace if not same */}
                {previousStepData && previousStepData.step !== currentStepData?.step && (
                  <g opacity="0.25" dangerouslySetInnerHTML={{ 
                    __html: previousStepData.svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<rect[^>]*>/, '').replace(/fill="[^"]+"/g, 'fill="none"').replace(/stroke="[^"]+"/g, 'stroke="#ef4444"')
                  }}>
                  </g>
                )}

                {/* Draw current step elements */}
                {currentStepData && (
                  <g dangerouslySetInnerHTML={{ 
                    __html: currentStepData.svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<rect[^>]*>/, '') 
                  }}>
                  </g>
                )}

                {/* Visual diff highlight markers overlay */}
                {currentStepData && previousStepData && (
                  <g>
                    {/* Hole alert if hole count changed */}
                    {Math.abs(currentStepData.metrics.holesChange) > 0 && (
                      <g>
                        <circle cx={currentStepData.metrics.boundingBox.x + currentStepData.metrics.boundingBox.width / 2} cy={currentStepData.metrics.boundingBox.y + currentStepData.metrics.boundingBox.height / 2} r="18" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="2,2" />
                        <text x={currentStepData.metrics.boundingBox.x + currentStepData.metrics.boundingBox.width / 2} y={currentStepData.metrics.boundingBox.y + currentStepData.metrics.boundingBox.height / 2 + 3} textAnchor="middle" fill="#ec4899" fontSize="7" fontWeight="bold">TROU MODIFIÉ</text>
                      </g>
                    )}
                  </g>
                )}
              </svg>

              <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 backdrop-blur-sm">
                Comparaison : {previousStepData?.title.replace(/^\d+\s*-\s*/, '')} ➔ {currentStepData?.title.replace(/^\d+\s*-\s*/, '')}
              </div>

              {currentStepData?.drift.status === 'CRITICAL' && (
                <div className="absolute inset-0 border-2 border-red-500 rounded-2xl pointer-events-none animate-pulse"></div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-400">Hausdorff Diff :</span>
              <span className={`font-mono font-bold ${currentStepData && currentStepData.drift.status === 'CRITICAL' ? 'text-red-400' : 'text-emerald-400'}`}>
                {currentStepData?.metrics.hausdorffDistance.toFixed(2)} px
              </span>
            </div>

            {onApplyLayers && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => {
                    console.group('=== ACTION DIAGNOSTIC: Restaurer le Canvas ===');
                    console.log('%c[AVANT onRestoreCanvas]', 'color: #93c5fd; font-weight: bold;');
                    console.groupEnd();
                    if (onRestoreCanvas) {
                      onRestoreCanvas();
                    } else {
                      onApplyLayers(JSON.parse(JSON.stringify(liveLayers || [])), 'Canvas Original');
                    }
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
                >
                  Restaurer le Canvas
                </button>
                <button
                  onClick={() => {
                     if (currentStepData && currentStepData.layers) {
                        const layersCopy = JSON.parse(JSON.stringify(currentStepData.layers));
                        if (currentStepData.step === '10-fill' || currentStepData.step === '11-dst') {
                            layersCopy.forEach((l: any) => {
                               l.stitchType = 'manual';
                            });
                        }
                        const proof = getLayersExecutionProof(layersCopy);
                        console.group(`=== ACTION DIAGNOSTIC: Appliquer l'étape [${currentStepData.title}] ===`);
                        console.log('%c[AVANT onApplyLayers]', 'color: #34d399; font-weight: bold;');
                        console.log(`- Nombre de couches: ${proof.count}`);
                        console.log(`- Nombre total de points: ${proof.totalPoints}`);
                        console.log(`- Hash (SHA256-like): ${proof.hash}`);
                        console.log('- Détails des couches (Centroids, Bounding Boxes) :', JSON.parse(proof.details));
                        logLayerGeometry('POINT A: currentStepData.layers', currentStepData.layers);
                        console.groupEnd();
                        onApplyLayers(layersCopy, currentStepData.title);
                     }
                  }}
                  disabled={!currentStepData?.layers}
                  className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 py-2 rounded-lg text-xs font-semibold cursor-pointer border border-emerald-500/30 transition-colors"
                >
                  Appliquer uniquement cette étape
                </button>
                <button
                  onClick={() => {
                     if (autopsyResult && autopsyResult.steps.length > 0) {
                        const step = autopsyResult.steps[autopsyResult.steps.length - 1];
                        if (step.layers) {
                           const layersCopy = JSON.parse(JSON.stringify(step.layers));
                           layersCopy.forEach((l: any) => {
                              l.stitchType = 'manual';
                           });
                           const proof = getLayersExecutionProof(layersCopy);
                           console.group('=== ACTION DIAGNOSTIC: Appliquer toute la reconstruction ===');
                           console.log('%c[AVANT onApplyLayers]', 'color: #a78bfa; font-weight: bold;');
                           console.log(`- Nombre de couches: ${proof.count}`);
                           console.log(`- Nombre total de points: ${proof.totalPoints}`);
                           console.log(`- Hash (SHA256-like): ${proof.hash}`);
                           console.log('- Détails des couches (Centroids, Bounding Boxes) :', JSON.parse(proof.details));
                           logLayerGeometry('POINT A: currentStepData.layers (Toute la reconstruction)', step.layers);
                           console.groupEnd();
                           onApplyLayers(layersCopy, 'Reconstruction Finale');
                        }
                     }
                  }}
                  disabled={!autopsyResult || autopsyResult.steps.length === 0}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Appliquer toute la reconstruction
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Tabs navigation for metrics spreadsheets & journals */}
      <div className="mt-4">
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('lineage')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'lineage' ? 'border-emerald-500 text-emerald-400 bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Activity className="w-3.5 h-3.5 inline mr-1.5" />
            Data Lineage
          </button>
          <button 
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'visual' ? 'border-red-500 text-red-400 bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Maximize2 className="w-3.5 h-3.5 inline mr-1.5" />
            Métrologie Scientifique (29 Mesures)
          </button>
          <button 
            onClick={() => setActiveTab('spreadsheet')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'spreadsheet' ? 'border-amber-500 text-amber-400 bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
            Détecteur de Dérive (Geometry Drift)
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'journal' ? 'border-violet-500 text-violet-400 bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Journal d'Exécution
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'history' ? 'border-indigo-500 text-indigo-400 bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Database className="w-3.5 h-3.5 inline mr-1.5" />
            Historique Dexie ({savedAudits.length})
          </button>
        </div>

        <div className="p-4 bg-slate-900/20 border border-slate-800/60 rounded-b-2xl border-t-0">
          
          {/* Scientific metrics tab */}
          {activeTab === 'visual' && currentStepData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box A: Topologie */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Topologie & Contours
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Contours :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.contoursCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Trous :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.holesCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Composantes :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.componentsCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Total Sommets :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.verticesCount}</span>
                  </div>
                </div>
              </div>

              {/* Box B: Physical Dimensions */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  Dimensions Physiques
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Surface Totale :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.area.toFixed(1)} mm²</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Périmètre :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.perimeter.toFixed(1)} mm</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Épaisseur Moyenne :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.localThickness.toFixed(1)} mm</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Rayon Moyen :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.avgRadius.toFixed(1)} px</span>
                  </div>
                </div>
              </div>

              {/* Box C: Deviations and Distances */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Écarts Différentiels
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Hausdorff :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.hausdorffDistance.toFixed(2)} px</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Fréchet :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.frechetDistance.toFixed(2)} px</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Δ Aire relative :</span>
                    <span className={`font-bold font-mono ${currentStepData.metrics.areaPercentageChange > 5 ? 'text-red-400' : 'text-slate-200'}`}>
                      {currentStepData.metrics.areaPercentageChange.toFixed(1)} %
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg">
                    <span className="text-slate-500 block text-[9px]">Glissement Gravité :</span>
                    <span className="font-bold font-mono text-slate-200">{currentStepData.metrics.centroidShift.toFixed(2)} px</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Spreadsheet tabular list */}
          {activeTab === 'spreadsheet' && autopsyResult && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                    <th className="py-2.5 px-3">Étape</th>
                    <th className="py-2.5 px-3">Δ Surface</th>
                    <th className="py-2.5 px-3">Δ Périmètre</th>
                    <th className="py-2.5 px-3">Δ Sommets</th>
                    <th className="py-2.5 px-3">Hausdorff</th>
                    <th className="py-2.5 px-3">Épaisseur</th>
                    <th className="py-2.5 px-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {autopsyResult.steps.map(s => {
                    const status = s.drift.status;
                    return (
                      <tr key={s.step} className="hover:bg-slate-900/30 font-mono">
                        <td className="py-2.5 px-3 text-slate-200 font-sans font-bold">{s.title.replace(/^\d+\s*-\s*/, '')}</td>
                        <td className="py-2.5 px-3 text-slate-300">{(s.drift.areaDrift * 100).toFixed(1)} %</td>
                        <td className="py-2.5 px-3 text-slate-300">{(s.drift.perimeterDrift * 100).toFixed(1)} %</td>
                        <td className="py-2.5 px-3 text-slate-300">{(s.drift.verticesDrift * 100).toFixed(1)} %</td>
                        <td className="py-2.5 px-3 text-slate-300">{s.drift.hausdorffDrift.toFixed(2)} px</td>
                        <td className="py-2.5 px-3 text-slate-300">{(s.metrics.localThickness).toFixed(1)} mm</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            status === 'OK' ? 'bg-emerald-500/10 text-emerald-400' :
                            status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Execution Journal list */}
          {activeTab === 'journal' && autopsyResult && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed max-h-[250px] overflow-y-auto text-slate-300 flex flex-col gap-1.5">
              {autopsyResult.audit.journal.map((logLine, lIdx) => (
                <div key={lIdx} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">➔</span>
                  <span>{logLine}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Généré par : {autopsyResult.audit.algorithm}</span>
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                  SHA-256 : <span className="font-mono text-slate-300">{autopsyResult.audit.signature.substring(0, 32)}...</span>
                </span>
              </div>
            </div>
          )}

          {/* Mode Debug & Data Flow Diagram */}
          {activeTab === 'lineage' && (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full p-4 font-mono">
              <div className="text-center flex flex-col gap-1.5 pb-4 border-b border-slate-800">
                <div className="text-emerald-500 font-bold tracking-widest text-sm uppercase">
                  ══════════════════════════════════════════════════════
                </div>
                <div className="text-slate-200 font-black tracking-widest text-sm uppercase flex items-center justify-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span>MODE DEBUG : PIPELINE GEOMETRIQUE ET SÉMANTIQUE</span>
                </div>
                <div className="text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Tracé complet du flux de données en temps réel depuis le Canvas React (Working State) jusqu'au registre de connaissances EKLE/Verseau.
                </div>
              </div>

              {/* Data Flow Diagram Timeline */}
              <div className="flex flex-col gap-0 text-slate-300 relative mt-6">
                
                {/* 1. Canvas React State */}
                <div className="relative z-10 flex gap-6 items-start group mb-8">
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-800 z-0 h-10"></div>
                  <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-emerald-500/80 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-1">
                    <span className="text-[10px] font-black text-emerald-400">01</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex-1 hover:bg-slate-900/80 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Canvas React State</h4>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Mémoire vive d'édition directe. Contient l'état géométrique de travail.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-950 pt-2 text-slate-400">
                      <div>Projet : <span className="text-slate-200">{projectName}</span></div>
                      <div>Points : <span className="text-slate-200">{livePointsCount}</span></div>
                    </div>
                  </div>
                </div>

                {/* 2. Extracted Vector Layers */}
                <div className="relative z-10 flex gap-6 items-start group mb-8">
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-800 z-0 h-10"></div>
                  <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-emerald-500/80 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-1">
                    <span className="text-[10px] font-black text-emerald-400">02</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex-1 hover:bg-slate-900/80 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Extracted Vector Layers</h4>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-wider">Extracted</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Extraction mathématique des coordonnées géométriques et des chemins de broderie.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-950 pt-2 text-slate-400">
                      <div>Format : <span className="text-slate-200 font-bold">ATIR/Vector</span></div>
                      <div>Couches de calcul : <span className="text-slate-200">{liveLayers.length}</span></div>
                    </div>
                  </div>
                </div>

                {/* 3. Dexie Scientific Asset */}
                <div className="relative z-10 flex gap-6 items-start group mb-8">
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-800 z-0 h-10"></div>
                  <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-emerald-500/80 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-1">
                    <span className="text-[10px] font-black text-emerald-400">03</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex-1 hover:bg-slate-900/80 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Dexie Scientific Asset</h4>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-wider">Registered</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Identification de l'asset au sein de l'écosystème technique persistant d'Acom.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-950 pt-2 text-slate-400">
                      <div>Asset ID : <span className="text-slate-200">{asset?.id}</span></div>
                      <div>Type de Persistance : <span className="text-slate-200">Dexie SaaS IDB</span></div>
                    </div>
                  </div>
                </div>

                {/* 4. Local Database Snapshot */}
                <div className="relative z-10 flex gap-6 items-start group mb-8">
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-800 z-0 h-10"></div>
                  <div className={`w-12 h-12 rounded-full bg-slate-950 border-2 flex items-center justify-center shrink-0 mt-1 ${isSynchronized ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse'}`}>
                    <span className={`text-[10px] font-black ${isSynchronized ? 'text-emerald-400' : 'text-amber-400'}`}>04</span>
                  </div>
                  <div className={`border rounded-xl p-4 flex-1 transition-colors ${isSynchronized ? 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/80' : 'bg-amber-950/10 border-amber-500/30'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-bold text-xs uppercase tracking-wider ${isSynchronized ? 'text-emerald-400' : 'text-amber-400'}`}>Local Database Snapshot</h4>
                      {isSynchronized ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-wider">Synchronisé</span>
                      ) : (
                        <button 
                          onClick={handleSynchronizePipeline} 
                          className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px] font-bold uppercase tracking-wider cursor-pointer border border-amber-500/20 hover:bg-amber-500/20"
                        >
                          Désynchronisé - Synchroniser ➔
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Empreinte cryptographique immuable stockée pour garantir le lignage sémantique.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-950 pt-2 text-slate-400">
                      <div className="truncate">Snapshot ID : <span className="text-slate-200">{latestSnapshot?.id || "Aucun"}</span></div>
                      <div className="truncate">SHA-256 : <span className="text-slate-200">{latestSnapshot?.hash.substring(0, 16) || "N/A"}...</span></div>
                    </div>
                  </div>
                </div>

                {/* 5. Autopsy Engine Processing */}
                <div className="relative z-10 flex gap-6 items-start group mb-8">
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-800 z-0 h-10"></div>
                  <div className={`w-12 h-12 rounded-full bg-slate-950 border-2 flex items-center justify-center shrink-0 mt-1 ${autopsyResult ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-slate-800'}`}>
                    <span className={`text-[10px] font-black ${autopsyResult ? 'text-emerald-400' : 'text-slate-500'}`}>05</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex-1 hover:bg-slate-900/80 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-bold text-xs uppercase tracking-wider ${autopsyResult ? 'text-emerald-400' : 'text-slate-400'}`}>Autopsy Engine Processing</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${autopsyResult ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {autopsyResult ? 'Calculé' : 'En Attente'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Analyse des transformations géométriques à l'aide de mesures Hausdorff et de distance Fréchet.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-950 pt-2 text-slate-400">
                      <div>Algorithmes : <span className="text-slate-200">Moore-Neighbor / RDP</span></div>
                      <div>Durée d'exécution : <span className="text-slate-200">{autopsyResult ? `${autopsyResult.audit.temps} ms` : 'N/A'}</span></div>
                    </div>
                  </div>
                </div>

                {/* 6. SKE/SDE Observations */}
                <div className="relative z-10 flex gap-6 items-start group mb-8">
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-800 z-0 h-10"></div>
                  <div className={`w-12 h-12 rounded-full bg-slate-950 border-2 flex items-center justify-center shrink-0 mt-1 ${autopsyResult ? (autopsyResult.audit.hasErrors ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse' : 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]') : 'border-slate-800'}`}>
                    <span className={`text-[10px] font-black ${autopsyResult ? (autopsyResult.audit.hasErrors ? 'text-red-400' : 'text-emerald-400') : 'text-slate-500'}`}>06</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex-1 hover:bg-slate-900/80 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-bold text-xs uppercase tracking-wider ${autopsyResult ? (autopsyResult.audit.hasErrors ? 'text-red-400' : 'text-emerald-400') : 'text-slate-400'}`}>SKE/SDE Observations</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${autopsyResult ? (autopsyResult.audit.hasErrors ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400') : 'bg-slate-800 text-slate-500'}`}>
                        {autopsyResult ? (autopsyResult.audit.hasErrors ? 'Drift Alert' : 'Aucun Écart') : 'En Attente'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Évaluation continue par rapport aux règles de tolérance physiques des matières textiles.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-950 pt-2 text-slate-400">
                      <div>Règles vérifiées : <span className="text-slate-200">29 lois physiques</span></div>
                      <div>Anomalies : <span className={autopsyResult?.audit.hasErrors ? 'text-red-400 font-bold' : 'text-slate-200'}>
                        {autopsyResult ? (autopsyResult.audit.hasErrors ? 'Anomalies détectées' : '0 Écarts critiques') : 'N/A'}
                      </span></div>
                    </div>
                  </div>
                </div>

                {/* 7. Diagnostic Passport */}
                <div className="relative z-10 flex gap-6 items-start group">
                  <div className={`w-12 h-12 rounded-full bg-slate-950 border-2 flex items-center justify-center shrink-0 mt-1 ${autopsyResult ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-slate-800'}`}>
                    <span className={`text-[10px] font-black ${autopsyResult ? 'text-emerald-400' : 'text-slate-500'}`}>07</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex-1 hover:bg-slate-900/80 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-bold text-xs uppercase tracking-wider ${autopsyResult ? 'text-emerald-400' : 'text-slate-400'}`}>Diagnostic Passport</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${autopsyResult ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {autopsyResult ? 'Généré & Archivé' : 'En Attente'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Enregistrement et signature cryptographique de l'audit technique dans l'historique permanent.</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] border-t border-slate-950 pt-2 text-slate-400">
                      <div>Registre : <span className="text-slate-200">Dexie IndexedDB</span></div>
                      <div className="truncate">Audit ID : <span className="text-slate-200">{autopsyResult?.audit.id.substring(0, 8) || "N/A"}</span></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Historical records from Dexie */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
                Archives d'audits sauvegardées localement dans Dexie (IndexedDB) :
              </div>
              
              {savedAudits.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Aucun diagnostic sauvegardé. Lancez l'analyse pour persister les résultats.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                  {savedAudits.map(aud => (
                    <div 
                      key={aud.id}
                      onClick={() => handleLoadAudit(aud.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-2 ${
                        selectedAuditId === aud.id 
                          ? 'bg-slate-800/80 border-slate-700 shadow' 
                          : 'bg-slate-900/30 border-slate-800/60 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200">Audit du {new Date(aud.date).toLocaleString()}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          aud.hasErrors ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {aud.hasErrors ? 'DÉRIVE' : 'CONFORME'}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 italic">
                        {aud.diagnostic}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/50 text-[9px] font-mono text-slate-500">
                        <span>Calcul en {aud.temps} ms</span>
                        <span>SHA: {aud.signature.substring(0, 8)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
