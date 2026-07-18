import { Region } from '../TopologyGraph';

export class EulerSolver {
  public static calculate(regions: Region[]): number {
    let islands = 0;
    let holes = 0;
    
    for (const r of regions) {
      if (r.isIsland) islands++;
      if (r.isHole) holes++;
    }

    return islands - holes;
  }
}
