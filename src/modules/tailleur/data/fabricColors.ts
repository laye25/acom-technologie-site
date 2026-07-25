// Comprehensive Textile Color Palette & Fabric Pattern Library for Tailleur/Couture
export interface FabricColor {
  id: string;
  name: string;
  family: string;
  hex: string;
  badgeEmoji: string;
  isAfricanCouture?: boolean;
}

export interface FabricPattern {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export const FABRIC_PATTERNS: FabricPattern[] = [
  { id: 'uni', name: 'Uni', icon: '🎨', description: 'Tissu de couleur unie sans motif' },
  { id: 'fleuri', name: 'Fleuri', icon: '🌸', description: 'Motifs floraux' },
  { id: 'geometrique', name: 'Géométrique', icon: '📐', description: 'Formes géométriques, losanges, lignes' },
  { id: 'raye', name: 'Rayé', icon: '📏', description: 'Rayures verticales ou horizontales' },
  { id: 'carreaux', name: 'Carreaux', icon: '🏁', description: 'Motifs à carreaux ou vichy' },
  { id: 'brode', name: 'Brodé', icon: '🪡', description: 'Motifs en broderie ou fil en relief' },
  { id: 'imprime', name: 'Imprimé', icon: '🖼️', description: 'Motifs imprimés' },
  { id: 'traditionnel', name: 'Traditionnel', icon: '👑', description: 'Symboles et motifs traditionnels' },
  { id: 'bogolan', name: 'Bogolan', icon: '📜', description: 'Motifs traditionnels en terre/bogolan' },
  { id: 'tie_dye', name: 'Tie & Dye (Thioup)', icon: '🌀', description: 'Teinture artisanale Thioup / Tie & Dye' },
  { id: 'kente', name: 'Kente', icon: '👑', description: 'Motifs géométriques Kente' },
  { id: 'wax_hollandais', name: 'Wax Hollandais', icon: '🏷️', description: 'Wax authentique imprimé' },
  { id: 'wax_africain', name: 'Wax Africain', icon: '🌍', description: 'Motifs Wax colorés' },
  { id: 'dentelle', name: 'Dentelle', icon: '✨', description: 'Tissu ajouré à motifs' },
  { id: 'paillete', name: 'Pailleté / Strass', icon: '⭐', description: 'Effet brillant avec strass ou paillettes' },
  { id: 'satine', name: 'Satiné / Brillant', icon: '💎', description: 'Fini satiné ou brillant' },
  { id: 'jacquard', name: 'Jacquard', icon: '🧵', description: 'Motifs tissés en relief' },
];

export const FABRIC_COLOR_FAMILIES = [
  { id: 'all', name: 'Toutes les familles' },
  { id: 'blancs', name: '⚪ Blancs & Crèmes' },
  { id: 'noirs', name: '⚫ Noirs & Gris' },
  { id: 'bleus', name: '🔵 Bleus' },
  { id: 'verts', name: '🟢 Verts' },
  { id: 'rouges', name: '🔴 Rouges & Bordeaux' },
  { id: 'jaunes', name: '🟡 Jaunes & Dorés' },
  { id: 'oranges', name: '🟠 Oranges' },
  { id: 'violets', name: '🟣 Violets & Prunes' },
  { id: 'roses', name: '🩷 Roses' },
  { id: 'marrons', name: '🤎 Marrons & Terre' },
  { id: 'africains', name: '🌍 Couture Africaine (Bazin/Wax)' },
  { id: 'metalliques', name: '🟨 Métalliques (Or, Argent)' },
];

export const FABRIC_COLOR_PALETTE: FabricColor[] = [
  // ⚪ Blancs & Crèmes
  { id: 'blanc_pur', name: 'Blanc Pur', family: 'blancs', hex: '#FFFFFF', badgeEmoji: '⚪' },
  { id: 'blanc_casse', name: 'Blanc Cassé', family: 'blancs', hex: '#F8F9FA', badgeEmoji: '⚪' },
  { id: 'ivoire', name: 'Ivoire', family: 'blancs', hex: '#FFFFF0', badgeEmoji: '⚪' },
  { id: 'creme', name: 'Crème', family: 'blancs', hex: '#FFFDD0', badgeEmoji: '⚪' },
  { id: 'beige_clair', name: 'Beige Clair', family: 'blancs', hex: '#F5F5DC', badgeEmoji: '⚪' },
  { id: 'perle', name: 'Perle', family: 'blancs', hex: '#E5E4E2', badgeEmoji: '⚪' },
  { id: 'lin_naturel', name: 'Lin Naturel', family: 'blancs', hex: '#FAF0E6', badgeEmoji: '⚪' },

  // ⚫ Noirs & Gris
  { id: 'noir_intense', name: 'Noir Intense', family: 'noirs', hex: '#000000', badgeEmoji: '⬛' },
  { id: 'noir_satin', name: 'Noir Satin', family: 'noirs', hex: '#1A1A1A', badgeEmoji: '⬛' },
  { id: 'noir_mat', name: 'Noir Mat', family: 'noirs', hex: '#2B2B2B', badgeEmoji: '⬛' },
  { id: 'anthracite', name: 'Anthracite', family: 'noirs', hex: '#383838', badgeEmoji: '🔘' },
  { id: 'gris_fonce', name: 'Gris Foncé', family: 'noirs', hex: '#5A5A5A', badgeEmoji: '🔘' },
  { id: 'gris_clair', name: 'Gris Clair', family: 'noirs', hex: '#D3D3D3', badgeEmoji: '⚪' },
  { id: 'argent', name: 'Argent', family: 'noirs', hex: '#C0C0C0', badgeEmoji: '⚪' },

  // 🔵 Bleus
  { id: 'bleu_marine', name: 'Bleu Marine', family: 'bleus', hex: '#000080', badgeEmoji: '🔵' },
  { id: 'bleu_roi', name: 'Bleu Roi', family: 'bleus', hex: '#4169E1', badgeEmoji: '🔵' },
  { id: 'bleu_ciel', name: 'Bleu Ciel', family: 'bleus', hex: '#87CEEB', badgeEmoji: '🔷' },
  { id: 'bleu_indigo', name: 'Bleu Indigo', family: 'bleus', hex: '#4B0082', badgeEmoji: '🔵' },
  { id: 'bleu_electrique', name: 'Bleu Électrique', family: 'bleus', hex: '#007FFF', badgeEmoji: '🔷' },
  { id: 'bleu_petrole', name: 'Bleu Pétrole', family: 'bleus', hex: '#1D4E89', badgeEmoji: '🔵' },
  { id: 'bleu_turquoise', name: 'Bleu Turquoise', family: 'bleus', hex: '#40E0D0', badgeEmoji: '🌐' },
  { id: 'bleu_canard', name: 'Bleu Canard', family: 'bleus', hex: '#004851', badgeEmoji: '🔵' },
  { id: 'bleu_nuit', name: 'Bleu Nuit', family: 'bleus', hex: '#191970', badgeEmoji: '🔵' },
  { id: 'bleu_jean', name: 'Bleu Jean', family: 'bleus', hex: '#2B547E', badgeEmoji: '🔵' },

  // 🟢 Verts
  { id: 'vert_emeraude', name: 'Vert Émeraude', family: 'verts', hex: '#50C878', badgeEmoji: '🟢' },
  { id: 'vert_olive', name: 'Vert Olive', family: 'verts', hex: '#808000', badgeEmoji: '🟢' },
  { id: 'vert_militaire', name: 'Vert Militaire', family: 'verts', hex: '#4B5320', badgeEmoji: '🟢' },
  { id: 'vert_sapin', name: 'Vert Sapin', family: 'verts', hex: '#0F52BA', badgeEmoji: '🟢' },
  { id: 'vert_menthe', name: 'Vert Menthe', family: 'verts', hex: '#98FF98', badgeEmoji: '🟢' },
  { id: 'vert_pistache', name: 'Vert Pistache', family: 'verts', hex: '#93C572', badgeEmoji: '🟢' },
  { id: 'vert_anis', name: 'Vert Anis', family: 'verts', hex: '#84DE02', badgeEmoji: '🟢' },
  { id: 'vert_jade', name: 'Vert Jade', family: 'verts', hex: '#00A86B', badgeEmoji: '🟢' },
  { id: 'vert_kaki', name: 'Vert Kaki', family: 'verts', hex: '#C3B091', badgeEmoji: '🟢' },

  // 🔴 Rouges
  { id: 'rouge_bordeaux', name: 'Rouge Bordeaux', family: 'rouges', hex: '#800020', badgeEmoji: '🔴' },
  { id: 'rouge_cerise', name: 'Rouge Cerise', family: 'rouges', hex: '#DE3163', badgeEmoji: '🔴' },
  { id: 'rouge_rubis', name: 'Rouge Rubis', family: 'rouges', hex: '#E0115F', badgeEmoji: '🔴' },
  { id: 'rouge_carmin', name: 'Rouge Carmin', family: 'rouges', hex: '#960018', badgeEmoji: '🔴' },
  { id: 'rouge_grenat', name: 'Rouge Grenat', family: 'rouges', hex: '#78184A', badgeEmoji: '🔴' },
  { id: 'rouge_vin', name: 'Rouge Vin', family: 'rouges', hex: '#722F37', badgeEmoji: '🔴' },
  { id: 'rouge_brique', name: 'Rouge Brique', family: 'rouges', hex: '#B22222', badgeEmoji: '🧱' },
  { id: 'rouge_corail', name: 'Rouge Corail', family: 'rouges', hex: '#FF7F50', badgeEmoji: '🔴' },

  // 🟡 Jaunes & Dorés
  { id: 'jaune_or', name: 'Jaune Or', family: 'jaunes', hex: '#FFD700', badgeEmoji: '🟡' },
  { id: 'jaune_moutarde', name: 'Jaune Moutarde', family: 'jaunes', hex: '#FFDB58', badgeEmoji: '🟡' },
  { id: 'jaune_citron', name: 'Jaune Citron', family: 'jaunes', hex: '#FFF700', badgeEmoji: '🍋' },
  { id: 'jaune_safran', name: 'Jaune Safran', family: 'jaunes', hex: '#F4C430', badgeEmoji: '🟡' },
  { id: 'jaune_soleil', name: 'Jaune Soleil', family: 'jaunes', hex: '#FFD800', badgeEmoji: '☀️' },
  { id: 'jaune_paille', name: 'Jaune Paille', family: 'jaunes', hex: '#EAE0C8', badgeEmoji: '🟡' },
  { id: 'or_clair', name: 'Or Clair', family: 'jaunes', hex: '#F7E7CE', badgeEmoji: '🟨' },
  { id: 'or_jaune', name: 'Or Jaune', family: 'jaunes', hex: '#E6CA65', badgeEmoji: '🟨' },
  { id: 'or_rose', name: 'Or Rose', family: 'jaunes', hex: '#B76E79', badgeEmoji: '🟨' },
  { id: 'champagne', name: 'Champagne', family: 'jaunes', hex: '#F7E7CE', badgeEmoji: '🥂' },

  // 🟠 Oranges
  { id: 'orange_brule', name: 'Orange Brûlé', family: 'oranges', hex: '#CC5500', badgeEmoji: '🟠' },
  { id: 'orange_mandarine', name: 'Orange Mandarine', family: 'oranges', hex: '#FF8200', badgeEmoji: '🍊' },
  { id: 'orange_cuivre', name: 'Orange Cuivre', family: 'oranges', hex: '#B87333', badgeEmoji: '🟠' },
  { id: 'orange_corail', name: 'Orange Corail', family: 'oranges', hex: '#FF7F50', badgeEmoji: '🟠' },

  // 🟣 Violets
  { id: 'violet_royal', name: 'Violet Royal', family: 'violets', hex: '#7851A9', badgeEmoji: '🟣' },
  { id: 'violet_prune', name: 'Violet Prune', family: 'violets', hex: '#701C45', badgeEmoji: '🟣' },
  { id: 'violet_aubergine', name: 'Violet Aubergine', family: 'violets', hex: '#3B0910', badgeEmoji: '🍆' },
  { id: 'lavande', name: 'Lavande', family: 'violets', hex: '#E6E6FA', badgeEmoji: '🪻' },
  { id: 'lilas', name: 'Lilas', family: 'violets', hex: '#C8A2C8', badgeEmoji: '🟣' },
  { id: 'mauve', name: 'Mauve', family: 'violets', hex: '#E0B0FF', badgeEmoji: '🟣' },

  // 🩷 Roses
  { id: 'rose_fuchsia', name: 'Rose Fuchsia', family: 'roses', hex: '#FF007F', badgeEmoji: '🩷' },
  { id: 'rose_poudre', name: 'Rose Poudré', family: 'roses', hex: '#FFD1DC', badgeEmoji: '🩷' },
  { id: 'rose_gold', name: 'Rose Gold', family: 'roses', hex: '#B76E79', badgeEmoji: '🩷' },
  { id: 'rose_saumon', name: 'Rose Saumon', family: 'roses', hex: '#FA8072', badgeEmoji: '🩷' },
  { id: 'rose_bonbon', name: 'Rose Bonbon', family: 'roses', hex: '#FF69B4', badgeEmoji: '🩷' },

  // 🤎 Marrons & Terre
  { id: 'chocolat', name: 'Chocolat', family: 'marrons', hex: '#7B3F00', badgeEmoji: '🤎' },
  { id: 'cafe', name: 'Café', family: 'marrons', hex: '#4B3621', badgeEmoji: '☕' },
  { id: 'camel', name: 'Camel', family: 'marrons', hex: '#C19A6B', badgeEmoji: '🐪' },
  { id: 'cognac', name: 'Cognac', family: 'marrons', hex: '#9A463D', badgeEmoji: '🤎' },
  { id: 'tabac', name: 'Tabac', family: 'marrons', hex: '#715037', badgeEmoji: '🤎' },
  { id: 'terre', name: 'Terre / Argile', family: 'marrons', hex: '#A0522D', badgeEmoji: '🪴' },
  { id: 'bronze', name: 'Bronze', family: 'marrons', hex: '#CD7F32', badgeEmoji: '🥉' },

  // 🌍 Couture Africaine (Bazin, Wax, Thioup, etc.)
  { id: 'bazin_blanc', name: 'Bazin Blanc VIP', family: 'africains', hex: '#FAFAFA', badgeEmoji: '⚪', isAfricanCouture: true },
  { id: 'bazin_bleu_roi', name: 'Bazin Bleu Roi', family: 'africains', hex: '#002366', badgeEmoji: '🔵', isAfricanCouture: true },
  { id: 'bazin_bordeaux', name: 'Bazin Bordeaux', family: 'africains', hex: '#4A0E17', badgeEmoji: '🔴', isAfricanCouture: true },
  { id: 'bazin_emeraude', name: 'Bazin Émeraude', family: 'africains', hex: '#005A36', badgeEmoji: '🟢', isAfricanCouture: true },
  { id: 'bazin_dore', name: 'Bazin Doré / Champagne', family: 'africains', hex: '#DAA520', badgeEmoji: '🟡', isAfricanCouture: true },
  { id: 'bazin_violet', name: 'Bazin Violet Impérial', family: 'africains', hex: '#4B0082', badgeEmoji: '🟣', isAfricanCouture: true },
  { id: 'bazin_prune', name: 'Bazin Prune', family: 'africains', hex: '#58111A', badgeEmoji: '🟣', isAfricanCouture: true },
  { id: 'bazin_turquoise', name: 'Bazin Turquoise', family: 'africains', hex: '#00CED1', badgeEmoji: '🌐', isAfricanCouture: true },
  { id: 'bazin_kaki', name: 'Bazin Kaki', family: 'africains', hex: '#556B2F', badgeEmoji: '🟢', isAfricanCouture: true },
  { id: 'bazin_orange', name: 'Bazin Orange Mandarine', family: 'africains', hex: '#FF7F00', badgeEmoji: '🟠', isAfricanCouture: true },
  { id: 'bazin_rose', name: 'Bazin Rose Bonbon', family: 'africains', hex: '#FF1493', badgeEmoji: '🩷', isAfricanCouture: true },
  { id: 'bazin_jaune', name: 'Bazin Jaune Safran', family: 'africains', hex: '#FFC800', badgeEmoji: '🟡', isAfricanCouture: true },
  { id: 'bazin_noir', name: 'Bazin Noir Ébène', family: 'africains', hex: '#121212', badgeEmoji: '⬛', isAfricanCouture: true },
  { id: 'bazin_argent', name: 'Bazin Argent', family: 'africains', hex: '#E0E0E0', badgeEmoji: '⚪', isAfricanCouture: true },
  { id: 'wax_multicolore', name: 'Wax Multicolore', family: 'africains', hex: '#FF5722', badgeEmoji: '🎨', isAfricanCouture: true },
  { id: 'wax_bleu_dominant', name: 'Wax Bleu Dominant', family: 'africains', hex: '#1976D2', badgeEmoji: '🔵', isAfricanCouture: true },
  { id: 'wax_rouge_dominant', name: 'Wax Rouge Dominant', family: 'africains', hex: '#D32F2F', badgeEmoji: '🔴', isAfricanCouture: true },
  { id: 'wax_jaune_dominant', name: 'Wax Jaune Dominant', family: 'africains', hex: '#FBC02D', badgeEmoji: '🟡', isAfricanCouture: true },
  { id: 'wax_vert_dominant', name: 'Wax Vert Dominant', family: 'africains', hex: '#388E3C', badgeEmoji: '🟢', isAfricanCouture: true },

  // 🟨 Métalliques
  { id: 'or_pure', name: 'Or Métallique', family: 'metalliques', hex: '#D4AF37', badgeEmoji: '🟨' },
  { id: 'argent_metallique', name: 'Argent Métallique', family: 'metalliques', hex: '#E5E4E2', badgeEmoji: '⚪' },
  { id: 'cuivre_metallique', name: 'Cuivre Métallique', family: 'metalliques', hex: '#B87333', badgeEmoji: '🟠' },
];

/**
 * Finds color details matching a name or returns sensible defaults.
 */
export const findColorInfo = (colorName?: string): FabricColor => {
  if (!colorName) {
    return { id: 'custom', name: 'Non spécifiée', family: 'all', hex: '#64748B', badgeEmoji: '🎨' };
  }
  const clean = colorName.trim().toLowerCase();
  const match = FABRIC_COLOR_PALETTE.find(c => 
    c.name.toLowerCase() === clean || 
    clean.includes(c.name.toLowerCase()) || 
    c.name.toLowerCase().includes(clean)
  );
  if (match) return match;

  // Fallback heuristics
  if (clean.includes('bleu')) return { id: 'c_blue', name: colorName, family: 'bleus', hex: '#1D4E89', badgeEmoji: '🔵' };
  if (clean.includes('vert')) return { id: 'c_green', name: colorName, family: 'verts', hex: '#00A86B', badgeEmoji: '🟢' };
  if (clean.includes('rouge') || clean.includes('bordeaux')) return { id: 'c_red', name: colorName, family: 'rouges', hex: '#800020', badgeEmoji: '🔴' };
  if (clean.includes('jaune') || clean.includes('or')) return { id: 'c_yellow', name: colorName, family: 'jaunes', hex: '#FFD700', badgeEmoji: '🟡' };
  if (clean.includes('blanc')) return { id: 'c_white', name: colorName, family: 'blancs', hex: '#FFFFFF', badgeEmoji: '⚪' };
  if (clean.includes('noir')) return { id: 'c_black', name: colorName, family: 'noirs', hex: '#000000', badgeEmoji: '⬛' };
  if (clean.includes('violet') || clean.includes('prune')) return { id: 'c_purple', name: colorName, family: 'violets', hex: '#4B0082', badgeEmoji: '🟣' };
  if (clean.includes('rose')) return { id: 'c_pink', name: colorName, family: 'roses', hex: '#FF69B4', badgeEmoji: '🩷' };

  return { id: 'custom', name: colorName, family: 'all', hex: '#8B5CF6', badgeEmoji: '🎨' };
};

/**
 * Formats a fabric item for full clarity in dropdowns and cards
 * e.g. "Bazin Getzner • Bleu Marine • Imprimé • 11 m dispo"
 */
export const formatFabricFullLabel = (tissu: {
  name: string;
  color?: string;
  pattern?: string;
  quantity: number;
  category?: string;
  internalRef?: string;
}): string => {
  const colorPart = tissu.color ? ` • ${tissu.color}` : '';
  const patternPart = tissu.pattern && tissu.pattern !== 'Uni' ? ` (${tissu.pattern})` : '';
  const refPart = tissu.internalRef ? ` [Ref: ${tissu.internalRef}]` : '';
  return `${tissu.name}${colorPart}${patternPart}${refPart} • ${tissu.quantity} m dispo`;
};
