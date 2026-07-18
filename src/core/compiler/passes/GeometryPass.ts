import { CompilerPass } from '../Pass';
import { ATIR } from '../ATIR';
import { NoiseFilter } from '../../geometry/GeometryEngine';
import { SelfIntersectionRepair } from '../../geometry/algorithms/SelfIntersectionRepair';
import { AdaptiveRDP } from '../../geometry/algorithms/AdaptiveRDP';
import { ArcFitter } from '../../geometry/algorithms/ArcFitter';
import { CurvatureAwareResampler } from '../../geometry/algorithms/CurvatureAwareResampler';
import { MetricsCalculator } from '../../geometry/algorithms/MetricsCalculator';

export class GeometryPass implements CompilerPass {
  name = 'GeometryPass';

  execute(ir: ATIR, params: any = {}): ATIR {
    const newContours = [];
    let totalRMS = 0;
    let totalHausdorff = 0;

    const baseEpsilon = params.baseEpsilon || 0.5;
    const minEpsilon = params.minEpsilon || 0.05;
    const resampleStep = params.resampleStep || 2.0;
    const minStep = params.minStep || 0.5;
    const arcTolerance = params.arcTolerance || 0.15;

    for (const contour of ir.contours) {
      if (contour.length === 0) continue;

      // 1. Noise Filter (Remove duplicate/overlapping points)
      const filtered = NoiseFilter.remove(contour, 0.05);

      // 2. Self Intersection Repair
      const repairedContours = SelfIntersectionRepair.repair(filtered);

      for (const repaired of repairedContours) {
        // 3. Adaptive RDP Simplification
        const simplified = AdaptiveRDP.simplify(repaired, baseEpsilon, minEpsilon);

        // 4. Arc Fitting (Replace polyline curves with true arc point samples)
        const arcFitted = ArcFitter.fit(simplified, arcTolerance);

        // 5. Curvature-Aware Resampling (Optimize for later Topology pass)
        const finalPoints = CurvatureAwareResampler.resample(arcFitted, resampleStep, minStep);

        // Analytics (for Golden Dataset Evaluation)
        totalRMS += MetricsCalculator.calculateRMS(contour, finalPoints);
        totalHausdorff = Math.max(totalHausdorff, MetricsCalculator.calculateHausdorff(contour, finalPoints));

        newContours.push(finalPoints);
      }
    }

    // Attach geometric metrics to the IR metadata
    ir.metadata.geometry = {
      rms: totalRMS / Math.max(1, ir.contours.length),
      hausdorff: totalHausdorff,
      passVersion: '2.0-industrial'
    };

    ir.contours = newContours;
    return ir;
  }
}
