/**
 * Acom Embroidery Engine (AEE) - Region Segmentation Engine
 * RegionLabeling.ts - Traitement des régions, calcul des centroïdes & fusion du bruit
 *
 * Implémentation AEE-002 conforme à AGENTS.md (Règle 0 & Règle 50)
 */

import { GradientMapData, LabColor, deltaELab } from './GradientMap';
import { WatershedResult } from './AdaptiveWatershed';

export interface Point2D {
  x: number;
  y: number;
}

export interface SegmentedRegion {
  id: string;
  numericId: number;
  colorHex: string;
  labColor: LabColor;
  area: number;
  boundaryPoints: Point2D[];
  isBackground: boolean;
  centroid: Point2D;
}

export interface LabelingOptions {
  minRegionArea?: number; // Minimum region size in pixels (default: 16)
  mergeThresholdDeltaE?: number; // DeltaE threshold for merging similar regions
}

/**
 * Convertit CIELAB en code couleur Hex (pour le rendu et l'affichage).
 */
export function labToHex(lab: LabColor): string {
  // LAB -> XYZ
  const fy = (lab.l + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const x = (fx > 0.206897 ? Math.pow(fx, 3) : (fx - 16 / 116) / 7.787) * 95.047;
  const y = (fy > 0.206897 ? Math.pow(fy, 3) : (fy - 16 / 116) / 7.787) * 100.000;
  const z = (fz > 0.206897 ? Math.pow(fz, 3) : (fz - 16 / 116) / 7.787) * 108.883;

  // XYZ -> Linear RGB
  let r = (x * 3.2406 - y * 1.5372 - z * 0.4986) / 100;
  let g = (-x * 0.9689 + y * 1.8758 + z * 0.0415) / 100;
  let b = (x * 0.0557 - y * 0.2040 + z * 1.0570) / 100;

  // Linear RGB -> sRGB
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const hexR = clamp(r).toString(16).padStart(2, '0');
  const hexG = clamp(g).toString(16).padStart(2, '0');
  const hexB = clamp(b).toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}

/**
 * Nettoie les labels, calcule les propriétés des régions et élimine les micro-bruits.
 */
export function extractAndCleanRegions(
  gradData: GradientMapData,
  watershed: WatershedResult,
  options: LabelingOptions = {}
): SegmentedRegion[] {
  const { width, height, labPixels } = gradData;
  const { labels, numRegions } = watershed;
  const minArea = options.minRegionArea ?? 16;
  const totalPixels = width * height;

  // Accumulateurs par région
  const regionStats = new Map<number, {
    count: number;
    sumL: number;
    sumA: number;
    sumB: number;
    sumX: number;
    sumY: number;
    boundary: Point2D[];
  }>();

  // 1. Première passe : Accumulation des statistiques
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let label = labels[idx];

      if (label <= 0) {
        // Pixel de frontière (-1) ou non étiqueté (0) -> Assigner au voisin le plus proche
        let bestNLabel = 1;
        for (const dy of [-1, 0, 1]) {
          for (const dx of [-1, 0, 1]) {
            const nIdx = (y + dy) * width + (x + dx);
            if (nIdx >= 0 && nIdx < totalPixels && labels[nIdx] > 0) {
              bestNLabel = labels[nIdx];
              break;
            }
          }
        }
        label = bestNLabel;
        labels[idx] = label;
      }

      let stat = regionStats.get(label);
      if (!stat) {
        stat = { count: 0, sumL: 0, sumA: 0, sumB: 0, sumX: 0, sumY: 0, boundary: [] };
        regionStats.set(label, stat);
      }

      stat.count++;
      stat.sumL += labPixels[idx * 3];
      stat.sumA += labPixels[idx * 3 + 1];
      stat.sumB += labPixels[idx * 3 + 2];
      stat.sumX += x;
      stat.sumY += y;

      // Détection de bordure de pixel (au moins un voisin est d'une autre région)
      let isEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (!isEdge) {
        if (labels[idx - 1] !== label || labels[idx + 1] !== label ||
            labels[idx - width] !== label || labels[idx + width] !== label) {
          isEdge = true;
        }
      }

      if (isEdge) {
        stat.boundary.push({ x, y });
      }
    }
  }

  // 2. Construction des objets de région préliminaires
  const rawRegions: SegmentedRegion[] = [];

  for (const [numericId, stat] of regionStats.entries()) {
    if (stat.count === 0) continue;

    const meanLab: LabColor = {
      l: stat.sumL / stat.count,
      a: stat.sumA / stat.count,
      b: stat.sumB / stat.count
    };

    const centroid: Point2D = {
      x: Math.round(stat.sumX / stat.count),
      y: Math.round(stat.sumY / stat.count)
    };

    // Détection basique du fond (région touchant les 4 bords avec grande surface)
    const touchesEdge = stat.boundary.some(p => p.x === 0 || p.y === 0 || p.x === width - 1 || p.y === height - 1);
    const isBackground = touchesEdge && (stat.count > totalPixels * 0.15);

    rawRegions.push({
      id: `region_${numericId}`,
      numericId,
      colorHex: labToHex(meanLab),
      labColor: meanLab,
      area: stat.count,
      boundaryPoints: stat.boundary,
      isBackground,
      centroid
    });
  }

  // 3. Fusion des régions de couleurs similaires (Adjacency Merging par DeltaE)
  const mergeDeltaE = options.mergeThresholdDeltaE ?? 8.0;
  let mergedAny = true;

  while (mergedAny && rawRegions.length > 1) {
    mergedAny = false;
    let bestPair: [number, number] | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < rawRegions.length; i++) {
      for (let j = i + 1; j < rawRegions.length; j++) {
        const dE = deltaELab(rawRegions[i].labColor, rawRegions[j].labColor);
        if (dE < mergeDeltaE && dE < minDistance) {
          minDistance = dE;
          bestPair = [i, j];
        }
      }
    }

    if (bestPair) {
      const [idx1, idx2] = bestPair;
      const r1 = rawRegions[idx1];
      const r2 = rawRegions[idx2];

      // Fusionner r2 dans r1
      const newArea = r1.area + r2.area;
      const newLab: LabColor = {
        l: (r1.labColor.l * r1.area + r2.labColor.l * r2.area) / newArea,
        a: (r1.labColor.a * r1.area + r2.labColor.a * r2.area) / newArea,
        b: (r1.labColor.b * r1.area + r2.labColor.b * r2.area) / newArea
      };

      r1.area = newArea;
      r1.labColor = newLab;
      r1.colorHex = labToHex(newLab);
      r1.boundaryPoints.push(...r2.boundaryPoints);

      rawRegions.splice(idx2, 1);
      mergedAny = true;
    }
  }

  // 4. Filtrage du bruit : Absorption des micro-régions (< minArea)
  const validRegions = rawRegions.filter(r => r.area >= minArea);
  const microRegions = rawRegions.filter(r => r.area < minArea);

  if (microRegions.length > 0 && validRegions.length > 0) {
    for (const micro of microRegions) {
      // Trouver la région valide la plus proche en couleur ΔE
      let nearestValid = validRegions[0];
      let minDeltaE = deltaELab(micro.labColor, validRegions[0].labColor);

      for (let i = 1; i < validRegions.length; i++) {
        const dist = deltaELab(micro.labColor, validRegions[i].labColor);
        if (dist < minDeltaE) {
          minDeltaE = dist;
          nearestValid = validRegions[i];
        }
      }

      // Fusionner la micro-région dans la région valide choisie
      nearestValid.area += micro.area;
      nearestValid.boundaryPoints.push(...micro.boundaryPoints);
    }
  }

  return validRegions.length > 0 ? validRegions : rawRegions;
}
