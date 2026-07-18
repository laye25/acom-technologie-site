import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';
import { Region } from '../TopologyGraph';
import { OrientationSolver } from './OrientationSolver';
import { InclusionSolver } from './InclusionSolver';

export class RegionTreeBuilder {
  public static build(contours: EmbroideryPoint[][]): Region[] {
    const regions: Region[] = contours.map((poly, i) => {
      return {
        id: `region_${i}`,
        polygon: poly,
        children: [],
        holes: [],
        isHole: false,
        isIsland: false,
        color: '#000',
        area: OrientationSolver.getArea(poly),
        orientation: OrientationSolver.getOrientation(poly),
        bbox: InclusionSolver.getBoundingBox(poly)
      };
    });

    // Sort by area descending
    regions.sort((a, b) => b.area - a.area);

    for (let i = 0; i < regions.length; i++) {
      const inner = regions[i];
      let parent: Region | null = null;
      
      for (let j = i - 1; j >= 0; j--) {
        const outer = regions[j];
        if (InclusionSolver.isInside(inner.polygon, inner.bbox, outer.polygon, outer.bbox)) {
          if (!parent || parent.area > outer.area) {
             parent = outer;
          }
        }
      }

      if (parent) {
        inner.parent = parent.id;
        parent.children.push(inner.id);
        
        inner.isHole = !parent.isHole;
        inner.isIsland = parent.isHole;

        if (inner.isHole) {
          parent.holes.push(inner.id);
        }
      } else {
        inner.isIsland = true;
        inner.isHole = false;
      }
    }

    return regions;
  }
}
