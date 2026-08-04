import { EmbroideryPoint } from './embroideryServices';
import { GeometryValidator, isPointInPolygons } from './embroideryServices';

export class StrokeWidthFidelityEngine {
  /**
   * Adjusts local thickness of a reconstructed contour to match the original contour thickness.
   * Guarantees non-destructive, high-fidelity local corrections.
   */
  static adjustThickness(reconstructed: EmbroideryPoint[], original: EmbroideryPoint[]): EmbroideryPoint[] {
    if (reconstructed.length < 5 || original.length < 5) return reconstructed;

    // Determine path closedness
    const startPt = reconstructed[0];
    const endPt = reconstructed[reconstructed.length - 1];
    const isClosed = Math.hypot(startPt.x - endPt.x, startPt.y - endPt.y) < 1.0;

    const n = reconstructed.length;
    const corrected: EmbroideryPoint[] = [];

    for (let i = 0; i < n; i++) {
      const pCurr = reconstructed[i];

      // Step 1: Compute inward normal of the reconstructed shape at P_i
      const normal = this.getInwardNormal(i, reconstructed, isClosed);

      // Step 2: Measure reconstructed local thickness along the inward normal
      const wRecon = this.measureLocalThickness(pCurr, normal, i, reconstructed, isClosed);
      if (wRecon <= 0 || wRecon > 200) {
        // Fallback: no correction if thickness is invalid
        corrected.push({ ...pCurr });
        continue;
      }

      // Step 3: Find the closest corresponding zone on the original shape
      const origMatch = this.findClosestPoint(pCurr, original);
      const normalOrig = this.getInwardNormal(origMatch.index, original, isClosed);
      const wOrig = this.measureLocalThickness(origMatch.point, normalOrig, origMatch.index, original, isClosed);

      if (wOrig <= 0 || wOrig > 200) {
        corrected.push({ ...pCurr });
        continue;
      }

      // Step 4: Detect significant thickness deviation (> 2% of local thickness)
      const diffRatio = Math.abs(wOrig - wRecon) / wRecon;
      if (diffRatio < 0.02) {
        // Zone already correct - preserve exact coordinates
        corrected.push({ ...pCurr });
        continue;
      }

      // Step 5: Apply progressive, localized thickness correction
      // Target adjustment (sharing the correction across both sides, hence 0.5)
      let adjustment = 0.5 * (wOrig - wRecon);

      // Clamp correction to the strict ±2% maximum local thickness limit
      const maxAllowed = 0.02 * wRecon;
      adjustment = Math.max(-maxAllowed, Math.min(maxAllowed, adjustment));

      // Correct point along normal
      const correctedPt = {
        x: pCurr.x + adjustment * normal.x,
        y: pCurr.y + adjustment * normal.y
      };

      corrected.push(correctedPt);
    }

    // Step 6: Ensure closed path remains closed
    if (isClosed && corrected.length > 0) {
      corrected[corrected.length - 1] = { ...corrected[0] };
    }

    // Step 7: Automatic Control Quality (QC) & Validation Checks
    const isValid = this.validateCorrection(reconstructed, corrected, isClosed);

    if (isValid) {
      return corrected;
    } else {
      // Fallback to reconstructed on QC failure to ensure zero regression
      return reconstructed;
    }
  }

  /**
   * Computes the inward-pointing normal vector at a polygon index.
   */
  private static getInwardNormal(index: number, polygon: EmbroideryPoint[], isClosed: boolean): { x: number, y: number } {
    const len = polygon.length;
    if (len < 3) return { x: 0, y: 1 };

    let prevIdx = index - 1;
    let nextIdx = index + 1;

    if (isClosed) {
      prevIdx = (index - 1 + len) % len;
      nextIdx = (index + 1) % len;
    } else {
      if (index === 0) prevIdx = 0;
      if (index === len - 1) nextIdx = len - 1;
    }

    const pPrev = polygon[prevIdx];
    const pCurr = polygon[index];
    const pNext = polygon[nextIdx];

    const dx1 = pCurr.x - pPrev.x;
    const dy1 = pCurr.y - pPrev.y;
    const dx2 = pNext.x - pCurr.x;
    const dy2 = pNext.y - pCurr.y;

    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);

    const nx1 = len1 > 0 ? dx1 / len1 : 0;
    const ny1 = len1 > 0 ? dy1 / len1 : 0;
    const nx2 = len2 > 0 ? dx2 / len2 : 0;
    const ny2 = len2 > 0 ? dy2 / len2 : 0;

    const tx = (nx1 + nx2) / 2;
    const ty = (ny1 + ny2) / 2;
    const tLen = Math.hypot(tx, ty);

    const tangent = tLen > 0 ? { x: tx / tLen, y: ty / tLen } : { x: 1, y: 0 };

    // Standard perpendicular vector (left-hand normal)
    let normal = { x: -tangent.y, y: tangent.x };

    // Direct orientation check for closed paths to guarantee the normal is inward-pointing
    if (isClosed) {
      const testPt = { x: pCurr.x + 0.1 * normal.x, y: pCurr.y + 0.1 * normal.y };
      const inside = isPointInPolygons(testPt, [polygon]);
      if (!inside) {
        normal.x = -normal.x;
        normal.y = -normal.y;
      }
    }

    return normal;
  }

  /**
   * Measures local thickness of the shape at point P along direction normal.
   * Utilizes ray-casting to find opposite edge intersections, with distance-to-segment fallback.
   */
  private static measureLocalThickness(
    p: EmbroideryPoint,
    normal: { x: number, y: number },
    index: number,
    polygon: EmbroideryPoint[],
    isClosed: boolean
  ): number {
    const len = polygon.length;
    let minT = Infinity;

    // Ray-cast along the normal vector
    for (let i = 0; i < len; i++) {
      const nextIdx = (i + 1) % len;

      // Skip adjacent segments to prevent self-intersection anomalies
      if (isClosed) {
        if (i === index || i === (index - 1 + len) % len) continue;
      } else {
        if (Math.abs(i - index) <= 2) continue;
      }

      const p1 = polygon[i];
      const p2 = polygon[nextIdx];

      const t = this.raySegmentIntersection(p, normal, p1, p2);
      if (t !== null && t > 0.1 && t < minT) {
        minT = t;
      }
    }

    if (minT !== Infinity) {
      return minT;
    }

    // Fallback: Distance to the closest non-adjacent boundary point
    let minFallbackDist = Infinity;
    for (let i = 0; i < len; i++) {
      if (isClosed) {
        if (i === index || i === (index - 1 + len) % len || i === (index + 1) % len) continue;
      } else {
        if (Math.abs(i - index) <= 2) continue;
      }
      const d = Math.hypot(p.x - polygon[i].x, p.y - polygon[i].y);
      if (d < minFallbackDist) minFallbackDist = d;
    }

    return minFallbackDist !== Infinity ? minFallbackDist : 10.0; // conservative default
  }

  /**
   * Computes the intersection parameter t for a ray (P + t * U) and segment (A -> B).
   */
  private static raySegmentIntersection(
    p: EmbroideryPoint,
    u: { x: number, y: number },
    a: EmbroideryPoint,
    b: EmbroideryPoint
  ): number | null {
    const vx = b.x - a.x;
    const vy = b.y - a.y;

    const det = -u.x * vy + u.y * vx;
    if (Math.abs(det) < 1e-6) return null; // Parallel

    const dx = a.x - p.x;
    const dy = a.y - p.y;

    const t = (-dx * vy + dy * vx) / det;
    const s = (u.y * dx - u.x * dy) / det;

    if (t >= 0 && s >= 0 && s <= 1) {
      return t;
    }

    return null;
  }

  /**
   * Finds the closest vertex in a target polygon and its index.
   */
  private static findClosestPoint(p: EmbroideryPoint, polygon: EmbroideryPoint[]): { point: EmbroideryPoint, index: number } {
    let minDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < polygon.length; i++) {
      const d = Math.hypot(p.x - polygon[i].x, p.y - polygon[i].y);
      if (d < minDist) {
        minDist = d;
        bestIdx = i;
      }
    }

    return { point: polygon[bestIdx], index: bestIdx };
  }

  /**
   * Comprehensive validation (QC) to ensure no regressions.
   */
  private static validateCorrection(original: EmbroideryPoint[], corrected: EmbroideryPoint[], isClosed: boolean): boolean {
    if (original.length !== corrected.length) return false;

    // 1. Surface Area Stability
    if (isClosed) {
      const areaOrig = this.getPolygonArea(original);
      const areaCorr = this.getPolygonArea(corrected);
      if (areaOrig > 1.0) {
        const diffRatio = Math.abs(areaOrig - areaCorr) / areaOrig;
        // Strict limit: area must remain within 1% of the original reconstructed shape
        if (diffRatio > 0.01) {
          console.warn(`[StrokeWidthFidelityEngine] QC Failed: Area deviation too large: ${(diffRatio * 100).toFixed(3)}%`);
          return false;
        }
      }
    }

    // 2. Centroid Stability (ensure shape remains centered and untranslated)
    const centOrig = this.getCentroid(original);
    const centCorr = this.getCentroid(corrected);
    const shift = Math.hypot(centOrig.x - centCorr.x, centOrig.y - centCorr.y);
    if (shift > 0.5) {
      console.warn(`[StrokeWidthFidelityEngine] QC Failed: Centroid shift too large: ${shift.toFixed(3)}px`);
      return false;
    }

    // 3. Self-Intersection Check (ensure correction doesn't twist edges or create loops)
    if (isClosed && GeometryValidator.hasSelfIntersection(corrected)) {
      console.warn(`[StrokeWidthFidelityEngine] QC Failed: Self-intersection detected in corrected polygon`);
      return false;
    }

    return true;
  }

  private static getCentroid(points: EmbroideryPoint[]): { x: number, y: number } {
    if (points.length === 0) return { x: 0, y: 0 };
    let sx = 0, sy = 0;
    for (const p of points) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / points.length, y: sy / points.length };
  }

  private static getPolygonArea(points: EmbroideryPoint[]): number {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  }
}
