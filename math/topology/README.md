# Mathematical Specification - Topology Lab
**Maturité (Règle 52) :** Designed  

## 1. Algorithmes Majeurs & Formulations

### A. Détermination Spatiale par Indice d'Enroulement (Winding Number)
Pour déterminer de manière infaillible si un point géométrique $\mathbf{p} = (x_p, y_p)$ est situé à l'intérieur d'une région délimitée par une courbe fermée plane $\gamma(t) = (x(t), y(t))$, l'ATCP évalue l'indice d'enroulement $w(\mathbf{p}, \gamma)$ :

$$w(\mathbf{p}, \gamma) = \frac{1}{2\pi} \oint_\gamma \frac{(x-x_p)dy - (y-y_p)dx}{(x-x_p)^2 + (y-y_p)^2}$$

- **Règle d'inclusion** : Le point $\mathbf{p}$ est inclus dans le domaine de broderie si et seulement si $w(\mathbf{p}, \gamma) \neq 0$.

### B. Caractéristique d'Euler-Poincaré ($\chi$) sur Complexes Cellulaires
L'intégrité topologique d'une surface textile partitionnée ou triangulée $\mathcal{M}$ est garantie par la conservation de sa caractéristique d'Euler-Poincaré :

$$\chi(\mathcal{M}) = V - E + F = 2 - 2g - b$$

où $V$ représente le nombre de sommets, $E$ le nombre d'arêtes, $F$ le nombre de faces, $g$ le genre de la surface (nombre de anses/trous) et $b$ le nombre de frontières (boundaries).

---

## 2. Graphe d'Adjacence de Rubans (Acom Ribbon Graph)
La squelettisation extrait l'axe médian d'une forme pour la décomposer en rubans Satin continus. Les intersections de rubans sont modélisées sous forme d'un graphe topologique d'adjacence $G = (V_G, E_G)$ :
- Chaque sommet $v \in V_G$ correspond à une jonction ou extrémité de ruban.
- Chaque arête $e \in E_G$ représente un segment de ruban continu caractérisé par sa fonction d'épaisseur locale $R(s)$.

---

## 3. Limites de Robustesse & Cas d'Échec Documentés
- **Squelettisation de formes bruitées** : Les petites perturbations sur les bords des tracés vectoriels d'entrée provoquent la création de branches parasites ("poils") sur l'axe médian. L'ATCP résout ce problème par un élagage (pruning) topologique fondé sur la persistance topologique.
- **Auto-intersections de frontières** : Si une frontière s'auto-intersecte, le sens d'enroulement (Winding Direction) s'inverse localement, ce qui peut amener le compilateur à considérer à tort l'intérieur d'un motif comme une zone vide d'exclusion.
