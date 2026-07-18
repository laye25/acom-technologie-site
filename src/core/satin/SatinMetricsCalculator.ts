import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';
import { Ribbon } from '../ribbon/types';
import { SatinConfig } from './SatinEngine';

export interface SatinMetrics {
    satinFidelityScore: number;
    widthFidelity: number;
    needleAngleSmoothness: number;
    overlapRate: number;
    threadConsumption: number;
}

export class SatinMetricsCalculator {
    public static calculateMetrics(ribbon: Ribbon, stitches: EmbroideryPoint[], config: SatinConfig): SatinMetrics {
        if (!stitches || stitches.length < 2) {
            return {
                satinFidelityScore: 0,
                widthFidelity: 0,
                needleAngleSmoothness: 0,
                overlapRate: 0,
                threadConsumption: 0
            };
        }

        let threadConsumption = 0;
        let angleChanges = 0;
        let totalAngles = 0;
        let totalWidthError = 0;
        let numWidthSamples = 0;
        let overlappingSegments = 0;

        for (let i = 0; i < stitches.length - 1; i++) {
            const p1 = stitches[i];
            const p2 = stitches[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            threadConsumption += dist;

            // Approximate width fidelity based on stitch length vs ribbon width
            // A perfect satin stitch goes edge to edge (plus pull compensation)
            // But we don't know exactly which centerline point this stitch corresponds to here,
            // we can approximate.
            
            if (i > 0 && i < stitches.length - 2) {
                const prevP1 = stitches[i - 1];
                const prevDx = p1.x - prevP1.x;
                const prevDy = p1.y - prevP1.y;
                const angle1 = Math.atan2(prevDy, prevDx);
                const angle2 = Math.atan2(dy, dx);
                let diff = Math.abs(angle1 - angle2);
                if (diff > Math.PI) diff = 2 * Math.PI - diff;
                
                // For zigzag, angle changes sharply at edges, but the needle angle 
                // is the angle of the stitch across the ribbon.
                if (i % 2 === 0) { // crossing stitches
                    angleChanges += diff;
                    totalAngles++;
                }
            }
        }

        // Check for acute angles that could cause overlap
        let overlapPoints = 0;
        for (let i = 2; i < stitches.length; i++) {
            const p1 = stitches[i - 2];
            const p2 = stitches[i - 1];
            const p3 = stitches[i];
            
            // Check distance between stitches on same side
            const dist = Math.sqrt((p3.x - p1.x)**2 + (p3.y - p1.y)**2);
            if (dist < (config.spacing * 0.2)) {
                overlapPoints++;
            }
        }
        
        const overlapRate = overlapPoints / (stitches.length || 1);
        const widthFidelity = 100 - (overlapRate * 5); // Rough approximation
        const needleAngleSmoothness = totalAngles > 0 ? 1 - (angleChanges / totalAngles / Math.PI) : 1;
        const satinFidelityScore = (widthFidelity * 0.7) + (needleAngleSmoothness * 30);

        return {
            satinFidelityScore,
            widthFidelity,
            needleAngleSmoothness,
            overlapRate,
            threadConsumption
        };
    }
}
