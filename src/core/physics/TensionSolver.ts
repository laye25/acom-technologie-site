import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';
import { ThreadModel } from './ThreadModel';
import { FabricModel } from './FabricModel';

export class TensionSolver {
  /**
   * Estimates point-by-point thread tension.
   * Sharp angles and long/short stitch lengths cause tension spikes.
   */
  static estimateTension(points: EmbroideryPoint[], thread: ThreadModel, fabric: FabricModel) {
    if (points.length < 2) {
      return {
        averageTension: 0,
        maxTension: 0,
        criticalZones: [] as number[],
        accumulation: 0,
        tensions: [] as number[]
      };
    }

    let totalTension = 0;
    let maxTension = 0;
    const criticalZones: number[] = [];
    const tensions: number[] = [];

    // Base mechanical tension of the embroidery machine
    const baseTension = 3.5; 
    let bufferedT = baseTension;

    for (let i = 0; i < points.length; i++) {
      let t = baseTension;

      // 1. Length-based tension component
      if (i > 0) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        // If it's a jump stitch (longer than 60 decimillimeters / 6mm), tension is released
        if (len > 60) {
          t = 1.5; // low relaxed jump tension
        } else {
          // Optimal stitch length is around 2.5mm (25 coordinate units)
          // Stitches that are too short (friction/locking) or too long (thread span tension) increase tension
          const lenDiff = Math.abs(len - 25);
          t += lenDiff * 0.04 * (1 / (thread.elasticity + 0.1));

          if (len < 10 && len > 0) { // <1mm
            t += (10 - len) * 0.15;
          }
        }
      }

      // 2. Angular friction component (Euler-Eytelwein formula approximation)
      if (i > 0 && i < points.length - 1) {
        const pPrev = points[i - 1];
        const pCurr = points[i];
        const pNext = points[i + 1];

        const v1x = pCurr.x - pPrev.x;
        const v1y = pCurr.y - pPrev.y;
        const v2x = pNext.x - pCurr.x;
        const v2y = pNext.y - pCurr.y;

        const len1 = Math.hypot(v1x, v1y);
        const len2 = Math.hypot(v2x, v2y);

        if (len1 > 0 && len2 > 0 && len1 <= 60 && len2 <= 60) {
          const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
          const cosAngle = Math.max(-1, Math.min(1, dot));
          const angleRad = Math.acos(cosAngle); // Deviation angle

          // Friction around the needle eye and fabric boundary
          const frictionFactor = Math.exp(thread.frictionCoefficient * angleRad * 0.5);
          t *= frictionFactor;
        }
      }

      // Spring take-up lever buffer (damps fast/instantaneous tension spikes)
      bufferedT = bufferedT + (t - bufferedT) * 0.35;

      tensions.push(bufferedT);
      totalTension += bufferedT;
      if (bufferedT > maxTension) maxTension = bufferedT;

      // Tension spike threshold (e.g. 7.5 N)
      if (bufferedT > 7.5) {
        criticalZones.push(i);
      }
    }

    const averageTension = totalTension / points.length;

    return {
      averageTension,
      maxTension,
      criticalZones,
      accumulation: criticalZones.length / points.length,
      tensions
    };
  }
}

