# Spécification Technique : Region Segmentation Analyzer (Outillage AEE-002)

**Composant d'Analyse Métrologique - Region Segmentation Engine**
**Cadre de Gouvernance : ASVP v1.0 & Règle 53 (Toute modification doit être mesurable)**
**Écosystème : Acom Embroidery Engine (AEE)**

---

## 1. Rôle du Region Segmentation Analyzer

Le **Region Segmentation Analyzer** est l'outil métrologique amont conçu pour évaluer la qualité d'une image matricielle ou vectorisée *avant* et *après* l'application de l'algorithme Watershed (`AEE-002`).

Il permet d'éliminer toute appréciation visuelle subjective en produisant une carte de gradient matriciel et un rapport quantitatif précis.

---

## 2. Indicateurs Mesurés par l'Analyzer

1. **Décompte des Régions ($N_{regions}$)** : Nombre total de sous-régions disjointes extraites.
2. **Indice d'Oscillation de Contour ($BOI$ - Boundary Oscillation Index)** :
   $$BOI = \frac{1}{M} \sum_{i=1}^{M} |\theta_{i+1} - \theta_i|$$
   Mesure la rugosité / frange d'anti-aliasing sur les bordures de polygones.
3. **Ratio de Micro-Régions Parasites ($R_{micro}$)** :
   Proportion de régions isolées ayant une surface $A < 20\text{ px}^2$.
4. **Carte de Gradient CIELAB ($G_{map}$)** :
   Matrice de magnitude du gradient de couleur perceptuel, identifiant les vraies crêtes géométriques.

---

## 3. Workflow de Comparaison Métrologique

```
 [ Image Brute (Raster) ]
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 1. Region Segmentation Analyzer (Pass-1 : Baseline)   │
│    ➔ Génération de G_map & Rapport de métriques Brutes│
└────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Traitement Watershed Adaptatif (AEE-002)            │
│    ➔ Inondation topographique & lissage de frontière  │
└────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Region Segmentation Analyzer (Pass-2 : Traité)     │
│    ➔ Génération du Rapport Comparatif Avant / Après   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Statut d'Ingénierie pour AEE-002

* **Statut Scientifique** : **PRÊT À DÉMARRER**
* **Statut Développement** : **Non commencé (Outillage Analyzer Spécifié)**
* **Garde-Fou ASVP** : L'implémentation du code Watershed dans le `Region Segmentation Engine` ne démarrera qu'après validation de l'harnais d'analyse par le `BenchmarkRunner`.
