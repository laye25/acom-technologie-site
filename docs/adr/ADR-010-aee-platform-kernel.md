# ADR-010 : Séparation du Noyau Mathématique Pur (AEE-Kernel)

**Date :** 2026-07-12  
**Auteur :** ACOM Architect & Audit Center  
**Statut :** Accepté  
**Maturité (Règle 52) :** Designed  

## Contexte
Alors que l'Acom Embroidery Engine (AEE) passe d'un excellent moteur de CAO à une plateforme d'ingénierie globale réutilisable (Web, Desktop, Mobile, Cloud), le "Core Orchestrator" actuel risque d'importer ou de dépendre de structures de données liées à l'environnement d'exécution (ex. manipulation de chemins SVG ou gestionnaires d'état partagé). Pour atteindre une portabilité absolue et un déterminisme mathématique total, un niveau de découplage supplémentaire est requis.

## Décision
Introduire le concept de **Embroidery Kernel (AEE-Kernel)** :
- Extraire tous les calculs mathématiques bruts, les transformations géométriques et physiques de l'AEE pour les regrouper dans un ensemble de noyaux purs et sans état (stateless) :
  - `Geometry Kernel` : Manipulation de primitives mathématiques pures (points, splines, normales, intersections), sans notion d'importateur de fichiers.
  - `Topology Kernel` : Structure de graphes pour la reconstruction de rubans (Voronoi, squelettisation) et relations topologiques pures.
  - `Physics Kernel` : Simulation de forces d'éléments finis pures pour modéliser le comportement physique du fil et du tissu.
  - `AI Kernel` : Intégration locale ou distante de modèles neuronaux pour le traitement d'images et la prédiction de classification.
- Le noyau ne doit avoir aucune dépendance vers le DOM (ni Canvas, ni SVG, ni objets Browser ou Node.js natifs). Il accepte uniquement des tableaux typés standard et des objets de données purs en entrée/sortie.

## Conséquences
- **Avantages** :
  - **Portabilité absolue** : Le noyau (AEE-Kernel) peut tourner indifféremment sur un serveur d'API Cloud sans tête, dans un script de ligne de commande (CLI), dans un processus natif Rust/C++ ou dans l'iFrame du navigateur.
  - **Performance optimale** : Permet une exécution parallèle ultra-rapide sur des CPU multi-cœurs en distribuant les tâches mathématiques pures à des Web Workers sans aucun coût de sérialisation d'objets DOM complexes.
- **Inconvénients** :
  - Nécessite des adaptateurs d'interface pour mapper les types de l'UI (ex. objets SVG React ou Canvas2D) vers les structures mathématiques pures du noyau.
