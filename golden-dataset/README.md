# ATCP Golden Dataset Repository
**Maturité (Règle 52) :** Implemented  

Conformément aux principes métrologiques de la **Phase 1**, ce dépôt constitue la base de référence immuable (**Règle 55 — Les Golden Datasets sont immuables**) utilisée par le **Golden Dataset Runner** de l'**AEE Validation Center** pour valider et quantifier objectivement l'absence de régressions géométriques, topologiques ou physiques à chaque modification des moteurs d'ATCP.

---

## 1. Structure de l'Arborescence du Golden Dataset

Chaque motif de test est isolé dans son propre dossier contenant ses vecteurs sources, sa représentation intermédiaire attendue, son export machine de référence compilé de manière optimale, ainsi que ses indicateurs de signature qualité :

```
golden-dataset/
├── README.md
├── alphabet/             # Glyphes de lettrerie microscopique (A, B, O, P, etc.)
├── logos/                # Icônes géométriques et symboles d'entreprises
├── mandalas/             # Tracés de courbures complexes de Bézier
├── arabesques/           # Formes spiralées denses
├── dentelles/            # Tracés filaires fins et filigranes
├── wax/                  # Motifs graphiques alternés africains
├── bogolan/              # Motifs traditionnels géométriques sacrés
├── kente/                # Blocs orthogonaux tissés denses
├── photos/               # Images matricielles complexes pour le lissage
└── pathologiques/        # Cas d'études critiques (rebroussements, angles vifs)
```

### Contenu Standardisé d'un Dossier Motif (`PAT_XXXX/`) :
*   `reference.png` : Image matricielle originale du dessin d'entrée.
*   `reference.svg` : Tracé vectoriel d'entrée normalisé.
*   `expected.atir` : Fichier de description intermédiaire idéal (**ATIR**) validé par le Scientific Reviewer.
*   `expected.dst` / `expected.pes` : Fichiers binaires de référence d'usinage machine compilés par les suites expertes industrielles (Wilcom, Hatch).
*   `metrics.json` : Matrice d'indices de référence (GFI, TPI, SEI, $TPI^2$, SUI).
*   `screenshot.png` : Rendu visuel 3D simulé du motif final.

---

## 2. Définition Stricte de "Terminé" (Definition of Done) pour les Moteurs

Conformément aux instructions d'ingénierie d'ATCP, aucun moteur ou composant de calcul ne peut être considéré comme complété sur la seule base de sa compilation réussie. Un module est déclaré **"Terminé"** uniquement s'il valide l'ensemble de la grille de critères suivante :

```
                 [ DÉVELOPPEMENT D'UN MOTEUR DE CALCUL ]
                                   │
                                   ├── 1. COMPILATION
                                   │    └── ✓ Type-safe à 100% (tsc --noEmit)
                                   │    └── ✓ Zéro avertissement ESLint
                                   │
                                   ├── 2. UNIT TESTING
                                   │    └── ✓ Couverture des cas nominaux et d'erreurs
                                   │
                                   ├── 3. METROLOGY PASS
                                   │    └── ✓ Évaluation complète sur le Golden Dataset
                                   │    └── ✓ Zéro régression géométrique détectée
                                   │
                                   ├── 4. QUALITY SIGNATURES
                                   │    └── ✓ GFI, TPI et SEI au-delà des seuils requis
                                   │
                                   ├── 5. DOCUMENTATION & VERSIONING
                                   │    └── ✓ API stable versionnée individuellement
                                   │    └── ✓ ADR et spécifications mathématiques complètes
                                   │
                                   └── [ CERTIFICATION & STABILITÉ ACQUISE ]
```

---

## 3. Registre d'Évaluation de Non-Régression (Golden Dataset Index)

| ID Motif | Famille | Source SVG | Genre Topologique ($g$) | Spécificité / Contrainte | GFI Target | TPI Target |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| **PAT_0001** | `alphabet` | `glyph_A_serif.svg` | `1` | Double contour et contreforme centrale | $\ge 99.0\%$ | `100.0%` |
| **PAT_0002** | `alphabet` | `glyph_B_serif.svg` | `2` | Double contreforme et évidements fins | $\ge 99.0\%$ | `100.0%` |
| **PAT_0010** | `logos` | `corporate_gear.svg` | `5` | Trous circulaires concentriques vifs | $\ge 98.5\%$ | `100.0%` |
| **PAT_0025** | `mandalas` | `complex_mandala.svg`| `12` | Rotation et symétrie à forte densité | $\ge 98.0\%$ | `100.0%` |
| **PAT_0050** | `dentelles` | `wedding_lace.svg` | `45` | Entrelacs filaires de micro-points | $\ge 97.5\%$ | `99.0%` |
| **PAT_0100** | `bogolan` | `geometric_sacred.svg`| `0` | Alternance de textures Tatami denses | $\ge 98.0\%$ | `100.0%` |
| **PAT_0200** | `pathologiques` | `cusp_30_deg.svg` | `0` | Points de rebroussement serrés | $\ge 97.0\%$ | `100.0%` |
