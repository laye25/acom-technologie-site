/**
 * AEEInkStitchExecutionKernel.ts
 * ============================================================================
 * ACOM EMBROIDERY ENGINE (AEE) — INK/STITCH TEXTILE EXECUTION KERNEL
 * (Règles 40, 50, 53, 59 — Charte de Gouvernance Technique AEE)
 *
 * Architecture Abstraction:
 *   [AEE Semantic Engine (Vectorization / AI Object Reconstruction)]
 *         ↓
 *   [AEE Embroidery Strategy (Decision: Fill, Density, Angle, Underlay, Fabric)]
 *         ↓
 *   [AEE Ink/Stitch Execution Kernel (Pure Textile Execution & Physics)]
 *         ↓
 *   [Binary Exporters (DST / PES / EXP)]
 *
 * Inspiré de la logique open-source éprouvée d'Ink/Stitch (GPL) :
 * - Remplissage Tatami (Trame tissée décalée anti-alignement)
 * - Slicing Satin (Broderie dense en colonnes avec compensation de tirage)
 * - Underlays Structurés (Edge Walk, Center Walk, Grid Zigzag)
 * - Pull Compensation (Compensation physique de rétraction du tissu)
 * - Bean Stitch (Point triple renforcé)
 * - Optimisation de parcours TSP 2-Opt (Réduction des coupes de fil / jumps)
 * ============================================================================
 */

import { EmbroideryPoint, getTatamiStitches, getSatinSlicingStitches, getRunningStitches, combineCloseSegments } from './embroideryServices';

export interface FabricPullSpec {
  fabricName: string;
  pullCompensationMm: number; // e.g. 0.25mm expand perpendicular to stitch angle
  underlayType: 'edge_walk' | 'center_walk' | 'zigzag' | 'grid' | 'none';
  densityFactor: number; // multiplier e.g. 1.0 for cotton, 1.15 for pique jersey
}

export const FABRIC_PROFILES: Record<string, FabricPullSpec> = {
  cotton: { fabricName: 'Coton Standard', pullCompensationMm: 0.20, underlayType: 'edge_walk', densityFactor: 1.0 },
  jersey: { fabricName: 'Jersey / Stretchy', pullCompensationMm: 0.35, underlayType: 'zigzag', densityFactor: 1.15 },
  polyester: { fabricName: 'Polyester / Sport', pullCompensationMm: 0.25, underlayType: 'edge_walk', densityFactor: 1.05 },
  denim: { fabricName: 'Jean / Denim Épais', pullCompensationMm: 0.15, underlayType: 'center_walk', densityFactor: 0.95 },
  fleece: { fabricName: 'Molleton / Sweatshirt', pullCompensationMm: 0.40, underlayType: 'grid', densityFactor: 1.20 },
};

export class AEEInkStitchExecutionKernel {
  /**
   * 1. PULL COMPENSATION KERNEL (Ink/Stitch Pull Comp)
   * Dilate la géométrie du polygone perpendiculairement à la direction du point (angle de broderie)
   * afin de compenser la tension physique du fil qui rétracte le tissu lors du piquage.
   */
  public static applyPullCompensation(
    polygon: EmbroideryPoint[],
    pullCompMm: number,
    stitchAngleDeg: number
  ): EmbroideryPoint[] {
    if (pullCompMm <= 0 || polygon.length < 3) return polygon;

    // Direct orientation perpendicular to stitch angle
    const perpAngleRad = ((stitchAngleDeg + 90) * Math.PI) / 180;
    const dx = Math.cos(perpAngleRad) * pullCompMm * 10; // convert mm to internal canvas units (approx 10 units = 1mm)
    const dy = Math.sin(perpAngleRad) * pullCompMm * 10;

    return polygon.map((p, idx) => {
      const prev = polygon[(idx - 1 + polygon.length) % polygon.length];
      const next = polygon[(idx + 1) % polygon.length];
      
      // Vector along boundary
      const edgeX = next.x - prev.x;
      const edgeY = next.y - prev.y;
      
      // Dot product to check alignment with perpendicular pull vector
      const dot = edgeX * dx + edgeY * dy;
      const sign = dot >= 0 ? 1 : -1;

      return {
        x: p.x + dx * sign * 0.5,
        y: p.y + dy * sign * 0.5,
      };
    });
  }

  /**
   * 2. UNDERLAY STITCH GENERATOR (Ink/Stitch Underlay Engine)
   * Génère les sous-couches de maintien textile avant la passe de finition.
   */
  public static generateUnderlay(
    polygon: EmbroideryPoint[],
    underlayType: 'edge_walk' | 'center_walk' | 'zigzag' | 'grid' | 'none',
    stitchAngleDeg: number = 45
  ): EmbroideryPoint[][] {
    if (underlayType === 'none' || polygon.length < 3) return [];

    const result: EmbroideryPoint[][] = [];

    if (underlayType === 'edge_walk') {
      // Offset polygon inwards by ~0.6mm (6 units)
      const insetPolygon = this.insetPolygon(polygon, 6.0);
      if (insetPolygon.length >= 3) {
        const edgeWalkPts = getRunningStitches(insetPolygon, 25);
        result.push(edgeWalkPts);
      }
    } else if (underlayType === 'center_walk') {
      // Medial walk line running along polygon spine
      const centerLine = this.computeCenterWalkLine(polygon);
      if (centerLine.length >= 2) {
        result.push(getRunningStitches(centerLine, 30));
      }
    } else if (underlayType === 'zigzag' || underlayType === 'grid') {
      // Light underlay fill perpendicular to main stitch angle (90 deg offset) at low density (1.5mm)
      const underlayAngle = (stitchAngleDeg + 90) % 180;
      const zigzagSegments = getTatamiStitches(polygon, 15, underlayAngle);
      result.push(...zigzagSegments);

      if (underlayType === 'grid') {
        // Double grid underlay for plush/fleece fabric
        const gridSegments = getTatamiStitches(polygon, 18, stitchAngleDeg);
        result.push(...gridSegments);
      }
    }

    return result;
  }

  /**
   * 3. BEAN STITCH (TRIPLE RUNNING STITCH)
   * Implémente le point triple d'Ink/Stitch (Avancer -> Reculer -> Avancer)
   * pour les contours nets et renforcés.
   */
  public static generateBeanStitch(points: EmbroideryPoint[], stepPx: number = 25): EmbroideryPoint[] {
    const baseStitches = getRunningStitches(points, stepPx);
    if (baseStitches.length < 2) return baseStitches;

    const beanStitches: EmbroideryPoint[] = [];
    for (let i = 0; i < baseStitches.length - 1; i++) {
      const p1 = baseStitches[i];
      const p2 = baseStitches[i + 1];

      // Pass 1: p1 -> p2
      beanStitches.push(p1);
      // Pass 2: p2 -> p1 (backtrack)
      beanStitches.push(p2);
      // Pass 3: p1 -> p2 (forward again)
      beanStitches.push(p1);
    }
    beanStitches.push(baseStitches[baseStitches.length - 1]);
    return beanStitches;
  }

  /**
   * 4. TATAMI FILL GENERATOR (Ink/Stitch Tatami Engine)
   * Générateur Tatami avec décalage de trame adaptatif (Staggered offset) pour éviter les lignes de gouttière.
   */
  public static generateTatamiFill(
    polygons: EmbroideryPoint[] | EmbroideryPoint[][],
    densityPx: number = 3.5,
    angleDeg: number = 45,
    pullCompMm: number = 0.2
  ): EmbroideryPoint[][] {
    const polys = Array.isArray(polygons[0]) 
      ? (polygons as EmbroideryPoint[][]) 
      : [(polygons as EmbroideryPoint[])];

    // Apply pull compensation to boundary
    const compensatedPolys = polys.map(p => this.applyPullCompensation(p, pullCompMm, angleDeg));

    // Generate Tatami stitch lines with robust point-in-polygon verification
    const segments = getTatamiStitches(compensatedPolys, densityPx, angleDeg);

    // Optimize segment connections (combine adjacent Tatami rows with smooth jumps)
    return combineCloseSegments(segments, 15.0, compensatedPolys);
  }

  /**
   * 5. SATIN COLUMN GENERATOR (Ink/Stitch Satin Engine)
   * Générateur de colonnes satin avec densité constante et chanfreinage.
   */
  public static generateSatinColumn(
    polygons: EmbroideryPoint[] | EmbroideryPoint[][],
    densityPx: number = 4.0,
    angleDeg: number = 45,
    pullCompMm: number = 0.3
  ): EmbroideryPoint[][] {
    const polys = Array.isArray(polygons[0]) 
      ? (polygons as EmbroideryPoint[][]) 
      : [(polygons as EmbroideryPoint[])];

    const compensatedPolys = polys.map(p => this.applyPullCompensation(p, pullCompMm, angleDeg));
    const segments = getSatinSlicingStitches(compensatedPolys, densityPx, angleDeg);

    return combineCloseSegments(segments, 15.0, compensatedPolys);
  }

  /**
   * Helper: Inset polygon boundary for Edge Walk underlay
   */
  private static insetPolygon(polygon: EmbroideryPoint[], insetUnits: number): EmbroideryPoint[] {
    if (polygon.length < 3) return [];

    let cx = 0, cy = 0;
    polygon.forEach(p => { cx += p.x; cy += p.y; });
    cx /= polygon.length;
    cy /= polygon.length;

    return polygon.map(p => {
      const vx = cx - p.x;
      const vy = cy - p.y;
      const dist = Math.sqrt(vx * vx + vy * vy);
      if (dist === 0) return p;

      const scale = Math.min(insetUnits / dist, 0.3);
      return {
        x: p.x + vx * scale,
        y: p.y + vy * scale
      };
    });
  }

  /**
   * Helper: Compute center walk line along polygon spine
   */
  private static computeCenterWalkLine(polygon: EmbroideryPoint[]): EmbroideryPoint[] {
    if (polygon.length < 3) return polygon;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    polygon.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const dx = maxX - minX;
    const dy = maxY - minY;

    if (dx >= dy) {
      // Horizontal spine
      const midY = (minY + maxY) / 2;
      return [
        { x: minX + dx * 0.15, y: midY },
        { x: maxX - dx * 0.15, y: midY }
      ];
    } else {
      // Vertical spine
      const midX = (minX + maxX) / 2;
      return [
        { x: midX, y: minY + dy * 0.15 },
        { x: midX, y: maxY - dy * 0.15 }
      ];
    }
  }
}
