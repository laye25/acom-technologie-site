import { CompilerPass } from '../Pass';
import { ATIR } from '../ATIR';
import { TravelEngine } from '../../travel/TravelEngine';

export class TravelPass implements CompilerPass {
    name = 'TravelPass';
    description = 'Optimizes travel path across generated regions (TSP-PC, entry/exit, trims, jumps).';
    order = 600;

    execute(ir: ATIR): ATIR {
        if (!ir.stitches || ir.stitches.length === 0) {
            return ir; // Nothing to route
        }

        const optimizedPath = TravelEngine.optimize(ir);

        // Store optimized points
        ir.stitches = optimizedPath.points;
        
        // Store travel metrics in metadata
        ir.metadata.travelMetrics = optimizedPath.metrics;

        return ir;
    }
}
