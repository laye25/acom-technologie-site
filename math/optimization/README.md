# Mathematical Specification - Optimization Lab
**Maturité (Règle 52) :** Implemented  

## 1. Algorithmes Majeurs & Formulations

### A. Problème du Voyageur de Commerce avec Contraintes de Précédence (TSP-PC)
La minimisation de la longueur totale de fil perdu et du nombre d'opérations de coupe (Trims) est formulée comme un problème du voyageur de commerce avec contraintes de précédence (TSP-PC).

Soit $\mathcal{O} = \{O_1, \dots, O_N\}$ l'ensemble des objets géométriques à broder. On définit un graphe complet où chaque transition entre la sortie de l'objet $i$ et l'entrée de l'objet $j$ a un coût de transport (distance euclidienne) :

$$c_{ij} = \|\mathbf{P}_{\text{out}}(O_i) - \mathbf{P}_{\text{in}}(O_j)\|$$

La relation de précédence $O_a \prec O_b$ impose qu'un arrière-plan ou une sous-couche $O_a$ soit obligatoirement brodé avant le premier plan ou le contour de finition $O_b$. L'optimisation résout :

$$\min_{\pi \in \mathfrak{S}_N} \sum_{k=1}^{N-1} c_{\pi(k)\pi(k+1)} \quad \text{sujet à} \quad O_a \prec O_b \implies \pi^{-1}(a) < \pi^{-1}(b)$$

---

## 2. Algorithme de Résolution
Le noyau d'optimisation d'ATCP résout ce problème combinatoire par :
1. **Programmation Dynamique (DP)** pour de petits ensembles de tracés ($N \le 15$, complexité $\mathcal{O}(2^N N^2)$).
2. **Recherche Locale Guidée (GLS) et Recuit Simulé** pour les motifs complexes ($N > 15$).

---

## 3. Limites de Robustesse & Cas d'Échec Documentés
- **Contraintes contradictoires (Deadlocks topologiques)** : Des intersections de formes complexes ou des erreurs de numérisation peuvent engendrer des cycles de précédence fermés (ex : $O_1 \prec O_2 \prec O_3 \prec O_1$). Dans ce cas, le solveur détecte le cycle et le brise arbitrairement en éliminant la contrainte la moins critique mécaniquement pour éviter tout blocage du compilateur.
