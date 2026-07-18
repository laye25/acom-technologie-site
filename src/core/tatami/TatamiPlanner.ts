import { Region, TopologyGraph } from '../topology/TopologyGraph';
import { TatamiConfig, TatamiBlock } from './types';
import { AngleField } from './AngleField';
import { DensityField } from './DensityField';
import { RowGenerator } from './RowGenerator';
import { BorderResolver } from './BorderResolver';
import { HoleExclusion } from './HoleExclusion';
import { UnderlayBuilder } from './UnderlayBuilder';
import { TravelConnector } from './TravelConnector';
import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class TatamiPlanner {
    public static plan(graph: TopologyGraph, region: Region, config: TatamiConfig): TatamiBlock {
        const angle = AngleField.compute(region, config.angle);
        const density = DensityField.compute(region, config.density);
        
        // Convert to rotated space
        const rad = (-angle * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        
        const rotatedPoly = region.polygon.map(p => ({
            x: p.x * cosA - p.y * sinA,
            y: p.x * sinA + p.y * cosA
        }));
        
        const rotatedHoles = region.holes.map(holeId => {
            const holeRegion = graph.regions.find(r => r.id === holeId);
            if (holeRegion) {
                return holeRegion.polygon.map(p => ({
                    x: p.x * cosA - p.y * sinA,
                    y: p.x * sinA + p.y * cosA
                }));
            }
            return [];
        }).filter(h => h.length > 0);

        let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
        rotatedPoly.forEach(p => {
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
        });

        const rows = RowGenerator.generate({ minX, maxX, minY, maxY }, { ...config, density }, angle);
        
        const fillSegments: EmbroideryPoint[][] = [];
        
        for (let r = 0; r < rows.length; r++) {
            const yVal = rows[r];
            const intersections: number[] = [];
            
            // Find intersections with outer polygon
            for (let i = 0; i < rotatedPoly.length; i++) {
                const p0 = rotatedPoly[i];
                const p1 = rotatedPoly[(i + 1) % rotatedPoly.length];
                if ((p0.y <= yVal && p1.y > yVal) || (p1.y <= yVal && p0.y > yVal)) {
                    if (Math.abs(p1.y - p0.y) > 1e-6) {
                        const xInt = p0.x + (yVal - p0.y) * (p1.x - p0.x) / (p1.y - p0.y);
                        intersections.push(xInt);
                    }
                }
            }
            intersections.sort((a, b) => a - b);
            
            let lineSegments: {start: number, end: number}[] = [];
            for (let i = 0; i < intersections.length - 1; i += 2) {
                lineSegments.push({ start: intersections[i], end: intersections[i+1] });
            }
            
            // Hole Exclusion
            lineSegments = lineSegments.flatMap(seg => HoleExclusion.process(seg, yVal, rotatedHoles));
            
            // Border Resolution
            lineSegments = BorderResolver.resolve(lineSegments, yVal, rotatedPoly);
            
            // Generate stitch points for this row
            const backRad = (angle * Math.PI) / 180;
            const backCos = Math.cos(backRad);
            const backSin = Math.sin(backRad);
            
            const isEven = r % 2 === 0;
            // The stagger logic: using an offset (e.g. 0.25 -> 25% of stitch length)
            // A typical brick pattern rotates 4 offsets (0, 0.25, 0.5, 0.75).
            const stepIndex = r % Math.floor(1 / config.offset);
            const staggerOffset = stepIndex * config.offset * config.stitchLength;
            
            for (const seg of lineSegments) {
                if (seg.end - seg.start < 0.1) continue;
                
                const pts: EmbroideryPoint[] = [];
                // Add start point
                pts.push({
                    x: seg.start * backCos - yVal * backSin,
                    y: seg.start * backSin + yVal * backCos
                });
                
                // Add internal needle penetrations
                // We want the internal penetrations to align to an absolute grid in the rotated space.
                // grid_x = n * stitchLength + staggerOffset
                
                // Find the first grid_x > seg.start
                let firstStitchX = Math.ceil((seg.start - staggerOffset) / config.stitchLength) * config.stitchLength + staggerOffset;
                
                // Ensure we don't place a needle right on top of the border start point (within tiny tolerance)
                if (firstStitchX - seg.start < 0.1) {
                    firstStitchX += config.stitchLength;
                }
                
                for (let sx = firstStitchX; sx < seg.end - 0.1; sx += config.stitchLength) {
                    pts.push({
                        x: sx * backCos - yVal * backSin,
                        y: sx * backSin + yVal * backCos
                    });
                }
                
                // Add end point
                pts.push({
                    x: seg.end * backCos - yVal * backSin,
                    y: seg.end * backSin + yVal * backCos
                });
                
                if (!isEven) {
                    pts.reverse();
                }
                fillSegments.push(pts);
            }
        }
        
        const underlay = UnderlayBuilder.build(region, config);
        const finalSegments = [...underlay, ...TravelConnector.connect(fillSegments)];
        
        return {
            id: `tatami_${region.id}`,
            regionId: region.id,
            points: finalSegments,
            config
        };
    }
}
