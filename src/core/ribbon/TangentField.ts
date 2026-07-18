import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class TangentField {
    public static compute(points: EmbroideryPoint[]): EmbroideryPoint[] {
        const tangents: EmbroideryPoint[] = [];
        const n = points.length;
        if (n < 2) return [{ x: 1, y: 0 }];

        for (let i = 0; i < n; i++) {
            let p1, p2;
            if (i === 0) {
                p1 = points[0];
                p2 = points[1];
            } else if (i === n - 1) {
                p1 = points[n - 2];
                p2 = points[n - 1];
            } else {
                p1 = points[i - 1];
                p2 = points[i + 1];
            }
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            if (len === 0) {
                tangents.push({ x: 1, y: 0 });
            } else {
                tangents.push({ x: dx / len, y: dy / len });
            }
        }
        return tangents;
    }
}
