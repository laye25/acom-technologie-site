# AEE Research - Numerical Analysis Lab (13)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Numerical Analysis Lab** est responsable de la stabilité de calcul, de la gestion des tolérances numériques, des erreurs d'arrondi sur les flottants et du traitement robuste des cas géométriques limites ou dégénérés (ex : coordonnées quasi-coïncidentes, auto-intersections, instabilité directionnelle).

Un moteur CAD/CAM textile travaillant à l'échelle du dixième de millimètre ($0.1\text{ mm}$ nominal pour les commandes de broderie DST) est sujet à d'importants biais cumulatifs et à des dérives de troncature lors de la conversion de coordonnées cartésiennes réelles double précision (`f64`) en valeurs discrètes binaires machine.

---

## 2. Métriques Scientifiques & Analyse d'Erreurs

Le laboratoire modélise et surveille quatre sources d'erreurs numériques :

1. **Dérive de Troncature Machine (Rounding Drift - $\mathbf{E}_{\text{drift}}$)** : Écart cumulé induit par l'arrondi binaire des coordonnées géométriques réelles $\mathbf{P}_i \in \mathbb{R}^2$ en coordonnées entières machines $\mathbf{M}_i \in \mathbb{Z}^2$ :
   
   $$\mathbf{E}_{\text{drift}} = \sum_{i=1}^{N} \left\| \mathbf{P}_i - \frac{\mathbf{M}_i}{\text{ScaleFactor}} \right\|$$

2. **Écart de Colinéarité (Collinearity Epsilon - $\epsilon_{\text{col}}$)** : Seuil minimal pour lequel trois points successifs sont considérés comme alignés, permettant d'élaguer les points superflus sans altérer la trajectoire de l'aiguille.

3. **Conditionnement Matriciel ($Cond(\mathbf{A})$)** : Évaluation de la stabilité numérique du solveur linéaire de compensation physique (Acom Phys) pour prévenir la divergence des équations différentielles.

4. **Singularités et intersections dégénérées** : Traitement de l'auto-intersection de segments de longueur inférieure à l'épaisseur physique de l'aiguille ($0.7\text{ mm}$).

---

## 3. Protocoles d'Évaluation (Test Protocols)

- **Test de robustesse epsilon** : Validation des intersections de segments de polygones denses sous perturbation numérique microscopique.
- **Analyse de la dérive de point d'origine** : S'assurer que la dérive d'arrondi binaire cumulée $\mathbf{E}_{\text{drift}}$ sur un motif de plus de $100\ 000$ points ne provoque pas de décalage spatial supérieur à $0.05\text{ mm}$ par rapport à l'origine absolue du motif.
