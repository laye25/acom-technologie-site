import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class RailBuilder {
    public static build(centerline: EmbroideryPoint[], widths: number[], normals: EmbroideryPoint[]): { left: EmbroideryPoint[], right: EmbroideryPoint[] } {
        const left: EmbroideryPoint[] = [];
        const right: EmbroideryPoint[] = [];

        for (let i = 0; i < centerline.length; i++) {
            const pt = centerline[i];
            const w = widths[i] / 2; // half width
            const n = normals[i];
            
            left.push({
                x: pt.x + n.x * w,
                y: pt.y + n.y * w
            });
            
            right.push({
                x: pt.x - n.x * w,
                y: pt.y - n.y * w
            });
        }

        return { left, right };
    }
}
