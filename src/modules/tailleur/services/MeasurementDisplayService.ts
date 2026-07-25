/**
 * MeasurementDisplayService.ts
 * Service d'analyse et d'organisation dynamique des mensurations client.
 * Élimine toute liste codée en dur dans l'interface et organise les mesures
 * enregistrées selon le profil de vêtement actif (Couture Africaine, Femme, Enfant, etc.).
 */

import { MeasurementLibraryService, MeasurementDefinition } from './MeasurementLibraryService';
import { GarmentLibraryService, GarmentDefinition } from './GarmentLibraryService';

export interface RenderedMeasurementItem {
  key: string;
  code: string;
  label: string;
  shortLabel: string;
  value: number | string;
  unit: string;
  isMandatory: boolean;
  isFilled: boolean;
  definition?: MeasurementDefinition;
}

export interface MeasurementDisplayProfile {
  garment: GarmentDefinition;
  primaryMeasurements: RenderedMeasurementItem[];
  secondaryMeasurements: RenderedMeasurementItem[];
  missingMandatoryMeasurements: RenderedMeasurementItem[];
  totalFilledCount: number;
  totalConfiguredCount: number;
  completionPercentage: number;
}

export class MeasurementDisplayService {
  /**
   * Analyse les mesures enregistrées d'un client et construit un profil d'affichage dynamique.
   */
  public static getDisplayProfile(
    clientMeasurements: Record<string, number | string> = {},
    merchantId: string = 'default',
    preferredGarmentIdOrName?: string
  ): MeasurementDisplayProfile {
    const allGarments = GarmentLibraryService.getGarments(merchantId);
    let selectedGarment: GarmentDefinition | undefined;

    // 1. Recherche du vêtement spécifié (par ID ou nom)
    if (preferredGarmentIdOrName) {
      const lower = preferredGarmentIdOrName.toLowerCase();
      selectedGarment = allGarments.find(
        (g) => g.id.toLowerCase() === lower || g.name.toLowerCase() === lower
      );
    }

    // 2. Détection automatique si non trouvé : trouve le vêtement qui correspond le mieux aux mesures saisies
    if (!selectedGarment) {
      const filledKeys = Object.keys(clientMeasurements).filter(
        (k) => clientMeasurements[k] !== undefined && clientMeasurements[k] !== '' && clientMeasurements[k] !== null
      );

      let bestScore = -1;
      let bestGarment = allGarments[0];

      for (const garment of allGarments) {
        let score = 0;
        garment.mandatoryMeasurements.forEach((mKey) => {
          if (filledKeys.includes(mKey)) score += 2;
        });
        garment.optionalMeasurements.forEach((oKey) => {
          if (filledKeys.includes(oKey)) score += 1;
        });

        if (score > bestScore) {
          bestScore = score;
          bestGarment = garment;
        }
      }

      selectedGarment = bestGarment || allGarments[0];
    }

    // 3. Extraction et tri de toutes les mesures enregistrées
    const mandatorySet = new Set(selectedGarment.mandatoryMeasurements);
    const optionalSet = new Set(selectedGarment.optionalMeasurements);

    const primaryMeasurements: RenderedMeasurementItem[] = [];
    const secondaryMeasurements: RenderedMeasurementItem[] = [];
    const missingMandatoryMeasurements: RenderedMeasurementItem[] = [];

    // Clés présentes dans clientMeasurements
    const recordedKeys = Object.keys(clientMeasurements).filter(
      (k) => clientMeasurements[k] !== undefined && clientMeasurements[k] !== '' && clientMeasurements[k] !== null
    );

    // Traitement des mesures obligatoires du vêtement
    selectedGarment.mandatoryMeasurements.forEach((key) => {
      const def = MeasurementLibraryService.getByKey(key);
      const isFilled = recordedKeys.includes(key);
      const val = isFilled ? clientMeasurements[key] : '—';

      const item: RenderedMeasurementItem = {
        key,
        code: def?.code || key.toUpperCase(),
        label: def?.label || key,
        shortLabel: def?.shortLabel || key,
        value: val,
        unit: def?.unit || 'cm',
        isMandatory: true,
        isFilled,
        definition: def
      };

      if (isFilled) {
        primaryMeasurements.push(item);
      } else {
        missingMandatoryMeasurements.push(item);
      }
    });

    // Traitement de toutes les autres mesures enregistrées pour ce client
    recordedKeys.forEach((key) => {
      // Ignorer si déjà ajoutée dans les mesures principales obligatoires
      if (mandatorySet.has(key)) return;

      const def = MeasurementLibraryService.getByKey(key);
      const isOptional = optionalSet.has(key);

      const item: RenderedMeasurementItem = {
        key,
        code: def?.code || key.toUpperCase(),
        label: def?.label || key,
        shortLabel: def?.shortLabel || key,
        value: clientMeasurements[key],
        unit: def?.unit || 'cm',
        isMandatory: false,
        isFilled: true,
        definition: def
      };

      if (isOptional) {
        primaryMeasurements.push(item);
      } else {
        secondaryMeasurements.push(item);
      }
    });

    const totalFilledCount = recordedKeys.length;
    const totalConfiguredCount = selectedGarment.mandatoryMeasurements.length;
    const completionPercentage = totalConfiguredCount > 0
      ? Math.min(100, Math.round((primaryMeasurements.filter(m => m.isFilled).length / totalConfiguredCount) * 100))
      : 0;

    return {
      garment: selectedGarment,
      primaryMeasurements,
      secondaryMeasurements,
      missingMandatoryMeasurements,
      totalFilledCount,
      totalConfiguredCount,
      completionPercentage
    };
  }
}
