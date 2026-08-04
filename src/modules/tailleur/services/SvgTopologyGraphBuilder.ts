/**
 * SvgTopologyGraphBuilder.ts
 * ============================================================================
 * Phase 2.1 — Non-intrusive Topological Graph Builder Kernel
 *
 * This module builds a topological graph representation of raw SVG paths.
 * It analyzes spatial containment (parent/child nesting), bounding box overlaps,
 * adjacency, polygon winding (CW/CCW), surface areas, and semantic role heuristics.
 *
 * IMPORTANT ARCHITECTURAL RULE (AGENTS.md):
 * - Zero modification to rendering, ImageTracer, parseSvgFile, or Canvas outputs.
 * - Diagnostic & structural analysis only.
 * ============================================================================
 */

export type PotentialRole =
  | 'SHIELD_OUTER'
  | 'SHIELD_INNER'
  | 'BOOK_PAGE'
  | 'GLOBE_GRID'
  | 'BANNER'
  | 'TEXT_LETTER'
  | 'LAUREL_LEAF'
  | 'SUN_RAY'
  | 'FLAME'
  | 'STAR'
  | 'UNKNOWN';

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox2D {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export interface SvgPathNode {
  id: string;
  name: string;
  points: Point2D[];
  bbox: BoundingBox2D;
  area: number;
  perimeter: number;
  winding: 'CW' | 'CCW';
  isClosed: boolean;
  color?: string;
  depth: number;
  parentId: string | null;
  childrenIds: string[];
  siblingIds: string[];
  containedBy: string[];
  contains: string[];
  adjacentIds: string[];
  potentialRole: PotentialRole;
  roleConfidence: number;
}

export type TopologyEdgeType = 'CONTAINS' | 'ADJACENT' | 'SIBLING' | 'OVERLAPS';

export interface TopologyEdge {
  source: string;
  target: string;
  type: TopologyEdgeType;
  weight: number;
}

export interface SvgTopologyGraph {
  nodes: Record<string, SvgPathNode>;
  edges: TopologyEdge[];
  rootNodeIds: string[];
  maxDepth: number;
  totalNodes: number;
  orphanCount: number;
  stats: {
    shieldsCount: number;
    booksCount: number;
    globesCount: number;
    bannersCount: number;
    textsCount: number;
    laurelsCount: number;
    raysCount: number;
    starsCount: number;
  };
}

export interface InputPathItem {
  id?: string;
  name?: string;
  points: Point2D[];
  color?: string;
}

export class SvgTopologyGraphBuilder {
  /**
   * Main entry point: builds a SvgTopologyGraph from a list of input path items.
   */
  public static buildTopologyGraph(items: InputPathItem[]): SvgTopologyGraph {
    if (!items || items.length === 0) {
      return this.createEmptyGraph();
    }

    const nodesRecord: Record<string, SvgPathNode> = {};
    const edges: TopologyEdge[] = [];

    // Step 1: Initialize base nodes
    items.forEach((item, index) => {
      const id = item.id || `node_${index + 1}`;
      const name = item.name || `Path_${index + 1}`;
      const points = item.points || [];
      const bbox = this.computeBBox(points);
      const area = this.computeArea(points);
      const perimeter = this.computePerimeter(points);
      const winding = this.computeWinding(points);
      const isClosed = this.checkIsClosed(points);

      nodesRecord[id] = {
        id,
        name,
        points,
        bbox,
        area,
        perimeter,
        winding,
        isClosed,
        color: item.color,
        depth: 0,
        parentId: null,
        childrenIds: [],
        siblingIds: [],
        containedBy: [],
        contains: [],
        adjacentIds: [],
        potentialRole: 'UNKNOWN',
        roleConfidence: 0
      };
    });

    const nodeIds = Object.keys(nodesRecord);

    // Step 2: Spatial Containment & Area-based Parent/Child hierarchy
    // Sort node IDs by surface area descending
    const sortedIdsByArea = [...nodeIds].sort((a, b) => nodesRecord[b].area - nodesRecord[a].area);

    for (let i = 0; i < sortedIdsByArea.length; i++) {
      const outerId = sortedIdsByArea[i];
      const outerNode = nodesRecord[outerId];

      for (let j = i + 1; j < sortedIdsByArea.length; j++) {
        const innerId = sortedIdsByArea[j];
        const innerNode = nodesRecord[innerId];

        // Fast BBox containment check
        if (this.isBBoxContained(innerNode.bbox, outerNode.bbox)) {
          // Precise point sampling check
          const containmentRatio = this.computePointInPolygonRatio(innerNode.points, outerNode.points);

          if (containmentRatio > 0.6) {
            outerNode.contains.push(innerId);
            innerNode.containedBy.push(outerId);

            edges.push({
              source: outerId,
              target: innerId,
              type: 'CONTAINS',
              weight: containmentRatio
            });
          }
        } else if (this.isBBoxAdjacent(innerNode.bbox, outerNode.bbox, 10)) {
          innerNode.adjacentIds.push(outerId);
          outerNode.adjacentIds.push(innerId);

          edges.push({
            source: outerId,
            target: innerId,
            type: 'ADJACENT',
            weight: 1.0
          });
        }
      }
    }

    // Step 3: Resolve direct parents and tree depth
    sortedIdsByArea.forEach((id) => {
      const node = nodesRecord[id];
      if (node.containedBy.length > 0) {
        // Direct parent is the smallest container (i.e., last in sortedByArea array among containers)
        let smallestContainerId = node.containedBy[0];
        let minArea = nodesRecord[smallestContainerId].area;

        node.containedBy.forEach((containerId) => {
          if (nodesRecord[containerId].area < minArea) {
            minArea = nodesRecord[containerId].area;
            smallestContainerId = containerId;
          }
        });

        node.parentId = smallestContainerId;
        nodesRecord[smallestContainerId].childrenIds.push(id);
      }
    });

    // Step 4: Calculate depths and siblings recursively from root nodes
    const rootNodeIds = sortedIdsByArea.filter((id) => nodesRecord[id].parentId === null);
    let maxDepth = 0;

    const assignDepth = (id: string, depth: number) => {
      const node = nodesRecord[id];
      node.depth = depth;
      if (depth > maxDepth) maxDepth = depth;

      // Register siblings
      if (node.parentId) {
        const parent = nodesRecord[node.parentId];
        node.siblingIds = parent.childrenIds.filter((childId) => childId !== id);
        node.siblingIds.forEach((sId) => {
          edges.push({
            source: id,
            target: sId,
            type: 'SIBLING',
            weight: 1.0
          });
        });
      }

      node.childrenIds.forEach((childId) => assignDepth(childId, depth + 1));
    };

    rootNodeIds.forEach((rId) => assignDepth(rId, 0));

    // Step 5: Semantic Heuristic Classification
    const globalBBox = this.computeGlobalBBox(Object.values(nodesRecord));

    Object.values(nodesRecord).forEach((node) => {
      const roleResult = this.classifyPotentialRole(node, globalBBox, nodesRecord);
      node.potentialRole = roleResult.role;
      node.roleConfidence = roleResult.confidence;
    });

    // Step 6: Compute Graph Statistics
    let orphanCount = 0;
    const stats = {
      shieldsCount: 0,
      booksCount: 0,
      globesCount: 0,
      bannersCount: 0,
      textsCount: 0,
      laurelsCount: 0,
      raysCount: 0,
      starsCount: 0
    };

    Object.values(nodesRecord).forEach((node) => {
      if (!node.parentId && node.childrenIds.length === 0) {
        orphanCount++;
      }

      switch (node.potentialRole) {
        case 'SHIELD_OUTER':
        case 'SHIELD_INNER':
          stats.shieldsCount++;
          break;
        case 'BOOK_PAGE':
          stats.booksCount++;
          break;
        case 'GLOBE_GRID':
          stats.globesCount++;
          break;
        case 'BANNER':
          stats.bannersCount++;
          break;
        case 'TEXT_LETTER':
          stats.textsCount++;
          break;
        case 'LAUREL_LEAF':
          stats.laurelsCount++;
          break;
        case 'SUN_RAY':
          stats.raysCount++;
          break;
        case 'STAR':
          stats.starsCount++;
          break;
      }
    });

    return {
      nodes: nodesRecord,
      edges,
      rootNodeIds,
      maxDepth,
      totalNodes: Object.keys(nodesRecord).length,
      orphanCount,
      stats
    };
  }

  /**
   * Helper to parse an SVG string into paths and construct the topology graph.
   */
  public static buildGraphFromSvgString(svgText: string): SvgTopologyGraph {
    if (typeof window === 'undefined' || !svgText) {
      return this.createEmptyGraph();
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const elements = doc.querySelectorAll('path, polygon, polyline, rect, circle, ellipse');

      const items: InputPathItem[] = [];

      elements.forEach((el, index) => {
        const id = el.getAttribute('id') || `path_${index + 1}`;
        const name = el.getAttribute('name') || el.tagName.toLowerCase() + '_' + (index + 1);
        const color = el.getAttribute('fill') || el.getAttribute('stroke') || '#000000';

        let points: Point2D[] = [];

        if (el.tagName.toLowerCase() === 'path') {
          const d = el.getAttribute('d') || '';
          points = this.extractPointsFromSvgD(d);
        } else if (el.tagName.toLowerCase() === 'polygon' || el.tagName.toLowerCase() === 'polyline') {
          const pointsAttr = el.getAttribute('points') || '';
          points = this.extractPointsFromPolyAttr(pointsAttr);
        } else if (el.tagName.toLowerCase() === 'rect') {
          const x = parseFloat(el.getAttribute('x') || '0');
          const y = parseFloat(el.getAttribute('y') || '0');
          const w = parseFloat(el.getAttribute('width') || '0');
          const h = parseFloat(el.getAttribute('height') || '0');
          points = [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
            { x, y }
          ];
        }

        if (points.length >= 3) {
          items.push({ id, name, points, color });
        }
      });

      return this.buildTopologyGraph(items);
    } catch (e) {
      console.warn('SvgTopologyGraphBuilder: SVG parsing error', e);
      return this.createEmptyGraph();
    }
  }

  // =========================================================================
  // GEOMETRIC & MATH CALCULATIONS
  // =========================================================================

  public static computeBBox(points: Point2D[]): BoundingBox2D {
    if (!points || points.length === 0) {
      return { xmin: 0, ymin: 0, xmax: 0, ymax: 0, width: 0, height: 0, cx: 0, cy: 0 };
    }

    let xmin = Infinity;
    let ymin = Infinity;
    let xmax = -Infinity;
    let ymax = -Infinity;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < xmin) xmin = p.x;
      if (p.x > xmax) xmax = p.x;
      if (p.y < ymin) ymin = p.y;
      if (p.y > ymax) ymax = p.y;
    }

    const width = Math.max(0, xmax - xmin);
    const height = Math.max(0, ymax - ymin);
    const cx = xmin + width / 2;
    const cy = ymin + height / 2;

    return { xmin, ymin, xmax, ymax, width, height, cx, cy };
  }

  public static computeArea(points: Point2D[]): number {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  public static computePerimeter(points: Point2D[]): number {
    if (!points || points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  }

  public static computeWinding(points: Point2D[]): 'CW' | 'CCW' {
    if (!points || points.length < 3) return 'CW';
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      sum += (points[j].x - points[i].x) * (points[j].y + points[i].y);
    }
    return sum >= 0 ? 'CW' : 'CCW';
  }

  private static checkIsClosed(points: Point2D[]): boolean {
    if (!points || points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    const dx = Math.abs(first.x - last.x);
    const dy = Math.abs(first.y - last.y);
    return dx < 2 && dy < 2;
  }

  private static isBBoxContained(inner: BoundingBox2D, outer: BoundingBox2D): boolean {
    const margin = 2; // 2px margin tolerance
    return (
      inner.xmin >= outer.xmin - margin &&
      inner.xmax <= outer.xmax + margin &&
      inner.ymin >= outer.ymin - margin &&
      inner.ymax <= outer.ymax + margin
    );
  }

  private static isBBoxAdjacent(boxA: BoundingBox2D, boxB: BoundingBox2D, distanceThreshold: number): boolean {
    const overlapX = boxA.xmin <= boxB.xmax + distanceThreshold && boxA.xmax >= boxB.xmin - distanceThreshold;
    const overlapY = boxA.ymin <= boxB.ymax + distanceThreshold && boxA.ymax >= boxB.ymin - distanceThreshold;
    return overlapX && overlapY;
  }

  /**
   * Ray-casting algorithm to test percentage of sample points inside polygon.
   */
  public static computePointInPolygonRatio(samplePoints: Point2D[], polygon: Point2D[]): number {
    if (!samplePoints || samplePoints.length === 0 || !polygon || polygon.length < 3) {
      return 0;
    }

    let insideCount = 0;
    // Sample up to 20 representative points
    const step = Math.max(1, Math.floor(samplePoints.length / 20));

    for (let i = 0; i < samplePoints.length; i += step) {
      if (this.isPointInPolygon(samplePoints[i], polygon)) {
        insideCount++;
      }
    }

    const tested = Math.ceil(samplePoints.length / step);
    return tested > 0 ? insideCount / tested : 0;
  }

  public static isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-10) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private static computeGlobalBBox(nodes: SvgPathNode[]): BoundingBox2D {
    if (!nodes || nodes.length === 0) {
      return { xmin: 0, ymin: 0, xmax: 500, ymax: 500, width: 500, height: 500, cx: 250, cy: 250 };
    }
    let xmin = Infinity,
      ymin = Infinity,
      xmax = -Infinity,
      ymax = -Infinity;
    nodes.forEach((n) => {
      if (n.bbox.xmin < xmin) xmin = n.bbox.xmin;
      if (n.bbox.xmax > xmax) xmax = n.bbox.xmax;
      if (n.bbox.ymin < ymin) ymin = n.bbox.ymin;
      if (n.bbox.ymax > ymax) ymax = n.bbox.ymax;
    });
    const width = Math.max(1, xmax - xmin);
    const height = Math.max(1, ymax - ymin);
    return { xmin, ymin, xmax, ymax, width, height, cx: xmin + width / 2, cy: ymin + height / 2 };
  }

  /**
   * Semiautomatic semantic classification based on geometry and relative positioning.
   */
  private static classifyPotentialRole(
    node: SvgPathNode,
    globalBBox: BoundingBox2D,
    nodesMap: Record<string, SvgPathNode>
  ): { role: PotentialRole; confidence: number } {
    const relY = (node.bbox.cy - globalBBox.ymin) / globalBBox.height;
    const relX = (node.bbox.cx - globalBBox.xmin) / globalBBox.width;
    const relArea = node.area / (globalBBox.width * globalBBox.height);
    const aspectRatio = node.bbox.width / Math.max(1, node.bbox.height);

    // 1. Banner (at bottom, wide aspect ratio)
    if (relY > 0.7 && aspectRatio > 2.2 && relArea > 0.05) {
      return { role: 'BANNER', confidence: 0.88 };
    }

    // 2. Shield (central large surface)
    if (relArea > 0.25 && Math.abs(relX - 0.5) < 0.2 && Math.abs(relY - 0.45) < 0.25) {
      if (node.depth === 0) return { role: 'SHIELD_OUTER', confidence: 0.92 };
      return { role: 'SHIELD_INNER', confidence: 0.85 };
    }

    // 3. Text letters (inside banner or at top corners ESTD/0000)
    if (
      (node.parentId && nodesMap[node.parentId]?.potentialRole === 'BANNER') ||
      (relY < 0.25 && (relX < 0.3 || relX > 0.7) && relArea < 0.02)
    ) {
      return { role: 'TEXT_LETTER', confidence: 0.82 };
    }

    // 4. Globe Grid (center-bottom inside shield)
    if (relY > 0.45 && relY < 0.75 && Math.abs(relX - 0.5) < 0.25 && relArea < 0.1) {
      return { role: 'GLOBE_GRID', confidence: 0.78 };
    }

    // 5. Book Page (center upper half inside shield)
    if (relY > 0.25 && relY < 0.55 && Math.abs(relX - 0.5) < 0.35 && relArea > 0.03 && relArea < 0.2) {
      return { role: 'BOOK_PAGE', confidence: 0.81 };
    }

    // 6. Laurels (left/right flanks)
    if ((relX < 0.25 || relX > 0.75) && relY > 0.3 && relY < 0.8 && relArea < 0.03) {
      return { role: 'LAUREL_LEAF', confidence: 0.75 };
    }

    // 7. Sun rays (top central fan)
    if (relY < 0.3 && Math.abs(relX - 0.5) < 0.35 && aspectRatio < 0.5 && relArea < 0.015) {
      return { role: 'SUN_RAY', confidence: 0.79 };
    }

    // 8. Flame
    if (relY > 0.2 && relY < 0.45 && Math.abs(relX - 0.5) < 0.15 && relArea < 0.04) {
      return { role: 'FLAME', confidence: 0.72 };
    }

    // 9. Stars
    if (relY > 0.7 && (relX < 0.25 || relX > 0.75) && relArea < 0.01) {
      return { role: 'STAR', confidence: 0.85 };
    }

    return { role: 'UNKNOWN', confidence: 0.2 };
  }

  // =========================================================================
  // SVG PARSING HELPERS
  // =========================================================================

  private static extractPointsFromSvgD(d: string): Point2D[] {
    const points: Point2D[] = [];
    if (!d) return points;

    // Simple path commands parsing (M, L, C, Z, etc.)
    const commands = d.match(/([a-zA-Z])([^a-zA-Z]*)/g);
    if (!commands) return points;

    let currX = 0;
    let currY = 0;

    commands.forEach((cmd) => {
      const type = cmd[0];
      const args = cmd
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat)
        .filter((n) => !isNaN(n));

      if (type === 'M' || type === 'L') {
        if (args.length >= 2) {
          currX = args[0];
          currY = args[1];
          points.push({ x: currX, y: currY });
        }
      } else if (type === 'm' || type === 'l') {
        if (args.length >= 2) {
          currX += args[0];
          currY += args[1];
          points.push({ x: currX, y: currY });
        }
      } else if (type === 'C' || type === 'c') {
        // Sample cubic bezier endpoint
        if (args.length >= 6) {
          if (type === 'C') {
            currX = args[4];
            currY = args[5];
          } else {
            currX += args[4];
            currY += args[5];
          }
          points.push({ x: currX, y: currY });
        }
      }
    });

    return points;
  }

  private static extractPointsFromPolyAttr(pointsAttr: string): Point2D[] {
    const coords = pointsAttr
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)
      .filter((n) => !isNaN(n));
    const points: Point2D[] = [];
    for (let i = 0; i < coords.length - 1; i += 2) {
      points.push({ x: coords[i], y: coords[i + 1] });
    }
    return points;
  }

  private static createEmptyGraph(): SvgTopologyGraph {
    return {
      nodes: {},
      edges: [],
      rootNodeIds: [],
      maxDepth: 0,
      totalNodes: 0,
      orphanCount: 0,
      stats: {
        shieldsCount: 0,
        booksCount: 0,
        globesCount: 0,
        bannersCount: 0,
        textsCount: 0,
        laurelsCount: 0,
        raysCount: 0,
        starsCount: 0
      }
    };
  }
}
