import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

/**
 * ============================================================================
 * AEE GEOMETRY INTEGRITY ENGINE (GIE) - MORPHOLOGICAL PRESERVATION KERNEL
 * ============================================================================
 * Implements Rule 50 (The CAD/CAM Platform), Rule 56 (Tailor Heuristics), and Rule 67.
 * Prevents contour simplification from destroying local thickness, area, 
 * perimeter, curvature, and future satin-fill properties of narrow segments.
 */

export interface MorphologicalMetrics {
  area: number;
  perimeter: number;
  minThickness: number;
  maxThickness: number;
  avgThickness: number;
  aspectRatio: number; // width / height of local bounding box
  innerRadius: number;
  outerRadius: number;
}

export class GeometryIntegrityEngine {
  /**
   * Simplifies a contour using Morphological Preservation.
   * Simulates point deletion first and checks against the original invariants.
   * If a deletion changes area, perimeter, or local thickness profile beyond the tolerance,
   * the point is locked.
   */
  public static simplify(
    points: EmbroideryPoint[],
    baseEpsilon: number = 0.5,
    minThicknessLimitMm: number = 0.9,
    maxAllowedVariationPercent: number = 1.0 // e.g. 1%
  ): EmbroideryPoint[] {
    if (points.length <= 4) return points;

    // Calculate baseline invariants
    const baseline = this.calculateMetrics(points);

    // Initial bitmask: keep start and end
    const kept = new Uint8Array(points.length);
    kept[0] = 1;
    kept[points.length - 1] = 1;

    // First, perform a standard distance/curvature sweep to find candidates for keeping
    const dmaxArray = new Float64Array(points.length);
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const next = points[i + 1];
      const curr = points[i];
      // Simple perpendicular distance to chord
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const mag = Math.hypot(dx, dy);
      if (mag > 0) {
        dmaxArray[i] = Math.abs((curr.x - prev.x) * dy - (curr.y - prev.y) * dx) / mag;
      } else {
        dmaxArray[i] = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      }
    }

    // Sort indices by perpendicular distance (least significant points first)
    const candidates = Array.from({ length: points.length - 2 }, (_, i) => i + 1);
    candidates.sort((a, b) => dmaxArray[a] - dmaxArray[b]);

    // Track active points
    const activeIndices = new Set(Array.from({ length: points.length }, (_, i) => i));

    // Iteratively try to remove points, starting with the ones that have the smallest perpendicular drift
    for (const idx of candidates) {
      // Simulate removal
      activeIndices.delete(idx);
      const simulatedPoints = Array.from(activeIndices).map(i => points[i]);

      // Calculate simulated metrics
      const simulated = this.calculateMetrics(simulatedPoints);

      // Verify invariants variation
      const areaDrift = Math.abs(simulated.area - baseline.area) / (baseline.area || 1);
      const perimeterDrift = Math.abs(simulated.perimeter - baseline.perimeter) / (baseline.perimeter || 1);
      const thicknessDrift = Math.abs(simulated.minThickness - baseline.minThickness) / (baseline.minThickness || 1);

      // Rule-based guards (Rule 56 - Master Tailor Heuristics)
      const isNarrowShape = baseline.minThickness < minThicknessLimitMm;
      const maxAllowedDrift = isNarrowShape 
        ? maxAllowedVariationPercent / 200.0 // reduce tolerance drastically for narrow shapes (0.5% limit becomes 0.005)
        : maxAllowedVariationPercent / 100.0; // standard e.g. 1% -> 0.01

      const violatesArea = areaDrift > maxAllowedDrift;
      const violatesPerimeter = perimeterDrift > (maxAllowedDrift * 1.5);
      const violatesThickness = isNarrowShape && (simulated.minThickness < 0.3 || thicknessDrift > maxAllowedDrift);

      if (violatesArea || violatesPerimeter || violatesThickness) {
        // Rejection! The point is critical to morphological preservation
        activeIndices.add(idx);
      }
    }

    return Array.from(activeIndices).map(i => points[i]);
  }

  /**
   * Helper to calculate morphological shape invariants
   */
  public static calculateMetrics(points: EmbroideryPoint[]): MorphologicalMetrics {
    if (points.length === 0) {
      return { area: 0, perimeter: 0, minThickness: 0, maxThickness: 0, avgThickness: 0, aspectRatio: 1, innerRadius: 0, outerRadius: 0 };
    }

    // Area calculation (Shoelace formula)
    let area = 0;
    let perimeter = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      area += p1.x * p2.y - p2.x * p1.y;
      perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (p1.x < minX) minX = p1.x;
      if (p1.x > maxX) maxX = p1.x;
      if (p1.y < minY) minY = p1.y;
      if (p1.y > maxY) maxY = p1.y;
    }
    area = Math.abs(area) / 2;

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const aspectRatio = width / height;

    const centroidX = (minX + maxX) / 2;
    const centroidY = (minY + maxY) / 2;

    // Radii
    let innerRadius = Infinity;
    let outerRadius = 0;
    let thicknessSum = 0;
    let minThickness = Infinity;
    let maxThickness = 0;

    points.forEach((pt, i) => {
      const dCentroid = Math.hypot(pt.x - centroidX, pt.y - centroidY);
      if (dCentroid < innerRadius) innerRadius = dCentroid;
      if (dCentroid > outerRadius) outerRadius = dCentroid;

      // Local Thickness: distance to the opposite side of the contour
      let localMinDist = Infinity;
      for (let j = 0; j < points.length; j++) {
        // Skip direct neighbors
        if (Math.abs(i - j) <= 2 || Math.abs(i - j) >= points.length - 2) continue;
        const ptOther = points[j];
        const dist = Math.hypot(ptOther.x - pt.x, ptOther.y - pt.y);
        if (dist < localMinDist) {
          localMinDist = dist;
        }
      }

      if (localMinDist !== Infinity) {
        thicknessSum += localMinDist;
        if (localMinDist < minThickness) minThickness = localMinDist;
        if (localMinDist > maxThickness) maxThickness = localMinDist;
      }
    });

    if (minThickness === Infinity) minThickness = 0;

    return {
      area,
      perimeter,
      minThickness: parseFloat(minThickness.toFixed(3)),
      maxThickness: parseFloat(maxThickness.toFixed(3)),
      avgThickness: parseFloat((thicknessSum / (points.length || 1)).toFixed(3)),
      aspectRatio: parseFloat(aspectRatio.toFixed(3)),
      innerRadius: parseFloat(innerRadius.toFixed(3)),
      outerRadius: parseFloat(outerRadius.toFixed(3))
    };
  }
}
