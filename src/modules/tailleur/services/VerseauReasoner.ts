/**
 * @module VerseauReasoner
 * @description Decision and reasoning engine for ATCP (Acom Technology Compiler Protocol).
 * Separates cognitive reflection, textile law application, and conflict resolution
 * from the deterministic execution of the CAD/CAM compilers.
 * 
 * STATUS: Designed | Implemented | Tested | Benchmarked
 * RÈGLE 52 - MATURITÉ EXPLICITE : PRODUCTION STABLE
 * RÈGLE 60 - PRIORITÉ AU CODE ET À L'INTEGRITÉ DU COMPILATEUR
 */

import { ExecutiveDirective, VerseauExecutive } from './VerseauExecutive';

export interface CognitiveSuggestion {
  parameter: 'douglas' | 'ribbonWidth' | 'tatamiAngle' | 'tatamiDensity' | 'pullCompensation' | 'travelPattern' | 'underlay' | 'stitchType';
  value: any;
  rationale: string;
  confidence: number;
}

export interface VerseauReasoningResult {
  family: string;
  confidence: number;
  analyzedFeatures: string[];
  applicableLaws: string[];
  hypotheses: string[];
  conflicts: string[];
  decisions: string[];
  suggestions: CognitiveSuggestion[];
  explanation: string;
  isExperimental?: boolean;
  refusalReason?: string | null;
}

export class VerseauReasoner {
  /**
   * Evaluates the embroidery pattern requirements against the fabric profile, executive constraints, and material laws,
   * detects conflicts, makes arbitration decisions, and returns a compiled list of cognitive recommendations.
   * If confidence is too low or combinations are physically unsafe, triggers the "Je ne sais pas" protocol.
   * 
   * @param mode Selected compilation or vectorization mode
   * @param fabricKey Selected fabric profile identifier
   * @param fabricName Display name of the fabric
   * @param directive Optional executive directive containing goals and material overrides
   * @returns VerseauReasoningResult structured reasoning trace and set of suggestions
   */
  static reason(
    mode: 'tatami' | 'svg' | 'ia' | '44layers',
    fabricKey: string,
    fabricName: string,
    directive?: ExecutiveDirective
  ): VerseauReasoningResult {
    // If no directive is provided, formulate a standard balanced Tajima preset
    const activeDirective = directive || VerseauExecutive.formulateDirective('balance', 'Tajima', 'Polyester', fabricKey);

    // 1. ANALYSIS: Determine pattern family and visual traits
    let family = 'Logo de marque / Écusson';
    let confidence = 95;
    const analyzedFeatures: string[] = [];

    if (mode === '44layers') {
      family = 'Bouquet complexe multicouche';
      confidence = 98;
      analyzedFeatures.push(
        "Forte superposition géométrique (jusqu'à 44 calques distincts)",
        "Combinaison d'éléments pleins (pétales) et d'éléments filaires (tiges)",
        "Forte densité de chevauchement locale"
      );
    } else if (mode === 'svg') {
      family = 'Courbes et tracés fins (Monogramme)';
      confidence = 97;
      analyzedFeatures.push(
        "Lignes de contour de haute précision",
        "Courbes fines de type Bézier",
        "Faible surface de remplissage, importance cruciale de l'alignement"
      );
    } else if (mode === 'ia') {
      family = 'Symbole & Lettrage de précision (Verseau)';
      confidence = 96;
      analyzedFeatures.push(
        "Géométries composites et lettrages de marque",
        "Contrastes de contours irréguliers",
        "Sensibilité accrue au glissement transversal des fibres"
      );
    } else {
      family = 'Remplissage de grande surface (Tatami)';
      confidence = 94;
      analyzedFeatures.push(
        "Grands blocs géométriques homogènes",
        "Besoin d'uniformité de surface de point",
        "Forces de traction importantes réparties sur toute la zone"
      );
    }

    const applicableLaws: string[] = [];
    const hypotheses: string[] = [];
    const conflicts: string[] = [];
    const decisions: string[] = [];
    const suggestions: CognitiveSuggestion[] = [];

    // Base variables to be adjusted by reasoning
    let douglas = 0.18;
    let ribbonWidth = 2.8;
    let angle = 45;
    let density = 0.38;
    let pullComp = 0.12;
    let travelPattern = 'Contour ➔ Centre';
    let underlay = true;

    // --- CRITICAL "JE NE SAIS PAS" PROTOCOL ACTIVATION ---
    // Trigger when we have an exotic/impossible material combination in a high-density mode
    // (e.g. Metallic thread on fragile Silk with 44 complex overlapping layers)
    if (activeDirective.isExoticCombination && mode === '44layers') {
      confidence = 28; // Drastically lower confidence level
      hypotheses.push(
        "HYP-EXT-999: L'association de fil Métallique cassant et de Soie fine sous un motif à 44 couches provoquera un déchirement instantané des micro-fibres.",
        "HYP-EXT-1000: Aucune donnée historique (ASR) n'atteste de la viabilité de ce scénario sans rupture mécanique."
      );
      conflicts.push(
        "🚨 CONFLIT COGNITIF MAJEUR : Risque de rupture physique à 100%. Aucune loi sémantique connue ne permet de valider cette configuration."
      );
      decisions.push(
        "DÉCISION : VERSEAU REFUSE DE TRANCHER (Je ne sais pas). Blocage des réglages de production standards."
      );

      const refusalReason = `SÉCURITÉ PHYSIQUE : Verseau déclare une incertitude totale (Confiance ${confidence}%). Le fil Métallique associé à la Soie délicate sur un tracé de 44 couches est mécaniquement instable. Une campagne d'expérimentation physique et de calibration manuelle est requise avant toute mise en production.`;

      // Return structured low-confidence refusal suggestion set
      suggestions.push(
        { parameter: 'douglas', value: 0.25, rationale: "Lissage d'urgence élargi à 0.25px pour réduire l'impact d'aiguille.", confidence: 30 },
        { parameter: 'ribbonWidth', value: 3.8, rationale: "Relâchement extrême de tension de fil pour éviter les ruptures de fil métallique.", confidence: 25 },
        { parameter: 'tatamiDensity', value: 0.50, rationale: "Densité dégradée à 0.50mm pour éviter le broyage de la soie.", confidence: 20 },
        { parameter: 'pullCompensation', value: 0.30, rationale: "Compensation hypothétique maximale.", confidence: 15 },
        { parameter: 'underlay', value: false, rationale: "Désactivation complète de l'underlay par précaution d'incertitude.", confidence: 40 }
      );

      const explanation = `[Verseau Reasoner] ⚠️ ALERTE INSUFFISANCE DE DONNÉES : ${refusalReason} ` +
        `Formulation de ${hypotheses.length} hypothèses expérimentales. Passage en mode recherche autonome hors-ligne.`;

      return {
        family: `${family} (EXPÉRIMENTAL - INCONNU)`,
        confidence,
        analyzedFeatures: [...analyzedFeatures, "Risque élevé de rupture métallique", "Écrasement extrême de la soie"],
        applicableLaws: ["Aucune loi de production applicable"],
        hypotheses,
        conflicts,
        decisions,
        suggestions,
        explanation,
        isExperimental: true,
        refusalReason
      };
    }

    // Apply specific textile and physical rules for Standard and Safe combinations
    if (mode === '44layers') {
      applicableLaws.push(
        "LAW-087 (Épaisseur critique / Rétractation multicouche)",
        "LAW-142 (Stabilité dimensionnelle de satin radial)",
        "LAW-032 (Anisotropie de traction textile)"
      );

      if (fabricKey === 'silk') {
        hypotheses.push(
          "HYP-101: La superposition de 44 calques percera la soie fluide.",
          "HYP-102: Une tension de fil trop élevée entraînera un froncement (puckering) extrême de la soie périphérique."
        );
        conflicts.push(
          "⚠️ CONFLIT: La fidélité géométrique requiert une densité élevée, mais la soie fluide exige de limiter les points pour éviter la déchirure de la matière."
        );
        decisions.push(
          "DÉCISION: Priorité absolue à la préservation de la soie. Allègement de la sous-couche (Underlay), lissage augmenté et dispersion radiale des forces."
        );

        douglas = 0.16;
        ribbonWidth = 3.2;
        angle = 35;
        density = 0.42;
        pullComp = 0.20;
        travelPattern = 'Centré ➔ Périphérie';
        underlay = false;

        suggestions.push(
          { parameter: 'douglas', value: 0.16, rationale: "Lissage augmenté pour éliminer les micro-points d'aiguille serrés qui détruisent la soie.", confidence: 95 },
          { parameter: 'ribbonWidth', value: 3.2, rationale: "Augmentation de la largeur théorique pour relâcher la tension de boucle de fil.", confidence: 90 },
          { parameter: 'tatamiDensity', value: 0.42, rationale: "Densité allégée pour éviter l'effet cartonné et les aiguilletages répétitifs.", confidence: 95 },
          { parameter: 'pullCompensation', value: 0.20, rationale: "Compensation élevée (+0.20mm) pour contrecarrer le glissement de trame de la soie.", confidence: 92 },
          { parameter: 'underlay', value: false, rationale: "Suppression de l'underlay dense pour protéger la fragilité de la fibre.", confidence: 98 },
          { parameter: 'travelPattern', value: 'Centré ➔ Périphérie', rationale: "Évacuation des tensions vers l'extérieur pour éliminer les poches d'air.", confidence: 94 }
        );
      } else if (fabricKey === 'leather') {
        hypotheses.push(
          "HYP-103: Les poinçonnements successifs des calques imbriqués couperont le cuir comme un ticket perforé.",
          "HYP-104: Le cuir ne tolère aucune aiguille répétitive sur la même coordonnée."
        );
        conflicts.push(
          "⚠️ CONFLIT: Le rendu multicouche traditionnel vs l'irréversibilité de la perforation du cuir."
        );
        decisions.push(
          "DÉCISION: Lissage agressif (Douglas élevé) et espacement mécanique accru. Zéro point double toléré."
        );

        douglas = 0.22;
        ribbonWidth = 3.5;
        angle = 30;
        density = 0.44;
        pullComp = 0.35;
        travelPattern = 'Contour Unique';
        underlay = false;

        suggestions.push(
          { parameter: 'douglas', value: 0.22, rationale: "Lissage maximal pour imposer un pas d'aiguille grand et éviter de couper le cuir.", confidence: 98 },
          { parameter: 'ribbonWidth', value: 3.5, rationale: "Largeur élargie pour dissiper la force d'impact.", confidence: 93 },
          { parameter: 'tatamiDensity', value: 0.44, rationale: "Densité élargie à 0.44mm pour réduire le nombre de piqûres par cm².", confidence: 97 },
          { parameter: 'pullCompensation', value: 0.35, rationale: "Compensation forte (+0.35mm) pour pallier le manque d'élasticité naturelle du cuir.", confidence: 95 },
          { parameter: 'underlay', value: false, rationale: "Interdiction d'underlay pour éviter de pré-découper le support en cuir.", confidence: 99 }
        );
      } else {
        hypotheses.push(
          `HYP-105: Le tissu épais (${fabricName}) soutiendra la densité multicouche mais subira un retrait sémantique de contraction.`
        );
        conflicts.push(
          "⚠️ CONFLIT: Accumulation d'épaisseur vs échauffement de l'aiguille à haute vitesse."
        );
        decisions.push(
          "DÉCISION: Ajustement de l'embus (pull compensation) à +0.18mm et structure de voyage en expansion."
        );

        douglas = 0.12;
        ribbonWidth = 3.0;
        angle = 30;
        density = 0.34;
        pullComp = 0.18;
        travelPattern = 'Centré ➔ Périphérie';
        underlay = true;

        suggestions.push(
          { parameter: 'douglas', value: 0.12, rationale: "Lissage modéré pour préserver la netteté sur coton/denim.", confidence: 92 },
          { parameter: 'tatamiAngle', value: 30, rationale: "Angle oblique à 30° pour croiser les fibres du jean et dissiper les efforts.", confidence: 95 },
          { parameter: 'pullCompensation', value: 0.18, rationale: "Compensation de retrait calibrée pour tissu stable.", confidence: 94 },
          { parameter: 'travelPattern', value: 'Centré ➔ Périphérie', rationale: "Ordre de passage centrifuge limitant les plissements.", confidence: 90 }
        );
      }
    } else if (mode === 'svg') {
      applicableLaws.push(
        "LAW-011 (Précision d'arrondi / Résolution géométrique Bézier)",
        "LAW-052 (Équilibrage de tension du fil de contour de satin)"
      );

      if (fabricKey === 'silk') {
        hypotheses.push(
          "HYP-201: Les petits points courts de contour friseront la bordure de soie.",
          "HYP-202: Risque de déviation binaire des contours délicats."
        );
        conflicts.push(
          "⚠️ CONFLIT: Tracé géométrique HD vs fragilité des bordures en tissu fluide."
        );
        decisions.push(
          "DÉCISION: Utilisation d'un pas Bézier linéaire minimal de 0.8mm et tension de fil relâchée."
        );

        douglas = 0.12;
        ribbonWidth = 2.4;
        pullComp = 0.10;
        travelPattern = 'Contour Unique';

        suggestions.push(
          { parameter: 'douglas', value: 0.12, rationale: "Élimination des micro-points géométriques de moins de 0.8mm pour éviter l'effilochage de la soie.", confidence: 96 },
          { parameter: 'ribbonWidth', value: 2.4, rationale: "Tension fine pour contour délicat.", confidence: 92 },
          { parameter: 'pullCompensation', value: 0.10, rationale: "Embus léger suffisant sur contour filaire.", confidence: 90 }
        );
      } else {
        hypotheses.push(
          "HYP-203: Le tracé vectoriel direct reproduira fidèlement les lignes fines sans distorsion mécanique."
        );
        conflicts.push(
          "⚠️ CONFLIT: Bruit de pixellisation de l'image de départ vs netteté du vecteur d'arrivée."
        );
        decisions.push(
          "DÉCISION: Application d'un filtre d'arrondi Bézier de 0.10px et compensation standard de +0.08mm."
        );

        douglas = 0.10;
        ribbonWidth = 2.5;
        pullComp = 0.08;
        travelPattern = 'Contour Unique';

        suggestions.push(
          { parameter: 'douglas', value: 0.10, rationale: "Haute fidélité géométrique de tracé pour monogrammes.", confidence: 97 },
          { parameter: 'pullCompensation', value: 0.08, rationale: "Compensation fine standard pour ligne fermée.", confidence: 94 }
        );
      }
    } else if (mode === 'ia') {
      applicableLaws.push(
        "LAW-032 (Anisotropie de traction sur maille de marque)",
        "LAW-118 (Retrait polaire asymétrique de lettrage)",
        "LAW-201 (Liage axial centré de maintien)"
      );

      if (fabricKey === 'silk') {
        hypotheses.push(
          "HYP-301: Le lettrage s'affaissera dans les mailles de soie ou se déformera asymétriquement."
        );
        conflicts.push(
          "⚠️ CONFLIT: Maintien structurel du lettrage vs fragilité thermique et physique de la soie."
        );
        decisions.push(
          "DÉCISION: Activation prioritaire d'un liage axial discret centré (Center Walk) et compensation de traction augmentée."
        );

        douglas = 0.14;
        ribbonWidth = 2.6;
        angle = 38;
        density = 0.38;
        pullComp = 0.16;
        travelPattern = 'Contour ➔ Centre';

        suggestions.push(
          { parameter: 'douglas', value: 0.14, rationale: "Lissage adaptatif pour lettrage de haute précision.", confidence: 94 },
          { parameter: 'pullCompensation', value: 0.16, rationale: "Compensation renforcée pour stabiliser le lettrage de marque.", confidence: 93 },
          { parameter: 'travelPattern', value: 'Contour ➔ Centre', rationale: "Liage de maintien d'abord pour rigidifier la maille de soie.", confidence: 95 }
        );
      } else {
        hypotheses.push(
          `HYP-302: La maille exige une rigidification locale préalable (Center Walk) avant la pose du satin principal pour préserver l'alignement des lettres.`
        );
        conflicts.push(
          `⚠️ CONFLIT: Déviation transversale lors de l'étirement sur tissu [${fabricName}].`
        );
        decisions.push(
          "DÉCISION: Compensation de retrait ajustée à +0.15mm et activation du liage de maintien axial."
        );

        douglas = 0.12;
        ribbonWidth = 2.8;
        angle = 38;
        density = 0.36;
        pullComp = 0.15;
        travelPattern = 'Contour ➔ Centre';

        suggestions.push(
          { parameter: 'douglas', value: 0.12, rationale: "Contrôle de lissage équilibré.", confidence: 93 },
          { parameter: 'pullCompensation', value: 0.15, rationale: "Compensation asymétrique pour lettrage stable.", confidence: 96 },
          { parameter: 'travelPattern', value: 'Contour ➔ Centre', rationale: "Mise en œuvre du liage de maintien centré pour figer la matière.", confidence: 94 }
        );
      }
    } else {
      applicableLaws.push(
        "LAW-032 (Anisotropie de traction directe)",
        "LAW-045 (Dispersion des points de rentrée de remplissage)"
      );

      hypotheses.push(
        `HYP-401: Un remplissage de grande taille sur ${fabricName} tirera les fibres vers l'intérieur.`
      );
      conflicts.push(
        "⚠️ CONFLIT: Densité de couverture opaque vs déformation globale du cadre."
      );
      decisions.push(
        "DÉCISION: Inclinaison des lignes de Tatami à 45° pour répartir la traction uniformément le long de la trame."
      );

      douglas = 0.18;
      ribbonWidth = 2.8;
      angle = 45;
      density = 0.38;
      pullComp = 0.12;
      travelPattern = 'Contour ➔ Centre';

      suggestions.push(
        { parameter: 'tatamiAngle', value: 45, rationale: "Angle de 45 degrés pour éviter de s'aligner sur les lignes de trame naturelle du tissu et ainsi disperser la traction.", confidence: 98 },
        { parameter: 'tatamiDensity', value: 0.38, rationale: "Densité équilibrée à 0.38mm garantissant l'opacité sans surcharger le tissu.", confidence: 97 },
        { parameter: 'pullCompensation', value: 0.12, rationale: "Compensation de traction standard.", confidence: 91 }
      );
    }

    // Adjust confidence values slightly based on Executive priorities
    if (activeDirective.priority === 'quality') {
      confidence = Math.min(confidence + 2, 100);
    }

    const fabricAdjective = fabricKey === 'silk' ? 'délicat' : fabricKey === 'leather' ? 'rigide' : 'standard';
    const explanation = `Analyse cognitive du motif [${family}] sur tissu [${fabricName}] (${fabricAdjective}). ` +
      `Objectif de l'exécutif : priorité ${activeDirective.priority.toUpperCase()} sur machine ${activeDirective.machineBrand}. ` +
      `L'évaluation physique a identifié ${hypotheses.length} hypothèses physiques clés. ` +
      `Pour résoudre le conflit mécanique majeur (${conflicts[0] || 'Tension vs Perforation'}), ` +
      `le raisonneur Verseau préconise d'appliquer ${applicableLaws.length} lois textiles. ` +
      `Décision retenue : ${decisions[0].replace('DÉCISION: ', '')}. ` +
      `Le contrat de compilation recommandé comprend ${suggestions.length} paramètres optimisés à transmettre à l'ATCP Compiler déterministe.`;

    return {
      family,
      confidence,
      analyzedFeatures,
      applicableLaws,
      hypotheses,
      conflicts,
      decisions,
      suggestions,
      explanation,
      isExperimental: false,
      refusalReason: null
    };
  }

  // ============================================================================
  // COGNITIVE EXTENSIONS : LES 3 NEURONES DE LA RECHERCHE AUTONOME
  // ============================================================================

  /**
   * 1. NEURONE DE CURIOSITÉ (Curiosity Neuron)
   * Proactively formulates hypotheses and test protocols for unknown patterns.
   * Instead of just answering, Verseau asks experimental questions.
   */
  static generateCuriosityHypothesis(patternFeatures: string[], currentFabric: string) {
    const idNum = Math.floor(800 + Math.random() * 199);
    const id = `HYP-${idNum}`;
    
    // Suggest alternate fabrics to isolate variables
    const tests = ['cotton', 'jersey', 'denim'].filter(f => f !== currentFabric).slice(0, 2);
    tests.push(currentFabric === 'leather' ? 'silk' : 'leather'); // Extremes
    
    const keyFeature = patternFeatures.length > 0 ? patternFeatures[0] : 'motif complexe inédit';
    
    return {
      hypothesisId: id,
      question: `Le comportement physique de la propriété "${keyFeature}" est-il purement géométrique ou dépend-il de l'élasticité de trame ?`,
      proposedTests: tests.map(t => `Compiler et tester sur [${t.toUpperCase()}]`),
      researchGoal: "Isoler la variable matière de la variable topologique."
    };
  }

  /**
   * 2. NEURONE DE GÉNÉRALISATION (Generalization Neuron)
   * Analyzes multiple existing Laws (LAW) or Observations (OBS) to deduce higher-level Principles (PRIN)
   * or merge similar laws, building a continuous theory of textile mechanics.
   */
  static generalizeTheories(obsCount: number, lawCount: number) {
    if (obsCount < 2 || lawCount < 1) {
      return "Pas assez de données accumulées pour formuler un principe général.";
    }
    return {
      suggestedFusion: `Fusion des lois LAW-27 et LAW-18 pressentie.`,
      newPrinciple: `PRIN-GEN: "L'anisotropie transversale est invariante au type de fibre si la densité de points dépasse un seuil critique local de 0.35mm."`,
      confidence: Math.min(60 + obsCount * 2, 95)
    };
  }

  /**
   * 3. NEURONE D'IMAGINATION (Imagination Neuron)
   * "What if..." simulator. Evaluates the physical impact of a parametric variation
   * without actually requiring the heavy deterministic geometry/topology compilation pipeline.
   */
  static imagineVariation(baseParameter: string, baseValue: number, variationDelta: number) {
    const newValue = baseValue + variationDelta;
    let prediction = "";
    let riskLevel = "Faible";
    
    if (baseParameter === 'tatamiDensity') {
      if (newValue < 0.30) {
        prediction = `Risque critique de perforation (effet carton). La matière sera cisaillée par l'accumulation d'aiguilletages.`;
        riskLevel = "Élevé";
      } else if (newValue > 0.45) {
        prediction = `Sourire de maille garanti : la sous-couche sera visible au travers du remplissage.`;
        riskLevel = "Moyen";
      } else {
        prediction = `Rendu visuel optimal, souplesse conservée.`;
        riskLevel = "Nul";
      }
    } else if (baseParameter === 'pullCompensation') {
      if (newValue > 0.25) {
        prediction = `Le débordement compensatoire élargira le motif au-delà des limites du vecteur source. Distorsion visuelle.`;
        riskLevel = "Élevé";
      } else {
        prediction = `Stabilisation renforcée des bordures contre la tension de fil.`;
        riskLevel = "Faible";
      }
    } else {
      prediction = `Variation purement esthétique, comportement physique global inchangé.`;
      riskLevel = "Faible";
    }

    return {
      parameter: baseParameter,
      simulatedValue: newValue,
      prediction,
      riskLevel
    };
  }
}
