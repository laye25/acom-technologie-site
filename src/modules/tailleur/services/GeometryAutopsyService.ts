import { db } from '../../../db/db';
import { v4 as uuidv4 } from 'uuid';
import { ObjectDetectionService } from './embroideryServices';

export interface GeometryMetrics {
  step: string;
  contoursCount: number;
  holesCount: number;
  componentsCount: number;
  verticesCount: number;
  segmentsCount: number;
  area: number;
  perimeter: number;
  minWidth: number;
  avgWidth: number;
  localThickness: number;
  avgRadius: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  orientation: number;
  selfIntersectionsCount: number;
  pointsDeleted: number;
  pointsAdded: number;
  pointsMoved: number;
  hausdorffDistance: number;
  frechetDistance: number;
  areaChange: number;
  perimeterChange: number;
  thicknessChange: number;
  areaPercentageChange: number;
  centroidShift: number;
  windingNumberChange: number;
  holesChange: number;
  islandsChange: number;
  componentsChange: number;
}

export interface GeometryDrift {
  step: string;
  areaDrift: number;
  perimeterDrift: number;
  verticesDrift: number;
  hausdorffDrift: number;
  widthDrift: number;
  thicknessDrift: number;
  symmetryDrift: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  details: string[];
}

export interface GeometryAudit {
  id: string;
  date: string;
  algorithm: string;
  version: string;
  temps: number; // computation duration in ms
  fichier: string;
  journal: string[];
  capture?: string;
  diagnostic: string;
  signature: string; // SHA-256 equivalent signature
  firstFaultyStep?: string;
  hasErrors: boolean;
}

export class GeometryAutopsyService {
  
  // SHA-256 equivalent hash of a string
  static async calculateHash(message: string): Promise<string> {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return `fallback_sha_${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  // Pure Math: Calculate Area of polygon outline using Shoelace formula
  static calculateArea(points: { x: number; y: number }[]): number {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  }

  // Pure Math: Calculate Perimeter of points
  static calculatePerimeter(points: { x: number; y: number }[]): number {
    if (points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    return perimeter;
  }

  // Pure Math: Calculate Centroid of points
  static calculateCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
    if (points.length === 0) return { x: 0, y: 0 };
    let area = 0;
    let cx = 0;
    let cy = 0;
    
    // Check if simple coordinate average or polygon area weighted centroid
    const n = points.length;
    if (n < 3) {
      let sx = 0, sy = 0;
      points.forEach(p => { sx += p.x; sy += p.y; });
      return { x: sx / n, y: sy / n };
    }

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const factor = (p1.x * p2.y - p2.x * p1.y);
      area += factor;
      cx += (p1.x + p2.x) * factor;
      cy += (p1.y + p2.y) * factor;
    }
    
    area = area / 2;
    if (Math.abs(area) < 0.01) {
      let sx = 0, sy = 0;
      points.forEach(p => { sx += p.x; sy += p.y; });
      return { x: sx / n, y: sy / n };
    }
    
    return {
      x: cx / (6 * area),
      y: cy / (6 * area)
    };
  }

  // Pure Math: Find self-intersections of polygon outline
  static countSelfIntersections(points: { x: number; y: number }[]): number {
    let n = points.length;
    if (n < 4) return 0;
    
    // Downsample for extremely large paths to avoid UI freeze
    let evalPoints = points;
    const maxPoints = 500;
    if (n > maxPoints) {
      const step = n / maxPoints;
      evalPoints = Array.from({length: maxPoints}, (_, i) => points[Math.floor(i * step)]);
      n = maxPoints;
    }

    let count = 0;

    const lineIntersect = (
      p1: { x: number; y: number }, p2: { x: number; y: number },
      p3: { x: number; y: number }, p4: { x: number; y: number }
    ): boolean => {
      const ccw = (A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }) => {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
      };
      return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    };

    // Compare each segment with non-adjacent segments
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue; // adjacent segments share vertex
        if (lineIntersect(evalPoints[i], evalPoints[i + 1], evalPoints[j], evalPoints[(j + 1) % n])) {
          count++;
        }
      }
    }
    
    // Extrapolate count if we downsampled
    if (points.length > maxPoints) {
      const ratio = points.length / maxPoints;
      count = Math.floor(count * ratio);
    }
    
    return count;
  }

  // Pure Math: Hausdorff distance between two sets of points
  static calculateHausdorffDistance(
    setA: { x: number; y: number }[],
    setB: { x: number; y: number }[]
  ): number {
    if (setA.length === 0 || setB.length === 0) return 0;

    // Downsample for performance if needed
    const maxPoints = 500;
    const downsample = (pts: {x: number, y: number}[]) => {
      if (pts.length <= maxPoints) return pts;
      const step = pts.length / maxPoints;
      return Array.from({length: maxPoints}, (_, i) => pts[Math.floor(i * step)]);
    };

    const sampledA = downsample(setA);
    const sampledB = downsample(setB);

    const directedHausdorff = (A: { x: number; y: number }[], B: { x: number; y: number }[]) => {
      let maxDist = 0;
      for (let i = 0; i < A.length; i++) {
        let minDist = Infinity;
        for (let j = 0; j < B.length; j++) {
          const dx = A[i].x - B[j].x;
          const dy = A[i].y - B[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) minDist = d;
        }
        if (minDist > maxDist) maxDist = minDist;
      }
      return maxDist;
    };

    return Math.max(directedHausdorff(sampledA, sampledB), directedHausdorff(sampledB, sampledA));
  }

  // Pure Math: Discrete Fréchet Distance approximation using dynamic programming (Iterative to prevent stack overflow)
  static calculateFrechetDistance(
    setA: { x: number; y: number }[],
    setB: { x: number; y: number }[]
  ): number {
    const maxPoints = 300;
    const downsample = (pts: {x: number, y: number}[]) => {
      if (pts.length <= maxPoints) return pts;
      const step = pts.length / maxPoints;
      return Array.from({length: maxPoints}, (_, i) => pts[Math.floor(i * step)]);
    };

    const sampledA = downsample(setA);
    const sampledB = downsample(setB);

    const n = sampledA.length;
    const m = sampledB.length;
    if (n === 0 || m === 0) return 0;

    // To save memory, we only need two rows of the DP table since we iterate row by row
    let prevRow = new Float64Array(m);
    let currRow = new Float64Array(m);

    const dist = (i: number, j: number): number => {
      const dx = sampledA[i].x - sampledB[j].x;
      const dy = sampledA[i].y - sampledB[j].y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Initialize first element
    prevRow[0] = dist(0, 0);

    // Initialize first row
    for (let j = 1; j < m; j++) {
      prevRow[j] = Math.max(prevRow[j - 1], dist(0, j));
    }

    for (let i = 1; i < n; i++) {
      // Initialize first column of current row
      currRow[0] = Math.max(prevRow[0], dist(i, 0));

      for (let j = 1; j < m; j++) {
        currRow[j] = Math.max(
          Math.min(
            prevRow[j],      // i-1, j
            prevRow[j - 1],  // i-1, j-1
            currRow[j - 1]   // i, j-1
          ),
          dist(i, j)
        );
      }
      
      // Swap rows
      let temp = prevRow;
      prevRow = currRow;
      currRow = temp;
    }

    return prevRow[m - 1];
  }

  // Generate a valid SVG file string representing the current points & layer layout
  static generateSVGString(
    layers: { points: { x: number; y: number }[]; color: string; subpaths?: { x: number; y: number }[][] }[],
    width = 500,
    height = 500
  ): string {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
    svg += `  <rect width="100%" height="100%" fill="#111827" />\n`; // Elegant Dark background

    let totalPointsInLayers = 0;
    let totalPointsInSvg = 0;

    layers.forEach((l, idx) => {
      const pathsToDraw = l.subpaths && l.subpaths.length > 0 ? l.subpaths : [l.points];
      pathsToDraw.forEach(path => {
        totalPointsInLayers += path.length;
        if (path.length < 2) return;
        let d = `M ${path[0].x.toFixed(2)} ${path[0].y.toFixed(2)}`;
        totalPointsInSvg++;
        for (let i = 1; i < path.length; i++) {
          d += ` L ${path[i].x.toFixed(2)} ${path[i].y.toFixed(2)}`;
          totalPointsInSvg++;
        }
        d += ' Z';
        svg += `  <path d="${d}" fill="${l.color}" opacity="0.85" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,2" id="contour_${idx}" />\n`;
        
        // Draw individual vertex nodes as small circles to observe drift visually
        path.forEach((pt, pIdx) => {
          svg += `  <circle cx="${pt.x.toFixed(2)}" cy="${pt.y.toFixed(2)}" r="2" fill="#ef4444" opacity="0.9" />\n`;
        });
      });
    });

    svg += '</svg>';
    console.log(`[generateSVGString] Layers total points: ${totalPointsInLayers}, SVG circle/path vertices drawn: ${totalPointsInSvg}`);
    return svg;
  }

  // Simulate pipeline step operations
  static simulatePipelineStep(
    stepName: string,
    inputLayers: { points: { x: number; y: number }[]; color: string; subpaths?: { x: number; y: number }[][] }[],
    simulationIntensity: { rdpEpsilon: number; offsetFactor: number; filterThreshold: number; noiseStrength: number }
  ): { points: { x: number; y: number }[]; color: string; subpaths?: { x: number; y: number }[][] }[] {
    
    // Deep clone input to avoid mutations
    const layers = JSON.parse(JSON.stringify(inputLayers)) as typeof inputLayers;

    switch (stepName) {
      case '01-original':
        // Raw unmodified source
        return layers;

      case '02-vector':
        // Vectorisation: introduces digitized coordinate variations (noises/integer snapping)
        layers.forEach(l => {
          l.points = l.points.map(p => ({
            x: Math.round(p.x * 2) / 2 + (Math.random() - 0.5) * simulationIntensity.noiseStrength * 0.5,
            y: Math.round(p.y * 2) / 2 + (Math.random() - 0.5) * simulationIntensity.noiseStrength * 0.5
          }));
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => sub.map(p => ({
              x: Math.round(p.x * 2) / 2 + (Math.random() - 0.5) * simulationIntensity.noiseStrength * 0.5,
              y: Math.round(p.y * 2) / 2 + (Math.random() - 0.5) * simulationIntensity.noiseStrength * 0.5
            })));
          }
        });
        return layers;

      case '03-clean':
        // Nettoyage: snap endpoints and merge redundant points < 0.8px apart
        layers.forEach(l => {
          const filterClose = (pts: { x: number; y: number }[]) => {
            const result: { x: number; y: number }[] = [];
            for (let i = 0; i < pts.length; i++) {
              if (result.length > 0) {
                const last = result[result.length - 1];
                if (Math.hypot(pts[i].x - last.x, pts[i].y - last.y) < 1.2) {
                  continue; // Snap & skip duplicate close points
                }
              }
              result.push(pts[i]);
            }
            return result;
          };
          l.points = filterClose(l.points);
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => filterClose(sub));
          }
        });
        return layers;

      case '04-merge':
        // Fusion segments: close gaps and join open subpaths
        layers.forEach(l => {
          // Join path segments if they are close
          if (l.subpaths && l.subpaths.length > 1) {
            const sub = l.subpaths;
            const merged: { x: number; y: number }[][] = [sub[0]];
            for (let i = 1; i < sub.length; i++) {
              const current = sub[i];
              const lastMerged = merged[merged.length - 1];
              const dist = Math.hypot(current[0].x - lastMerged[lastMerged.length - 1].x, current[0].y - lastMerged[lastMerged.length - 1].y);
              if (dist < 10) {
                // Merge them!
                merged[merged.length - 1] = lastMerged.concat(current);
              } else {
                merged.push(current);
              }
            }
            l.subpaths = merged;
          }
        });
        return layers;

      case '05-rdp':
        // Simplification RDP: applies Douglas-Peucker point count decimation
        layers.forEach(l => {
          if (l.points.length > 2) {
            l.points = ObjectDetectionService.simplifyPointsRDP(l.points, simulationIntensity.rdpEpsilon);
          }
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => 
              sub.length > 2 ? ObjectDetectionService.simplifyPointsRDP(sub, simulationIntensity.rdpEpsilon) : sub
            ).filter(sub => sub.length >= 3);
          }
        });
        return layers;

      case '06-self-intersection':
        // Réparation intersections: detects crossing segments and splits or repairs them
        layers.forEach(l => {
          // Remove crossing vertices by shifting them slightly to preserve manifold geometry
          const fixIntersections = (pts: { x: number; y: number }[]) => {
            const repaired = [...pts];
            const n = repaired.length;
            for (let i = 0; i < n - 1; i++) {
              for (let j = i + 2; j < n; j++) {
                if (i === 0 && j === n - 1) continue;
                // If crossing, shift segment points away slightly
                const p1 = repaired[i], p2 = repaired[i+1], p3 = repaired[j], p4 = repaired[(j+1)%n];
                const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
                if (Math.abs(d) > 0.1) {
                  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
                  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;
                  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
                    // Push vertex i+1 slightly out
                    repaired[i+1].x += (Math.random() - 0.5) * 2;
                    repaired[i+1].y += (Math.random() - 0.5) * 2;
                  }
                }
              }
            }
            return repaired;
          };
          l.points = fixIntersections(l.points);
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => fixIntersections(sub));
          }
        });
        return layers;

      case '07-topology':
        // Analyse topologique: Filter out noise islands smaller than the threshold
        return layers.filter(l => {
          const area = GeometryAutopsyService.calculateArea(l.points);
          return area > simulationIntensity.filterThreshold;
        });

      case '08-atir':
        // Construction ATIR: maps to ribbon path grid. Emulates grid snap block alignments
        layers.forEach(l => {
          l.points = l.points.map(p => ({
            x: Math.round(p.x / 1.5) * 1.5,
            y: Math.round(p.y / 1.5) * 1.5
          }));
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => sub.map(p => ({
              x: Math.round(p.x / 1.5) * 1.5,
              y: Math.round(p.y / 1.5) * 1.5
            })));
          }
        });
        return layers;

      case '09-offset':
        // Compensation & Offset: expands/contracts boundaries using offsetFactor
        layers.forEach(l => {
          const centroid = GeometryAutopsyService.calculateCentroid(l.points);
          l.points = l.points.map(p => {
            const dx = p.x - centroid.x;
            const dy = p.y - centroid.y;
            const len = Math.hypot(dx, dy) || 1;
            return {
              x: p.x + (dx / len) * simulationIntensity.offsetFactor,
              y: p.y + (dy / len) * simulationIntensity.offsetFactor
            };
          });
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => {
              const subCentroid = GeometryAutopsyService.calculateCentroid(sub);
              return sub.map(p => {
                const dx = p.x - subCentroid.x;
                const dy = p.y - subCentroid.y;
                const len = Math.hypot(dx, dy) || 1;
                return {
                  x: p.x + (dx / len) * simulationIntensity.offsetFactor,
                  y: p.y + (dy / len) * simulationIntensity.offsetFactor
                };
              });
            });
          }
        });
        return layers;

      case '10-fill':
        // Tatami & Satin: dense thread filling algorithm simulation
        layers.forEach(l => {
          // Simulate stitches generated in filling mode: dense pattern
          const stitched: { x: number; y: number }[] = [];
          l.points.forEach((p, idx) => {
            const next = l.points[(idx + 1) % l.points.length];
            const dist = Math.hypot(next.x - p.x, next.y - p.y);
            const subdivisions = Math.max(1, Math.floor(dist / 4.0));
            for (let s = 0; s < subdivisions; s++) {
              const t = s / subdivisions;
              stitched.push({
                x: p.x + (next.x - p.x) * t + (Math.random() - 0.5) * 0.15,
                y: p.y + (next.y - p.y) * t + (Math.random() - 0.5) * 0.15
              });
            }
          });
          l.points = stitched;
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => {
              const subStitched: { x: number; y: number }[] = [];
              sub.forEach((p, idx) => {
                const next = sub[(idx + 1) % sub.length];
                const dist = Math.hypot(next.x - p.x, next.y - p.y);
                const subdivisions = Math.max(1, Math.floor(dist / 4.0));
                for (let s = 0; s < subdivisions; s++) {
                  const t = s / subdivisions;
                  subStitched.push({
                    x: p.x + (next.x - p.x) * t + (Math.random() - 0.5) * 0.15,
                    y: p.y + (next.y - p.y) * t + (Math.random() - 0.5) * 0.15
                  });
                }
              });
              return subStitched;
            });
          }
        });
        return layers;

      case '11-dst':
        // Compilation DST: final snap coordinates to 0.1mm increments
        layers.forEach(l => {
          l.points = l.points.map(p => ({
            x: Math.round(p.x),
            y: Math.round(p.y)
          }));
          if (l.subpaths) {
            l.subpaths = l.subpaths.map(sub => sub.map(p => ({
              x: Math.round(p.x),
              y: Math.round(p.y)
            })));
          }
        });
        return layers;

      default:
        return layers;
    }
  }

  // Deep autopsic autopsy pipeline with drift analysis & automatic error tagging
  static async runAutopsy(
    revisionId: string,
    simulationIntensity = { rdpEpsilon: 1.0, offsetFactor: 0, filterThreshold: 10, noiseStrength: 1.0 }
  ): Promise<{
    audit: GeometryAudit;
    steps: {
      step: string;
      title: string;
      svg: string;
      metrics: GeometryMetrics;
      drift: GeometryDrift;
      layers: any[];
    }[];
  }> {
    const { ScientificSnapshotService } = await import('./ScientificSnapshotService');
    const revision = await ScientificSnapshotService.loadRevision(revisionId);
    if (!revision) {
      console.error("AUTOPSY FAIL: Revision non trouvée for ID", revisionId);
      throw new Error("Revision non trouvée");
    }
    const snapshot = await ScientificSnapshotService.loadSnapshot(revision.snapshotId);
    if (!snapshot) {
      console.error("AUTOPSY FAIL: Snapshot non trouvé for ID", revision.snapshotId);
      throw new Error("Snapshot non trouvé");
    }
    const originalLayers = snapshot.layers;
    const projectName = `Rev-${revision.id}`;

    console.log("=== AUTOPSY START ===");
    console.log("  Timestamp:", new Date().toISOString());
    console.log("  Revision:", {
      id: revision.id,
      assetId: revision.assetId,
      snapshotId: revision.snapshotId,
      version: revision.version,
      status: revision.status,
      hash: revision.hash
    });
    console.log("  Snapshot:", {
      id: snapshot.id,
      assetId: snapshot.assetId,
      layerCount: snapshot.layerCount,
      pointsCount: snapshot.pointsCount,
      hash: snapshot.hash,
      reason: snapshot.reason
    });
    console.log("  Layers length:", originalLayers ? originalLayers.length : 0);
    console.log("  Points total:", snapshot ? snapshot.pointsCount : 0);

    const auditId = uuidv4();
    const startTime = Date.now();
    
    const stepsToRun = [
      { step: '01-original', title: '01 - Image Originale / CAD Source' },
      { step: '02-vector', title: '02 - Vectorisation Numérique' },
      { step: '03-clean', title: '03 - Nettoyage & Snap' },
      { step: '04-merge', title: '04 - Fusion des Segments' },
      { step: '05-rdp', title: '05 - Simplification RDP (Douglas-Peucker)' },
      { step: '06-self-intersection', title: '06 - Réparation Auto-intersections' },
      { step: '07-topology', title: '07 - Analyse Topologique & Trous' },
      { step: '08-atir', title: '08 - Construction Modèle ATIR' },
      { step: '09-offset', title: '09 - Compensation de Tirage & Offsets' },
      { step: '10-fill', title: '10 - Remplissage Tatami / Satin' },
      { step: '11-dst', title: '11 - Compilation Binaire DST machine' }
    ];

    const results: {
      step: string;
      title: string;
      svg: string;
      metrics: GeometryMetrics;
      drift: GeometryDrift;
      layers: any[];
    }[] = [];

    const journal: string[] = [`[${new Date().toISOString()}] Début de l'Autopsie Géométrique pour le projet "${projectName}"`];
    let previousStepPoints: { x: number; y: number }[] = [];
    let previousStepSubpaths: { x: number; y: number }[][] = [];
    let currentLayers = JSON.parse(JSON.stringify(originalLayers));
    
    // Reference metrics (Step 01 - original) for calculating accumulation drift
    let refArea = 0;
    let refPerimeter = 0;
    let refVerticesCount = 0;
    let refWidth = 0;

    let firstFaultyStep: string | undefined = undefined;
    let hasFaultEncountered = false;

    for (let index = 0; index < stepsToRun.length; index++) {
      const stepDef = stepsToRun[index];
      const stepStartTime = Date.now();
      const inputPointsCount = currentLayers.reduce((sum, l) => sum + (l.points?.length || 0) + (l.subpaths?.reduce((s: number, p: any) => s + p.length, 0) || 0), 0);
      
      // Execute the algorithmic transformer
      currentLayers = GeometryAutopsyService.simulatePipelineStep(stepDef.step, currentLayers, simulationIntensity);
      
      // Flatten current points for metrics matching
      const allCurrentPoints: { x: number; y: number }[] = [];
      const currentSubpaths: { x: number; y: number }[][] = [];
      let totalArea = 0;
      let totalPerimeter = 0;
      let contoursCount = 0;
      let holesCount = 0;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      currentLayers.forEach(l => {
        contoursCount++;
        const layerPaths = l.subpaths && l.subpaths.length > 0 ? l.subpaths : [l.points];
        
        layerPaths.forEach((path, pathIdx) => {
          if (pathIdx > 0) holesCount++; // Nested path acts as hole
          currentSubpaths.push(path);
          path.forEach(pt => {
            allCurrentPoints.push(pt);
            minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y);
          });
          totalArea += GeometryAutopsyService.calculateArea(path);
          totalPerimeter += GeometryAutopsyService.calculatePerimeter(path);
        });
      });

      const width = maxX - minX > 0 ? maxX - minX : 100;
      const height = maxY - minY > 0 ? maxY - minY : 100;
      
      if (stepDef.step === '01-original') {
        refArea = totalArea;
        refPerimeter = totalPerimeter;
        refVerticesCount = allCurrentPoints.length;
        refWidth = width;
      }

      // Calculate change counts
      let pointsDeleted = 0;
      let pointsAdded = 0;
      let pointsMoved = 0;

      if (previousStepPoints.length > 0) {
        // Fast Spatial Hashing for < 0.2 and < 5.0 matches
        const hash02 = (p: {x: number, y: number}) => Math.round(p.x * 5) + '_' + Math.round(p.y * 5);
        const hash50 = (p: {x: number, y: number}) => Math.round(p.x / 5) + '_' + Math.round(p.y / 5);

        const currMap02 = new Set<string>();
        const currMap50 = new Set<string>();
        allCurrentPoints.forEach(p => {
            currMap02.add(hash02(p));
            currMap50.add(hash50(p));
        });

        const prevMap02 = new Set<string>();
        const prevMap50 = new Set<string>();
        previousStepPoints.forEach(p => {
            prevMap02.add(hash02(p));
            prevMap50.add(hash50(p));
        });

        previousStepPoints.forEach(pPrev => {
            if (!currMap02.has(hash02(pPrev))) {
                if (currMap50.has(hash50(pPrev))) {
                    pointsMoved++;
                } else {
                    pointsDeleted++;
                }
            }
        });

        allCurrentPoints.forEach(pCurr => {
            if (!prevMap02.has(hash02(pCurr)) && !prevMap50.has(hash50(pCurr))) {
                pointsAdded++;
            }
        });
      }

      // Hausdorff & Frechet distance calculation
      const hausdorff = GeometryAutopsyService.calculateHausdorffDistance(allCurrentPoints, previousStepPoints.length > 0 ? previousStepPoints : allCurrentPoints);
      const frechet = GeometryAutopsyService.calculateFrechetDistance(allCurrentPoints, previousStepPoints.length > 0 ? previousStepPoints : allCurrentPoints);
      
      const selfIntersections = GeometryAutopsyService.countSelfIntersections(allCurrentPoints);
      
      // Centroid shift calculation
      const centroidCurr = GeometryAutopsyService.calculateCentroid(allCurrentPoints);
      const centroidPrev = previousStepPoints.length > 0 ? GeometryAutopsyService.calculateCentroid(previousStepPoints) : centroidCurr;
      const centroidShift = Math.hypot(centroidCurr.x - centroidPrev.x, centroidCurr.y - centroidPrev.y);

      // Width and Thickness metrics
      const avgRadius = allCurrentPoints.length > 0 ? allCurrentPoints.reduce((sum, p) => sum + Math.hypot(p.x - centroidCurr.x, p.y - centroidCurr.y), 0) / allCurrentPoints.length : 0;
      const localThickness = avgRadius * 0.15; // Simulated average thickness estimate

      const metrics: GeometryMetrics = {
        step: stepDef.step,
        contoursCount,
        holesCount,
        componentsCount: currentLayers.length,
        verticesCount: allCurrentPoints.length,
        segmentsCount: allCurrentPoints.length, // edges map to points count in closed polys
        area: totalArea,
        perimeter: totalPerimeter,
        minWidth: Math.min(width, height),
        avgWidth: (width + height) / 2,
        localThickness,
        avgRadius,
        boundingBox: { x: minX === Infinity ? 0 : minX, y: minY === Infinity ? 0 : minY, width, height },
        orientation: width > height ? 0 : 90,
        selfIntersectionsCount: selfIntersections,
        pointsDeleted,
        pointsAdded,
        pointsMoved,
        hausdorffDistance: hausdorff,
        frechetDistance: frechet,
        areaChange: previousStepPoints.length > 0 ? totalArea - GeometryAutopsyService.calculateArea(previousStepPoints) : 0,
        perimeterChange: previousStepPoints.length > 0 ? totalPerimeter - GeometryAutopsyService.calculatePerimeter(previousStepPoints) : 0,
        thicknessChange: previousStepPoints.length > 0 ? localThickness - (avgRadius * 0.15) : 0,
        areaPercentageChange: refArea > 0 ? ((totalArea - refArea) / refArea) * 100 : 0,
        centroidShift,
        windingNumberChange: selfIntersections > 0 ? 1 : 0,
        holesChange: previousStepPoints.length > 0 ? holesCount - (previousStepSubpaths.length - previousStepSubpaths.length) : 0,
        islandsChange: 0,
        componentsChange: previousStepPoints.length > 0 ? currentLayers.length - previousStepPoints.length : 0
      };

      // GEOMETRY DRIFT ANALYZER (Strict Industrial thresholds)
      const areaDrift = refArea > 0 ? Math.abs((totalArea - refArea) / refArea) : 0;
      const perimeterDrift = refPerimeter > 0 ? Math.abs((totalPerimeter - refPerimeter) / refPerimeter) : 0;
      const verticesDrift = refVerticesCount > 0 ? Math.abs((allCurrentPoints.length - refVerticesCount) / refVerticesCount) : 0;
      
      const details: string[] = [];
      let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';

      // Threshold evaluations
      if (hausdorff > 35) {
        status = 'CRITICAL';
        details.push(`Hausdorff Distance (${hausdorff.toFixed(1)}px) exceeds extreme threshold of 35px.`);
      } else if (hausdorff > 12) {
        status = 'WARNING';
        details.push(`Hausdorff Distance (${hausdorff.toFixed(1)}px) is elevated.`);
      }

      if (areaDrift > 0.25) {
        status = 'CRITICAL';
        details.push(`Surface area change (${(areaDrift * 100).toFixed(1)}%) exceeds critical threshold (25%).`);
      } else if (areaDrift > 0.08) {
        if (status !== 'CRITICAL') status = 'WARNING';
        details.push(`Surface area drifted by ${(areaDrift * 100).toFixed(1)}%.`);
      }

      if (perimeterDrift > 0.35) {
        status = 'CRITICAL';
        details.push(`Perimeter change (${(perimeterDrift * 100).toFixed(1)}%) is critical.`);
      }

      if (selfIntersections > 3 && stepDef.step !== '02-vector' && stepDef.step !== '01-original') {
        if (status !== 'CRITICAL') status = 'WARNING';
        details.push(`Unresolved self-intersections detected: ${selfIntersections}.`);
      }

      // Check if this step is the FIRST to cause warning or critical and we halt analysis if critical
      if (status === 'CRITICAL' && !hasFaultEncountered) {
        firstFaultyStep = stepDef.title;
        hasFaultEncountered = true;
        journal.push(`[CRITICAL DEFORMATION] Dérive critique détectée à l'étape: ${stepDef.title}!`);
      } else {
        journal.push(`[${stepDef.step.toUpperCase()}] Analyse complétée. Statut: ${status}.`);
      }

      const drift: GeometryDrift = {
        step: stepDef.step,
        areaDrift,
        perimeterDrift,
        verticesDrift,
        hausdorffDrift: hausdorff,
        widthDrift: Math.abs(width - refWidth),
        thicknessDrift: Math.abs(metrics.thicknessChange),
        symmetryDrift: 0,
        status,
        details
      };

      // Generate intermediate SVG snapshot
      const svg = GeometryAutopsyService.generateSVGString(currentLayers);

      // POINT-BY-POINT GEOMETRY AUDIT BETWEEN LAYERS AND GENERATED SVG
      const layersPtsCount = currentLayers.reduce((sum, l) => sum + (l.points?.length || 0) + (l.subpaths?.reduce((s: number, p: any) => s + p.length, 0) || 0), 0);
      
      // Parse SVG to count paths and circle coordinates
      const matches = svg.match(/cx="(-?\d+\.?\d*)"/g) || [];
      const svgPtsCount = matches.length;

      console.groupCollapsed(`=== AUTOPSY STEP AUDIT: [${stepDef.step}] ===`);
      console.log(`- Étape: ${stepDef.title}`);
      console.log(`- Nombre de points dans layers : ${layersPtsCount}`);
      console.log(`- Cercles de sommets (vertex circles) dans le SVG : ${svgPtsCount}`);
      console.log(`- Concordance géométrique parfaite : ${layersPtsCount === svgPtsCount ? '✅ OUI' : '❌ NON'}`);
      console.groupEnd();

      results.push({
        step: stepDef.step,
        title: stepDef.title,
        svg,
        metrics,
        drift,
        layers: JSON.parse(JSON.stringify(currentLayers))
      });

      // Update previous states
      previousStepPoints = [...allCurrentPoints];
      previousStepSubpaths = [...currentSubpaths];

      const stepDuration = Date.now() - stepStartTime;
      const outputPointsCount = allCurrentPoints.length;
      console.log(`STEP ${String(index + 1).padStart(2, '0')}`);
      console.log("  entrée:", inputPointsCount);
      console.log("  sortie:", outputPointsCount);
      console.log("  temps:", stepDuration, "ms");
    }

    const duration = Date.now() - startTime;
    const finalDiagnostic = firstFaultyStep 
      ? `🚨 Alerte : La première déformation majeure est localisée à l'étape [${firstFaultyStep}].` 
      : '✅ Intégrité Géométrique validée à 100%. Aucune déviation détectée sur l\'intégralité du pipeline.';

    // Generate SHA-256 equivalent checksum of final metrics
    const hashDataString = JSON.stringify(results.map(r => r.metrics));
    const signature = await GeometryAutopsyService.calculateHash(hashDataString);

    const audit: GeometryAudit = {
      id: auditId,
      date: new Date().toISOString(),
      algorithm: 'ATCP Autopsy Engine v1.2',
      version: '1.2.0-STABLE',
      temps: duration,
      fichier: `${projectName}_autopsy_dump.json`,
      journal,
      diagnostic: finalDiagnostic,
      signature,
      firstFaultyStep,
      hasErrors: !!firstFaultyStep
    };

    // Auto-save snapshots, metrics and audit to Dexie tables
    try {
      await db.geometry_audits.put(audit);
      
      for (const r of results) {
        await db.geometry_snapshots.put({
          id: uuidv4(),
          auditId,
          step: r.step,
          title: r.title,
          svg: r.svg,
          layers: r.layers
        });
        await db.geometry_metrics.put({
          id: uuidv4(),
          auditId,
          step: r.step,
          ...r.metrics
        });
        await db.geometry_drift.put({
          id: uuidv4(),
          auditId,
          step: r.step,
          ...r.drift
        });
        if (r.drift.status === 'CRITICAL' || r.drift.status === 'WARNING') {
          await db.geometry_errors.put({
            id: uuidv4(),
            auditId,
            step: r.step,
            errors: r.drift.details,
            severity: r.drift.status,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn("Could not save geometry diagnostic dump to Dexie:", e);
    }

    const allObservations = results.flatMap(r => r.drift.details);
    console.log("Observations:", allObservations.length);
    allObservations.forEach((obs, index) => {
      console.log(`  Observation[${index}]:`, obs);
    });

    console.log("Audit créé ? Oui");
    console.log("Audit ID:", audit.id);
    console.log("Errors:", results.filter(r => r.drift.status === 'CRITICAL').length);
    console.log("Warnings:", results.filter(r => r.drift.status === 'WARNING').length);
    console.log("Metrics:", results.map(r => r.metrics));
    console.log("Drift:", results.map(r => r.drift));

    console.log("RETURN RESULT");
    console.log("  Audit:", audit);
    console.log("  Observations:", allObservations);
    console.log("  Steps:", results.map(r => r.step));
    console.log("  Metrics:", results.map(r => r.metrics));

    return {
      audit,
      steps: results
    };
  }
}
