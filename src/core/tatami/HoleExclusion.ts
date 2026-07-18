import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class HoleExclusion {
    /**
     * Process 1D boolean difference: segment - holes
     */
    public static process(scanline: { start: number, end: number }, y: number, holes: EmbroideryPoint[][]): { start: number, end: number }[] {
        let validSegments = [scanline];
        
        for (const hole of holes) {
            const intersections: number[] = [];
            // Find intersections of scanline with this hole polygon
            for (let i = 0; i < hole.length; i++) {
                const p0 = hole[i];
                const p1 = hole[(i + 1) % hole.length];
                if ((p0.y <= y && p1.y > y) || (p1.y <= y && p0.y > y)) {
                    if (Math.abs(p1.y - p0.y) > 1e-6) {
                        const xInt = p0.x + (y - p0.y) * (p1.x - p0.x) / (p1.y - p0.y);
                        intersections.push(xInt);
                    }
                }
            }
            intersections.sort((a, b) => a - b);
            
            // Generate hole solid segments along this scanline
            const holeSegments: {start: number, end: number}[] = [];
            for (let i = 0; i < intersections.length - 1; i += 2) {
                holeSegments.push({ start: intersections[i], end: intersections[i+1] });
            }
            
            // Subtract hole segments from valid segments
            const newValidSegments: {start: number, end: number}[] = [];
            for (const validSeg of validSegments) {
                let currentStart = validSeg.start;
                
                for (const hSeg of holeSegments) {
                    if (hSeg.end <= currentStart) continue; // Hole segment is before our valid segment
                    if (hSeg.start >= validSeg.end) break; // Hole segment is after our valid segment
                    
                    if (hSeg.start > currentStart) {
                        // Part of valid segment is before hole segment
                        newValidSegments.push({ start: currentStart, end: hSeg.start });
                    }
                    currentStart = Math.max(currentStart, hSeg.end);
                }
                
                if (currentStart < validSeg.end) {
                    newValidSegments.push({ start: currentStart, end: validSeg.end });
                }
            }
            validSegments = newValidSegments;
        }
        
        return validSegments;
    }
}
