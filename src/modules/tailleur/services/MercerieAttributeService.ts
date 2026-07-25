// MercerieAttributeService.ts - Attributes, Sizes, Materials, Units & Smart Search
import { MercerieColorLibraryService } from './MercerieColorLibraryService';
import { MercerieCategoryService } from './MercerieCategoryService';

export interface DetailedMercerieItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  color?: string;
  colorHex?: string;
  secondaryColor?: string;
  material?: string;
  size?: string;
  unit?: string;
  quantity: number;
  minQuantity: number;
  purchasePrice: number;
  sellingPrice?: number;
  supplier?: string;
  supplierRef?: string;
  internalRef?: string;
  photo?: string;
  notes?: string;
  lastRestocked?: string;
  syncStatus?: 'pending' | 'synced' | 'error';
  updatedAt?: string;
}

export const COMMON_MATERIALS = [
  'Polyester',
  'Coton',
  'Soie',
  'Nylon',
  'Métal',
  'Bois',
  'Plastique',
  'Laiton',
  'Aluminium',
  'Cuir',
  'Satin',
  'Élastique',
  'Viscose',
  'Acrylique',
  'Nacre',
  'Strass / Cristal',
  'Gomme / Silicone',
  'Organza',
  'Laine',
  'Inox'
];

export const COMMON_UNITS = [
  'Bobine',
  'Pièce',
  'Mètre',
  'Paquet',
  'Boîte',
  'Rouleau',
  'Sachet',
  'Grosses (144 pcs)',
  'Lot',
  'Carton'
];

export const CATEGORY_SIZE_SUGGESTIONS: Record<string, string[]> = {
  'Fils': ['N°40 (Standard)', 'N°60 (Fin)', 'N°80 (Très fin)', 'N°120 (Broderie/Surjet)', '1000 mètres', '5000 mètres'],
  'Boutons': ['10 mm (Chemise)', '12 mm', '15 mm', '18 mm (Veste)', '20 mm', '25 mm (Manteau)', '30 mm (Fantaisie)'],
  'Fermetures Éclair': ['15 cm (Poche/Pantalon)', '20 cm', '40 cm', '50 cm', '60 cm (Robe/Veste)', '80 cm (Manteau)', 'Au mètre'],
  'Élastiques': ['0.5 cm', '1 cm', '2 cm', '3 cm (Ceinture)', '4 cm', '5 cm', '10 cm'],
  'Dentelles': ['1 cm', '2.5 cm', '5 cm', '10 cm', '15 cm', '30 cm', 'Largeur 1.5m'],
  'Rubans': ['0.6 cm', '1 cm', '1.5 cm', '2.5 cm', '4 cm', '5 cm'],
  'Biais': ['15 mm', '20 mm (Standard)', '25 mm', '30 mm'],
  'Passepoils': ['3 mm', '5 mm', '8 mm'],
  'Aiguilles': ['N°70/10 (Fin/Soie)', 'N°80/12 (Standard)', 'N°90/14 (Épais)', 'N°100/16 (Jean/Lourd)', 'N°110/18 (Bazin)'],
  'Épingles': ['30 mm', '38 mm', '45 mm', 'N°1 (Nourrice)', 'N°2 (Nourrice)'],
  'Entoilages': ['Fin (30g)', 'Moyen (50g)', 'Épais (80g)', 'Bucram Rigide'],
  'Pressions': ['8 mm', '10 mm', '12 mm', '15 mm'],
  'Perles': ['2 mm', '4 mm', '6 mm', '8 mm', '10 mm'],
  'Strass': ['SS6 (2mm)', 'SS10 (3mm)', 'SS16 (4mm)', 'SS20 (5mm)', 'SS30 (6.5mm)'],
  'Velcro': ['20 mm', '25 mm', '30 mm', '50 mm'],
  'Boucles': ['20 mm', '25 mm', '30 mm', '40 mm', '50 mm'],
  'Cordons': ['2 mm', '4 mm', '6 mm', '8 mm', '10 mm']
};

export class MercerieAttributeService {
  /**
   * Get common materials list
   */
  public static getMaterials(): string[] {
    return COMMON_MATERIALS;
  }

  /**
   * Get common units list
   */
  public static getUnits(): string[] {
    return COMMON_UNITS;
  }

  /**
   * Get suggested sizes for a given category name
   */
  public static getSizeSuggestions(categoryName?: string): string[] {
    if (!categoryName) return ['15 mm', '20 cm', 'N°40', 'Standard'];
    const key = Object.keys(CATEGORY_SIZE_SUGGESTIONS).find(
      k => k.toLowerCase() === categoryName.trim().toLowerCase()
    );
    if (key) {
      return CATEGORY_SIZE_SUGGESTIONS[key];
    }
    return ['Standard', 'Petit (S)', 'Moyen (M)', 'Grand (L)', 'XL'];
  }

  /**
   * Format item summary label with full details & icon
   * e.g. "🧵 Fil Polyester • 🔵 Bleu Marine • N°40 • Stock: 18 bobines"
   */
  public static formatItemFullLabel(
    item: DetailedMercerieItem,
    merchantId?: string
  ): string {
    const icon = MercerieCategoryService.getCategoryIcon(item.category, merchantId);
    const colorInfo = MercerieColorLibraryService.getColorInfo(item.color);
    
    const parts: string[] = [];
    parts.push(`${icon} ${item.name}`);

    if (item.material) {
      parts.push(item.material);
    }

    if (item.color) {
      parts.push(`${colorInfo.badgeEmoji || '🎨'} ${item.color}`);
    }

    if (item.size) {
      parts.push(item.size);
    }

    const unitStr = item.unit || 'unités';
    parts.push(`Stock: ${item.quantity} ${unitStr}`);

    if (item.internalRef) {
      parts.push(`[${item.internalRef}]`);
    }

    return parts.join(' • ');
  }

  /**
   * Smart Multi-Keyword Search across all item properties
   * Search by name, category, subcategory, color, material, size, supplier, internalRef
   */
  public static smartSearch(
    items: DetailedMercerieItem[],
    query: string,
    categoryFilter: string = 'all'
  ): DetailedMercerieItem[] {
    let list = items;

    // 1. Category Filter
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter(item => item.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    // 2. Query Search
    if (!query || !query.trim()) {
      return list;
    }

    const terms = query.toLowerCase().trim().split(/\s+/);

    return list.filter(item => {
      const searchableText = [
        item.name,
        item.category,
        item.subcategory,
        item.color,
        item.secondaryColor,
        item.material,
        item.size,
        item.unit,
        item.supplier,
        item.supplierRef,
        item.internalRef,
        item.notes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Item must match ALL space-separated search terms
      return terms.every(term => searchableText.includes(term));
    });
  }
}
