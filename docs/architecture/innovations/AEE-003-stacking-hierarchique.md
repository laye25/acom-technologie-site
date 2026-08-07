# Fiche Innovation AEE-003 : Stacking Hiérarchique Anti-Gapping

**Réf. Protocole : ASVP / APIF - Étape 3**
**Pilier Architecture : Pilier 2 - AEE Geometry & Topology**
**Module Cible : `SvgTopologyGraphBuilder.ts` & `VectorizationPipelineService.ts`**

---

## 1. Description Synthétique
* **Origine** : Stratégie de superposition (Stacking) de VTracer.
* **Problème Résolu** : Espaces vides (*gapping*) entre deux couleurs adjacentes lors de la rétraction physique du tissu sous la tension des fils de broderie.
* **Anomalie Factuelle Rapprochée** : Écartements visibles (tissu à nu) entre les zones remplies en Tatami et les bordures Satin sur les logos textiles testés en atelier.

---

## 2. Statut de Maturité, Risque & Dépendances

### Statut de Maturité (ASVP Lifecycle)
- [x] **Étudié**
- [ ] **Prototype**
- [ ] **Implémenté**
- [ ] **Validé Golden Dataset**
- [ ] **Certifié Production**

### Évaluation du Risque de Régression
* **Niveau de Risque** : **★★★☆☆ (Moyen)**
* **Impact Topologique** : Élevé (création de sous-couches de chevauchement).
* **Point d'Attention** : Contrôler l'épaisseur des chevauchements pour éviter les surdensités de fil ou la rigidification du tissu.

### Dépendances Préalables Stricte
* **Requiert** : [**AEE-001**](./AEE-001-consolidation-topologique.md) et [**AEE-002**](./AEE-002-clustering-watershed.md) au statut **Validé Golden Dataset**.

---

## 3. Algorithmique : Empilement Hiérarchique & Recouvrement Structural
* **Inspiration VTracer** : Découpage des formes sans trous sous-jacents, ordonnées par surface décroissante (formes d'arrière-plan pleines, détails superposés).
* **Adaptation Textile AEE** :
  1. Trier les régions par hiérarchie d'inclusion et par surface.
  2. Étendre les formes de fond d'un sous-millimètre (*pull-compensation structural*) sous les formes d'avant-plan.
  3. Générer un chevauchement garanti d'au moins 2 à 4 rangées de points.

---

## 4. Critères d'Acceptation & KPIs Mesurables
L'innovation AEE-003 sera validée si et seulement si :
* **Élimination du Gapping Inter-Couleurs** : $0 \text{ px}$ de vide ou de sous-couche apparente sur les contours tangents.
* **Continuité Topologique** : Taux d'intersection contrôlé entre $0.2 \text{ mm}$ et $0.5 \text{ mm}$.
* **Aucune Surdensité Destructive** : Épaisseur d'empilement maximale $\le 2$ couches de fil.
* **Validation Physique Simulateur** : Zéro déchirement du tissu sous le simulateur physique de broderie (`PhysicsEngine`).
