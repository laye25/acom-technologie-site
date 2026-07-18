import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';
import { NeedleModel } from './NeedleModel';

export class CollisionSolver {
  /**
   * Identifies and resolves critical densities using a fast 2D spatial grid.
   * Removes duplicate points or points that are too close, protecting needle and thread.
   */
  static resolveCollisions(points: EmbroideryPoint[], needle: NeedleModel): EmbroideryPoint[] {
    const minDistance = needle.diameter * 0.8; 
    const resolvedPoints: EmbroideryPoint[] = [];
    
    // Spatial Grid Map: key is "gx,gy", value is array of points
    const grid = new Map<string, EmbroideryPoint[]>();
    const cellSize = minDistance;

    const getGridKey = (x: number, y: number) => {
      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);
      return `${gx},${gy}`;
    };

    for (const p of points) {
      let isCollision = false;
      const gx = Math.floor(p.x / cellSize);
      const gy = Math.floor(p.y / cellSize);

      // Check 3x3 neighboring cells for any point that is too close
      neighborLoop:
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${gx + dx},${gy + dy}`;
          const cellPoints = grid.get(key);
          if (cellPoints) {
            for (const rp of cellPoints) {
              const dxDist = p.x - rp.x;
              const dyDist = p.y - rp.y;
              if (dxDist * dxDist + dyDist * dyDist < minDistance * minDistance) {
                isCollision = true;
                break neighborLoop;
              }
            }
          }
        }
      }

      if (!isCollision) {
        resolvedPoints.push({ x: p.x, y: p.y });
        const key = getGridKey(p.x, p.y);
        if (!grid.has(key)) {
          grid.set(key, []);
        }
        grid.get(key)!.push(p);
      }
    }

    return resolvedPoints;
  }

  /**
   * Analyzes penetrations spatially to find heavy needle accumulation zones.
   * Returns collision count and peak local density.
   */
  static analyzePenetrations(points: EmbroideryPoint[], needle: NeedleModel) {
    const diameter = needle.diameter;
    const cellSize = diameter * 2.0; // grid cell for local density check
    const grid = new Map<string, number>();

    let maxDensity = 0;
    let collisionCount = 0;

    for (const p of points) {
      const gx = Math.floor(p.x / cellSize);
      const gy = Math.floor(p.y / cellSize);
      const key = `${gx},${gy}`;
      
      const count = (grid.get(key) || 0) + 1;
      grid.set(key, count);

      if (count > maxDensity) {
        maxDensity = count;
      }
    }

    // A critical collision is defined when more than 8 stitches occupy a single needle cell area
    // In real woven fabrics, fibers displace and slide, represented by a Fiber Displacement Factor
    const fiberDisplacementFactor = 0.3;
    for (const [key, count] of grid.entries()) {
      if (count > 8) {
        collisionCount += Math.round((count - 8) * fiberDisplacementFactor);
      }
    }

    return {
      collisionCount,
      maxDensity,
      grid
    };
  }
}

