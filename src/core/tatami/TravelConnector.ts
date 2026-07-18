import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class TravelConnector {
    /**
     * Minimizes jumps by sorting and flipping segments
     */
    public static connect(segments: EmbroideryPoint[][]): EmbroideryPoint[][] {
        if (segments.length <= 1) return segments;
        
        const connected: EmbroideryPoint[][] = [];
        let remaining = [...segments];
        
        // Start with the first segment
        let currentSeg = remaining.shift()!;
        connected.push(currentSeg);
        
        while (remaining.length > 0) {
            let lastPt = currentSeg[currentSeg.length - 1];
            
            let bestIdx = -1;
            let bestDist = Infinity;
            let bestShouldFlip = false;
            
            for (let i = 0; i < remaining.length; i++) {
                const seg = remaining[i];
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
            
            let nextSeg = remaining.splice(bestIdx, 1)[0];
            if (bestShouldFlip) {
                nextSeg.reverse();
            }
            connected.push(nextSeg);
            currentSeg = nextSeg;
        }
        
        return connected;
    }
}
