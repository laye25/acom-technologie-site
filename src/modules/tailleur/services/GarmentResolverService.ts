/**
 * GarmentResolverService.ts
 * Service centralisé pour la résolution exacte du vêtement / modèle de confection d'un client.
 * Élimine les valeurs par défaut codées en dur (ex: "Grand Boubou") et garantit la cohérence
 * avec la bibliothèque de vêtements et la base de données.
 */

import { GarmentLibraryService, GarmentDefinition } from './GarmentLibraryService';

export interface ResolvedGarmentInfo {
  garmentId: string;
  garmentName: string;
  category: string;
  gender: 'Homme' | 'Femme' | 'Garçon' | 'Fille' | 'Mixte';
  definition: GarmentDefinition;
  profileId: string;
  profileName: string;
  measurements: Record<string, number | string>;
  filledMeasurementsCount: number;
  totalConfiguredCount: number;
  isCustomSelection: boolean;
}

export class GarmentResolverService {
  public static resolveGarment(
    clientData: any,
    merchantId: string = 'default',
    selectedProfileId?: string
  ): ResolvedGarmentInfo {
    return this.resolveClientGarment(clientData, merchantId, selectedProfileId);
  }

  /**
   * Résout le vêtement d'un client à partir de ses données (garment_id, preferredGarment, garmentProfiles, etc.)
   */
  public static resolveClientGarment(
    clientData: any,
    merchantId: string = 'default',
    selectedProfileId?: string
  ): ResolvedGarmentInfo {
    const allGarments = GarmentLibraryService.getGarments(merchantId);

    // 1. Extraire les profils si existants
    const profiles = Array.isArray(clientData?.garmentProfiles) && clientData.garmentProfiles.length > 0
      ? clientData.garmentProfiles
      : null;

    let activeProfileData: any = null;

    if (profiles) {
      if (selectedProfileId) {
        activeProfileData = profiles.find((p: any) => p.id === selectedProfileId);
      }
      if (!activeProfileData) {
        activeProfileData = profiles.find((p: any) => p.isDefault) || profiles[0];
      }
    }

    // 2. Extraire la référence de vêtement à rechercher
    const targetGarmentId =
      activeProfileData?.garmentId ||
      activeProfileData?.garment_id ||
      clientData?.garmentId ||
      clientData?.garment_id ||
      clientData?.garment;

    const targetGarmentName =
      activeProfileData?.garmentName ||
      activeProfileData?.name ||
      clientData?.garmentName ||
      clientData?.preferredGarment ||
      clientData?.favoriteGarment ||
      clientData?.preferredModel;

    let matchedGarment: GarmentDefinition | undefined;

    // A. Recherche par ID direct
    if (targetGarmentId) {
      matchedGarment = allGarments.find(
        (g) => g.id.toLowerCase() === targetGarmentId.toString().toLowerCase()
      );
    }

    // B. Recherche par Nom
    if (!matchedGarment && targetGarmentName) {
      const lowerName = targetGarmentName.toString().toLowerCase().trim();
      matchedGarment = allGarments.find(
        (g) => g.name.toLowerCase().trim() === lowerName || lowerName.includes(g.name.toLowerCase().trim())
      );
    }

    // C. Résolution contextuelle intelligente basée sur le genre si aucun vêtement n'est encore enregistré
    if (!matchedGarment) {
      const clientGender = clientData?.gender || activeProfileData?.gender;
      if (clientGender === 'F') {
        // Vêtement féminin par défaut si non spécifié
        matchedGarment =
          allGarments.find((g) => g.category === 'Femme' || g.id === 'garment-robe-africaine') ||
          allGarments[0];
      } else {
        // Vêtement masculin par défaut le plus générique si non spécifié
        matchedGarment =
          allGarments.find((g) => g.id === 'garment-ensemble-africain') ||
          allGarments.find((g) => g.id === 'garment-costume-homme') ||
          allGarments[0];
      }
    }

    // 3. Extraire les mesures associées
    const clientMeasurements: Record<string, number | string> =
      activeProfileData?.measurements || clientData?.measurements || {};

    // 4. Calculer le nombre de mesures réelles renseignées
    const filledKeys = Object.keys(clientMeasurements).filter(
      (k) =>
        clientMeasurements[k] !== undefined &&
        clientMeasurements[k] !== null &&
        clientMeasurements[k] !== '' &&
        clientMeasurements[k] !== 0
    );

    // Vérifier quelles mesures réelles correspondent aux mesures obligatoires/optionnelles du vêtement
    const allConfiguredKeys = Array.from(
      new Set([...matchedGarment.mandatoryMeasurements, ...matchedGarment.optionalMeasurements])
    );

    const profileId = activeProfileData?.id || `profile-default-${matchedGarment.id}`;
    const profileName = activeProfileData?.name || matchedGarment.name;

    return {
      garmentId: matchedGarment.id,
      garmentName: matchedGarment.name,
      category: matchedGarment.category,
      gender: matchedGarment.gender,
      definition: matchedGarment,
      profileId,
      profileName,
      measurements: clientMeasurements,
      filledMeasurementsCount: filledKeys.length,
      totalConfiguredCount: allConfiguredKeys.length,
      isCustomSelection: Boolean(targetGarmentId || targetGarmentName)
    };
  }
}
