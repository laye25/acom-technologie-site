# Architectural Specification: ATCP SDK & Unified API
**Maturité (Règle 52) :** Designed  

Ce document définit les spécifications de l'interface de programmation (API) et du Kit de Développement Logiciel (SDK) de l'**Acom Textile Computing Platform (ATCP)**. 

Le SDK ATCP permet à n'importe quelle application cliente ou serveur d'importer, de sémantiser, d'optimiser, de simuler physiquement et de compiler des tracés vectoriels dans les différents formats de fabrication d'art textile (broderie, découpe laser, tricotage CNC, etc.).

---

## 1. Conception de l'API Unifiée (Unified API Design)

Le SDK est conçu comme une bibliothèque TypeScript/Rust modulaire, performante et découplée de toute interface graphique (conforme à la **Règle 40 - Le moteur est un produit**).

```
                                      ATCP SDK
                                         │
        ┌──────────────────┬─────────────┼─────────────┬──────────────────┐
        ▼                  ▼             ▼             ▼                  ▼
    [Ingress]         [Sémantique]  [Optimizer]   [Simulator]         [Egress]
    Import SVG         Knowledge    Passe TSP-PC   Réseau Phys        Compilateur
    ou GeoJSON           Graph       & Densités    Masse-Ressort      Machine (DST)
```

### Exemple de Scénario de Numérisation Sémantique Autonome (TypeScript) :

```typescript
import { 
  ATCPCompiler, 
  FabricType, 
  ThreadBrand, 
  EmbroideryFormat 
} from '@acom/atcp-sdk';

async function generatePremiumEmbroidery() {
  // 1. Initialisation du compilateur unifié ATCP
  const compiler = new ATCPCompiler({
    precision: 0.05, // Précision géométrique nominale en mm
    enableNumericalStabilization: true
  });

  // 2. Chargement du tracé vectoriel d'entrée
  const project = await compiler.importSVG('assets/royal_pattern.svg');

  // 3. Liaison sémantique avec l'African Embroidery Knowledge Graph (AEKG)
  // Détection automatique de la nature du motif (Bogolan, Caftan, Wax, etc.)
  await project.applySemanticAnalysis({
    context: {
      substrate: FabricType.BAZIN_RICHE,
      thread: ThreadBrand.MADEIRA_CLASSIC_40,
      tension: 110 // Tension nominale en g
    }
  });

  // 4. Exécution des passes d'optimisation (Reconstruction des rubans, TSP-PC, Solveur de contraintes)
  const optimizationReport = await project.optimize({
    minimizeTrims: true,
    preserveVoids: true, // Applique les winding numbers topologiques
    activePullCompensation: true
  });

  console.log(`Optimisation terminée. Trims réduits à : ${optimizationReport.trims}`);

  // 5. Simulation physique 3D par éléments finis
  const physicsReport = await project.simulatePhysics();
  if (physicsReport.hasPuckeringRisk) {
    console.warn(`Risque de plissement détecté. Correction active des densités en cours...`);
    await project.autoCorrectDensities();
  }

  // 6. Compilation et exportation binaire machine (DST pour brodeuses industrielles Tajima)
  const binaryBuffer = await project.export({
    format: EmbroideryFormat.DST,
    machineProfile: 'Tajima_TME-MX'
  });

  return binaryBuffer;
}
```

---

## 2. Découpage Modulaire des Paquets (Package Architecture)

Le SDK est divisé en sous-modules indépendants et éco-conçus :

1. `@acom/atcp-core` : Le cœur de calcul mathématique (géométrie computationnelle, interpolation, calcul topologique et résolution de contraintes).
2. `@acom/atcp-knowledge` : Le moteur d'inférence sémantique relié au graphe de connaissances textile et à la base de motifs traditionnels (African Pattern Dataset).
3. `@acom/atcp-physics` : Le simulateur dynamique masse-ressort pour la prédiction de déformation textile.
4. `@acom/atcp-compiler` : Le module de compilation bas niveau (AST, IR, optimisations de voyage) et les générateurs binaires finaux.

---

## 3. Le Pipeline Multi-Procédé (Beyond Embroidery)

Grâce à son architecture découplée, le compilateur ATCP dispose de backends d'exportation interchangeables pour adresser de multiples procédés de fabrication textile :

```typescript
import { ATCPCompiler, ExportTarget } from '@acom/atcp-sdk';

const compiler = new ATCPCompiler();
const project = await compiler.importSVG('design.svg');

// Découpe Laser (G-Code)
const laserGCode = await project.export({ target: ExportTarget.LASER_CUTTER });

// Tricotage CNC (K-Code)
const knittingCode = await project.export({ target: ExportTarget.CNC_KNITTING });

// Broderie Multi-Format (DST, PES, EXP)
const embroideryDST = await project.export({ target: ExportTarget.EMBROIDERY_DST });
```
