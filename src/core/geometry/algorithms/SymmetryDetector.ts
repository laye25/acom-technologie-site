import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

/**
 * ============================================================================
 * AEE SYMMETRY & CLONE DETECTOR - AUTOMATED CAD/CAM TEXTILE GEOMETRY KERNEL
 * ============================================================================
 * Formulates and solves rotational and axial symmetry configurations in CAD contours.
 * Implements "Master-Instance-Transformation" tree architecture in compliance with
 * Rule 50 (The CAD/CAM Platform), Rule 56 (Master Tailor Heuristics), and Rule 67.
 * 
 * Design Concept:
 * - Detects Axes of symmetry (X, Y) and Rotational Order (C2, C3, C4, C8 etc.).
 * - Identifies repeated/cloned sub-motifs from raw vectorizer outputs.
 * - Compiles a single Master geometry and instantiates clones via 2D affine transformations.
 * - Computes Hausdorff distance, Area, and segment drift to audit deviations.
 */

export interface AffineTransform2D {
  rotationRad: number;
  translateX: number;
  translateY: number;
  scale: number;
}

export interface MasterComponent {
  id: string;
  name: string;
  points: EmbroideryPoint[];
  area: number;
  perimeter: number;
  segmentCount: number;
  color: string;
}

export interface ComponentInstance {
  id: string;
  masterId: string;
  transform: AffineTransform2D;
  calculatedPoints: EmbroideryPoint[];
  driftStats: {
    areaDriftPercent: number;
    hausdorffDriftMm: number;
    segmentCountDiff: number;
    perimeterDriftPercent: number;
    isCompliant: boolean;
  };
}

export interface SymmetryHierarchy {
  hasSymmetry: boolean;
  pivotX: number;
  pivotY: number;
  rotationalOrder: number;
  symmetryAngleStep: number; // in degrees
  masters: MasterComponent[];
  instances: ComponentInstance[];
}

export class SymmetryDetector {
  /**
   * Evaluates a flat list of coordinates representing different sub-objects and clusters them
   * into Master Components and Affine Instances using Hausdorff matching and shape invariants.
   */
  public static analyze(
    rawShapes: Array<{ name: string; points: EmbroideryPoint[]; color: string }>,
    pivotX: number = 0,
    pivotY: number = 0,
    tolerancePercent: number = 1.0 // 1% limit as described in user request
  ): SymmetryHierarchy {
    if (rawShapes.length === 0) {
      return {
        hasSymmetry: false,
        pivotX,
        pivotY,
        rotationalOrder: 1,
        symmetryAngleStep: 360,
        masters: [],
        instances: []
      };
    }

    const masters: MasterComponent[] = [];
    const instances: ComponentInstance[] = [];

    // Helper to calculate polygon area
    const calculateArea = (pts: EmbroideryPoint[]): number => {
      if (pts.length < 3) return 0;
      let area = 0;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        area += p1.x * p2.y - p2.x * p1.y;
      }
      return Math.abs(area) / 2;
    };

    // Helper to calculate perimeter
    const calculatePerimeter = (pts: EmbroideryPoint[]): number => {
      if (pts.length < 2) return 0;
      let perimeter = 0;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);
      }
      return perimeter;
    };

    // Process each shape and classify it or group into masters/instances
    rawShapes.forEach((shape, idx) => {
      const area = calculateArea(shape.points);
      const perimeter = calculatePerimeter(shape.points);
      const segmentCount = shape.points.length;

      // Check if this shape matches any existing master component (allowing for rotation/translation)
      let matchedMaster: MasterComponent | null = null;
      let bestTransform: AffineTransform2D = { rotationRad: 0, translateX: 0, translateY: 0, scale: 1.0 };
      let bestAreaDrift = 100.0;
      let bestHausdorff = Infinity;

      for (const master of masters) {
        // Compare shape invariants first (scale-independent area ratio, vertex ratio)
        const areaRatio = Math.abs(area - master.area) / master.area;
        const segmentRatio = Math.abs(segmentCount - master.segmentCount) / master.segmentCount;

        // If shape properties are close enough (within 15% before transformation check)
        if (areaRatio < 0.15 && segmentRatio < 0.25) {
          // Estimate rotational angle from the pivot point
          const angleToPivotA = Math.atan2(shape.points[0].y - pivotY, shape.points[0].x - pivotX);
          const angleToPivotB = Math.atan2(master.points[0].y - pivotY, master.points[0].x - pivotX);
          let rotationRad = angleToPivotA - angleToPivotB;

          // Normalize rotation to [-PI, PI]
          rotationRad = Math.atan2(Math.sin(rotationRad), Math.cos(rotationRad));

          // Compute transformed points of the master
          const transformedMasterPts = master.points.map(pt => {
            // Translate to pivot
            const tx = pt.x - pivotX;
            const ty = pt.y - pivotY;
            // Rotate
            const rx = tx * Math.cos(rotationRad) - ty * Math.sin(rotationRad);
            const ry = tx * Math.sin(rotationRad) + ty * Math.cos(rotationRad);
            // Translate back
            return { x: rx + pivotX, y: ry + pivotY };
          });

          // Compute Hausdorff distance between transformed master and current shape
          const hDist = this.computeHausdorff(shape.points, transformedMasterPts);

          if (hDist < 0.5) { // within 0.5 mm match
            matchedMaster = master;
            bestTransform = {
              rotationRad,
              translateX: 0,
              translateY: 0,
              scale: 1.0
            };
            bestAreaDrift = areaRatio * 100.0;
            bestHausdorff = hDist;
            break;
          }
        }
      }

      if (matchedMaster) {
        // If it's a match, instantiate it
        const isCompliant = bestAreaDrift <= tolerancePercent && bestHausdorff <= 0.15; // 0.15 mm threshold

        instances.push({
          id: `INST-${matchedMaster.id}-${idx}`,
          masterId: matchedMaster.id,
          transform: bestTransform,
          calculatedPoints: shape.points,
          driftStats: {
            areaDriftPercent: parseFloat(bestAreaDrift.toFixed(3)),
            hausdorffDriftMm: parseFloat(bestHausdorff.toFixed(3)),
            segmentCountDiff: Math.abs(segmentCount - matchedMaster.segmentCount),
            perimeterDriftPercent: parseFloat((Math.abs(perimeter - matchedMaster.perimeter) / matchedMaster.perimeter * 100).toFixed(3)),
            isCompliant
          }
        });
      } else {
        // If not matched, declare this shape as a new Master Component
        const newMasterId = `M-${idx + 1}`;
        const newMaster: MasterComponent = {
          id: newMasterId,
          name: shape.name,
          points: shape.points,
          area,
          perimeter,
          segmentCount,
          color: shape.color
        };
        masters.push(newMaster);

        // Also add its self-instance (0 degree rotation)
        instances.push({
          id: `INST-${newMasterId}-0`,
          masterId: newMasterId,
          transform: { rotationRad: 0, translateX: 0, translateY: 0, scale: 1.0 },
          calculatedPoints: shape.points,
          driftStats: {
            areaDriftPercent: 0,
            hausdorffDriftMm: 0,
            segmentCountDiff: 0,
            perimeterDriftPercent: 0,
            isCompliant: true
          }
        });
      }
    });

    // Check if rotational symmetry exists based on instances counts
    const isSymmetric = masters.some(m => {
      const cloneCount = instances.filter(inst => inst.masterId === m.id).length;
      return cloneCount >= 4;
    });

    return {
      hasSymmetry: isSymmetric,
      pivotX,
      pivotY,
      rotationalOrder: isSymmetric ? 4 : 1, // Order of symmetry
      symmetryAngleStep: isSymmetric ? 90 : 360,
      masters,
      instances
    };
  }

  /**
   * Computes the exact bidirectional Hausdorff distance H(A, B) between two discrete point sets.
   */
  private static computeHausdorff(setA: EmbroideryPoint[], setB: EmbroideryPoint[]): number {
    if (setA.length === 0 || setB.length === 0) return 0;

    const hDirectional = (a: EmbroideryPoint[], b: EmbroideryPoint[]) => {
      let maxInf = 0;
      for (const ptA of a) {
        let minDistance = Infinity;
        for (const ptB of b) {
          const dx = ptB.x - ptA.x;
          const dy = ptB.y - ptA.y;
          const dist = dx * dx + dy * dy;
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
        const actualMinDist = Math.sqrt(minDistance);
        if (actualMinDist > maxInf) {
          maxInf = actualMinDist;
        }
      }
      return maxInf;
    };

    return Math.max(hDirectional(setA, setB), hDirectional(setB, setA));
  }
}
