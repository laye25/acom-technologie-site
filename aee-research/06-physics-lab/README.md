# AEE Research - Physics Lab (06)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Physics Lab** modélise les interactions physiques, mécaniques et dimensionnelles réelles entre le tissu, le fil, l'aiguille et le stabilisateur. Ce laboratoire simule les forces de tension pour compenser préventivement les déformations textiles (effet Push-Pull).

## 2. Le Modèle Physique & Rhéologique
Pour chaque type de textile (jersey, coton, soie, polaire), le laboratoire définit des paramètres mécaniques :

- **Élasticité du Fil ($E_{\text{thread}}$)** : Module de Young du fil (ex. Polyester vs Viscose).
- **Tension de Broderie ($T_{\text{emb}}$)** : Force de tension appliquée en Newtons lors de la pose du point (nominalement $0.1$ à $0.2\text{ N}$).
- **Coefficient de Compression du Tissu ($C_{\text{fabric}}$)** : Résistance du tissu à l'écrasement transversal.

## 3. Métriques Scientifiques de Référence
1. **Champ de Déplacement Textile ($\mathbf{u}$)** : Résolution par éléments finis (FEA) du déplacement de chaque nœud du tissu soumis à la contrainte de tension du fil :
   
   $$\sigma_{ij,j} + f_i = 0 \quad \text{(Équilibre des contraintes)}$$

2. **Compensation de Traction (Pull Compensation Factor)** : Valeur d'étirement inverse calculée pour surdimensionner le tracé vectoriel dans l'axe perpendiculaire à l'orientation du point :
   
   $$\delta_{\text{pull}} = \alpha_{\text{pull}} \cdot \frac{T_{\text{emb}}}{C_{\text{fabric}} \cdot d_{\text{stitch}}}$$

3. **Risque de Froncement (Puckering Risk Index)** : Probabilité de déformation résiduelle permanente après retrait du cadre de broderie.

## 4. Protocoles d'Évaluation (Test Protocols)
- **Validation du solveur de compensation** : S'assurer que le solveur de Newton-Raphson converge sous $50\text{ ms}$ vers un profil de compensation optimal.
- **Vérification de la limite de contrainte** : Interdiction des sur-densités de points locales pouvant provoquer des perforations ou des déchirures du support textile.
