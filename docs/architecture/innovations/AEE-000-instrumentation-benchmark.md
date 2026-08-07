# Fiche Innovation AEE-000 : Instrumentation & Benchmark Baseline

**Réf. Protocole : ASVP / APIF - Étape 0**
**Module Cible : `src/core/benchmark/` & `VectorizationPipelineService.ts`**

---

## 1. Description Synthétique
* **Origine** : Cadre Métrologique AEE / Golden Dataset.
* **Problème Résolu** : Absence de métriques quantitatives automatisées avant toute modification du pipeline vectoriel.
* **Anomalie Factuelle Rapprochée** : Impossible de mesurer si une optimisation réduit la fragmentation ou dégrade la surface sans inspection visuelle manuelle.

---

## 2. Statut de Maturité (ASVP Lifecycle)
- [x] **Étudié**
- [x] **Prototype**
- [x] **Implémenté**
- [ ] **Validé Golden Dataset**
- [ ] **Certifié Production**

---

## 3. Critères d'Acceptation & KPIs Mesurables
Une modification du pipeline vectoriel sera mesurée selon les critères AEE-000 suivants :
* **Définition Automatique du Profil Baseline** : Calcul automatique des 10 indicateurs pour chaque SVG généré.
* **Métrique $N_r$ (Régions)** : Compte total des régions géométriques.
* **Métrique $N_v$ (Sommets)** : Compte total des nœuds/sommets SVG.
* **Métrique $A_{micro}$ (Fragments)** : Compte des polygones $A < 12 \text{ px}^2$.
* **Métrique $N_{holes}$ (Trous)** : Compte des trous/vides internes.
* **Indice de Fragmentation ($IF$)** : $IF = N_r / \text{Surface Total}$.
* **Dérive Géométrique ($GFI$)** : Variation de surface $< 0.5\%$.
* **Temps de Calcul ($\Delta t$)** : Temps de vectorisation total en ms.

---

## 4. Spécifications Technique AEE
Ajout d'un rapporteur de métrologie vectorielle dans `VectorizationPipelineService.ts` envoyant ses résultats au `BenchmarkRunner` et enregistrant la baseline dans `benchmark-history/`.
