import { EmbroideryLayer } from './embroideryServices';
import { LogoDiagnosticReport, LogoObjectAnalysis } from './LogoAnalyzerKernel';
import { GeometricReconstructionReport, ObjectReconstructionResult } from './GeometricReconstructionEngine';

export interface BridgeStatistics {
  totalLayers: number;
  totalReconstructionCandidates: number;
  confirmedCandidates: number;      // Confirmed Candidates (Section 9)
  mappedConfirmed: number;         // Mapped Confirmed (Section 9)
  appliedReconstructions: number;  // Applied Reconstructions (Section 9)
  unmappedConfirmed: number;       // Unmapped Confirmed (Section 9)
  uncertainPreserved: number;      // Uncertain Preserved (Section 9)
  originalPreserved: number;       // Original Preserved (Section 9)
  
  // Backward compatibility aliases
  confirmedReconstructions: number;
  actuallyAppliedToLayers: number;
  skippedUncertain: number;
  skippedMappingAmbiguous: number;
  skippedComposite: number;
  activeMode: 'RECONSTRUCTED' | 'ORIGINAL';
}

export interface BridgeMapping {
  objectId: string;
  layerId: string;
  sourceObjectId: string;
  decision: 'RECONSTRUCT_CONFIRMED' | 'RECONSTRUCT_UNCERTAIN' | 'KEEP_ORIGINAL' | string;
  proposedPrimitive?: string;
  originalGeometryAvailable: boolean;
  reconstructedGeometryAvailable: boolean;
  originalPointsCount: number;
  reconstructedPointsCount?: number;
  geometryApplied: 'RECONSTRUCTED' | 'ORIGINAL';
  renderGeometrySource: 'RECONSTRUCTED' | 'ORIGINAL';
  mappingStatus: 'MATCHED' | 'NOT_FOUND' | 'AMBIGUOUS';
  applied: boolean;
  reason: string;
}

export interface ReconstructionApplicationResult {
  layers: EmbroideryLayer[];
  mappings: BridgeMapping[];
  statistics: BridgeStatistics;
}

export class ReconstructionApplicationBridge {
  public static applyReconstructions(
    originalLayers: EmbroideryLayer[],
    diagnosticReport: LogoDiagnosticReport,
    reconstructionReport: GeometricReconstructionReport,
    mode: 'RECONSTRUCTED' | 'ORIGINAL' = 'RECONSTRUCTED'
  ): ReconstructionApplicationResult {
    const mappings: BridgeMapping[] = [];

    // Clone layers to avoid mutating originals and ensure originalPoints are captured
    const newLayers: EmbroideryLayer[] = originalLayers.map(layer => {
      const origPts = layer.originalPoints || [...layer.points];
      const origSubs = layer.originalSubpaths || (layer.subpaths ? layer.subpaths.map(sp => [...sp]) : undefined);
      return {
        ...layer,
        originalPoints: origPts,
        originalSubpaths: origSubs,
        points: mode === 'ORIGINAL' ? [...origPts] : [...layer.points]
      };
    });

    // Create a map from layerId to EmbroideryLayer for explicit mapping
    const layerMap = new Map<string, EmbroideryLayer>();
    newLayers.forEach(l => {
      layerMap.set(l.id, l);
    });

    let confirmedCandidates = 0;
    let mappedConfirmed = 0;
    let appliedReconstructions = 0;
    let unmappedConfirmed = 0;
    let uncertainPreserved = 0;
    let originalPreserved = 0;

    // Process each reconstruction result from Phase 1.3
    for (const result of reconstructionReport.results) {
      const targetLayer = layerMap.get(result.layerId);
      const isMapped = !!targetLayer;
      const mappingStatus: 'MATCHED' | 'NOT_FOUND' | 'AMBIGUOUS' = isMapped ? 'MATCHED' : 'NOT_FOUND';
      const origPtsAvailable = !!(targetLayer?.originalPoints || result.originalPoints);
      const reconPtsAvailable = !!(result.reconstructedGeometry && result.reconstructedGeometry.sampledPoints?.length > 0);
      const origPtsCount = targetLayer?.originalPoints?.length || result.originalPoints?.length || 0;
      const reconPtsCount = result.reconstructedGeometry?.sampledPoints?.length || 0;

      if (result.decision3Level === 'RECONSTRUCT_CONFIRMED') {
        confirmedCandidates++;
        if (isMapped) {
          mappedConfirmed++;
        } else {
          unmappedConfirmed++;
        }

        if (mode === 'RECONSTRUCTED' && isMapped && reconPtsAvailable) {
          // Apply reconstructed geometry to target active layer
          targetLayer.points = [...result.reconstructedGeometry!.sampledPoints];
          targetLayer.subpaths = undefined; // Reset outdated subpaths
          targetLayer.reconstruction = {
            applied: true,
            sourceObjectId: result.objectId,
            primitiveType: result.reconstructedGeometry!.primitiveType,
            precisionScore: result.reconstructedGeometry!.reconstructionPrecisionScore,
            decision: result.decision3Level
          };

          appliedReconstructions++;

          mappings.push({
            objectId: result.objectId,
            layerId: result.layerId,
            sourceObjectId: result.objectId,
            decision: result.decision3Level,
            proposedPrimitive: result.proposedPrimitive,
            originalGeometryAvailable: origPtsAvailable,
            reconstructedGeometryAvailable: reconPtsAvailable,
            originalPointsCount: origPtsCount,
            reconstructedPointsCount: reconPtsCount,
            geometryApplied: 'RECONSTRUCTED',
            renderGeometrySource: 'RECONSTRUCTED',
            mappingStatus,
            applied: true,
            reason: 'APPLIED_SUCCESSFULLY'
          });
        } else {
          // If in ORIGINAL mode or missing mapping / geometry, retain original
          if (targetLayer) {
            targetLayer.points = [...targetLayer.originalPoints!];
          }

          const reasonStr = mode === 'ORIGINAL'
            ? 'ORIGINAL_MODE_ACTIVE'
            : !isMapped
            ? 'MAPPING_NOT_FOUND'
            : 'MISSING_RECONSTRUCTED_GEOMETRY';

          mappings.push({
            objectId: result.objectId,
            layerId: result.layerId,
            sourceObjectId: result.objectId,
            decision: result.decision3Level,
            proposedPrimitive: result.proposedPrimitive,
            originalGeometryAvailable: origPtsAvailable,
            reconstructedGeometryAvailable: reconPtsAvailable,
            originalPointsCount: origPtsCount,
            reconstructedPointsCount: reconPtsCount,
            geometryApplied: 'ORIGINAL',
            renderGeometrySource: 'ORIGINAL',
            mappingStatus,
            applied: false,
            reason: reasonStr
          });
        }
      } else if (result.decision3Level === 'RECONSTRUCT_UNCERTAIN') {
        uncertainPreserved++;
        if (targetLayer) {
          targetLayer.points = [...targetLayer.originalPoints!];
        }

        mappings.push({
          objectId: result.objectId,
          layerId: result.layerId,
          sourceObjectId: result.objectId,
          decision: result.decision3Level,
          proposedPrimitive: result.proposedPrimitive,
          originalGeometryAvailable: origPtsAvailable,
          reconstructedGeometryAvailable: reconPtsAvailable,
          originalPointsCount: origPtsCount,
          reconstructedPointsCount: reconPtsCount,
          geometryApplied: 'ORIGINAL',
          renderGeometrySource: 'ORIGINAL',
          mappingStatus,
          applied: false,
          reason: 'UNCERTAIN_PRESERVED_ORIGINAL'
        });
      } else {
        // KEEP_ORIGINAL
        originalPreserved++;
        if (targetLayer) {
          targetLayer.points = [...targetLayer.originalPoints!];
        }

        mappings.push({
          objectId: result.objectId,
          layerId: result.layerId,
          sourceObjectId: result.objectId,
          decision: result.decision3Level || 'KEEP_ORIGINAL',
          proposedPrimitive: result.proposedPrimitive,
          originalGeometryAvailable: origPtsAvailable,
          reconstructedGeometryAvailable: reconPtsAvailable,
          originalPointsCount: origPtsCount,
          reconstructedPointsCount: reconPtsCount,
          geometryApplied: 'ORIGINAL',
          renderGeometrySource: 'ORIGINAL',
          mappingStatus,
          applied: false,
          reason: result.reason || 'KEEP_ORIGINAL_PRESERVED'
        });
      }
    }

    const statistics: BridgeStatistics = {
      totalLayers: originalLayers.length,
      totalReconstructionCandidates: reconstructionReport.results.length,
      confirmedCandidates,
      mappedConfirmed,
      appliedReconstructions,
      unmappedConfirmed,
      uncertainPreserved,
      originalPreserved,
      confirmedReconstructions: confirmedCandidates,
      actuallyAppliedToLayers: appliedReconstructions,
      skippedUncertain: uncertainPreserved,
      skippedMappingAmbiguous: unmappedConfirmed,
      skippedComposite: 0,
      activeMode: mode
    };

    return {
      layers: newLayers,
      mappings,
      statistics
    };
  }

  /**
   * Switches geometry mode between 'RECONSTRUCTED' and 'ORIGINAL' on the active layers.
   */
  public static switchGeometryMode(
    activeLayers: EmbroideryLayer[],
    reconstructionReport: GeometricReconstructionReport | null,
    mode: 'RECONSTRUCTED' | 'ORIGINAL'
  ): EmbroideryLayer[] {
    if (!reconstructionReport) {
      return activeLayers.map(l => ({
        ...l,
        points: mode === 'ORIGINAL' && l.originalPoints ? [...l.originalPoints] : [...l.points]
      }));
    }

    const reconMap = new Map<string, ObjectReconstructionResult>();
    reconstructionReport.results.forEach(r => reconMap.set(r.layerId, r));

    return activeLayers.map(layer => {
      const origPts = layer.originalPoints || [...layer.points];
      const origSubs = layer.originalSubpaths || (layer.subpaths ? layer.subpaths.map(sp => [...sp]) : undefined);

      if (mode === 'ORIGINAL') {
        return {
          ...layer,
          originalPoints: origPts,
          originalSubpaths: origSubs,
          points: [...origPts],
          subpaths: origSubs ? origSubs.map(sp => [...sp]) : undefined
        };
      }

      // Mode RECONSTRUCTED
      const reconResult = reconMap.get(layer.id);
      if (reconResult && reconResult.decision3Level === 'RECONSTRUCT_CONFIRMED' && reconResult.reconstructedGeometry?.sampledPoints) {
        return {
          ...layer,
          originalPoints: origPts,
          originalSubpaths: origSubs,
          points: [...reconResult.reconstructedGeometry.sampledPoints],
          subpaths: undefined,
          reconstruction: {
            applied: true,
            sourceObjectId: reconResult.objectId,
            primitiveType: reconResult.reconstructedGeometry.primitiveType,
            precisionScore: reconResult.reconstructedGeometry.reconstructionPrecisionScore,
            decision: reconResult.decision3Level
          }
        };
      }

      return {
        ...layer,
        originalPoints: origPts,
        originalSubpaths: origSubs,
        points: [...origPts]
      };
    });
  }
}

export interface ExecutionProofRecord {
  proofRunId: string;
  objectId: string;
  layerId: string;
  decision: string;
  primitive?: string;
  originalPointsCount: number;
  reconstructedPointsCount?: number;
  ORIGINAL_HASH: string;
  RECONSTRUCTED_HASH: string;
  ACTIVE_LAYER_HASH: string;
  STATE_LAYER_HASH: string;
  RENDER_INPUT_HASH: string;
  EMBROIDERY_INPUT_HASH: string;
  status: 'VALIDATED' | 'DIVERGENT' | 'UNCONCLUENT';
  divergencePoint?: string;
}

export const hashGeometry = (pts: { x: number; y: number }[] | undefined | null): string => {
  if (!pts || pts.length === 0) return 'null';
  let hash = 0;
  for (let i = 0; i < pts.length; i++) {
    const xInt = Math.round(pts[i].x * 1000);
    const yInt = Math.round(pts[i].y * 1000);
    hash = Math.imul(31, hash) + xInt | 0;
    hash = Math.imul(31, hash) + yInt | 0;
  }
  return hash.toString(16);
};

