/**
 * Phase 2.1B - Transparency Normalizer & Background Semantic Analyzer (AEE CAD/CAM Platform)
 * 
 * Provides alpha channel detection, background normalization, and semantic classification
 * between true canvas background versus white/light foreground objects (e.g., book, laurels,
 * text, stars, inner shield details).
 * 
 * Strict compliance with Rule 40 (Autonomous Engine) & Rule 50 (Platform Kernel).
 */

export interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type BackgroundType = 
  | 'TRANSPARENT_ALPHA'
  | 'OPAQUE_WHITE'
  | 'OPAQUE_DARK'
  | 'OPAQUE_COLORED';

export type VectorLayerSemanticRole =
  | 'CANVAS_BACKGROUND'
  | 'SEMANTIC_FOREGROUND_WHITE_OBJECT'
  | 'SEMANTIC_FOREGROUND_DARK_OBJECT'
  | 'DECORATIVE_BORDER'
  | 'SEMANTIC_SHADOW_RESIDUE';

export interface ImageBackgroundAnalysis {
  hasAlpha: boolean;
  alphaRatio: number;
  bgType: BackgroundType;
  dominantBgColor: PixelColor;
  suggestedCanvasBg: string;
  hasWhiteForegroundCandidates: boolean;
  averageBrightness: number;
  dimensions: { width: number; height: number };
}

export class TransparencyNormalizer {

  /**
   * Evaluates color brightness (0-255)
   */
  public static calculateBrightness(c: PixelColor): number {
    return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  }

  /**
   * Determines if a color string or RGB is near white
   */
  public static isNearWhiteColor(colorStr: string): boolean {
    if (!colorStr) return false;
    const s = colorStr.trim().toLowerCase().replace(/\s+/g, '');
    if (s === 'white' || s === '#fff' || s === '#ffffff' || s === 'rgb(255,255,255)' || s === 'rgba(255,255,255,1)') return true;
    
    if (s.startsWith('rgb')) {
      const m = s.match(/\d+/g);
      if (m && m.length >= 3) {
        const r = parseInt(m[0], 10), g = parseInt(m[1], 10), b = parseInt(m[2], 10);
        if (r > 215 && g > 215 && b > 215) return true;
      }
    }
    if (s.startsWith('#')) {
      const h = s.substring(1);
      if (h.length === 3) {
        const r = parseInt(h[0], 16) * 17, g = parseInt(h[1], 16) * 17, b = parseInt(h[2], 16) * 17;
        if (r > 215 && g > 215 && b > 215) return true;
      } else if (h.length === 6) {
        const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
        if (r > 215 && g > 215 && b > 215) return true;
      }
    }
    return false;
  }

  /**
   * Analyzes an image source (data URL, image URL, or blob) for transparency and background features
   */
  public static async analyzeImageSource(imageInput: string): Promise<ImageBackgroundAnalysis> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const width = img.width || 400;
        const height = img.height || 400;
        const canvas = document.createElement('canvas');
        const sampleW = Math.min(200, width);
        const sampleH = Math.min(200, height);
        canvas.width = sampleW;
        canvas.height = sampleH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(TransparencyNormalizer.fallbackAnalysis(width, height));
          return;
        }

        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
        const data = imgData.data;
        const totalPixels = sampleW * sampleH;

        let transparentCount = 0;
        let whitePixelCount = 0;
        let darkPixelCount = 0;
        let totalBrightness = 0;

        // Sample corner and edge pixels to determine primary canvas background
        const cornerIndices = [
          0,
          (sampleW - 1) * 4,
          (sampleH - 1) * sampleW * 4,
          ((sampleH - 1) * sampleW + sampleW - 1) * 4
        ];

        let cornerAlphaSum = 0;
        let cornerRSum = 0, cornerGSum = 0, cornerBSum = 0;

        cornerIndices.forEach(idx => {
          cornerRSum += data[idx];
          cornerGSum += data[idx + 1];
          cornerBSum += data[idx + 2];
          cornerAlphaSum += data[idx + 3];
        });

        const cornerAvgAlpha = cornerAlphaSum / 4;
        const cornerAvgColor: PixelColor = {
          r: Math.round(cornerRSum / 4),
          g: Math.round(cornerGSum / 4),
          b: Math.round(cornerBSum / 4),
          a: Math.round(cornerAvgAlpha)
        };

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 200) {
            transparentCount++;
          } else {
            const br = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += br;
            if (r > 215 && g > 215 && b > 215) {
              whitePixelCount++;
            } else if (br < 80) {
              darkPixelCount++;
            }
          }
        }

        const alphaRatio = transparentCount / totalPixels;
        const hasAlpha = alphaRatio > 0.03 || cornerAvgAlpha < 200;
        const avgBr = totalPixels > transparentCount ? totalBrightness / (totalPixels - transparentCount) : 128;

        let bgType: BackgroundType = 'OPAQUE_COLORED';
        if (hasAlpha) {
          bgType = 'TRANSPARENT_ALPHA';
        } else if (cornerAvgColor.r > 210 && cornerAvgColor.g > 210 && cornerAvgColor.b > 210) {
          bgType = 'OPAQUE_WHITE';
        } else if (cornerAvgColor.r < 70 && cornerAvgColor.g < 70 && cornerAvgColor.b < 70) {
          bgType = 'OPAQUE_DARK';
        }

        // White foreground candidates exist if there are bright pixels inside non-white background
        const whiteRatio = whitePixelCount / totalPixels;
        const hasWhiteForegroundCandidates = whiteRatio > 0.01 && (bgType === 'TRANSPARENT_ALPHA' || bgType === 'OPAQUE_DARK' || (bgType === 'OPAQUE_WHITE' && whiteRatio < 0.85));

        // Suggested canvas background to optimize ImageTracer contrast
        let suggestedCanvasBg = '#08080a'; // Default deep dark contrast canvas
        if (bgType === 'OPAQUE_DARK') {
          suggestedCanvasBg = '#ffffff'; // White canvas if image is dark background
        } else if (bgType === 'TRANSPARENT_ALPHA') {
          suggestedCanvasBg = '#0a0a0e'; // High-contrast dark background for transparent PNG
        }

        resolve({
          hasAlpha,
          alphaRatio,
          bgType,
          dominantBgColor: cornerAvgColor,
          suggestedCanvasBg,
          hasWhiteForegroundCandidates,
          averageBrightness: avgBr,
          dimensions: { width, height }
        });
      };

      img.onerror = () => {
        resolve(TransparencyNormalizer.fallbackAnalysis(400, 400));
      };

      img.src = imageInput;
    });
  }

  /**
   * Fallback analysis if canvas rendering fails
   */
  private static fallbackAnalysis(width: number, height: number): ImageBackgroundAnalysis {
    return {
      hasAlpha: false,
      alphaRatio: 0,
      bgType: 'OPAQUE_WHITE',
      dominantBgColor: { r: 255, g: 255, b: 255, a: 255 },
      suggestedCanvasBg: '#08080a',
      hasWhiteForegroundCandidates: true,
      averageBrightness: 240,
      dimensions: { width, height }
    };
  }

  /**
   * Prepares and normalizes an image for ImageTracer vectorization.
   * If transparent PNG, renders on a dark neutral canvas so white foreground objects get vectorized.
   */
  public static async normalizeImageForTracing(
    imageInput: string,
    targetDimension: number = 400
  ): Promise<{ normalizedDataUrl: string; analysis: ImageBackgroundAnalysis }> {
    const analysis = await TransparencyNormalizer.analyzeImageSource(imageInput);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const origW = img.width || 400;
        const origH = img.height || 400;
        let w = origW;
        let h = origH;

        if (w > targetDimension || h > targetDimension) {
          if (w > h) {
            h = Math.round((h * targetDimension) / w);
            w = targetDimension;
          } else {
            w = Math.round((w * targetDimension) / h);
            h = targetDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ normalizedDataUrl: imageInput, analysis });
          return;
        }

        // Fill background based on transparency analysis
        if (analysis.hasAlpha || analysis.bgType === 'TRANSPARENT_ALPHA') {
          ctx.fillStyle = analysis.suggestedCanvasBg;
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);
        const normalizedDataUrl = canvas.toDataURL('image/png');
        resolve({ normalizedDataUrl, analysis });
      };

      img.onerror = () => {
        resolve({ normalizedDataUrl: imageInput, analysis });
      };

      img.src = imageInput;
    });
  }

  public static isDarkCanvasBackground(color: string): boolean {
    if (!color) return false;
    const c = color.toLowerCase().trim();
    if (c === '#0a0a0e' || c === '#000000' || c === '#050508' || c === '#0a0a0a' || c === '#000' || c === '#111111' || c === '#0d0d12') return true;
    const match = c.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      if (r <= 30 && g <= 30 && b <= 30) return true;
    }
    return false;
  }

  /**
   * Helper to parse CSS color strings (rgb, rgba, hex) to RGB values
   */
  public static parseToRgb(colorStr: string): { r: number; g: number; b: number } | null {
    if (!colorStr) return null;
    const s = colorStr.trim().toLowerCase().replace(/\s+/g, '');
    if (s.startsWith('rgb')) {
      const m = s.match(/\d+/g);
      if (m && m.length >= 3) {
        return { r: parseInt(m[0], 10), g: parseInt(m[1], 10), b: parseInt(m[2], 10) };
      }
    }
    if (s.startsWith('#')) {
      const h = s.substring(1);
      if (h.length === 3) {
        return {
          r: parseInt(h[0], 16) * 17,
          g: parseInt(h[1], 16) * 17,
          b: parseInt(h[2], 16) * 17
        };
      } else if (h.length === 6) {
        return {
          r: parseInt(h.substring(0, 2), 16),
          g: parseInt(h.substring(2, 4), 16),
          b: parseInt(h.substring(4, 6), 16)
        };
      }
    }
    return null;
  }

  /**
   * Identifies dark brown, bronze, dark gold, dark red/maroon or low-brightness residue/shadow colors
   * that shouldn't be stitched on top of the main vibrant designs.
   */
  public static isDarkBrownOrResidueColor(colorStr: string): boolean {
    const rgb = TransparencyNormalizer.parseToRgb(colorStr);
    if (!rgb) return false;
    const { r, g, b } = rgb;
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Do NOT flag dark green (#0F5933), dark blue (#0A2540), or vibrant dark logo colors as residue.
    // Only flag true near-black/grey noise with low saturation difference
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const saturationDiff = maxVal - minVal;
    
    return brightness < 20 && saturationDiff < 12;
  }

  /**
   * Harmonizes vector layer colors ("Soin de Couleur")
   * Preserves exact SVG imported colors unless missing.
   */
  public static harmonizeColor(colorStr: string, dominantColor: string = '#0F5933'): string {
    if (!colorStr || colorStr === 'none' || colorStr === 'transparent') return dominantColor;
    return colorStr;
  }

  /**
   * Multi-criteria Semantic Classifier for SVG Vector Layers
   * Distinguishes Canvas Background vs White Foreground Objects
   */
  public static classifyVectorLayer(
    layer: { points: { x: number; y: number }[]; color: string },
    totalBounds: { minX: number; minY: number; maxX: number; maxY: number }
  ): VectorLayerSemanticRole {
    if (!layer.points || layer.points.length === 0) {
      return 'CANVAS_BACKGROUND';
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    layer.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const lWidth = maxX - minX;
    const lHeight = maxY - minY;
    const totalW = totalBounds.maxX - totalBounds.minX;
    const totalH = totalBounds.maxY - totalBounds.minY;

    if (totalW <= 0 || totalH <= 0) {
      return 'SEMANTIC_FOREGROUND_DARK_OBJECT';
    }

    const wRatio = lWidth / totalW;
    const hRatio = lHeight / totalH;
    const areaRatio = (lWidth * lHeight) / (totalW * totalH);

    const isNearWhite = TransparencyNormalizer.isNearWhiteColor(layer.color);
    const isDarkBg = TransparencyNormalizer.isDarkCanvasBackground(layer.color);

    // Edge touch count (does it touch canvas outer edges)
    const marginX = totalW * 0.04;
    const marginY = totalH * 0.04;
    let edgeTouchCount = 0;
    if (minX <= totalBounds.minX + marginX) edgeTouchCount++;
    if (maxX >= totalBounds.maxX - marginX) edgeTouchCount++;
    if (minY <= totalBounds.minY + marginY) edgeTouchCount++;
    if (maxY >= totalBounds.maxY - marginY) edgeTouchCount++;

    const spansCanvas = (wRatio > 0.88 && hRatio > 0.88) || areaRatio > 0.80;

    // True Canvas Background Rule:
    // Layers that span the full canvas edge-to-edge (touching 3+ edges) OR match dark/white canvas background
    // are outer canvas backgrounds and should be marked as CANVAS_BACKGROUND for embroidery.
    if (isDarkBg || (isNearWhite && spansCanvas && edgeTouchCount >= 3) || (spansCanvas && edgeTouchCount >= 3)) {
      return 'CANVAS_BACKGROUND';
    }

    // White Foreground Object Rule:
    // If a white shape is NOT a full canvas background, it's a white foreground object (e.g. book, laurels, text, star)!
    if (isNearWhite) {
      return 'SEMANTIC_FOREGROUND_WHITE_OBJECT';
    }

    // Shadow Residue Rule:
    // Detect dark brown/bronze/dark grey textures and classify as residue/shadow
    if (TransparencyNormalizer.isDarkBrownOrResidueColor(layer.color)) {
      return 'SEMANTIC_SHADOW_RESIDUE';
    }

    return 'SEMANTIC_FOREGROUND_DARK_OBJECT';
  }
}
