import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class CurvatureAwareResampler {
  /**
   * Resamples a contour such that high-curvature regions get more points.
   * @param points The contour points
   * @param baseStep The standard distance between points
   * @param minStep The minimum distance between points in tight curves
   */
  public static resample(points: EmbroideryPoint[], baseStep: number = 2.0, minStep: number = 0.5): EmbroideryPoint[] {
    if (points.length < 2) return points;

    const result: EmbroideryPoint[] = [points[0]];
    let currentDist = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const p0 = i > 0 ? points[i - 1] : p1;
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (segLen === 0) continue;

      // Estimate curvature for this segment
      const k1 = this.getCurvature(p0, p1, p2);
      const k2 = this.getCurvature(p1, p2, p3);
      const maxK = Math.max(k1, k2);

      // Adaptive step size: inversely proportional to curvature
      // When k is high, step size approaches minStep
      // When k is low, step size approaches baseStep
      const step = Math.max(minStep, baseStep / (1 + maxK * 10));

      let remaining = segLen;
      let dx = (p2.x - p1.x) / segLen;
      let dy = (p2.y - p1.y) / segLen;
      
      let cursorX = p1.x;
      let cursorY = p1.y;

      while (remaining + currentDist >= step) {
        const toMove = step - currentDist;
        cursorX += dx * toMove;
        cursorY += dy * toMove;
        result.push({ x: cursorX, y: cursorY });
        remaining -= toMove;
        currentDist = 0;
      }
      currentDist += remaining;
    }

    // Always include the last point to preserve topology
    const lastPoint = points[points.length - 1];
    const lastResult = result[result.length - 1];
    if (Math.hypot(lastPoint.x - lastResult.x, lastPoint.y - lastResult.y) > 0.01) {
      result.push(lastPoint);
    }

    return result;
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
