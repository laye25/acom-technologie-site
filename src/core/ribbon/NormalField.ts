import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';
import { TangentField } from './TangentField';

export class NormalField {
    public static compute(points: EmbroideryPoint[]): EmbroideryPoint[] {
        const tangents = TangentField.compute(points);
        return tangents.map(t => ({
            x: -t.y,
            y: t.x
        }));
    }
}
