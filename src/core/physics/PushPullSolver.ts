import { FabricModel } from './FabricModel';
import { ThreadModel } from './ThreadModel';

export interface PushPullParams {
  satinOrientation: number;
  density: number;
  fabric: FabricModel;
  thread?: ThreadModel;
}

export class PushPullSolver {
  // Calibration coefficients for fabrics based on real-world textile experiments (ATCP Lab)
  private static fabricCoefficients: Record<string, { pullFactor: number; pushFactor: number }> = {
    cotton: { pullFactor: 0.14, pushFactor: 0.08 },
    denim: { pullFactor: 0.09, pushFactor: 0.18 },
    silk: { pullFactor: 0.25, pushFactor: 0.04 },
    leather: { pullFactor: 0.05, pushFactor: 0.22 },
    jersey: { pullFactor: 0.30, pushFactor: 0.05 },
    polyester: { pullFactor: 0.15, pushFactor: 0.11 },
    default: { pullFactor: 0.15, pushFactor: 0.10 }
  };

  // Calibration modifiers for threads based on elasticity and friction
  private static threadModifiers: Record<string, number> = {
    polyester: 1.0,
    rayon: 1.15,
    cotton: 0.82,
    nylon: 1.35,
    default: 1.0
  };

  static computeCompensation(params: PushPullParams): { offsetX: number, offsetY: number } {
    // Determine the fabric type and retrieve its coefficients
    const fabricType = (params.fabric as any).type || 'default';
    const coeffs = this.fabricCoefficients[fabricType.toLowerCase()] || this.fabricCoefficients.default;

    // Determine the thread modifier
    const threadType = params.thread?.type || 'default';
    const threadMod = this.threadModifiers[threadType.toLowerCase()] || this.threadModifiers.default;

    const elasticity = params.fabric.elasticity;
    const thickness = params.fabric.thickness;

    // Physical formula for Push and Pull offsets
    const basePull = coeffs.pullFactor * elasticity * params.density * threadMod;
    const basePush = coeffs.pushFactor * (thickness + 0.5) * params.density * threadMod;

    const angleRad = params.satinOrientation * Math.PI / 180;
    
    // Pull is parallel to the stitch
    const pullX = Math.cos(angleRad) * basePull;
    const pullY = Math.sin(angleRad) * basePull;

    // Push is perpendicular to the stitch
    const pushX = Math.cos(angleRad + Math.PI / 2) * basePush;
    const pushY = Math.sin(angleRad + Math.PI / 2) * basePush;

    return {
      offsetX: pullX + pushX,
      offsetY: pullY + pushY
    };
  }
}

