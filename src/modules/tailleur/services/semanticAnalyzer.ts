import { EmbroideryPoint } from './embroideryServices';

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
    
    // Heuristic 1: Is it a circle?
    if (this.isCircular(points, bbox)) {
      return {
        id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        className: 'circle',
        confidence: 0.85,
        boundingBox: bbox,
        rawPoints: points,
        parameters: {
          center: { x: bbox.minX + w/2, y: bbox.minY + h/2 },
          radius: Math.max(w, h) / 2
        },
        suggestedStitchType: w > 10 ? 'tatami' : 'satin'
      };
    }

    // Heuristic 2: Is it a stem (long, thin, continuous)?
    const thickness = this.estimateThickness(points, bbox);
    if (Math.max(w, h) > thickness * 5 && thickness < 30) {
       return {
        id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        className: 'stem',
        confidence: 0.75,
        boundingBox: bbox,
        rawPoints: points,
        parameters: { thickness },
        suggestedStitchType: thickness < 15 ? 'running' : 'satin'
      };
    }

    // Fallback
    return {
      id: `sem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      className: 'unknown',
      confidence: 0.1,
      boundingBox: bbox,
      rawPoints: points,
      parameters: { thickness },
      suggestedStitchType: area < 2500 ? 'satin' : 'tatami'
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

  static isCircular(points: EmbroideryPoint[], bbox: {minX: number, minY: number, maxX: number, maxY: number}) {
    const w = bbox.maxX - bbox.minX;
    const h = bbox.maxY - bbox.minY;
    
    // Circle should have roughly equal width and height
    const ratio = Math.max(w, h) / Math.max(Math.min(w, h), 1);
    if (ratio > 1.2) return false;

    // Check if points roughly sit on the radius (simplified heuristic)
    // In a real AI engine, this would be a geometric fit calculation (e.g. least squares circle fit)
    return false; // Disabled by default in heuristic prototype, to be replaced by Vision API
  }

  static estimateThickness(points: EmbroideryPoint[], bbox: {minX: number, minY: number, maxX: number, maxY: number}) {
    // Rough estimation: Area / Max Length
    // For a real prototype, use the polygon area
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        area += (p1.x * p2.y - p2.x * p1.y);
    }
    area = Math.abs(area / 2);
    return area / Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY, 1);
  }
}
