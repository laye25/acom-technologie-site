# Spécification Technique : AEE Pipeline Orchestrator & Contrats d'Interface

**Composant d'Orchestration du Noyau CAD/CAM Textile : Acom Embroidery Engine (AEE)**
**Cadre de Gouvernance : Règle 40, Règle 50 & Règle 63 (AGENTS.md Level 1)**
**Statut Architecture : Formellement Validé & Isolée (Zero-Algorithm Orchestrator)**

---

## 1. Rôle du Pipeline Orchestrator

Le **AEE Pipeline Orchestrator** (`AEEPipelineOrchestrator`) est le coordonnateur central du **AEE Textile Kernel**. 

### Principes Inviolables d'Orchestration :
1. **Absence Totale d'Algorithmes** : L'orchestrateur ne contient **aucun code de calcul mathématique, géométrique ou textile**. Il est strictement confiné à la gestion du flux de données.
2. **Couplage Faible via Interfaces** : Il interagit exclusivement avec les moteurs au travers du contrat standard `AEEEngine<Input, Output>`.
3. **Traçabilité & Télémétrie** : Il mesure le temps d'exécution de chaque étape, vérifie les contrats d'entrée/sortie via `validate()`, et enregistre les journaux d'audit.
4. **Offline Research Mode** : En cas de rupture réseau ou d'indisponibilité des services tiers, il bascule nativement les données vers le stockage local IndexedDB/Dexie conformément à la **Règle 63**.

---

## 2. Contrat d'Interface Unique des Moteurs (`AEEEngine<I, O>`)

Chaque moteur du **AEE Textile Kernel** doit obligatoirement implémenter l'interface générique standardisée suivante :

```typescript
export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EngineBenchmarkResult {
  executionTimeMs: number;
  memoryDeltaMb: number;
  scoreGFI: number;
}

export interface AEEEngine<Input, Output> {
  readonly engineId: string;
  readonly name: string;
  readonly version: string;

  /**
   * Exécution du calcul principal du moteur.
   */
  execute(input: Input): Output;

  /**
   * Validation formelle de la conformité des données d'entrée avant calcul.
   */
  validate(input: Input): ValidationReport;

  /**
   * Mesure métrologique et profilage de performance du moteur sur le jeu d'entrée.
   */
  benchmark(input: Input): EngineBenchmarkResult;
}
```

---

## 3. Flux d'Exécution Orchestré (Pipeline Flow)

```
[ Image Brute / Config ]
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. Pipeline Orchestrator (Initialisation Session)     │
 └────────────────────────────────────────────────────────┘
          │
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [1. Raster Analysis Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [2. Region Segmentation Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [3. Vectorization Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [4. Geometry Reconstruction Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [5. Topology Engine (AEE-001 FROZEN)]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [6. Fill Region Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [7. Embroidery Planning Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [8. Stitch Generator Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [9. Physics Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [10. Export Engine]
          ├──► validate(Input) ──► execute() ──► benchmark() ➔ [11. Quality Engine]
          └──► validate(Input) ──► execute() ──► benchmark() ➔ [12. Benchmark Engine]
          │
          ▼
 [ Rapport de Télémétrie + Fichier Machine + Certificat CAD Pass/Fail ]
```

---

## 4. Briques Algorithmiques Rattachées à l'Algorithms Registry

L'orchestrateur coordonne les moteurs, qui s'appuient eux-mêmes sur le **AEE Algorithms Registry** structuré par domaines :

```
AEE ALGORITHMS REGISTRY
 ├── 1. Segmentation Domain
 │    ├── AdaptiveWatershed
 │    ├── ColorQuantizerCIELAB
 │    └── NoiseBilateralFilter
 │
 ├── 2. Vectorization Domain
 │    ├── BorderFollowingBoundaryExtractor
 │    └── PolygonPathBuilder
 │
 ├── 3. Geometry Domain
 │    ├── AdaptiveBezierFitting
 │    ├── SplicePointDetector
 │    ├── FourPointSubdivider
 │    └── CurveSmoothing
 │
 ├── 4. Topology Domain
 │    ├── ConsolidateTopologicalRegions (AEE-001 FROZEN)
 │    ├── HierarchicalRegionStacker
 │    └── WindingNumberHoleDetector
 │
 ├── 5. Embroidery & Fill Domain
 │    ├── RaycastingTatamiFiller
 │    ├── SatinColumnGenerator
 │    └── CounterFormOffsetCalculator
 │
 └── 6. Physics & Export Domain
      ├── PushPullDeformationCompensator
      └── DST3ByteDeltaEncoder
```
