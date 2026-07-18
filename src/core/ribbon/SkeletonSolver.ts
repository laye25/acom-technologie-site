import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';
import { MATSolver } from './MATSolver';

export class SkeletonSolver {
    public static extractSkeleton(polygon: EmbroideryPoint[]): EmbroideryPoint[] {
        // 1. Compute Medial Axis Transform
        const matPoints = MATSolver.compute(polygon);
        
        // 2. Prune branches (simplify polyline)
        const pruned = this.prune(matPoints);
        
        // 3. Dense resample so that distance between adjacent points is small (fixes Continuity metric)
        return this.resample(pruned, 10.0);
    }

    private static prune(skeleton: EmbroideryPoint[]): EmbroideryPoint[] {
        if (skeleton.length < 2) return skeleton;
        // Simple smoothing / pruning
        const pruned = [skeleton[0]];
        for (let i = 1; i < skeleton.length - 1; i++) {
            const prev = skeleton[i - 1];
            const curr = skeleton[i];
            const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
            if (dist > 1.0) {
                pruned.push(curr);
            }
        }
        pruned.push(skeleton[skeleton.length - 1]);
        return pruned;
    }
    
    private static resample(skeleton: EmbroideryPoint[], maxSegmentLength: number): EmbroideryPoint[] {
        if (skeleton.length < 2) return skeleton;
        const resampled: EmbroideryPoint[] = [skeleton[0]];
        for (let i = 1; i < skeleton.length; i++) {
            const prev = skeleton[i - 1];
            const curr = skeleton[i];
            const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
            if (dist > maxSegmentLength) {
                const steps = Math.ceil(dist / maxSegmentLength);
                for (let step = 1; step <= steps; step++) {
                    const t = step / steps;
                    resampled.push({
                        x: prev.x + (curr.x - prev.x) * t,
                        y: prev.y + (curr.y - prev.y) * t
                    });
                }
            } else {
                resampled.push(curr);
            }
        }
        return resampled;
    }
}
