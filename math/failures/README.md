# ATCP AEE Failure Database (AEE-FD)
**Maturité (Règle 52) :** Implemented  

Conformément à la **Règle 61 — Toute découverte devient une connaissance**, ce registre consigne l'ensemble des pannes géométriques, topologiques, physiques ou machine résolues au sein du compilateur ATCP. Cette base de connaissances sert de référence anti-régression absolue pour le **Regression Scientist Agent**.

---

## 1. Registre Historique des Incidents

| ID Incident | Date d'Observation | Nature de la Panne | Cause Racine | Correction Intégrée | Impact Qualité | Statut |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| **BUG_0001** | 2026-07-11 | Perte de la contreforme intérieure sur les glyphes de lettres (`A`, `B`, `O`, `P`) | Élagage topologique trop agressif et mauvaise orientation de courbe (Winding Direction) | Intégration du solveur par Indice d'Enroulement (Winding Number) et caractéristique d'Euler-Poincaré | **+12.0% TPI** | Validé |
| **BUG_0002** | 2026-07-12 | Dérive cumulative de coordonnées physiques sur le tracé de broderie ($>0.5\text{ mm}$) | Accumulation binaire des erreurs de conversion réels double-précision $\mathbb{R}$ vers octets entiers relatifs $\mathbb{Z}$ du format DST | Algorithme d'alignement par boucle de rétroaction à rétro-propagation (Bresenham étendu) | **Dérive $\le 0.05\text{ mm}$** | Validé |
| **BUG_0003** | 2026-07-12 | Auto-intersections locales et blocage du compilateur sur les angles vifs ($<30^\circ$) | Concentration infinie de points d'aiguille sur le point de rebroussement géométrique | Simplification locale adaptative de Douglas-Peucker et pivot par retrait d'angle (Mitering) | **+3.5% GFI** | Validé |

---

## 2. Fiches d'Analyse Normalisées

### 📝 Fiche Incident BUG_0001 : Perte de Contreforme (The "A" Letter Issue)
*   **Module concerné** : `Topology Engine` / `Satin Ribbon Reconstruction`
*   **Description du problème** : Lors de la squelettisation et de la segmentation des polices de caractères ou logos imbriqués, la contreforme (le trou au milieu de la lettre `A`) était comblée d'aiguilles, détruisant la lisibilité du motif.
*   **Analyse Physique & Topologique** : Le système de détection des frontières ne classifiait pas la profondeur d'enroulement topologique des courbes de manière hiérarchique.
*   **Mécanisme de Résolution** :
    1. Évaluation sémantique systématique du **Winding Number** pour chaque îlot géométrique.
    2. Calcul de la caractéristique d'Euler $\chi(\mathcal{M}) = V - E + F$ pour vérifier l'exactitude du genre $g$ (nombre de trous de la surface).
*   **Validation & Non-Régression** : Vérification sur 1000 motifs de référence du Golden Dataset. Score de conservation des trous à $100\%$ sur les alphabets de test.

---

### 📝 Fiche Incident BUG_0002 : Dérive Cumulative d'Arrondi Binaire (The Rounding Drift)
*   **Module concerné** : `Machine Compilation Lab` / `DST Backend`
*   **Description du problème** : Les motifs de grande taille (ex. $150\text{ mm} \times 150\text{ mm}$) présentaient un décalage physique de fin de broderie par rapport aux contours de base d'entrée.
*   **Analyse Mathématique** : Le format machine DST code les déplacements en dixièmes de millimètre relatifs entiers. L'arrondi naïf à chaque point `round(x)` cumulait l'erreur résiduelle binaire sur des milliers de points successifs, créant une dérive linéaire.
*   **Mécanisme de Résolution** : Implémentation d'un filtre adaptatif redistribuant l'erreur résiduelle d'arrondi sur le calcul du point suivant :
    $$e_{i} = X_{real, i} - X_{integer, i} + e_{i-1}$$
*   **Validation & Non-Régression** : La dérive de fin de course mesurée est passée de $0.72\text{ mm}$ à une limite absolue stricte de $\le 0.05\text{ mm}$ (détecté par le **Numerical Analysis Agent**).
