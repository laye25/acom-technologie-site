/**
 * Acom Embroidery Engine (AEE) - Region Segmentation Engine
 * AdaptiveWatershed.ts - Algorithme d'inondation topographique par ligne de partage des eaux
 *
 * Implémentation AEE-002 conforme à AGENTS.md (Règle 0, Règle 40 & Règle 50)
 */

import { GradientMapData } from './GradientMap';

export interface WatershedResult {
  labels: Int32Array; // Label ID assigned to each pixel (0 = Watershed boundary, >0 = Region ID)
  numRegions: number;
  minimaCount: number;
}

export interface WatershedOptions {
  gradientThreshold?: number; // Minimum gradient magnitude to consider a boundary
  minRegionArea?: number;     // Minimum area to retain a basin minimum
}

/**
 * Exécute l'inondation Watershed basée sur la file de priorité du gradient.
 */
export function runAdaptiveWatershed(
  gradData: GradientMapData,
  options: WatershedOptions = {}
): WatershedResult {
  const { width, height, gradientMagnitude } = gradData;
  const totalPixels = width * height;
  const labels = new Int32Array(totalPixels); // Init to 0 (Unlabeled)

  const gradThreshold = options.gradientThreshold ?? 3.5;

  // 1. Identifier les minima locaux significatifs de la carte de gradient (Seed selection)
  const isMinimum = new Uint8Array(totalPixels);
  let minCount = 0;

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const idx = y * width + x;
      const val = gradientMagnitude[idx];

      if (val >= gradThreshold) continue;

      let isMin = true;
      // Verification dans un masque 5x5 pour eviter la sur-segmentation
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = (y + dy) * width + (x + dx);
          if (gradientMagnitude[nIdx] < val) {
            isMin = false;
            break;
          }
        }
        if (!isMin) break;
      }

      if (isMin) {
        isMinimum[idx] = 1;
        minCount++;
      }
    }
  }

  // 2. Étiqueter les graines (seeds) des minima locaux
  let currentLabel = 1;
  const queue: number[] = [];

  for (let i = 0; i < totalPixels; i++) {
    if (isMinimum[i] === 1 && labels[i] === 0) {
      // Propagation BFS pour donner le même label au bassin contigu du minimum
      const basinQueue = [i];
      labels[i] = currentLabel;

      while (basinQueue.length > 0) {
        const p = basinQueue.pop()!;
        const px = p % width;
        const py = Math.floor(p / width);

        // Voisins 4-connexes
        const neighbors = [
          py > 0 ? p - width : -1,
          py < height - 1 ? p + width : -1,
          px > 0 ? p - 1 : -1,
          px < width - 1 ? p + 1 : -1
        ];

        for (const nIdx of neighbors) {
          if (nIdx !== -1 && isMinimum[nIdx] === 1 && labels[nIdx] === 0) {
            labels[nIdx] = currentLabel;
            basinQueue.push(nIdx);
          }
        }
      }

      currentLabel++;
    }
  }

  // 3. Tri des pixels non étiquetés par niveau de gradient (Inondation progressive)
  const unlabeledIndices: number[] = [];
  for (let i = 0; i < totalPixels; i++) {
    if (labels[i] === 0) {
      unlabeledIndices.push(i);
    }
  }

  // Tri ascendant selon la valeur du gradient
  unlabeledIndices.sort((a, b) => gradientMagnitude[a] - gradientMagnitude[b]);

  // Propagation par priorité de gradient
  for (const idx of unlabeledIndices) {
    const x = idx % width;
    const y = Math.floor(idx / width);

    const neighbors = [
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1
    ];

    let neighborLabel = 0;
    let isBoundary = false;

    for (const nIdx of neighbors) {
      if (nIdx === -1) continue;
      const nLab = labels[nIdx];
      if (nLab > 0) {
        if (neighborLabel === 0) {
          neighborLabel = nLab;
        } else if (neighborLabel !== nLab) {
          // Confluence de deux bassins différents -> Ligne de partage des eaux (Boundary = -1)
          isBoundary = true;
          break;
        }
      }
    }

    if (isBoundary) {
      labels[idx] = -1; // Watershed boundary
    } else if (neighborLabel > 0) {
      labels[idx] = neighborLabel;
    }
  }

  return {
    labels,
    numRegions: currentLabel - 1,
    minimaCount: minCount
  };
}
