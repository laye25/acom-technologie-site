import { EmbroideryPoint } from './embroideryServices';

export interface GoldenMotif {
  name: string;
  description: string;
  difficulty: 'Low' | 'Medium' | 'High' | 'Extreme';
  type: 'Topology' | 'Geometry' | 'Ribbon' | 'Mixed';
  contours: EmbroideryPoint[][];
}

export const GoldenDataset: GoldenMotif[] = [
  {
    name: 'Motif A - Glyphe de Lettre A',
    description: 'Teste la détection de trous, de winding numbers complexes et de géométrie angulaire.',
    difficulty: 'Medium',
    type: 'Topology',
    contours: [
      // Outer Contour of "A"
      [
        { x: -50, y: -50 },
        { x: -10, y: -50 },
        { x: 30, y: 50 },
        { x: 10, y: 50 },
        { x: 0, y: 15 },
        { x: -20, y: 15 },
        { x: -30, y: 50 },
        { x: -50, y: 50 }
      ],
      // Inner Hole (The triangle inside the "A")
      [
        { x: -15, y: 0 },
        { x: -5, y: -30 },
        { x: -5, y: 0 }
      ]
    ]
  },
  {
    name: 'Motif B - Dentelle Africaine',
    description: 'Courbes complexes avec du bruit et de haute fréquence pour tester le lissage de spline et RDP.',
    difficulty: 'High',
    type: 'Geometry',
    contours: [
      // Double spiral with noise
      Array.from({ length: 60 }, (_, i) => {
        const theta = (i / 59) * Math.PI * 4;
        const r = 10 + theta * 8;
        const noiseX = (Math.sin(theta * 10) * 0.4);
        const noiseY = (Math.cos(theta * 10) * 0.4);
        return {
          x: r * Math.cos(theta) + noiseX,
          y: r * Math.sin(theta) + noiseY
        };
      })
    ]
  },
  {
    name: 'Motif C - Ruban Satin Courbe',
    description: 'Ruban sinusoïdal d\'épaisseur variable pour tester l\'Axe Médian, les rails et le solveur d\'angle.',
    difficulty: 'Extreme',
    type: 'Ribbon',
    contours: [
      // Generates a contour resembling a variable thickness serpentine ribbon
      [
        { x: -80, y: -20 },
        { x: -60, y: -10 },
        { x: -40, y: -25 },
        { x: -20, y: -5 },
        { x: 0, y: -30 },
        { x: 20, y: -10 },
        { x: 40, y: -25 },
        { x: 60, y: -5 },
        { x: 80, y: -30 },
        // End cap
        { x: 82, y: -10 },
        { x: 78, y: 10 },
        // Return rail with variable offset
        { x: 60, y: 15 },
        { x: 40, y: -5 },
        { x: 20, y: 10 },
        { x: 0, y: -10 },
        { x: -20, y: 15 },
        { x: -40, y: -5 },
        { x: -60, y: 10 },
        { x: -80, y: -5 },
        // Start cap
        { x: -82, y: -15 }
      ]
    ]
  },
  {
    name: 'Motif D - Emblème National Multicouche',
    description: '3 contours extérieurs, 2 trous et un îlot imbriqué. Teste l\'isomorphisme d\'arbre topologique complet.',
    difficulty: 'Extreme',
    type: 'Mixed',
    contours: [
      // Level 0: Outer boundary 1
      [
        { x: -90, y: -90 },
        { x: 90, y: -90 },
        { x: 90, y: 90 },
        { x: -90, y: 90 }
      ],
      // Level 1: Hole 1 inside Boundary 1
      [
        { x: -70, y: -70 },
        { x: -10, y: -70 },
        { x: -10, y: -10 },
        { x: -70, y: -10 }
      ],
      // Level 1: Hole 2 inside Boundary 1
      [
        { x: 10, y: -70 },
        { x: 70, y: -70 },
        { x: 70, y: -10 },
        { x: 10, y: -10 }
      ],
      // Level 2: Island inside Hole 1 (outer component relative to hole)
      [
        { x: -50, y: -50 },
        { x: -30, y: -50 },
        { x: -30, y: -30 },
        { x: -50, y: -30 }
      ],
      // Level 3: Tiny sub-hole inside the island!
      [
        { x: -42, y: -42 },
        { x: -38, y: -42 },
        { x: -38, y: -38 },
        { x: -42, y: -38 }
      ]
    ]
  },

  {
    name: 'Motif E - Deux régions qui se touchent',
    description: 'Teste l\'adjacence (distance = 0) entre deux régions.',
    difficulty: 'Low',
    type: 'Topology',
    contours: [
      // Rectangle 1: -10 to 0
      [
        { x: -10, y: -10 },
        { x: 0, y: -10 },
        { x: 0, y: 10 },
        { x: -10, y: 10 }
      ],
      // Rectangle 2: 0 to 10
      [
        { x: 0, y: -10 },
        { x: 10, y: -10 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
    ]
  },
  {
    name: 'Motif F - Deux régions éloignées',
    description: 'Teste l\'absence d\'adjacence directe entre deux régions.',
    difficulty: 'Low',
    type: 'Topology',
    contours: [
      // Rectangle 1: -50 to -30
      [
        { x: -50, y: -10 },
        { x: -30, y: -10 },
        { x: -30, y: 10 },
        { x: -50, y: 10 }
      ],
      // Rectangle 2: 30 to 50
      [
        { x: 30, y: -10 },
        { x: 50, y: -10 },
        { x: 50, y: 10 },
        { x: 30, y: 10 }
      ]
    ]
  },
  {
    name: 'Motif G - Chiffre 8',
    description: '1 région, 2 trous',
    difficulty: 'Medium',
    type: 'Topology',
    contours: [
      // Outer 8
      [
        { x: -20, y: -40 },
        { x: 20, y: -40 },
        { x: 20, y: -5 },
        { x: 0, y: 0 },
        { x: 20, y: 5 },
        { x: 20, y: 40 },
        { x: -20, y: 40 },
        { x: -20, y: 5 },
        { x: 0, y: 0 },
        { x: -20, y: -5 }
      ],
      // Top hole
      [
        { x: -10, y: -30 },
        { x: 10, y: -30 },
        { x: 10, y: -10 },
        { x: -10, y: -10 }
      ],
      // Bottom hole
      [
        { x: -10, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 30 },
        { x: -10, y: 30 }
      ]
    ]
  },
  {
    name: 'Motif H - Croisement de Satin (Collision & Tension)',
    description: 'Deux colonnes qui se croisent à 90 degrés. Teste le CollisionSolver, l\'accumulation de fil et la tension.',
    difficulty: 'High',
    type: 'Mixed',
    contours: [
      // Vertical bar
      [ { x: -10, y: -50 }, { x: 10, y: -50 }, { x: 10, y: 50 }, { x: -10, y: 50 } ],
      // Horizontal bar
      [ { x: -50, y: -10 }, { x: 50, y: -10 }, { x: 50, y: 10 }, { x: -50, y: 10 } ]
    ]
  },
  {
    name: 'Motif I - Tatami Haute Densité (Buckling Risk)',
    description: 'Large surface continue propice au gondolement du tissu. Teste le BucklingSolver et le StretchSolver.',
    difficulty: 'High',
    type: 'Mixed',
    contours: [
      [ { x: -80, y: -80 }, { x: 80, y: -80 }, { x: 80, y: 80 }, { x: -80, y: 80 } ]
    ]
  },
  {
    name: 'Motif J - Colonne Asymétrique (Push-Pull)',
    description: 'Variation brutale de largeur pour tester le PushPullSolver et la rétractation élastique.',
    difficulty: 'Extreme',
    type: 'Ribbon',
    contours: [
      [ { x: -20, y: -50 }, { x: 20, y: -50 }, { x: 50, y: 0 }, { x: 20, y: 50 }, { x: -20, y: 50 }, { x: -50, y: 0 } ]
    ]
  },
  {
    name: 'Motif K - Center Complex (CENTER_COMPLEX_001)',
    description: 'Quatre formes centrales complexes caractérisées par des courbures serrées, des variations rapides d\'épaisseur et des intersections denses pour l\'évaluation critique du Ribbon Engine et du Width Estimator.',
    difficulty: 'Extreme',
    type: 'Ribbon',
    contours: [
      // Lobe 1 (Vertical haut)
      [
        { x: -5, y: -5 },
        { x: -10, y: -20 },
        { x: -15, y: -35 },
        { x: -10, y: -45 },
        { x: 0, y: -50 },
        { x: 10, y: -45 },
        { x: 15, y: -35 },
        { x: 10, y: -20 },
        { x: 5, y: -5 }
      ],
      // Lobe 2 (Vertical bas)
      [
        { x: 5, y: 5 },
        { x: 10, y: 20 },
        { x: 15, y: 35 },
        { x: 10, y: 45 },
        { x: 0, y: 50 },
        { x: -10, y: 45 },
        { x: -15, y: 35 },
        { x: -10, y: 20 },
        { x: -5, y: 5 }
      ],
      // Lobe 3 (Horizontal droit)
      [
        { x: 5, y: -5 },
        { x: 20, y: -10 },
        { x: 35, y: -15 },
        { x: 45, y: -10 },
        { x: 50, y: 0 },
        { x: 45, y: 10 },
        { x: 35, y: 15 },
        { x: 20, y: 10 },
        { x: 5, y: 5 }
      ],
      // Lobe 4 (Horizontal gauche)
      [
        { x: -5, y: 5 },
        { x: -20, y: 10 },
        { x: -35, y: 15 },
        { x: -45, y: 10 },
        { x: 50, y: 0 }, // Un petit croisement pour le stress-test
        { x: -45, y: -10 },
        { x: -35, y: -15 },
        { x: -20, y: -10 },
        { x: -5, y: -5 }
      ]
    ]
  }
];

