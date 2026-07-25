// MercerieRecommendationService.ts - Smart Recommendations for Tailoring Orders
import { DetailedMercerieItem, MercerieAttributeService } from './MercerieAttributeService';

export interface RecommendedSupplyMatch {
  item: DetailedMercerieItem;
  recommendedQty: number;
  reason: string;
  isAvailable: boolean;
}

export class MercerieRecommendationService {
  /**
   * Recommend supplies for a given garment model or description
   */
  public static getRecommendationsForGarment(
    garmentModel: string = '',
    garmentCategory: string = '',
    fabricColor: string = '',
    availableStock: DetailedMercerieItem[] = []
  ): RecommendedSupplyMatch[] {
    if (!availableStock || availableStock.length === 0) return [];

    const modelLower = (garmentModel + ' ' + garmentCategory).toLowerCase();
    const colorLower = fabricColor.toLowerCase().trim();
    const matches: RecommendedSupplyMatch[] = [];

    // Rule 1: Threads (Fils) matching color or general thread
    const threads = availableStock.filter(i => i.category?.toLowerCase().includes('fil'));
    if (threads.length > 0) {
      // Find color matched thread
      const colorMatch = colorLower ? threads.find(t => t.color && colorLower.includes(t.color.toLowerCase())) : null;
      const selectedThread = colorMatch || threads[0];
      matches.push({
        item: selectedThread,
        recommendedQty: 1,
        reason: colorMatch ? `Fil de couleur assortie (${selectedThread.color})` : 'Fil d\'assemblage principal',
        isAvailable: selectedThread.quantity > 0
      });
    }

    // Rule 2: Zippers (Fermetures) for Dresses, Jackets, Pants
    if (modelLower.includes('robe') || modelLower.includes('veste') || modelLower.includes('pantalon') || modelLower.includes('jupe') || modelLower.includes('tailleur')) {
      const zippers = availableStock.filter(i => i.category?.toLowerCase().includes('fermeture'));
      if (zippers.length > 0) {
        const colorZip = colorLower ? zippers.find(z => z.color && colorLower.includes(z.color.toLowerCase())) : null;
        const chosenZip = colorZip || zippers[0];
        matches.push({
          item: chosenZip,
          recommendedQty: 1,
          reason: `Fermeture Éclair recommandée pour ${garmentCategory || 'vêtement'}`,
          isAvailable: chosenZip.quantity > 0
        });
      }
    }

    // Rule 3: Buttons (Boutons) for Shirts, Jackets, Boubou
    if (modelLower.includes('chemise') || modelLower.includes('veste') || modelLower.includes('boubou') || modelLower.includes('pression')) {
      const buttons = availableStock.filter(i => i.category?.toLowerCase().includes('bouton') || i.category?.toLowerCase().includes('pression'));
      if (buttons.length > 0) {
        const chosenButton = buttons[0];
        const qty = modelLower.includes('chemise') ? 6 : modelLower.includes('veste') ? 4 : 2;
        matches.push({
          item: chosenButton,
          recommendedQty: qty,
          reason: `Boutons pour ${garmentCategory || 'fermeture vêtement'}`,
          isAvailable: chosenButton.quantity >= qty
        });
      }
    }

    // Rule 4: Elastic (Élastiques) for Pants, Skirts, Boubou
    if (modelLower.includes('pantalon') || modelLower.includes('jupe') || modelLower.includes('taille basse')) {
      const elastics = availableStock.filter(i => i.category?.toLowerCase().includes('élastique') || i.category?.toLowerCase().includes('elastique'));
      if (elastics.length > 0) {
        const chosenElastic = elastics[0];
        matches.push({
          item: chosenElastic,
          recommendedQty: 1,
          reason: 'Élastique pour ceinture ajustable',
          isAvailable: chosenElastic.quantity > 0
        });
      }
    }

    // Rule 5: Interfacing / Linings (Entoilages & Doublures)
    if (modelLower.includes('veste') || modelLower.includes('col') || modelLower.includes('manteau') || modelLower.includes('dentelle')) {
      const linings = availableStock.filter(i => i.category?.toLowerCase().includes('entoilage') || i.category?.toLowerCase().includes('doublure'));
      if (linings.length > 0) {
        const chosenLining = linings[0];
        matches.push({
          item: chosenLining,
          recommendedQty: 1,
          reason: 'Entoilage thermocollant ou doublure de maintien',
          isAvailable: chosenLining.quantity > 0
        });
      }
    }

    return matches;
  }
}
