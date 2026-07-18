import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class SelfIntersectionRepair {
  /**
   * Detects and repairs self-intersections in a closed contour.
   * Returns a list of simple (non-self-intersecting) contours.
   */
  public static repair(contour: EmbroideryPoint[]): EmbroideryPoint[][] {
    if (contour.length < 4) return [contour];
    
    for (let i = 0; i < contour.length - 1; i++) {
      for (let j = i + 2; j < contour.length - 1; j++) {
        // Skip adjacent segments (or segments connecting start/end)
        if (i === 0 && j === contour.length - 2) continue;

        const p1 = contour[i];
        const p2 = contour[i + 1];
        const p3 = contour[j];
        const p4 = contour[j + 1];

        const intersection = this.getIntersection(p1, p2, p3, p4);
        if (intersection) {
          // We found an intersection. Split into two contours.
          // Contour 1: 0 to i, intersection point, j+1 to end
          // Contour 2: intersection point, i+1 to j, intersection point
          
          const c1: EmbroideryPoint[] = [
            ...contour.slice(0, i + 1),
            intersection,
            ...contour.slice(j + 1)
          ];
          
          const c2: EmbroideryPoint[] = [
            intersection,
            ...contour.slice(i + 1, j + 1),
            intersection
          ];
          
          // Recursively repair both parts
          return [...this.repair(c1), ...this.repair(c2)];
        }
      }
    }
    
    return [contour];
  }

  private static getIntersection(p1: EmbroideryPoint, p2: EmbroideryPoint, p3: EmbroideryPoint, p4: EmbroideryPoint): EmbroideryPoint | null {
    const s1_x = p2.x - p1.x;
    const s1_y = p2.y - p1.y;
    const s2_x = p4.x - p3.x;
    const s2_y = p4.y - p3.y;

    const denom = -s2_x * s1_y + s1_x * s2_y;
    if (Math.abs(denom) < 1e-8) return null; // Parallel or collinear

    const s = (-s1_y * (p1.x - p3.x) + s1_x * (p1.y - p3.y)) / denom;
    const t = ( s2_x * (p1.y - p3.y) - s2_y * (p1.x - p3.x)) / denom;

    if (s > 0.001 && s < 0.999 && t > 0.001 && t < 0.999) {
      return {
        x: p1.x + (t * s1_x),
        y: p1.y + (t * s1_y)
      };
    }

    return null;
  }
}
