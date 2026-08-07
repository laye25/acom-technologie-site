# Fiche Innovation AEE-001 : Consolidation Topologique des Régions

**Réf. Protocole : ASVP / APIF - Étape 1 (Priorité Absolue)**
**Pilier Architecture : Pilier 1 - AEE Foundation**
**Module Cible : `VectorizationPipelineService.ts` (Phase Post-Segmentation)**
**Diagnostic Technique préalable : [Diagnostic Technique AEE-001 (Validé)](./AEE-001-diagnostic-technique.md)**
**Règle ASVP-07 (Isolation Fonctionnelle) : Fonction unique ciblée `consolidateTopologicalRegions()`**

---

## 1. Description Synthétique
* **Origine** : Analyse des algorithmes de réduction de bruit VTracer.
* **Problème Résolu** : Micro-fragments, poussières de segmentation, micro-trous provoquant des sauts de fil intempestifs et des ruptures de trajectoire Tatami en broderie.
* **Anomalie Factuelle Rapprochée** : Présence constatée de centaines de micro-polygones isolés $< 10 \text{ px}^2$ sur les logos complexes du Golden Dataset, générant des points d'arrêt inutilement coûteux sur machine.

---

## 2. Statut de Maturité, Risque & Dépendances

### Statut de Maturité (ASVP Lifecycle)
- [x] **Étudié**
- [x] **Prototype**
- [ ] **Implémenté**
- [ ] **Validé Golden Dataset**
- [ ] **Certifié Production**

### Évaluation du Risque de Régression
* **Niveau de Risque** : **★☆☆☆☆ (Faible)**
* **Impact Topologique** : Très bénéfique (assainit la topologie).
* **Point d'Attention** : Préserver les petits détails légitimes (ex: points sur les 'i' ou yeux) via le seuil d'aire résonnée $\tau_{area}$.

### Dépendances Préalables Stricte
* **Requiert** : [**AEE-000 (Instrumentation & Benchmark Baseline)**](./AEE-000-instrumentation-benchmark.md) au statut **Implémenté**.

---

## 3. Algorithmique : Fusion Adjacente Maximale (Vs Suppression Simple)
* **Approche VTracer** : Élimination directe des régions sous un certain seuil.
* **Approche AEE-001 (Consolidation Intelligente)** :
  1. Identifier les micro-régions $R_{micro}$ ($A < \tau_{area}$).
  2. Parcourir le graphe de frontière topologique $\partial R_{micro}$.
  3. Déterminer la région voisine $R_{neighbor}$ partageant la plus grande longueur de frontière commune :
     $$L_{shared} = \max_{j} \text{Length}(\partial R_{micro} \cap \partial R_j)$$
  4. Fusionner la micro-région avec $R_{neighbor}$ en lui attribuant sa couleur et en combinant leurs polygones.
  5. Ne supprimer une région sans fusion que si aucune adjacence géométrique n'existe.

---

## 4. Critères d'Acceptation & KPIs Mesurables
L'innovation AEE-001 sera validée si et seulement si :
* **Réduction des Micro-fragments** : Diminution de $\ge 40\%$ du nombre de régions avec $A < 15 \text{ px}^2$.
* **Zéro Création de Trous** : $N_{holes\_new} \le N_{holes\_baseline}$.
* **Conservation de Surface** : Dérive de surface totale $< 1.0\%$.
* **Aucune Régression Golden Dataset** : Score de fidélité $GFI \ge 98.5\%$.
* **Impact Performance** : Temps de calcul additionnel $\le +10\%$.
