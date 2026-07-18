# ADR-007 : Moteur de Reconstruction de Rubans (Acom Ribbon)

**Date :** 2026-07-12  
**Auteur :** ACOM Geometrician & Audit Center  
**Statut :** Accepté  
**Maturité (Règle 52) :** Designed  

## Contexte
Les motifs de broderie en colonnes (points Satin) exigent de connaître précisément les bords gauche et droit du ruban pour entrelacer les points de manière optimale. Les imports SVG ou les dessins manuels fournissent souvent uniquement des polygones fermés (contours sans notion de rails directionnels). Convertir ces formes fermées en rubans structurés de manière manuelle est fastidieux pour l'utilisateur.

## Décision
Intégrer un **Moteur de Reconstruction de Rubans (Ribbon Engine)** basé sur la géométrie computationnelle :
- Utiliser la **Delaunay Triangulation** et l'approximation du diagramme de **Voronoi** pour extraire la ligne médiane (Medial Axis Transform).
- Prégénérer des squelettes lissés en élaguant (pruning) les branches mineures causées par le bruit de numérisation.
- Reconstruire les rails latéraux gauche et droit en appliquant un champ de rayon variable $R(s)$ le long des vecteurs normaux de la ligne médiane.
- Mettre en œuvre des algorithmes de fanning (points courts) dans les virages serrés pour éliminer la sur-densité de fil interne.

## Conséquences
- **Avantages** :
  - **Automatisation** : Transformation automatique de n'importe quelle forme fermée (lettrage calligraphique, rinceaux, arabesques) en points Satin haut de gamme.
  - **Qualité textile** : Évite la sur-concentration de points sur le rail intérieur des courbes, empêchant la casse d'aiguille.
- **Inconvénients** :
  - Les calculs de triangulation et de Voronoi sont intensifs en ressources CPU, nécessitant une exécution asynchrone (Web Workers).
