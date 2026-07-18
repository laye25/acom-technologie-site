# Architecture: BenchmarkRunner & Continuous Regression Engine
**Maturité (Règle 52) :** Designed  

Ce document spécifie l'architecture, le cycle d'exécution et les contrats de données du **BenchmarkRunner** d'ATCP. Ce composant est chargé de charger de manière asynchrone les 1000 motifs de référence du **Golden Dataset**, d'évaluer la précision de chaque moteur du pipeline et d'éditer le rapport de non-régression à chaque commit.

---

## 1. Vue d'Ensemble & Cycle de Vie du Runner

Le **BenchmarkRunner** s'exécute localement dans le cadre du **Offline Research Mode** ou au sein de notre pipeline de validation continue. Il est totalement décorrélé des frameworks graphiques (React) et des infrastructures réseau externes.

```
                  ┌──────────────────────────────────────┐
                  │   Chargement du Golden Dataset       │
                  │   (1000 fichiers de motifs SVG/ATIR) │
                  └──────────────────┬───────────────────┘
                                     │
                                     ▼
                  ┌──────────────────────────────────────┐
                  │      Exécution du Pipeline AEE       │
                  │     (Geometry -> Topology -> ...)   │
                  └──────────────────┬───────────────────┘
                                     │
                                     ▼
                  ┌──────────────────────────────────────┐
                  │    Calcul des Métriques Physiques    │
                  │     (Hausdorff, Euler, Trims, SEI)   │
                  └──────────────────┬───────────────────┘
                                     │
                                     ▼
                  ┌──────────────────────────────────────┐
                  │    Comparaison aux seuils de l'ID    │
                  │    (expected.atir vs current.atir)   │
                  └──────────────────┬───────────────────┘
                                     │
            ┌────────────────────────┴────────────────────────┐
            ▼ [Régression détectée ou Seuil violé]            ▼ [Succès 100% sans Régression]
  ┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
  │         Verdict: ROUGE (REJET)        │       │         Verdict: VERT (SUCCÈS)        │
  │  (Rapport d'écarts & base de pannes)  │       │   (Rapport HTML complet & Benchmarks) │
  └───────────────────────────────────────┘       └───────────────────────────────────────┘
```

---

## 2. Définition Mathématique et Algorithmique des Validateurs

### A. Calculateur de la Distance de Hausdorff ($H(A, B)$)
Pour valider la fidélité géométrique de la reconstruction, le runner calcule la distance de Hausdorff bidimensionnelle entre l'ensemble des points du contour original $A$ et l'ensemble des points des trajectoires générées $B$ :
$$H(A, B) = \max \left\{ \sup_{a \in A} \inf_{b \in B} d(a, b),\, \sup_{b \in B} \inf_{a \in A} d(a, b) \right\}$$
Où $d(a, b)$ est la distance euclidienne standard en $\mathbb{R}^2$. Le moteur de géométrie rejette tout tracé où $H(A, B) > 0.05\text{ mm}$.

### B. Index de Préservation Topologique (**TPI**)
L'analyse topologique compare l'arbre d'inclusion des cycles de frontières du dessin original ($T_{orig}$) et de la broderie produite ($T_{prod}$).
*   **$TPI = 100\%$** : Le graphe d'inclusion est isomorphe ($T_{orig} \simeq T_{prod}$) et la caractéristique d'Euler-Poincaré globale $\chi$ est strictement conservée pour chaque sous-composante fermée.
*   **$TPI < 100\%$** : Une contreforme a été masquée ou un trou d'exclusion a fusionné avec le fond.

### C. Index d'Efficience Machine (**SEI**)
Le runner mesure le ratio entre la longueur de fil utile consommée par les points de broderie ($L_{stitch}$) et la longueur totale parcourue par la tête d'impression, sauts de saut (Jump Stitches) et déplacements d'arrêt compris ($L_{total}$) :
$$SEI = \frac{L_{stitch}}{L_{stitch} + L_{jump}} \times 100$$
L'optimiseur de parcours s'assure d'obtenir $SEI \ge 98.0\%$.

---

## 3. Schéma JSON du Rapport Métrique (`metrics.json`) et Scores Individuels

Chaque évaluation produit une archive sémantique d'indicateurs et de scores détaillés par moteur pour refléter l'efficacité physique et algorithmique :

```json
{
  "motifId": "PAT_0001",
  "engineVersion": {
    "geometry": "2.0.0",
    "topology": "1.0.0",
    "ribbon": "1.0.0",
    "tatami": "2.0.0",
    "satin": "2.0.0",
    "travel": "1.0.0",
    "physics": "1.0.0",
    "machine": "1.0.0"
  },
  "scores": {
    "geometryScore": 99.4,
    "topologyScore": 100.0,
    "ribbonScore": 98.7,
    "tatamiScore": 96.2,
    "travelScore": 98.1,
    "physicsScore": 97.5,
    "machineScore": 99.9,
    "overallScore": 98.54
  },
  "metrics": {
    "geometry": {
      "gfi": 99.82,
      "hausdorffDistanceMm": 0.012,
      "invalidPointsCount": 0,
      "duplicatePointsCount": 0
    },
    "topology": {
      "tpi": 100.0,
      "eulerCharacteristic": 1,
      "missedHoles": 0
    },
    "stitch": {
      "totalStitchCount": 12840,
      "densityOk": true,
      "averageLengthMm": 2.4,
      "outOfBoundsPoints": 0
    },
    "travel": {
      "sei": 98.92,
      "trims": 4,
      "totalJumps": 12,
      "estimatedMachineTimeSeconds": 312
    }
  },
  "verdict": "GREEN",
  "timestamp": "2026-07-12T16:11:00Z"
}
```

---

## 4. Génération de la Comparaison Visuelle Automatique (Règle 65)

Le **BenchmarkRunner** ne se limite pas à l'analyse binaire et numérique. En application stricte de la **Règle 65**, il génère automatiquement pour chaque écart ou à des fins d'inspection visuelle systématique un rapport d'images comparatif structuré sous forme de planche de contrôle (Control Sheet) comprenant :

1. **Reference** : Le contour original ou le rendu physique théorique attendu.
2. **Generated** : Le rendu visuel de la broderie ou de la trame simulée après exécution.
3. **Overlay** : Superposition exacte par canal alpha des deux tracés pour localiser les glissements de trajectoire.
4. **Difference Heatmap** : Carte thermique d'écarts de distance de Hausdorff locale (échelle de couleurs froides à chaudes pour les déformations $\ge 0.05\text{ mm}$).
5. **Curvature Map** : Visualisation locale du tenseur de courbures et d'adoucissement C¹/C² des splines.
6. **Topology Map** : Graphe de régions (Region Graph) identifiant les évidements de trous (Winding) et la hiérarchie d'îlots parent-enfant.
7. **Ribbon Map** : Tracé géométrique de l'axe médian (Medial Axis) et de l'épaisseur variable des colonnes Satin.
8. **Metrics & Verdict Block** : Rappel des scores clés d'ingénierie (**Geometry Score**, **Topology Score**, **Overall Score**) et verdict automatisé (PASS/FAIL) avec journalisation des régressions.

