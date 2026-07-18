# ADR-011 : Solveur de Contraintes Déclaratives (Constraint Solver Engine)

**Date :** 2026-07-12  
**Auteur :** ACOM Senior Optimization Engineer  
**Statut :** Accepté  
**Maturité (Règle 52) :** Designed  

## Contexte
La numérisation d'un motif complexe implique de nombreux paramètres interdépendants (densité de points, angle de tatami, longueur de fil, type de sous-couche, compensations d'étirement). Modifier un paramètre manuellement pour résoudre un problème (ex. augmenter la densité pour améliorer la couverture) peut en créer un autre (ex. casse d'aiguille par sur-densité locale). Un système de CAO/FAO moderne ne doit pas déléguer cette résolution par tâtonnements à l'utilisateur.

## Décision
Intégrer un **Solveur de Contraintes Déclaratives (Constraint Solver Engine)** au sein de l'AEE :
- Permettre à l'utilisateur ou à l'application de définir des contraintes cibles sous forme déclarative (ex. *"obtenir une densité moyenne de 0.42mm"*, *"longueur de fil totale < 18m"*, *"zéro cellule de sur-densité critique (>8 points/mm²)"*, *"moins de 12 coupes de fil"*).
- Mettre en œuvre des algorithmes de programmation linéaire ou des méta-heuristiques (Recuit Simulé, Algorithmes Génétiques légers) pour explorer l'espace des paramètres de compilation (Tatami Angle, Row Offset, Overlap size).
- Calculer automatiquement la solution mathématiquement optimale satisfaisant l'ensemble des contraintes textiles et physiques avant l'exportation des points.

## Conséquences
- **Avantages** :
  - **Automatisation intelligente** : Le moteur résout de manière autonome le compromis idéal entre qualité visuelle et vitesse machine.
  - **Garantie de broderie** : Élimine les échecs de production (bunching, needle break) en s'assurant qu'aucune contrainte physique de sécurité n'est violée.
- **Inconvénients** :
  - Complexité de la formulation mathématique des fonctions de coût et de pénalité. L'évaluation de l'espace de recherche peut être chronophage (nécessite un solveur optimisé ou limité à un nombre fixe d'itérations).
