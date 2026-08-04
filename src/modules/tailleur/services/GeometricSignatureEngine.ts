import { EmbroideryPoint, EmbroideryLayer } from './embroideryServices';
import { GeometryValidator, isPointInPolygons } from './embroideryServices';

export interface GeometricSignature {
  id: string;
  hash: string;
  timestamp: number;

  // Normalized Feature Vector (16 invariant scalar features for instant matching)
  featureVector: number[]; // [area_norm, perim_norm, aspect_ratio, circularity, solidity, avg_thickness, thickness_var, avg_curvature, max_curvature, curvature_entropy, symmetry, complexity, continuity, holes_count, corners_count, orientation_norm]

  // Spatial Metrics
  perimeter: number;
  area: number;
  width: number;
  height: number;
  aspectRatio: number;
  centroid: { x: number; y: number };
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  orientationAngle: number; // degrees [0, 180]

  // Form Traits
  circularity: number; // 4 * PI * Area / Perimeter^2 [0..1]
  solidity: number; // Area / BoundingBox Area [0..1]
  thicknessProfile: { min: number; max: number; avg: number; stdDev: number };

  // Curvature & Topology
  avgCurvature: number;
  maxCurvature: number;
  curvatureEntropy: number;
  arcRadii: number[];
  symmetryIndex: number; // [0..1]
  counterFormsCount: number; // Number of subpaths/holes
  extremitiesCount: number; // Tips / corners
  junctionsCount: number;
  contourContinuity: number; // [0..1] G1 continuity measure
  complexityIndex: number; // Edge density / perimeter to area ratio

  // Key Salient Landmarks
  keyFeaturePoints: { x: number; y: number; type: 'corner' | 'inflection' | 'tip' }[];

  // Classification & Match Confidence
  classifiedType: 'leaf' | 'petal' | 'stem' | 'spiral' | 'ornament' | 'letter' | 'circle' | 'unknown';
  confidenceScore: number;
}

export interface SignatureMatchResult {
  similarity: number; // Cosine similarity [0..1]
  matchPercentage: number; // Percentage [0..100%]
  deltaMetrics: {
    areaDelta: number;
    perimeterDelta: number;
    thicknessDelta: number;
    aspectRatioDelta: number;
    curvatureDelta: number;
  };
}

export class GeometricSignatureEngine {
  private static signatureCache = new Map<string, GeometricSignature>();

  /**
   * Computes or retrieves a cached Geometric Signature for a given contour / layer.
   * Ensures single computation and global reuse across the entire pipeline.
   */
  static getOrComputeSignature(layer: EmbroideryLayer): GeometricSignature {
    const layerHash = this.computeGeometryHash(layer.points, layer.subpaths);

    // Reuse existing signature if hash matches and signature is cached
    if (layer.geometricSignature && layer.geometricSignature.hash === layerHash) {
      return layer.geometricSignature;
    }

    if (this.signatureCache.has(layerHash)) {
      const cached = this.signatureCache.get(layerHash)!;
      layer.geometricSignature = cached;
      return cached;
    }

    // Compute fresh signature
    const signature = this.computeSignature(layer.id, layer.points, layer.subpaths);
    this.signatureCache.set(layerHash, signature);
    layer.geometricSignature = signature;

    return signature;
  }

  /**
   * Computes the geometric signature of a sequence of points and subpaths.
   * Pure mathematical, read-only calculation ($O(N)$ complexity).
   */
  static computeSignature(
    id: string,
    points: EmbroideryPoint[],
    subpaths?: EmbroideryPoint[][]
  ): GeometricSignature {
    if (!points || points.length === 0) {
      return this.createEmptySignature(id);
    }

    const hash = this.computeGeometryHash(points, subpaths);
    const n = points.length;

    // 1. Bounding Box & Centroid
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    for (let i = 0; i < n; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    }

    const width = Math.max(0.001, maxX - minX);
    const height = Math.max(0.001, maxY - minY);
    const aspectRatio = width / height;
    const centroid = { x: sumX / n, y: sumY / n };

    // 2. Perimeter & Area (Shoelace Formula)
    const perimeter = this.calculatePerimeter(points);
    const area = this.calculateArea(points);
    const bboxArea = width * height;

    const circularity = perimeter > 0 ? Math.min(1.0, (4 * Math.PI * area) / (perimeter * perimeter)) : 0;
    const solidity = bboxArea > 0 ? Math.min(1.0, area / bboxArea) : 0;

    // 3. Principal Orientation & Inertia Tensor
    const { angle: orientationAngle, inertiaRatio } = this.calculatePrincipalAxis(points, centroid);

    // 4. Thickness Profile (Local width estimation)
    const thicknessProfile = this.calculateThicknessProfile(points, subpaths);

    // 5. Curvature & Key Feature Points Detection
    const { avgCurvature, maxCurvature, curvatureEntropy, keyPoints, arcRadii, continuity } =
      this.analyzeCurvatureAndLandmarks(points);

    // 6. Structural Features (Subpaths / Counter-forms & Symmetry)
    const counterFormsCount = subpaths ? subpaths.length : 0;
    const symmetryIndex = this.calculateSymmetryIndex(points, centroid, orientationAngle);
    const complexityIndex = area > 0 ? Math.min(10.0, (perimeter * perimeter) / area) : 0;

    // 7. Classification Heuristic
    const { classifiedType, confidenceScore } = this.classifyShape({
      aspectRatio,
      circularity,
      solidity,
      thicknessProfile,
      avgCurvature,
      counterFormsCount,
      inertiaRatio,
      keyPointsCount: keyPoints.length
    });

    // 8. Construct Normalized Feature Vector (16 Invariant Descriptors)
    const featureVector = [
      Math.min(1.0, Math.log10(area + 1) / 5.0),            // 0: Log Area
      Math.min(1.0, Math.log10(perimeter + 1) / 4.0),       // 1: Log Perimeter
      Math.min(1.0, aspectRatio / 10.0),                   // 2: Aspect Ratio
      circularity,                                          // 3: Circularity
      solidity,                                             // 4: Solidity
      Math.min(1.0, thicknessProfile.avg / 50.0),            // 5: Avg Thickness
      Math.min(1.0, thicknessProfile.stdDev / 20.0),        // 6: Thickness Variance
      Math.min(1.0, avgCurvature * 10.0),                   // 7: Avg Curvature
      Math.min(1.0, maxCurvature),                          // 8: Max Curvature
      Math.min(1.0, curvatureEntropy / 3.0),                // 9: Curvature Entropy
      symmetryIndex,                                        // 10: Symmetry Index
      Math.min(1.0, complexityIndex / 50.0),                // 11: Complexity Index
      continuity,                                           // 12: Contour Continuity
      Math.min(1.0, counterFormsCount / 5.0),               // 13: Holes Count
      Math.min(1.0, keyPoints.length / 20.0),               // 14: Salient Points
      orientationAngle / 180.0                              // 15: Orientation
    ];

    return {
      id,
      hash,
      timestamp: Date.now(),
      featureVector,
      perimeter,
      area,
      width,
      height,
      aspectRatio,
      centroid,
      boundingBox: { minX, minY, maxX, maxY },
      orientationAngle,
      circularity,
      solidity,
      thicknessProfile,
      avgCurvature,
      maxCurvature,
      curvatureEntropy,
      arcRadii,
      symmetryIndex,
      counterFormsCount,
      extremitiesCount: keyPoints.filter(k => k.type === 'tip' || k.type === 'corner').length,
      junctionsCount: counterFormsCount > 0 ? counterFormsCount + 1 : 1,
      contourContinuity: continuity,
      complexityIndex,
      keyFeaturePoints: keyPoints,
      classifiedType,
      confidenceScore
    };
  }

  /**
   * Compares two geometric signatures using Cosine Similarity on feature vectors.
   * Returns a match percentage and detailed metric deltas.
   */
  static compareSignatures(sig1: GeometricSignature, sig2: GeometricSignature): SignatureMatchResult {
    const vec1 = sig1.featureVector;
    const vec2 = sig2.featureVector;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const similarity = (norm1 > 0 && norm2 > 0) ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
    const matchPercentage = Math.round(Math.max(0, Math.min(100, similarity * 100)) * 100) / 100;

    return {
      similarity,
      matchPercentage,
      deltaMetrics: {
        areaDelta: sig1.area > 0 ? Math.abs(sig1.area - sig2.area) / sig1.area : 0,
        perimeterDelta: sig1.perimeter > 0 ? Math.abs(sig1.perimeter - sig2.perimeter) / sig1.perimeter : 0,
        thicknessDelta: sig1.thicknessProfile.avg > 0 ? Math.abs(sig1.thicknessProfile.avg - sig2.thicknessProfile.avg) / sig1.thicknessProfile.avg : 0,
        aspectRatioDelta: sig1.aspectRatio > 0 ? Math.abs(sig1.aspectRatio - sig2.aspectRatio) / sig1.aspectRatio : 0,
        curvatureDelta: Math.abs(sig1.avgCurvature - sig2.avgCurvature)
      }
    };
  }

  // --- Helper Mathematical Methods ---

  private static calculatePerimeter(points: EmbroideryPoint[]): number {
    let p = 0;
    const len = points.length;
    for (let i = 0; i < len; i++) {
      const next = points[(i + 1) % len];
      p += Math.hypot(next.x - points[i].x, next.y - points[i].y);
    }
    return p;
  }

  private static calculateArea(points: EmbroideryPoint[]): number {
    let area = 0;
    const len = points.length;
    for (let i = 0; i < len; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % len];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  }

  private static calculatePrincipalAxis(points: EmbroideryPoint[], centroid: { x: number; y: number }) {
    let m20 = 0, m02 = 0, m11 = 0;
    for (const p of points) {
      const dx = p.x - centroid.x;
      const dy = p.y - centroid.y;
      m20 += dx * dx;
      m02 += dy * dy;
      m11 += dx * dy;
    }

    const angleRad = 0.5 * Math.atan2(2 * m11, m20 - m02);
    let angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 180;

    const inertiaRatio = (m02 > 0) ? m20 / m02 : 1.0;
    return { angle: angleDeg, inertiaRatio };
  }

  private static calculateThicknessProfile(points: EmbroideryPoint[], subpaths?: EmbroideryPoint[][]): { min: number; max: number; avg: number; stdDev: number } {
    const len = points.length;
    if (len < 4) return { min: 1, max: 1, avg: 1, stdDev: 0 };

    const samples: number[] = [];
    const step = Math.max(1, Math.floor(len / 16));

    for (let i = 0; i < len; i += step) {
      const p = points[i];
      let minCrossDist = Infinity;

      for (let j = 0; j < len; j++) {
        if (Math.abs(j - i) <= 2 || Math.abs(j - i) >= len - 2) continue;
        const d = Math.hypot(p.x - points[j].x, p.y - points[j].y);
        if (d < minCrossDist) minCrossDist = d;
      }

      if (minCrossDist !== Infinity && minCrossDist > 0.1) {
        samples.push(minCrossDist);
      }
    }

    if (samples.length === 0) return { min: 1, max: 1, avg: 1, stdDev: 0 };

    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const sum = samples.reduce((a, b) => a + b, 0);
    const avg = sum / samples.length;

    const variance = samples.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);

    return { min, max, avg, stdDev };
  }

  private static analyzeCurvatureAndLandmarks(points: EmbroideryPoint[]): {
    avgCurvature: number;
    maxCurvature: number;
    curvatureEntropy: number;
    keyPoints: { x: number; y: number; type: 'corner' | 'inflection' | 'tip' }[];
    arcRadii: number[];
    continuity: number;
  } {
    const len = points.length;
    if (len < 3) {
      return { avgCurvature: 0, maxCurvature: 0, curvatureEntropy: 0, keyPoints: [], arcRadii: [], continuity: 1.0 };
    }

    const curvatures: number[] = [];
    const keyPoints: { x: number; y: number; type: 'corner' | 'inflection' | 'tip' }[] = [];
    const arcRadii: number[] = [];
    let smoothAnglesCount = 0;

    for (let i = 0; i < len; i++) {
      const prev = points[(i - 1 + len) % len];
      const curr = points[i];
      const next = points[(i + 1) % len];

      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };

      const l1 = Math.hypot(v1.x, v1.y);
      const l2 = Math.hypot(v2.x, v2.y);

      if (l1 < 1e-4 || l2 < 1e-4) continue;

      const dot = (v1.x * v2.x + v1.y * v2.y) / (l1 * l2);
      const angleRad = Math.acos(Math.max(-1.0, Math.min(1.0, dot)));
      const angleDeg = (angleRad * 180) / Math.PI;

      const curvature = angleRad / ((l1 + l2) / 2);
      curvatures.push(curvature);

      if (curvature > 0.001) {
        arcRadii.push(Math.min(100, 1.0 / curvature));
      }

      if (angleDeg < 25) {
        smoothAnglesCount++;
      } else if (angleDeg > 60) {
        keyPoints.push({ x: curr.x, y: curr.y, type: 'corner' });
      } else if (angleDeg > 35) {
        keyPoints.push({ x: curr.x, y: curr.y, type: 'tip' });
      }
    }

    const avgCurvature = curvatures.length > 0 ? curvatures.reduce((a, b) => a + b, 0) / curvatures.length : 0;
    const maxCurvature = curvatures.length > 0 ? Math.max(...curvatures) : 0;

    // Curvature Entropy calculation
    let entropy = 0;
    if (avgCurvature > 0) {
      for (const c of curvatures) {
        const p = c / (avgCurvature * curvatures.length + 1e-6);
        if (p > 0) entropy -= p * Math.log(p);
      }
    }

    const continuity = curvatures.length > 0 ? smoothAnglesCount / curvatures.length : 1.0;

    return {
      avgCurvature,
      maxCurvature,
      curvatureEntropy: Math.min(3.0, entropy),
      keyPoints,
      arcRadii: arcRadii.slice(0, 10),
      continuity
    };
  }

  private static calculateSymmetryIndex(
    points: EmbroideryPoint[],
    centroid: { x: number; y: number },
    angleDeg: number
  ): number {
    const len = points.length;
    if (len < 6) return 1.0;

    const rad = (angleDeg * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);

    let mirroredMatches = 0;

    for (let i = 0; i < len; i += 2) {
      const p = points[i];
      const dx = p.x - centroid.x;
      const dy = p.y - centroid.y;

      // Reflect p across axis through centroid along (ux, uy)
      const dot = dx * ux + dy * uy;
      const rx = 2 * dot * ux - dx + centroid.x;
      const ry = 2 * dot * uy - dy + centroid.y;

      let bestDist = Infinity;
      for (let j = 0; j < len; j += 2) {
        const d = Math.hypot(rx - points[j].x, ry - points[j].y);
        if (d < bestDist) bestDist = d;
      }

      if (bestDist < 3.0) mirroredMatches++;
    }

    return Math.min(1.0, (mirroredMatches * 2) / len);
  }

  private static classifyShape(metrics: {
    aspectRatio: number;
    circularity: number;
    solidity: number;
    thicknessProfile: { min: number; max: number; avg: number; stdDev: number };
    avgCurvature: number;
    counterFormsCount: number;
    inertiaRatio: number;
    keyPointsCount: number;
  }): { classifiedType: GeometricSignature['classifiedType']; confidenceScore: number } {
    const { aspectRatio, circularity, thicknessProfile, counterFormsCount } = metrics;

    if (circularity > 0.75 && aspectRatio < 1.3) {
      return { classifiedType: 'circle', confidenceScore: 0.92 };
    }

    if (aspectRatio > 2.2 && thicknessProfile.avg < 15) {
      return { classifiedType: 'stem', confidenceScore: 0.88 };
    }

    if (aspectRatio >= 1.2 && aspectRatio <= 2.8 && circularity > 0.35 && circularity < 0.70) {
      return { classifiedType: 'leaf', confidenceScore: 0.85 };
    }

    if (circularity > 0.50 && aspectRatio < 1.8) {
      return { classifiedType: 'petal', confidenceScore: 0.80 };
    }

    if (counterFormsCount > 0) {
      return { classifiedType: 'ornament', confidenceScore: 0.82 };
    }

    return { classifiedType: 'unknown', confidenceScore: 0.60 };
  }

  private static computeGeometryHash(points: EmbroideryPoint[], subpaths?: EmbroideryPoint[][]): string {
    const pCount = points.length;
    const sCount = subpaths ? subpaths.length : 0;
    if (pCount === 0) return 'empty_hash';

    const pFirst = points[0];
    const pMid = points[Math.floor(pCount / 2)];
    const pLast = points[pCount - 1];

    return `sig_${pCount}_${sCount}_${pFirst.x.toFixed(1)}_${pFirst.y.toFixed(1)}_${pMid.x.toFixed(1)}_${pMid.y.toFixed(1)}_${pLast.x.toFixed(1)}_${pLast.y.toFixed(1)}`;
  }

  private static createEmptySignature(id: string): GeometricSignature {
    return {
      id,
      hash: 'empty',
      timestamp: Date.now(),
      featureVector: new Array(16).fill(0),
      perimeter: 0,
      area: 0,
      width: 0,
      height: 0,
      aspectRatio: 1,
      centroid: { x: 0, y: 0 },
      boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      orientationAngle: 0,
      circularity: 0,
      solidity: 0,
      thicknessProfile: { min: 0, max: 0, avg: 0, stdDev: 0 },
      avgCurvature: 0,
      maxCurvature: 0,
      curvatureEntropy: 0,
      arcRadii: [],
      symmetryIndex: 0,
      counterFormsCount: 0,
      extremitiesCount: 0,
      junctionsCount: 0,
      contourContinuity: 1,
      complexityIndex: 0,
      keyFeaturePoints: [],
      classifiedType: 'unknown',
      confidenceScore: 0
    };
  }
}
