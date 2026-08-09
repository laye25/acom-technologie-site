import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class TravelConnector {
    /**
     * Minimizes jumps by sorting and flipping segments
     */
    public static connect(segments: EmbroideryPoint[][]): EmbroideryPoint[][] {
        const validSegments = segments.filter(seg => seg && seg.length > 0);
        if (validSegments.length <= 1) return validSegments;
        
        const connected: EmbroideryPoint[][] = [];
        let remaining = [...validSegments];
        
        // Start with the first segment
        let currentSeg = remaining.shift()!;
        connected.push(currentSeg);
        
        while (remaining.length > 0) {
            let lastPt = currentSeg[currentSeg.length - 1] || { x: 0, y: 0 };
            
            let bestIdx = 0;
            let bestDist = Infinity;
            let bestShouldFlip = false;
            
            for (let i = 0; i < remaining.length; i++) {
                const seg = remaining[i];
                if (!seg || seg.length === 0) continue;
                const startPt = seg[0];
                const endPt = seg[seg.length - 1];
                
                const distToStart = Math.hypot(startPt.x - lastPt.x, startPt.y - lastPt.y);
                const distToEnd = Math.hypot(endPt.x - lastPt.x, endPt.y - lastPt.y);
                
                if (distToStart < bestDist) {
                    bestDist = distToStart;
                    bestIdx = i;
                    bestShouldFlip = false;
                }
                
                if (distToEnd < bestDist) {
                    bestDist = distToEnd;
                    bestIdx = i;
                    bestShouldFlip = true;
                }
            }
            
            if (bestIdx < 0 || bestIdx >= remaining.length) {
                bestIdx = 0;
            }
            
            let nextSeg = remaining.splice(bestIdx, 1)[0];
            if (nextSeg) {
                if (bestShouldFlip) {
                    nextSeg.reverse();
                }
                connected.push(nextSeg);
                currentSeg = nextSeg;
            }
        }
        
        return connected;
    }
}
