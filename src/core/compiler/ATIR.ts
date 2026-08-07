import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';

export interface RegionNode {
  id: string;
  type: 'island' | 'hole';
  points: EmbroideryPoint[];
  children: RegionNode[];
  shapeAnalysis?: {
    medialAxis?: EmbroideryPoint[];
    localWidthMinMm?: number;
    localWidthMaxMm?: number;
    localWidthAvgMm?: number;
    principalAngleDeg?: number;
    curvatureIndex?: number;
    isConvex?: boolean;
    aspectRatio?: number;
  };
  decisionLayer?: {
    recommendedStitchType: 'satin' | 'tatami' | 'running' | 'underlay' | 'border';
    recommendedDensityMm: number;
    recommendedAngleDeg: number;
    pullCompensationMm: number;
    underlayType?: 'contour' | 'tatami-grid' | 'satin-center-line' | 'none';
  };
}

export interface ATIR {
  version: string;
  contours: EmbroideryPoint[][];
  regions: RegionNode[];
  skeleton?: EmbroideryPoint[];
  widths?: number[];
  leftRail?: EmbroideryPoint[];
  rightRail?: EmbroideryPoint[];
  stitches?: EmbroideryPoint[];
  trims?: number;
  metadata: {
    profile?: string;
    geometry?: any;
    topology?: any;
    ribbonMetrics?: any[];
    tatamiMetrics?: any[];
    satinMetrics?: any[];
    travelMetrics?: any;
    physicsMetrics?: any;
    performance?: any;
    export?: any;
    [key: string]: any;
  };
}
