import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';


export interface Edge {
  start: EmbroideryPoint;
  end: EmbroideryPoint;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Region {
  id: string;
  polygon: EmbroideryPoint[];
  parent?: string;
  children: string[];
  holes: string[];
  isHole: boolean;
  isIsland: boolean;
  color: string;
  area: number;
  orientation: 'CW' | 'CCW';
  bbox: BoundingBox;
  adjacent?: string[];
  touching?: string[];
  sharedEdges?: Edge[];
  medialCandidates?: EmbroideryPoint[];
}

export interface AdjacencyEdge {
  from: string;
  to: string;
  distance: number;
}

export interface TopologyMetrics {
  eulerCharacteristic: number;
  holesCount: number;
  islandsCount: number;
  maxDepth: number;
  componentsCount: number;
}

export interface TopologyGraph {
  regions: Region[];
  adjacency: AdjacencyEdge[];
  metrics: TopologyMetrics;
}
