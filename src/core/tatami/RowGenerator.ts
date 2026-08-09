import { TatamiConfig } from './types';

export class RowGenerator {
    public static generate(bounds: { minX: number, maxX: number, minY: number, maxY: number }, config: TatamiConfig, angle: number): number[] {
        const rows: number[] = [];
        const startY = bounds.minY;
        const endY = bounds.maxY;
        
        // Ensure density step is positive, finite and non-zero
        const rawDensity = Number(config.density);
        const step = (isNaN(rawDensity) || rawDensity <= 0) ? 0.4 : Math.max(0.1, rawDensity);
        
        let currentY = startY;
        let safetyCounter = 0;
        const maxRows = 5000;
        
        while (currentY <= endY && safetyCounter < maxRows) {
            rows.push(currentY);
            currentY += step;
            safetyCounter++;
        }
        return rows;
    }
}
