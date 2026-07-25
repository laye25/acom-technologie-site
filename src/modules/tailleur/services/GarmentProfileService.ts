/**
 * GarmentProfileService.ts
 * Enrichissement métier des profils de vêtements : propositions tarifaires,
 * recommandations de tissus compatibles, mercerie conseillée et finitions types.
 */

import { GarmentDefinition, GarmentLibraryService } from './GarmentLibraryService';

export interface GarmentPricingProposal {
  basePrice: number;
  currency: string;
  recommendedPriceRange: { min: number; max: number };
  estimatedWorkHours: number;
}

export interface GarmentSewingSpecs {
  compatibleFabricTypes: string[]; // e.g. ['Bazin', 'Wax', 'Lin', 'Coton', 'Jean', 'Satin', 'Soie']
  recommendedFabricMeters: number;
  recommendedMercerie: {
    category: 'fermeture' | 'boutons' | 'fil' | 'entoilage' | 'elastique' | 'galon';
    name: string;
    defaultQty: number;
    unit: string;
  }[];
  defaultDescription: string;
  sewingAllowanceCm: string; // e.g. "1.5 - 2.0 cm"
  recommendedEaseCm: string;  // e.g. "4 - 6 cm (Standard Bazin)"
}

export class GarmentProfileService {
  /**
   * Retourne les spécifications de couture et recommandations pour un vêtement
   */
  public static getSewingSpecs(garment: GarmentDefinition): GarmentSewingSpecs {
    const cat = garment.category.toLowerCase();
    const name = garment.name.toLowerCase();

    let compatibleFabricTypes: string[] = ['Bazin', 'Wax', 'Lin', 'Coton'];
    let recommendedMercerie: {
      category: 'fermeture' | 'boutons' | 'fil' | 'entoilage' | 'elastique' | 'galon';
      name: string;
      defaultQty: number;
      unit: string;
    }[] = [
      { category: 'fil', name: 'Fil à coudre assorti (100% Polyester)', defaultQty: 1, unit: 'bobine' },
      { category: 'entoilage', name: 'Entoilage thermocollant col & poignets', defaultQty: 0.5, unit: 'mètre' }
    ];
    let defaultDescription = `${garment.name} confectionné sur-mesure dans l'atelier.`;

    let recommendedFabricMeters = 3.5;
    if (name.includes('boubou') || name.includes('agbada')) {
      recommendedFabricMeters = 6.0;
    } else if (name.includes('robe') || name.includes('kaftan') || name.includes('ensemble')) {
      recommendedFabricMeters = 4.5;
    } else if (name.includes('chemise') || name.includes('pantalon') || name.includes('jupe')) {
      recommendedFabricMeters = 2.5;
    } else if (cat.includes('enfant')) {
      recommendedFabricMeters = 2.0;
    }

    if (cat.includes('africaine') || name.includes('bazin') || name.includes('boubou')) {
      compatibleFabricTypes = ['Bazin', 'Wax', 'Soie', 'Kente', 'Bogolan'];
      recommendedMercerie.push(
        { category: 'fermeture', name: 'Fermeture éclair invisible 50cm', defaultQty: 1, unit: 'pièce' },
        { category: 'boutons', name: 'Boutons décoratifs dorés/argentés', defaultQty: 4, unit: 'pièces' },
        { category: 'galon', name: 'Galon brodé ou fil métallique d\'or', defaultQty: 1, unit: 'rouleau' }
      );
      defaultDescription = `${garment.name} — Broderie poitrine haute précision, Col italien structuré, Manches ajustées d'atelier.`;
    } else if (cat.includes('femme') || name.includes('robe') || name.includes('kaftan')) {
      compatibleFabricTypes = ['Wax', 'Bazin', 'Satin', 'Soie', 'Dentelle', 'Chiffon'];
      recommendedMercerie.push(
        { category: 'fermeture', name: 'Fermeture à glissière dos 60cm', defaultQty: 1, unit: 'pièce' },
        { category: 'boutons', name: 'Boutons-pression ou crochets', defaultQty: 6, unit: 'pièces' }
      );
      defaultDescription = `${garment.name} — Coupe cintrée féminine avec pinces ajustées et finitions d'ourlet invisible.`;
    } else if (cat.includes('internationale') || name.includes('costume') || name.includes('chemise')) {
      compatibleFabricTypes = ['Laine', 'Coton', 'Lin', 'Jean', 'Gabardine', 'Satin'];
      recommendedMercerie.push(
        { category: 'boutons', name: 'Boutons de costume en nacre / résine', defaultQty: 8, unit: 'pièces' },
        { category: 'entoilage', name: 'Epaulières & Plastron tailleur', defaultQty: 1, unit: 'paire' }
      );
      defaultDescription = `${garment.name} — Coupe anglaise/italienne ajustée, col cranté, poignets de précision et doublure satinée.`;
    } else if (cat.includes('enfant')) {
      compatibleFabricTypes = ['Coton', 'Wax', 'Lin', 'Satin'];
      recommendedMercerie.push(
        { category: 'elastique', name: 'Élastique de taille souple', defaultQty: 0.8, unit: 'mètre' }
      );
      defaultDescription = `${garment.name} junior — Coupe confortable et souple adaptée à la mobilité enfantine.`;
    }

    return {
      compatibleFabricTypes,
      recommendedFabricMeters,
      recommendedMercerie,
      defaultDescription,
      sewingAllowanceCm: '1.5 - 2.0 cm',
      recommendedEaseCm: name.includes('bazin') || name.includes('boubou') ? '4 - 6 cm (Aisance Bazin)' : '2 - 4 cm (Standard)'
    };
  }

  /**
   * Propose un tarif de fabrication estimé basé sur le modèle et l'atelier
   */
  public static getSuggestedPricing(garment: GarmentDefinition, currency: string = 'FCFA'): GarmentPricingProposal {
    const name = garment.name.toLowerCase();
    const cat = garment.category.toLowerCase();

    let basePrice = 25000;
    if (name.includes('grand boubou') || name.includes('agbada') || name.includes('costume')) {
      basePrice = 45000;
    } else if (name.includes('bazin') || name.includes('kaftan') || name.includes('robe africaine')) {
      basePrice = 35000;
    } else if (name.includes('chemise') || name.includes('pantalon') || name.includes('jupe')) {
      basePrice = 15000;
    } else if (cat.includes('enfant')) {
      basePrice = 12000;
    }

    return {
      basePrice,
      currency,
      recommendedPriceRange: {
        min: Math.round(basePrice * 0.8),
        max: Math.round(basePrice * 1.5)
      },
      estimatedWorkHours: basePrice > 30000 ? 12 : 6
    };
  }
}
