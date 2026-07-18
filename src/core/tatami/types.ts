import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';
import { Region } from '../topology/TopologyGraph';

export interface TatamiConfig {
    density: number; // Space between rows (mm)
    angle: number; // Stitch angle in degrees
    stitchLength: number; // Maximum length of a single stitch
    offset: number; // Offset for the brick pattern
    underlay: 'none' | 'edge' | 'grid';
}

export interface TatamiMetrics {
    uniformity: number;
    holeExclusion: number;
    densityError: number;
    gaps: number;
    stitchCount: number;
}

export interface TatamiBlock {
    id: string;
    regionId: string;
    points: EmbroideryPoint[][]; // The generated stitch segments
    config: TatamiConfig;
}
