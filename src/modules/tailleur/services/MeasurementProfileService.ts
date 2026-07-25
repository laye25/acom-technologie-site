/**
 * MeasurementProfileService.ts
 * Gestion des profils de mesures par vêtement/modèle et validation de leur complétude.
 */

import { GarmentDefinition, GarmentLibraryService } from './GarmentLibraryService';
import { MeasurementLibraryService } from './MeasurementLibraryService';
import { MeasurementValidationService, MeasurementAnomaly } from './MeasurementValidationService';

export interface MeasurementCompletenessResult {
  isComplete: boolean;
  mandatoryTotal: number;
  mandatoryFilledCount: number;
  optionalTotal: number;
  optionalFilledCount: number;
  missingMandatoryKeys: string[];
  missingMandatoryLabels: string[];
  anomalies: MeasurementAnomaly[];
}

export class MeasurementProfileService {
  /**
   * Vérifie la complétude des mesures pour un vêtement spécifique
   */
  public static checkCompleteness(
    garment: GarmentDefinition,
    measurements: Record<string, number | string> = {}
  ): MeasurementCompletenessResult {
    const mandatoryKeys = garment.mandatoryMeasurements || [];
    const optionalKeys = garment.optionalMeasurements || [];

    const missingMandatoryKeys: string[] = [];
    let mandatoryFilledCount = 0;

    mandatoryKeys.forEach((key) => {
      const val = measurements[key];
      if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val)) && Number(val) > 0) {
        mandatoryFilledCount++;
      } else {
        missingMandatoryKeys.push(key);
      }
    });

    let optionalFilledCount = 0;
    optionalKeys.forEach((key) => {
      const val = measurements[key];
      if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val)) && Number(val) > 0) {
        optionalFilledCount++;
      }
    });

    const missingMandatoryLabels = missingMandatoryKeys.map((key) => {
      const def = MeasurementLibraryService.getDefinitionByKey(key);
      return def ? def.label : key;
    });

    const anomalies = MeasurementValidationService.validateMeasurements(
      measurements,
      garment.gender === 'Femme' || garment.gender === 'Fille' ? 'F' : 'M'
    );

    return {
      isComplete: missingMandatoryKeys.length === 0,
      mandatoryTotal: mandatoryKeys.length,
      mandatoryFilledCount,
      optionalTotal: optionalKeys.length,
      optionalFilledCount,
      missingMandatoryKeys,
      missingMandatoryLabels,
      anomalies
    };
  }

  /**
   * Extrait les mesures filtrées pour un modèle donné (obligatoires + optionnelles)
   */
  public static filterMeasurementsForGarment(
    garment: GarmentDefinition,
    allMeasurements: Record<string, number | string> = {}
  ): Record<string, number | string> {
    const allowedKeys = new Set([
      ...(garment.mandatoryMeasurements || []),
      ...(garment.optionalMeasurements || [])
    ]);

    const filtered: Record<string, number | string> = {};
    Object.entries(allMeasurements).forEach(([k, v]) => {
      if (allowedKeys.has(k) && v !== undefined && v !== null && v !== '') {
        filtered[k] = v;
      }
    });
    return filtered;
  }
}
