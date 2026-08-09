import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class PhyllotacticCoverage1375 {
    private static readonly GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

    /**
     * Generates candidate points around a center point using Vogel's spiral logic.
     * @param center The center of the under-covered area
     * @param count Number of candidates to generate
     * @param scale Scaling factor for radial distance
     */
    public static generateCandidates(center: { x: number, y: number }, count: number = 10, scale: number = 1.0): EmbroideryPoint[] {
        const candidates: EmbroideryPoint[] = [];

        for (let n = 1; n <= count; n++) {
            const theta = n * this.GOLDEN_ANGLE;
            const r = scale * Math.sqrt(n);

            candidates.push({
                x: center.x + r * Math.cos(theta),
                y: center.y + r * Math.sin(theta)
            });
        }

        return candidates;
    }
}
