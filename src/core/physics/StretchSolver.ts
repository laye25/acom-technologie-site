import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';
import { FabricModel } from './FabricModel';
import { ThreadModel } from './ThreadModel';
import { TensionSolver } from './TensionSolver';

export class StretchSolver {
  /**
   * Applies controlled deformation to the physical rendering, without modifying
   * topology, ribbon or rails, by simulating local spring-tension strain.
   */
  static applyDeformation(points: EmbroideryPoint[], fabric: FabricModel, thread: ThreadModel = new ThreadModel()): EmbroideryPoint[] {
    if (points.length < 3) {
      return points;
    }

    const tensionResult = TensionSolver.estimateTension(points, thread, fabric);
    const tensions = tensionResult.tensions;

    const deformed: EmbroideryPoint[] = [];

    // Stiffness and elasticity scale factor
    const scale = (fabric.elasticity / (fabric.stiffness * 10.0 + 1.0)) * 0.15;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let fx = 0;
      let fy = 0;

      // Pull from the previous point
      if (i > 0) {
        const prev = points[i - 1];
        const dx = prev.x - p.x;
        const dy = prev.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.01) {
          const t = tensions[i] || 4.0;
          fx += (dx / dist) * t;
          fy += (dy / dist) * t;
        }
      }

      // Pull from the next point
      if (i < points.length - 1) {
        const next = points[i + 1];
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.01) {
          const t = tensions[i + 1] || 4.0;
          fx += (dx / dist) * t;
          fy += (dy / dist) * t;
        }
      }

      // Deformed position: original + force * strain scale
      // Also apply fabric anisotropy: Y direction might stretch differently than X direction
      const anisFactorX = 1.0 - fabric.anisotropy * 0.5;
      const anisFactorY = 1.0 + fabric.anisotropy * 0.5;

      deformed.push({
        x: p.x + fx * scale * anisFactorX,
        y: p.y + fy * scale * anisFactorY
      });
    }

    return deformed;
  }
}

