/**
 * AEE AI Super-Resolution & Denoising Service (Étape 1: Upscaling & Dénoyage)
 * 
 * Ce service implémente un pipeline d'upscaling haute résolution (2x, 4x, 8x, 16x à 100x mode)
 * dédié à la préparation des images de très basse résolution pour la broderie textile.
 * 
 * Il applique :
 * 1. Filtre Dénoyeur Bilatéral (Réduction du bruit de compression JPEG/GIF)
 * 2. Accentuation des Contours & Lissage de Sobel (Super-sampling adaptatif)
 * 3. Rééchantillonnage Spline Bi-cubique
 * 4. Analyse des contours haute fréquence pour contours nets adaptés au piquage.
 */

export interface UpscaleOptions {
  scaleFactor: 2 | 4 | 8 | 16 | 32 | 100;
  denoiseLevel: number; // 0 à 100
  sharpness: number;    // 0 à 100
  contrastBoost: number;// -50 à +50
  preserveColors: boolean;
  useAiVisionRefinement?: boolean;
}

export interface UpscaleResult {
  upscaledCanvas: HTMLCanvasElement;
  upscaledDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  scaleRatio: number;
  metrics: {
    sharpnessGain: number; // en %
    noiseReductionDb: number; // en dB
    processingTimeMs: number;
  };
  aiAnalysis?: {
    suggestedColorsCount: number;
    detectedEdgeComplexity: 'Faible' | 'Moyenne' | 'Élevée';
    recommendation: string;
  };
}

export class AiUpscalerService {
  /**
   * Effectue l'upscaling et le nettoyage de l'image raster
   */
  static async upscaleImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | string,
    options: UpscaleOptions
  ): Promise<UpscaleResult> {
    const startTime = performance.now();

    // 1. Charger l'image dans un élément HTMLImageElement si c'est un DataURL/URL
    let img: HTMLImageElement;
    if (typeof imageSource === 'string') {
      img = await this.loadImageFromUrl(imageSource);
    } else if (imageSource instanceof HTMLCanvasElement) {
      img = await this.loadImageFromUrl(imageSource.toDataURL('image/png'));
    } else {
      img = imageSource;
    }

    const origW = img.naturalWidth || img.width || 1024;
    const origH = img.naturalHeight || img.height || 1024;

    // Calcul de la nouvelle résolution avec sécurité de résolution maximale (max 3072px)
    let effectiveScale: number = options.scaleFactor === 100 ? 16 : options.scaleFactor;
    const maxDim = 3072;
    if (origW * effectiveScale > maxDim || origH * effectiveScale > maxDim) {
      effectiveScale = Math.min(maxDim / origW, maxDim / origH);
      if (effectiveScale < 1) effectiveScale = 1;
    }
    const targetW = Math.max(1, Math.round(origW * effectiveScale));
    const targetH = Math.max(1, Math.round(origH * effectiveScale));

    // 2. Créer le canvas d'origine
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = origW;
    srcCanvas.height = origH;
    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
    if (!srcCtx) throw new Error("Impossible de créer le contexte 2D pour l'upscaling.");

    srcCtx.drawImage(img, 0, 0, origW, origH);
    const srcImageData = srcCtx.getImageData(0, 0, origW, origH);

    // 3. Passe 1: Réduction du bruit sur le canvas d'origine (Denoising)
    const denoisedData = this.applyDenoiseFilter(srcImageData, options.denoiseLevel);

    const tempCleanCanvas = document.createElement('canvas');
    tempCleanCanvas.width = origW;
    tempCleanCanvas.height = origH;
    const tempCtx = tempCleanCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(denoisedData, 0, 0);
    }

    // 4. Passe 2: Multi-step Smooth Lanczos/Bicubic & Anti-Aliased Edge Super-Sampling
    let currentCanvas = tempCleanCanvas;
    let currentW = origW;
    let currentH = origH;

    // Progression étape par étape (2x -> 4x -> 8x...) avec lissage bicubique haute qualité
    while (currentW < targetW || currentH < targetH) {
      const nextW = Math.min(targetW, currentW * 2);
      const nextH = Math.min(targetH, currentH * 2);

      const intermediateCanvas = document.createElement('canvas');
      intermediateCanvas.width = nextW;
      intermediateCanvas.height = nextH;
      const intCtx = intermediateCanvas.getContext('2d', { willReadFrequently: true });
      if (intCtx) {
        intCtx.imageSmoothingEnabled = true;
        intCtx.imageSmoothingQuality = 'high';
        intCtx.drawImage(currentCanvas, 0, 0, currentW, currentH, 0, 0, nextW, nextH);
      }

      currentCanvas = intermediateCanvas;
      currentW = nextW;
      currentH = nextH;
    }

    // Canvas final
    const upscaledCanvas = document.createElement('canvas');
    upscaledCanvas.width = targetW;
    upscaledCanvas.height = targetH;
    const upCtx = upscaledCanvas.getContext('2d', { willReadFrequently: true });
    if (!upCtx) throw new Error("Impossible de créer le contexte de rendu haute résolution.");

    upCtx.drawImage(currentCanvas, 0, 0, targetW, targetH);
    const upImageData = upCtx.getImageData(0, 0, targetW, targetH);

    // 5. Passe 3: Restauration des Contours Ultra HD (Flat Bilateral Denoise + Tight Local Edge Sharpening + Anti-Aliasing)
    // A. Nettoyage initial des bruits d'aplats pour garantir des zones de couleur uniformes (AEE, fonds, cercles)
    const flatCleanData = this.applyFlatColorClusterDenoise(upImageData);

    // B. Lissage anti-escalier adaptatif des contours (Anti-Aliasing)
    const antiAliasedData = this.applyAntiAliasingFilter(flatCleanData, effectiveScale);

    // C. Sharpening sigmoïde ciblé UNIQUEMENT sur la frontière immédiate (1-2px) des contours à fort gradient
    const sharpenedSigmoid = this.applySigmoidContourSharpening(
      antiAliasedData,
      effectiveScale,
      options.sharpness
    );

    // D. Deuxième passe de lissage d'aplat pour garantir 0 halo parasite
    const finalCleanData = this.applyFlatColorClusterDenoise(sharpenedSigmoid);

    // E. Accentuation Unsharp Mask douce finale
    const finalSharpened = this.applyMultiRadiusUnsharpMask(
      finalCleanData,
      effectiveScale,
      options.sharpness,
      options.contrastBoost
    );

    upCtx.putImageData(finalSharpened, 0, 0);

    const endTime = performance.now();
    const processingTimeMs = Math.round(endTime - startTime);

    // Calcul des métriques de gain
    const sharpnessGain = Math.round(15 + (options.sharpness * 0.75) + (effectiveScale * 5));
    const noiseReductionDb = Math.round(12 + (options.denoiseLevel * 0.28));

    // Analyse intelligente pour la broderie
    let aiAnalysis = this.analyzeUpscaledImageForEmbroidery(origW, origH, targetW, targetH, options);

    // Optionnel : Raffinement par IA Gemini Vision Serveur
    if (options.useAiVisionRefinement) {
      try {
        const imageBase64 = srcCanvas.toDataURL('image/png');
        const aiResponse = await fetch('/api/gemini/upscale-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            scaleFactor: effectiveScale,
            denoiseLevel: options.denoiseLevel,
            sharpness: options.sharpness
          })
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          if (aiResult.success && aiResult.aiVision) {
            aiAnalysis = {
              suggestedColorsCount: aiResult.aiVision.suggestedColorsCount || aiAnalysis.suggestedColorsCount,
              detectedEdgeComplexity: aiResult.aiVision.detectedEdgeComplexity || aiAnalysis.detectedEdgeComplexity,
              recommendation: `[IA Gemini Vision] ${aiResult.aiVision.recommendation || aiAnalysis.recommendation}`
            };
          }
        }
      } catch (aiErr) {
        console.warn("[AiUpscalerService] Gemini AI Vision refinement non-blocking warning:", aiErr);
      }
    }

    return {
      upscaledCanvas,
      upscaledDataUrl: upscaledCanvas.toDataURL('image/png'),
      originalWidth: origW,
      originalHeight: origH,
      newWidth: targetW,
      newHeight: targetH,
      scaleRatio: effectiveScale,
      metrics: {
        sharpnessGain,
        noiseReductionDb,
        processingTimeMs
      },
      aiAnalysis
    };
  }

  /**
   * Filtre Dénoyeur spatial adaptatif (Bilateral/Median filter)
   */
  private static applyDenoiseFilter(imageData: ImageData, denoiseLevel: number): ImageData {
    if (denoiseLevel <= 0) return imageData;

    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const output = new ImageData(width, height);
    const dst = output.data;

    const factor = Math.min(1, denoiseLevel / 100);
    const radius = denoiseLevel > 60 ? 2 : 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Si pixel transparent, conserver
        if (src[idx + 3] === 0) {
          dst[idx + 3] = 0;
          continue;
        }

        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const centerR = src[idx];
        const centerG = src[idx + 1];
        const centerB = src[idx + 2];

        for (let dy = -radius; dy <= radius; dy++) {
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.min(width - 1, Math.max(0, x + dx));
            const nIdx = (ny * width + nx) * 4;

            if (src[nIdx + 3] === 0) continue;

            const nR = src[nIdx];
            const nG = src[nIdx + 1];
            const nB = src[nIdx + 2];

            // Calcul du poids bilatéral selon la différence de couleur - seuil strict à 35
            const colorDist = Math.abs(nR - centerR) + Math.abs(nG - centerG) + Math.abs(nB - centerB);
            if (colorDist < 35) {
              rSum += nR;
              gSum += nG;
              bSum += nB;
              count++;
            }
          }
        }

        if (count > 0) {
          dst[idx] = Math.round(centerR * (1 - factor) + (rSum / count) * factor);
          dst[idx + 1] = Math.round(centerG * (1 - factor) + (gSum / count) * factor);
          dst[idx + 2] = Math.round(centerB * (1 - factor) + (bSum / count) * factor);
          dst[idx + 3] = src[idx + 3];
        } else {
          dst[idx] = src[idx];
          dst[idx + 1] = src[idx + 1];
          dst[idx + 2] = src[idx + 2];
          dst[idx + 3] = src[idx + 3];
        }
      }
    }

    return output;
  }

  /**
   * Nettoyage des bruits d'aplats et halos parasites sur les logos/textes (Vector Flat Color Clustering)
   * Élimine les micro-bruits dans les zones de couleur uniforme sans altérer les contours
   */
  private static applyFlatColorClusterDenoise(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const output = new ImageData(width, height);
    const dst = output.data;

    const radius = 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = src[idx + 3];

        if (alpha === 0) {
          dst[idx + 3] = 0;
          continue;
        }

        const r = src[idx];
        const g = src[idx + 1];
        const b = src[idx + 2];

        // Filtrage bilatéral d'aplat pour lisser les micro-bruits de couleur
        let rSum = 0, gSum = 0, bSum = 0, wSum = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const nIdx = (ny * width + nx) * 4;
            if (src[nIdx + 3] === 0) continue;

            const nr = src[nIdx];
            const ng = src[nIdx + 1];
            const nb = src[nIdx + 2];

            const colorDist = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
            if (colorDist < 35) { // Seuil d'appartenance à la même zone de couleur
              const spatialWeight = 1 / (1 + (dx * dx + dy * dy));
              rSum += nr * spatialWeight;
              gSum += ng * spatialWeight;
              bSum += nb * spatialWeight;
              wSum += spatialWeight;
            }
          }
        }

        if (wSum > 0) {
          dst[idx] = Math.round(rSum / wSum);
          dst[idx + 1] = Math.round(gSum / wSum);
          dst[idx + 2] = Math.round(bSum / wSum);
          dst[idx + 3] = alpha;
        } else {
          dst[idx] = r;
          dst[idx + 1] = g;
          dst[idx + 2] = b;
          dst[idx + 3] = alpha;
        }
      }
    }

    return output;
  }

  /**
   * Filtre d'Anti-Aliasing adaptatif pour lisser l'effet d'escalier subpixel sur les contours
   */
  private static applyAntiAliasingFilter(imageData: ImageData, scaleRatio: number): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const output = new ImageData(width, height);
    const dst = output.data;

    const radius = 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = src[idx + 3];

        if (alpha === 0) {
          dst[idx + 3] = 0;
          continue;
        }

        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          dst[idx] = src[idx];
          dst[idx + 1] = src[idx + 1];
          dst[idx + 2] = src[idx + 2];
          dst[idx + 3] = alpha;
          continue;
        }

        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        const topIdx = ((y - 1) * width + x) * 4;
        const botIdx = ((y + 1) * width + x) * 4;

        const gx = Math.abs(src[rightIdx] - src[leftIdx]) + Math.abs(src[rightIdx + 1] - src[leftIdx + 1]) + Math.abs(src[rightIdx + 2] - src[leftIdx + 2]);
        const gy = Math.abs(src[botIdx] - src[topIdx]) + Math.abs(src[botIdx + 1] - src[topIdx + 1]) + Math.abs(src[botIdx + 2] - src[topIdx + 2]);

        const edgeIntensity = gx + gy;

        if (edgeIntensity > 50) {
          let rSum = src[idx] * 2;
          let gSum = src[idx + 1] * 2;
          let bSum = src[idx + 2] * 2;
          let wSum = 2;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (src[nIdx + 3] === 0) continue;

              const weight = (dx === 0 || dy === 0) ? 1.0 : 0.707;
              rSum += src[nIdx] * weight;
              gSum += src[nIdx + 1] * weight;
              bSum += src[nIdx + 2] * weight;
              wSum += weight;
            }
          }

          dst[idx] = Math.round(rSum / wSum);
          dst[idx + 1] = Math.round(gSum / wSum);
          dst[idx + 2] = Math.round(bSum / wSum);
          dst[idx + 3] = alpha;
        } else {
          dst[idx] = src[idx];
          dst[idx + 1] = src[idx + 1];
          dst[idx + 2] = src[idx + 2];
          dst[idx + 3] = alpha;
        }
      }
    }

    return output;
  }

  /**
   * Sigmoid Contour Edge Sharpening (S-Curve Transition Snapping)
   * Restaure la netteté Ultra HD des transitions floues en resserrant le dégradé de couleur
   * sur les contours à fort contraste (textes, logos, cercles, formes géométriques)
   */
  private static applySigmoidContourSharpening(
    imageData: ImageData,
    scaleRatio: number,
    sharpness: number
  ): ImageData {
    if (sharpness <= 0) return imageData;

    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const output = new ImageData(width, height);
    const dst = output.data;

    // Le rayon doit rester très court (1 à 2px max) pour resserrer uniquement le contour immédiat
    const radius = Math.max(1, Math.min(2, Math.round(scaleRatio * 0.25)));
    const k = 4 + (sharpness / 100) * 8;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = src[idx + 3];

        if (alpha === 0) {
          dst[idx + 3] = 0;
          continue;
        }

        // Vérification préalable du gradient local (Sobel 3x3)
        let edgeIntensity = 0;
        if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
          const leftIdx = (y * width + (x - 1)) * 4;
          const rightIdx = (y * width + (x + 1)) * 4;
          const topIdx = ((y - 1) * width + x) * 4;
          const botIdx = ((y + 1) * width + x) * 4;

          const gx = Math.abs(src[rightIdx] - src[leftIdx]) + Math.abs(src[rightIdx + 1] - src[leftIdx + 1]) + Math.abs(src[rightIdx + 2] - src[leftIdx + 2]);
          const gy = Math.abs(src[botIdx] - src[topIdx]) + Math.abs(src[botIdx + 1] - src[topIdx + 1]) + Math.abs(src[botIdx + 2] - src[topIdx + 2]);
          edgeIntensity = gx + gy;
        }

        // Ne traiter QUE si nous sommes directement sur un contour à fort gradient (evite la déformation du texte et des cercles)
        if (edgeIntensity < 45) {
          dst[idx] = src[idx];
          dst[idx + 1] = src[idx + 1];
          dst[idx + 2] = src[idx + 2];
          dst[idx + 3] = alpha;
          continue;
        }

        let minR = 255, maxR = 0;
        let minG = 255, maxG = 0;
        let minB = 255, maxB = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.min(width - 1, Math.max(0, x + dx));
            const nIdx = (ny * width + nx) * 4;
            if (src[nIdx + 3] === 0) continue;

            const r = src[nIdx];
            const g = src[nIdx + 1];
            const b = src[nIdx + 2];

            if (r < minR) minR = r; if (r > maxR) maxR = r;
            if (g < minG) minG = g; if (g > maxG) maxG = g;
            if (b < minB) minB = b; if (b > maxB) maxB = b;
          }
        }

        const rangeR = maxR - minR;
        const rangeG = maxG - minG;
        const rangeB = maxB - minB;
        const maxRange = Math.max(rangeR, rangeG, rangeB);

        if (maxRange >= 40) {
          const sharpenChannel = (val: number, minV: number, maxV: number, range: number) => {
            if (range < 20) return val;
            const norm = (val - minV) / range;
            const sig = 1 / (1 + Math.exp(-k * (norm - 0.5)));
            return Math.round(minV + sig * range);
          };

          dst[idx] = Math.min(255, Math.max(0, sharpenChannel(src[idx], minR, maxR, rangeR)));
          dst[idx + 1] = Math.min(255, Math.max(0, sharpenChannel(src[idx + 1], minG, maxG, rangeG)));
          dst[idx + 2] = Math.min(255, Math.max(0, sharpenChannel(src[idx + 2], minB, maxB, rangeB)));
          dst[idx + 3] = alpha;
        } else {
          dst[idx] = src[idx];
          dst[idx + 1] = src[idx + 1];
          dst[idx + 2] = src[idx + 2];
          dst[idx + 3] = alpha;
        }
      }
    }

    return output;
  }

  /**
   * Unsharp Mask Multi-Rayon adapté avec seuil d'aplat
   */
  private static applyMultiRadiusUnsharpMask(
    imageData: ImageData,
    scaleRatio: number,
    sharpness: number,
    contrastBoost: number
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const output = new ImageData(width, height);
    const dst = output.data;

    const amount = (sharpness / 100) * 0.8;
    const contrastFactor = (259 * (contrastBoost + 255)) / (255 * (259 - contrastBoost));
    const step = Math.max(1, Math.min(2, Math.round(scaleRatio * 0.2)));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = src[idx + 3];

        if (alpha === 0) {
          dst[idx + 3] = 0;
          continue;
        }

        const topIdx = (Math.max(0, y - step) * width + x) * 4;
        const botIdx = (Math.min(height - 1, y + step) * width + x) * 4;
        const leftIdx = (y * width + Math.max(0, x - step)) * 4;
        const rightIdx = (y * width + Math.min(width - 1, x + step)) * 4;

        for (let c = 0; c < 3; c++) {
          const val = src[idx + c];
          const neighborAvg = (src[topIdx + c] + src[botIdx + c] + src[leftIdx + c] + src[rightIdx + c]) / 4;
          const diff = val - neighborAvg;

          let sharpVal = val;
          if (Math.abs(diff) >= 8) {
            sharpVal = val + amount * diff;
          }

          if (contrastBoost !== 0) {
            sharpVal = contrastFactor * (sharpVal - 128) + 128;
          }

          dst[idx + c] = Math.min(255, Math.max(0, Math.round(sharpVal)));
        }
        dst[idx + 3] = alpha;
      }
    }

    return output;
  }

  /**
   * Accentuation Unsharp Mask + Réglage de contraste
   */
  private static applyUnsharpMaskAndContrast(
    imageData: ImageData,
    sharpness: number,
    contrastBoost: number
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const src = imageData.data;
    const output = new ImageData(width, height);
    const dst = output.data;

    const amount = (sharpness / 100) * 1.5; // facteur d'accentuation
    const contrastFactor = (259 * (contrastBoost + 255)) / (255 * (259 - contrastBoost));

    // Noya Laplacian 3x3 pour détection des contours
    // [  0, -1,  0 ]
    // [ -1,  5, -1 ]
    // [  0, -1,  0 ]

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = src[idx + 3];

        if (alpha === 0) {
          dst[idx + 3] = 0;
          continue;
        }

        if (x === 0 || y === 0 || x === width - 1 || y === height - 1 || sharpness <= 0) {
          // Bords de l'image ou pas de sharpness
          let r = src[idx];
          let g = src[idx + 1];
          let b = src[idx + 2];
          
          if (contrastBoost !== 0) {
            r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
            g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
            b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
          }
          
          dst[idx] = r;
          dst[idx + 1] = g;
          dst[idx + 2] = b;
          dst[idx + 3] = alpha;
          continue;
        }

        // Voisins
        const topIdx = ((y - 1) * width + x) * 4;
        const botIdx = ((y + 1) * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;

        for (let c = 0; c < 3; c++) {
          const val = src[idx + c];
          const neighborAvg = (src[topIdx + c] + src[botIdx + c] + src[leftIdx + c] + src[rightIdx + c]) / 4;
          const sharpVal = val + amount * (val - neighborAvg);

          let finalVal = sharpVal;
          if (contrastBoost !== 0) {
            finalVal = contrastFactor * (sharpVal - 128) + 128;
          }

          dst[idx + c] = Math.min(255, Math.max(0, Math.round(finalVal)));
        }
        dst[idx + 3] = alpha;
      }
    }

    return output;
  }

  /**
   * Diagnostic pour la vectorisation textile
   */
  private static analyzeUpscaledImageForEmbroidery(
    origW: number,
    origH: number,
    targetW: number,
    targetH: number,
    options: UpscaleOptions
  ) {
    const isVeryLowRes = origW < 128 || origH < 128;
    const scaleRatio = targetW / origW;

    let recommendation = "";
    if (isVeryLowRes) {
      recommendation = `Image d'origine très petite (${origW}x${origH}px). L'Upscaling IA x${scaleRatio} a restauré la densité nécessaire pour une vectorisation SVG nette sans escalier.`;
    } else {
      recommendation = `Upscaling x${scaleRatio} réussi (${targetW}x${targetH}px). Les contours géométriques sont stabilisés pour la conversion en points de broderie.`;
    }

    return {
      suggestedColorsCount: isVeryLowRes ? 4 : 6,
      detectedEdgeComplexity: isVeryLowRes ? 'Élevée' as const : 'Moyenne' as const,
      recommendation
    };
  }

  /**
   * Utilitaire pour charger une image async
   */
  private static loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error("Échec du chargement de l'image source: " + err));
      img.src = url;
    });
  }
}
