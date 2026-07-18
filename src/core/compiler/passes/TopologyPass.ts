import { CompilerPass } from '../Pass';
import { ATIR, RegionNode } from '../ATIR';
import { TopologyEngine } from '../../topology/TopologyEngine';
import { Region } from '../../topology/TopologyGraph';

export class TopologyPass implements CompilerPass {
  name = 'TopologyPass';

  execute(ir: ATIR, params: any = {}): ATIR {
    const graph = TopologyEngine.buildGraph(ir.contours);
    
    ir.metadata.topology = {
      euler: graph.metrics.eulerCharacteristic,
      holes: graph.metrics.holesCount,
      islands: graph.metrics.islandsCount,
      components: graph.metrics.componentsCount,
      maxDepth: graph.metrics.maxDepth,
      adjacencyEdges: graph.adjacency.length,
      passVersion: '2.0-industrial'
    };

    const mapRegionToNode = (region: Region): RegionNode => {
      return {
        id: region.id,
        type: region.isHole ? 'hole' : 'island',
        points: region.polygon,
        children: region.children.map(childId => {
          const childRegion = graph.regions.find(r => r.id === childId);
          return childRegion ? mapRegionToNode(childRegion) : null;
        }).filter(Boolean) as RegionNode[]
      };
    };

    ir.regions = graph.regions
      .filter(r => !r.parent)
      .map(mapRegionToNode);

    ir.metadata.topologyGraph = graph;

    return ir;
  }
}
