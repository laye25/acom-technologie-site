# Protocole de Validation Scientifique & Feuille de Route d'Évolution AEE (ASVP / APIF)
**Document d'Architecture et de Conception Ingénierie Textile CAD/CAM**
**Statut : ASVP v1.0 - GELÉ / FROZEN (Sanctuarisé Règle 52 - AGENTS.md Level 1)**
**Version Protocol : 1.0.0 (Sanctuarisé pour AEE-001 à AEE-006 - Aucune modification ultérieure du protocole)**
**Écosystème : Acom Embroidery Engine (AEE) - Acom Technologie**

---

## 1. Vision Stratégique & Principes Fondateurs

Le présent document définit la méthodologie officielle d'analyse, d'expérimentation et d'intégration sélective des innovations algorithmiques au sein du moteur propriétaire de vectorisation de l'**Acom Embroidery Engine (AEE)**.

### 1.1 Objet
L'objectif est d'étudier les avancées algorithmiques du projet de référence open-source `visioncortex/vtracer` afin d'en extraire les principes mathématiques et topologiques pertinents, pour faire évoluer notre propre moteur de vectorisation AEE.

### 1.2 Règle d'Anomalie Factuelle Réelle (Règle Préalable Obligatoire)
> **Toute nouvelle innovation doit obligatoirement être justifiée par une anomalie géométrique, topologique ou physique observée et documentée sur le Golden Dataset ou sur un cas réel de broderie.**
>
> Aucune théorie ou algorithme ne peut être développé ou intégré sans la constatation préalable d'un défaut concret à corriger.

### 1.3 Limites d'Exécution & Invariants d'Architecture (Règles Fondamentales)
1. **Aucun Remplacement de Moteur** : VTracer ne sera **jamais** intégré comme « boîte noire », ni comme dépendance externe binaire/WASM autonome dans le pipeline de production.
2. **Conservation à 100% de l'Architecture AEE** : L'enchaînement des couches métier reste strictement immuable :
```
Image Source (Raster)
       │
       ▼
VectorizationPipelineService  <─── [Chantier d'Optimisation Algorithmique ASVP]
       │
       ▼
SvgTopologyGraphBuilder
       │
       ▼
SemanticObjectAssemblyEngine
       │
       ▼
EmbroideryPlanningEngine
       │
       ▼
StitchGenerator (Tatami / Satin / Fill)
       │
       ▼
Compilation Machine (DST / PES)
```
3. **Règle d'Or de l'AEE Evolution Protocol (AEP / APIF)** :
> **1 Innovation → 1 Implémentation Iso-Modulaire → 1 Mesure Benchmark Baseline (Étape 0) → 1 Comparaison Quantitative sur Golden Dataset → Validation ou Rollback Immédiat.**

---

## 2. Le Protocole ASVP (AEE Scientific Validation Protocol)

Afin de garantir une stabilité industrielle absolue et prévenir toute régression géométrique ou topologique (Règles 51, 53 et 64 d'AGENTS.md), toute évolution suit le protocole en 5 phases :

1. **Identification du Symptôme Physico-Textile & Diagnostic Technique Obligatoire** : Documenter la défaillance observée sur les motifs de broderie (ex: micro-fragments, gapping inter-couleurs, rupture de Tatami) et rédiger un **Diagnostic Technique** préalable démontrant la cause exacte, le module/fonctions responsables, les cas limites et l'origine factuelle du défaut avant de coder la moindre ligne.
2. **Modélisation Théorique & Fiche Innovation AEE-xxx** : Rédiger la fiche normalisée dans `docs/architecture/innovations/` spécifiant l'algorithme, la complexité, le module cible et les critères d'acceptation mesurables.
3. **Implémentation Expérimentale Isolée** : Développer l'algorithme sous forme de passe d'optimisation pure sans effet de bord sur le graphe topologique.
4. **Qualification Quantifiée (Étape 0)** : Exécuter le benchmark sur le Golden Dataset et calculer l'impact précis sur les métriques clés.
5. **Arbitrage du Validation Board (Conseil de Validation)** : L'innovation est soumise aux 5 critères obligatoires de validation industrielle avant tout passage en production (voir Section 3.1).
6. **Gel de l'Innovation (Frozen State v1.0)** : Une fois certifiée en production, l'innovation est gelée en lecture seule pour sanctuariser l'intégrité du moteur.

---

## 3. Échelle des Niveaux de Maturité & Validation Board

Chaque fiche d'innovation répertoriée dans le dossier [`innovations/`](./innovations/INDEX.md) arbore son état de maturité dynamique selon la grille suivante :

- [ ] **Étudié** : Analyse de l'état de l'art, formalisation mathématique et problème métier identifié.
- [ ] **Prototype** : Code d'expérimentation isolé dans le laboratoire de recherche (`aee-research`).
- [ ] **Implémenté** : Code de production intégré dans `VectorizationPipelineService` ou `CurveReconstructionEngine`.
- [ ] **Validé Golden Dataset** : Test de non-régression à 100% vert avec critères quantitatifs respectés.
- [ ] **Certifié Production (Gelé v1.0)** : Validation formelle par le Validation Board et déploiement sanctuarisé.

### 3.1 Les 5 Critères Obligatoires du Validation Board
Pour basculer du statut **Validé Golden Dataset** au statut **Certifié Production (Gelé v1.0)**, une innovation doit valider 100% des 5 critères suivants :

1. **Compilation & Quality Gate** : 100% vert sur `npm run lint` et `compile_applet` sans avertissement.
2. **Golden Dataset Non-Regression** : Indice $GFI \ge 98.5\%$ et 0 régression géométrique/topologique sur les 1 000 motifs.
3. **Performance & CPU Budget** : Surcoût de temps de calcul strictement conforme à l'enveloppe autorisée ($\le +10\%$).
4. **Absence de Régression Physique** : Métriques de broderie (fils, sauts, densité, pas) maintenues ou améliorées.
5. **Validation Visuelle de Conformité** : Accord formel sur la carte de différence (*Difference Heatmap*) et les rendus superposés (*Overlay Comparison*).

### 3.2 Règle du Gel des Innovations (Frozen State)
> **Une fois certifiée en production (Version 1.0), une innovation est déclarée GELÉE.**
>
> Il est strictly interdit d'y apporter des retouches cosmétiques ou des micro-optimisations opportunistes. Toute modification ultérieure d'un module gelé exige l'ouverture d'un nouveau ticket d'anomalie documenté et la création d'une nouvelle version de la fiche d'innovation (ex: v1.1 avec ADR dédié).

### 3.3 Règle ASVP-07 : Isolation Fonctionnelle Stricte ("Une Innovation = Une Fonction")
> **Pour chaque innovation, une seule et unique fonction de production peut être modifiée ou introduite dans le module cible.**
>
> Toutes les autres fonctions du pipeline restent en lecture seule. Toute modification secondaire ou collatérale d'une deuxième fonction exige une justification technique démontrée et l'accord explicite du Validation Board.

### 3.4 Rapport Comparatif Automatisé Avant / Après
> Avant toute soumission au Validation Board, le `BenchmarkRunner` doit générer un rapport comparatif automatisé mesurant rigoureusement les métriques d'exécution :
> - **Avant (Baseline)** : Nombre de micro-fragments, trous, régions totales, dérive géométrique ($GFI$), temps CPU ($ms$).
> - **Après (Prototype)** : Nombre de micro-fragments, trous, régions totales, dérive géométrique ($GFI$), temps CPU ($ms$).
> - **Deltas Quantitatifs (%)** : Variations relatives pour chaque indicateur du Golden Dataset.

### 3.5 Critère d'Arrêt Immédiat ("Stop Criteria")
> **Si un seul KPI critique régresse au-delà des tolérances admises (ex: augmentation du nombre de trous, baisse du score $GFI < 98.5\%$, surcoût CPU $> +10\%$) :**
> 1. Arrêt immédiat des développements sur la branche.
> 2. Rollback automatique vers la version certifiée précédente.
> 3. Refus formel de l'innovation par le Validation Board jusqu'à la production d'un nouveau diagnostic technique.

---

## 4. Feuille de Route Séquentielle Optimisée (Étape 0 à 6)

Contrairement aux approches axées d'abord sur le lissage des courbes, le protocole ASVP traite les défauts dans leur ordre d'apparition naturel au sein du pipeline : **Instrumentation ➔ Régions ➔ Segmentation ➔ Topologie ➔ Angles ➔ Courbes ➔ Trajectoire Machine**.

```
[ Étape 0 ] Instrumentation & Benchmark Baseline (AEE-000)
     │
     ▼
[ Étape 1 ] Consolidation Topologique (AEE-001)   ────► Fusion intelligente micro-fragments & trous
     │
     ▼
[ Étape 2 ] Clustering Watershed Adaptatif (AEE-002) ──► Segmentation haute fidélité & anti-bruit
     │
     ▼
[ Étape 3 ] Stacking Hiérarchique (AEE-003)       ────► Anti-gapping & recouvrement inter-couleurs
     │
     ▼
[ Étape 4 ] Détection Splice Points (AEE-004)    ────► Conservation des angles vifs & lettres
     │
     ▼
[ Étape 5 ] Subdivision 4 Points (AEE-005)       ────► Lissage continu préservant les surfaces
     │
     ▼
[ Étape 6 ] Bézier Fitting Adaptatif (AEE-006)   ────► Minimisation des nœuds & trajectoire fluide
```

---

## 5. Sommaire des Fiches d'Innovation Algorithmique (Bibliothèque AEE)

L'intégralité des spécifications et des critères d'acceptation est accessible dans le répertoire dédié [`docs/architecture/innovations/`](./innovations/INDEX.md) :

1. [**AEE-000 : Instrumentation & Benchmark Baseline**](./innovations/AEE-000-instrumentation-benchmark.md) — Statut : **Implémenté**
2. [**AEE-001 : Consolidation Topologique des Régions**](./innovations/AEE-001-consolidation-topologique.md) — Statut : **Prototype** (Fusion intelligente adjacente)
3. [**AEE-002 : Clustering Watershed Adaptatif**](./innovations/AEE-002-clustering-watershed.md) — Statut : **Étudié**
4. [**AEE-003 : Stacking Hiérarchique Anti-Gapping**](./innovations/AEE-003-stacking-hierarchique.md) — Statut : **Étudié**
5. [**AEE-004 : Détection des Splice Points**](./innovations/AEE-004-detection-splice-points.md) — Statut : **Étudié**
6. [**AEE-005 : Subdivision à 4 Points**](./innovations/AEE-005-subdivision-4-points.md) — Statut : **Étudié**
7. [**AEE-006 : Bézier Fitting Adaptatif**](./innovations/AEE-006-bezier-fitting-adaptatif.md) — Statut : **Étudié**

---

## 6. Approbation & Engagement de Conformité

Le présent cadre méthodologique (**AEE Scientific Validation Protocol - ASVP**) constitue la référence obligatoire pour tous les développements de vectorisation au sein du projet Acom Technologie. Toute soumission de code doit valider la chaîne de build, respecter la stricte séparation des couches et démontrer un gain mesurable sur le Golden Dataset.
