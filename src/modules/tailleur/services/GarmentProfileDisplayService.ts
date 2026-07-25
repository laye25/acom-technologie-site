/**
 * GarmentProfileDisplayService.ts
 * Service centralisé pour la gestion et l'affichage dynamique des profils de vêtements
 * et des mensurations associées pour un client de couture (Acom Technologie).
 */

import { GarmentLibraryService, GarmentDefinition } from './GarmentLibraryService';
import { MeasurementDisplayService, MeasurementDisplayProfile } from './MeasurementDisplayService';

export interface ClientGarmentProfileData {
  id: string;
  garmentId: string;
  garmentName: string;
  category: string;
  genderTarget: string;
  measurements: Record<string, number | string>;
  updatedAt?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface GarmentProfileDisplaySummary {
  activeProfile: ClientGarmentProfileData;
  availableProfiles: ClientGarmentProfileData[];
  garmentDefinition: GarmentDefinition;
  displayProfile: MeasurementDisplayProfile;
  categoryBadgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  totalFilledMeasurements: number;
}

export class GarmentProfileDisplayService {
  /**
   * Extrait tous les profils de vêtements d'un client (ou en génère un par défaut à partir des mesures brutes)
   */
  public static getClientProfiles(
    clientData: any,
    merchantId: string = 'default'
  ): ClientGarmentProfileData[] {
    const allGarments = GarmentLibraryService.getGarments(merchantId);

    // Si le client possède un tableau de profils explicite
    if (Array.isArray(clientData?.garmentProfiles) && clientData.garmentProfiles.length > 0) {
      return clientData.garmentProfiles.map((p: any) => {
        const matchingGarment = allGarments.find(
          (g) => g.id === p.garmentId || g.name.toLowerCase() === (p.garmentName || '').toLowerCase()
        ) || allGarments[0];

        return {
          id: p.id || `prof-${matchingGarment.id}`,
          garmentId: matchingGarment.id,
          garmentName: p.garmentName || matchingGarment.name,
          category: matchingGarment.category,
          genderTarget: matchingGarment.gender,
          measurements: p.measurements || clientData?.measurements || {},
          updatedAt: p.updatedAt || clientData?.updatedAt,
          notes: p.notes,
          isDefault: p.isDefault ?? false
        };
      });
    }

    // Sinon, on construit le profil principal basé sur le vêtement préféré ou les mesures enregistrées
    const preferredName = clientData?.preferredGarment || clientData?.favoriteGarment;
    const clientMeasurements = clientData?.measurements || {};

    const computedDisplay = MeasurementDisplayService.getDisplayProfile(
      clientMeasurements,
      merchantId,
      preferredName
    );

    const mainGarment = computedDisplay.garment;

    return [
      {
        id: `profile-main-${mainGarment.id}`,
        garmentId: mainGarment.id,
        garmentName: mainGarment.name,
        category: mainGarment.category,
        genderTarget: mainGarment.gender,
        measurements: clientMeasurements,
        updatedAt: clientData?.updatedAt,
        isDefault: true
      }
    ];
  }

  /**
   * Retourne la couleur du badge visuel selon la catégorie de couture
   */
  public static getCategoryBadgeColor(category: string): { bg: string; text: string; border: string } {
    const lower = category.toLowerCase();

    if (lower.includes('africaine') || lower.includes('boubou') || lower.includes('bazin')) {
      return {
        bg: 'bg-purple-100/80',
        text: 'text-purple-800',
        border: 'border-purple-200'
      };
    }
    if (lower.includes('femme')) {
      return {
        bg: 'bg-rose-100/80',
        text: 'text-rose-800',
        border: 'border-rose-200'
      };
    }
    if (lower.includes('internationale') || lower.includes('costume')) {
      return {
        bg: 'bg-blue-100/80',
        text: 'text-blue-800',
        border: 'border-blue-200'
      };
    }
    if (lower.includes('enfant')) {
      return {
        bg: 'bg-amber-100/80',
        text: 'text-amber-800',
        border: 'border-amber-200'
      };
    }

    return {
      bg: 'bg-emerald-100/80',
      text: 'text-emerald-800',
      border: 'border-emerald-200'
    };
  }

  /**
   * Analyse et synthétise les données d'affichage pour un profil donné
   */
  public static getProfileSummary(
    clientData: any,
    merchantId: string = 'default',
    selectedProfileId?: string
  ): GarmentProfileDisplaySummary {
    const profiles = this.getClientProfiles(clientData, merchantId);

    let activeProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!activeProfile) {
      activeProfile = profiles.find((p) => p.isDefault) || profiles[0];
    }

    const displayProfile = MeasurementDisplayService.getDisplayProfile(
      activeProfile.measurements,
      merchantId,
      activeProfile.garmentName
    );

    const categoryBadgeColor = this.getCategoryBadgeColor(displayProfile.garment.category);

    return {
      activeProfile,
      availableProfiles: profiles,
      garmentDefinition: displayProfile.garment,
      displayProfile,
      categoryBadgeColor,
      totalFilledMeasurements: displayProfile.totalFilledCount
    };
  }
}
