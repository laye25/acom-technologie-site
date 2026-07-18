import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class AdaptiveRDP {
  /**
   * Applies the Ramer-Douglas-Peucker algorithm with an adaptive epsilon based on local curvature.
   * @param points The points to simplify
   * @param baseEpsilon The base tolerance for collinear points
   * @param minEpsilon The minimum tolerance for high curvature points
   */
  public static simplify(points: EmbroideryPoint[], baseEpsilon: number = 0.5, minEpsilon: number = 0.05): EmbroideryPoint[] {
    if (points.length <= 2) return points;
    
    // Precalculate curvature for each point
    const curvatures = new Float64Array(points.length);
    for(let i = 1; i < points.length - 1; i++) {
        curvatures[i] = this.getCurvature(points[i-1], points[i], points[i+1]);
    }

    const bitmask = new Uint8Array(points.length);
    bitmask[0] = 1;
    bitmask[points.length - 1] = 1;

    this.simplifyRecursive(points, 0, points.length - 1, baseEpsilon, minEpsilon, curvatures, bitmask);

    const result: EmbroideryPoint[] = [];
    for (let i = 0; i < points.length; i++) {
      if (bitmask[i]) {
        result.push(points[i]);
      }
    }
    return result;
  }

  private static simplifyRecursive(
    points: EmbroideryPoint[], 
    start: number, 
    end: number, 
    baseEpsilon: number,
    minEpsilon: number,
    curvatures: Float64Array,
    bitmask: Uint8Array
  ) {
    if (start >= end - 1) return;

    let dmax = 0;
    let index = start;

    const pStart = points[start];
    const pEnd = points[end];

    for (let i = start + 1; i < end; i++) {
      const d = this.perpendicularDistance(points[i], pStart, pEnd);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    // Adaptive epsilon based on maximum curvature in the segment
    let maxK = 0;
    for(let i = start + 1; i < end; i++) {
      if(curvatures[i] > maxK) maxK = curvatures[i];
    }
    
    // If curvature is high, epsilon is small
    // Map curvature [0, 1] to [baseEpsilon, minEpsilon]
    const adaptiveEpsilon = Math.max(minEpsilon, baseEpsilon / (1 + maxK * 10));

    if (dmax > adaptiveEpsilon) {
      bitmask[index] = 1;
      this.simplifyRecursive(points, start, index, baseEpsilon, minEpsilon, curvatures, bitmask);
      this.simplifyRecursive(points, index, end, baseEpsilon, minEpsilon, curvatures, bitmask);
    }
  }

  private static perpendicularDistance(p: EmbroideryPoint, p1: EmbroideryPoint, p2: EmbroideryPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const mag = Math.hypot(dx, dy);
    if (mag === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
    const crossProduct = Math.abs((p.x - p1.x) * dy - (p.y - p1.y) * dx);
    return crossProduct / mag;
  }

  private static getCurvature(p0: EmbroideryPoint, p1: EmbroideryPoint, p2: EmbroideryPoint): number {
    const area = Math.abs(p0.x * (p1.y - p2.y) + p1.x * (p2.y - p0.y) + p2.x * (p0.y - p1.y)) / 2;
    const a = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const b = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const c = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    if (a * b * c === 0) return 0;
    return (4 * area) / (a * b * c);
  }
}
