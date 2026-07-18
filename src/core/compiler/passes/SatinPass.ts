import { CompilerPass } from '../Pass';
import { ATIR } from '../ATIR';
import { SatinEngine, SatinConfig } from '../../satin/SatinEngine';
import { Ribbon } from '../../ribbon/types';
import { SatinMetricsCalculator, SatinMetrics } from '../../satin/SatinMetricsCalculator';
import { PushPullSolver } from '../../physics/PushPullSolver';
import { FabricModel } from '../../physics/FabricModel';
import { CollisionSolver } from '../../physics/CollisionSolver';
import { NeedleModel } from '../../physics/NeedleModel';

export class SatinPass implements CompilerPass {
    name = 'SatinPass';
    
    execute(ir: ATIR, context: any): ATIR {
        const fabric = new FabricModel(context.fabricOptions);
        const needle = new NeedleModel(context.needleOptions);

        // If ribbons exist in metadata, process them
        if (ir.metadata.ribbons && Array.isArray(ir.metadata.ribbons)) {
            const config: SatinConfig = {
                spacing: 8, // Basic spacing
                pullCompensation: 0.1,
                underlay: 'center'
            };

            const allSatinStitches = [];
            const allMetrics: SatinMetrics[] = [];
            
            for (const ribbon of ir.metadata.ribbons as Ribbon[]) {
                let stitches = SatinEngine.generateStitches(ribbon, config);
                if (stitches.length > 0) {
                    
                    // Apply inverse Push-Pull compensation
                    // Calculate density based on spacing
                    const density = 1.0 / (config.spacing || 8); 
                    
                    for (let i = 0; i < stitches.length - 1; i++) {
                        const p1 = stitches[i];
                        const p2 = stitches[i + 1];
                        
                        // Orientation of the stitch
                        const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                        const angleDeg = angleRad * 180 / Math.PI;

                        const comp = PushPullSolver.computeCompensation({
                            satinOrientation: angleDeg,
                            density: density,
                            fabric: fabric
                        });

                        // Apply inverse vector (-C)
                        p1.x -= comp.offsetX;
                        p1.y -= comp.offsetY;
                    }

                    // Apply collision avoidance
                    stitches = CollisionSolver.resolveCollisions(stitches, needle);

                    allSatinStitches.push(stitches);
                    allMetrics.push(SatinMetricsCalculator.calculateMetrics(ribbon, stitches, config));
                }
            }

            ir.metadata.satinSegments = allSatinStitches;
            ir.metadata.satinMetrics = allMetrics;
            
            // Temporary mapping to ir.stitches for visual debugging
            if (!ir.stitches) {
                ir.stitches = [];
            }
            allSatinStitches.forEach(seg => ir.stitches!.push(...seg));
        }

        return ir;
    }
}
