# AEE Research - Travel Lab (05)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Travel Lab** est le laboratoire d'optimisation combinatoire de la plateforme. Sa mission est de résoudre le problème de voyageur de commerce avec contraintes de précédence (TSP-PC) appliqué aux trajectoires de broderie, pour minimiser le nombre de coupes de fils (Trims) et les sauts (Jumps).

## 2. Métriques d'Optimisation de Trajet
Le trajet est modélisé par un graphe où chaque objet $O_i$ possède un point d'entrée $In_i$ et un point de sortie $Out_i$. Le laboratoire calcule :

1. **Longueur Totale de Fil Perdu ($L_{\text{lost}}$)** : Distance totale parcourue lors des sauts non cousus :
   
   $$L_{\text{lost}} = \sum_{k=1}^{M-1} d(Out_{\pi(k)}, In_{\pi(k+1)})$$
   
   *Objectif* : Minimiser $L_{\text{lost}}$ pour réduire la consommation de fil et le temps de broderie.

2. **Indice d'Efficacité Temporelle (Time Efficiency Index)** : Gain de temps machine estimé par rapport à une séquence d'ordonnancement séquentielle classique :
   
   $$\eta_{\text{time}} = \frac{T_{\text{baseline}} - T_{\text{optimized}}}{T_{\text{baseline}}}$$

3. **Nombre de Coupes de Fils ($N_{\text{trims}}$)** : Compte exact des actions mécaniques de trim sur le trajet optimal.

## 3. Protocoles d'Évaluation (Test Protocols)
- **Contrainte absolue de regroupement par couleur** : S'assurer qu'aucun saut d'objet n'entraîne de changement de couleur de fil superflu (les objets d'une même couleur doivent être regroupés au maximum).
- **Vérification d'ancrage** : S'assurer qu'un point d'arrêt (Lock stitch) est inséré de manière systématique avant et après chaque saut de fil pour empêcher le décousu.
