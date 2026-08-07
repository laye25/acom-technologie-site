/**
 * Acom Embroidery Engine (AEE) - Region Segmentation Engine
 * GradientMap.ts - Calcul de carte de gradient perceptuel CIELAB
 *
 * Implémentation AEE-002 conforme à AGENTS.md (Règle 0 & Règle 50)
 */

export interface LabColor {
  l: number; // 0 à 100
  a: number; // -128 à +127
  b: number; // -128 à +127
}

export interface GradientMapData {
  width: number;
  height: number;
  labPixels: Float32Array; // Array of [L, a, b] for each pixel (3 * width * height)
  gradientMagnitude: Float32Array; // Gradient magnitude per pixel (width * height)
  maxGradient: number;
}

/**
 * Convertit un pixel sRGB (0-255) en espace colorimétrique CIELAB.
 */
export function sRgbToLab(r: number, g: number, b: number): LabColor {
  // Normalisation sRGB -> Linear RGB
  let nr = r / 255;
  let ng = g / 255;
  let nb = b / 255;

  nr = nr > 0.04045 ? Math.pow((nr + 0.055) / 1.055, 2.4) : nr / 12.92;
  ng = ng > 0.04045 ? Math.pow((ng + 0.055) / 1.055, 2.4) : ng / 12.92;
  nb = nb > 0.04045 ? Math.pow((nb + 0.055) / 1.055, 2.4) : nb / 12.92;

  // Linear RGB -> CIE XYZ (D65 Illuminant)
  const x = (nr * 0.4124 + ng * 0.3576 + nb * 0.1805) * 100 / 95.047;
  const y = (nr * 0.2126 + ng * 0.7152 + nb * 0.0722) * 100 / 100.000;
  const z = (nr * 0.0193 + ng * 0.1192 + nb * 0.9505) * 100 / 108.883;

  // XYZ -> CIELAB
  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

/**
 * Calcule la distance perceptuelle ΔE (CIE76/Euclidienne dans l'espace Lab).
 */
export function deltaELab(lab1: LabColor, lab2: LabColor): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Génère la carte de gradient CIELAB à partir de données d'image RGBA.
 */
export function computeCielabGradientMap(
  rgbaData: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): GradientMapData {
  const totalPixels = width * height;
  const labPixels = new Float32Array(totalPixels * 3);
  const gradientMagnitude = new Float32Array(totalPixels);

  // 1. Convertir tous les pixels en CIELAB
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = rgbaData[idx];
    const g = rgbaData[idx + 1];
    const b = rgbaData[idx + 2];
    const lab = sRgbToLab(r, g, b);

    labPixels[i * 3] = lab.l;
    labPixels[i * 3 + 1] = lab.a;
    labPixels[i * 3 + 2] = lab.b;
  }

  let maxGrad = 0;

  // 2. Calculer le gradient spatial (Sobel / Différences finies 3x3)
  const rawGrad = new Float32Array(totalPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const currIdx = y * width + x;

      const leftIdx = currIdx - 1;
      const rightIdx = currIdx + 1;
      const topIdx = currIdx - width;
      const bottomIdx = currIdx + width;

      const labLeft: LabColor = { l: labPixels[leftIdx * 3], a: labPixels[leftIdx * 3 + 1], b: labPixels[leftIdx * 3 + 2] };
      const labRight: LabColor = { l: labPixels[rightIdx * 3], a: labPixels[rightIdx * 3 + 1], b: labPixels[rightIdx * 3 + 2] };
      const labTop: LabColor = { l: labPixels[topIdx * 3], a: labPixels[topIdx * 3 + 1], b: labPixels[topIdx * 3 + 2] };
      const labBottom: LabColor = { l: labPixels[bottomIdx * 3], a: labPixels[bottomIdx * 3 + 1], b: labPixels[bottomIdx * 3 + 2] };

      const dx = deltaELab(labLeft, labRight);
      const dy = deltaELab(labTop, labBottom);

      rawGrad[currIdx] = Math.sqrt(dx * dx + dy * dy);
    }
  }

  // 3. Appliquer un lissage 3x3 sur la carte de gradient pour éliminer le bruit de granularité
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const currIdx = y * width + x;
      let sum = 0;
      let count = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = (y + dy) * width + (x + dx);
          sum += rawGrad[nIdx];
          count++;
        }
      }

      const smoothed = sum / count;
      gradientMagnitude[currIdx] = smoothed;

      if (smoothed > maxGrad) {
        maxGrad = smoothed;
      }
    }
  }

  return {
    width,
    height,
    labPixels,
    gradientMagnitude,
    maxGradient: maxGrad
  };
}
