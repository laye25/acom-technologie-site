// MercerieCategoryService.ts - Dynamic Categories Management for Haberdashery / Mercerie

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cat-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export interface MercerieCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  order: number;
  merchantId?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_MERCERIE_CATEGORIES: Array<Omit<MercerieCategory, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Fils', icon: '🧵', description: 'Fils à coudre, surjeter, broder, coton, polyester, nylon, fil d\'or', isActive: true, order: 1 },
  { name: 'Boutons', icon: '🔘', description: 'Boutons pression, chemise, veste, boubou, fantaisie, nacre, métal', isActive: true, order: 2 },
  { name: 'Fermetures Éclair', icon: '🧷', description: 'Fermetures invisibles, métalliques, séparables, spirale', isActive: true, order: 3 },
  { name: 'Dentelles', icon: '✨', description: 'Dentelles perlées, guipure, élastiques, volant, appliqués', isActive: true, order: 4 },
  { name: 'Élastiques', icon: '〰️', description: 'Élastiques plats, ronds, boutonnières, renforcés', isActive: true, order: 5 },
  { name: 'Rubans', icon: '🎗️', description: 'Rubans satin, gros-grain, velours, organza', isActive: true, order: 6 },
  { name: 'Perles', icon: '🔮', description: 'Perles en verre, bois, rocaille, cristal, synthétiques', isActive: true, order: 7 },
  { name: 'Strass', icon: '⭐', description: 'Strass à thermocoller, à coudre, motifs brillants', isActive: true, order: 8 },
  { name: 'Galons', icon: '🎗️', description: 'Galons dorés, argentés, jacquard, franges', isActive: true, order: 9 },
  { name: 'Entoilages', icon: '📜', description: 'Toile thermocollante, vlieseline, bucram, canevas', isActive: true, order: 10 },
  { name: 'Velcro', icon: '🔗', description: 'Bandes auto-agrippantes à coudre ou adhésives', isActive: true, order: 11 },
  { name: 'Pressions', icon: '🔘', description: 'Boutons pressions métal, plastique, calottes', isActive: true, order: 12 },
  { name: 'Aiguilles', icon: '🪡', description: 'Aiguilles machine, main, broderie, cuir, surjeteuse', isActive: true, order: 13 },
  { name: 'Épingles', icon: '📍', description: 'Épingles tête de verre, à nourrice, pinces couture', isActive: true, order: 14 },
  { name: 'Biais', icon: '🎀', description: 'Biais coton, satin, lin, plié', isActive: true, order: 15 },
  { name: 'Passepoils', icon: '🎗️', description: 'Passepoils satin, skaï, brillant', isActive: true, order: 16 },
  { name: 'Cordons', icon: '🪢', description: 'Cordons tressés, coulissants, embouts', isActive: true, order: 17 },
  { name: 'Boucles', icon: '🔲', description: 'Boucles de ceinture, bretelles, anneaux', isActive: true, order: 18 },
  { name: 'Accessoires de broderie', icon: '✨', description: 'Tambours, ciseaux précision, papier transfert', isActive: true, order: 19 },
  { name: 'Autres', icon: '📦', description: 'Fournitures diverses de couture et finition', isActive: true, order: 20 },
];

export class MercerieCategoryService {
  private static getStorageKey(merchantId?: string): string {
    return `tailleur_mercerie_categories_${merchantId || 'default'}`;
  }

  /**
   * Get all categories for a merchant (including default initialization)
   */
  public static getCategories(merchantId?: string): MercerieCategory[] {
    const key = this.getStorageKey(merchantId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a.order - b.order);
        }
      }
    } catch (e) {
      console.error('Error loading Mercerie categories:', e);
    }

    // Initialize defaults
    const now = new Date().toISOString();
    const initialized: MercerieCategory[] = DEFAULT_MERCERIE_CATEGORIES.map((cat, index) => ({
      ...cat,
      id: `mcat_${index + 1}_${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      merchantId,
      createdAt: now,
      updatedAt: now,
    }));

    this.saveCategories(initialized, merchantId);
    return initialized;
  }

  /**
   * Save all categories
   */
  public static saveCategories(categories: MercerieCategory[], merchantId?: string): void {
    const key = this.getStorageKey(merchantId);
    try {
      localStorage.setItem(key, JSON.stringify(categories));
    } catch (e) {
      console.error('Error saving Mercerie categories:', e);
    }
  }

  /**
   * Get active categories list (names)
   */
  public static getActiveCategoryNames(merchantId?: string): string[] {
    return this.getCategories(merchantId)
      .filter(c => c.isActive)
      .map(c => c.name);
  }

  /**
   * Add a new custom category
   */
  public static addCategory(
    name: string,
    icon: string = '📦',
    description: string = '',
    merchantId?: string
  ): MercerieCategory {
    const categories = this.getCategories(merchantId);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Le nom de la catégorie est obligatoire.');
    }

    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        this.saveCategories(categories, merchantId);
        return existing;
      }
      throw new Error(`La catégorie "${trimmed}" existe déjà.`);
    }

    const now = new Date().toISOString();
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.order || 0), 0);
    const newCategory: MercerieCategory = {
      id: generateId(),
      name: trimmed,
      icon: icon || '📦',
      description,
      isActive: true,
      order: maxOrder + 1,
      merchantId,
      createdAt: now,
      updatedAt: now,
    };

    categories.push(newCategory);
    this.saveCategories(categories, merchantId);
    return newCategory;
  }

  /**
   * Update an existing category
   */
  public static updateCategory(
    id: string,
    updates: Partial<Pick<MercerieCategory, 'name' | 'icon' | 'description' | 'isActive' | 'order'>>,
    merchantId?: string
  ): MercerieCategory {
    const categories = this.getCategories(merchantId);
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Catégorie non trouvée.');
    }

    const category = categories[index];
    if (updates.name && updates.name.trim() !== category.name) {
      const trimmed = updates.name.trim();
      const duplicate = categories.find(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase());
      if (duplicate) {
        throw new Error(`Une autre catégorie porte déjà le nom "${trimmed}".`);
      }
      category.name = trimmed;
    }

    if (updates.icon !== undefined) category.icon = updates.icon;
    if (updates.description !== undefined) category.description = updates.description;
    if (updates.isActive !== undefined) category.isActive = updates.isActive;
    if (updates.order !== undefined) category.order = updates.order;
    category.updatedAt = new Date().toISOString();

    categories[index] = category;
    this.saveCategories(categories, merchantId);
    return category;
  }

  /**
   * Delete a category if not in use
   */
  public static deleteCategory(
    id: string,
    isCategoryInUseFn?: (categoryName: string) => boolean,
    merchantId?: string
  ): void {
    const categories = this.getCategories(merchantId);
    const target = categories.find(c => c.id === id);
    if (!target) return;

    if (isCategoryInUseFn && isCategoryInUseFn(target.name)) {
      throw new Error(`Impossible de supprimer "${target.name}" car des fournitures en stock y sont rattachées. Désactivez-la plutôt.`);
    }

    const filtered = categories.filter(c => c.id !== id);
    this.saveCategories(filtered, merchantId);
  }

  /**
   * Get Category Icon or default
   */
  public static getCategoryIcon(categoryName?: string, merchantId?: string): string {
    if (!categoryName) return '📦';
    const categories = this.getCategories(merchantId);
    const match = categories.find(c => c.name.toLowerCase() === categoryName.trim().toLowerCase());
    return match?.icon || '📦';
  }
}
