/**
 * MeasurementLibraryService.ts
 * Bibliothèque centralisée des mensurations anatomiques pour la couture sur-mesure.
 * Définit chaque mesure avec ses métadonnées, zones de la silhouette (Homme/Femme),
 * instructions de prise de mesure, bonnes pratiques et erreurs fréquentes.
 */

export type GenderType = 'Homme' | 'Femme' | 'Mixte';

export type MeasurementCategory = 'haut' | 'bas' | 'ensemble' | 'special';

export type AnatomicalZone =
  | 'cou'
  | 'poitrine'
  | 'epaule'
  | 'dos'
  | 'buste'
  | 'bras'
  | 'poignet'
  | 'taille'
  | 'hanches'
  | 'cuisse'
  | 'genou'
  | 'mollet'
  | 'pantalon'
  | 'jupe'
  | 'entrejambe'
  | 'cheville'
  | 'boubou'
  | 'hauteurPoitrine'
  | 'ecartPoitrine'
  | 'longueurRobe'
  | 'longueurVeste'
  | 'broderie';

export interface SilhouetteCoords {
  // Coordonnées SVG relatives (%) pour placer le marqueur / tape
  x: number;
  y: number;
  labelPosition: 'left' | 'right' | 'top' | 'bottom';
  svgPath?: string; // Chemin SVG spécifique pour surbrillance
  tapePath?: string; // Chemin SVG de l'animation du mètre ruban
}

export interface MeasurementDefinition {
  key: string;
  code: string;
  label: string;
  shortLabel: string;
  category: MeasurementCategory;
  gender: GenderType;
  zone: AnatomicalZone;
  unit: string;
  description: string;
  instructions: string[];
  bestPractices: string[];
  commonMistakes: string[];
  minNormalCm: number;
  maxNormalCm: number;
  maleCoords: SilhouetteCoords;
  femaleCoords: SilhouetteCoords;
  iconName?: string;
  popularInAfrica?: boolean;
}

export class MeasurementLibraryService {
  private static readonly MEASUREMENTS: MeasurementDefinition[] = [
    // ------------------- HAUT DU CORPS -------------------
    {
      key: 'cou',
      code: 'COU',
      label: 'Tour de Cou (Col)',
      shortLabel: 'Cou',
      category: 'haut',
      gender: 'Mixte',
      zone: 'cou',
      unit: 'cm',
      description: 'Circonférence de la base du cou au niveau de la pomme d’Adam / creux sternal.',
      instructions: [
        'Enroulez le mètre ruban autour de la base du cou.',
        'Placez un ou deux doigts sous le mètre pour réserver l’aisance.',
        'Vérifiez que le mètre reste bien horizontal à l’arrière.'
      ],
      bestPractices: [
        'Pour un col de chemise fermé, prévoir +1.5 cm d’aisance.',
        'Pour un col d’Abaya ou Boubou, mesurer la ligne naturelle du col.'
      ],
      commonMistakes: [
        'Serrer trop fort le mètre ruban au niveau de la gorge.',
        'Prendre la mesure trop haut vers le menton.'
      ],
      minNormalCm: 28,
      maxNormalCm: 52,
      maleCoords: {
        x: 50,
        y: 18,
        labelPosition: 'right',
        svgPath: 'M 42,17 C 50,20 50,20 58,17',
        tapePath: 'M 40,17 C 50,21 60,17 50,15 Z'
      },
      femaleCoords: {
        x: 50,
        y: 19,
        labelPosition: 'right',
        svgPath: 'M 43,18 C 50,21 50,21 57,18',
        tapePath: 'M 42,18 C 50,22 58,18 50,16 Z'
      },
      popularInAfrica: true
    },
    {
      key: 'poitrine',
      code: 'POI',
      label: 'Tour de Poitrine',
      shortLabel: 'Poitrine',
      category: 'haut',
      gender: 'Mixte',
      zone: 'poitrine',
      unit: 'cm',
      description: 'Circonférence horizontale passant par la pointe des seins / mamelons et sous les aisselles.',
      instructions: [
        'Passez le mètre sous les aisselles.',
        'Faites-le passer sur la pointe du buste / poitrine.',
        'Gardez le mètre bien horizontal dans le dos sans affaissement.'
      ],
      bestPractices: [
        'Demandez au client d’inspirer normalement et non de gonfler la poitrine.',
        'Pour les dames, prendre la mesure avec le soutien-gorge de port quotidien.'
      ],
      commonMistakes: [
        'Mètre qui glisse vers le bas dans le dos.',
        'Client qui retient sa respiration.'
      ],
      minNormalCm: 70,
      maxNormalCm: 160,
      maleCoords: {
        x: 50,
        y: 28,
        labelPosition: 'left',
        svgPath: 'M 32,28 C 50,30 50,30 68,28',
        tapePath: 'M 30,28 C 50,32 70,28 50,25 Z'
      },
      femaleCoords: {
        x: 50,
        y: 29,
        labelPosition: 'left',
        svgPath: 'M 34,29 C 50,32 50,32 66,29',
        tapePath: 'M 32,29 C 50,34 68,29 50,26 Z'
      },
      popularInAfrica: true
    },
    {
      key: 'epaule',
      code: 'EPA',
      label: 'Carrure / Épaule à Épaule',
      shortLabel: 'Carrure',
      category: 'haut',
      gender: 'Mixte',
      zone: 'epaule',
      unit: 'cm',
      description: 'Distance entre la pointe de l’épaule gauche et la pointe de l’épaule droite (acromion à acromion).',
      instructions: [
        'Placez le mètre à la jonction de l’épaule et du bras gauche.',
        'Passez par la base du cou à l’arrière.',
        'Rejoignez la jonction de l’épaule droite.'
      ],
      bestPractices: [
        'Le client doit se tenir droit avec les épaules détendues.',
        'Indispensable pour les vestes, vestes d’agbada et boubous.'
      ],
      commonMistakes: [
        'Mesurer en ligne droite devant au lieu de suivre la courbure du dos.',
        'Mesurer des épaules crispées ou relevées.'
      ],
      minNormalCm: 32,
      maxNormalCm: 65,
      maleCoords: {
        x: 50,
        y: 22,
        labelPosition: 'top',
        svgPath: 'M 28,23 L 72,23',
        tapePath: 'M 28,23 C 50,21 50,21 72,23'
      },
      femaleCoords: {
        x: 50,
        y: 23,
        labelPosition: 'top',
        svgPath: 'M 31,24 L 69,24',
        tapePath: 'M 31,24 C 50,22 50,22 69,24'
      },
      popularInAfrica: true
    },
    {
      key: 'manche',
      code: 'MAN',
      label: 'Longueur de Manche',
      shortLabel: 'Lg Manche',
      category: 'haut',
      gender: 'Mixte',
      zone: 'bras',
      unit: 'cm',
      description: 'Distance de la pointe de l’épaule jusqu’au poignet (ou au coude pour manche courte).',
      instructions: [
        'Partez de la pointe de l’épaule.',
        'Laissez le bras légèrement fléchi.',
        'Descendez le long du bras jusqu’à l’os du poignet.'
      ],
      bestPractices: [
        'Toujours fléchir légèrement le coude pour garantir l’aisance lors des mouvements.',
        'Pour les boubous volants, mesurer bras écarté horizontalement.'
      ],
      commonMistakes: [
        'Tendre le bras trop raide, ce qui donne une manche trop courte au porté.'
      ],
      minNormalCm: 15,
      maxNormalCm: 80,
      maleCoords: {
        x: 25,
        y: 35,
        labelPosition: 'left',
        svgPath: 'M 27,24 L 20,48',
        tapePath: 'M 27,24 L 20,48'
      },
      femaleCoords: {
        x: 27,
        y: 36,
        labelPosition: 'left',
        svgPath: 'M 30,25 L 22,47',
        tapePath: 'M 30,25 L 22,47'
      },
      popularInAfrica: true
    },
    {
      key: 'tourBras',
      code: 'BRA',
      label: 'Tour de Bras (Biceps)',
      shortLabel: 'Tour Bras',
      category: 'haut',
      gender: 'Mixte',
      zone: 'bras',
      unit: 'cm',
      description: 'Circonférence de la partie la plus forte du bras (biceps).',
      instructions: [
        'Enroulez le mètre autour du biceps bras relâché.',
        'Gardez le mètre ajusté sans compresser le muscle.'
      ],
      bestPractices: [
        'Crucial pour les vêtements ajustés et robes sirènes.'
      ],
      commonMistakes: [
        'Faire contracter le biceps sauf si demande spécifique de tenue de sport.'
      ],
      minNormalCm: 20,
      maxNormalCm: 55,
      maleCoords: {
        x: 24,
        y: 32,
        labelPosition: 'left',
        svgPath: 'M 20,31 C 26,33 26,33 28,31'
      },
      femaleCoords: {
        x: 26,
        y: 33,
        labelPosition: 'left',
        svgPath: 'M 23,32 C 28,34 28,34 30,32'
      }
    },
    {
      key: 'poignet',
      code: 'POI_G',
      label: 'Tour de Poignet',
      shortLabel: 'Poignet',
      category: 'haut',
      gender: 'Mixte',
      zone: 'poignet',
      unit: 'cm',
      description: 'Circonférence au niveau de l’os saillant du poignet.',
      instructions: [
        'Enroulez le mètre juste au-dessus de l’articulation du poignet.',
        'Ajouter 1.5 cm d’aisance pour le bouton ou poignet à manchette.'
      ],
      bestPractices: [
        'Ajouter de l’aisance si le poignet doit laisser passer la main sans boutonnière.'
      ],
      commonMistakes: [
        'Oublier de vérifier la largeur de la main si la poignet n’a pas d’ouverture.'
      ],
      minNormalCm: 12,
      maxNormalCm: 30,
      maleCoords: {
        x: 18,
        y: 48,
        labelPosition: 'left'
      },
      femaleCoords: {
        x: 21,
        y: 47,
        labelPosition: 'left'
      }
    },
    {
      key: 'hauteurPoitrine',
      code: 'HAU_POI',
      label: 'Hauteur de Poitrine',
      shortLabel: 'Ht Poitrine',
      category: 'haut',
      gender: 'Femme',
      zone: 'hauteurPoitrine',
      unit: 'cm',
      description: 'Distance de la jonction cou/épaule jusqu’à la pointe du sein.',
      instructions: [
        'Partez du point le plus haut de l’épaule (près du cou).',
        'Descendez verticalement jusqu’à la pointe du sein (téton).'
      ],
      bestPractices: [
        'Détermine l’emplacement exact des pinces de poitrine pour un ajustement parfait.'
      ],
      commonMistakes: [
        'Saisir sans le soutien-gorge définitif de la tenue.'
      ],
      minNormalCm: 20,
      maxNormalCm: 42,
      maleCoords: { x: 42, y: 26, labelPosition: 'left' },
      femaleCoords: {
        x: 43,
        y: 27,
        labelPosition: 'left',
        svgPath: 'M 40,22 L 42,30'
      }
    },
    {
      key: 'ecartPoitrine',
      code: 'ECA_POI',
      label: 'Écart de Poitrine',
      shortLabel: 'Écart Poitrine',
      category: 'haut',
      gender: 'Femme',
      zone: 'ecartPoitrine',
      unit: 'cm',
      description: 'Distance entre les deux pointes de poitrine.',
      instructions: [
        'Mesurez horizontalement de la pointe d’un sein à la pointe de l’autre.'
      ],
      bestPractices: [
        'Détermine l’écartement des pinces verticales et découpes princesses.'
      ],
      commonMistakes: [
        'Mesurer en diagonale ou en s’affaissant.'
      ],
      minNormalCm: 14,
      maxNormalCm: 28,
      maleCoords: { x: 50, y: 28, labelPosition: 'bottom' },
      femaleCoords: {
        x: 50,
        y: 30,
        labelPosition: 'bottom',
        svgPath: 'M 42,30 L 58,30'
      }
    },

    // ------------------- BAS DU CORPS -------------------
    {
      key: 'taille',
      code: 'TAI',
      label: 'Tour de Taille (Ceinture)',
      shortLabel: 'Taille',
      category: 'bas',
      gender: 'Mixte',
      zone: 'taille',
      unit: 'cm',
      description: 'Circonférence au creux naturel de la taille (au-dessus du nombril pour tenue haute, ou au niveau habituel de ceinture).',
      instructions: [
        'Localisez le point le plus étroit du buste (généralement 2 à 3 cm au-dessus du nombril).',
        'Passez le mètre ruban à plat sans comprimer les chairs.'
      ],
      bestPractices: [
        'Pour un pantalon taille basse, mesurer là où le client porte habituellement sa ceinture.',
        'Pour les boubous et jupes traditionnelles (Pagne/Bazin), vérifier la hauteur de nouage.'
      ],
      commonMistakes: [
        'Rentrer le ventre pendant la mesure.',
        'Serrer excessivement le mètre.'
      ],
      minNormalCm: 55,
      maxNormalCm: 160,
      maleCoords: {
        x: 50,
        y: 42,
        labelPosition: 'right',
        svgPath: 'M 35,42 C 50,44 50,44 65,42',
        tapePath: 'M 33,42 C 50,46 67,42 50,39 Z'
      },
      femaleCoords: {
        x: 50,
        y: 41,
        labelPosition: 'right',
        svgPath: 'M 37,41 C 50,43 50,43 63,41',
        tapePath: 'M 35,41 C 50,45 65,41 50,38 Z'
      },
      popularInAfrica: true
    },
    {
      key: 'hanches',
      code: 'HAN',
      label: 'Tour de Hanches',
      shortLabel: 'Hanches',
      category: 'bas',
      gender: 'Mixte',
      zone: 'hanches',
      unit: 'cm',
      description: 'Circonférence au point le plus fort des fesses et des hanches.',
      instructions: [
        'Placez le mètre à l’endroit le plus bombé des fesses.',
        'Maintenez le mètre strictement horizontal tout autour du corps.'
      ],
      bestPractices: [
        'Regardez de profil pour vous assurer d’être sur le point culminant des fesses.',
        'Essentiel pour les jupes dabi, robes fourreaux et pantalons ajustés.'
      ],
      commonMistakes: [
        'Mesurer trop haut sur les os iliaques.',
        'Incliné le mètre vers le bas.'
      ],
      minNormalCm: 70,
      maxNormalCm: 170,
      maleCoords: {
        x: 50,
        y: 50,
        labelPosition: 'left',
        svgPath: 'M 32,50 C 50,52 50,52 68,50',
        tapePath: 'M 30,50 C 50,54 70,50 50,47 Z'
      },
      femaleCoords: {
        x: 50,
        y: 51,
        labelPosition: 'left',
        svgPath: 'M 30,51 C 50,54 50,54 70,51',
        tapePath: 'M 28,51 C 50,55 72,51 50,47 Z'
      },
      popularInAfrica: true
    },
    {
      key: 'cuisse',
      code: 'CUI',
      label: 'Tour de Cuisse',
      shortLabel: 'Cuisse',
      category: 'bas',
      gender: 'Mixte',
      zone: 'cuisse',
      unit: 'cm',
      description: 'Circonférence de la partie la plus forte de la cuisse, juste sous le pli fessier.',
      instructions: [
        'Enroulez le mètre autour de la cuisse au niveau de l’aine.',
        'Le client doit se tenir debout, poids réparti sur les deux pieds.'
      ],
      bestPractices: [
        'Garantit l’aisance d’assise dans les pantalons slim ou sur-mesure.'
      ],
      commonMistakes: [
        'Mesurer jambe fléchie ou en appui sur une seule leg.'
      ],
      minNormalCm: 35,
      maxNormalCm: 90,
      maleCoords: {
        x: 42,
        y: 60,
        labelPosition: 'left',
        svgPath: 'M 35,60 C 44,61 44,61 48,60'
      },
      femaleCoords: {
        x: 42,
        y: 61,
        labelPosition: 'left',
        svgPath: 'M 34,61 C 43,62 43,62 47,61'
      }
    },
    {
      key: 'genou',
      code: 'GEN',
      label: 'Tour de Genou',
      shortLabel: 'Genou',
      category: 'bas',
      gender: 'Mixte',
      zone: 'genou',
      unit: 'cm',
      description: 'Circonférence au niveau de la rotule du genou.',
      instructions: [
        'Enroulez le mètre autour du genou au milieu de la rotule.',
        'Fléchir légèrement pour garantir que le vêtement ne bloque pas le mouvement.'
      ],
      bestPractices: [
        'Très important pour les coupes de pantalons fuselés ou robes sirènes.'
      ],
      commonMistakes: [
        'Serrer trop fort sur un genou raide.'
      ],
      minNormalCm: 25,
      maxNormalCm: 60,
      maleCoords: { x: 42, y: 72, labelPosition: 'left' },
      femaleCoords: { x: 42, y: 72, labelPosition: 'left' }
    },
    {
      key: 'pantalon',
      code: 'PAN',
      label: 'Longueur de Pantalon / Jupe',
      shortLabel: 'Lg Pantalon',
      category: 'bas',
      gender: 'Mixte',
      zone: 'pantalon',
      unit: 'cm',
      description: 'Distance depuis la ceinture (taille) jusqu’à la cheville ou le bas souhaité (sol/talon).',
      instructions: [
        'Fixez le mètre au niveau du haut de la ceinture.',
        'Laissez descendre le mètre le long du flanc extérieur.',
        'Prenez la mesure jusqu’au bas du talon ou du sol selon les chaussures prévues.'
      ],
      bestPractices: [
        'Prendre en compte la hauteur des talons si la cliente porte des chaussures à talons.'
      ],
      commonMistakes: [
        'Se pencher pour lire le mètre (demander à une tierce personne ou utiliser un miroir).'
      ],
      minNormalCm: 40,
      maxNormalCm: 130,
      maleCoords: {
        x: 35,
        y: 68,
        labelPosition: 'left',
        svgPath: 'M 33,44 L 33,92'
      },
      femaleCoords: {
        x: 34,
        y: 68,
        labelPosition: 'left',
        svgPath: 'M 32,43 L 32,92'
      },
      popularInAfrica: true
    },
    {
      key: 'entrejambe',
      code: 'ENT',
      label: 'Longueur Entrejambe',
      shortLabel: 'Entrejambe',
      category: 'bas',
      gender: 'Mixte',
      zone: 'entrejambe',
      unit: 'cm',
      description: 'Distance du haut de l’entrejambe (aine) jusqu’à la cheville/sol le long de la face interne.',
      instructions: [
        'Placez le début du mètre tout en haut à l’intérieur de la cuisse.',
        'Descendez verticalement le long de la jambe jusqu’au bas du pantalon.'
      ],
      bestPractices: [
        'Assure la précision de la hauteur de fourche du pantalon.'
      ],
      commonMistakes: [
        'Confondre entrejambe et hauteur totale du pantalon.'
      ],
      minNormalCm: 50,
      maxNormalCm: 100,
      maleCoords: {
        x: 48,
        y: 72,
        labelPosition: 'right',
        svgPath: 'M 48,56 L 48,92'
      },
      femaleCoords: {
        x: 48,
        y: 72,
        labelPosition: 'right',
        svgPath: 'M 48,56 L 48,92'
      }
    },
    {
      key: 'basPantalon',
      code: 'BAS_PAN',
      label: 'Bas de Pantalon (Ouverture)',
      shortLabel: 'Bas Pantalon',
      category: 'bas',
      gender: 'Mixte',
      zone: 'cheville',
      unit: 'cm',
      description: 'Largeur/Circonférence de l’ourlet du bas de pantalon.',
      instructions: [
        'Entourez la cheville/le coup de pied avec la largeur de bas désirée.'
      ],
      bestPractices: [
        'Vérifier que le pied peut s’enfiler facilement (min 32 cm pour coupe droite).'
      ],
      commonMistakes: [
        'Faire un bas trop étroit qui empêche de passer le talon.'
      ],
      minNormalCm: 22,
      maxNormalCm: 60,
      maleCoords: { x: 38, y: 92, labelPosition: 'bottom' },
      femaleCoords: { x: 38, y: 92, labelPosition: 'bottom' }
    },

    // ------------------- ENSEMBLES & TENUES TRADITIONNELLES AFRIICAINES -------------------
    {
      key: 'boubou',
      code: 'BOU',
      label: 'Longueur Grand Boubou / Kaftan',
      shortLabel: 'Lg Boubou',
      category: 'ensemble',
      gender: 'Mixte',
      zone: 'boubou',
      unit: 'cm',
      description: 'Distance de la base du cou à l’arrière jusqu’au bas des chevilles ou ras du sol.',
      instructions: [
        'Partez de la 7ème vertèbre cervicale (base du cou).',
        'Descendez droit au milieu du dos jusqu’au niveau des chevilles.'
      ],
      bestPractices: [
        'Crucial pour la noblesse de la tombée des Boubous Bazin, 3 pièces, Agbada et Djellabas.'
      ],
      commonMistakes: [
        'Mesurer trop court, ce qui donne un boubou flottant inélégant.'
      ],
      minNormalCm: 80,
      maxNormalCm: 170,
      maleCoords: {
        x: 50,
        y: 55,
        labelPosition: 'top',
        svgPath: 'M 50,18 L 50,94'
      },
      femaleCoords: {
        x: 50,
        y: 55,
        labelPosition: 'top',
        svgPath: 'M 50,19 L 50,94'
      },
      popularInAfrica: true
    },
    {
      key: 'longueurRobe',
      code: 'ROB',
      label: 'Longueur de Robe / Pagne',
      shortLabel: 'Lg Robe',
      category: 'ensemble',
      gender: 'Femme',
      zone: 'longueurRobe',
      unit: 'cm',
      description: 'Distance depuis l’épaule jusqu’au bas de la robe (genou, mi-mollet ou sol).',
      instructions: [
        'Partez de la jonction épaule/cou.',
        'Passez sur la pointe du sein.',
        'Descendez jusqu’à la hauteur désirée.'
      ],
      bestPractices: [
        'Prendre en compte l’ampleur de la jupe/robe et la hauteur de talon.'
      ],
      commonMistakes: [
        'Mesurer sans passer par le galbe de la poitrine, ce qui raccourcit le devant.'
      ],
      minNormalCm: 60,
      maxNormalCm: 175,
      maleCoords: { x: 50, y: 60, labelPosition: 'right' },
      femaleCoords: {
        x: 50,
        y: 60,
        labelPosition: 'right',
        svgPath: 'M 40,22 L 40,94'
      },
      popularInAfrica: true
    },
    {
      key: 'longueurVeste',
      code: 'VES',
      label: 'Longueur de Veste / Chemise',
      shortLabel: 'Lg Veste',
      category: 'haut',
      gender: 'Mixte',
      zone: 'buste',
      unit: 'cm',
      description: 'Distance du col arrière jusqu’au bas de la veste ou liquette.',
      instructions: [
        'Partez de la base du col au milieu du dos.',
        'Descendez verticalement jusqu’à la naissance des fesses ou mi-cuisse.'
      ],
      bestPractices: [
        'Ajuster selon le style (veste classique, safari, veste courte ou costume).'
      ],
      commonMistakes: [
        'Veste trop courte qui dévoile la ceinture lors du mouvement.'
      ],
      minNormalCm: 50,
      maxNormalCm: 110,
      maleCoords: { x: 50, y: 38, labelPosition: 'right' },
      femaleCoords: { x: 50, y: 38, labelPosition: 'right' }
    }
  ];

  public static getAllMeasurements(): MeasurementDefinition[] {
    return this.MEASUREMENTS;
  }

  public static getByKey(key: string): MeasurementDefinition | undefined {
    return this.MEASUREMENTS.find((m) => m.key === key || m.code === key);
  }

  public static getDefinitionByKey(key: string): MeasurementDefinition | undefined {
    return this.getByKey(key);
  }

  public static getDefinition(key: string): MeasurementDefinition | undefined {
    return this.getByKey(key);
  }

  public static getByZone(zone: AnatomicalZone): MeasurementDefinition[] {
    return this.MEASUREMENTS.filter((m) => m.zone === zone);
  }

  public static getByGender(gender: GenderType): MeasurementDefinition[] {
    if (gender === 'Mixte') return this.MEASUREMENTS;
    return this.MEASUREMENTS.filter((m) => m.gender === 'Mixte' || m.gender === gender);
  }
}
