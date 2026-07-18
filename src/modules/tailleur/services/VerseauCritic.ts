/**
 * @module VerseauCritic
 * @description Auto-evaluation, self-correction, and consistency verification engine for Verseau's decisions.
 * Implements the self-reflective loop (AUTO-CRITIQUE) that analyzes recommendations against strict
 * mechanical safety thresholds and physical limits prior to deterministic compilation.
 * 
 * STATUS: Designed | Implemented | Tested | Benchmarked
 * RÈGLE 52 - MATURITÉ EXPLICITE : PRODUCTION STABLE
 */

import { CognitiveSuggestion } from './VerseauReasoner';

export interface CritiqueAdjustment {
  parameter: string;
  originalValue: any;
  adjustedValue: any;
  reason: string;
}

export interface VerseauCriticReport {
  isConsistent: boolean;
  critiqueLogs: string[];
  adjustments: CritiqueAdjustment[];
  correctedSuggestions: CognitiveSuggestion[];
  reflectionTrace: string;
}

export class VerseauCritic {
  /**
   * Conducts an in-depth auto-critique of the reasoner's recommendations.
   * Assures physical feasibility, prevents material tearing, checks for parameter extremes,
   * and overrides unsafe decisions through logical self-correction.
   * 
   * @param family Mode/pattern category being analyzed
   * @param fabricKey Target fabric profile
   * @param suggestions List of initial recommendations from VerseauReasoner
   * @returns VerseauCriticReport detailed self-correction and validation trace
   */
  static evaluate(
    family: string,
    fabricKey: string,
    suggestions: CognitiveSuggestion[]
  ): VerseauCriticReport {
    const critiqueLogs: string[] = [];
    const adjustments: CritiqueAdjustment[] = [];
    const correctedSuggestions: CognitiveSuggestion[] = JSON.parse(JSON.stringify(suggestions));

    critiqueLogs.push(`[Verseau Critic] Lancement de l'auto-critique sur le motif [${family}] pour le support [${fabricKey}]...`);

    // Rule-based safety boundaries and physical consistency checks
    const checkAndAdjust = (
      param: string,
      min: number,
      max: number,
      safeVal: number,
      warningMsg: string,
      correctMsg: string
    ) => {
      const idx = correctedSuggestions.findIndex(s => s.parameter === param);
      if (idx !== -1) {
        const val = Number(correctedSuggestions[idx].value);
        if (isNaN(val)) return;

        if (val < min || val > max) {
          critiqueLogs.push(`[Verseau Critic] ⚠️ ALERTE CONSISTANCE : ${warningMsg} (Valeur détectée: ${val})`);
          adjustments.push({
            parameter: param,
            originalValue: val,
            adjustedValue: safeVal,
            reason: correctMsg
          });
          correctedSuggestions[idx].value = safeVal;
          correctedSuggestions[idx].rationale += ` [Correction Critique: valeur ramenée à ${safeVal} pour des raisons de sécurité de perçage].`;
          correctedSuggestions[idx].confidence = Math.min(correctedSuggestions[idx].confidence + 5, 100);
        }
      }
    };

    // 1. Extreme Density Checks on Delicate Fabric (e.g. Silk)
    if (fabricKey === 'silk') {
      critiqueLogs.push(`[Verseau Critic] Vérification des seuils de perçage mécanique de la soie fine...`);
      // Density on silk should never be too high (low value in mm means high density)
      // If density is less than 0.36mm on silk, it's dangerously dense and will slice the fabric
      checkAndAdjust(
        'tatamiDensity',
        0.36,
        1.0,
        0.40,
        "La densité demandée pour le Tatami est trop élevée pour de la soie fluide (< 0.36mm), risque d'aiguilletage destructeur.",
        "Ajustement de sécurité : densité de Tatami rehaussée à 0.40mm pour épargner la soie délicate."
      );

      // Douglas smoothing should not be too low on silk (leads to tiny, fabric-tearing micro-stitches)
      checkAndAdjust(
        'douglas',
        0.12,
        0.5,
        0.15,
        "Lisseur Douglas réglé trop bas (< 0.12) sur soie délicate, risquant de créer des micro-points (< 0.8mm) destructeurs.",
        "Ajustement de sécurité : coefficient Douglas rehaussé à 0.15 pour filtrer les micro-points."
      );
    }

    // 2. Perforation Risk Checks on Rigid support (e.g. Leather)
    if (fabricKey === 'leather') {
      critiqueLogs.push(`[Verseau Critic] Analyse des risques de pré-découpe mécanique du cuir rigide...`);
      // Underlay must always be disabled on leather to avoid tearing
      const underlayIdx = correctedSuggestions.findIndex(s => s.parameter === 'underlay');
      if (underlayIdx !== -1 && correctedSuggestions[underlayIdx].value === true) {
        critiqueLogs.push(`[Verseau Critic] ⚠️ ALERTE CONSISTANCE : Sous-couche d'ancrage (Underlay) active sur cuir, risque de prédécoupage irréversible !`);
        adjustments.push({
          parameter: 'underlay',
          originalValue: true,
          adjustedValue: false,
          reason: "Désactivation complète de l'underlay sur cuir pour éliminer l'effet ticket perforé."
        });
        correctedSuggestions[underlayIdx].value = false;
        correctedSuggestions[underlayIdx].rationale += " [Correction Critique: Désactivation forcée de l'underlay sur cuir].";
      }

      // Density on leather should be very sparse
      checkAndAdjust(
        'tatamiDensity',
        0.40,
        1.0,
        0.44,
        "La densité demandée pour le cuir est trop élevée (< 0.40mm), risquant d'affaiblir la peau par perforations adjacentes.",
        "Ajustement de sécurité : densité fixée à 0.44mm de sécurité cuir."
      );
    }

    // 3. Absolute mechanical limit checks across all fabrics
    critiqueLogs.push(`[Verseau Critic] Audit des limites machine absolues (Tension ruban, pas Douglas, retrait)...`);
    checkAndAdjust(
      'pullCompensation',
      0.0,
      0.4,
      0.35,
      "Compensation d'embus déraisonnable (> 0.4mm), risque de surépaisseur et désalignement de contour.",
      "Ajustement de sécurité : pull compensation bridé à sa limite technique haute de 0.35mm."
    );

    checkAndAdjust(
      'ribbonWidth',
      1.5,
      4.0,
      2.8,
      "Tension de boucle (ribbonWidth) en dehors de la plage physique acceptable [1.5mm - 4.0mm].",
      "Valeur par défaut calibrée de 2.8mm rétablie."
    );

    const isConsistent = adjustments.length === 0;
    if (isConsistent) {
      critiqueLogs.push(`[Verseau Critic] ✅ Auto-critique validée : Toutes les décisions sont mécaniquement cohérentes et sécurisées.`);
    } else {
      critiqueLogs.push(`[Verseau Critic] 🛠️ Auto-critique terminée avec ${adjustments.length} corrections appliquées pour préserver l'intégrité physique du support.`);
    }

    const reflectionTrace = isConsistent
      ? `Auto-critique à 100% cohérente. Aucun paramètre ne dépasse les limites critiques du tissu [${fabricKey}].`
      : `Auto-critique active : correction de ${adjustments.length} paramètre(s) litigieux. Les valeurs originales dépassaient les seuils de préservation mécanique du tissu.`;

    return {
      isConsistent,
      critiqueLogs,
      adjustments,
      correctedSuggestions,
      reflectionTrace
    };
  }
}
