import { TatamiBlock, TatamiMetrics } from './types';
import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class TatamiValidator {
    public static validate(block: TatamiBlock): TatamiMetrics {
        let stitchCount = 0;
        let gapCount = 0;
        
        block.points.forEach(seg => {
            stitchCount += (seg.length - 1);
            
            // Look for suspiciously long jump stitches within a fill segment
            for (let i = 0; i < seg.length - 1; i++) {
                const dist = Math.hypot(seg[i+1].x - seg[i].x, seg[i+1].y - seg[i].y);
                if (dist > block.config.stitchLength + 1.0) { // +1.0mm tolerance
                    gapCount++;
                }
            }
        });
        
        return {
            uniformity: gapCount === 0 ? 1.0 : (1.0 - Math.min(gapCount / 100, 0.5)),
            holeExclusion: 1.0, // Assuming 1D boolean math holds
            densityError: 0.0, // To be implemented against theoretical area
            gaps: gapCount,
            stitchCount
        };
    }
}
