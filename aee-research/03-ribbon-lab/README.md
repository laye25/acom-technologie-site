# AEE Research - Ribbon Lab (03)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Ribbon Lab** se concentre sur l'un des algorithmes les plus stratégiques de la plateforme : la reconstruction automatique de rubans continus et de rails directeurs (gauche/droit) à partir de contours vectoriels fermés non structurés, permettant une conversion parfaite en points Satin.

## 2. Inspirations & Parallèles Technologiques
Le laboratoire s'inspire directement de la recherche dans plusieurs domaines de pointe :
- **Réseaux Routiers & Ferroviaires** : Extraction des axes médians et des largeurs de voies.
- **Vaisseaux Sanguins (Imagerie Médicale)** : Segmentation automatique des arbres artériels cylindriques.
- **Réseaux de PCB** : Routage de pistes électroniques à largeur fixe ou adaptative.

## 3. Métriques Scientifiques de Référence
Pour chaque ruban reconstruit $\mathcal{R}$ caractérisé par son axe médian $\gamma(s)$ et ses deux rails $R_L(s)$ et $R_R(s)$ :

1. **Orthogonalité Locale ($\theta_{\text{ortho}}$)** : Angle entre le vecteur tangent du rail et la section transversale reliant $R_L$ à $R_R$ :
   
   $$\theta_{\text{ortho}}(s) = \arccos\left( \frac{\gamma'(s) \cdot (R_L(s) - R_R(s))}{\|\gamma'(s)\| \|R_L(s) - R_R(s)\|} \right)$$
   
   *Objectif* : $\theta_{\text{ortho}} \to 90^\circ$ pour des points Satin parfaitement transversaux.

2. **Régularité de Largeur (Symmetry Deviation)** : Écart de symétrie entre les rails gauche et droit par rapport à l'axe médian :
   
   $$\sigma_{\text{sym}}(s) = \big| \|R_L(s) - \gamma(s)\| - \|R_R(s) - \gamma(s)\| \big|$$

3. **Taux d'Élagage du Bruit (Pruning Precision)** : Rapport des branches de Voronoi élaguées par rapport aux branches structurelles réelles.

## 4. Protocoles d'Évaluation (Test Protocols)
- **Robustesse aux jonctions en T, Y et X** : S'assurer que les embranchements de rubans sont segmentés de manière propre sans générer de sur-densité de points au niveau des intersections.
- **Calcul de l'angle de braquage** : Vérification des angles de virage serrés pour adapter la longueur du fil et activer le "Fanning" (points pivotants).
