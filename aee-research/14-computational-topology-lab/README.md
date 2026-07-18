# AEE Research - Computational Topology Lab (14)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Computational Topology Lab** se consacre à l'intégrité et au maintien des propriétés topologiques d'un motif lors de son découpage, de son redimensionnement ou de sa transformation. 

Alors que la géométrie s'intéresse aux mesures exactes (longueurs, angles, distances), la topologie garantit la structure fondamentale du dessin : préservation des vides et contreformes (trous), connectivité des rubans, et absence d'ambiguïté spatiale (dedans vs dehors). Ce laboratoire est l'arbitre suprême pour s'assurer que les zones vides ne soient jamais brodées.

---

## 2. Métriques & Théorèmes Topologiques Appliqués

Le laboratoire formule et vérifie les indicateurs suivants sur les complexes cellulaires du dessin :

1. **Indice d'Enroulement (Winding Number - $w(\mathbf{p}, \gamma)$)** : Détermine si un point d'aiguille $\mathbf{p}$ est strictement situé à l'intérieur d'une région fermée $\gamma$ :
   
   $$w(\mathbf{p}, \gamma) = \frac{1}{2\pi} \oint_\gamma \frac{x-x_p}{(x-x_p)^2 + (y-y_p)^2} dx - \frac{y-y_p}{(x-x_p)^2 + (y-y_p)^2} dy$$

2. **Caractéristique d'Euler-Poincaré ($\chi$)** : Validation de la conservation topologique du nombre de faces ($F$), d'arêtes ($E$) et de sommets ($V$) lors du partitionnement polygonale ou de la triangulation de Delaunay contrainte :
   
   $$\chi = V - E + F$$

3. **Indice d'Intégrité des Trous (Hole Preservation Ratio)** : Taux de réussite de détection et d'exclusion des vides internes.

4. **Graphe de Connectivité de Ruban (Ribbon Adjacency Graph)** : Représentation du squelette topologique d'une arabesque pour ordonnancer sans rupture les trajectoires Satin.

---

## 3. Protocoles d'Évaluation (Test Protocols)

- **Test de la lettre "A" (Cas limite d'imbrication)** : Validation topologique stricte du fait que la contreforme centrale (le triangle intérieur d'un "A" majuscule) est reconnue comme zone d'exclusion et ne contient aucun point de broderie.
- **Analyse de connexité de graphe** : Vérification de la non-fragmentation des rubans Satin lors du lissage des rails.
- **Test d'asymétrie topologique** : Détection des inversions de normales de contours (winding direction) provoquant l'inversion erronée du calcul d'exclusion "intérieur / extérieur".
