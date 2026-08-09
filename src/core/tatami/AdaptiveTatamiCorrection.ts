import { Region } from '../topology/TopologyGraph';
import { TatamiBlock } from './types';
import { CoverageAnalyzer, CoverageMap, SpatialPointGrid } from './CoverageAnalyzer';
import { PhyllotacticCoverage1375 } from './PhyllotacticCoverage1375';
import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export interface CorrectionReport {
    originalPoints: number;
    additionalPoints: number;
    reductionInGaps: number;
    cost: number;
}

export class AdaptiveTatamiCorrection {
    private static readonly MIN_SAFETY_DIST = 0.3; // 0.3mm
    private static readonly CONTOUR_ZONE = 0.5; // 0.5mm
    private static readonly MAX_ADDITIONAL_POINTS = 200; // Upper safety threshold for candidate points

    /**
     * Applies the 137.5° experimental correction layer.
     */
    public static apply(block: TatamiBlock, region: Region): { correctedBlock: TatamiBlock, report: CorrectionReport } {
        const coverageMap = CoverageAnalyzer.analyze(block, region);
        const underCoveredCells = coverageMap.cells.filter(c => c.isUnderCovered);
        
        const additionalPoints: EmbroideryPoint[] = [];
        let totalGapReduction = 0;

        // Flatten existing points and create spatial index for O(1) safety checks
        const allPoints = block.points.flat();
        const spatialGrid = new SpatialPointGrid(1.5, allPoints);

        // Subsample under-covered cells if too many, to guarantee sub-100ms performance
        const maxCellsToProcess = 150;
        const cellStep = Math.max(1, Math.floor(underCoveredCells.length / maxCellsToProcess));

        // Downsample polygon for fast candidate contour checks
        const fullPoly = region.polygon;
        const polyStep = fullPoly.length > 80 ? Math.ceil(fullPoly.length / 80) : 1;
        const sampledPoly = polyStep > 1 ? fullPoly.filter((_, idx) => idx % polyStep === 0) : fullPoly;

        for (let i = 0; i < underCoveredCells.length && additionalPoints.length < this.MAX_ADDITIONAL_POINTS; i += cellStep) {
            const cell = underCoveredCells[i];
            
            // Generate 5 candidates for this under-covered zone using Vogel 137.5° spiral
            const candidates = PhyllotacticCoverage1375.generateCandidates({ x: cell.x, y: cell.y }, 5, 0.8);
            
            let bestCandidate: EmbroideryPoint | null = null;
            let bestScore = -Infinity;

            for (const candidate of candidates) {
                if (this.isValidFast(candidate, spatialGrid, sampledPoly)) {
                    const score = this.evaluate(candidate, cell, block);
                    if (score > 0 && score > bestScore) {
                        bestScore = score;
                        bestCandidate = candidate;
                    }
                }
            }

            if (bestCandidate) {
                additionalPoints.push(bestCandidate);
                totalGapReduction += cell.distanceToNearestStitch;
            }
        }

        const correctedBlock: TatamiBlock = {
            ...block,
            points: [...block.points, additionalPoints]
        };

        const report: CorrectionReport = {
            originalPoints: allPoints.length,
            additionalPoints: additionalPoints.length,
            reductionInGaps: totalGapReduction,
            cost: this.calculateTotalCost(additionalPoints, totalGapReduction)
        };

        return { correctedBlock, report };
    }

    private static isValidFast(p: EmbroideryPoint, spatialGrid: SpatialPointGrid, polygon: { x: number, y: number }[]): boolean {
        // 1. Inside polygon
        if (!this.isPointInPolygon(p, polygon)) return false;

        // 2. Safety distance from existing points using Spatial Grid
        if (spatialGrid.hasPointWithin(p, this.MIN_SAFETY_DIST)) return false;

        // 3. Safety distance from contour
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            if (this.distToSegment(p, p1, p2) < this.CONTOUR_ZONE) return false;
        }

        return true;
    }

    private static evaluate(candidate: EmbroideryPoint, cell: any, block: TatamiBlock): number {
        const coverageGain = cell.distanceToNearestStitch;
        const densityPenalty = 0.1;
        return coverageGain - densityPenalty;
    }

    private static calculateTotalCost(additionalPoints: EmbroideryPoint[], reduction: number): number {
        return additionalPoints.length * 0.5 - reduction * 1.2;
    }

    private static isPointInPolygon(p: { x: number, y: number }, polygon: { x: number, y: number }[]): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    private static distToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }): number {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }
}
