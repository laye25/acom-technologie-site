import { CompilerPass } from '../Pass';
import { ATIR } from '../ATIR';
import { TatamiEngine } from '../../tatami/TatamiEngine';
import { TatamiConfig } from '../../tatami/types';
import { Region, TopologyGraph } from '../../topology/TopologyGraph';
import { PushPullSolver } from '../../physics/PushPullSolver';
import { FabricModel } from '../../physics/FabricModel';
import { CollisionSolver } from '../../physics/CollisionSolver';
import { NeedleModel } from '../../physics/NeedleModel';

export class TatamiPass implements CompilerPass {
    name = 'TatamiPass';
    
    execute(ir: ATIR, context: any): ATIR {
        const fabric = new FabricModel(context.fabricOptions);
        const needle = new NeedleModel(context.needleOptions);

        const config: TatamiConfig = {
            density: 12, // scaled for demo or use mm
            angle: 45,
            stitchLength: 25,
            offset: 0.25,
            underlay: 'edge'
        };

        if (ir.regions && ir.regions.length > 0) {
            
            // Map RegionNode to Region
            const mappedRegions: Region[] = ir.regions.map(r => {
                const isHole = r.type === 'hole';
                const holesIds = r.children.filter(c => c.type === 'hole').map(c => c.id);
                return {
                    id: r.id,
                    polygon: r.points,
                    children: r.children.map(c => c.id),
                    holes: holesIds,
                    isHole: isHole,
                    isIsland: !isHole,
                    color: '#000000',
                    area: 0,
                    orientation: 'CW',
                    bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
                };
            });
            
            // Also need to flatten children into regions array if they are not already.
            // Assuming ir.regions are flattened in actual pipeline or we just process top level for now.
            // To be safe, we just use the mappedRegions as the graph regions.
            const fakeGraph: TopologyGraph = {
                regions: mappedRegions,
                adjacency: [],
                metrics: { eulerCharacteristic: 0, holesCount: 0, islandsCount: 0, maxDepth: 0, componentsCount: 0 }
            };

            const result = TatamiEngine.generateFills(fakeGraph, config);
            
            const allTatamiSegments = [];
            const density = config.density;

            for (const block of result.blocks) {
                let points = block.points;
                // Apply inverse Push-Pull compensation
                for (let i = 0; i < points.length; i++) {
                    const segment = points[i];
                    for (let j = 0; j < segment.length - 1; j++) {
                        const p1 = segment[j];
                        const p2 = segment[j + 1];

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
                    
                    // Resolve collisions on this segment
                    points[i] = CollisionSolver.resolveCollisions(segment, needle);
                }
                allTatamiSegments.push(...points);
            }
            
            if (!ir.metadata) ir.metadata = {};
            ir.metadata.tatamiSegments = allTatamiSegments;
            
            // Append to stitches for visualization
            if (!ir.stitches) {
                ir.stitches = [];
            }
            allTatamiSegments.forEach(seg => ir.stitches!.push(...seg));
        }

        return ir;
    }
}
