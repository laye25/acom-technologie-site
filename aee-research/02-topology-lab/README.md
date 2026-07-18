# AEE Research - Topology Lab (02)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Topology Lab** valide l'intégrité des relations spatiales, de la connectivité et des structures de données complexes du moteur de broderie (graphes d'objets, arbres de découpage et hiérarchies d'imbrication).

## 2. Métriques Scientifiques de Référence
Le laboratoire modélise le motif comme un graphe orienté $\mathcal{G} = (\mathcal{V}, \mathcal{E})$ et surveille :

1. **Connexité des Composants (Connected Components)** : S'assurer que chaque région fermée est connexe et que les îlots de broderie isolés sont correctement identifiés.
2. **Indice d'Intersection de Self-Intersection** : Nombre d'auto-intersections indésirables détectées au sein du graphe topologique :
   
   $$\mathcal{I}_{\text{self}} = |\{ (e_i, e_j) \in \mathcal{E} \times \mathcal{E} \mid e_i \cap e_j \neq \emptyset, i \neq j \}|$$

3. **Classification des Triangles CDT** : Pourcentage de triangles internes classés correctement comme *Junction*, *Sleeve* ou *Terminal* lors de la décomposition.

## 3. Protocoles d'Évaluation (Test Protocols)
- **Validation du découpage de trous (Boolean Polygons)** : Vérification systématique du fait que les polygones de soustraction (trous de motifs) ne produisent pas de points de remplissage à l'intérieur des zones vides.
- **Préservation topologique sous transformation** : S'assurer que le redimensionnement ou la rotation du motif ne détruit pas les relations d'imbrication parents-enfants des objets.
