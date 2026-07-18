import { CompilerPass } from '../Pass';
import { ATIR } from '../ATIR';
import { RibbonEngine } from '../../ribbon/RibbonEngine';
import { TopologyEngine } from '../../topology/TopologyEngine';

export class RibbonPass implements CompilerPass {
    name = 'RibbonPass';

    execute(ir: ATIR, context: any): ATIR {
        // Rebuild graph from ATIR contours (or read if it was stored)
        // Since TopologyPass outputs regions but maybe not the full graph to ATIR,
        // we'll rebuild graph here just to be safe, or we could pass the graph in ATIR.
        // For simplicity, let's assume TopologyEngine.buildGraph works on ir.contours.
        // But wait, the regions might be different...
        // Let's use the contours directly.
        const graph = TopologyEngine.buildGraph(ir.contours);
        const result = RibbonEngine.buildRibbons(graph);
        
        ir.metadata.ribbonMetrics = result.metrics;
        
        // In this sprint, we store the ribbon data into the ATIR
        if (result.ribbons.length > 0) {
            // Using the first ribbon for global skeleton/rails for now,
            // or merging them if ATIR only supports one global set.
            // Wait, ATIR has skeleton?: EmbroideryPoint[], widths?: number[], leftRail?, rightRail?
            // Let's flatten or take the first one. Or better, update ATIR later.
            // For now, take the first ribbon.
            const first = result.ribbons[0];
            ir.skeleton = first.centerline;
            ir.widths = first.widths;
            ir.leftRail = first.leftRail;
            ir.rightRail = first.rightRail;
            
            // To support multiple ribbons properly, we could store it in metadata:
            ir.metadata.ribbons = result.ribbons;
        }

        return ir;
    }
}
