import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';
import { TopologyGraph, Region } from './TopologyGraph';
import { RegionTreeBuilder } from './algorithms/RegionTreeBuilder';
import { EulerSolver } from './algorithms/EulerSolver';
import { AdjacencySolver } from './algorithms/AdjacencySolver';
import { BooleanRegionBuilder } from './algorithms/BooleanRegionBuilder';

export class TopologyEngine {
  public static buildGraph(contours: EmbroideryPoint[][]): TopologyGraph {
    const regions = RegionTreeBuilder.build(contours);
    const adjacency = AdjacencySolver.buildAdjacency(regions);
    BooleanRegionBuilder.buildComplexRegions(regions);

    let maxDepth = 0;
    const calculateDepth = (region: Region, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      for (const childId of region.children) {
        const child = regions.find(r => r.id === childId);
        if (child) calculateDepth(child, depth + 1);
      }
    };

    const rootRegions = regions.filter(r => !r.parent);
    for (const root of rootRegions) {
      calculateDepth(root, 1);
    }

    const holesCount = regions.filter(r => r.isHole).length;
    const islandsCount = regions.filter(r => r.isIsland).length;

    const metrics = {
      eulerCharacteristic: EulerSolver.calculate(regions),
      holesCount,
      islandsCount,
      maxDepth,
      componentsCount: rootRegions.length
    };

    return {
      regions,
      adjacency,
      metrics
    };
  }
}
