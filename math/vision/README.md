# Mathematical Specification - Vision Lab
**Maturité (Règle 52) :** Designed  

## 1. Algorithmes Majeurs & Formulations

### A. Segmentation Sémantique par Convolution Légère
L'extraction d'objets de l'image (fleurs, textes, arrière-plans) s'appuie sur une formulation par maximisation a posteriori (MAP) d'un champ aléatoire de Markov ou par inférence directe de micro-réseaux neuronaux convolutionnels de type U-Net :

$$\hat{\mathbf{y}} = \arg\max_{\mathbf{y}} P(\mathbf{y} \mid \mathbf{X})$$

où $\mathbf{X}$ correspond aux intensités de couleur RGB ou aux caractéristiques de contours locaux de l'image source, et $\mathbf{y}$ représente les étiquettes de classes d'objets textiles sémantiques.

### B. Extraction Vectorielle Adaptative de Rails
Pour reconstruire les rails Satin d'une forme filiforme segmentée, un détecteur de contours de Canny modifié extrait les frontières gauche/droite à l'échelle sub-pixel par interpolation quadratique des gradients d'intensité :

$$\mathbf{G}(x, y) = \nabla \left( G_\sigma(x, y) * I(x, y) \right)$$

---

## 2. Limites de Robustesse & Cas d'Échec Documentés
- **Images à faible résolution ou contrastes bruités** : Les images compressées (artefacts JPEG) entraînent des discontinuités de tracés ou de fausses intersections géométriques. L'ATCP applique un filtrage bilatéral préservant les contours avant toute opération d'inférence sémantique.
