# AEE Algorithm Registry & Governance Freeze (Registre Algorithmique & Gel de Gouvernance)

**Référentiel Cadre - Acom Embroidery Engine (AEE)**
**Cadre de Gouvernance : Règle 50, Règle 52, Règle 60, Règle 66 & Règle 70 (AGENTS.md Level 1)**
**Statut Architecture : Formellement Gelé, Scellé & Verrouillé (Governance Freeze v1.0.0)**

---

## 1. Gel Officiel de la Gouvernance (Governance Freeze)

L'architecture globale et la structure de gouvernance de l'AEE sont désormais **STRICTEMENT GELÉES**. Aucune modification structurelle sur les éléments suivants n'est autorisée sans un vote formel d'Architecture Decision Record (ADR) majeur :

1. **Les 12 Moteurs du Pipeline** (Raster ➔ Segmentation ➔ Vectorization ➔ Geometry ➔ Topology ➔ Shape Analysis ➔ Rule Engine ➔ Fill Region ➔ Planning ➔ Stitch Generator ➔ Physics ➔ Quality ➔ Export).
2. **Le Modèle Intermédiaire ATIR v1.0** (`src/core/compiler/ATIR.ts`).
3. **La Taxonomie à 5 Niveaux de Gouvernance** (`AEE Innovation` ➔ `Capability` ➔ `Algorithm` ➔ `Implementation` ➔ `Validation`).
4. **Le Laboratoire Indépendant AEE TestLab** (Benchmarking, Heatmaps, Overlay, Golden Dataset).

---

## 2. Taxonomie à 5 Niveaux de Gouvernance (5-Tier Governance Taxonomy)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  1. NIVEAU INNOVATION (AEE-XXX)                                                        │
│  Brique de propriété intellectuelle, brevet ou rupture théorique scellée par l'ADR.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  2. NIVEAU CAPABILITY (CAP-XXX)                                                        │
│  Contrat d'interface technique fonctionnel exposé par les moteurs (Entrée/Sortie ATIR).│
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  3. NIVEAU ALGORITHME (ALG-XXX)                                                        │
│  Procédure mathématique/géométrique pure réalisant la Capability.                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  4. NIVEAU IMPLÉMENTATION (.ts / .wasm)                                                │
│  Fichier source exécutable (TypeScript / WebAssembly SIMD / GPU).                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  5. NIVEAU VALIDATION (AEE TestLab)                                                    │
│  Rapport métrologique sur Golden Dataset v1.0 (PASS / FAIL / Score GFI / Heatmaps).    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Contrats d'Interface des Capabilities (Capabilities Contracts)

| ID Capability | Intitulé Capability | Entrée ATIR | Sortie ATIR | KPI / Métrique Clé |
| :--- | :--- | :--- | :--- | :--- |
| **CAP-001** | Region Segmentation | Image Raster / Gradient | `ATIR.RegionGraph` | Taux de découpe & score $L^*a^*b^*$ |
| **CAP-002** | Boundary Extraction | `ATIR.RegionGraph` | `ATIR.PathVector[]` | Fidélité des contours (GFI) |
| **CAP-003** | Topological Consolidation | `ATIR.RegionGraph` | `ATIR.ConsolidatedGraph` | Nb de micro-fragments résiduels ($= 0$) |
| **CAP-004** | Winding Hole Detection | `ATIR.ConsolidatedGraph` | `ATIR.HoleTopologyMap` | Conservation des contre-formes ($100\%$) |
| **CAP-005** | Skeleton & Width Analysis | `ATIR.ConsolidatedGraph` | `ATIR.ShapeMetadata` | Erreur relative de largeur ($< 2\%$) |
| **CAP-006** | Tatami Grid Filling | `ATIR.RegionNode` | `ATIR.StitchPoint3D[]` | Régularité de densité & absence de trous |
| **CAP-007** | Satin Column Generation | `ATIR.RegionNode` | `ATIR.StitchPoint3D[]` | Homogénéité d'angle & alignement |
| **CAP-008** | Push-Pull Compensation | `ATIR.StitchPoint3D[]` | `ATIR.StitchPoint3D[]` | Réduction de déformation ($> 85\%$) |

---

## 4. Matrice de Traçabilité Globale des Algorithmes (AEE Traceability Matrix)

| ID Algo | Intitulé Sci. | Innovation | Capability Rattachée | Fichier Implémentation | Statut Maturité | TestLab Golden Dataset |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ALG-001** | Adaptive Watershed | AEE-002 | CAP-001 Region Segmentation | `src/core/segmentation/AdaptiveWatershed.ts` | **Prototype** | 🟡 Score GFI : 84.2% |
| **ALG-002** | CIELAB Color Merge | AEE-002 | CAP-001 Region Segmentation | `src/core/segmentation/ColorQuantizerCIELAB.ts` | **Prototype** | 🟡 Réduction Bruit : 91.0% |
| **ALG-010** | Border Following | Non rattaché | CAP-002 Boundary Extraction | `src/core/geometry/BoundaryExtractor.ts` | **Prototype** | 🟡 Précision : 96.5% |
| **ALG-020** | Region Consolidation | **AEE-001** | CAP-003 Topological Consolidation | `src/core/topology/ConsolidateTopologicalRegions.ts` | **FROZEN / Prod** | 🟢 **PASS (0 régression)** |
| **ALG-021** | Winding Hole Detector | AEE-001 | CAP-004 Winding Hole Detection | `src/core/topology/WindingNumberHoleDetector.ts` | **Implemented** | 🟢 Contre-formes : 100% |
| **ALG-030** | Medial Axis Transform | Non rattaché | CAP-005 Skeleton & Width | `src/core/geometry/MedialAxisTransform.ts` | **Designed** | ⚪ En évaluation |
| **ALG-040** | Raycasting Tatami | Non rattaché | CAP-006 Tatami Grid Filling | `src/core/tatami/RaycastingTatamiFiller.ts` | **Implemented** | 🟢 Stabilité : 98.1% |
| **ALG-041** | Satin Column Gen. | Non rattaché | CAP-007 Satin Column Gen. | `src/core/satin/SatinColumnGenerator.ts` | **Implemented** | 🟢 Densité : 97.4% |
| **ALG-042** | Push-Pull Comp. | Non rattaché | CAP-008 Push-Pull Comp. | `src/core/physics/PushPullDeformationCompensator.ts` | **Prototype** | 🟡 Compensation : 88.0% |

---

## 5. Tableau de Bord de Maturité AEE (Maturity Dashboard)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ NIVEAU / COMPOSANT         │ NBR  │ OBJECTIF STRATÉGIQUE & REQUIS DE VALIDATION        │
├────────────────────────────┼──────┼────────────────────────────────────────────────────┤
│ Capabilities Spécifiées    │ 35   │ Couverture 100% des besoins CAD/CAM broderie       │
│ Algorithmes Spécifiés      │ 28   │ Registre de R&D formel dans la Knowledge Base     │
│ Algorithmes Implémentés    │ 12   │ Fichiers TypeScript / WASM exécutables             │
│ Algorithmes Benchmarkés    │ 8    │ Évalués par AEE TestLab avec métriques chiffrées   │
│ Algorithmes FROZEN (Prod)  │ 2    │ Certifiés sans régression sur Golden Dataset v1.0  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Protocole d'Incrémentation et de Promotion d'un Algorithme (ALG Lifecycle)

Chaque algorithme suit obligatoirement la chaîne de qualification suivante :

$$\text{Draft} \longrightarrow \text{Designed} \longrightarrow \text{Prototype} \longrightarrow \text{Implemented} \longrightarrow \text{Tested} \longrightarrow \text{Benchmarked} \longrightarrow \text{FROZEN / Production}$$

### Exigences pour franchir le jalon **FROZEN / Production** :
1. **Fiche Scientifique & Mathématique** rédigée et intégrée à la Knowledge Base.
2. **Couverture de Tests Unitaires** à $100\%$ sur les cas limites géométriques.
3. **Passage sans régression** sur l'intégralité du Golden Dataset v1.0 (Règle 55 & Règle 68).
4. **Validation Visuelle et Métrologique** confirmée par le *Regression Scientist Agent* (Règle 64 & Règle 65).

