/**
 * StockConsumptionService.ts
 * Service d'interaction entre la Commande Couture et le Stock de l'atelier (Tissus & Mercerie).
 * Propose automatiquement les tissus compatibles en stock et gère le décompte des matières.
 */

import { GarmentDefinition } from './GarmentLibraryService';
import { GarmentProfileService } from './GarmentProfileService';

export interface WorkshopFabricItem {
  id: string;
  name: string;
  type?: string;
  category?: string;
  color?: string;
  secondaryColor?: string;
  pattern?: string;
  internalRef?: string;
  colorHex?: string;
  colorTheme?: string;
  quantity: number; // en mètres
  unitPrice?: number;
  costPricePerMeter?: number;
  pricePerMeter?: number;
  image?: string;
  supplier?: string;
}

export interface WorkshopMercerieItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice?: number;
}

export class StockConsumptionService {
  /**
   * Récupère les tissus du stock compatibles avec un modèle sélectionné
   */
  public static getCompatibleFabrics(
    merchantId: string,
    garment: GarmentDefinition
  ): WorkshopFabricItem[] {
    try {
      const saved = localStorage.getItem(`tailleur_tissus_${merchantId}`);
      if (!saved) return [];
      const allFabrics: WorkshopFabricItem[] = JSON.parse(saved);

      const specs = GarmentProfileService.getSewingSpecs(garment);
      const compatibleTypes = specs.compatibleFabricTypes.map((t) => t.toLowerCase());

      const matched = allFabrics.filter((f) => {
        if (f.quantity <= 0) return false;
        const fabricName = (f.name || '').toLowerCase();
        const fabricCategory = (f.category || f.type || '').toLowerCase();

        return compatibleTypes.some(
          (t) => fabricName.includes(t) || fabricCategory.includes(t)
        );
      });

      // Si aucun tissu spécifique trouvé, retourner tous les tissus avec du stock disponible
      if (matched.length === 0) {
        return allFabrics.filter((f) => f.quantity > 0);
      }

      return matched;
    } catch (e) {
      console.error('Erreur chargement tissus compatibles:', e);
      return [];
    }
  }

  /**
   * Récupère tous les articles de mercerie recommandés présents en stock
   */
  public static getRecommendedMercerieItems(
    merchantId: string,
    garment: GarmentDefinition
  ): { item: WorkshopMercerieItem; recommendedQty: number }[] {
    try {
      const saved = localStorage.getItem(`tailleur_mercerie_${merchantId}`);
      if (!saved) return [];
      const allMercerie: WorkshopMercerieItem[] = JSON.parse(saved);

      const specs = GarmentProfileService.getSewingSpecs(garment);
      const recommendedList = specs.recommendedMercerie;

      const result: { item: WorkshopMercerieItem; recommendedQty: number }[] = [];

      recommendedList.forEach((rec) => {
        const matched = allMercerie.find((m) => {
          const mName = (m.name || '').toLowerCase();
          const recName = rec.name.toLowerCase();
          const recCat = rec.category.toLowerCase();
          return mName.includes(recCat) || recName.includes(mName);
        });

        if (matched) {
          result.push({
            item: matched,
            recommendedQty: rec.defaultQty
          });
        }
      });

      return result;
    } catch (e) {
      console.error('Erreur chargement mercerie recommandée:', e);
      return [];
    }
  }

  /**
   * Effectue la déduction du stock de tissu et mercerie pour une commande
   */
  public static processStockDeduction(
    merchantId: string,
    fabricDeduction?: { fabricId: string; metersUsed: number },
    mercerieDeductions?: { mercerieId: string; quantityUsed: number }[]
  ): void {
    // 1. Déduction Tissu
    if (fabricDeduction && fabricDeduction.fabricId && fabricDeduction.metersUsed > 0) {
      try {
        const savedFabrics = localStorage.getItem(`tailleur_tissus_${merchantId}`);
        if (savedFabrics) {
          const fabrics: WorkshopFabricItem[] = JSON.parse(savedFabrics);
          const idx = fabrics.findIndex((f) => f.id === fabricDeduction.fabricId);
          if (idx >= 0) {
            fabrics[idx].quantity = Math.max(0, Number(fabrics[idx].quantity || 0) - fabricDeduction.metersUsed);
            localStorage.setItem(`tailleur_tissus_${merchantId}`, JSON.stringify(fabrics));
          }
        }
      } catch (e) {
        console.error('Erreur déduction tissu:', e);
      }
    }

    // 2. Déduction Mercerie
    if (mercerieDeductions && mercerieDeductions.length > 0) {
      try {
        const savedMercerie = localStorage.getItem(`tailleur_mercerie_${merchantId}`);
        if (savedMercerie) {
          const mercerie: WorkshopMercerieItem[] = JSON.parse(savedMercerie);
          let updated = false;

          mercerieDeductions.forEach((item) => {
            if (item.mercerieId && item.quantityUsed > 0) {
              const idx = mercerie.findIndex((m) => m.id === item.mercerieId);
              if (idx >= 0) {
                mercerie[idx].quantity = Math.max(0, Number(mercerie[idx].quantity || 0) - item.quantityUsed);
                updated = true;
              }
            }
          });

          if (updated) {
            localStorage.setItem(`tailleur_mercerie_${merchantId}`, JSON.stringify(mercerie));
          }
        }
      } catch (e) {
        console.error('Erreur déduction mercerie:', e);
      }
    }
  }
}
