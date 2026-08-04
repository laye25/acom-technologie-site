import { EmbroideryLayer, EmbroideryPoint } from './embroideryServices';

export type LogoObjectType =
  | 'TEXT'
  | 'GEOMETRY'
  | 'SYMBOL'
  | 'ORNAMENT'
  | 'SURFACE'
  | 'NOISE'
  | 'UNKNOWN';

export type LogoSpecificType =
  | 'CIRCLE'
  | 'ELLIPSE'
  | 'RING'
  | 'ARC'
  | 'RECTANGLE'
  | 'POLYGON'
  | 'STAR'
  | 'BORDER_ELEMENT'
  | 'IRREGULAR_GEOMETRY'
  | 'CURVED_TEXT'
  | 'CIRCULAR_TEXT'
  | 'LINEAR_TEXT'
  | 'TEXT_FRAGMENT'
  | 'UNKNOWN_TEXT'
  | 'LEAF'
  | 'LAUREL_LEAF'
  | 'RADIAL_ORNAMENT'
  | 'BOOK'
  | 'FLAME'
  | 'FEATHER'
  | 'ICON'
  | 'UNKNOWN_SYMBOL'
  | 'COMPOSITE_SYMBOL'
  | 'SOLID_SURFACE'
  | 'NOISE_ARTIFACT'
  | 'UNKNOWN';

// Level A: Objective Geometry Type
export type GeometryObjectType =
  | 'CIRCLE'
  | 'ELLIPSE'
  | 'RING'
  | 'POLYGON'
  | 'RADIAL_SHAPE'
  | 'BAND'
  | 'OPEN_LINE'
  | 'CLOSED_SURFACE'
  | 'ELONGATED_SHAPE'
  | 'IRREGULAR_SHAPE';

// Level B: Potential Semantic Meaning
export type SemanticObjectType =
  | 'STAR'
  | 'TEXT_CHARACTER'
  | 'GLYPH_CANDIDATE'
  | 'LEAF'
  | 'FLAME'
  | 'BOOK'
  | 'GLOBE'
  | 'BANNER'
  | 'EMBLEM'
  | 'BORDER_FRAME'
  | 'DECORATION'
  | 'NOISE'
  | 'UNKNOWN';

// Level C: Structural Group / Context
export type GroupContextType =
  | 'CURVED_TEXT_TOP'
  | 'CURVED_TEXT_BOTTOM'
  | 'LINEAR_TEXT'
  | 'CANDIDATE_TEXT_GROUP'
  | 'ORNAMENT_GROUP'
  | 'BORDER_PATTERN'
  | 'LAUREL_LEFT'
  | 'LAUREL_RIGHT'
  | 'CENTRAL_EMBLEM'
  | 'CONCENTRIC_FRAME'
  | 'PERIPHERAL_ORNAMENT'
  | 'NONE';

export interface LogoDiagnosticReasoning {
  criteria: string[];
  counterCriteria: string[];
  conclusion: string;
}

export interface LogoObjectAnalysis {
  id: string; // Stable ID: LOGO_OBJ_001, LOGO_OBJ_002, etc.
  layerId: string; // Original embroidery layer ID
  layerName: string;

  // Legacy Category & Specific Type (for backward compatibility)
  category: LogoObjectType;
  specificType: LogoSpecificType;

  // Level A: Geometry
  geometryType: GeometryObjectType;
  geometryConfidence: number; // 0 to 100

  // Level B: Semantic
  semanticType: SemanticObjectType;
  semanticConfidence: number; // 0 to 100
  candidateSemanticType?: SemanticObjectType;
  candidateSemanticConfidence?: number;
  conflictResolved?: boolean;
  conflictDetails?: string;

  // Level C: Context & Grouping
  groupType: GroupContextType;
  contextConfidence: number; // 0 to 100
  groupConfidence?: number;
  memberSemanticConfidence?: number;
  parentStructure?: string; // e.g., 'ORNAMENT', 'TEXT_GROUP', 'CENTRAL_EMBLEM', 'FRAME'

  // Level D: Overall Confidence & Evidence
  confidence: number; // 0 to 100 (weighted combination)
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string[]; // List of real, measured, explainable facts
  isHeuristic?: boolean; // True if classification relies on fallbacks

  // Spatial & Geometrical Metrics
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  boundingBox: { minX: number; maxX: number; minY: number; maxY: number };
  centerOfMass: { x: number; y: number };
  area: number;
  perimeter: number;
  compactness: number; // 4*pi*area / perimeter^2
  aspectRatio: number; // width / height
  verticesCount: number;
  isClosed: boolean;
  subpathsCount: number;
  holesCount: number;
  orientation: number; // degrees
  curvature: number;

  // Primitive Details
  primitiveDetails: {
    radius?: number;
    innerRadius?: number;
    outerRadius?: number;
    arcStartAngle?: number;
    arcEndAngle?: number;
    curvRadius?: number;
    peakRadius?: number;
    valleyRadius?: number;
    peakToValleyRatio?: number;
    starPoints?: number;
    sidesCount?: number;
    textEstimate?: string;
  };

  // Reasoning and Explainability
  reasoning: LogoDiagnosticReasoning;

  // Relations & Topology
  groupId: string;
  parentId: string | null;
  childrenIds: string[];
  nearbyObjectIds: string[];
  symmetricWithId?: string;

  // Repetition & Grouping
  repetitionGroup?: {
    groupId: string;
    totalCount: number;
    patternType: 'radial' | 'linear_horizontal' | 'linear_vertical' | 'axial_symmetry';
    centerPoint?: { x: number; y: number };
    angularStep?: number;
  };

  pointsCount: number;
  originalColor: string;
  points: EmbroideryPoint[];
  subpaths?: EmbroideryPoint[][];
}

export interface LogoTextGroupMetrics {
  alignmentScore: number;
  sizeConsistencyScore: number;
  spacingScore: number | null;
  spacingMeasurable: boolean;
  orientationScore: number;
  glyphCompatibilityScore: number;
  baselineScore: number;
  ornamentPenalty?: number;
  groupGeometryConfidence: number;
  typographicConfidence: number;
  finalTextConfidence: number;
}

export interface LogoTextGroup {
  id: string; // TEXT_GROUP_01, etc.
  name: string;
  memberIds: string[];
  arrangement: 'CURVED_ARC' | 'CIRCULAR_FULL' | 'HORIZONTAL' | 'VERTICAL' | 'UNSTRUCTURED';
  estimatedRadius?: number;
  angleSpan?: { start: number; end: number };
  textEstimate?: string;
  status?: 'VALIDATED_TEXT' | 'CANDIDATE_TEXT' | 'REJECTED_TEXT';
  groupConfidence?: number;
  metrics?: LogoTextGroupMetrics;
  reasoningText?: string;
}

export interface LogoStructureTree {
  id: string;
  name: string;
  category: LogoObjectType;
  children: LogoStructureTree[];
  analysis?: LogoObjectAnalysis;
}

export interface LogoDiagnosticReport {
  timestamp: string;
  totalObjects: number;
  centerOfLogo: { x: number; y: number };
  logoBoundingBox: { minX: number; maxX: number; minY: number; maxY: number };

  categoryCounts: Record<LogoObjectType, number>;

  // Objects list with stable IDs
  objects: LogoObjectAnalysis[];

  // Low confidence objects count & list
  lowConfidenceObjects: LogoObjectAnalysis[];

  // Structure Tree
  structureTree: LogoStructureTree[];

  // Semantic Groups
  textGroups: LogoTextGroup[];

  // Primitives & Star Detection Audits
  primitivesSummary: {
    circlesCount: number;
    ringsCount: number;
    curvedTextArcsCount: number;
    starsHighConfidenceCount: number;
    starsLowConfidenceCount: number;
    laurelsOrnamentsCount: number;
    symbolsCount: number;
    noiseCandidatesCount: number;
  };

  // Symmetries & Repetitions
  symmetries: {
    radialSymmetriesCount: number;
    axialSymmetriesCount: number;
    primaryCenter: { x: number; y: number };
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * LogoAnalyzerKernel: CAD/CAM & Topological Analysis Engine for Logo Vector Graphics.
 * Pure diagnostic, non-destructive, 4-level explainable semantic classification.
 */
export class LogoAnalyzerKernel {
  public static analyzeLogo(layers: EmbroideryLayer[]): LogoDiagnosticReport {
    const validLayers = layers.filter(l => l && l.visible !== false);
    if (validLayers.length === 0) {
      return this.createEmptyReport();
    }

    // 1. Calculate Global Bounding Box & Center of Mass
    let globalMinX = Infinity, globalMaxX = -Infinity;
    let globalMinY = Infinity, globalMaxY = -Infinity;
    let totalXSum = 0, totalYSum = 0, totalPtsCount = 0;

    validLayers.forEach(layer => {
      const pts = this.extractAllPoints(layer);
      pts.forEach(p => {
        if (p.x < globalMinX) globalMinX = p.x;
        if (p.x > globalMaxX) globalMaxX = p.x;
        if (p.y < globalMinY) globalMinY = p.y;
        if (p.y > globalMaxY) globalMaxY = p.y;
        totalXSum += p.x;
        totalYSum += p.y;
        totalPtsCount++;
      });
    });

    const logoCenterX = totalPtsCount > 0 ? totalXSum / totalPtsCount : (globalMinX + globalMaxX) / 2;
    const logoCenterY = totalPtsCount > 0 ? totalYSum / totalPtsCount : (globalMinY + globalMaxY) / 2;
    const logoWidth = Math.max(1, globalMaxX - globalMinX);
    const logoHeight = Math.max(1, globalMaxY - globalMinY);
    const logoMaxDimension = Math.max(logoWidth, logoHeight);

    // 2. Individual Layer Analysis (Extract Features & Evaluate Geometry/Standalone Semantic)
    const rawAnalyses: LogoObjectAnalysis[] = validLayers.map((layer, idx) => {
      const stableId = `LOGO_OBJ_${String(idx + 1).padStart(3, '0')}`;
      return this.extractLayerFeatures(layer, stableId, logoCenterX, logoCenterY, logoMaxDimension);
    });

    // 3. Compute Nearby Relationships
    this.computeSpatialRelationships(rawAnalyses);

    // 4. Multi-Element Contextual Classification (Group-level analysis: text arcs, laurels, central emblem)
    const { updatedAnalyses: contextualAnalyses, textGroups: rawTextGroups } = this.classifyObjectsWithContext(
      rawAnalyses,
      logoCenterX,
      logoCenterY,
      logoMaxDimension
    );

    // 5. Final Conflict Resolution Phase (GEOMETRY -> SEMANTIC CANDIDATES -> CONTEXT -> CONFLICT RESOLUTION -> FINAL CLASSIFICATION)
    const { resolvedObjects: updatedAnalyses, resolvedTextGroups: textGroups } = LogoAnalyzerKernel.resolveConflicts(
      contextualAnalyses,
      rawTextGroups,
      logoCenterX,
      logoCenterY,
      logoMaxDimension
    );

    // 5. Build Hierarchical Structure Tree
    const structureTree = this.buildStructureTree(updatedAnalyses, logoCenterX, logoCenterY);

    // 6. Aggregate Metrics & Category Counts
    const categoryCounts: Record<LogoObjectType, number> = {
      TEXT: 0,
      GEOMETRY: 0,
      SYMBOL: 0,
      ORNAMENT: 0,
      SURFACE: 0,
      NOISE: 0,
      UNKNOWN: 0
    };

    let circlesCount = 0;
    let ringsCount = 0;
    let curvedTextArcsCount = 0;
    let starsHighConfidenceCount = 0;
    let starsLowConfidenceCount = 0;
    let laurelsOrnamentsCount = 0;
    let symbolsCount = 0;
    let noiseCandidatesCount = 0;
    let radialSymmetriesCount = 0;
    let axialSymmetriesCount = 0;

    const lowConfidenceObjects: LogoObjectAnalysis[] = [];

    updatedAnalyses.forEach(obj => {
      categoryCounts[obj.category]++;

      if (obj.confidenceLevel === 'LOW' || obj.confidence < 60) {
        lowConfidenceObjects.push(obj);
      }

      if (obj.geometryType === 'CIRCLE' || obj.geometryType === 'ELLIPSE') circlesCount++;
      if (obj.geometryType === 'RING') ringsCount++;
      if (obj.groupType === 'CURVED_TEXT_TOP' || obj.groupType === 'CURVED_TEXT_BOTTOM') curvedTextArcsCount++;

      if (obj.semanticType === 'STAR') {
        if (obj.semanticConfidence >= 75) {
          starsHighConfidenceCount++;
        } else {
          starsLowConfidenceCount++;
        }
      }

      if (obj.semanticType === 'LEAF' || obj.groupType === 'LAUREL_LEFT' || obj.groupType === 'LAUREL_RIGHT' || obj.category === 'ORNAMENT') {
        laurelsOrnamentsCount++;
      }
      if (obj.category === 'SYMBOL') symbolsCount++;
      if (obj.category === 'NOISE' || obj.semanticType === 'NOISE') noiseCandidatesCount++;

      if (obj.repetitionGroup) {
        if (obj.repetitionGroup.patternType === 'radial') radialSymmetriesCount++;
        if (obj.repetitionGroup.patternType === 'axial_symmetry') axialSymmetriesCount++;
      }
    });

    return {
      timestamp: new Date().toISOString(),
      totalObjects: updatedAnalyses.length,
      centerOfLogo: { x: Math.round(logoCenterX), y: Math.round(logoCenterY) },
      logoBoundingBox: { minX: Math.round(globalMinX), maxX: Math.round(globalMaxX), minY: Math.round(globalMinY), maxY: Math.round(globalMaxY) },
      categoryCounts,
      objects: updatedAnalyses,
      lowConfidenceObjects,
      structureTree,
      textGroups,
      primitivesSummary: {
        circlesCount,
        ringsCount,
        curvedTextArcsCount,
        starsHighConfidenceCount,
        starsLowConfidenceCount,
        laurelsOrnamentsCount,
        symbolsCount,
        noiseCandidatesCount
      },
      symmetries: {
        radialSymmetriesCount,
        axialSymmetriesCount,
        primaryCenter: { x: Math.round(logoCenterX), y: Math.round(logoCenterY) }
      }
    };
  }

  private static extractAllPoints(layer: EmbroideryLayer): EmbroideryPoint[] {
    const pts: EmbroideryPoint[] = [];
    if (layer.subpaths && layer.subpaths.length > 0) {
      layer.subpaths.forEach(sp => sp.forEach(p => pts.push(p)));
    } else if (layer.points && layer.points.length > 0) {
      layer.points.forEach(p => pts.push(p));
    }
    return pts;
  }

  /**
   * Computes spatial & geometric properties for a single layer with 4-level analysis
   */
  private static extractLayerFeatures(
    layer: EmbroideryLayer,
    stableId: string,
    logoCenterX: number,
    logoCenterY: number,
    logoMaxDim: number
  ): LogoObjectAnalysis {
    const pts = this.extractAllPoints(layer);
    const subpathsCount = layer.subpaths?.length || (layer.points && layer.points.length > 0 ? 1 : 0);

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    });

    if (pts.length === 0) {
      minX = maxX = minY = maxY = 0;
    }

    const width = Math.max(0.1, maxX - minX);
    const height = Math.max(0.1, maxY - minY);
    const centerOfMass = {
      x: pts.length > 0 ? sumX / pts.length : (minX + maxX) / 2,
      y: pts.length > 0 ? sumY / pts.length : (minY + maxY) / 2
    };

    // Calculate perimeter & shoelace area
    let perimeter = 0;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);
      area += (p1.x * p2.y - p2.x * p1.y);
    }
    area = Math.abs(area) / 2;
    if (area === 0) {
      area = width * height * 0.65;
    }

    const aspectRatio = width / Math.max(0.1, height);
    const compactness = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;
    const isClosed = pts.length > 2 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 15;

    // Detect salient vertices/corners
    const verticesCount = this.countSalientVertices(pts);

    // Radial distance metrics from object's own center
    let radSum = 0;
    pts.forEach(p => { radSum += Math.hypot(p.x - centerOfMass.x, p.y - centerOfMass.y); });
    const avgRad = pts.length > 0 ? radSum / pts.length : 0;

    let radVarianceSum = 0;
    pts.forEach(p => {
      const d = Math.hypot(p.x - centerOfMass.x, p.y - centerOfMass.y);
      radVarianceSum += (d - avgRad) * (d - avgRad);
    });
    const radStdDev = pts.length > 0 ? Math.sqrt(radVarianceSum / pts.length) : 0;
    const radStdDevRatio = avgRad > 0 ? radStdDev / avgRad : 1;

    // Principle axis orientation
    let inertiaXX = 0, inertiaYY = 0, inertiaXY = 0;
    pts.forEach(p => {
      const dx = p.x - centerOfMass.x;
      const dy = p.y - centerOfMass.y;
      inertiaXX += dx * dx;
      inertiaYY += dy * dy;
      inertiaXY += dx * dy;
    });
    let orientation = 0;
    if (Math.abs(inertiaXX - inertiaYY) > 1e-5 || Math.abs(inertiaXY) > 1e-5) {
      orientation = Math.round((Math.atan2(2 * inertiaXY, inertiaXX - inertiaYY) / 2) * (180 / Math.PI));
    }

    // LEVEL A: OBJECTIVE GEOMETRY EVALUATION
    const geomResult = this.evaluateObjectiveGeometry({
      pts,
      width,
      height,
      area,
      perimeter,
      compactness,
      aspectRatio,
      isClosed,
      subpathsCount,
      holesCount: subpathsCount > 1 ? subpathsCount - 1 : 0,
      verticesCount,
      avgRad,
      radStdDevRatio,
      logoMaxDim
    });

    // Rigorous STAR Evaluation
    const starCheck = this.evaluateStarGeometry(pts, centerOfMass, avgRad, logoMaxDim, width, height, isClosed);

    // LEVEL B: STANDALONE SEMANTIC EVALUATION
    const evidence: string[] = [
      `Contour ${isClosed ? 'fermé' : 'ouvert'} (${pts.length} points)`,
      `Dimensions: ${Math.round(width)}x${Math.round(height)} px (Ratio: ${aspectRatio.toFixed(2)})`,
      `Compactness: ${compactness.toFixed(3)}, Écart-type radial: ${(radStdDevRatio * 100).toFixed(1)}%`
    ];

    let semanticType: SemanticObjectType = 'UNKNOWN';
    let semanticConfidence = 35; // Default low confidence for standalone object
    const criteria: string[] = [];
    const counterCriteria: string[] = [];

    // Rigorous NOISE check (ONLY true artifacts: area < 0.03% or tiny pixel noise <= 1.2px)
    const isTinyNoise = (area < logoMaxDim * logoMaxDim * 0.0003 && pts.length <= 4) ||
                        (width < logoMaxDim * 0.012 && height < logoMaxDim * 0.012 && pts.length <= 3);

    if (isTinyNoise) {
      semanticType = 'NOISE';
      semanticConfidence = Math.round(clamp(95 - (width + height) * 2, 70, 98));
      criteria.push('Surface extrêmement réduite et faible nombre de points (< 1.2% du logo)');
      evidence.push(`Artefact ou bruit de numérisation (${Math.round(width)}x${Math.round(height)}px, ${pts.length} pts)`);
    } else if (starCheck.isStar) {
      semanticType = 'STAR';
      semanticConfidence = starCheck.confidence;
      criteria.push(...starCheck.criteria);
      counterCriteria.push(...starCheck.counterCriteria);
      evidence.push(
        `Étoile à ${starCheck.peaksCount} pointes (Rayons: Pic ${Math.round(starCheck.peakRad)}px, Vallée ${Math.round(starCheck.valleyRad)}px, Ratio: ${starCheck.ratio.toFixed(2)}x)`,
        `Écart-type angulaire des pics: ${starCheck.peakAngleStdDev.toFixed(1)}°`
      );
    } else if (aspectRatio >= 1.4 && aspectRatio <= 5.0 && compactness >= 0.18 && compactness <= 0.82 && verticesCount <= 8) {
      semanticType = 'LEAF';
      semanticConfidence = Math.round(clamp(65 + (aspectRatio - 1.4) * 8 - radStdDevRatio * 40, 55, 88));
      criteria.push('Forme fusiforme allongée (Feuille / Rameau)');
      evidence.push(`Profil allongé à extrémités effilées (Ratio: ${aspectRatio.toFixed(2)})`);
    } else if (width < logoMaxDim * 0.22 && height < logoMaxDim * 0.22 && aspectRatio >= 0.12 && aspectRatio <= 3.2) {
      // Potential glyph candidate - GLYPH_CANDIDATE standalone until context pass
      semanticType = 'GLYPH_CANDIDATE';
      semanticConfidence = 45;
      criteria.push('Dimensions et proportions compactes compatibles avec un glyphe / caractère (GLYPH_CANDIDATE)');
      counterCriteria.push('Objet isolé : nécessite l\'analyse de cohérence typographique de groupe pour valider TEXT_CHARACTER');
      evidence.push('Candidat caractère (GLYPH_CANDIDATE 45% avant analyse du groupe)');
    } else {
      semanticType = 'UNKNOWN';
      semanticConfidence = 35;
      counterCriteria.push('Aucun modèle sémantique individuel spécifique à forte preuve');
      evidence.push('Objet réel mais identité sémantique indéterminée sur la forme seule');
    }

    // Store Level B candidate hypothesis before contextual pass
    const candidateSemanticType = semanticType;
    const candidateSemanticConfidence = semanticConfidence;

    // LEVEL C: INITIAL CONTEXT
    const groupType: GroupContextType = 'NONE';
    const contextConfidence = 0;

    // LEVEL D: OVERALL CONFIDENCE (WEIGHTED)
    const overallConfidence = Math.round(
      clamp(0.40 * geomResult.confidence + 0.40 * semanticConfidence + 0.20 * contextConfidence, 20, 98)
    );

    const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
      overallConfidence >= 80 ? 'HIGH' : overallConfidence >= 60 ? 'MEDIUM' : 'LOW';

    // Legacy Mappings for UI backward compatibility
    const legacyCategory = this.mapToLegacyCategory(geomResult.type, semanticType, groupType, 'NONE');
    const legacySpecific = this.mapToLegacySpecific(geomResult.type, semanticType, groupType, starCheck.isStar);

    return {
      id: stableId,
      layerId: layer.id,
      layerName: layer.name,

      category: legacyCategory,
      specificType: legacySpecific,

      geometryType: geomResult.type,
      geometryConfidence: geomResult.confidence,

      semanticType,
      semanticConfidence,
      candidateSemanticType,
      candidateSemanticConfidence,

      groupType,
      contextConfidence,
      parentStructure: undefined,

      confidence: overallConfidence,
      confidenceLevel,
      evidence,
      isHeuristic: semanticType === 'UNKNOWN' || semanticConfidence < 50,

      position: { x: Math.round(minX), y: Math.round(minY) },
      dimensions: { width: Math.round(width), height: Math.round(height) },
      boundingBox: { minX: Math.round(minX), maxX: Math.round(maxX), minY: Math.round(minY), maxY: Math.round(maxY) },
      centerOfMass: { x: Math.round(centerOfMass.x), y: Math.round(centerOfMass.y) },
      area: Math.round(area),
      perimeter: Math.round(perimeter),
      compactness: Number(compactness.toFixed(3)),
      aspectRatio: Number(aspectRatio.toFixed(3)),
      verticesCount,
      isClosed,
      subpathsCount,
      holesCount: subpathsCount > 1 ? subpathsCount - 1 : 0,
      orientation,
      curvature: Number((radStdDevRatio * 100).toFixed(1)),
      primitiveDetails: {
        radius: Math.round(avgRad),
        peakRadius: Math.round(starCheck.peakRad),
        valleyRadius: Math.round(starCheck.valleyRad),
        peakToValleyRatio: Number(starCheck.ratio.toFixed(2)),
        starPoints: starCheck.peaksCount,
        sidesCount: verticesCount
      },
      reasoning: {
        criteria,
        counterCriteria,
        conclusion: `Diagnostic initial : Géométrie [${geomResult.type}] (${geomResult.confidence}%), Sémantique [${semanticType}] (${semanticConfidence}%).`
      },
      groupId: 'grp_default',
      parentId: null,
      childrenIds: [],
      nearbyObjectIds: [],
      pointsCount: pts.length,
      originalColor: layer.color || '#FFFFFF',
      points: pts,
      subpaths: layer.subpaths
    };
  }

  /**
   * Objective Geometry Classifier strictly based on mathematical measures
   */
  private static evaluateObjectiveGeometry(params: {
    pts: EmbroideryPoint[];
    width: number;
    height: number;
    area: number;
    perimeter: number;
    compactness: number;
    aspectRatio: number;
    isClosed: boolean;
    subpathsCount: number;
    holesCount: number;
    verticesCount: number;
    avgRad: number;
    radStdDevRatio: number;
    logoMaxDim: number;
  }): { type: GeometryObjectType; confidence: number } {
    const {
      pts, width, height, area, compactness, aspectRatio, isClosed,
      holesCount, verticesCount, avgRad, radStdDevRatio, logoMaxDim
    } = params;

    if (!isClosed || pts.length < 3) {
      const isBand = aspectRatio > 3.0 || aspectRatio < 0.33;
      const conf = Math.round(clamp(75 + Math.min(20, Math.abs(aspectRatio - 1) * 5), 50, 95));
      return { type: isBand ? 'BAND' : 'OPEN_LINE', confidence: conf };
    }

    if (holesCount >= 1 && radStdDevRatio < 0.15) {
      const conf = Math.round(clamp(96 - radStdDevRatio * 200, 60, 98));
      return { type: 'RING', confidence: conf };
    }

    if (aspectRatio >= 0.82 && aspectRatio <= 1.22 && radStdDevRatio < 0.11) {
      const fitError = radStdDevRatio * 100;
      const conf = Math.round(clamp(98 - fitError * 4 - Math.abs(aspectRatio - 1.0) * 50, 60, 99));
      return { type: 'CIRCLE', confidence: conf };
    }

    if (radStdDevRatio < 0.22 && (aspectRatio > 1.25 || aspectRatio < 0.80) && compactness >= 0.55) {
      const conf = Math.round(clamp(92 - radStdDevRatio * 180, 55, 96));
      return { type: 'ELLIPSE', confidence: conf };
    }

    if (width > logoMaxDim * 0.32 && height > logoMaxDim * 0.32 && area > logoMaxDim * logoMaxDim * 0.10) {
      const conf = Math.round(clamp(88 + (area / (logoMaxDim * logoMaxDim)) * 20, 65, 96));
      return { type: 'CLOSED_SURFACE', confidence: conf };
    }

    if (aspectRatio > 2.2 || aspectRatio < 0.45) {
      const ratioScore = Math.min(25, (aspectRatio > 1 ? aspectRatio : 1 / aspectRatio) * 4);
      const conf = Math.round(clamp(70 + ratioScore, 55, 95));
      return { type: 'ELONGATED_SHAPE', confidence: conf };
    }

    if (verticesCount >= 3 && verticesCount <= 10 && radStdDevRatio > 0.12) {
      const conf = Math.round(clamp(65 + verticesCount * 2, 50, 88));
      return { type: 'POLYGON', confidence: conf };
    }

    const conf = Math.round(clamp(50 + (1 - radStdDevRatio) * 30, 30, 75));
    return { type: 'IRREGULAR_SHAPE', confidence: conf };
  }

  /**
   * Counts distinct salient vertices using angular changes
   */
  private static countSalientVertices(pts: EmbroideryPoint[]): number {
    if (pts.length < 5) return pts.length;
    let count = 0;
    const n = pts.length;

    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 2 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 2) % n];

      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };

      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.hypot(v1.x, v1.y);
      const mag2 = Math.hypot(v2.x, v2.y);

      if (mag1 > 2 && mag2 > 2) {
        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        const angle = Math.acos(cosAngle) * (180 / Math.PI);
        if (angle > 35) {
          count++;
        }
      }
    }
    return Math.max(3, Math.min(count, 32));
  }

  /**
   * Rigorous Mathematical Star Detector (Combining peaks/valleys, radial variance, AND angular step regularity)
   */
  private static evaluateStarGeometry(
    pts: EmbroideryPoint[],
    center: { x: number; y: number },
    avgRad: number,
    logoMaxDim: number,
    width: number,
    height: number,
    isClosed: boolean
  ): {
    isStar: boolean;
    confidence: number;
    peaksCount: number;
    peakRad: number;
    valleyRad: number;
    ratio: number;
    peakAngleStdDev: number;
    criteria: string[];
    counterCriteria: string[];
    conclusion: string;
  } {
    const criteria: string[] = [];
    const counterCriteria: string[] = [];

    if (pts.length < 8 || !isClosed) {
      counterCriteria.push('Contour ouvert ou points insuffisants pour une étoile');
      return {
        isStar: false,
        confidence: 0,
        peaksCount: 0,
        peakRad: 0,
        valleyRad: 0,
        ratio: 1,
        peakAngleStdDev: 99,
        criteria,
        counterCriteria,
        conclusion: 'Rejeté STAR : contour ouvert ou insuffisance de points.'
      };
    }

    const aspect = width / Math.max(0.1, height);
    if (aspect < 0.65 || aspect > 1.55) {
      counterCriteria.push(`Élongation Asymétrique (${aspect.toFixed(2)}) incompatible avec une étoile stellaire`);
      return {
        isStar: false,
        confidence: 0,
        peaksCount: 0,
        peakRad: 0,
        valleyRad: 0,
        ratio: 1,
        peakAngleStdDev: 99,
        criteria,
        counterCriteria,
        conclusion: 'Rejeté STAR : proportions trop étirées.'
      };
    }

    if (width > logoMaxDim * 0.32) {
      counterCriteria.push('Taille excessive (> 32% du logo), correspond à une bordure ou un cadre');
      return {
        isStar: false,
        confidence: 0,
        peaksCount: 0,
        peakRad: 0,
        valleyRad: 0,
        ratio: 1,
        peakAngleStdDev: 99,
        criteria,
        counterCriteria,
        conclusion: 'Rejeté STAR : dimensions trop vastes.'
      };
    }

    // Extract radial distances & peak/valley extrema
    const dists = pts.map(p => Math.hypot(p.x - center.x, p.y - center.y));
    const peakIndices: number[] = [];
    const valleyIndices: number[] = [];

    for (let i = 0; i < dists.length; i++) {
      const prev = dists[(i - 1 + dists.length) % dists.length];
      const curr = dists[i];
      const next = dists[(i + 1) % dists.length];

      if (curr > prev && curr >= next) peakIndices.push(i);
      if (curr < prev && curr <= next) valleyIndices.push(i);
    }

    const peaksCount = peakIndices.length;
    if (peaksCount < 4 || peaksCount > 8) {
      counterCriteria.push(`Nombre de pics détectés (${peaksCount}) hors plage stellaire [4..8]`);
      return {
        isStar: false,
        confidence: 0,
        peaksCount,
        peakRad: 0,
        valleyRad: 0,
        ratio: 1,
        peakAngleStdDev: 99,
        criteria,
        counterCriteria,
        conclusion: `Rejeté STAR : ${peaksCount} sommets (attendu 4 à 8).`
      };
    }

    // Measure Peak Radii & Valley Radii
    const peakRadii = peakIndices.map(i => dists[i]);
    const valleyRadii = valleyIndices.map(i => dists[i]);

    const avgPeakRad = peakRadii.reduce((a, b) => a + b, 0) / peakRadii.length;
    const avgValleyRad = valleyRadii.length > 0 ? valleyRadii.reduce((a, b) => a + b, 0) / valleyRadii.length : avgRad;

    const ratio = avgValleyRad > 0 ? avgPeakRad / avgValleyRad : 1;

    // Peak Radii Variance
    const peakRadVar = peakRadii.reduce((sum, r) => sum + (r - avgPeakRad) * (r - avgPeakRad), 0) / peakRadii.length;
    const peakRadStdDev = Math.sqrt(peakRadVar);
    const peakRadStdDevRatio = avgPeakRad > 0 ? peakRadStdDev / avgPeakRad : 1;

    // CRUCIAL: Angular step regularity between adjacent peaks
    const peakAngles = peakIndices.map(i => {
      const p = pts[i];
      let a = Math.atan2(p.y - center.y, p.x - center.x) * (180 / Math.PI);
      if (a < 0) a += 360;
      return a;
    }).sort((a, b) => a - b);

    const angleSteps: number[] = [];
    for (let k = 0; k < peakAngles.length; k++) {
      const nextA = (k + 1 < peakAngles.length) ? peakAngles[k + 1] : peakAngles[0] + 360;
      angleSteps.push(nextA - peakAngles[k]);
    }

    const expectedStep = 360 / peaksCount;
    const angleStepVar = angleSteps.reduce((sum, step) => sum + (step - expectedStep) * (step - expectedStep), 0) / angleSteps.length;
    const peakAngleStdDev = Math.sqrt(angleStepVar);

    // RIGOROUS STAR CRITERIA:
    // 1. Ratio Pic/Vallée between 1.45 and 3.0
    // 2. Peak Radii StdDev Ratio < 0.15 (all peaks equal distance from center)
    // 3. Peak Angle StdDev < 12° (regular angular distribution around 360°)
    const holdsRatio = ratio >= 1.45 && ratio <= 3.2;
    const holdsPeakRegularity = peakRadStdDevRatio < 0.16;
    const holdsAngleDistribution = peakAngleStdDev < 12.0;

    if (holdsRatio && holdsPeakRegularity && holdsAngleDistribution) {
      criteria.push(
        `Alternance régulière de ${peaksCount} branches (Pic/Vallée ${ratio.toFixed(2)}x)`,
        `Dispersion angulaire des pics faible (${peakAngleStdDev.toFixed(1)}° ± régulier)`,
        `Homogénéité du rayon des pics (${(peakRadStdDevRatio * 100).toFixed(1)}% déviation)`
      );

      // Continuously calculated semantic confidence score
      const baseConf = 96;
      const anglePenalty = peakAngleStdDev * 2.5;
      const radPenalty = peakRadStdDevRatio * 120;
      const ratioPenalty = Math.abs(ratio - 2.1) * 15;

      const starConfidence = Math.round(clamp(baseConf - anglePenalty - radPenalty - ratioPenalty, 55, 98));

      return {
        isStar: true,
        confidence: starConfidence,
        peaksCount,
        peakRad: avgPeakRad,
        valleyRad: avgValleyRad,
        ratio,
        peakAngleStdDev,
        criteria,
        counterCriteria,
        conclusion: `STAR validé à ${starConfidence}% : Étoile régulière à ${peaksCount} branches.`
      };
    }

    // Fail reasons for non-star radial shapes
    if (ratio < 1.45) {
      counterCriteria.push(`Rapport Pic/Vallée faible (${ratio.toFixed(2)}x < 1.45x) : forme polygonale ou ondulée, pas une étoile`);
    }
    if (!holdsAngleDistribution) {
      counterCriteria.push(`Pics angulairement irréguliers (Déviation ${peakAngleStdDev.toFixed(1)}° > 12°) : distribution non stellaire`);
    }
    if (!holdsPeakRegularity) {
      counterCriteria.push(`Longueur des branches hétérogène (Déviation ${(peakRadStdDevRatio * 100).toFixed(1)}%)`);
    }

    return {
      isStar: false,
      confidence: 30,
      peaksCount,
      peakRad: avgPeakRad,
      valleyRad: avgValleyRad,
      ratio,
      peakAngleStdDev,
      criteria,
      counterCriteria,
      conclusion: 'Rejeté STAR : échec des critères de régularité stellaire.'
    };
  }

  /**
   * Computes spatial proximity / neighbors for each object
   */
  private static computeSpatialRelationships(objects: LogoObjectAnalysis[]): void {
    const threshold = 45; // px distance threshold
    objects.forEach(o1 => {
      o1.nearbyObjectIds = [];
      objects.forEach(o2 => {
        if (o1.id !== o2.id) {
          const dist = Math.hypot(o1.centerOfMass.x - o2.centerOfMass.x, o1.centerOfMass.y - o2.centerOfMass.y);
          if (dist < threshold) {
            o1.nearbyObjectIds.push(o2.id);
          }
        }
      });
    });
  }

  /**
   * Multi-factor evaluation of typographical consistency for a spatial group of candidate objects
   */
  private static evaluateTypographicGroup(
    objs: LogoObjectAnalysis[],
    arrangement: 'CURVED_ARC' | 'HORIZONTAL',
    logoCenterX: number,
    logoCenterY: number,
    logoMaxDim: number
  ): {
    status: 'VALIDATED_TEXT' | 'CANDIDATE_TEXT' | 'REJECTED_TEXT';
    groupConfidence: number;
    metrics: LogoTextGroupMetrics;
    reasoningText: string;
  } {
    const n = objs.length;
    if (n === 0) {
      return {
        status: 'REJECTED_TEXT',
        groupConfidence: 0,
        metrics: {
          alignmentScore: 0,
          sizeConsistencyScore: 0,
          spacingScore: null,
          spacingMeasurable: false,
          orientationScore: 0,
          glyphCompatibilityScore: 0,
          baselineScore: 0,
          ornamentPenalty: 0,
          groupGeometryConfidence: 0,
          typographicConfidence: 0,
          finalTextConfidence: 0
        },
        reasoningText: 'Aucun membre dans le groupe.'
      };
    }

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const stdDev = (arr: number[]) => {
      const m = mean(arr);
      return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) * (v - m), 0) / arr.length);
    };

    // 1. Glyph Compatibility Score (Refined & Structural)
    const glyphScores = objs.map(o => {
      // a. Basic shape & semantic type check
      let basicShape = 0;
      if (o.candidateSemanticType !== 'LEAF' && o.candidateSemanticType !== 'STAR' && o.semanticType !== 'NOISE') basicShape += 0.15;
      if (o.dimensions.width < logoMaxDim * 0.25 && o.dimensions.height < logoMaxDim * 0.25 && o.dimensions.height > 2) basicShape += 0.15;
      if (o.aspectRatio >= 0.12 && o.aspectRatio <= 2.8) basicShape += 0.15;

      // b. Topological & fill factor (Extent = area / bboxArea)
      let topological = 0;
      const bboxArea = o.dimensions.width * o.dimensions.height;
      const extent = bboxArea > 0 ? o.area / bboxArea : 0;
      // Text glyphs typically have extent between 0.15 and 0.82 (open strokes/counterforms)
      if (extent >= 0.15 && extent <= 0.82) {
        topological += 0.20;
      } else if (extent > 0.82) {
        topological += 0.05; // Solid boxes/rectangles are less likely to be characters
      }

      // Counter-form presence bonus (holesCount > 0 is a strong signal for A, B, D, O, P, Q, R, 0, 4, 6, 8, 9, etc.)
      if (o.holesCount > 0) {
        topological += 0.15;
      }

      // c. Contour complexity & Stroke traits
      let contourComp = 0;
      if (o.verticesCount >= 6 && o.verticesCount <= 100) contourComp += 0.10;
      if (o.compactness >= 0.02 && o.compactness <= 0.60) contourComp += 0.10;

      return Math.min(1.0, basicShape + topological + contourComp);
    });
    const glyphCompatibilityScore = Number(mean(glyphScores).toFixed(2));

    // 2. Size Consistency Score
    const heights = objs.map(o => o.dimensions.height);
    const widths = objs.map(o => o.dimensions.width);
    const meanH = mean(heights);
    const stdH = stdDev(heights);
    const cvH = stdH / Math.max(1, meanH);

    const meanW = mean(widths);
    const stdW = stdDev(widths);
    const cvW = stdW / Math.max(1, meanW);

    const scoreH = Math.max(0, 1 - cvH * 2.0);
    const scoreW = Math.max(0, 1 - cvW * 0.7);
    const sizeConsistencyScore = Number((0.75 * scoreH + 0.25 * scoreW).toFixed(2));

    // 3. Alignment Score, Baseline Score, Spacing & Orientation
    let alignmentScore = 0;
    let baselineScore = 0;
    let spacingMeasurable = n >= 3;
    let spacingScore: number | null = null;
    let orientationScore = 0;

    if (arrangement === 'CURVED_ARC') {
      const radii = objs.map(o => Math.hypot(o.centerOfMass.x - logoCenterX, o.centerOfMass.y - logoCenterY));
      const avgR = mean(radii);
      const stdR = stdDev(radii);
      const relStdR = stdR / Math.max(10, avgR);
      alignmentScore = Number(Math.max(0, 1 - relStdR * 12.0).toFixed(2));

      const bottomRadii = objs.map(o => Math.hypot(o.centerOfMass.x - logoCenterX, o.centerOfMass.y - logoCenterY) + o.dimensions.height / 2);
      const stdBottomR = stdDev(bottomRadii);
      baselineScore = Number(Math.max(0, 1 - (stdBottomR / Math.max(10, avgR)) * 10.0).toFixed(2));

      if (spacingMeasurable) {
        const angles = objs
          .map(o => Math.atan2(o.centerOfMass.y - logoCenterY, o.centerOfMass.x - logoCenterX) * (180 / Math.PI))
          .sort((a, b) => a - b);
        const deltaAngles: number[] = [];
        for (let i = 1; i < angles.length; i++) {
          deltaAngles.push(angles[i] - angles[i - 1]);
        }
        if (deltaAngles.length > 0) {
          const meanGap = mean(deltaAngles);
          const stdGap = stdDev(deltaAngles);
          const cvGap = stdGap / Math.max(0.1, meanGap);
          spacingScore = Number(Math.max(0, 1 - cvGap * 1.2).toFixed(2));
        }
      }

      const orientDiffs = objs.map(o => {
        const angle = Math.atan2(o.centerOfMass.y - logoCenterY, o.centerOfMass.x - logoCenterX) * (180 / Math.PI);
        const expectedTangential = (angle + 90) % 180;
        const actualNorm = (o.orientation + 180) % 180;
        return Math.abs(actualNorm - expectedTangential);
      });
      orientationScore = Number(Math.max(0, 1 - stdDev(orientDiffs) / 35.0).toFixed(2));
    } else {
      // HORIZONTAL
      const avgY = mean(objs.map(o => o.centerOfMass.y));
      const stdY = stdDev(objs.map(o => o.centerOfMass.y));
      alignmentScore = Number(Math.max(0, 1 - (stdY / Math.max(2, meanH)) * 1.8).toFixed(2));

      const maxYs = objs.map(o => o.boundingBox.maxY);
      const stdMaxY = stdDev(maxYs);
      baselineScore = Number(Math.max(0, 1 - (stdMaxY / Math.max(2, meanH)) * 1.6).toFixed(2));

      if (spacingMeasurable) {
        const sortedX = [...objs].sort((a, b) => a.centerOfMass.x - b.centerOfMass.x);
        const gaps: number[] = [];
        for (let i = 1; i < sortedX.length; i++) {
          const prev = sortedX[i - 1];
          const curr = sortedX[i];
          const gap = (curr.centerOfMass.x - curr.dimensions.width / 2) - (prev.centerOfMass.x + prev.dimensions.width / 2);
          gaps.push(gap);
        }
        if (gaps.length > 0) {
          const meanGap = mean(gaps);
          const stdGap = stdDev(gaps);
          const cvGap = stdGap / Math.max(1, Math.abs(meanGap));
          spacingScore = Number(Math.max(0, 1 - cvGap * 1.0).toFixed(2));
        }
      }

      const orientDev = stdDev(objs.map(o => o.orientation));
      orientationScore = Number(Math.max(0, 1 - orientDev / 25.0).toFixed(2));
    }

    // 4. Ornament Penalty (Decorative pattern check)
    const areas = objs.map(o => o.area);
    const compacts = objs.map(o => o.compactness);
    const cvArea = stdDev(areas) / Math.max(1, mean(areas));
    const cvComp = stdDev(compacts) / Math.max(0.01, mean(compacts));

    let ornamentPenalty = 0;
    if (cvArea < 0.06 && cvComp < 0.06 && objs.every(o => o.holesCount === 0)) {
      ornamentPenalty = 0.40;
    }

    // 5. Separate Score Calculations
    const groupGeometryConfidence = Math.round(
      clamp((alignmentScore * 0.45 + baselineScore * 0.35 + orientationScore * 0.20) * 100, 0, 100)
    );

    let typographicConfidence = 0;
    if (spacingMeasurable && spacingScore !== null) {
      typographicConfidence = Math.round(
        clamp((glyphCompatibilityScore * 0.45 + sizeConsistencyScore * 0.35 + spacingScore * 0.20) * 100, 0, 100)
      );
    } else {
      typographicConfidence = Math.round(
        clamp((glyphCompatibilityScore * 0.55 + sizeConsistencyScore * 0.45) * 100, 0, 100)
      );
    }

    const rawFinal = (groupGeometryConfidence * 0.45 + typographicConfidence * 0.55) / 100 - ornamentPenalty;
    const finalTextConfidence = Math.round(clamp(rawFinal * 100, 0, 100));
    const groupConfidence = finalTextConfidence;

    // 6. GATING Checks (Gates minimaux)
    const alignmentGate = alignmentScore >= 0.65;
    const glyphGate = glyphCompatibilityScore >= 0.50;
    const baselineGate = baselineScore >= 0.60;
    const sizeGate = sizeConsistencyScore >= 0.40;
    const spacingGate = !spacingMeasurable || (spacingScore !== null && spacingScore >= 0.40);
    const orientationGate = orientationScore >= 0.50;
    const gatesPassed = alignmentGate && glyphGate && baselineGate && sizeGate && spacingGate && orientationGate;

    // Decision Logic
    let status: 'VALIDATED_TEXT' | 'CANDIDATE_TEXT' | 'REJECTED_TEXT' = 'REJECTED_TEXT';

    if (n >= 3) {
      if (gatesPassed && finalTextConfidence >= 65 && groupGeometryConfidence >= 65 && typographicConfidence >= 60) {
        status = 'VALIDATED_TEXT';
      } else if (finalTextConfidence >= 45) {
        status = 'CANDIDATE_TEXT';
      } else {
        status = 'REJECTED_TEXT';
      }
    } else {
      // n == 2: Exceptionally strong proof required for VALIDATED_TEXT
      const strongProofForTwo =
        gatesPassed &&
        finalTextConfidence >= 75 &&
        groupGeometryConfidence >= 80 &&
        typographicConfidence >= 70 &&
        glyphCompatibilityScore >= 0.70 &&
        alignmentScore >= 0.80 &&
        baselineScore >= 0.80 &&
        sizeConsistencyScore >= 0.65 &&
        ornamentPenalty === 0 &&
        objs.every(o => o.candidateSemanticType !== 'STAR' && o.candidateSemanticType !== 'LEAF');

      if (strongProofForTwo) {
        status = 'VALIDATED_TEXT';
      } else if (finalTextConfidence >= 45) {
        status = 'CANDIDATE_TEXT';
      } else {
        status = 'REJECTED_TEXT';
      }
    }

    const spacingDisplay = spacingMeasurable && spacingScore !== null
      ? `${(spacingScore * 100).toFixed(0)} %`
      : 'N/M';

    const ornamentNotice = ornamentPenalty > 0 ? ` (Pénalité ornementale de -${Math.round(ornamentPenalty * 100)}%)` : '';

    const reasoningText = status === 'VALIDATED_TEXT'
      ? `TEXT_GROUP validé (${n} membres, Confiance ${finalTextConfidence}%) : Alignement ${(alignmentScore*100).toFixed(0)}%, Tailles ${(sizeConsistencyScore*100).toFixed(0)}%, Espacement ${spacingDisplay}, Glyphes ${(glyphCompatibilityScore*100).toFixed(0)}%${ornamentNotice}`
      : status === 'CANDIDATE_TEXT'
      ? `CANDIDATE_TEXT_GROUP (${n} membres, Confiance ${finalTextConfidence}%) : ${!gatesPassed ? 'Défaut de critère essentiel (Gates non franchis: ' + (!orientationGate ? 'Orientation' : !glyphGate ? 'Glyph' : !alignmentGate ? 'Alignement' : 'Géométrie') + ')' : n < 3 ? 'Exigence de preuve élevée pour groupe de 2 membres (non atteinte)' : 'Preuves typographiques insuffisantes'}.${ornamentNotice}`
      : `REJECTED_TEXT (${n} membres, Confiance ${finalTextConfidence}%) : Incohérences typographiques ou motif ornemental.${ornamentNotice}`;

    return {
      status,
      groupConfidence,
      metrics: {
        alignmentScore,
        sizeConsistencyScore,
        spacingScore,
        spacingMeasurable,
        orientationScore,
        glyphCompatibilityScore,
        baselineScore,
        ornamentPenalty,
        groupGeometryConfidence,
        typographicConfidence,
        finalTextConfidence
      },
      reasoningText
    };
  }

  /**
   * Multi-element Contextual Classification & Text/Symbol Grouping Engine
   */
  private static classifyObjectsWithContext(
    objects: LogoObjectAnalysis[],
    logoCenterX: number,
    logoCenterY: number,
    logoMaxDim: number
  ): { updatedAnalyses: LogoObjectAnalysis[]; textGroups: LogoTextGroup[] } {
    const result = [...objects];
    const textGroups: LogoTextGroup[] = [];

    let textGroupCounter = 1;
    const claimedTextObjectIds = new Set<string>();

    // Filter potential text candidates (small/medium size, not NOISE, not LEAF or STAR)
    const textCandidates = result.filter(
      o => o.dimensions.width < logoMaxDim * 0.25 &&
           o.dimensions.height < logoMaxDim * 0.25 &&
           o.semanticType !== 'NOISE' &&
           o.candidateSemanticType !== 'LEAF' &&
           o.candidateSemanticType !== 'STAR'
    );

    // 1a. Curved / Arc Text Grouping with Proximity Radial Clustering
    const radialClusters: LogoObjectAnalysis[][] = [];
    const sortedByRadius = [...textCandidates].sort((a, b) => {
      const rA = Math.hypot(a.centerOfMass.x - logoCenterX, a.centerOfMass.y - logoCenterY);
      const rB = Math.hypot(b.centerOfMass.x - logoCenterX, b.centerOfMass.y - logoCenterY);
      return rA - rB;
    });

    sortedByRadius.forEach(obj => {
      const r = Math.hypot(obj.centerOfMass.x - logoCenterX, obj.centerOfMass.y - logoCenterY);
      if (r < logoMaxDim * 0.10) return; // Skip central emblem area

      let placed = false;
      for (const cluster of radialClusters) {
        const clusterAvgR = cluster.reduce((sum, item) => {
          return sum + Math.hypot(item.centerOfMass.x - logoCenterX, item.centerOfMass.y - logoCenterY);
        }, 0) / cluster.length;

        if (Math.abs(r - clusterAvgR) <= 16.0) {
          cluster.push(obj);
          placed = true;
          break;
        }
      }
      if (!placed) {
        radialClusters.push([obj]);
      }
    });

    radialClusters.forEach(bucketObjs => {
      if (bucketObjs.length >= 2) {
        const evalRes = LogoAnalyzerKernel.evaluateTypographicGroup(bucketObjs, 'CURVED_ARC', logoCenterX, logoCenterY, logoMaxDim);
        const radii = bucketObjs.map(o => Math.hypot(o.centerOfMass.x - logoCenterX, o.centerOfMass.y - logoCenterY));
        const avgR = radii.reduce((a, b) => a + b, 0) / radii.length;

        if (evalRes.status === 'VALIDATED_TEXT') {
          const textGroupId = `TEXT_GROUP_ARC_${String(textGroupCounter++).padStart(2, '0')}`;
          const angles = bucketObjs
            .map(o => ({
              id: o.id,
              obj: o,
              angle: Math.atan2(o.centerOfMass.y - logoCenterY, o.centerOfMass.x - logoCenterX) * (180 / Math.PI)
            }))
            .sort((a, b) => a.angle - b.angle);

          const minAngle = Math.round(angles[0].angle);
          const maxAngle = Math.round(angles[angles.length - 1].angle);
          const isTopArc = angles.some(a => a.angle < 0);
          const groupContextType: GroupContextType = isTopArc ? 'CURVED_TEXT_TOP' : 'CURVED_TEXT_BOTTOM';
          const positionLabel = isTopArc ? 'Inscriptions Circulaires Supérieures' : 'Inscriptions Circulaires Inférieures';

          textGroups.push({
            id: textGroupId,
            name: `${positionLabel} (R = ${Math.round(avgR)}px, ${angles.length} lettres)`,
            memberIds: angles.map(a => a.id),
            arrangement: 'CURVED_ARC',
            estimatedRadius: Math.round(avgR),
            angleSpan: { start: minAngle, end: maxAngle },
            textEstimate: isTopArc ? 'INSCRIPTION_CIRCULAIRE_HAUTE' : 'INSCRIPTION_CIRCULAIRE_BASSE',
            status: 'VALIDATED_TEXT',
            groupConfidence: evalRes.groupConfidence,
            metrics: evalRes.metrics,
            reasoningText: evalRes.reasoningText
          });

          angles.forEach(({ id, angle }) => {
            claimedTextObjectIds.add(id);
            const idx = result.findIndex(r => r.id === id);
            if (idx !== -1) {
              const target = result[idx];

              target.semanticType = 'TEXT_CHARACTER';
              target.semanticConfidence = Math.round(clamp(evalRes.groupConfidence - 4, 65, 95));

              target.groupType = groupContextType;
              target.contextConfidence = evalRes.groupConfidence;
              target.groupConfidence = evalRes.groupConfidence;
              target.memberSemanticConfidence = target.semanticConfidence;
              target.parentStructure = 'TEXT_GROUP';

              target.confidence = Math.round(
                clamp(0.3 * target.geometryConfidence + 0.45 * target.semanticConfidence + 0.25 * evalRes.groupConfidence, 65, 96)
              );
              target.confidenceLevel = target.confidence >= 80 ? 'HIGH' : 'MEDIUM';

              target.category = 'TEXT';
              target.specificType = 'CURVED_TEXT';

              target.groupId = textGroupId;
              target.primitiveDetails.curvRadius = Math.round(avgR);
              target.primitiveDetails.arcStartAngle = minAngle;
              target.primitiveDetails.arcEndAngle = maxAngle;

              target.evidence.push(
                `Aligné sur un arc de texte validé (R = ${Math.round(avgR)}px, Confiance Groupe: ${evalRes.groupConfidence}%)`,
                `Metrics: Alignement ${(evalRes.metrics.alignmentScore*100).toFixed(0)}%, Tailles ${(evalRes.metrics.sizeConsistencyScore*100).toFixed(0)}%, Espacement ${(evalRes.metrics.spacingScore*100).toFixed(0)}%`
              );
              target.reasoning.criteria.push(`Appartenance validée au groupe de texte arc ${textGroupId}`);
              target.reasoning.conclusion = `TEXT_CHARACTER validé à ${target.semanticConfidence}% via cohérence typographique de groupe.`;
            }
          });
        } else if (evalRes.status === 'CANDIDATE_TEXT') {
          const textGroupId = `TEXT_GROUP_CANDIDATE_${String(textGroupCounter++).padStart(2, '0')}`;
          textGroups.push({
            id: textGroupId,
            name: `Groupe Candidat Arc (R = ${Math.round(avgR)}px, ${bucketObjs.length} membres)`,
            memberIds: bucketObjs.map(a => a.id),
            arrangement: 'CURVED_ARC',
            estimatedRadius: Math.round(avgR),
            status: 'CANDIDATE_TEXT',
            groupConfidence: evalRes.groupConfidence,
            metrics: evalRes.metrics,
            reasoningText: evalRes.reasoningText
          });

          bucketObjs.forEach(o => {
            const idx = result.findIndex(r => r.id === o.id);
            if (idx !== -1) {
              const target = result[idx];
              target.groupType = 'CANDIDATE_TEXT_GROUP';
              target.contextConfidence = evalRes.groupConfidence;
              target.groupConfidence = evalRes.groupConfidence;
              target.groupId = textGroupId;
              target.evidence.push(
                `Alignement arc détecté mais retenu comme CANDIDATE_TEXT_GROUP (Confiance: ${evalRes.groupConfidence}%)`
              );
              target.reasoning.counterCriteria.push('Preuves typographiques insuffisantes pour validation ferme en TEXT_CHARACTER');
            }
          });
        } else if (evalRes.metrics.ornamentPenalty > 0.2) {
          bucketObjs.forEach(o => {
            const idx = result.findIndex(r => r.id === o.id);
            if (idx !== -1) {
              const target = result[idx];
              target.groupType = 'BORDER_PATTERN';
              target.contextConfidence = 70;
              target.evidence.push('Motif ornemental géométrique répétitif rejeté du statut Texte');
            }
          });
        }
      }
    });

    // 1b. Linear Horizontal Text Grouping (Clustered dynamically by Y-position)
    const remainingTextCandidates = textCandidates.filter(
      o => !claimedTextObjectIds.has(o.id) && o.candidateSemanticType !== 'LEAF' && o.candidateSemanticType !== 'STAR'
    );

    const yClusters: LogoObjectAnalysis[][] = [];
    const sortedByY = [...remainingTextCandidates].sort((a, b) => a.centerOfMass.y - b.centerOfMass.y);

    sortedByY.forEach(obj => {
      let placed = false;
      for (const cluster of yClusters) {
        const clusterAvgY = cluster.reduce((sum, item) => sum + item.centerOfMass.y, 0) / cluster.length;
        const clusterAvgH = cluster.reduce((sum, item) => sum + item.dimensions.height, 0) / cluster.length;
        const maxTol = Math.max(14, clusterAvgH * 0.75);

        if (Math.abs(obj.centerOfMass.y - clusterAvgY) <= maxTol) {
          cluster.push(obj);
          placed = true;
          break;
        }
      }
      if (!placed) {
        yClusters.push([obj]);
      }
    });

    yClusters.forEach(clusterObjs => {
      if (clusterObjs.length >= 2) {
        const sorted = [...clusterObjs].sort((a, b) => a.centerOfMass.x - b.centerOfMass.x);

        // Subdivide cluster if horizontal gaps between adjacent elements are too large
        const subLines: LogoObjectAnalysis[][] = [];
        let currentSub: LogoObjectAnalysis[] = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const curr = sorted[i];
          const prevRight = prev.centerOfMass.x + prev.dimensions.width / 2;
          const currLeft = curr.centerOfMass.x - curr.dimensions.width / 2;
          const gap = currLeft - prevRight;

          const maxAllowedGap = Math.max(45, Math.min(prev.dimensions.width, curr.dimensions.width) * 3.8);

          if (gap <= maxAllowedGap) {
            currentSub.push(curr);
          } else {
            subLines.push(currentSub);
            currentSub = [curr];
          }
        }
        subLines.push(currentSub);

        subLines.forEach(lineObjs => {
          if (lineObjs.length >= 2) {
            const evalRes = LogoAnalyzerKernel.evaluateTypographicGroup(lineObjs, 'HORIZONTAL', logoCenterX, logoCenterY, logoMaxDim);
            const avgY = lineObjs.reduce((sum, o) => sum + o.centerOfMass.y, 0) / lineObjs.length;

            if (evalRes.status === 'VALIDATED_TEXT') {
              const textGroupId = `TEXT_GROUP_LINE_${String(textGroupCounter++).padStart(2, '0')}`;

              textGroups.push({
                id: textGroupId,
                name: `Ligne Horizontale Y=${Math.round(avgY)}px (${lineObjs.length} caractères)`,
                memberIds: lineObjs.map(s => s.id),
                arrangement: 'HORIZONTAL',
                textEstimate: lineObjs.length <= 4 ? 'DATE_OU_CODE' : 'LIGNE_DE_TEXTE',
                status: 'VALIDATED_TEXT',
                groupConfidence: evalRes.groupConfidence,
                metrics: evalRes.metrics,
                reasoningText: evalRes.reasoningText
              });

              lineObjs.forEach(sObj => {
                claimedTextObjectIds.add(sObj.id);
                const idx = result.findIndex(r => r.id === sObj.id);
                if (idx !== -1) {
                  const target = result[idx];

                  target.semanticType = 'TEXT_CHARACTER';
                  target.semanticConfidence = Math.round(clamp(evalRes.groupConfidence - 4, 65, 95));

                  target.groupType = 'LINEAR_TEXT';
                  target.contextConfidence = evalRes.groupConfidence;
                  target.groupConfidence = evalRes.groupConfidence;
                  target.memberSemanticConfidence = target.semanticConfidence;
                  target.parentStructure = 'TEXT_GROUP';

                  target.confidence = Math.round(
                    clamp(0.3 * target.geometryConfidence + 0.45 * target.semanticConfidence + 0.25 * evalRes.groupConfidence, 65, 95)
                  );
                  target.confidenceLevel = target.confidence >= 80 ? 'HIGH' : 'MEDIUM';

                  target.category = 'TEXT';
                  target.specificType = 'LINEAR_TEXT';
                  target.groupId = textGroupId;

                  target.evidence.push(
                    `Alignement horizontal validé sur la ligne Y = ${Math.round(avgY)}px (Confiance Groupe: ${evalRes.groupConfidence}%)`,
                    `Metrics: Alignement ${(evalRes.metrics.alignmentScore*100).toFixed(0)}%, Tailles ${(evalRes.metrics.sizeConsistencyScore*100).toFixed(0)}%, Espacement ${(evalRes.metrics.spacingScore*100).toFixed(0)}%`
                  );
                  target.reasoning.criteria.push(`Appartenance validée à la ligne de texte ${textGroupId}`);
                  target.reasoning.conclusion = `TEXT_CHARACTER validé à ${target.semanticConfidence}% via alignement horizontal et régularité typographique.`;
                }
              });
            } else if (evalRes.status === 'CANDIDATE_TEXT') {
              const textGroupId = `TEXT_GROUP_CANDIDATE_${String(textGroupCounter++).padStart(2, '0')}`;
              textGroups.push({
                id: textGroupId,
                name: `Groupe Candidat Ligne (Y=${Math.round(avgY)}px, ${lineObjs.length} membres)`,
                memberIds: lineObjs.map(s => s.id),
                arrangement: 'HORIZONTAL',
                status: 'CANDIDATE_TEXT',
                groupConfidence: evalRes.groupConfidence,
                metrics: evalRes.metrics,
                reasoningText: evalRes.reasoningText
              });

              lineObjs.forEach(sObj => {
                const idx = result.findIndex(r => r.id === sObj.id);
                if (idx !== -1) {
                  const target = result[idx];
                  target.groupType = 'CANDIDATE_TEXT_GROUP';
                  target.contextConfidence = evalRes.groupConfidence;
                  target.groupConfidence = evalRes.groupConfidence;
                  target.groupId = textGroupId;
                  target.evidence.push(
                    `Alignement horizontal détecté mais retenu comme CANDIDATE_TEXT_GROUP (Confiance: ${evalRes.groupConfidence}%)`
                  );
                  target.reasoning.counterCriteria.push('Preuves typographiques insuffisantes pour validation ferme en TEXT_CHARACTER');
                }
              });
            }
          }
        });
      }
    });

    // -------------------------------------------------------------
    // 2. ORNAMENTS & LAURELS GROUPING (Left & Right Branches)
    // -------------------------------------------------------------
    const ornamentCandidates = result.filter(
      o => (o.semanticType === 'LEAF' || o.candidateSemanticType === 'LEAF' || o.geometryType === 'ELONGATED_SHAPE' || o.aspectRatio >= 1.5) &&
           o.groupType === 'NONE' &&
           !claimedTextObjectIds.has(o.id) &&
           o.dimensions.width < logoMaxDim * 0.25 &&
           o.dimensions.height < logoMaxDim * 0.25
    );

    const leftLaurels = ornamentCandidates.filter(o => o.centerOfMass.x < logoCenterX - logoMaxDim * 0.05);
    const rightLaurels = ornamentCandidates.filter(o => o.centerOfMass.x > logoCenterX + logoMaxDim * 0.05);

    const processLaurelBranch = (branchObjs: LogoObjectAnalysis[], groupType: GroupContextType, groupId: string, label: string) => {
      if (branchObjs.length >= 3) {
        const branchContextConf = Math.round(clamp(72 + branchObjs.length * 4, 68, 95));

        branchObjs.forEach(o => {
          const idx = result.findIndex(r => r.id === o.id);
          if (idx !== -1) {
            const target = result[idx];

            target.semanticType = 'LEAF';
            target.semanticConfidence = Math.round(clamp(branchContextConf + 5, 70, 95));

            target.groupType = groupType;
            target.contextConfidence = branchContextConf;
            target.groupConfidence = branchContextConf;
            target.memberSemanticConfidence = target.semanticConfidence;
            target.parentStructure = 'ORNAMENT';

            target.confidence = Math.round(
              clamp(0.3 * target.geometryConfidence + 0.45 * target.semanticConfidence + 0.25 * branchContextConf, 65, 96)
            );
            target.confidenceLevel = target.confidence >= 80 ? 'HIGH' : 'MEDIUM';

            target.category = 'ORNAMENT';
            target.specificType = 'LAUREL_LEAF';
            target.groupId = groupId;

            target.evidence.push(
              `Forme intégrée dans le ${label} (${branchObjs.length} feuilles)`,
              'Disposition en chaîne de laurier symétrique'
            );
            target.reasoning.criteria.push(`Appartenance au groupe d'ornements ${groupId}`);
            target.reasoning.conclusion = `LEAF / LAUREL_LEAF validé à ${target.semanticConfidence}% dans la couronne ${label}.`;
          }
        });
      }
    };

    processLaurelBranch(leftLaurels, 'LAUREL_LEFT', 'LAUREL_GROUP_LEFT', 'Rameau de Laurier Gauche');
    processLaurelBranch(rightLaurels, 'LAUREL_RIGHT', 'LAUREL_GROUP_RIGHT', 'Rameau de Laurier Droit');

    // -------------------------------------------------------------
    // 3. SYMBOLES COMPOSÉS & EMBLEMS DETECTION
    // -------------------------------------------------------------

    // 3a. BOOK DETECTION (Two symmetric surfaces/pages around central vertical axis)
    const centralObjs = result.filter(
      o => o.groupType === 'NONE' &&
           !claimedTextObjectIds.has(o.id) &&
           o.category !== 'NOISE' &&
           Math.hypot(o.centerOfMass.x - logoCenterX, o.centerOfMass.y - logoCenterY) < logoMaxDim * 0.38
    );

    for (let i = 0; i < centralObjs.length; i++) {
      for (let j = i + 1; j < centralObjs.length; j++) {
        const o1 = centralObjs[i];
        const o2 = centralObjs[j];

        const isLeftRight = (o1.centerOfMass.x < logoCenterX && o2.centerOfMass.x > logoCenterX) ||
                            (o2.centerOfMass.x < logoCenterX && o1.centerOfMass.x > logoCenterX);

        const yDiff = Math.abs(o1.centerOfMass.y - o2.centerOfMass.y);
        const areaRatio = Math.max(o1.area, 1) / Math.max(o2.area, 1);
        const areaMatch = areaRatio >= 0.65 && areaRatio <= 1.55;

        if (isLeftRight && yDiff < 22 && areaMatch) {
          [o1.id, o2.id].forEach(id => {
            const idx = result.findIndex(r => r.id === id);
            if (idx !== -1) {
              const target = result[idx];
              target.semanticType = 'BOOK';
              target.memberSemanticConfidence = 76; // Individual member semantic score
              target.groupConfidence = 90; // Group context score
              target.semanticConfidence = 76;
              target.groupType = 'CENTRAL_EMBLEM';
              target.contextConfidence = 90;
              target.parentStructure = 'SYMBOL';
              target.category = 'SYMBOL';
              target.specificType = 'BOOK';
              target.groupId = 'grp_book_open';
              target.confidence = Math.round(clamp(0.30 * target.geometryConfidence + 0.45 * 76 + 0.25 * 90, 70, 95));
              target.confidenceLevel = 'HIGH';
              target.evidence.push(
                'Deux surfaces symétriques de part et d\'autre de l\'axe vertical central (Livre Ouvert)',
                'Symétrie axiale et dimensions équivalentes'
              );
              target.reasoning.conclusion = 'BOOK validé : composant de livre ouvert au centre (Confiance Membre 76%, Groupe 90%).';
            }
          });
        }
      }
    }

    // 3b. OTHER COMPOSITE SYMBOLS IN CENTRAL AREA
    result.forEach((obj, idx) => {
      if (obj.groupType === 'NONE' && !claimedTextObjectIds.has(obj.id) && obj.category !== 'NOISE') {
        const distFromCenter = Math.hypot(obj.centerOfMass.x - logoCenterX, obj.centerOfMass.y - logoCenterY);

        if (distFromCenter < logoMaxDim * 0.30) {
          if (obj.geometryType !== 'CIRCLE' && obj.geometryType !== 'RING' && obj.geometryType !== 'CLOSED_SURFACE') {
            const emblemConf = Math.round(clamp(88 - (distFromCenter / logoMaxDim) * 80, 55, 92));

            result[idx].groupType = 'CENTRAL_EMBLEM';
            result[idx].contextConfidence = emblemConf;
            result[idx].groupConfidence = emblemConf;
            result[idx].parentStructure = 'SYMBOL';

            if (result[idx].semanticType === 'UNKNOWN') {
              result[idx].semanticType = 'EMBLEM';
              result[idx].semanticConfidence = Math.round(clamp(emblemConf - 5, 55, 85));
            }
            result[idx].memberSemanticConfidence = result[idx].semanticConfidence;

            result[idx].confidence = Math.round(
              clamp(0.3 * result[idx].geometryConfidence + 0.45 * result[idx].semanticConfidence + 0.25 * emblemConf, 55, 92)
            );
            result[idx].confidenceLevel = result[idx].confidence >= 80 ? 'HIGH' : result[idx].confidence >= 60 ? 'MEDIUM' : 'LOW';

            result[idx].category = 'SYMBOL';
            result[idx].specificType = result[idx].semanticType === 'STAR' ? 'STAR' : result[idx].semanticType === 'BOOK' ? 'BOOK' : 'COMPOSITE_SYMBOL';
            result[idx].groupId = 'grp_central_emblem';

            result[idx].evidence.push(`Composant situé au cœur de l'écusson central (d = ${Math.round(distFromCenter)}px du centre)`);
          }
        }
      }
    });

    return { updatedAnalyses: result, textGroups };
  }

  /**
   * Final Conflict Resolution Phase:
   * GEOMETRY -> SEMANTIC CANDIDATES -> CONTEXT -> CONFLICT RESOLUTION -> FINAL CLASSIFICATION
   */
  private static resolveConflicts(
    objects: LogoObjectAnalysis[],
    textGroups: LogoTextGroup[],
    logoCenterX: number,
    logoCenterY: number,
    logoMaxDim: number
  ): { resolvedObjects: LogoObjectAnalysis[]; resolvedTextGroups: LogoTextGroup[] } {
    const result = [...objects];
    const resolvedGroups = [...textGroups];

    result.forEach(obj => {
      // 1. LEAF vs TEXT_CHARACTER CONFLICT RESOLUTION
      const candidateIsLeaf = obj.candidateSemanticType === 'LEAF' || 
        (obj.aspectRatio >= 1.4 && obj.aspectRatio <= 5.0 && obj.compactness >= 0.18 && obj.compactness <= 0.82 && obj.verticesCount <= 8 && obj.holesCount === 0);

      if (candidateIsLeaf && obj.semanticType === 'TEXT_CHARACTER') {
        // CONFLICT RESOLVED: LEAF -> TEXT_CHARACTER overridden back to LEAF
        obj.semanticType = 'LEAF';
        obj.semanticConfidence = 80;
        obj.memberSemanticConfidence = 80;
        obj.category = 'ORNAMENT';
        obj.specificType = 'LAUREL_LEAF';
        obj.conflictResolved = true;
        obj.conflictDetails = 'Conflit LEAF/TEXT résolu en faveur de LEAF : profil fusiforme incompatible avec un caractère textuel.';

        if (obj.groupType === 'CURVED_TEXT_TOP' || obj.groupType === 'CURVED_TEXT_BOTTOM' || obj.groupType === 'LINEAR_TEXT') {
          obj.groupType = 'NONE';
          obj.contextConfidence = 0;
          obj.groupConfidence = 0;
          obj.parentStructure = 'ORNAMENT';
        }

        // Remove from text group memberIds
        if (obj.groupId) {
          const tGroup = resolvedGroups.find(g => g.id === obj.groupId);
          if (tGroup) {
            tGroup.memberIds = tGroup.memberIds.filter(mId => mId !== obj.id);
          }
          obj.groupId = 'grp_default';
        }

        obj.confidence = Math.round(
          clamp(0.40 * obj.geometryConfidence + 0.40 * obj.semanticConfidence + 0.20 * obj.contextConfidence, 60, 95)
        );
        obj.confidenceLevel = obj.confidence >= 80 ? 'HIGH' : 'MEDIUM';

        obj.evidence.push('Conflit LEAF/TEXT résolu : profil fusiforme (LEAF) conservé, retiré du groupe de texte.');
        obj.reasoning.criteria.push('Arbitrage de Conflit : Preuve sémantique géométrique LEAF prioritaire sur l\'alignement textuel.');
        obj.reasoning.conclusion = 'LEAF / LAUREL_LEAF validé : conflit avec alignement textuel résolu en faveur de la feuille.';
      }

      // 2. SIGNIFICANT OBJECT vs NOISE CONFLICT RESOLUTION
      const hasMeaningfulSize = obj.pointsCount >= 5 || obj.area >= logoMaxDim * logoMaxDim * 0.0003;
      const isCandidateCredible = obj.candidateSemanticType && obj.candidateSemanticType !== 'NOISE' && obj.candidateSemanticType !== 'UNKNOWN';

      if ((obj.category === 'NOISE' || obj.semanticType === 'NOISE') && (hasMeaningfulSize || isCandidateCredible || obj.geometryType !== 'IRREGULAR_SHAPE')) {
        // CONFLICT RESOLVED: SIGNIFICANT OBJECT -> NOISE overridden back to valid category
        if (isCandidateCredible) {
          obj.semanticType = obj.candidateSemanticType!;
          obj.semanticConfidence = obj.candidateSemanticConfidence || 75;
        } else {
          obj.semanticType = 'UNKNOWN';
          obj.semanticConfidence = 45;
        }
        obj.memberSemanticConfidence = obj.semanticConfidence;

        obj.category = this.mapToLegacyCategory(obj.geometryType, obj.semanticType, obj.groupType, obj.parentStructure || 'NONE');
        obj.specificType = this.mapToLegacySpecific(obj.geometryType, obj.semanticType, obj.groupType, false);
        obj.conflictResolved = true;
        obj.conflictDetails = 'Conflit NOISE résolu : objet significatif conservé au lieu d\'artefact Bruit.';

        obj.confidence = Math.round(
          clamp(0.40 * obj.geometryConfidence + 0.40 * obj.semanticConfidence + 0.20 * obj.contextConfidence, 45, 90)
        );
        obj.confidenceLevel = obj.confidence >= 80 ? 'HIGH' : obj.confidence >= 60 ? 'MEDIUM' : 'LOW';

        obj.evidence.push(`Conflit NOISE résolu : objet conservé en [${obj.category}] au lieu de Bruit.`);
        obj.reasoning.criteria.push('Arbitrage de Conflit : Présence d\'une forme/géométrie réelle infirmant le diagnostic Bruit.');
        obj.reasoning.conclusion = `Objet significatif conservé (${obj.category}) : conflit avec le seuil Bruit résolu.`;
      }

      // 3. SEPARATION OF GROUP CONFIDENCE AND MEMBER SEMANTIC CONFIDENCE (Requirement 6)
      if (obj.semanticType === 'BOOK' || obj.groupId === 'grp_book_open') {
        obj.groupConfidence = 90;
        obj.contextConfidence = 90;
        obj.memberSemanticConfidence = 76;
        obj.semanticConfidence = 76;
        obj.confidence = Math.round(clamp(0.30 * obj.geometryConfidence + 0.45 * 76 + 0.25 * 90, 70, 95));
      }
    });

    // Remove text groups that have fewer than 2 valid character members after conflict resolution
    const finalGroups = resolvedGroups.filter(g => g.memberIds.length >= 2);

    return { resolvedObjects: result, resolvedTextGroups: finalGroups };
  }

  private static mapToLegacyCategory(
    geomType: GeometryObjectType,
    semType: SemanticObjectType,
    groupType: GroupContextType,
    parentStructure: string
  ): LogoObjectType {
    if (parentStructure === 'ORNAMENT' || groupType === 'LAUREL_LEFT' || groupType === 'LAUREL_RIGHT' || semType === 'LEAF') return 'ORNAMENT';
    if (semType === 'TEXT_CHARACTER' || groupType.startsWith('CURVED_TEXT') || groupType === 'LINEAR_TEXT') return 'TEXT';
    if (parentStructure === 'SYMBOL' || groupType === 'CENTRAL_EMBLEM' || semType === 'BOOK' || semType === 'FLAME' || semType === 'EMBLEM' || semType === 'STAR') return 'SYMBOL';
    if (semType === 'NOISE') return 'NOISE';
    if (geomType === 'CLOSED_SURFACE') return 'SURFACE';
    if (geomType === 'CIRCLE' || geomType === 'RING' || geomType === 'ELLIPSE' || geomType === 'RADIAL_SHAPE' || geomType === 'POLYGON' || geomType === 'BAND' || geomType === 'OPEN_LINE') return 'GEOMETRY';
    return 'UNKNOWN';
  }

  private static mapToLegacySpecific(
    geomType: GeometryObjectType,
    semType: SemanticObjectType,
    groupType: GroupContextType,
    isStar: boolean
  ): LogoSpecificType {
    if (semType === 'STAR' && isStar) return 'STAR';
    if (semType === 'LEAF') return 'LAUREL_LEAF';
    if (semType === 'TEXT_CHARACTER') return groupType.startsWith('CURVED_TEXT') ? 'CURVED_TEXT' : 'TEXT_FRAGMENT';
    if (semType === 'BOOK') return 'BOOK';
    if (semType === 'FLAME') return 'FLAME';
    if (geomType === 'CIRCLE') return 'CIRCLE';
    if (geomType === 'RING') return 'RING';
    if (geomType === 'ELLIPSE') return 'ELLIPSE';
    if (geomType === 'CLOSED_SURFACE') return 'SOLID_SURFACE';
    if (groupType === 'CENTRAL_EMBLEM') return 'COMPOSITE_SYMBOL';
    if (geomType === 'BAND' || geomType === 'OPEN_LINE') return 'BORDER_ELEMENT';
    if (geomType === 'IRREGULAR_SHAPE') return 'IRREGULAR_GEOMETRY';
    return 'UNKNOWN';
  }

  /**
   * Constructs the hierarchical tree of logo components according to Requirement 8
   */
  private static buildStructureTree(
    objects: LogoObjectAnalysis[],
    logoCenterX: number,
    logoCenterY: number
  ): LogoStructureTree[] {
    const rootChildren: LogoStructureTree[] = [];

    // 1. Géométries (Cadres, Cercles, Anneaux, Closed Surfaces)
    const frameObjs = objects.filter(o => o.category === 'GEOMETRY' || o.category === 'SURFACE');
    if (frameObjs.length > 0) {
      rootChildren.push({
        id: 'node_frame',
        name: `Géométries & Cadres (${frameObjs.length})`,
        category: 'GEOMETRY',
        children: frameObjs.map(o => ({
          id: `tree_${o.id}`,
          name: `${o.id} - ${o.layerName} [${o.geometryType}]`,
          category: o.category,
          children: [],
          analysis: o
        }))
      });
    }

    // 2. Textes & Groupes Textuels
    const textObjs = objects.filter(o => o.category === 'TEXT');
    if (textObjs.length > 0) {
      const textGroupsMap: Map<string, LogoObjectAnalysis[]> = new Map();
      const standaloneText: LogoObjectAnalysis[] = [];

      textObjs.forEach(o => {
        if (o.groupId && o.groupId !== 'grp_default') {
          if (!textGroupsMap.has(o.groupId)) textGroupsMap.set(o.groupId, []);
          textGroupsMap.get(o.groupId)!.push(o);
        } else {
          standaloneText.push(o);
        }
      });

      const textGroupNodes: LogoStructureTree[] = [];

      textGroupsMap.forEach((members, grpId) => {
        const sample = members[0];
        const groupLabel = sample.groupType === 'CURVED_TEXT_TOP' || sample.groupType === 'CURVED_TEXT_BOTTOM'
          ? `Groupe Texte Circulaire (${members.length} caractères)`
          : `Groupe Texte Ligne (${members.length} caractères)`;

        textGroupNodes.push({
          id: `grp_node_${grpId}`,
          name: `${groupLabel} - ${grpId}`,
          category: 'TEXT',
          children: members.map(o => ({
            id: `tree_${o.id}`,
            name: `${o.id} - ${o.layerName} [${o.semanticType}]`,
            category: o.category,
            children: [],
            analysis: o
          }))
        });
      });

      standaloneText.forEach(o => {
        textGroupNodes.push({
          id: `tree_${o.id}`,
          name: `${o.id} - ${o.layerName} [Caractère Isolé]`,
          category: o.category,
          children: [],
          analysis: o
        });
      });

      rootChildren.push({
        id: 'node_text',
        name: `Textes & Inscriptions (${textObjs.length})`,
        category: 'TEXT',
        children: textGroupNodes
      });
    }

    // 3. Symboles & Écussons
    const symbolObjs = objects.filter(o => o.category === 'SYMBOL');
    if (symbolObjs.length > 0) {
      const symbolGroupsMap: Map<string, LogoObjectAnalysis[]> = new Map();
      const standaloneSymbols: LogoObjectAnalysis[] = [];

      symbolObjs.forEach(o => {
        if (o.groupId && o.groupId !== 'grp_default') {
          if (!symbolGroupsMap.has(o.groupId)) symbolGroupsMap.set(o.groupId, []);
          symbolGroupsMap.get(o.groupId)!.push(o);
        } else {
          standaloneSymbols.push(o);
        }
      });

      const symbolGroupNodes: LogoStructureTree[] = [];

      symbolGroupsMap.forEach((members, grpId) => {
        const sample = members[0];
        const label = sample.semanticType === 'BOOK'
          ? `Symbole Composé : Livre Ouvert (${members.length} composants)`
          : `Symbole Composé Central (${members.length} composants)`;

        symbolGroupNodes.push({
          id: `grp_node_${grpId}`,
          name: `${label} - ${grpId}`,
          category: 'SYMBOL',
          children: members.map(o => ({
            id: `tree_${o.id}`,
            name: `${o.id} - ${o.layerName} [${o.semanticType}]`,
            category: o.category,
            children: [],
            analysis: o
          }))
        });
      });

      standaloneSymbols.forEach(o => {
        symbolGroupNodes.push({
          id: `tree_${o.id}`,
          name: `${o.id} - ${o.layerName} [${o.semanticType}]`,
          category: o.category,
          children: [],
          analysis: o
        });
      });

      rootChildren.push({
        id: 'node_symbols',
        name: `Symboles & Écussons (${symbolObjs.length})`,
        category: 'SYMBOL',
        children: symbolGroupNodes
      });
    }

    // 4. Ornements & Lauriers
    const ornamentObjs = objects.filter(o => o.category === 'ORNAMENT');
    if (ornamentObjs.length > 0) {
      const ornamentGroupsMap: Map<string, LogoObjectAnalysis[]> = new Map();
      const standaloneOrnaments: LogoObjectAnalysis[] = [];

      ornamentObjs.forEach(o => {
        if (o.groupId && o.groupId !== 'grp_default') {
          if (!ornamentGroupsMap.has(o.groupId)) ornamentGroupsMap.set(o.groupId, []);
          ornamentGroupsMap.get(o.groupId)!.push(o);
        } else {
          standaloneOrnaments.push(o);
        }
      });

      const ornamentGroupNodes: LogoStructureTree[] = [];

      ornamentGroupsMap.forEach((members, grpId) => {
        const sample = members[0];
        const label = sample.groupType === 'LAUREL_LEFT'
          ? `Rameau de Laurier Gauche (${members.length} feuilles)`
          : sample.groupType === 'LAUREL_RIGHT'
          ? `Rameau de Laurier Droit (${members.length} feuilles)`
          : `Couronne Ornementale (${members.length} éléments)`;

        ornamentGroupNodes.push({
          id: `grp_node_${grpId}`,
          name: `${label}`,
          category: 'ORNAMENT',
          children: members.map(o => ({
            id: `tree_${o.id}`,
            name: `${o.id} - ${o.layerName} [${o.semanticType}]`,
            category: o.category,
            children: [],
            analysis: o
          }))
        });
      });

      standaloneOrnaments.forEach(o => {
        ornamentGroupNodes.push({
          id: `tree_${o.id}`,
          name: `${o.id} - ${o.layerName} [${o.semanticType}]`,
          category: o.category,
          children: [],
          analysis: o
        });
      });

      rootChildren.push({
        id: 'node_ornaments',
        name: `Ornements & Lauriers (${ornamentObjs.length})`,
        category: 'ORNAMENT',
        children: ornamentGroupNodes
      });
    }

    // 5. Unknown (Formes réelles mais non identifiées)
    const unknownObjs = objects.filter(o => o.category === 'UNKNOWN');
    if (unknownObjs.length > 0) {
      rootChildren.push({
        id: 'node_unknown',
        name: `Éléments Indéterminés (Unknown) (${unknownObjs.length})`,
        category: 'UNKNOWN',
        children: unknownObjs.map(o => ({
          id: `tree_${o.id}`,
          name: `${o.id} - ${o.layerName} [Forme Réelle non identifiée]`,
          category: o.category,
          children: [],
          analysis: o
        }))
      });
    }

    // 6. Bruit & Artefacts
    const noiseObjs = objects.filter(o => o.category === 'NOISE');
    if (noiseObjs.length > 0) {
      rootChildren.push({
        id: 'node_noise',
        name: `Bruit & Artefacts Confirmés (${noiseObjs.length})`,
        category: 'NOISE',
        children: noiseObjs.map(o => ({
          id: `tree_${o.id}`,
          name: `${o.id} - ${o.layerName} [Artefact Bruit]`,
          category: o.category,
          children: [],
          analysis: o
        }))
      });
    }

    return [
      {
        id: 'node_root_logo',
        name: 'Structure Globale du Logo',
        category: 'GEOMETRY',
        children: rootChildren
      }
    ];
  }

  private static createEmptyReport(): LogoDiagnosticReport {
    return {
      timestamp: new Date().toISOString(),
      totalObjects: 0,
      centerOfLogo: { x: 0, y: 0 },
      logoBoundingBox: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      categoryCounts: {
        TEXT: 0,
        GEOMETRY: 0,
        SYMBOL: 0,
        ORNAMENT: 0,
        SURFACE: 0,
        NOISE: 0,
        UNKNOWN: 0
      },
      objects: [],
      lowConfidenceObjects: [],
      structureTree: [],
      textGroups: [],
      primitivesSummary: {
        circlesCount: 0,
        ringsCount: 0,
        curvedTextArcsCount: 0,
        starsHighConfidenceCount: 0,
        starsLowConfidenceCount: 0,
        laurelsOrnamentsCount: 0,
        symbolsCount: 0,
        noiseCandidatesCount: 0
      },
      symmetries: {
        radialSymmetriesCount: 0,
        axialSymmetriesCount: 0,
        primaryCenter: { x: 0, y: 0 }
      }
    };
  }
}
