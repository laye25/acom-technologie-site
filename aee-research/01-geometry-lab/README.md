# AEE Research - Geometry Lab (01)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Geometry Lab** est responsable de mesurer et garantir l'exactitude des transformations géométriques vectorielles lors de la conversion de dessins vectoriels (SVG, DXF) en tracés d'aiguille pour la broderie.

## 2. Métriques Scientifiques de Référence
Pour chaque tracé vectoriel original $\mathcal{C}$ et son approximation compilée sous forme de points $\mathcal{A}$, le laboratoire calcule les métriques suivantes :

1. **Erreur de Hausdorff ($H$)** : Calcule la distance maximale de séparation entre la courbe source et l'approximation :
   
   $$H(\mathcal{C}, \mathcal{A}) = \max \left\{ \sup_{x \in \mathcal{C}} \inf_{y \in \mathcal{A}} d(x, y), \sup_{y \in \mathcal{A}} \inf_{x \in \mathcal{C}} d(x, y) \right\}$$

2. **Erreur Quadratique Moyenne (RMS)** : Mesure l'écart moyen de reconstruction :
   
   $$\text{RMS}(\mathcal{C}, \mathcal{A}) = \sqrt{\frac{1}{L} \int_0^L d(c(s), a(s))^2 ds}$$

3. **Perte de Surface ($\Delta \text{Area}$)** : Vérification de la conservation des volumes pour éviter les décalages de bordure :
   
   $$\Delta \text{Area} = \frac{|\text{Area}(\mathcal{C}) - \text{Area}(\mathcal{A})|}{\text{Area}(\mathcal{C})}$$

4. **Conservation des Contreformes** : Validation topologique des exclusions de trous intérieurs.

## 3. Protocoles d'Évaluation (Test Protocols)
- **Fidélité de discrétisation** : S'assurer qu'aucun point de broderie n'est espacé de moins de $0.1\text{ mm}$ (risque de casse d'aiguille) ou de plus de $12.1\text{ mm}$ (fil lâche).
- **Analyse des discontinuités de courbure** : Détection automatique des angles aigus ($<30^\circ$) exigeant des ralentissements machines et des compensations spécifiques.
