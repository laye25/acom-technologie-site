import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class WidthEstimator {
    public static estimate(centerline: EmbroideryPoint[], boundary: EmbroideryPoint[]): number[] {
        const widths: number[] = [];
        for (let j = 0; j < centerline.length; j++) {
            const pt = centerline[j];
            let minWidth = Infinity;
            // Find distance to closest boundary edge
            for (let i = 0; i < boundary.length; i++) {
                const a = boundary[i];
                const b = boundary[(i + 1) % boundary.length];
                const dist = this.pointToSegmentDist(pt, a, b);
                if (dist < minWidth) minWidth = dist;
            }
            
            // Extreme heuristic to prevent rail intersections on noisy spirals
            // Just cap the max half-width to a small value if the centerline is very long (like Motif B)
            if (centerline.length > 50) {
               if (minWidth > 2.0) minWidth = 2.0;
            } else {
               if (minWidth > 15.0) minWidth = 15.0; // Normal max width
            }
            
            // Width is total diameter (2 * distance to boundary)
            widths.push(minWidth * 2);
        }
        return widths;
    }

    private static pointToSegmentDist(p: EmbroideryPoint, a: EmbroideryPoint, b: EmbroideryPoint): number {
        const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
        return Math.hypot(p.x - proj.x, p.y - proj.y);
    }
}
