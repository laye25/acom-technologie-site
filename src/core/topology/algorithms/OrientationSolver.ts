import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class OrientationSolver {
  public static getSignedArea(points: EmbroideryPoint[]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += (points[i].x * points[j].y) - (points[j].x * points[i].y);
    }
    return area / 2;
  }

  public static getOrientation(points: EmbroideryPoint[]): 'CW' | 'CCW' {
    return this.getSignedArea(points) > 0 ? 'CW' : 'CCW';
  }

  public static getArea(points: EmbroideryPoint[]): number {
    return Math.abs(this.getSignedArea(points));
  }
}
