import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';
import { RibbonPoint } from './types';

export class RibbonRelaxation {
    public static relax(centerline: RibbonPoint[]): RibbonPoint[] {
        // Simple Laplacian smoothing on the centerline
        if (centerline.length < 3) return centerline;
        
        const smoothed = [...centerline];
        const iterations = 30; // High smoothing to handle noisy curves like Motif B
        
        for (let it = 0; it < iterations; it++) {
            const temp = [...smoothed];
            for (let i = 1; i < smoothed.length - 1; i++) {
                temp[i] = {
                    x: (smoothed[i-1].x + smoothed[i+1].x) / 2,
                    y: (smoothed[i-1].y + smoothed[i+1].y) / 2,
                    width: smoothed[i].width,
                    tangent: smoothed[i].tangent,
                    normal: smoothed[i].normal
                };
            }
            for (let i = 1; i < smoothed.length - 1; i++) {
                smoothed[i] = temp[i];
            }
        }
        
        return smoothed;
    }
}
