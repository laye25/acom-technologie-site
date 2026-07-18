import { EmbroideryPoint } from '../../modules/tailleur/services/embroideryServices';
import { GoldenDataset } from '../../modules/tailleur/services/GoldenDataset';
import { GeometryEngine, GeometryValidator } from '../geometry/GeometryEngine';

export class StressLabRunner {
  static runRotationTest(motifIdx: number, customParams: any = {}) {
    const activeMotif = GoldenDataset[motifIdx];
    const flat = activeMotif.contours.flat();
    
    let sumX = 0, sumY = 0;
    flat.forEach(p => { sumX += p.x; sumY += p.y; });
    const cx = sumX / Math.max(1, flat.length);
    const cy = sumY / Math.max(1, flat.length);
    
    const angles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    const results = angles.map(angle => {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      const rotated = flat.map(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return {
          x: cx + (dx * cos - dy * sin),
          y: cy + (dx * sin + dy * cos)
        };
      });
      
      const params = customParams[activeMotif.name] || {
        rdpTolerance: 0.15,
        resamplingMin: 1.2,
        resamplingMax: 4.0,
        cornerMiter: 2.5,
        stitchDensity: 4.25,
        overlapMargin: 0.85
      };
      
      const simplified = GeometryEngine.simplify(rotated, params.rdpTolerance);
      const resampled = GeometryEngine.resampleAdaptive(simplified, params.resamplingMin, params.resamplingMax);
      const noiseRemoved = GeometryEngine.removeNoise(resampled, 0.05);
      const report = GeometryValidator.validate(rotated, noiseRemoved);
      
      return {
        angle,
        gfi: report.gfi,
        hausdorff: report.hausdorff,
        pointCount: noiseRemoved.length
      };
    });
    
    const gfis = results.map(r => r.gfi);
    const avgGfi = gfis.reduce((a, b) => a + b, 0) / gfis.length;
    const variance = gfis.reduce((sum, g) => sum + Math.pow(g - avgGfi, 2), 0) / gfis.length;
    const stdDev = Math.sqrt(variance);
    const stabilityScore = Math.max(50, Math.min(100, 100 - stdDev * 3.5));
    
    return {
      type: 'rotation',
      results,
      stabilityScore,
      avgGfi,
      stdDev
    };
  }

  static runNoiseTest(motifIdx: number, customParams: any = {}) {
    const activeMotif = GoldenDataset[motifIdx];
    const flat = activeMotif.contours.flat();
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    flat.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const width = maxX - minX;
    const height = maxY - minY;
    const maxDim = Math.max(width, height);
    
    const noiseLevels = [1, 2.5, 5, 10, 15, 20];
    const results = noiseLevels.map(lvl => {
      const amplitude = (lvl / 100) * maxDim;
      
      const noisy = flat.map(p => ({
        x: p.x + (Math.random() - 0.5) * amplitude,
        y: p.y + (Math.random() - 0.5) * amplitude
      }));
      
      const params = customParams[activeMotif.name] || {
        rdpTolerance: 0.15,
        resamplingMin: 1.2,
        resamplingMax: 4.0,
        cornerMiter: 2.5,
        stitchDensity: 4.25,
        overlapMargin: 0.85
      };
      
      const simplified = GeometryEngine.simplify(noisy, params.rdpTolerance);
      const resampled = GeometryEngine.resampleAdaptive(simplified, params.resamplingMin, params.resamplingMax);
      const noiseRemoved = GeometryEngine.removeNoise(resampled, 0.05);
      const report = GeometryValidator.validate(noisy, noiseRemoved);
      
      return {
        noiseLevel: lvl,
        gfi: report.gfi,
        hausdorff: report.hausdorff,
        pointCount: noiseRemoved.length
      };
    });
    
    const firstGfi = results[0].gfi;
    const lastGfi = results[results.length - 1].gfi;
    const decay = firstGfi - lastGfi;
    const robustnessScore = Math.max(40, Math.min(100, 100 - decay * 1.5));
    
    return {
      type: 'noise',
      results,
      robustnessScore,
      decay
    };
  }

  static runScaleTest(motifIdx: number, customParams: any = {}) {
    const activeMotif = GoldenDataset[motifIdx];
    const flat = activeMotif.contours.flat();
    
    const scaleFactors = [0.25, 0.5, 1.0, 2.0, 4.0, 8.0];
    const results = scaleFactors.map(scale => {
      const scaled = flat.map(p => ({
        x: p.x * scale,
        y: p.y * scale
      }));
      
      const params = customParams[activeMotif.name] || {
        rdpTolerance: 0.15,
        resamplingMin: 1.2,
        resamplingMax: 4.0,
        cornerMiter: 2.5,
        stitchDensity: 4.25,
        overlapMargin: 0.85
      };
      
      const simplified = GeometryEngine.simplify(scaled, params.rdpTolerance);
      const resampled = GeometryEngine.resampleAdaptive(simplified, params.resamplingMin, params.resamplingMax);
      const noiseRemoved = GeometryEngine.removeNoise(resampled, 0.05);
      const report = GeometryValidator.validate(scaled, noiseRemoved);
      
      const perimeter = scaled.reduce((acc, p, idx) => {
        const next = scaled[(idx + 1) % scaled.length];
        return acc + Math.hypot(next.x - p.x, next.y - p.y);
      }, 0);
      const pointDensity = noiseRemoved.length / Math.max(1, perimeter);
      
      return {
        scale: `${scale}x (${Math.round(128 * scale)}mm)`,
        gfi: report.gfi,
        hausdorff: report.hausdorff,
        pointDensity,
        pointCount: noiseRemoved.length
      };
    });
    
    const scaleGfis = results.map(r => r.gfi);
    const minGfi = Math.min(...scaleGfis);
    const scaleScore = Math.max(60, minGfi);
    
    return {
      type: 'scale',
      results,
      scaleScore
    };
  }
}
