/**
 * GarmentLibraryService.ts
 * Gestionnaire de la bibliothèque dynamique de vêtements / modèles de couture.
 * Définit les modèles prédéfinis africains et internationaux et permet
 * aux ateliers de créer leurs propres vêtements avec leurs mesures requises.
 */

export type GarmentCategory =
  | 'Couture Africaine'
  | 'Femme'
  | 'Enfant'
  | 'Couture Internationale'
  | 'Boubou'
  | 'Robe'
  | 'Costume'
  | 'Ensemble'
  | 'Haut'
  | 'Bas'
  | 'Traditionnel'
  | 'Sur-Mesure';

export interface GarmentDefinition {
  id: string;
  name: string;
  category: string; // e.g. 'Couture Africaine', 'Femme', 'Enfant', 'Couture Internationale'
  gender: 'Homme' | 'Femme' | 'Garçon' | 'Fille' | 'Mixte';
  description: string;
  mandatoryMeasurements: string[]; // Liste des keys de MeasurementDefinition
  optionalMeasurements: string[];  // Liste des keys de MeasurementDefinition
  icon: string;
  isCustom?: boolean;
  merchantId?: string;
  createdAt?: string;
}

export class GarmentLibraryService {
  private static readonly DEFAULT_GARMENTS: GarmentDefinition[] = [
    // --- COUTURE AFRICAINE ---
    {
      id: 'garment-boubou-grand',
      name: 'Grand Boubou 3 Pièces / Agbada',
      category: 'Couture Africaine',
      gender: 'Homme',
      description: 'Tenue traditionnelle majestueuse comprenant le grand boubou, la sous-chemise/tunique et le pantalon.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'tourBras', 'taille', 'hanches', 'boubou', 'pantalon'],
      optionalMeasurements: ['poignet', 'longueurVeste', 'cuisse', 'basPantalon'],
      icon: '👑'
    },
    {
      id: 'garment-boubou-petit',
      name: 'Petit Boubou / Senegalese Boubou',
      category: 'Couture Africaine',
      gender: 'Homme',
      description: 'Boubou traditionnel mi-long avec col brodé et pantalon assorti.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'boubou', 'taille', 'pantalon'],
      optionalMeasurements: ['tourBras', 'poignet', 'hanches'],
      icon: '🥋'
    },
    {
      id: 'garment-bazin',
      name: 'Ensemble Bazin Riche / Rigide',
      category: 'Couture Africaine',
      gender: 'Mixte',
      description: 'Tenue d’apparat en Bazin Riche damassé avec broderies haute couture.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'taille', 'hanches', 'boubou', 'pantalon'],
      optionalMeasurements: ['tourBras', 'poignet', 'cuisse'],
      icon: '✨'
    },
    {
      id: 'garment-kaftan',
      name: 'Kaftan / Djellaba Homme',
      category: 'Couture Africaine',
      gender: 'Homme',
      description: 'Tunique longue et fluide à manches longues avec finitions galonnées.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'boubou'],
      optionalMeasurements: ['tourBras', 'poignet', 'taille', 'hanches'],
      icon: '🕌'
    },
    {
      id: 'garment-agbada',
      name: 'Agbada Royal West Africa',
      category: 'Couture Africaine',
      gender: 'Homme',
      description: 'Grand manteau fluide cérémonial à large envergure d’épaules.',
      mandatoryMeasurements: ['cou', 'epaule', 'poitrine', 'manche', 'tourBras', 'boubou', 'taille', 'pantalon'],
      optionalMeasurements: ['poignet', 'hanches'],
      icon: '⚜️'
    },
    {
      id: 'garment-dashiki',
      name: 'Dashiki / Tunique Imprimée',
      category: 'Couture Africaine',
      gender: 'Mixte',
      description: 'Haut traditionnel ample à col en V ornamenté de motifs géométriques.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'longueurVeste'],
      optionalMeasurements: ['tourBras', 'taille'],
      icon: '🎽'
    },
    {
      id: 'garment-gandoura',
      name: 'Gandoura Traditionnelle',
      category: 'Couture Africaine',
      gender: 'Homme',
      description: 'Tunique sans manches ou à courtes manches, confortable et aérée.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'boubou'],
      optionalMeasurements: ['taille', 'hanches'],
      icon: '🕊️'
    },
    {
      id: 'garment-tunique-africaine',
      name: 'Tunique / Mande Shirt',
      category: 'Couture Africaine',
      gender: 'Homme',
      description: 'Chemise longue moderne en wax ou bazin avec fermeture Mao.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'longueurVeste', 'taille'],
      optionalMeasurements: ['tourBras', 'poignet'],
      icon: '👔'
    },
    {
      id: 'garment-ensemble-africain',
      name: 'Ensemble Africain 2 Pièces (Chemise & Pantalon)',
      category: 'Couture Africaine',
      gender: 'Homme',
      description: 'Tenue complète assortie moderne et chic.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'longueurVeste', 'taille', 'hanches', 'pantalon', 'entrejambe'],
      optionalMeasurements: ['tourBras', 'cuisse', 'basPantalon'],
      icon: '🧵'
    },

    // --- FEMME ---
    {
      id: 'garment-robe-africaine',
      name: 'Robe Africaine / Robe Bazin',
      category: 'Femme',
      gender: 'Femme',
      description: 'Robe élégante sur-mesure en tissu Wax, Bazin ou Soie avec ou sans broderie.',
      mandatoryMeasurements: ['poitrine', 'epaule', 'taille', 'hanches', 'longueurRobe', 'manche'],
      optionalMeasurements: ['hauteurPoitrine', 'ecartPoitrine', 'tourBras', 'poignet', 'cou'],
      icon: '👗'
    },
    {
      id: 'garment-ensemble-femme',
      name: 'Ensemble Marinière / Taille Basse',
      category: 'Femme',
      gender: 'Femme',
      description: 'Ensemble traditionnel composé d’un haut cintré (marinière) et d’un pagne ou jupe.',
      mandatoryMeasurements: ['poitrine', 'epaule', 'taille', 'hanches', 'longueurRobe', 'hauteurPoitrine', 'ecartPoitrine'],
      optionalMeasurements: ['manche', 'tourBras', 'cou'],
      icon: '✨'
    },
    {
      id: 'garment-jupe-corsage',
      name: 'Jupe & Corsage Sur-Mesure',
      category: 'Femme',
      gender: 'Femme',
      description: 'Deux pièces féminin cintrées avec finitions de dentelle ou volant.',
      mandatoryMeasurements: ['poitrine', 'epaule', 'hauteurPoitrine', 'taille', 'hanches', 'longueurRobe'],
      optionalMeasurements: ['ecartPoitrine', 'manche', 'tourBras'],
      icon: '👒'
    },
    {
      id: 'garment-pagne-cousu',
      name: 'Pagne Cousu / Jupe Dabi',
      category: 'Femme',
      gender: 'Femme',
      description: 'Jupe portefeuille ou tube drapée en pagne Wax authentique.',
      mandatoryMeasurements: ['taille', 'hanches', 'pantalon'],
      optionalMeasurements: ['cuisse'],
      icon: '🎗️'
    },
    {
      id: 'garment-tailleur-dame',
      name: 'Tailleur Dame (Veste & Jupe/Pantalon)',
      category: 'Femme',
      gender: 'Femme',
      description: 'Ensemble professionnel féminin structuré.',
      mandatoryMeasurements: ['poitrine', 'epaule', 'hauteurPoitrine', 'taille', 'hanches', 'longueurVeste', 'pantalon'],
      optionalMeasurements: ['manche', 'ecartPoitrine', 'tourBras', 'cuisse'],
      icon: '💼'
    },
    {
      id: 'garment-kaftan-femme',
      name: 'Kaftan Feminin Haute Couture / Abaya',
      category: 'Femme',
      gender: 'Femme',
      description: 'Robe longue de soirée majestueuse avec strass, perles et broderies.',
      mandatoryMeasurements: ['epaule', 'poitrine', 'hauteurPoitrine', 'taille', 'hanches', 'longueurRobe', 'manche'],
      optionalMeasurements: ['cou', 'tourBras', 'poignet'],
      icon: '💎'
    },

    // --- ENFANT ---
    {
      id: 'garment-enfant-garcon',
      name: 'Tenue Garçon (Mini Boubou / Costume)',
      category: 'Enfant',
      gender: 'Garçon',
      description: 'Petit boubou ou costume adapté à la morphologie junior.',
      mandatoryMeasurements: ['cou', 'poitrine', 'epaule', 'manche', 'taille', 'pantalon'],
      optionalMeasurements: ['boubou', 'tourBras'],
      icon: '👦'
    },
    {
      id: 'garment-enfant-fille',
      name: 'Robe Fille / Robe Cérémonie',
      category: 'Enfant',
      gender: 'Fille',
      description: 'Petite robe de fête en Wax, Satin ou Tulle pour jeune fille.',
      mandatoryMeasurements: ['poitrine', 'epaule', 'taille', 'longueurRobe'],
      optionalMeasurements: ['manche', 'hanches'],
      icon: '👧'
    },

    // --- COUTURE INTERNATIONALE ---
    {
      id: 'garment-costume-homme',
      name: 'Costume Sur-Mesure (Veste & Pantalon)',
      category: 'Couture Internationale',
      gender: 'Homme',
      description: 'Costume d’affaires ou de cérémonie comprenant une veste structurée et un pantalon ajusté.',
      mandatoryMeasurements: ['cou', 'epaule', 'poitrine', 'manche', 'longueurVeste', 'taille', 'hanches', 'pantalon', 'entrejambe'],
      optionalMeasurements: ['tourBras', 'poignet', 'cuisse', 'genou', 'basPantalon'],
      icon: '👔'
    },
    {
      id: 'garment-chemise-homme',
      name: 'Chemise Internationale Sur-Mesure',
      category: 'Couture Internationale',
      gender: 'Mixte',
      description: 'Chemise classique à poignets mousquetaires ou simples.',
      mandatoryMeasurements: ['cou', 'epaule', 'poitrine', 'manche', 'longueurVeste', 'taille'],
      optionalMeasurements: ['tourBras', 'poignet'],
      icon: '👔'
    },
    {
      id: 'garment-pantalon-inter',
      name: 'Pantalon à Pinces / Chino / Tuxedo',
      category: 'Couture Internationale',
      gender: 'Mixte',
      description: 'Pantalon de ville haute précision.',
      mandatoryMeasurements: ['taille', 'hanches', 'pantalon', 'entrejambe', 'cuisse'],
      optionalMeasurements: ['genou', 'basPantalon'],
      icon: '👖'
    },
    {
      id: 'garment-robe-inter',
      name: 'Robe Cocktail / Soirée',
      category: 'Couture Internationale',
      gender: 'Femme',
      description: 'Robe ajustée, fourreau ou patineuse de style international.',
      mandatoryMeasurements: ['poitrine', 'hauteurPoitrine', 'taille', 'hanches', 'longueurRobe'],
      optionalMeasurements: ['epaule', 'manche', 'tourBras'],
      icon: '👠'
    },
    {
      id: 'garment-jupe-inter',
      name: 'Jupe Crayon / Plissée / Évasée',
      category: 'Couture Internationale',
      gender: 'Femme',
      description: 'Jupe ajustée de bureau ou de réception.',
      mandatoryMeasurements: ['taille', 'hanches', 'pantalon'],
      optionalMeasurements: ['cuisse'],
      icon: '👗'
    },
    {
      id: 'garment-blazer',
      name: 'Blazer / Veste Safari / Veste Croisée',
      category: 'Couture Internationale',
      gender: 'Mixte',
      description: 'Veste de tailleur décontractée ou formelle.',
      mandatoryMeasurements: ['epaule', 'poitrine', 'manche', 'longueurVeste', 'taille'],
      optionalMeasurements: ['cou', 'tourBras', 'poignet'],
      icon: '🧥'
    }
  ];

  /**
   * Récupère tous les vêtements (par défaut + créés par l'atelier)
   */
  public static getGarments(merchantId?: string): GarmentDefinition[] {
    if (!merchantId) {
      return this.DEFAULT_GARMENTS;
    }

    try {
      const storageKey = `tailleur_garments_${merchantId}`;
      const saved = localStorage.getItem(storageKey);
      const customGarments: GarmentDefinition[] = saved ? JSON.parse(saved) : [];

      return [...this.DEFAULT_GARMENTS, ...customGarments];
    } catch (e) {
      console.error('Erreur de chargement des vêtements personnalisés:', e);
      return this.DEFAULT_GARMENTS;
    }
  }

  public static getGarmentsForMerchant(merchantId?: string): GarmentDefinition[] {
    return this.getGarments(merchantId);
  }

  /**
   * Ajoute un vêtement personnalisé créé par l'atelier
   */
  public static createCustomGarment(merchantId: string, garmentData: Omit<GarmentDefinition, 'id' | 'isCustom' | 'merchantId' | 'createdAt'>): GarmentDefinition {
    const newGarment: GarmentDefinition = {
      ...garmentData,
      id: `custom-garment-${crypto.randomUUID()}`,
      isCustom: true,
      merchantId,
      createdAt: new Date().toISOString()
    };

    const storageKey = `tailleur_garments_${merchantId}`;
    const existing = this.getCustomGarmentsOnly(merchantId);
    const updated = [newGarment, ...existing];

    localStorage.setItem(storageKey, JSON.stringify(updated));
    return newGarment;
  }

  /**
   * Récupère uniquement les vêtements personnalisés de l'atelier
   */
  public static getCustomGarmentsOnly(merchantId: string): GarmentDefinition[] {
    try {
      const storageKey = `tailleur_garments_${merchantId}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Supprime un vêtement personnalisé
   */
  public static deleteCustomGarment(merchantId: string, garmentId: string): boolean {
    try {
      const storageKey = `tailleur_garments_${merchantId}`;
      const existing = this.getCustomGarmentsOnly(merchantId);
      const filtered = existing.filter((g) => g.id !== garmentId);

      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Recherche un vêtement par son nom ou ID
   */
  public static findGarment(garmentIdOrName: string, merchantId?: string): GarmentDefinition | undefined {
    const list = this.getGarments(merchantId);
    const lower = garmentIdOrName.toLowerCase();

    return list.find((g) => g.id.toLowerCase() === lower || g.name.toLowerCase() === lower);
  }
}
