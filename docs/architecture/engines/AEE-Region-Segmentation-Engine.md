# Spécification d'Architecture : AEE Region Segmentation Engine
**Composant du Noyau CAD/CAM Textile : Acom Embroidery Engine (AEE)**
**Cadre de Gouvernance : Règle 40 & Règle 50 (AGENTS.md Level 1)**
**Statut Architecture : Designed & Engine-Structured**

---

## 1. Vision & Positionnement dans le Noyau AEE

Le **AEE Region Segmentation Engine** est le module autonome responsable du traitement matriciel amont et du découpage initial des images (PNG, JPEG, SVG Raster). Il transforme un flux de pixels bruts en un ensemble ordonné de **Régions Homogènes de Remplissage (Fill Regions)** nettoyées de leur bruit.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 KNOWLEDGE LAYER                                  │
│  (Golden Dataset v1.0 • ADRs • Registres Benchmark • Failure History • Reports)  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                         │
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             AEE TEXTILE KERNEL                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
         │
         ├── [1] Raster Analysis Engine      (Analyse d'histogramme, Réduction de bruit)
         │
         ├── [2] REGION SEGMENTATION ENGINE  ◄─── [ AEE-002 : Watershed Adaptatif ]
         │     ├── Color Quantization & Distance ΔE_CIE2000
         │     ├── Adaptive Watershed Flooding (Ligne de partage des eaux)
         │     └── Region Clustering & Border Smoothing
         │
         ├── [3] Vectorization Engine        (Conversion Raster ➔ Chemins Vectoriels Bruts)
         │
         ├── [4] Geometry Reconstruction Engine (Lissage, Bézier, Splice & Subdivision)
         │
         ├── [5] Topology Engine             ◄─── [ AEE-001 : Consolidation (FROZEN) ]
         │                                   ◄─── [ AEE-003 : Stacking Anti-Gap ]
         │
         ├── [6] Fill Region Engine          (Préparation zones Tatami/Satin, trous & offset)
         │
         ├── [7] Embroidery Planning Engine  (Séquençage, Couleurs & Trajets)
         │
         ├── [8] Stitch Generator Engine     (Génération Satin / Tatami / Running)
         │
         ├── [9] Physics Engine              (Traction, Tension, Simulation Fil)
         │
         ├── [10] Export Engine              (Fichiers Machine DST / PES / EXP)
         │
         ├── [11] Quality Engine             (Validation CAD finale & Décision PASS/FAIL)
         │
         └── [12] Benchmark Engine           (Evaluation GFI, TPI, SEI & CLI)
```

---

## 2. Pipeline Interne du Region Segmentation Engine

```
 [ Image Brute (Raster) ]
          │
          ▼
 ┌────────────────────────────────────────┐
 │ 1. Pre-Processing & Noise Filtering     │ ── (Filtre Bilatéral & Flou Gaussien Adaptatif)
 └────────────────────────────────────────┘
          │
          ▼
 ┌────────────────────────────────────────┐
 │ 2. Color Space Conversion (sRGB -> LAB)│ ── (Espace perceptuel homogène CIELAB)
 └────────────────────────────────────────┘
          │
          ▼
 ┌────────────────────────────────────────┐
 │ 3. Adaptive Watershed Flooding (AEE-002)│ ── (Calcul de Gradient & Inondation de Bassins)
 └────────────────────────────────────────┘
          │
          ▼
 ┌────────────────────────────────────────┐
 │ 4. Boundary Stabilization & Smoothing  │ ── (Ancrage des arêtes & réduction d'oscillations)
 └────────────────────────────────────────┘
          │
          ▼
 [ Régions Homogènes Brutes ➔ Transmises au Vectorization Engine ]
```

---

## 3. Interface Publique & Isolation (Contract)

Conformément à la **Règle 50**, ce moteur dispose d'une interface autonome indépendante de React et des couches réseau :

```typescript
export interface RegionSegmentationInput {
  imageData: ImageData | HTMLCanvasElement;
  targetPaletteSize?: number;
  gradientThreshold?: number;
  noiseFilterRadius?: number;
}

export interface SegmentedRegion {
  id: string;
  colorHex: string;
  labColor: { l: number; a: number; b: number };
  boundaryPoints: { x: number; y: number }[];
  area: number;
  isBackground: boolean;
}

export interface RegionSegmentationOutput {
  regions: SegmentedRegion[];
  colorPalette: string[];
  executionTimeMs: number;
  metrics: {
    totalRegions: number;
    boundaryOscillationIndex: number;
    noiseRatio: number;
  };
}

export class RegionSegmentationEngine {
  public static segmentImage(input: RegionSegmentationInput): RegionSegmentationOutput;
}
```

---

## 4. Jalons d'Évolution du Moteur

* **V0.1 (Baseline)** : Color distance basique sRGB & K-Means brut.
* **V1.0 (AEE-002)** : **Clustering Watershed Adaptatif** avec calcul de gradient en espace CIELAB et inondation topographique.
* **V1.1 (Interconnexion)** : Transmission directe des régions stabilisées vers le **Vectorization Engine**.
