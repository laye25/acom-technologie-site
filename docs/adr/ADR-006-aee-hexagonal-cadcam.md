# ADR-006 : Architecture Hexagonale CAD/CAM pour Acom Embroidery Engine (AEE)

**Date :** 2026-07-12  
**Auteur :** ACOM Architect & Audit Center  
**Statut :** Accepté  
**Maturité (Règle 52) :** Designed / Prototype  

## Contexte
L'implémentation initiale de la broderie était concentrée dans `embroideryServices.ts`. Avec l'augmentation des fonctionnalités (reconstruction de motifs, simulation, exports multi-formats), ce fichier devenait un "god file" monolithique difficile à maintenir, couplé de fait au cycle de vie de React et aux hooks de l'application UI. Pour transformer ce module en un produit performant et réutilisable, il est indispensable de séparer les calculs métier des aspects de présentation.

## Décision
Passer d'une Clean Architecture classique à une **Hexagonal CAD/CAM Architecture** découplée :
- Isoler les algorithmes de broderie de React et Firebase dans un noyau autonome appelé **Acom Embroidery Engine (AEE)**.
- Diviser le moteur en ports et adaptateurs à travers des modules spécialisés (`GeometryEngine`, `PatternEngine`, `PhysicsEngine`, `QualityEngine`, `ExportEngine`).
- Introduire l'interface unifiée `EmbroideryApplication` comme API applicative, agissant comme façade d'orchestration pour le noyau.

## Conséquences
- **Avantages** :
  - **Découplage total** : Les algorithmes mathématiques complexes peuvent tourner de manière déterministe hors de l'iFrame, dans des Web Workers ou sur un serveur Node.js.
  - **Facilité de test** : Possibilité de tester chaque fonction géométrique avec un taux de couverture de 100% via des tests unitaires standard.
  - **Réutilisabilité** : L'AEE peut être packagé en SDK npm (`@acom/embroidery-engine`) pour être intégré dans d'autres applications d'Acom Technologie (Acom Studio, Acom Desktop).
- **Inconvénients** :
  - Légère augmentation du nombre de fichiers physiques à cause de la décomposition modulaire.
