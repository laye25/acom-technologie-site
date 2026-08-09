import { Region } from '../topology/TopologyGraph';
import { TatamiBlock } from './types';
import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export interface CoverageCell {
    x: number;
    y: number;
    density: number;
    distanceToNearestStitch: number;
    distanceToContour: number;
    isUnderCovered: boolean;
}

export interface CoverageMap {
    cells: CoverageCell[];
    resolution: number; // Size of each cell in mm
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    coveragePercentage: number;
    underCoveredCount: number;
}

export class SpatialPointGrid {
    private cellSize: number;
    private grid: Map<string, EmbroideryPoint[]> = new Map();

    constructor(cellSize: number, points: EmbroideryPoint[]) {
        this.cellSize = cellSize;
        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            if (pt && typeof pt.x === 'number' && typeof pt.y === 'number' && !isNaN(pt.x) && !isNaN(pt.y)) {
                const key = `${Math.floor(pt.x / cellSize)},${Math.floor(pt.y / cellSize)}`;
                let list = this.grid.get(key);
                if (!list) {
                    list = [];
                    this.grid.set(key, list);
                }
                list.push(pt);
            }
        }
    }

    public getMinDistance(p: { x: number; y: number }, maxRadius: number = 3.0): number {
        const cx = Math.floor(p.x / this.cellSize);
        const cy = Math.floor(p.y / this.cellSize);
        const rCells = Math.ceil(maxRadius / this.cellSize);

        let minDist = maxRadius;

        for (let dx = -rCells; dx <= rCells; dx++) {
            for (let dy = -rCells; dy <= rCells; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const list = this.grid.get(key);
                if (list) {
                    for (let i = 0; i < list.length; i++) {
                        const pt = list[i];
                        const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
                        if (dist < minDist) {
                            minDist = dist;
                        }
                    }
                }
            }
        }

        return minDist;
    }

    public hasPointWithin(p: { x: number; y: number }, radius: number): boolean {
        const cx = Math.floor(p.x / this.cellSize);
        const cy = Math.floor(p.y / this.cellSize);
        const rCells = Math.ceil(radius / this.cellSize);

        for (let dx = -rCells; dx <= rCells; dx++) {
            for (let dy = -rCells; dy <= rCells; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const list = this.grid.get(key);
                if (list) {
                    for (let i = 0; i < list.length; i++) {
                        const pt = list[i];
                        if (Math.hypot(p.x - pt.x, p.y - pt.y) < radius) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }
}

export class CoverageAnalyzer {
    private static readonly MAX_ALLOWED_GAP = 1.0; // 1mm max gap

    /**
     * Builds a coverage map for a given tatami block in linear O(N) time.
     */
    public static analyze(block: TatamiBlock, region: Region): CoverageMap {
        const bounds = this.getBounds(region);
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
            return { cells: [], resolution: 1, bounds, coveragePercentage: 100, underCoveredCount: 0 };
        }

        // Adaptive resolution aiming for ~1,500-2,500 cells max
        const maxDim = Math.max(width, height);
        const resolution = Math.max(0.8, Math.min(3.0, maxDim / 45));
        const cells: CoverageCell[] = [];

        // Flatten all points and index into Spatial Grid
        const allPoints = block.points.flat();
        const spatialGrid = new SpatialPointGrid(2.0, allPoints);

        // Downsample polygon for fast point-in-polygon and contour checks
        const fullPoly = region.polygon;
        const polyStep = fullPoly.length > 100 ? Math.ceil(fullPoly.length / 100) : 1;
        const sampledPoly = polyStep > 1 ? fullPoly.filter((_, idx) => idx % polyStep === 0) : fullPoly;

        let totalCellCount = 0;
        let underCoveredCount = 0;
        const MAX_GRID_CELLS = 3000;

        for (let y = bounds.minY; y <= bounds.maxY && totalCellCount < MAX_GRID_CELLS; y += resolution) {
            for (let x = bounds.minX; x <= bounds.maxX && totalCellCount < MAX_GRID_CELLS; x += resolution) {
                if (this.isPointInPolygon({ x, y }, sampledPoly, bounds)) {
                    totalCellCount++;
                    const distToStitch = spatialGrid.getMinDistance({ x, y }, 3.0);
                    const distToContour = this.getMinDistanceToContour({ x, y }, sampledPoly);
                    const isUnderCovered = distToStitch > this.MAX_ALLOWED_GAP;

                    if (isUnderCovered) {
                        underCoveredCount++;
                    }

                    cells.push({
                        x,
                        y,
                        density: block.config.density || 1.2,
                        distanceToNearestStitch: distToStitch,
                        distanceToContour: distToContour,
                        isUnderCovered
                    });
                }
            }
        }

        const coveragePercentage = totalCellCount > 0 
            ? Math.max(0, Math.min(100, ((totalCellCount - underCoveredCount) / totalCellCount) * 100)) 
            : 100;

        return { cells, resolution, bounds, coveragePercentage, underCoveredCount };
    }

    private static getBounds(region: Region) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        region.polygon.forEach(p => {
            if (p && !isNaN(p.x) && !isNaN(p.y)) {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            }
        });
        if (!isFinite(minX)) minX = 0;
        if (!isFinite(maxX)) maxX = 10;
        if (!isFinite(minY)) minY = 0;
        if (!isFinite(maxY)) maxY = 10;
        return { minX, maxX, minY, maxY };
    }

    private static isPointInPolygon(
        p: { x: number, y: number }, 
        polygon: { x: number, y: number }[],
        bounds?: { minX: number; maxX: number; minY: number; maxY: number }
    ): boolean {
        if (bounds) {
            if (p.x < bounds.minX || p.x > bounds.maxX || p.y < bounds.minY || p.y > bounds.maxY) {
                return false;
            }
        }
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    private static isPointInHoles(p: { x: number, y: number }, region: Region): boolean {
        return false; 
    }

    private static getMinDistance(p: { x: number, y: number }, points: EmbroideryPoint[]): number {
        let minDist = Infinity;
        for (const pt of points) {
            const d = Math.sqrt((p.x - pt.x) ** 2 + (p.y - pt.y) ** 2);
            if (d < minDist) minDist = d;
        }
        return minDist;
    }

    private static getMinDistanceToContour(p: { x: number, y: number }, polygon: { x: number, y: number }[]): number {
        let minDist = Infinity;
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            const d = this.distToSegment(p, p1, p2);
            if (d < minDist) minDist = d;
        }
        return minDist;
    }

    private static distToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }): number {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))));
    }
}
