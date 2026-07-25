// MercerieColorLibraryService.ts - Color Library & Palette Management for Mercerie
import { 
  FABRIC_COLOR_PALETTE, 
  FABRIC_COLOR_FAMILIES, 
  FabricColor, 
  findColorInfo 
} from '../data/fabricColors';

export class MercerieColorLibraryService {
  /**
   * Return full color palette
   */
  public static getColorPalette(): FabricColor[] {
    return FABRIC_COLOR_PALETTE;
  }

  /**
   * Return color families
   */
  public static getColorFamilies() {
    return FABRIC_COLOR_FAMILIES;
  }

  /**
   * Find details (hex, emoji, family) for any given color name
   */
  public static getColorInfo(colorName?: string): FabricColor {
    return findColorInfo(colorName);
  }

  /**
   * Filter colors by family keyword
   */
  public static getColorsByFamily(familyId: string): FabricColor[] {
    if (!familyId || familyId === 'all') {
      return FABRIC_COLOR_PALETTE;
    }
    return FABRIC_COLOR_PALETTE.filter(c => c.family === familyId);
  }

  /**
   * Search color by query string
   */
  public static searchColors(query: string): FabricColor[] {
    if (!query || !query.trim()) return FABRIC_COLOR_PALETTE;
    const q = query.trim().toLowerCase();
    return FABRIC_COLOR_PALETTE.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.family.toLowerCase().includes(q)
    );
  }
}
