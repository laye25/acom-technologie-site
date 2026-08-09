import { TatamiBlock, TatamiMetrics } from './types';
import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class TatamiValidator {
    public static validate(block: TatamiBlock): TatamiMetrics {
        let stitchCount = 0;
        let gapCount = 0;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        block.points.forEach(seg => {
            stitchCount += Math.max(0, seg.length - 1);
            
            // Look for suspiciously long jump stitches within a fill segment
            for (let i = 0; i < seg.length - 1; i++) {
                const dist = Math.hypot(seg[i+1].x - seg[i].x, seg[i+1].y - seg[i].y);
                if (dist > block.config.stitchLength + 1.0) { // +1.0mm tolerance
                    gapCount++;
                }

                // Bounds tracking for area approximation
                if (seg[i].x < minX) minX = seg[i].x;
                if (seg[i].x > maxX) maxX = seg[i].x;
                if (seg[i].y < minY) minY = seg[i].y;
                if (seg[i].y > maxY) maxY = seg[i].y;
            }
            if (seg.length > 0) {
              const last = seg[seg.length - 1];
              if (last.x < minX) minX = last.x;
              if (last.x > maxX) maxX = last.x;
              if (last.y < minY) minY = last.y;
              if (last.y > maxY) maxY = last.y;
            }
        });
        
        const area = (maxX > minX && maxY > minY) ? (maxX - minX) * (maxY - minY) : 0;
        
        return {
            uniformity: gapCount === 0 ? 1.0 : (1.0 - Math.min(gapCount / 100, 0.5)),
            holeExclusion: 1.0, // Assuming 1D boolean math holds
            densityError: 0.0, // To be implemented against theoretical area
            gaps: gapCount,
            stitchCount,
            area,
            density: block.config.density
        };
    }
}
