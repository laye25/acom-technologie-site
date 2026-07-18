import { Region, TopologyGraph } from '../topology/TopologyGraph';
import { TatamiConfig, TatamiBlock, TatamiMetrics } from './types';
import { TatamiPlanner } from './TatamiPlanner';
import { TatamiValidator } from './TatamiValidator';

export class TatamiEngine {
    /**
     * Generates a Tatami (woven) fill for a given topological region.
     */
    public static generateFills(graph: TopologyGraph, config: TatamiConfig): { blocks: TatamiBlock[], metrics: TatamiMetrics[] } {
        const blocks: TatamiBlock[] = [];
        const metrics: TatamiMetrics[] = [];
        
        for (const region of graph.regions) {
            // Usually, only islands or regions classified for tatami should be filled.
            // For now, if it's not a hole, fill it.
            if (!region.isHole) {
                const block = TatamiPlanner.plan(graph, region, config);
                blocks.push(block);
                metrics.push(TatamiValidator.validate(block));
            }
        }
        
        return { blocks, metrics };
    }
}
