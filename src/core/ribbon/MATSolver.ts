import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class MATSolver {
    public static compute(polygon: EmbroideryPoint[]): EmbroideryPoint[] {
        if (polygon.length < 3) return [...polygon];
        
        // If the polygon is not closed (open path like Motif B), the skeleton is the path itself
        const first = polygon[0];
        const last = polygon[polygon.length - 1];
        const dist = Math.hypot(first.x - last.x, first.y - last.y);
        
        if (dist > 5.0) {
            return [...polygon];
        }

        // Simplified MAT for closed polygons
        const centerLine: EmbroideryPoint[] = [];
        const n = polygon.length;
        const half = Math.floor(n / 2);
        for (let i = 0; i < half; i++) {
            const p1 = polygon[i];
            const p2 = polygon[n - 1 - i];
            centerLine.push({
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            });
        }
        return centerLine;
    }
}
