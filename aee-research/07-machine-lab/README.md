# AEE Research - Machine Lab (07)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Machine Lab** gère la base de données des profils industriels de machines à broder (Tajima, Brother, Barudan, SWF, ZSK, Ricoma) et veille à ce que le code binaire généré respecte strictement les limites physiques, dynamiques et logiques de chaque constructeur.

## 2. Structure d'un Profil Machine (Machine Profile)
Chaque profil machine intègre des contraintes physiques immuables :

- **Vitesse Maximale de Rotation ($V_{\text{max}}$)** : En points par minute (SPM).
- **Longueur Maximale de Point ($L_{\text{max}}$)** : Seuil au-delà duquel la machine doit scinder un point de couverture ou insérer un saut automatique (généralement $12.1\text{ mm}$ ou $12.7\text{ mm}$).
- **Seuil de Saut Rapide (Jump Threshold)** : Distance minimale de déplacement déclenchant une action mécanique de coupe de fil et de déplacement rapide.
- **Limites du Cadre Physique (Hoop Bounds)** : Aire géométrique utile pour empêcher toute collision mécanique de l'aiguille avec le cadre.

## 3. Métriques de Compatibilité Binaire
1. **Taux de Conformité aux Bornes (Bound Compliance)** : Pourcentage de points situés à l'intérieur de l'aire utile du cadre sélectionné.
2. **Fréquence des Décélérations (Deceleration Frequency Index)** : Nombre de variations brusques de vitesse induites par des angles de tracé trop aigus.
3. **Erreur d'Arrondi Binaire (Rounding Drift)** : Écart de dérive cumulé provoqué par l'arrondi des coordonnées flottantes en unités machines entières (ex. $0.1\text{ mm}$ par pas pour le format DST) :
   
   $$\mathbf{E}_{\text{drift}} = \sum_{k=1}^N \left( \mathbf{P}_k - \text{round}(\mathbf{P}_k) \right)$$
   
   *Objectif* : Minimiser la dérive cumulative pour éviter que le motif ne se décale de son origine de départ au fil de la broderie.
