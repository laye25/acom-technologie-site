import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class MetricsCalculator {
  
  private static distToSegment(p: EmbroideryPoint, a: EmbroideryPoint, b: EmbroideryPoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  private static minDistToPolygon(p: EmbroideryPoint, poly: EmbroideryPoint[]): number {
    if (poly.length === 0) return Infinity;
    if (poly.length === 1) return Math.hypot(p.x - poly[0].x, p.y - poly[0].y);
    
    let minDist = Infinity;
    const n = poly.length;
    // Treat as closed polygon. Loop over all segments.
    for (let i = 0; i < n; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % n];
      const dist = this.distToSegment(p, a, b);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  public static calculateRMS(ref: EmbroideryPoint[], gen: EmbroideryPoint[]): number {
    if(ref.length === 0 || gen.length === 0) return 0;
    let sumSq = 0;
    
    for (const p of gen) {
      const d = this.minDistToPolygon(p, ref);
      sumSq += d * d;
    }
    return Math.sqrt(sumSq / gen.length);
  }

  public static calculateHausdorff(ref: EmbroideryPoint[], gen: EmbroideryPoint[]): number {
    if(ref.length === 0 || gen.length === 0) return 0;
    
    let maxGenToRef = 0;
    for (const p of gen) {
      const d = this.minDistToPolygon(p, ref);
      if (d > maxGenToRef) maxGenToRef = d;
    }

    let maxRefToGen = 0;
    for (const p of ref) {
      const d = this.minDistToPolygon(p, gen);
      if (d > maxRefToGen) maxRefToGen = d;
    }

    return Math.max(maxGenToRef, maxRefToGen);
  }

  public static calculateCurvatureVariation(points: EmbroideryPoint[]): number {
    if(points.length < 3) return 0;
    let variation = 0;
    for(let i = 1; i < points.length - 2; i++) {
        const k1 = this.getCurvature(points[i-1], points[i], points[i+1]);
        const k2 = this.getCurvature(points[i], points[i+1], points[i+2]);
        variation += Math.abs(k1 - k2);
    }
    return variation / points.length;
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
