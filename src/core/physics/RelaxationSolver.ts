import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';
import { FabricModel } from './FabricModel';
import { ThreadModel } from './ThreadModel';
import { TensionSolver } from './TensionSolver';

export class RelaxationSolver {
  /**
   * Computes the estimated fabric shrinkage after hoop removal, and 
   * returns the relaxed coordinates of the points.
   */
  static computeRelaxation(points: EmbroideryPoint[], fabric: FabricModel, thread: ThreadModel) {
    if (points.length < 2) {
      return {
        estimatedShrinkage: 0,
        postRelaxationPoints: points
      };
    }

    // Evaluate physical tensions
    const tensionResult = TensionSolver.estimateTension(points, thread, fabric);
    const avgTension = tensionResult.averageTension;

    // Shrinkage increases with fabric elasticity and average tension, decreases with fabric stiffness/thickness
    const baseShrinkagePercentage = (avgTension * fabric.elasticity * 0.8) / (fabric.stiffness * fabric.thickness + 0.1);
    
    // Bound the shrinkage logically between 0% and 15%
    const estimatedShrinkage = Math.max(0, Math.min(15.0, baseShrinkagePercentage * 0.5));

    // Contract points slightly towards their center of mass to simulate relaxation shrinkage
    let sumX = 0;
    let sumY = 0;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
    }
    const cx = sumX / points.length;
    const cy = sumY / points.length;

    const contractionFactor = 1.0 - (estimatedShrinkage / 100.0);
    const postRelaxationPoints = points.map(p => ({
      x: cx + (p.x - cx) * contractionFactor,
      y: cy + (p.y - cy) * contractionFactor
    }));

    return {
      estimatedShrinkage,
      postRelaxationPoints
    };
  }
}

