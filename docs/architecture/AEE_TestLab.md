# Acom Embroidery Engine (AEE) - Laboratoire d'Ingénierie Textile (AEE Test Lab)
**Maturité (Règle 52) :** Designed  

L'**AEE Test Lab** est la pièce maîtresse du processus d'assurance qualité et d'ingénierie d'Acom Technologie. Ce laboratoire n'est pas un simple répertoire de tests, c'est un environnement d'évaluation d'ingénierie textile automatisé composé de sous-laboratoires hautement spécialisés et piloté par une équipe d'agents IA experts.

---

## 1. Organisation du Laboratoire (The Specialized Sub-Labs)

L'AEE Test Lab est divisé en sept départements de validation, chacun se concentrant sur un aspect critique de l'ingénierie CAD/CAM :

```
                                  ┌────────────────────────┐
                                  │      AEE Test Lab      │
                                  └───────────┬────────────┘
         ┌───────────────┬────────────────────┼───────────────┬───────────────┐
         ▼               ▼                    ▼               ▼               ▼
  ┌────────────┐  ┌────────────┐       ┌────────────┐  ┌────────────┐  ┌────────────┐
  │  Geometry  │  │  Topology  │       │   Travel   │  │   Physics  │  │   Export   │
  │    Lab     │  │    Lab     │       │    Lab     │  │    Lab     │  │    Lab     │
  └────────────┘  └────────────┘       └────────────┘  └────────────┘  └────────────┘
```

### A. Geometry Lab
- **Mission** : Validation rigoureuse de l'exactitude des transformations géométriques vectorielles.
- **Protocoles** :
  - Vérification de la continuité des tangentes et de la fidélité des approximations Bézier.
  - Détection des points aberrants (NaN, infinis, répétitions de coordonnées à moins de $0.05\text{ mm}$).
  - Tests de décomposition de polygones en formes convexes pour le remplissage Tatami.

### B. Topology Lab (Acom Ribbon)
- **Mission** : Contrôle des structures de données topologiques, des squelettes et des graphes de connexité.
- **Protocoles** :
  - Vérification de l'intégrité du diagramme de Voronoi et de la triangulation de Delaunay.
  - Validation du coefficient d'élagage des branches mineures (Pruning) pour obtenir un axe médian unique et propre.
  - Contrôle du parallélisme des rails gauche et droit pour la numérisation en Satin.

### C. Stitch Lab (Tatami, Satin & Running)
- **Mission** : Validation de la génération physique des points de broderie.
- **Protocoles** :
  - Vérification de la régularité de la densité ($0.42\text{ mm}$ nominal sur Tatami).
  - Contrôle du fanning dans les courbes Satin (mise en œuvre des points courts pour réduire la densité intérieure).
  - Analyse de l'espacement des lignes et de l'offset fractionnaire pour éviter l'alignement visuel indésirable des points.

### D. Travel Lab (TSP-PC Optimizer)
- **Mission** : Optimisation des trajectoires hors-broderie, réduction des temps morts et de l'usure machine.
- **Protocoles** :
  - Validation du regroupement strict par couleur (interdiction des sauts de couleur superflus).
  - Analyse du graphe d'ordonnancement pour minimiser la distance de déplacement.
  - Validation des chemins de déplacement masqués (Running stitches insérés sous les couches de couverture).

### E. Physics Lab (Acom Phys)
- **Mission** : Simulation et correction des déformations tridimensionnelles du textile (Push-Pull).
- **Protocoles** :
  - Évaluation de l'efficacité du solveur inverse de Newton-Raphson pour adapter la forme vectorielle source.
  - Vérification de la marge de sécurité et du chevauchement de compensation d'étirement selon les profils de matières.

### F. Export Lab (Binary Backend Validation)
- **Mission** : Contrôle de la conformité du code binaire produit par les backends de compilation (DST, PES, JEF).
- **Protocoles** :
  - Vérification bit-à-bit du format d'instruction Tajima Ternaire (.dst).
  - Validation des en-têtes binaires (nombre de points, changements de couleur, boîtes de délimitation).

### G. Performance & Regression Lab
- **Mission** : Benchmarking permanent et contrôle des performances computationnelles.
- **Protocoles** :
  - Mesure du temps d'exécution des algorithmes majeurs (limite stricte de $100\text{ ms}$ pour l'optimisation).
  - Analyse de la consommation mémoire sous charge importante ($100\ 000$ points et plus).

---

## 2. Rôles et Missions des Agents du Laboratoire (Lab AI Agents)

Pour assurer la rigueur d'exécution, une équipe d'agents IA spécialisés collabore au sein du laboratoire :

| Agent de Laboratoire | Mission Spécifique | Indicateur de Réussite |
| :--- | :--- | :--- |
| **Geometry Lab Agent** | Valide la fidélité géométrique et la conformité des tracés sources. | Zéro point NaN ou infini |
| **Ribbon Lab Agent** | Contrôle la reconstruction des rubans et des squelettes. | Connexité topologique de $100\%$ |
| **Stitch Lab Agent** | Valide la distribution des aiguilles et le respect de la densité. | Longueur de point $\le 4.0\text{ mm}$ |
| **Travel Lab Agent** | Optimise les déplacements et minimise le nombre de coupes (Trims). | Réduction de $30\%$ du fil perdu |
| **Physics Lab Agent** | Vérifie les compensations de distorsion et les profils tissus. | Alignement parfait des couches |
| **Export Lab Agent** | Compare les fichiers produits aux spécifications des fabricants. | Fichiers d'export $100\%$ lisibles |
| **Benchmark Lab Agent** | Exécute les jeux d'essais du Golden Dataset et détecte les régressions. | Score de non-régression de $100\%$ |
| **Cultural Lab Agent** | Évalue l'authenticité culturelle et sémantique des motifs traditionnels (Wax, Bogolan, Kente). | Index de fidélité patrimoniale de $100\%$ |
| **Numerical Analysis Agent** | Surveille l'accumulation des erreurs d'arrondi binaire et la robustesse des calculs flottants. | Dérive cumulative $\le 0.05\text{ mm}$ |
| **Computational Topology Agent** | Garantit la conservation de la caractéristique d'Euler et la détection d'exclusions de vides (trous). | Taux d'exclusion des trous de $100\%$ |
| **Scientific Reviewer Agent** | Comité de lecture interne qui vérifie la rigueur mathématique des théories et la répétabilité expérimentale. | Validation à $100\%$ des modèles théoriques |
| **Regression Scientist Agent** | Compare automatiquement l'exécution de la version $N$ vs. $N+1$ sur les 1000 motifs de référence du Golden Dataset. | Zéro régression acceptée sans arbitrage |
