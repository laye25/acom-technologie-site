import { TatamiConfig } from './types';

export class RowGenerator {
    public static generate(bounds: { minX: number, maxX: number, minY: number, maxY: number }, config: TatamiConfig, angle: number): number[] {
        const rows: number[] = [];
        // The bounds are expected to be in the rotated coordinate space
        const startY = bounds.minY;
        const endY = bounds.maxY;
        
        let currentY = startY;
        while (currentY <= endY) {
            rows.push(currentY);
            currentY += config.density;
        }
        return rows;
    }
}
