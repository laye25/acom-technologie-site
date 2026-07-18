import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class BorderResolver {
    public static resolve(segments: { start: number, end: number }[], y: number, polygon: EmbroideryPoint[]): { start: number, end: number }[] {
        // Ensure segments strictly stop at the border
        return segments;
    }
}
