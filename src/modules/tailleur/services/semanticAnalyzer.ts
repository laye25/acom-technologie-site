import { EmbroideryLayer, EmbroideryPoint } from './embroideryServices';
import { GeometricSignatureEngine, GeometricSignature } from './GeometricSignatureEngine';

export type SemanticClass = 'circle' | 'letter' | 'stem' | 'leaf' | 'flower_center' | 'unknown';

export interface SemanticObject {
  id: string;
  className: SemanticClass;
  confidence: number;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  rawPoints: EmbroideryPoint[];
  parameters: any; // Dynamic parameters based on class (e.g. radius for circle)
  hierarchyParentId?: string;
  suggestedStitchType: 'running' | 'satin' | 'tatami';
  suggestedLibraryId?: string;
}

export class SemanticAnalyzer {
  /**
   * Analyzes a set of raw points/contours and attempts to classify them semantically.
   */
  static analyzeRegion(points: EmbroideryPoint[], imageContext?: any, pctBboxContext?: any): SemanticObject {
    const bbox = this.calculateBoundingBox(points);
    const w = bbox.maxX - bbox.minX;
    const h = bbox.maxY - bbox.minY;
    const area = w * h;
    
    if (imageContext && imageContext.semanticObjects && pctBboxContext) {
         let bestMatch: any = null;
         let bestScore = 0;

         for (const obj of imageContext.semanticObjects) {
             if (obj.boundingBox) {
                 const xOverlap = Math.max(0, Math.min(pctBboxContext.maxX, obj.boundingBox.maxX) - Math.max(pctBboxContext.minX, obj.boundingBox.minX));
                 const yOverlap = Math.max(0, Math.min(pctBboxContext.maxY, obj.boundingBox.maxY) - Math.max(pctBboxContext.minY, obj.boundingBox.minY));
                 const overlapArea = xOverlap * yOverlap;
                 
                 const objArea = Math.max(1, (obj.boundingBox.maxX - obj.boundingBox.minX) * (obj.boundingBox.maxY - obj.boundingBox.minY));
                 const regionArea = Math.max(1, (pctBboxContext.maxX - pctBboxContext.minX) * (pctBboxContext.maxY - pctBboxContext.minY));
                 const score = overlapArea / (objArea + regionArea - overlapArea); // IoU

                 if (score > 0.05 && score > bestScore) {
                     bestScore = score;
                     bestMatch = obj;
                 }
             }
         }

         if (bestMatch) {
             return {
                 id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                 className: bestMatch.className as SemanticClass,
                 confidence: bestMatch.confidence || bestScore,
                 boundingBox: bbox,
                 rawPoints: points,
                 parameters: { aiDescription: bestMatch.description, color: bestMatch.color, iouScore: bestScore },
                 hierarchyParentId: bestMatch.hierarchyParentId,
                 suggestedStitchType: bestMatch.suggestedStitchType,
                 suggestedLibraryId: bestMatch.suggestedLibraryId
             };
         }
    }
    
    // Compute oriented bounding box for rotation invariance
    const obb = this.calculateOrientedBoundingBox(points);
    const minDim = obb.minDim;
    const maxDim = obb.maxDim;
    const aspectRatio = maxDim / Math.max(minDim, 0.1);
    const thickness = this.estimateThickness(points, maxDim);

    // Heuristic 1: Is it a circle?
    if (this.isCircular(points, obb)) {
      return {
        id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        className: 'circle',
        confidence: 0.85,
        boundingBox: bbox,
        rawPoints: points,
        parameters: {
          center: { x: bbox.minX + w/2, y: bbox.minY + h/2 },
          radius: Math.max(w, h) / 2,
          thickness
        },
        suggestedStitchType: minDim > 30 ? 'tatami' : 'satin'
      };
    }

    // Physical Embroidery Rules for Satin vs Tatami:
    // Satin is only suitable for narrow columns (width < 3.2mm or 32 units) with high aspect ratio.
    // Wide shapes (min dimension >= 3.2mm) or filled closed regions MUST use Tatami fill to prevent thread loops & fabric puckering.

    // Heuristic 2: Is it a stem (long, thin continuous line/ribbon/branch, can be curved)?
    // A curved stem has a lower bounding box aspect ratio, so we lower the aspect ratio threshold to 1.8, while keeping thickness < 22 and minDim < 50.
    if (aspectRatio >= 1.8 && thickness < 22 && minDim < 50) {
       return {
        id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        className: 'stem',
        confidence: 0.80,
        boundingBox: bbox,
        rawPoints: points,
        parameters: { thickness },
        suggestedStitchType: thickness < 12 ? 'running' : 'satin'
      };
    }

    // Heuristic 3: Narrow Satin column
    if (minDim < 32 && aspectRatio >= 2.5) {
      return {
        id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        className: 'leaf',
        confidence: 0.70,
        boundingBox: bbox,
        rawPoints: points,
        parameters: { thickness },
        suggestedStitchType: 'satin'
      };
    }

    // Fallback: Wide shapes, petals, loops, and complex polygons default to Tatami
    return {
      id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      className: 'unknown',
      confidence: 0.60,
      boundingBox: bbox,
      rawPoints: points,
      parameters: { thickness },
      suggestedStitchType: 'tatami'
    };
  }

  /**
   * Connects to the Vision AI (Gemini) to perform initial semantic recognition
   * of the entire image scene before vectorization.
   */
  static async analyzeSceneWithVision(imageUrl: string, merchantId: string, customPrompt?: string): Promise<any> {
    const prompt = customPrompt || `Tu es le Moteur d'Analyse Sémantique de Broderie (SemanticAnalyzer) de ACOM EMBROIDERY OS.
Ta mission est d'identifier chaque région/objet sémantique dans cette image (ex: 'circle', 'letter', 'stem', 'leaf', 'flower_center', 'flower_petal', 'animal', 'unknown').
Si tu reconnais un objet qui correspond à un composant de notre bibliothèque EKLE (ex: 'rose_001', 'rose_002', 'tulip_001', 'daisy_001', 'flower_001', 'leaf_001', 'star_001', 'heart_001', 'letter_a', 'letter_b'), ajoute l'identifiant exact dans 'suggestedLibraryId'.
Retourne UNIQUEMENT un objet JSON valide avec cette structure stricte :
{
  "semanticObjects": [
    {
      "className": "leaf",
      "description": "Feuille verte en haut à gauche",
      "suggestedStitchType": "tatami",
      "hierarchyParentId": "rose_1",
      "color": "#22c55e",
      "confidence": 0.95,
      "boundingBox": { "minX": 10, "minY": 10, "maxX": 30, "maxY": 40 }
    }
  ]
}
NB: boundingBox utilise des pourcentages de 0 à 100 par rapport à l'image.
Ne mets absolument AUCUN texte avant ou après le JSON. Renvoie UNIQUEMENT l'objet JSON.`;

    const response = await fetch('/api/gemini/analyze-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: merchantId,
        isDesignerAssist: true,
        images: [imageUrl],
        prompt: prompt
      })
    });

    if (!response.ok) {
      let errDetail = '';
      try {
          const errData = await response.json();
          errDetail = errData.error || JSON.stringify(errData);
      } catch (e) {}
      throw new Error(`Erreur serveur Vision IA (Code ${response.status}): ${errDetail}`);
    }

    const data = await response.json();
    let text = data.analysis || '';
    
    if (text.includes('```json')) {
      text = text.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('\`\`\`')[1].split('\`\`\`')[0].trim();
    }

    try {
      return JSON.parse(text);
    } catch (e: any) {
      console.error("[SemanticAnalyzer] JSON parsing error:", text);
      throw new Error(`Réponse sémantique malformée: ${e.message}`);
    }
  }

  static calculateBoundingBox(points: EmbroideryPoint[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY };
  }

  static isCircular(points: EmbroideryPoint[], obb: { minDim: number, maxDim: number }) {
    const w = obb.maxDim;
    const h = obb.minDim;
    
    // Circle should have roughly equal width and height
    const ratio = Math.max(w, h) / Math.max(Math.min(w, h), 1);
    if (ratio > 1.2) return false;

    // Check if points roughly sit on the radius (simplified heuristic)
    // In a real AI engine, this would be a geometric fit calculation (e.g. least squares circle fit)
    return false; // Disabled by default in heuristic prototype, to be replaced by Vision API
  }

  static estimateThickness(points: EmbroideryPoint[], maxDim: number) {
    // Rough estimation: Area / Max Length
    // For a real prototype, use the polygon area
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        area += (p1.x * p2.y - p2.x * p1.y);
    }
    area = Math.abs(area / 2);
    return area / Math.max(maxDim, 1);
  }

  /**
   * Computes the Minimal Oriented Bounding Box (OMBB) dimensions for a set of points.
   * This provides rotation-invariant width, height, minDim, and maxDim.
   */
  static calculateOrientedBoundingBox(points: EmbroideryPoint[]): { width: number; height: number; minDim: number; maxDim: number } {
    if (!points || points.length === 0) {
      return { width: 0, height: 0, minDim: 0, maxDim: 0 };
    }

    let minArea = Infinity;
    let bestW = 0;
    let bestH = 0;

    // Use 90 orientations from 0 to 180 degrees (in steps of 2 degrees)
    // This is computationally very light (~sub-millisecond) and extremely accurate for OBB dimensions.
    const numAngles = 90;
    const angleStep = Math.PI / numAngles;

    for (let i = 0; i < numAngles; i++) {
      const theta = i * angleStep;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let minXPrime = Infinity;
      let maxXPrime = -Infinity;
      let minYPrime = Infinity;
      let maxYPrime = -Infinity;

      for (let j = 0; j < points.length; j++) {
        const p = points[j];
        const xPrime = p.x * cosT + p.y * sinT;
        const yPrime = -p.x * sinT + p.y * cosT;

        if (xPrime < minXPrime) minXPrime = xPrime;
        if (xPrime > maxXPrime) maxXPrime = xPrime;
        if (yPrime < minYPrime) minYPrime = yPrime;
        if (yPrime > maxYPrime) maxYPrime = yPrime;
      }

      const w = maxXPrime - minXPrime;
      const h = maxYPrime - minYPrime;
      const area = w * h;

      if (area < minArea) {
        minArea = area;
        bestW = w;
        bestH = h;
      }
    }

    const minDim = Math.min(bestW, bestH);
    const maxDim = Math.max(bestW, bestH);

    return { width: bestW, height: bestH, minDim, maxDim };
  }

  /**
   * Identifies congruent (identical or highly similar) shapes across layers (using rotation/scale invariant signatures)
   * and unifies their semantic classification and stitch settings to ensure pristine aesthetic uniformity.
   */
  static unifyCongruentLayers(layers: EmbroideryLayer[]): void {
    if (!layers || layers.length <= 1) return;

    interface LayerWithFeatures {
      layer: EmbroideryLayer;
      aspectRatio: number;
      compactness: number;
      solidity: number;
      normalizedThickness: number;
      minDim: number;
      maxDim: number;
    }

    const featureList: LayerWithFeatures[] = [];

    for (const l of layers) {
      if (!l.points || l.points.length < 3) continue;

      const obb = this.calculateOrientedBoundingBox(l.points);
      const minDim = obb.minDim;
      const maxDim = obb.maxDim;
      const aspectRatio = maxDim / Math.max(minDim, 0.1);

      // Compute polygon area (Shoelace formula)
      let area = 0;
      const pts = l.points;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        area += (p1.x * p2.y - p2.x * p1.y);
      }
      area = Math.abs(area / 2);

      // Compute perimeter
      let perimeter = 0;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);
      }

      const compactness = (perimeter * perimeter) / Math.max(area, 0.1);
      const solidity = area / Math.max(maxDim * minDim, 0.1);
      const thickness = this.estimateThickness(l.points, maxDim);
      const normalizedThickness = thickness / Math.max(maxDim, 0.1);

      featureList.push({
        layer: l,
        aspectRatio,
        compactness,
        solidity,
        normalizedThickness,
        minDim,
        maxDim
      });
    }

    // Build connected components using threshold similarity
    const visited = new Set<number>();
    const clusters: LayerWithFeatures[][] = [];

    for (let i = 0; i < featureList.length; i++) {
      if (visited.has(i)) continue;

      const cluster: LayerWithFeatures[] = [];
      const queue: number[] = [i];
      visited.add(i);

      while (queue.length > 0) {
        const currIdx = queue.shift()!;
        const f1 = featureList[currIdx];
        cluster.push(f1);

        for (let j = 0; j < featureList.length; j++) {
          if (visited.has(j)) continue;

          const f2 = featureList[j];

          // Rotation & scale invariant difference metric
          const da = Math.abs(f1.aspectRatio - f2.aspectRatio) / Math.max(f1.aspectRatio, f2.aspectRatio, 1);
          const ds = Math.abs(f1.solidity - f2.solidity) / Math.max(f1.solidity, f2.solidity, 0.1);
          const dc = Math.abs(f1.compactness - f2.compactness) / Math.max(f1.compactness, f2.compactness, 1);
          const dt = Math.abs(f1.normalizedThickness - f2.normalizedThickness) / Math.max(f1.normalizedThickness, f2.normalizedThickness, 0.1);

          const distance = da * 0.35 + ds * 0.35 + dc * 0.20 + dt * 0.10;

          // Highly congruent if distance < 0.15
          if (distance < 0.15) {
            visited.add(j);
            queue.push(j);
          }
        }
      }

      clusters.push(cluster);
    }

    // Process each congruent cluster to enforce pristine uniformity
    for (const cluster of clusters) {
      if (cluster.length <= 1) continue;

      // Unify classifications and stitch types via majority voting / specific selection
      const stitchCounts: Record<string, number> = {};
      const nameCounts: Record<string, number> = {};
      
      let maxStitchCount = 0;
      let consensusStitch = '';
      let maxNameCount = 0;
      let consensusName = '';

      cluster.forEach(item => {
        const l = item.layer;
        
        // Count stitch type
        stitchCounts[l.stitchType] = (stitchCounts[l.stitchType] || 0) + 1;
        if (stitchCounts[l.stitchType] > maxStitchCount) {
          maxStitchCount = stitchCounts[l.stitchType];
          consensusStitch = l.stitchType;
        }

        // Count layer name, giving higher weight to specific names over generic UNKNOWN/FORME
        const name = l.name || '';
        const isGeneric = name.toUpperCase().includes('UNKNOWN') || name.toUpperCase().includes('FORME');
        const weight = isGeneric ? 1 : 12; // strongly bias toward actual recognized shapes like TIGE, LEAF, or primitives
        nameCounts[name] = (nameCounts[name] || 0) + weight;
        if (nameCounts[name] > maxNameCount) {
          maxNameCount = nameCounts[name];
          consensusName = name;
        }
      });

      // Override and apply the consensus layout uniformly to all elements in this cluster
      cluster.forEach(item => {
        const l = item.layer;
        l.stitchType = consensusStitch as any;
        l.name = consensusName;

        // Synchronize underlay and density parameters to the unified consensus stitch
        if (l.stitchType === 'running') {
          l.underlay = false;
          l.density = 0;
        } else if (l.stitchType === 'satin') {
          l.underlay = true;
          l.density = 0.6;
        } else if (l.stitchType === 'tatami') {
          l.underlay = true;
          l.density = 0.8;
        }
      });
    }
  }
}
