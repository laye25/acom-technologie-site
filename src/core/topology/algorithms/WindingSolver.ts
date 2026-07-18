import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class WindingSolver {
  public static getWindingNumber(p: EmbroideryPoint, poly: EmbroideryPoint[]): number {
    let wn = 0;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];

      if (p1.y <= p.y) {
        if (p2.y > p.y) {
          if (this.isLeft(p1, p2, p) > 0) {
            wn++;
          }
        }
      } else {
        if (p2.y <= p.y) {
          if (this.isLeft(p1, p2, p) < 0) {
            wn--;
          }
        }
      }
    }
    return wn;
  }

  private static isLeft(p0: EmbroideryPoint, p1: EmbroideryPoint, p2: EmbroideryPoint): number {
    return ((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y));
  }
}
