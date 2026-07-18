import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export interface TravelNode {
    id: string;
    type: 'satin' | 'tatami' | 'other';
    boundingBox: { minX: number, minY: number, maxX: number, maxY: number };
    entryPoints: EmbroideryPoint[];
    exitPoints: EmbroideryPoint[];
    color: string;
    layer: number;
    parent?: string;
    points: EmbroideryPoint[]; // The generated stitches for this region
}

export interface TravelGraphData {
    nodes: TravelNode[];
    distances: Map<string, number>;
}

export interface TravelPath {
    points: EmbroideryPoint[];
    metrics: TravelMetrics;
}

export interface TravelMetrics {
    travelScore: number;
    trimCount: number;
    jumpCount: number;
    threadLength: number;
    machineTime: number;
    colorChanges: number;
    entryQuality: number;
    exitQuality: number;
    tspCost: number;
    lockQuality: number;
}
