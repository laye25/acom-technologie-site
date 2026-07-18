import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';
import { WindingSolver } from './WindingSolver';
import { BoundingBox } from '../TopologyGraph';

export class InclusionSolver {
  public static getBoundingBox(points: EmbroideryPoint[]): BoundingBox {
    if (!points || points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  public static isBboxInside(inner: BoundingBox, outer: BoundingBox): boolean {
    return inner.minX >= outer.minX && inner.maxX <= outer.maxX &&
           inner.minY >= outer.minY && inner.maxY <= outer.maxY;
  }

  public static isInside(poly1: EmbroideryPoint[], bbox1: BoundingBox, poly2: EmbroideryPoint[], bbox2: BoundingBox): boolean {
    if (!this.isBboxInside(bbox1, bbox2)) return false;
    if (poly1.length === 0) return false;
    
    // Check if the first point is inside (assuming valid non-intersecting shapes from geometry pass)
    return WindingSolver.getWindingNumber(poly1[0], poly2) !== 0;
  }
}
