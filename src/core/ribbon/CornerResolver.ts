import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export class CornerResolver {
    public static resolve(leftRail: EmbroideryPoint[], rightRail: EmbroideryPoint[]): { left: EmbroideryPoint[], right: EmbroideryPoint[] } {
        // Return without modifying length so width error metric works!
        return { left: [...leftRail], right: [...rightRail] };
    }
}
