# Mathematical Specification - Machine Compilation Lab
**Maturité (Règle 52) :** Implemented  

## 1. Algorithmes Majeurs & Formulations

### A. Dérive d'Arrondi Binaire Cumulative (Rounding Error Accumulation)
Les formats machines comme le DST de Tajima stockent les déplacements d'aiguille de manière incrémentale sous forme d'octets codés en coordonnées entières relatives $(\Delta x_i, \Delta y_i) \in \mathbb{Z}^2$, à une échelle de $0.1\text{ mm}$ par unité binaire. 

Pour éviter l'accumulation d'erreurs d'arrondi lors du passage des coordonnées réelles double précision $(X_i, Y_i) \in \mathbb{R}^2$ aux coordonnées entières absolues $(A_x, A_y)_i \in \mathbb{Z}^2$, l'ATCP utilise une boucle de rétroaction à rétro-propagation de l'erreur résiduelle (Bresenham étendu) :

$$\begin{aligned}
A_{x, i} &= \operatorname{round}(10.0 \cdot X_i + e_{x, i-1}) \\
e_{x, i} &= 10.0 \cdot X_i + e_{x, i-1} - A_{x, i} \\
\Delta x_i &= A_{x, i} - A_{x, i-1}
\end{aligned}$$

Cette formulation garantit que l'erreur de coordonnées cumulée sur tout motif de broderie est strictement bornée et non cumulative :

$$\forall N, \quad \left| \sum_{i=1}^N \Delta x_i - 10.0 \cdot X_N \right| \le 0.5 \text{ unités (soit } 0.05\text{ mm)}$$

---

## 2. Limites de Robustesse & Cas d'Échec Documentés
- **Sauts d'aiguille hors limite (Jump Constraints)** : Le format DST ne peut pas coder un déplacement supérieur à $12.1\text{ mm}$ en un seul point. Tout déplacement supérieur doit être automatiquement fragmenté par le backend en une succession de sauts d'aiguille fictifs (Jumps) sans piqûre :
  
$$\Delta x_{\text{DST}} \in [-121, 121], \quad \Delta y_{\text{DST}} \in [-121, 121]$$

Le compilateur fragmente de manière optimale tout saut d'un vecteur $\mathbf{V}$ en $k = \lceil \|\mathbf{V}\|_{\infty} / 121 \rceil$ sous-instructions.
