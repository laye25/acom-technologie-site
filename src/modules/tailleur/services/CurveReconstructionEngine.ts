import { EmbroideryPoint } from './embroideryServices';

export class CurveReconstructionEngine {
  /**
   * Main entry point for curve reconstruction of a sequence of points.
   * If reconstruction fails quality checks or is deemed inferior, returns the original points.
   */
  static reconstructPoints(original: EmbroideryPoint[]): EmbroideryPoint[] {
    if (original.length < 5) return original;

    // 1. Detect closed vs open path
    const startPt = original[0];
    const endPt = original[original.length - 1];
    const isClosed = Math.hypot(startPt.x - endPt.x, startPt.y - endPt.y) < 1.0;

    // 2. Locate sharp corner points to preserve details, pointy extremities, leaves, etc.
    const corners = this.detectCorners(original, isClosed);

    // 3. Segment the original points based on these sharp corners
    const segments = this.segmentByCorners(original, corners, isClosed);

    // 4. Reconstruct each segment (lines vs curves/Bézier curves)
    let reconstructedSegments: EmbroideryPoint[][] = [];
    for (const seg of segments) {
      if (seg.length < 3) {
        reconstructedSegments.push(seg);
        continue;
      }

      // Check if the segment is a straight line
      if (this.isStraightLine(seg)) {
        reconstructedSegments.push([seg[0], seg[seg.length - 1]]);
        continue;
      }

      // Reconstruct curved segment using Bézier curves
      const reconSeg = this.reconstructCurveSegment(seg);
      reconstructedSegments.push(reconSeg);
    }

    // 5. Assemble reconstructed segments back into a unified sequence
    let assembled = this.assembleSegments(reconstructedSegments, isClosed);

    // 6. Perform Automatic Control Quality (QC) & Validation Checks
    const isValid = this.validateReconstruction(original, assembled, isClosed);

    if (isValid) {
      return assembled;
    } else {
      // Automatic fallback to original on validation failure
      return original;
    }
  }

  /**
   * Detects sharp corners where the tangent angle changes abruptly.
   * This ensures leaf tips and ornaments are not rounded.
   */
  private static detectCorners(points: EmbroideryPoint[], isClosed: boolean): boolean[] {
    const len = points.length;
    const corners = new Array(len).fill(false);
    if (len < 3) return corners;

    // A point is a corner if the angle between the incoming and outgoing chords exceeds a threshold (e.g., 35 degrees)
    for (let i = 0; i < len; i++) {
      if (!isClosed && (i === 0 || i === len - 1)) {
        corners[i] = true; // Ends of open paths are corners
        continue;
      }

      const prev = points[(i - 1 + len) % len];
      const curr = points[i];
      const next = points[(i + 1) % len];

      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };

      const m1 = Math.hypot(v1.x, v1.y);
      const m2 = Math.hypot(v2.x, v2.y);

      if (m1 < 0.1 || m2 < 0.1) continue;

      // Cosine of angle between chords
      const dot = (v1.x * v2.x + v1.y * v2.y) / (m1 * m2);
      // Bound dot product to avoid NaN
      const angleRad = Math.acos(Math.max(-1.0, Math.min(1.0, dot)));
      const angleDeg = (angleRad * 180) / Math.PI;

      // Corner detected if direction changes by > 35 degrees
      if (angleDeg > 35) {
        corners[i] = true;
      }
    }

    return corners;
  }

  /**
   * Segments points based on corner indices.
   */
  private static segmentByCorners(points: EmbroideryPoint[], corners: boolean[], isClosed: boolean): EmbroideryPoint[][] {
    const len = points.length;
    const segments: EmbroideryPoint[][] = [];

    // Find all corner indices
    const cornerIndices: number[] = [];
    for (let i = 0; i < len; i++) {
      if (corners[i]) cornerIndices.push(i);
    }

    if (cornerIndices.length === 0) {
      // No corners: return the points as a single segment
      return [points];
    }

    // For open paths
    if (!isClosed) {
      for (let i = 0; i < cornerIndices.length - 1; i++) {
        const start = cornerIndices[i];
        const end = cornerIndices[i + 1];
        segments.push(points.slice(start, end + 1));
      }
      return segments;
    }

    // For closed paths, segments wrap around
    const numCorners = cornerIndices.length;
    for (let i = 0; i < numCorners; i++) {
      const start = cornerIndices[i];
      const end = cornerIndices[(i + 1) % numCorners];

      const seg: EmbroideryPoint[] = [];
      if (start < end) {
        for (let j = start; j <= end; j++) {
          seg.push(points[j]);
        }
      } else {
        for (let j = start; j < len; j++) {
          seg.push(points[j]);
        }
        for (let j = 0; j <= end; j++) {
          seg.push(points[j]);
        }
      }
      segments.push(seg);
    }

    return segments;
  }

  /**
   * Checks if a segment of points is essentially a straight line.
   */
  private static isStraightLine(points: EmbroideryPoint[]): boolean {
    if (points.length < 3) return true;
    const pStart = points[0];
    const pEnd = points[points.length - 1];

    const chordLength = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);
    if (chordLength < 1e-5) return false;

    // Calculate maximum perpendicular distance from points to the chord line
    let maxDist = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const num = Math.abs((pEnd.y - pStart.y) * p.x - (pEnd.x - pStart.x) * p.y + pEnd.x * pStart.y - pEnd.y * pStart.x);
      const dist = num / chordLength;
      if (dist > maxDist) maxDist = dist;
    }

    // If the max deviation is < 0.4px, it can be treated as a straight line
    return maxDist < 0.4;
  }

  /**
   * Reconstructs a curved segment.
   * If the segment is long or curves by more than 90 degrees, splits it into multiple sub-segments
   * and fits cubic Bézier curves to each, preserving tangent continuity.
   */
  private static reconstructCurveSegment(points: EmbroideryPoint[]): EmbroideryPoint[] {
    // 1. Check if the segment needs subdivision to preserve spirals, volutes, and high-curvature arcs
    const subSegments = this.subdivideLongCurvedSegment(points);

    let reconstructedPoints: EmbroideryPoint[] = [];

    for (let i = 0; i < subSegments.length; i++) {
      const subSeg = subSegments[i];
      const fit = this.fitCubicBezier(subSeg);
      
      // Merge points, avoiding duplicating boundary vertices
      if (i === 0) {
        reconstructedPoints = reconstructedPoints.concat(fit);
      } else {
        reconstructedPoints = reconstructedPoints.concat(fit.slice(1));
      }
    }

    return reconstructedPoints;
  }

  /**
   * Subdivides a long or high-curvature segment into smaller arcs (max 90 deg tangent change or length constraint)
   * to preserve spirals/volutes.
   */
  private static subdivideLongCurvedSegment(points: EmbroideryPoint[]): EmbroideryPoint[][] {
    const len = points.length;
    if (len <= 5) return [points];

    const subSegments: EmbroideryPoint[][] = [];
    let currentSub: EmbroideryPoint[] = [points[0]];
    let accumulatedAngle = 0;
    let prevTangent: { x: number, y: number } | null = null;

    for (let i = 1; i < len; i++) {
      const pPrev = points[i - 1];
      const pCurr = points[i];
      currentSub.push(pCurr);

      const dx = pCurr.x - pPrev.x;
      const dy = pCurr.y - pPrev.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1e-5) {
        const tangent = { x: dx / dist, y: dy / dist };
        if (prevTangent) {
          const dot = tangent.x * prevTangent.x + tangent.y * prevTangent.y;
          const angle = Math.acos(Math.max(-1.0, Math.min(1.0, dot)));
          accumulatedAngle += angle;
        }
        prevTangent = tangent;
      }

      // Subdivision criteria:
      // - Accumulate tangent rotation > 90 degrees
      // - Subsegment length exceeds 40 pixels (for spirals detail and tightness)
      const currentLength = this.getArcLength(currentSub);
      if (accumulatedAngle > Math.PI / 2 || currentLength > 40) {
        subSegments.push(currentSub);
        currentSub = [pCurr]; // Start next segment with current point
        accumulatedAngle = 0;
        prevTangent = null;
      }
    }

    if (currentSub.length > 1) {
      subSegments.push(currentSub);
    } else if (currentSub.length === 1 && subSegments.length > 0) {
      // Append leftover single point to the previous subsegment
      subSegments[subSegments.length - 1].push(currentSub[0]);
    }

    return subSegments.length > 0 ? subSegments : [points];
  }

  /**
   * Fits a single cubic Bézier curve to a segment of points.
   * Guarantees that start/end points are preserved and tangent vectors are aligned.
   */
  private static fitCubicBezier(points: EmbroideryPoint[]): EmbroideryPoint[] {
    const n = points.length;
    if (n < 3) return points;

    const P0 = points[0];
    const P3 = points[n - 1];

    // Estimate start tangent direction
    const tStartVec = { x: points[1].x - points[0].x, y: points[1].y - points[0].y };
    const tStartLen = Math.hypot(tStartVec.x, tStartVec.y);
    const U_start = tStartLen > 1e-5 ? { x: tStartVec.x / tStartLen, y: tStartVec.y / tStartLen } : { x: 1, y: 0 };

    // Estimate end tangent direction
    const tEndVec = { x: points[n - 1].x - points[n - 2].x, y: points[n - 1].y - points[n - 2].y };
    const tEndLen = Math.hypot(tEndVec.x, tEndVec.y);
    const U_end = tEndLen > 1e-5 ? { x: tEndVec.x / tEndLen, y: tEndVec.y / tEndLen } : { x: 1, y: 0 };

    const arcLen = this.getArcLength(points);

    // Grid search to optimize cubic control point distances d1 and d2
    // keeping control points in valid ranges relative to total arc length to avoid looping/self-intersections.
    let bestD1 = arcLen / 3;
    let bestD2 = arcLen / 3;
    let minError = Infinity;

    // We sample a grid of d1 and d2 (e.g. 6x6)
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const d1 = arcLen * (0.15 + (i / (steps - 1)) * 0.35); // range: [0.15*L, 0.50*L]
      for (let j = 0; j < steps; j++) {
        const d2 = arcLen * (0.15 + (j / (steps - 1)) * 0.35);

        // Control points
        const P1 = { x: P0.x + d1 * U_start.x, y: P0.y + d1 * U_start.y };
        const P2 = { x: P3.x - d2 * U_end.x, y: P3.y - d2 * U_end.y };

        // Evaluate the curve at points and calculate mean-squared error
        const error = this.calculateBezierFitError(points, P0, P1, P2, P3);
        if (error < minError) {
          minError = error;
          bestD1 = d1;
          bestD2 = d2;
        }
      }
    }

    // Generate final high-fidelity points on the optimal Bezier curve
    const P1 = { x: P0.x + bestD1 * U_start.x, y: P0.y + bestD1 * U_start.y };
    const P2 = { x: P3.x - bestD2 * U_end.x, y: P3.y - bestD2 * U_end.y };

    // Sample the Bezier curve
    const samples: EmbroideryPoint[] = [];
    // Number of samples proportional to arc length, minimum 8, maximum 64
    const numSamples = Math.max(8, Math.min(64, Math.floor(arcLen / 2)));
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const t_inv = 1 - t;

      const x = Math.pow(t_inv, 3) * P0.x +
                3 * Math.pow(t_inv, 2) * t * P1.x +
                3 * t_inv * Math.pow(t, 2) * P2.x +
                Math.pow(t, 3) * P3.x;

      const y = Math.pow(t_inv, 3) * P0.y +
                3 * Math.pow(t_inv, 2) * t * P1.y +
                3 * t_inv * Math.pow(t, 2) * P2.y +
                Math.pow(t, 3) * P3.y;

      samples.push({ x, y });
    }

    return samples;
  }

  /**
   * Calculates the mean squared distance error between a set of digitized points and a Bezier curve.
   */
  private static calculateBezierFitError(
    points: EmbroideryPoint[],
    P0: EmbroideryPoint,
    P1: EmbroideryPoint,
    P2: EmbroideryPoint,
    P3: EmbroideryPoint
  ): number {
    const n = points.length;
    let sumSqrDist = 0;

    // Parameterize points by relative arc length
    const chordLengths = [0];
    let totalChord = 0;
    for (let i = 1; i < n; i++) {
      totalChord += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      chordLengths.push(totalChord);
    }

    for (let i = 0; i < n; i++) {
      const t = totalChord > 0 ? chordLengths[i] / totalChord : i / (n - 1);
      const t_inv = 1 - t;

      // Bezier point for t
      const bx = Math.pow(t_inv, 3) * P0.x +
                 3 * Math.pow(t_inv, 2) * t * P1.x +
                 3 * t_inv * Math.pow(t, 2) * P2.x +
                 Math.pow(t, 3) * P3.x;

      const by = Math.pow(t_inv, 3) * P0.y +
                 3 * Math.pow(t_inv, 2) * t * P1.y +
                 3 * t_inv * Math.pow(t, 2) * P2.y +
                 Math.pow(t, 3) * P3.y;

      const dx = points[i].x - bx;
      const dy = points[i].y - by;
      sumSqrDist += dx * dx + dy * dy;
    }

    return sumSqrDist / n;
  }

  /**
   * Assembles the reconstructed segments back into a unified sequence.
   */
  private static assembleSegments(segments: EmbroideryPoint[][], isClosed: boolean): EmbroideryPoint[] {
    let assembled: EmbroideryPoint[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (assembled.length === 0) {
        assembled = assembled.concat(seg);
      } else {
        assembled = assembled.concat(seg.slice(1));
      }
    }

    if (isClosed && assembled.length > 0) {
      // Ensure it's perfectly closed
      const first = assembled[0];
      const last = assembled[assembled.length - 1];
      if (Math.hypot(first.x - last.x, first.y - last.y) > 0.01) {
        assembled.push({ ...first });
      }
    }

    return assembled;
  }

  /**
   * Performance & Quality Control Verification (Shoelace Area, Hausdorff error, Centroid Shift).
   * Rejects the reconstruction if major deviations are found to ensure absolutely zero regression.
   */
  private static validateReconstruction(original: EmbroideryPoint[], reconstructed: EmbroideryPoint[], isClosed: boolean): boolean {
    if (original.length < 3 || reconstructed.length < 3) return false;

    // 1. Surface Area Difference check (for closed paths)
    if (isClosed) {
      const areaOrig = this.getPolygonArea(original);
      const areaRecon = this.getPolygonArea(reconstructed);

      if (areaOrig > 1.0) {
        const areaDiffRatio = Math.abs(areaOrig - areaRecon) / areaOrig;
        // Limit to max 5% area deviation
        if (areaDiffRatio > 0.05) {
          console.warn(`[CurveReconstructionEngine] Area mismatch too large: ${(areaDiffRatio * 100).toFixed(2)}% (allowed: 5%)`);
          return false;
        }
      }
    }

    // 2. Perimeter Difference check
    const perimOrig = this.getArcLength(original);
    const perimRecon = this.getArcLength(reconstructed);
    if (perimOrig > 1.0) {
      const perimDiffRatio = Math.abs(perimOrig - perimRecon) / perimOrig;
      // Limit to max 8% perimeter deviation
      if (perimDiffRatio > 0.08) {
        console.warn(`[CurveReconstructionEngine] Perimeter mismatch too large: ${(perimDiffRatio * 100).toFixed(2)}% (allowed: 8%)`);
        return false;
      }
    }

    // 3. Centroid Shift check
    const centOrig = this.getCentroid(original);
    const centRecon = this.getCentroid(reconstructed);
    const shift = Math.hypot(centOrig.x - centRecon.x, centOrig.y - centRecon.y);
    // Max allowable centroid shift is 1.5 pixels
    if (shift > 1.5) {
      console.warn(`[CurveReconstructionEngine] Centroid shift too large: ${shift.toFixed(2)} px (allowed: 1.5px)`);
      return false;
    }

    // 4. Maximum Bidirectional Deviation Check (Hausdorff-like distance)
    let maxDeviation = 0;

    // Forward check: distance from each reconstructed point to closest original segment/point
    for (const p of reconstructed) {
      let minDist = Infinity;
      for (const po of original) {
        const d = Math.hypot(p.x - po.x, p.y - po.y);
        if (d < minDist) minDist = d;
      }
      if (minDist > maxDeviation) maxDeviation = minDist;
    }

    // Backward check: distance from each original point to closest reconstructed point
    for (const po of original) {
      let minDist = Infinity;
      for (const p of reconstructed) {
        const d = Math.hypot(p.x - po.x, p.y - po.y);
        if (d < minDist) minDist = d;
      }
      if (minDist > maxDeviation) maxDeviation = minDist;
    }

    // Limit maximum geometric deviation to 1.8 pixels
    if (maxDeviation > 1.8) {
      console.warn(`[CurveReconstructionEngine] Geometric deviation too large: ${maxDeviation.toFixed(2)} px (allowed: 1.8px)`);
      return false;
    }

    return true;
  }

  // Helpers
  private static getArcLength(points: EmbroideryPoint[]): number {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return len;
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
