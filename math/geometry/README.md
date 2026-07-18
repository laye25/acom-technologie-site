# Mathematical Specification - Geometry Lab
**Maturité (Règle 52) :** Designed  

## 1. Algorithmes Majeurs & Formulations

### A. Interpolation par Courbes de Bézier Cubiques
La continuité des contours vectoriels d'entrée est préservée via des splines de Bézier cubiques. Pour un segment défini par les points de contrôle $\mathbf{P}_0, \mathbf{P}_1, \mathbf{P}_2, \mathbf{P}_3$ :

$$\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t) t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3$$

Le critère de discrétisation adaptative s'assure que la déviation géométrique maximale par rapport à la corde de discrétisation est inférieure au seuil $\epsilon = 0.05\text{ mm}$ :

$$d_{\text{chord}} = \max_{t} \operatorname{dist}(\mathbf{B}(t), \overline{\mathbf{B}(t_i)\mathbf{B}(t_{i+1})}) \le \epsilon$$

---

## 2. Métriques de Fidélité

### Distance de Hausdorff
La distance de Hausdorff $d_H(X, Y)$ mesure l'écart maximal entre le contour vectoriel source $X$ et la forme reconstruite par points d'aiguille $Y$ :

$$d_H(X, Y) = \max \left\{ \sup_{x \in X} \inf_{y \in Y} d(x, y), \sup_{y \in Y} \inf_{x \in X} d(x, y) \right\}$$

Cette métrique est calculée en permanence sur le Golden Dataset pour s'assurer que $d_H \le 0.1\text{ mm}$ sur les motifs de test.

---

## 3. Limites de Robustesse & Cas d'Échec Documentés
- **Angles Vifs (Sharp Corners)** : Lorsque l'angle entre deux segments successifs $\theta < 30^\circ$, la discrétisation uniforme classique induit une sur-concentration de points d'aiguille, provoquant le déchirement du tissu ou le bris d'aiguille. L'ATCP applique un algorithme de mitigation par pivot ou retrait d'angle (Mitering).
- **Auto-intersections microscopiques** : Les tracés auto-intersectant à une échelle $\le 0.1\text{ mm}$ provoquent des boucles infinies dans les solveurs de remplissage. Une passe de simplification géométrique locale (Douglas-Peucker adaptatif) est requise.
