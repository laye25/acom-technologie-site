import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';

export interface RibbonPoint extends EmbroideryPoint {
    width?: number;
    tangent?: EmbroideryPoint;
    normal?: EmbroideryPoint;
}

export interface Ribbon {
    id: string;
    centerline: RibbonPoint[];
    leftRail: EmbroideryPoint[];
    rightRail: EmbroideryPoint[];
    widths: number[];
}

export interface RibbonMetrics {
    continuity: number;
    widthError: number;
    railCrossings: number;
    smoothness: number;
    cornerScore: number;
    junctionScore: number;
}
