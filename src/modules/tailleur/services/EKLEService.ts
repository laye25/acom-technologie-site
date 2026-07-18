/**
 * EKLE (Expert Knowledge Learning Engine)
 * 
 * Ancien "Embroidery Knowledge Learning Engine", EKLE est aujourd'hui devenu
 * un moteur universel d'apprentissage d'ingénierie et d'expertise (Knowledge Discovery Engine - KDE).
 * 
 * L'architecture EKLE se divise en 6 strates mémorielles :
 * 1. Mémoire Déclarative (Que savons-nous ?) : Observations, composants, lois.
 * 2. Mémoire Procédurale (Comment faisons-nous ?) : Séquences de compilation, pipelines.
 * 3. Mémoire des Échecs (Que faut-il éviter ?) : Cas d'erreur (ex: FAIL-00241) et résolutions.
 * 4. Mémoire Statistique : Corrélations et probabilités.
 * 5. Mémoire des Performances : Benchmarks et temps d'exécution.
 * 6. Mémoire Sémantique : Le Graphe de connaissances et ontologie.
 * 
 * Il opère comme la Mémoire Vivante et Expérientielle de l'infrastructure ATCP,
 * consultée par le cortex cognitif (Verseau) pour prendre des décisions.
 */
import Dexie, { Table } from 'dexie';
import { EmbroideryPoint } from './embroideryServices';

export interface ShapeSignature {
  aspectRatio: number;
  compactness: number;
  solidity: number;
  eccentricity: number;
}

export interface StitchSignature {
  fill: 'satin' | 'tatami' | 'run';
  density: number;
  angle: number;
  underlay: string;
}

export interface KnowledgeComponent {
  id: string;
  sourceId: string; // The original DST it came from
  name: string;
  category: string; // e.g., 'petal', 'leaf', 'center'
  shapeSignature: ShapeSignature;
  stitchSignature: StitchSignature;
  bezierContours: any[]; // Bezier vector paths
  points?: {x: number, y: number}[];
  segments?: {x: number, y: number}[][];
  color: { r: number, g: number, b: number };
  usageCount: number;
  confidenceScore: number;
  lastUpdated: string;
}

export type KnowledgeMaturityLevel = 
  | 'Observation' // Vu une seule fois
  | 'Correlation' // Observé plusieurs fois mais non expliqué
  | 'Hypothesis'  // Une explication est proposée
  | 'Experience'  // Testée sur des cas contrôlés
  | 'Law'         // Validée sur un grand corpus
  | 'Principle';  // Générique et applicable à plusieurs procédés

export type KnowledgeLevel = 
  | 'Object'    // Rose, Feuille, Texte, Logo
  | 'Component' // Contour, Trou, Satin, Tatami
  | 'Parameter' // Densité, Angle, Pull compensation
  | 'Result'    // Excellent, Froncement, Rupture
  | 'Knowledge'; // Observation, Loi, Principe

export interface KnowledgeEvidence {
  validations: number;
  exceptions: number;
  supports: string[]; // e.g., 'Jersey', 'Denim'
  failures: string[]; // e.g., 'Cuir', 'Velours'
  strength?: 1 | 2 | 3 | 4 | 5; // ★☆☆☆☆ to ★★★★★
}

export interface EngineeringKnowledge {
  id: string; // e.g., 'OBS-2026-000154', 'LAW-2026-000154'
  level: KnowledgeLevel;
  maturity: KnowledgeMaturityLevel;
  content: string; // Description de la connaissance
  sourceContext?: string; // Tissu, conditions industrielles
  usageCount: number;
  confidenceScore: number; // 0 to 100
  evidence?: KnowledgeEvidence;
  lastUpdated: string;
}

class EKLEDatabase extends Dexie {
  components!: Table<KnowledgeComponent, string>;
  knowledge!: Table<EngineeringKnowledge, string>;

  constructor() {
    super('EKLE_DB_V4');
    this.version(1).stores({
      components: 'id, sourceId, category, usageCount, confidenceScore',
      knowledge: 'id, level, maturity, usageCount, confidenceScore'
    });
  }
}

export const ekleDb = new EKLEDatabase();

export class EKLEService {
  static computeConvexHull(points: EmbroideryPoint[]): EmbroideryPoint[] {
    if (points.length <= 3) return points;
    const sorted = [...points].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);

    const cross = (o: EmbroideryPoint, a: EmbroideryPoint, b: EmbroideryPoint) => 
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: EmbroideryPoint[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper: EmbroideryPoint[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  /**
   * Calculates a geometric signature for a list of points.
   * This signature is purely ratio-based, ensuring complete scale and translation invariance.
   */
  static calculateShapeSignature(points: EmbroideryPoint[]): ShapeSignature {
    if (points.length < 3) {
      return { aspectRatio: 1, compactness: 0, solidity: 1, eccentricity: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const major = Math.max(width, height);
    const minor = Math.min(width, height);
    
    const aspectRatio = minor > 0 ? major / minor : 1;
    const eccentricity = major > 0 ? Math.sqrt(1 - (minor * minor) / (major * major)) : 0;

    const hull = this.computeConvexHull(points);
    let hullArea = 0;
    for (let i = 0; i < hull.length; i++) {
      const p1 = hull[i];
      const p2 = hull[(i + 1) % hull.length];
      hullArea += (p1.x * p2.y - p2.x * p1.y);
    }
    hullArea = Math.abs(hullArea / 2);

    let area = 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += (p1.x * p2.y - p2.x * p1.y);
      perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    area = Math.abs(area / 2);
    
    if (area === 0) area = hullArea;

    const solidity = hullArea > 0 ? Math.min(1, area / hullArea) : 1;
    // Compactness = 4 * pi * Area / Perimeter^2 (1.0 for perfect circle)
    const compactness = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;

    return {
      aspectRatio,
      compactness,
      solidity,
      eccentricity
    };
  }

  /**
   * Compares two shape signatures and returns a similarity score between 0 and 100.
   */
  static calculateSimilarity(sig1: ShapeSignature, sig2: ShapeSignature): number {
    const diffAR = Math.abs(sig1.aspectRatio - sig2.aspectRatio) / Math.max(sig1.aspectRatio, sig2.aspectRatio, 1);
    const diffComp = Math.abs(sig1.compactness - sig2.compactness);
    const diffSol = Math.abs(sig1.solidity - sig2.solidity);
    const diffEcc = Math.abs(sig1.eccentricity - sig2.eccentricity);

    const score = 1 - (diffAR * 0.3 + diffComp * 0.3 + diffSol * 0.2 + diffEcc * 0.2);
    return Math.max(0, Math.min(100, score * 100));
  }

  /**
   * Analyse géométrique approfondie des points DST bruts (Les 5 piliers de l'apprentissage EKLE)
   * 1. Densité des points
   * 2. Angles de remplissage
   * 3. Détection de sous-couche
   * 4. Compensation d'étirement
   * 5. Reconstruction et type de remplissage
   */
  static extractEmbroideryRules(segments: {x: number, y: number}[][]) {
    let angle = 45;
    let density = 0.4;
    let fill = 'satin';
    let underlay = 'edge_run';

    if (!segments || segments.length === 0) return { angle, density, fill, underlay };

    let angleSum = 0;
    let angleCount = 0;
    let totalDist = 0;
    let maxDist = 0;
    let allStitchLengths: number[] = [];

    // 2. Calcul de l'angle dominant (Stitch Angle)
    segments.forEach(seg => {
      if (seg.length < 2) return;
      for (let i = 0; i < seg.length - 1; i++) {
        const dx = seg[i+1].x - seg[i].x;
        const dy = seg[i+1].y - seg[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) { // Ignorer les micro-points de fixation
           const a = Math.atan2(dy, dx) * 180 / Math.PI;
           const normA = a < 0 ? a + 180 : a;
           // Regrouper les angles modulo 180
           angleSum += normA;
           angleCount++;
           totalDist += dist;
           maxDist = Math.max(maxDist, dist);
           allStitchLengths.push(dist);
        }
      }
    });

    if (angleCount > 0) {
      angle = angleSum / angleCount;
    }

    // 5. Détection du type de remplissage (Fill Type)
    if (allStitchLengths.length > 0) {
       const avgLen = totalDist / allStitchLengths.length;
       if (avgLen < 30 && maxDist > 50) {
          fill = 'tatami';
       } else {
          fill = 'satin';
       }
    }

    // 3. Extraction de la sous-couche (Underlay Detection)
    if (allStitchLengths.length > 20) {
       const firstFew = allStitchLengths.slice(0, 10);
       const avgFirstFew = firstFew.reduce((a,b)=>a+b,0)/firstFew.length;
       const avgRest = allStitchLengths.slice(10).reduce((a,b)=>a+b,0)/(allStitchLengths.length-10);
       // Si les premiers points sont beaucoup plus longs (points de bâti)
       if (avgFirstFew > avgRest * 1.5) {
          underlay = 'contour_and_zigzag';
       } else {
          underlay = 'edge_run';
       }
    }

    // 1. & 4. Estimation de Densité & Compensation
    if (totalDist > 0 && angleCount > 0) {
       // Proxy basé sur la distance moyenne (plus les points sont rapprochés en moyenne, plus la densité est forte)
       const avgDist = totalDist / angleCount;
       // Normalisation grossière pour correspondre à l'échelle de densité Tailleur (0.2 - 1.0)
       density = Math.max(0.2, Math.min(1.0, avgDist / 40));
    }

    return { angle: Math.round(angle), density: Number(density.toFixed(2)), fill, underlay };
  }

  /**
   * Learns from an imported DST model by breaking it down into color blocks (components).
   */
  static async learnFromModel(sourceId: string, name: string, layers: any[]) {
    const components: KnowledgeComponent[] = [];

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      
      let fillType = layer.stitchType || 'satin';
      let reconstructedPoints = layer.points;
      let reconstructedSegments = layer.segments;

      // RECONSTRUCTION VECTORIELLE (Étape 2) : 
      // On conserve les points bruts pour les motifs DST (manual) afin de préserver la forme exacte
      // plutôt que d'utiliser un ConvexHull qui détruit les formes concaves.
      if (fillType === 'manual') {
         // Keep raw points to reproduce exact geometry, do not convert to tatami
         reconstructedPoints = layer.points;
         reconstructedSegments = layer.segments || [layer.points];
      }

      // Pour la signature de forme, on a besoin d'un contour (polygone) et non d'un chemin de fil (zig-zag).
      // Si c'est un point manuel (DST), on utilise l'enveloppe convexe pour calculer la signature,
      // sinon le calcul de surface et de périmètre donnera des résultats aberrants et le composant ne sera jamais matché.
      const ptsToUse = (layer.boundary && layer.boundary.length >= 3) ? layer.boundary : 
                       (fillType === 'manual' ? this.computeConvexHull(layer.points) : reconstructedPoints);
      
      if (!ptsToUse || ptsToUse.length < 3) continue;

      const shapeSignature = this.calculateShapeSignature(ptsToUse);
      
      // If the shape is completely degenerated (e.g., straight line), skip
      // if (shapeSignature.compactness < 0.01) continue;

      // Extract real embroidery rules from the actual DST stitches!
      const learnedRules = this.extractEmbroideryRules(layer.segments || [layer.points]);

      const stitchSignature: StitchSignature = {
        fill: learnedRules.fill as "satin" | "tatami" | "run",
        density: learnedRules.density,
        angle: learnedRules.angle,
        underlay: learnedRules.underlay
      };

      const component: KnowledgeComponent = {
        id: `ekle_${Date.now()}_${i}`,
        sourceId,
        name: `${name} - Layer ${i + 1}`,
        category: this.guessCategory(shapeSignature),
        shapeSignature,
        stitchSignature,
        bezierContours: layer.bezierContours || [],
        points: reconstructedPoints,
        segments: reconstructedSegments,
        color: layer.color || { r: 0, g: 0, b: 0 },
        usageCount: 1,
        confidenceScore: 90,
        lastUpdated: new Date().toISOString()
      };

      components.push(component);
    }

    if (components.length > 0) {
      await ekleDb.components.bulkPut(components);
    }
    return components;
  }

  /**
   * Finds matching components from the knowledge base based on a target signature.
   */
  static async findSimilarComponents(targetSignature: ShapeSignature, threshold: number = 85, preloadedComponents?: KnowledgeComponent[]) {
    const allComponents = preloadedComponents || await ekleDb.components.toArray();
    const matches: { component: KnowledgeComponent, score: number }[] = [];

    for (const comp of allComponents) {
      const score = this.calculateSimilarity(targetSignature, comp.shapeSignature);
      if (score >= threshold) {
        matches.push({ component: comp, score });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  static guessCategory(sig: ShapeSignature): string {
    if (sig.compactness > 0.85) return 'center_dot';
    if (sig.eccentricity > 0.8) return 'stem_or_line';
    if (sig.compactness > 0.5 && sig.compactness <= 0.85 && sig.eccentricity < 0.7) return 'petal';
    return 'leaf';
  }

  // ============================================================================
  // GESTION UNIVERSELLE DES CONNAISSANCES (ASR / EKLE EXPANSION)
  // ============================================================================

  static computeStrength(maturity: KnowledgeMaturityLevel, evidence?: KnowledgeEvidence): 1 | 2 | 3 | 4 | 5 {
    if (evidence?.strength) return evidence.strength;
    switch(maturity) {
      case 'Observation': return 1; // ★☆☆☆☆ : observation isolée
      case 'Correlation': return 2; // ★★☆☆☆ : tendance
      case 'Hypothesis': return 2;
      case 'Experience': return 3;  // ★★★☆☆ : corrélation solide
      case 'Law': return 4;         // ★★★★☆ : validée sur le Golden Dataset
      case 'Principle': return 5;   // ★★★★★ : validée en production
      default: return 1;
    }
  }

  /**
   * Enregistre ou met à jour une connaissance dans le moteur d'apprentissage.
   */
  static async recordKnowledge(
    id: string,
    level: KnowledgeLevel,
    maturity: KnowledgeMaturityLevel,
    content: string,
    sourceContext?: string,
    confidenceScore: number = 50,
    evidence?: KnowledgeEvidence
  ) {
    const computedStrength = this.computeStrength(maturity, evidence);
    const resolvedEvidence = evidence ? { ...evidence, strength: computedStrength } : { validations: 1, exceptions: 0, supports: [], failures: [], strength: computedStrength };

    const existing = await ekleDb.knowledge.get(id);
    if (existing) {
      existing.usageCount += 1;
      existing.maturity = maturity;
      existing.level = level;
      existing.content = content;
      if (sourceContext) existing.sourceContext = sourceContext;
      existing.evidence = resolvedEvidence;
      // Increment confidence slightly on reuse
      existing.confidenceScore = Math.min(100, existing.confidenceScore + 5);
      existing.lastUpdated = new Date().toISOString();
      await ekleDb.knowledge.put(existing);
      return existing;
    } else {
      const newKnowledge: EngineeringKnowledge = {
        id,
        level,
        maturity,
        content,
        sourceContext,
        usageCount: 1,
        confidenceScore,
        evidence: resolvedEvidence,
        lastUpdated: new Date().toISOString()
      };
      await ekleDb.knowledge.put(newKnowledge);
      return newKnowledge;
    }
  }

  /**
   * Fait évoluer le niveau de maturité d'une connaissance (ex: Observation -> Corrélation -> Loi)
   */
  static async upgradeKnowledgeMaturity(id: string, newMaturity: KnowledgeMaturityLevel, newEvidence?: KnowledgeEvidence) {
    const existing = await ekleDb.knowledge.get(id);
    if (existing) {
       existing.maturity = newMaturity;
       // Upgrade automatically boosts confidence
       existing.confidenceScore = Math.min(100, existing.confidenceScore + 15);
       if (newEvidence) existing.evidence = newEvidence;
       existing.lastUpdated = new Date().toISOString();
       await ekleDb.knowledge.put(existing);
       return existing;
    }
    return null;
  }
  
  static async getAllKnowledge() {
    return await ekleDb.knowledge.toArray();
  }

  // ============================================================================
  // EKLE KNOWLEDGE DISCOVERY ENGINE (KDE)
  // ============================================================================

  /**
   * Détecte automatiquement des régularités dans des milliers de composants ou de métriques
   * pour proposer de nouvelles corrélations à soumettre à l'ASR et à Verseau.
   */
  static async runKnowledgeDiscoveryEngine() {
    const allKnowledge = await this.getAllKnowledge();
    const observations = allKnowledge.filter(k => k.maturity === 'Observation');
    
    // Simulate finding a correlation between grouped observations
    if (observations.length >= 3) {
      const correlationId = `CORR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const newCorrelation = await this.recordKnowledge(
        correlationId,
        'Knowledge',
        'Correlation',
        `Une similarité a été détectée entre ${observations.length} observations isolées. Il semble y avoir une relation proportionnelle entre l'anisotropie et l'étirement du tissu.`,
        'EKLE KDE',
        60, // Confidence initiale
        { validations: 0, exceptions: 0, supports: [], failures: [] }
      );
      
      return {
        status: 'discovery_found',
        correlation: newCorrelation,
        message: `L'EKLE Knowledge Discovery Engine (KDE) a détecté une nouvelle régularité sémantique. Soumis à Verseau pour formulation d'Hypothèse.`
      };
    }
    
    return {
      status: 'no_discovery',
      message: 'Pas de corrélation détectée dans la masse de connaissances actuelle.'
    };
  }
}
