import { Region, AdjacencyEdge, Edge } from '../TopologyGraph';
import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';

export class AdjacencySolver {
  private static readonly TOUCHING_TOLERANCE = 0.5;
  private static readonly ADJACENT_TOLERANCE = 5.0;

  public static buildAdjacency(regions: Region[]): AdjacencyEdge[] {
    const edges: AdjacencyEdge[] = [];
    const islands = regions.filter(r => r.isIsland);

    for (let i = 0; i < islands.length; i++) {
      if (!islands[i].adjacent) islands[i].adjacent = [];
      if (!islands[i].touching) islands[i].touching = [];
      if (!islands[i].sharedEdges) islands[i].sharedEdges = [];
    }

    for (let i = 0; i < islands.length; i++) {
      for (let j = i + 1; j < islands.length; j++) {
        const r1 = islands[i];
        const r2 = islands[j];

        // Quick bbox rejection
        if (this.bboxDistance(r1.bbox, r2.bbox) > this.ADJACENT_TOLERANCE) {
          continue;
        }

        const { distance, sharedEdges } = this.calculateExactDistanceAndSharedEdges(r1, r2);

        if (distance <= this.TOUCHING_TOLERANCE) {
          r1.touching!.push(r2.id);
          r2.touching!.push(r1.id);
          r1.sharedEdges!.push(...sharedEdges);
          r2.sharedEdges!.push(...sharedEdges);
          edges.push({ from: r1.id, to: r2.id, distance });
        } else if (distance <= this.ADJACENT_TOLERANCE) {
          r1.adjacent!.push(r2.id);
          r2.adjacent!.push(r1.id);
          edges.push({ from: r1.id, to: r2.id, distance });
        }
      }
    }

    edges.sort((a, b) => a.distance - b.distance);
    return edges;
  }

  private static bboxDistance(b1: any, b2: any): number {
    const dx = Math.max(0, b1.minX - b2.maxX, b2.minX - b1.maxX);
    const dy = Math.max(0, b1.minY - b2.maxY, b2.minY - b1.maxY);
    return Math.hypot(dx, dy);
  }

  private static calculateExactDistanceAndSharedEdges(r1: Region, r2: Region) {
    let minDistance = Infinity;
    const sharedEdges: Edge[] = [];

    const p1 = r1.polygon;
    const p2 = r2.polygon;

    for (let i = 0; i < p1.length; i++) {
      const a1 = p1[i];
      const a2 = p1[(i + 1) % p1.length];
      
      for (let j = 0; j < p2.length; j++) {
        const b1 = p2[j];
        const b2 = p2[(j + 1) % p2.length];

        const dist = this.segmentDistance(a1, a2, b1, b2);
        if (dist < minDistance) {
            minDistance = dist;
        }
        
        // Very basic shared edge detection (overlapping segments)
        if (dist <= this.TOUCHING_TOLERANCE) {
            // Further logic could extract the exact overlap interval, 
            // but for now we store the edge from r1.
            sharedEdges.push({ start: a1, end: a2 });
        }
      }
    }

    // Deduplicate shared edges (rudimentary)
    const uniqueShared = sharedEdges.filter((edge, index, self) =>
      index === self.findIndex((t) => (
        (t.start.x === edge.start.x && t.start.y === edge.start.y && t.end.x === edge.end.x && t.end.y === edge.end.y)
      ))
    );

    return { distance: minDistance, sharedEdges: uniqueShared };
  }

  private static segmentDistance(p1: EmbroideryPoint, p2: EmbroideryPoint, p3: EmbroideryPoint, p4: EmbroideryPoint): number {
    // Basic point-to-segment distance for 4 combinations
    const d1 = this.pointToSegmentDist(p1, p3, p4);
    const d2 = this.pointToSegmentDist(p2, p3, p4);
    const d3 = this.pointToSegmentDist(p3, p1, p2);
    const d4 = this.pointToSegmentDist(p4, p1, p2);
    
    // Also check intersection
    if (this.segmentsIntersect(p1, p2, p3, p4)) return 0;
    
    return Math.min(d1, d2, d3, d4);
  }

  private static pointToSegmentDist(p: EmbroideryPoint, a: EmbroideryPoint, b: EmbroideryPoint): number {
    const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    return Math.hypot(p.x - proj.x, p.y - proj.y);
  }

  private static segmentsIntersect(p1: EmbroideryPoint, p2: EmbroideryPoint, p3: EmbroideryPoint, p4: EmbroideryPoint): boolean {
    const ccw = (A: EmbroideryPoint, B: EmbroideryPoint, C: EmbroideryPoint) => {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };
    return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
  }
}
