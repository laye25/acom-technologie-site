import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class ArcFitter {
  /**
   * Fits arcs to sequences of quasi-circular segments and replaces them with 
   * a mathematically smooth generated curve.
   */
  public static fit(points: EmbroideryPoint[], tolerance: number = 0.15): EmbroideryPoint[] {
    if (points.length < 5) return points;

    const result: EmbroideryPoint[] = [];
    let i = 0;

    while (i < points.length) {
      // Try to find the longest arc starting at i
      let bestArcLen = 0;
      let bestArcParams = null;

      // Minimum 5 points to form a reliable arc
      for (let j = i + 4; j < Math.min(i + 20, points.length); j++) {
        const params = this.fitCircle(points.slice(i, j + 1));
        if (params && params.error < tolerance) {
          bestArcLen = j - i;
          bestArcParams = params;
        } else if (bestArcLen > 0) {
          // If error exceeded tolerance but we had a good arc before, stop searching
          break;
        }
      }

      if (bestArcLen >= 4 && bestArcParams) {
        // We found a good arc from i to i + bestArcLen
        const arcPoints = this.generateArc(points[i], points[i + bestArcLen], bestArcParams.cx, bestArcParams.cy, bestArcParams.r, bestArcParams.cw);
        // Exclude the last point to avoid duplication with the next segment
        for(let k = 0; k < arcPoints.length - 1; k++) {
            result.push(arcPoints[k]);
        }
        i += bestArcLen;
      } else {
        result.push(points[i]);
        i++;
      }
    }
    
    // Ensure the last point is always included
    const lastPoint = points[points.length - 1];
    if (result.length === 0 || result[result.length - 1] !== lastPoint) {
      result.push(lastPoint);
    }

    return result;
  }

  private static fitCircle(points: EmbroideryPoint[]) {
    // A simple algebraic circle fit (Kasa method or similar simple least squares)
    // For simplicity, we estimate center using the first, middle, and last points
    const p1 = points[0];
    const p2 = points[Math.floor(points.length / 2)];
    const p3 = points[points.length - 1];

    // Midpoints
    const m12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const m23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

    // Slopes
    let dx12 = p2.x - p1.x;
    let dy12 = p2.y - p1.y;
    let dx23 = p3.x - p2.x;
    let dy23 = p3.y - p2.y;

    if (Math.abs(dx12) < 1e-6) dx12 = 1e-6;
    if (Math.abs(dx23) < 1e-6) dx23 = 1e-6;
    if (Math.abs(dy12) < 1e-6) dy12 = 1e-6;
    if (Math.abs(dy23) < 1e-6) dy23 = 1e-6;

    const slope12 = dy12 / dx12;
    const slope23 = dy23 / dx23;

    if (Math.abs(slope12 - slope23) < 1e-6) return null; // Collinear

    const cx = (slope12 * slope23 * (p1.y - p3.y) + slope23 * (p1.x + p2.x) - slope12 * (p2.x + p3.x)) / (2 * (slope23 - slope12));
    const cy = -1 / slope12 * (cx - m12.x) + m12.y;
    const r = Math.hypot(p1.x - cx, p1.y - cy);

    if (r > 1000) return null; // Too flat

    // Calculate error
    let maxError = 0;
    for (const p of points) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      maxError = Math.max(maxError, Math.abs(d - r));
    }

    // Determine direction (clockwise or counterclockwise)
    const cross = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
    const cw = cross < 0;

    return { cx, cy, r, cw, error: maxError };
  }

  private static generateArc(start: EmbroideryPoint, end: EmbroideryPoint, cx: number, cy: number, r: number, cw: boolean): EmbroideryPoint[] {
    let startAngle = Math.atan2(start.y - cy, start.x - cx);
    let endAngle = Math.atan2(end.y - cy, end.x - cx);

    if (cw) {
      if (endAngle > startAngle) endAngle -= 2 * Math.PI;
    } else {
      if (endAngle < startAngle) endAngle += 2 * Math.PI;
    }

    const points: EmbroideryPoint[] = [];
    const angularStep = 0.1; // Smoothness
    const steps = Math.max(2, Math.ceil(Math.abs(endAngle - startAngle) / angularStep));

    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps);
      points.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      });
    }

    // Ensure exact end matching
    points[points.length - 1] = { x: end.x, y: end.y };
    return points;
  }
}
