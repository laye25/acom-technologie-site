# Architecture Maître : AEE Textile Kernel (Spécification des Moteurs, Decision Layer, ATIR & AEE SDK)

**Référentiel Cadre - Acom Embroidery Engine (AEE)**
**Cadre de Gouvernance : Règle 40, Règle 50, Règle 64 & Règle 66 (AGENTS.md Level 1)**
**Statut Architecture : Formellement Validé & Structuré (Grade Architecte 10/10)**

---

## 1. Vision Générale du Noyau Textile AEE

Le **AEE Textile Kernel** est une plateforme d'ingénierie CAD/CAM textile modulaire, autonome et hautement éprouvée. Il surmonte les approches monolithiques en découpant le flux de traitement en **Moteurs Spécialisés à Responsabilité Unique**, pilotés par le **Decision Layer**, articulés autour du modèle de données intermédiaire **ATIR (Acom Textile Intermediate Representation)**, adossés à l'**AEE SDK** (Mathematical & Textile SDKs) et encadrés par le **Knowledge Layer**.

```
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                       KNOWLEDGE LAYER                                             │
 │  (Golden Dataset v1.0 • ADRs • Registres Benchmark • Historique de Pannes • Rapport Validation)   │
 └───────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                   │
  ┌────────────────────────────────────────────────┴───────────────────────────────────────────────┐
  │                            AEE PIPELINE ORCHESTRATION LAYER                                    │
  │                     (Représentation Intermédiaire Unique : ATIR v1.0)                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
           │
           ├── [1] Raster Analysis Engine          (Prétraitement d'images & réduction du bruit)
           │
           ├── [2] Region Segmentation Engine      (Création des régions homogènes - AEE-002 Prototype)
           │
           ├── [3] Vectorization Engine            (Conversion Raster ➔ Chemins Vectoriels Bruts)
           │
           ├── [4] Geometry Reconstruction Engine  (Courbes, splines, Bézier & lissage géométrique)
           │
           ├── [5] Topology Engine                 (Graphes, hiérarchie & consol. - AEE-001 FROZEN)
           │
           ├── [6] Shape Analysis Engine           (Cerveau géométrique : squelette, largeur, courbure)
           │
           │  ═══════════════════════════════════════════════════════════════════════════════════
           │  ║  DECISION LAYER (Calcul des Recommandations Métier : Satin / Tatami / Running) ║
           │  ═══════════════════════════════════════════════════════════════════════════════════
           │
           ├── [7] Fill Region Engine              (Préparation des zones Tatami/Satin, trous & contreformes)
           │
           ├── [8] Embroidery Planning Engine     (Ordonnancement, séquençage & trajets de fil TSP)
           │
           ├── [9] Stitch Generator Engine         (Génération Satin, Tatami, Running & Underlay)
           │
           ├── [10] Physics Engine                 (Compensation de tirage Push-Pull & méca textile)
           │
           ├── [11] Export Engine                  (Sérialisation formats machine DST / PES / EXP)
           │
           ├── [12] Quality Engine                 (Validation CAD finale & décision de conformité)
           │
           └── [13] Benchmark Engine               (Métrologie 3 Niveaux : Vecteur, Broderie, Industrie)
                                                   │
 ┌─────────────────────────────────────────────────┴───────────────────────────────────────────────┐
 │                             AEE SCIENTIFIC CAD/CAM SDK                                          │
 │  ┌──────────────────────────────────────────────┬────────────────────────────────────────────┐  │
 │  │        AEE MATHEMATICAL SDK                  │             AEE TEXTILE SDK                │  │
 │  │ (Distance Transform • Voronoï • Medial Axis  │ (Tatami • Satin • Running • Underlay       │  │
 │  │  Delaunay • SVD • PCA • Bézier • Splines)    │  Push/Pull • Density • Fabric Model)       │  │
 │  └──────────────────────────────────────────────┴────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Le Modèle de Données Intermédiaire : ATIR (Acom Textile Intermediate Representation)

Inspiré des compilateurs industriels modernes (type LLVM IR), le noyau fait circuler un objet domaine typé unique : **ATIR** (`src/core/compiler/ATIR.ts`).

### Structure du Modèle ATIR :
1. **Contours & Réticule** : Courbes paramétriques et sous-chemins fermés.
2. **Graphe Topologique (RegionNode)** : Relations hiérarchiques parent/enfant, îlots et ouvertures (trous/contre-formes).
3. **Shape Analysis Metadata** :
   - `medialAxis` : Squelette médian topologique.
   - `localWidthMinMm`, `localWidthMaxMm`, `localWidthAvgMm` : Profils d'épaisseur.
   - `principalAngleDeg`, `curvatureIndex`, `isConvex` : Propriétés géométriques.
4. **Decision Layer Metadata** :
   - `recommendedStitchType` : `'satin'` | `'tatami'` | `'running'` | `'underlay'` | `'border'`.
   - `recommendedDensityMm`, `recommendedAngleDeg`, `pullCompensationMm`.
5. **Stitch Array $3D$** : Coordonnées d'injection $3D (x, y, z)$ et drapeaux machine (Jump, Trim, ColorChange).

---

## 3. Le Decision Layer (Inférence des Règles Confection)

Placé immédiatement après le **Shape Analysis Engine**, le **Decision Layer** n'effectue aucun calcul géométrique lourd. Son rôle exclusif est d'appliquer les heuristiques métiers des maîtres tailleurs sur le modèle ATIR :

* **Règle 1 (Fil de contour / Line)** : Largeur locale $< 2.0\text{ mm} \implies$ **Running Stitch** (Point de tressage / contour).
* **Règle 2 (Colonne étroite / Bar)** : Largeur locale entre $2.0\text{ mm}$ et $8.0\text{ mm} \implies$ **Satin Stitch** (Point de satin orienté selon l'axe médial).
* **Règle 3 (Remplissage vaste / Surface)** : Largeur locale $> 8.0\text{ mm} \implies$ **Tatami Stitch** (Grille de remplissage orientée à $30^\circ/45^\circ$).
* **Règle 4 (Sous-couche / Underlay)** : Si Satin $\implies$ Underlay en contour + ligne centrale. Si Tatami $\implies$ Underlay en grille basse densité.
* **Règle 5 (Contre-formes / Trous)** : Si Winding Number impair $\implies$ Soustraction géométrique et découpe sans sur-épaisseur.

---

## 4. Organisation de l'AEE SDK (Mathematical & Textile SDKs)

L'**AEE SDK** sépare étanchément les algorithmes mathématiques génériques et les modèles physiques textiles :

### A. AEE Mathematical SDK
* **Analyse Spatiale** : `DistanceTransform`, `VoronoiDiagram`, `MedialAxisTransform`, `DelaunayTriangulation`.
* **Algèbre & Statistique** : `PrincipalComponentAnalysis` (PCA), `SingularValueDecomposition` (SVD).
* **Interpolation** : `AdaptiveBezierFitting`, `BSplineSmoother`, `SplicePointDetector`.
* **Théorie des Graphes** : `RegionGraphBuilder`, `WindingNumberCalculator`.

### B. AEE Textile SDK
* **Générateurs de Points** : `RaycastingTatamiFiller`, `SatinColumnGenerator`, `RunningStitchGenerator`, `UnderlayStitching`.
* **Mécanique Textile** : `PushPullDeformationCompensator`, `ThreadTensionSimulator`, `FabricElasticityModel`.
* **Optimisation & Formats** : `ColorOrderingTSP`, `DST3ByteDeltaEncoder`, `PESBinarizer`.

---

## 5. Grille de Métrologie 3 Niveaux (Benchmark Engine)

Le **Benchmark Engine** mesure la performance selon 3 niveaux de métriques orientées confection textile :

### Niveau 1 : Qualité Vectorielle & Géométrique (Pré-Tatami)
1. **Régions Exploitations** : Nombre de formes réelles vs micro-fragments supprimés.
2. **Topologie des Trous** : Exactitude du Winding Number et conservation des contre-formes.
3. **Continuité des Contours** : Nombre de discontinuités ou d'angles cassés réinjectés.

### Niveau 2 : Qualité Broderie & Métier (Post-Génération)
1. **Structures Broderie** : Nombre exact de blocs Tatami, colonnes Satin et lignes Running.
2. **Sauts de Fil & Coupures (Jumps / Trims)** : Nombre minimal de coupures machine.
3. **Changements de Couleur** : Nombre optimal de pauses opérateur.
4. **Longueur Totale de Fil** : Consommation en mètres linéaire.
5. **Temps Machine Estimé** : Durée théorique d'exécution en minutes.
6. **Densité & Couverture Textile** : Absence de jours (gaps) et contrôle des sur-épaisseurs.

### Niveau 3 : Qualité Industrielle & Contraintes Machine
1. **Points Critiques** : Nombre de points trop courts ($< 0.3\text{ mm}$) risquant de casser le fil ou piquer le tissu.
2. **Points Excessifs** : Nombre de sauts trop longs ($> 12.0\text{ mm}$) imposing une coupure machine.
3. **Angles Aigus** : Prévention des accumulations d'aiguille dans les virages serrés.
4. **Risque de Casse de Fil** : Indice d'effort mécanique sur le sous-système presseur.

---

## 6. Le Knowledge Layer (Transversal)

1. **Golden Dataset v1.0** : Jeu de 100 motifs étalons (formes simples, armoiries, typographies fines, exports Canva/Inkscape).
2. **ADR (Architecture Decision Records)** : Historique immuable des choix de conception (ADR-001 à ADR-016).
3. **Benchmark History** : Registres d'exécution CLI automatisés (`/benchmark-history/`).
4. **Failure History** : Registres d'analyse d'erreurs d'isolation (ex: `BUG-GEO-042`).
5. **Innovation Library** : Répertoire des fiches d'innovations scellées (AEE-000 à AEE-006).
6. **Validation Reports** : Procès-verbaux d'audit scientifique post-benchmark.


