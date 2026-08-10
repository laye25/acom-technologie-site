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
    resolution: number; // Size of each cell in units
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    coveragePercentage: number;
    underCoveredCount: number;
}

export interface StitchSegmentRef {
    p1: EmbroideryPoint;
    p2: EmbroideryPoint;
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

export class SpatialSegmentGrid {
    private cellSize: number;
    private grid: Map<string, StitchSegmentRef[]> = new Map();

    constructor(cellSize: number, segments: EmbroideryPoint[][]) {
        this.cellSize = Math.max(1.0, cellSize);
        for (const seg of segments) {
            if (!seg || seg.length < 2) continue;
            for (let i = 0; i < seg.length - 1; i++) {
                const p1 = seg[i];
                const p2 = seg[i + 1];
                if (!p1 || !p2 || isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) continue;

                // Index segment into all grid cells it touches
                const minX = Math.min(p1.x, p2.x);
                const maxX = Math.max(p1.x, p2.x);
                const minY = Math.min(p1.y, p2.y);
                const maxY = Math.max(p1.y, p2.y);

                const cMinX = Math.floor(minX / this.cellSize);
                const cMaxX = Math.floor(maxX / this.cellSize);
                const cMinY = Math.floor(minY / this.cellSize);
                const cMaxY = Math.floor(maxY / this.cellSize);

                const segRef: StitchSegmentRef = { p1, p2 };

                for (let cx = cMinX; cx <= cMaxX; cx++) {
                    for (let cy = cMinY; cy <= cMaxY; cy++) {
                        const key = `${cx},${cy}`;
                        let list = this.grid.get(key);
                        if (!list) {
                            list = [];
                            this.grid.set(key, list);
                        }
                        list.push(segRef);
                    }
                }
            }
        }
    }

    public getMinDistanceToSegment(p: { x: number; y: number }, maxRadius: number = 20.0): number {
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
                        const seg = list[i];
                        const dist = CoverageAnalyzer.distToSegment(p, seg.p1, seg.p2);
                        if (dist < minDist) {
                            minDist = dist;
                        }
                    }
                }
            }
        }

        return minDist;
    }
}

export class CoverageAnalyzer {
    /**
     * Builds a physically accurate coverage map for a given tatami block in O(N) time.
     */
    public static analyze(block: TatamiBlock, region: Region): CoverageMap {
        const bounds = this.getBounds(region);
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
            return { cells: [], resolution: 1, bounds, coveragePercentage: 100, underCoveredCount: 0 };
        }

        // Detect coordinate system (canvas pixels vs mm)
        const maxDim = Math.max(width, height);
        const isCanvasScale = maxDim > 30;
        const scaleFactor = isCanvasScale ? 7.5 : 1.0;

        // Step spacing and maximum allowed gap threshold
        const rawDensity = block.config.density || 0.4;
        const effectiveDensity = rawDensity < 1.5 ? rawDensity * scaleFactor : rawDensity;
        const maxAllowedGap = Math.max(1.2 * scaleFactor, effectiveDensity * 1.35);

        // Adaptive resolution aiming for ~1,500 cells max
        const resolution = Math.max(1.0 * scaleFactor, Math.min(5.0 * scaleFactor, maxDim / 40));
        const cells: CoverageCell[] = [];

        // Build spatial segment grid
        const spatialGrid = new SpatialSegmentGrid(Math.max(4.0, effectiveDensity * 2.0), block.points);

        // Downsample polygon for point-in-polygon checks
        const fullPoly = region.polygon;
        const polyStep = fullPoly.length > 80 ? Math.ceil(fullPoly.length / 80) : 1;
        const sampledPoly = polyStep > 1 ? fullPoly.filter((_, idx) => idx % polyStep === 0) : fullPoly;

        let totalCellCount = 0;
        let underCoveredCount = 0;
        const MAX_GRID_CELLS = 2500;

        for (let y = bounds.minY; y <= bounds.maxY && totalCellCount < MAX_GRID_CELLS; y += resolution) {
            for (let x = bounds.minX; x <= bounds.maxX && totalCellCount < MAX_GRID_CELLS; x += resolution) {
                if (this.isPointInPolygon({ x, y }, sampledPoly, bounds)) {
                    totalCellCount++;
                    const distToStitch = spatialGrid.getMinDistanceToSegment({ x, y }, maxAllowedGap * 2.5);
                    const distToContour = this.getMinDistanceToContour({ x, y }, sampledPoly);
                    const isUnderCovered = distToStitch > maxAllowedGap;

                    if (isUnderCovered) {
                        underCoveredCount++;
                    }

                    cells.push({
                        x,
                        y,
                        density: rawDensity,
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

    public static distToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }): number {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))));
    }
}
