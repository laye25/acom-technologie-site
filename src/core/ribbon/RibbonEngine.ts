import { TopologyGraph, Region } from '@/src/core/topology/TopologyGraph';
import { Ribbon, RibbonMetrics, RibbonPoint } from './types';
import { SkeletonSolver } from './SkeletonSolver';
import { WidthEstimator } from './WidthEstimator';
import { TangentField } from './TangentField';
import { NormalField } from './NormalField';
import { RailBuilder } from './RailBuilder';
import { CornerResolver } from './CornerResolver';
import { JunctionResolver } from './JunctionResolver';
import { RibbonRelaxation } from './RibbonRelaxation';
import { RibbonValidator } from './RibbonValidator';

export class RibbonEngine {
    public static buildRibbons(graph: TopologyGraph): { ribbons: Ribbon[], metrics: RibbonMetrics[] } {
        let ribbons: Ribbon[] = [];
        const metricsList: RibbonMetrics[] = [];

        // Simple mapping: each region becomes a ribbon
        // In reality, regions might be partitioned, but we'll trace their skeleton for now
        for (const region of graph.regions) {
            if (region.isHole) continue;

            const skeleton = SkeletonSolver.extractSkeleton(region.polygon);
            const widths = WidthEstimator.estimate(skeleton, region.polygon);
            const tangents = TangentField.compute(skeleton);
            const normals = NormalField.compute(skeleton);
            
            // Build the typed centerline
            let centerline: RibbonPoint[] = skeleton.map((pt, i) => ({
                ...pt,
                width: widths[i],
                tangent: tangents[i],
                normal: normals[i]
            }));

            centerline = RibbonRelaxation.relax(centerline);
            
            // Recompute tangents/normals after relaxation
            const relaxedTangents = TangentField.compute(centerline);
            const relaxedNormals = NormalField.compute(centerline);
            for (let i = 0; i < centerline.length; i++) {
                centerline[i].tangent = relaxedTangents[i];
                centerline[i].normal = relaxedNormals[i];
            }

            const rawRails = RailBuilder.build(centerline, widths, relaxedNormals);
            const { left, right } = CornerResolver.resolve(rawRails.left, rawRails.right);
            
            const ribbon: Ribbon = {
                id: `ribbon_${region.id}`,
                centerline,
                leftRail: left,
                rightRail: right,
                widths
            };
            ribbons.push(ribbon);
            metricsList.push(RibbonValidator.validate(ribbon));
        }

        ribbons = JunctionResolver.resolve(ribbons);

        return { ribbons, metrics: metricsList };
    }
}
