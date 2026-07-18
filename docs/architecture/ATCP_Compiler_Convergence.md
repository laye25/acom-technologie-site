# Architecture: ATCP Compiler Pipeline & Engine Contracts (Vision 2030)
**Maturité (Règle 52) :** Designed  

Cette spécification consacre le gel de la gouvernance d'ATCP (AGENTS.md version 1.0) et définit l'architecture de calcul découplée sous la forme d'un pipeline de compilation de type **LLVM**. Elle introduit également les contrats unifiés d'interface des moteurs (Engine Contracts) et la politique de versioning individuel.

---

## 1. Le Pipeline de Compilation Textile d'ATCP (LLVM-like)

Plutôt que d'associer directement le dessin d'entrée aux instructions d'usinage machine, ATCP découple la logique géométrique de la physique textile en appliquant des passes de transformation successives sur une **Représentation Intermédiaire (ATIR)** :

```
             [ DESSIN SOURCE / GRAPHIC INPUTS (SVG, PNG) ]
                                  │
                                  ▼
                     [ Vision & Semantic Engine ] (Classification)
                                  │
                                  ▼
                      [ Geometry & Shape Engine ] (Lissage & Splines)
                                  │
                                  ▼
                      [ Topology Analysis Engine ] (Euler-Poincaré & Trous)
                                  │
                                  ▼
                      [ Ribbon Reconstruction Engine ] (Axes médians)
                                  │
                                  ▼
             ┌───────────────────────────────────────────┐
             │       REPRÉSENTATION INTERMÉDIAIRE        │
             │           ATIR (AST / Graphe)             │
             └────────────────────┬──────────────────────┘
                                  │
                                  ▼ [Passes d'Optimisation]
                      [ Stitch Placement Compiler ] (Remplissages & Satin)
                                  │
                                  ▼
                      [ Travel Engine & TSP-PC ] (Ordonnancement)
                                  │
                                  ▼
                      [ Physics & Mechanics Engine ] (Compensations)
                                  │
                                  ▼
                      [ Machine Translation Engine ] (DST, PES, JEF Backends)
                                  │
                                  ▼
               [ CODE COMPILÉ D'USINAGE MACHINE (.DST, .PES) ]
```

---

## 2. Le Contrat Unifié des Moteurs (Engine Contract)

Chaque sous-système (Engine) autonome d'ATCP doit obligatoirement respecter l'interface structurelle et les règles fonctionnelles suivantes pour garantir la modularité et l'isolation du système :

```typescript
interface IEmbroideryEngine<TInput, TOutput> {
  name: string;
  version: string;
  status: "Conception" | "Prototype" | "Production";
  
  /**
   * Exécute la transformation algorithmique du moteur.
   * @param input Données brutes du niveau amont du pipeline.
   * @param context Métadonnées d'exécution (tenantId, merchantId, physicalSettings).
   */
  process(input: TInput, context: EngineContext): TOutput;

  /**
   * Analyse les contraintes et prérequis avant exécution.
   */
  validatePreconditions(input: TInput): boolean;

  /**
   * Certifie l'exactitude des données produites en sortie.
   */
  validatePostconditions(output: TOutput): boolean;
}
```

### Obligations du Contrat pour chaque Moteur :
*   **Isolation stricte** : Aucun couplage ou dépendance avec le cycle de vie de l'UI (React), d'une base de données cloud (Firebase) ou d'autres moteurs non adjacents dans le pipeline.
*   **Vérification de Non-Régression (Règle 64)** : Tout changement dans un moteur doit être mesuré et validé sur le Golden Dataset de 1000 motifs avant d'être fusionné dans la branche stable.

---

## 3. Versioning Politique & État de Maturité des Modules

Afin de décorréler le développement des différents composants géométriques et physiques, chaque moteur possède son propre cycle de vie et sa politique de version sémantique :

| Moteur (Engine) | Version | État de Maturité | Cible du Prochain Sprint |
| :--- | :---: | :---: | :--- |
| **Geometry Engine** | `v1.2.0` | 🟢 Production | Stabilisation des interpolations de splines directionnelles. |
| **Topology Engine** | `v0.3.0` | 🟡 Prototype | Préservation et classification à $100\%$ des trous sur les glyphes de lettres (A, B, O, P). |
| **Ribbon Engine** | `v0.1.0` | ❌ Conception | Établissement du prototype de squelettisation d'axe médian de largeur variable. |
| **Physics Engine** | `v0.0.0` | ❌ Conception | Formulation mathématique des modèles de drapé et de tension de fil. |
| **Semantic Engine** | `v0.0.0` | ❌ Conception | Taxonomie et identification de motifs traditionnels (Kente, Wax). |
| **Machine Backend** | `v0.4.0` | 🟡 Prototype | Optimisation de la boucle Bresenham étendue pour la réduction d'erreurs d'arrondi DST. |

---

## 4. Feuille de Route de Convergence d'Ingénierie (Roadmap 2026-2027)

```
2026 Q3 : Stabilisation Géométrique et Topologique (Sprints S1 & S2)
   ├── Geometry Engine v2.0 (Suppression des biais directionnels et splines adoucies)
   └── Topology Engine v1.0 (100% de conservation des trous et contreformes du Golden Dataset)

2026 Q4 : Reconstruction de Rubans & Génération de Points (Sprints S3, S4 & S5)
   ├── Ribbon Engine v1.0 (Reconstruction d'axes médians sur géométrie stable)
   └── Stitch Compiler v1.0 (Intégration du Tatami v2 et du Satin v2)

2027 Q1 : Optimisation Kinématique, Physique & Compilation (Sprints S6 & S7)
   ├── Travel Engine v1.0 (Solveur TSP-PC pour réduction active de 25% des coupes)
   └── Physics Engine v1.0 (Compensation asymétrique de déformation matière active)
```
