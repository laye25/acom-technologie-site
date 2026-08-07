# ADR-016 : Protocole de Validation Scientifique et Intégration Algorithmique dans le Moteur de Vectorisation AEE (ASVP / APIF)

* **Statut** : Designed & Approved / Validé (Conformité Règle 52 - AGENTS.md Level 1)
* **Date** : 6 Août 2026
* **Décideurs** : Chief Scientist, Build Guardian, Audit Center, Équipe Ingénierie Textile AEE
* **Moteur Cible** : Acom Embroidery Engine (AEE) - `VectorizationPipelineService`

---

## Context & Problem Statement

Le moteur de vectorisation de l'AEE rencontrait plusieurs verrous géométriques et topologiques lors du traitement de certains visuels complexes :
- Fragmentation excessive des régions SVG et présence de micro-fragments/poussières de couleur ;
- Micro-trous et espaces vides (*gapping*) entre régions adjacentes provoquant des décalages sous la tension physique des fils de broderie ;
- Effet de facettage ou perte des coins vifs sur la typographie et les détails fins ;
- Densité excessive de nœuds inutiles surchargeant le calcul de trajectoire machine.

L'étude du projet open-source `visioncortex/vtracer` a mis en lumière des avancées théoriques et pratiques remarquables (Clustering Watershed, Stacking Hiérarchique, Subdivision à 4 points, Splice Points, Bézier Fitting).

Une question clé d'ingénierie se posait : **Comment faire évoluer le moteur propriétaire AEE en tirant parti de ces innovations algorithmiques sans altérer son architecture, sans utiliser VTracer comme boîte noire et sans risquer de régressions ?**

---

## Decision Drivers

1. **Règle 40 & 50** : Le moteur AEE est un produit et une plateforme autonome CAD/CAM. Il doit rester 100% propriétaire et sous contrôle strict.
2. **Architecture Immuable** : Le pipeline `Image -> VectorizationPipelineService -> SvgTopologyGraphBuilder -> SemanticObjectAssemblyEngine -> EmbroideryPlanningEngine -> StitchGenerator -> DST` ne doit pas être altéré.
3. **Règle d'Anomalie Réelle** : Toute innovation doit obligatoirement répondre à une anomalie avérée et documentée sur le Golden Dataset ou sur un cas textile réel.
4. **Règle 53 & 54** : Toute modification doit être mesurable scientifiquement sur le Golden Dataset de référence selon des critères d'acceptation quantitatifs (KPIs).
5. **Ordre Naturel des Problèmes** : Les défauts doivent être traités dans l'ordre d'apparition au sein du pipeline (Instrumentation ➔ Régions/Topologie D'ABORD ➔ Lissage des Courbes ENSUITE).

---

## Decided Option: Protocole ASVP / APIF (AEE Scientific Validation Protocol)

Nous adoptons le **Protocole de Validation Scientifique AEE (ASVP)** reposant sur :

### 1. La Règle d'Or d'Intégration
> **1 Innovation → 1 Implémentation Iso-Modulaire → 1 Mesure Baseline (Étape 0) → 1 Comparaison Quantitative sur Golden Dataset → Validation ou Rollback Immédiat.**

### 2. La Feuille de Route Séquentielle (Étape 0 à 6)
- **Étape 0** : Instrumentation & Benchmark Baseline (AEE-000).
- **Étape 1 (AEE-001)** : Consolidation Topologique des Régions (Fusion intelligente avec la région voisine ayant la plus grande frontière commune).
- **Étape 2 (AEE-002)** : Clustering Watershed Adaptatif (Segmentation haute fidélité).
- **Étape 3 (AEE-003)** : Stacking Hiérarchique (Anti-gapping inter-couleurs pour la broderie).
- **Étape 4 (AEE-004)** : Détection des Splice Points (Protection des angles vifs et des détails).
- **Étape 5 (AEE-005)** : Subdivision à 4 Points (Lissage continu des surfaces).
- **Étape 6 (AEE-006)** : Bézier Fitting Adaptatif (Optimisation du nombre de nœuds et fluidité machine).

### 3. La Bibliothèque Dédiée des Innovations (`docs/architecture/innovations/`)
Chaque innovation possède sa propre fiche modulaire répertoriant :
- Son échelle de maturité (Étudié / Prototype / Implémenté / Validé / Certifié) ;
- L'anomalie factuelle rapprochée ;
- L'algorithmique VTracer vs AEE ;
- Les critères d'acceptation et KPIs mesurables.

---

## Status & Compliance

- **Compilation TypeScript** : 100% Verte (`npm run lint`).
- **Conformité Charte Level 1** : Respect strict des règles 40, 50, 51, 52, 53, 54, 60, 63, 64 d'AGENTS.md.
- **Référence Complète Document d'Architecture** : `/docs/architecture/AEE_Scientific_Validation_Protocol_ASVP.md`.
- **Répertoire des Innovations** : `/docs/architecture/innovations/INDEX.md`.
