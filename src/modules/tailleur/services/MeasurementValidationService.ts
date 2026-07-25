/**
 * MeasurementValidationService.ts
 * Moteur de validation intelligente des mensurations pour la couture sur-mesure.
 * Analyse les valeurs saisies, vérifie les ratios anatomiques et détecte
 * les incohérences ou omissions pour guider le couturier avant la coupe.
 */

import { MeasurementLibraryService } from './MeasurementLibraryService';
import { GarmentDefinition } from './GarmentLibraryService';

export type AlertSeverity = 'error' | 'warning' | 'info';

export interface ValidationAlert {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  severity: AlertSeverity;
  message: string;
  recommendation: string;
  value?: number;
}

export type MeasurementAnomaly = ValidationAlert;

export interface ValidationResult {
  isValid: boolean;
  score: number; // Score de cohérence de 0 à 100%
  alerts: ValidationAlert[];
  missingMandatoryKeys: string[];
}

export class MeasurementValidationService {
  /**
   * Alias method for validate without needing a full GarmentDefinition
   */
  public static validateMeasurements(
    measurements: Record<string, number | string>,
    gender: 'M' | 'F' = 'M'
  ): MeasurementAnomaly[] {
    const dummyGarment: GarmentDefinition = {
      id: 'dummy',
      name: 'Générique',
      category: 'Africaine',
      gender: gender === 'F' ? 'Femme' : 'Homme',
      description: 'Modèle générique',
      icon: '🧵',
      mandatoryMeasurements: [],
      optionalMeasurements: []
    };
    return this.validate(measurements, dummyGarment).alerts;
  }
  /**
   * Effectue l'analyse complète des mesures saisies pour un vêtement donné.
   */
  public static validate(
    measurements: Record<string, number | string>,
    garment: GarmentDefinition
  ): ValidationResult {
    const alerts: ValidationAlert[] = [];
    const missingMandatoryKeys: string[] = [];

    // Convertir toutes les valeurs en nombres nettoyés
    const numericValues: Record<string, number> = {};
    Object.entries(measurements).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
        if (!isNaN(num) && num > 0) {
          numericValues[key] = num;
        }
      }
    });

    // 1. Vérification des mesures obligatoires manquantes
    garment.mandatoryMeasurements.forEach((key) => {
      if (!numericValues[key]) {
        missingMandatoryKeys.push(key);
        const def = MeasurementLibraryService.getByKey(key);
        alerts.push({
          id: `missing-${key}`,
          fieldKey: key,
          fieldLabel: def?.label || key,
          severity: 'error',
          message: `Mesure obligatoire manquante : ${def?.label || key}`,
          recommendation: `Veuillez saisir cette mesure essentielle pour confectionner un(e) ${garment.name}.`
        });
      }
    });

    // 2. Vérification des bornes physiques normales pour chaque valeur saisie
    Object.entries(numericValues).forEach(([key, val]) => {
      const def = MeasurementLibraryService.getByKey(key);
      if (def) {
        if (val < def.minNormalCm) {
          alerts.push({
            id: `bound-min-${key}`,
            fieldKey: key,
            fieldLabel: def.label,
            severity: 'warning',
            message: `${def.label} (${val} cm) semble particulièrement faible.`,
            recommendation: `Vérifiez s'il ne s'agit pas d'une erreur de saisie (valeur habituelle minimale : ${def.minNormalCm} cm).`,
            value: val
          });
        } else if (val > def.maxNormalCm) {
          alerts.push({
            id: `bound-max-${key}`,
            fieldKey: key,
            fieldLabel: def.label,
            severity: 'warning',
            message: `${def.label} (${val} cm) semble très élevé.`,
            recommendation: `Vérifiez si l'unité est bien en cm (valeur habituelle maximale : ${def.maxNormalCm} cm).`,
            value: val
          });
        }
      }
    });

    // 3. Vérification des ratios anatomiques & cohérences entre mesures

    // A. Tour de poitrine VS Tour de taille
    if (numericValues.poitrine && numericValues.taille) {
      const p = numericValues.poitrine;
      const t = numericValues.taille;

      // Incohérence majeure si l'écart est extrême (> 40cm d'écart)
      if (Math.abs(p - t) > 45) {
        alerts.push({
          id: 'ratio-poitrine-taille',
          fieldKey: 'taille',
          fieldLabel: 'Poitrine / Taille',
          severity: 'warning',
          message: `Écart très important entre la Poitrine (${p} cm) et la Taille (${t} cm).`,
          recommendation: `Vérifiez si le mètre n'a pas été trop serré sur la taille ou mal placé sur la poitrine.`
        });
      }
    }

    // B. Longueur d'entrejambe VS Longueur totale du pantalon
    if (numericValues.entrejambe && numericValues.pantalon) {
      const ent = numericValues.entrejambe;
      const pan = numericValues.pantalon;

      if (ent >= pan) {
        alerts.push({
          id: 'ratio-entrejambe-pantalon',
          fieldKey: 'entrejambe',
          fieldLabel: 'Entrejambe / Pantalon',
          severity: 'error',
          message: `L'entrejambe (${ent} cm) ne peut pas être supérieure ou égale à la longueur totale du pantalon (${pan} cm) !`,
          recommendation: `La longueur de pantalon se prend depuis la ceinture (taille) jusqu'au bas du pied.`
        });
      } else if (pan - ent < 15) {
        alerts.push({
          id: 'ratio-fourche-pantalon',
          fieldKey: 'entrejambe',
          fieldLabel: 'Hauteur de Fourche',
          severity: 'warning',
          message: `Hauteur de fourche (Pantalon - Entrejambe = ${pan - ent} cm) anormalement courte.`,
          recommendation: `La hauteur de fourche habituelle est comprise entre 22 cm et 38 cm.`
        });
      }
    }

    // C. Carrure (Épaule à Épaule) VS Tour de Poitrine
    if (numericValues.epaule && numericValues.poitrine) {
      const ep = numericValues.epaule;
      const poi = numericValues.poitrine;

      // Généralement la carrure représente environ 38% à 50% du tour de poitrine
      if (ep > poi * 0.65) {
        alerts.push({
          id: 'ratio-epaule-poitrine',
          fieldKey: 'epaule',
          fieldLabel: 'Épaule / Poitrine',
          severity: 'warning',
          message: `La carrure (${ep} cm) est disproportionnée par rapport au tour de poitrine (${poi} cm).`,
          recommendation: `Assurez-vous de mesurer d'acromion à acromion et non le long des bras.`
        });
      }
    }

    // D. Longueur de manche VS Longueur totale de veste/robe
    if (numericValues.manche && numericValues.longueurVeste) {
      const man = numericValues.manche;
      const ves = numericValues.longueurVeste;

      if (man > ves * 1.3) {
        alerts.push({
          id: 'ratio-manche-veste',
          fieldKey: 'manche',
          fieldLabel: 'Manche / Veste',
          severity: 'info',
          message: `La manche (${man} cm) est nettement plus longue que la veste (${ves} cm).`,
          recommendation: `S'il s'agit d'une liquette courte, cette proportion peut être normale.`
        });
      }
    }

    // E. Bas de pantalon VS Tour de cuisse
    if (numericValues.basPantalon && numericValues.cuisse) {
      if (numericValues.basPantalon > numericValues.cuisse) {
        alerts.push({
          id: 'ratio-bas-cuisse',
          fieldKey: 'basPantalon',
          fieldLabel: 'Bas Pantalon / Cuisse',
          severity: 'warning',
          message: `Le bas de pantalon (${numericValues.basPantalon} cm) dépasse la cuisse (${numericValues.cuisse} cm).`,
          recommendation: `Vérifiez qu'il ne s'agit pas d'une confusion entre diamètre et tour complet.`
        });
      }
    }

    // CALCUL DU SCORE DE COHÉRENCE (0 - 100%)
    let score = 100;
    const totalMandatory = garment.mandatoryMeasurements.length || 1;
    const missingCount = missingMandatoryKeys.length;
    
    // Déduction pour chaque mesure manquante
    score -= Math.round((missingCount / totalMandatory) * 60);

    // Déduction pour chaque alerte
    alerts.forEach((alt) => {
      if (alt.severity === 'error') score -= 15;
      else if (alt.severity === 'warning') score -= 8;
      else if (alt.severity === 'info') score -= 3;
    });

    score = Math.max(0, Math.min(100, score));

    return {
      isValid: missingMandatoryKeys.length === 0 && !alerts.some((a) => a.severity === 'error'),
      score,
      alerts,
      missingMandatoryKeys
    };
  }
}
