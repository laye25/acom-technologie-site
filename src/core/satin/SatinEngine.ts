import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';
import { Ribbon } from '../ribbon/types';

export interface SatinConfig {
    spacing: number;
    pullCompensation: number;
    underlay: 'none' | 'center' | 'edge' | 'zigzag';
}

export class SatinEngine {
    /**
     * Converts a ribbon into a series of satin stitches with adaptive interpolation.
     * @param ribbon The ribbon structure
     * @param config The satin stitch configuration
     * @returns An array of EmbroideryPoint representing the continuous stitch path
     */
    public static generateStitches(ribbon: Ribbon, config: SatinConfig): EmbroideryPoint[] {
        const stitches: EmbroideryPoint[] = [];
        if (!ribbon.leftRail || !ribbon.rightRail || ribbon.leftRail.length === 0 || ribbon.centerline.length === 0) {
            return stitches;
        }

        // 1. Generate Underlay (if needed)
        const underlay = this.generateUnderlay(ribbon, config.underlay);
        if (underlay.length > 0) {
            stitches.push(...underlay);
        }

        // 2. Generate Top Cover (Satin Zigzag) with adaptive interpolation
        const zigzagStitches: EmbroideryPoint[] = [];
        let toggle = true; // true = Left->Right, false = Right->Left

        let lastLeft = ribbon.leftRail[0];
        let lastRight = ribbon.rightRail[0];

        // Process each segment of the centerline
        for (let i = 0; i < ribbon.centerline.length - 1; i++) {
            const p1 = ribbon.centerline[i];
            const p2 = ribbon.centerline[i + 1];
            
            const l1 = ribbon.leftRail[i];
            const l2 = ribbon.leftRail[i + 1];
            const r1 = ribbon.rightRail[i];
            const r2 = ribbon.rightRail[i + 1];

            // Centerline segment length
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Calculate number of interpolation steps based on spacing
            const numSteps = Math.max(1, Math.round(dist / config.spacing));

            for (let step = 0; step < numSteps; step++) {
                const t = step / numSteps;

                // Interpolated points on rails
                const curL = {
                    x: l1.x + t * (l2.x - l1.x),
                    y: l1.y + t * (l2.y - l1.y)
                };
                const curR = {
                    x: r1.x + t * (r2.x - r1.x),
                    y: r1.y + t * (r2.y - r1.y)
                };

                // Apply pull compensation (extend points slightly outward)
                const segDx = curR.x - curL.x;
                const segDy = curR.y - curL.y;
                const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
                
                let compL = curL;
                let compR = curR;
                
                if (segLen > 0) {
                    const nx = (segDx / segLen) * config.pullCompensation;
                    const ny = (segDy / segLen) * config.pullCompensation;
                    compL = { x: curL.x - nx, y: curL.y - ny };
                    compR = { x: curR.x + nx, y: curR.y + ny };
                }

                // Check density on inner curves to avoid thread build-up (surdensité)
                const distL = Math.sqrt((compL.x - lastLeft.x) ** 2 + (compL.y - lastLeft.y) ** 2);
                const distR = Math.sqrt((compR.x - lastRight.x) ** 2 + (compR.y - lastRight.y) ** 2);

                const densityThreshold = config.spacing * 0.4; // threshold for too close

                let finalL = compL;
                let finalR = compR;
                const curC = {
                    x: p1.x + t * (p2.x - p1.x),
                    y: p1.y + t * (p2.y - p1.y)
                };

                if (distL < densityThreshold && toggle) {
                    // Short stitch on left
                    finalL = {
                        x: curC.x + 0.5 * (compL.x - curC.x),
                        y: curC.y + 0.5 * (compL.y - curC.y)
                    };
                }

                if (distR < densityThreshold && !toggle) {
                    // Short stitch on right
                    finalR = {
                        x: curC.x + 0.5 * (compR.x - curC.x),
                        y: curC.y + 0.5 * (compR.y - curC.y)
                    };
                }

                if (toggle) {
                    zigzagStitches.push(finalL);
                    zigzagStitches.push(finalR);
                } else {
                    zigzagStitches.push(finalR);
                    zigzagStitches.push(finalL);
                }
                
                toggle = !toggle;
                lastLeft = finalL;
                lastRight = finalR;
            }
        }
        
        // Push the last points
        const lastI = ribbon.centerline.length - 1;
        if (toggle) {
            zigzagStitches.push(ribbon.leftRail[lastI]);
            zigzagStitches.push(ribbon.rightRail[lastI]);
        } else {
            zigzagStitches.push(ribbon.rightRail[lastI]);
            zigzagStitches.push(ribbon.leftRail[lastI]);
        }

        stitches.push(...zigzagStitches);
        return stitches;
    }

    private static generateUnderlay(ribbon: Ribbon, type: string): EmbroideryPoint[] {
        const underlay: EmbroideryPoint[] = [];
        if (type === 'center' || type === 'zigzag') {
            underlay.push(...ribbon.centerline.map(p => ({ x: p.x, y: p.y })));
            // return backwards to start
            for (let i = ribbon.centerline.length - 1; i >= 0; i--) {
                underlay.push({ x: ribbon.centerline[i].x, y: ribbon.centerline[i].y });
            }
        } else if (type === 'edge') {
            underlay.push(...ribbon.leftRail.map(p => ({ x: p.x, y: p.y })));
            for (let i = ribbon.rightRail.length - 1; i >= 0; i--) {
                underlay.push({ x: ribbon.rightRail[i].x, y: ribbon.rightRail[i].y });
            }
            underlay.push({ x: ribbon.leftRail[0].x, y: ribbon.leftRail[0].y });
        }
        return underlay;
    }
}
