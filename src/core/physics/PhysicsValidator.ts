import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';
import { FabricModel } from './FabricModel';
import { ThreadModel } from './ThreadModel';
import { NeedleModel } from './NeedleModel';
import { PhysicsMetrics } from './PhysicsMetrics';
import { TensionSolver } from './TensionSolver';
import { CollisionSolver } from './CollisionSolver';
import { BucklingSolver } from './BucklingSolver';
import { RelaxationSolver } from './RelaxationSolver';

export class PhysicsValidator {
  static validate(points: EmbroideryPoint[], fabric: FabricModel, thread: ThreadModel, needle: NeedleModel): PhysicsMetrics {
    const startTime = performance.now();
    
    if (points.length === 0) {
      return {
        physicsScore: 100,
        fabricDistortion: 0,
        threadTension: 0,
        pushPullError: 0,
        bucklingRisk: 0,
        needleStress: 0,
        collisionIndex: 0,
        densityPressure: 0,
        estimatedShrinkage: 0,
        simulationTimeMs: performance.now() - startTime
      };
    }

    // 1. Calculate point-by-point tensions and detect spikes
    const tensionResult = TensionSolver.estimateTension(points, thread, fabric);
    const averageTension = tensionResult.averageTension;
    const tensionSpikes = tensionResult.criticalZones.length;

    // 2. Analyze spatial penetrations and peak local densities using our spatial grid
    const penetrationResult = CollisionSolver.analyzePenetrations(points, needle);
    const collisionCount = penetrationResult.collisionCount;
    const maxDensity = penetrationResult.maxDensity;

    // 3. Evaluate local buckling risk based on peak local density
    // Underlay and stabilizer backing reduce buckling risk by 50%
    const stabilizationFactor = 0.5;
    const bucklingRisk = BucklingSolver.evaluateBucklingRisk(maxDensity, fabric) * stabilizationFactor;

    // 4. Calculate post-hoop relaxation shrinkage
    const relaxationResult = RelaxationSolver.computeRelaxation(points, fabric, thread);
    const estimatedShrinkage = relaxationResult.estimatedShrinkage * stabilizationFactor;

    // 5. Calculate physical fabric distortion & push/pull residual error with stabilization
    const fabricDistortion = ((averageTension * fabric.elasticity * 0.4) / (fabric.stiffness + 0.1)) * stabilizationFactor;
    const pushPullError = fabricDistortion; 

    // 6. Calculate physical stress on the needle (amplified by machine speed)
    const needleStress = (collisionCount / points.length) * 100.0 * (needle.speed / 1000.0);

    // 7. Calculate overall Physics Quality/Fidelity Score with real physical penalties
    let physicsScore = 100.0;

    // Penalties:
    // Tension Penalty: too tight or high spikes
    if (averageTension > 5.5) {
      physicsScore -= Math.min(25, (averageTension - 5.5) * 8);
    }
    physicsScore -= Math.min(20, tensionSpikes * 2);

    // Buckling Penalty
    if (bucklingRisk > 30) {
      physicsScore -= Math.min(20, (bucklingRisk - 30) * 0.4);
    }

    // Collision / Spatial Grid Penetration Penalty
    physicsScore -= Math.min(30, collisionCount * 1.5);

    // Push/Pull Distortion Penalty
    if (pushPullError > 1.2) {
      physicsScore -= Math.min(20, (pushPullError - 1.2) * 10);
    }

    // Needle Stress Penalty
    physicsScore -= Math.min(15, needleStress * 0.3);

    const metrics: PhysicsMetrics = {
      physicsScore: Math.max(0, Math.min(100, Math.round(physicsScore))),
      fabricDistortion: parseFloat(fabricDistortion.toFixed(3)),
      threadTension: parseFloat(averageTension.toFixed(3)),
      pushPullError: parseFloat(pushPullError.toFixed(3)),
      bucklingRisk: parseFloat(bucklingRisk.toFixed(3)),
      needleStress: parseFloat(needleStress.toFixed(3)),
      collisionIndex: collisionCount,
      densityPressure: parseFloat((points.length / 100.0).toFixed(3)), 
      estimatedShrinkage: parseFloat(estimatedShrinkage.toFixed(3)),
      simulationTimeMs: parseFloat((performance.now() - startTime).toFixed(3))
    };

    return metrics;
  }
}

