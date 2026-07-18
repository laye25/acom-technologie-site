# ADR-012 : Jumeau Numérique et Simulation Tridimensionnelle Physique (Embroidery Digital Twin)

**Date :** 2026-07-12  
**Auteur :** ACOM Simulation Specialist  
**Statut :** Accepté  
**Maturité (Règle 52) :** Draft  

## Contexte
La plupart des logiciels de broderie affichent un rendu 2D "plat" ou utilisent des textures basiques pour simuler le relief du fil. Cela ne permet pas de détecter les problèmes réels de drapé du tissu, les déformations physiques complexes sous tension (fronces) ou le comportement 3D du fil lors du chevauchement de plusieurs couches. Un véritable jumeau numérique permet d'éviter des tests physiques coûteux et polluants sur de vraies machines.

## Décision
Concevoir l'architecture d'un **Embroidery Digital Twin** (Jumeau Numérique Textile) :
- Créer un pipeline de rendu 3D haute fidélité modélisant chaque fil sous forme de spline 3D physique avec une épaisseur, une brillance (réflexion spéculaire Madeira) et une torsion de fibre réalistes.
- Modéliser numériquement les éléments physiques intervenant dans la fabrication :
  - *Tissu Virtuel* : Graphe de ressorts-masses (mass-spring network) ou modèle de coque par éléments finis représentant les propriétés mécaniques du textile.
  - *Aiguille Virtuelle* : Simulation de la pénétration, calculant les forces d'impact locales sur le tissu.
  - *Fil Virtuel* : Simulation de la tension dynamique exercée sur chaque point, mettant à jour en temps réel l'état de déformation du tissu virtuel.
- Offrir une prévisualisation photoréaliste et interactive en temps réel (WebGL/WebGPU) permettant d'inspecter visuellement l'envers et l'endroit du textile brodé.

## Conséquences
- **Avantages** :
  - **Zéro Gâchis (Zero Waste)** : Les ateliers de couture et designers de mode peuvent valider une broderie complexe de 50 000 points de manière purement numérique avant de lancer la production.
  - **Rendus Réalistes** : Fournit des images de synthèse parfaites pour la vente en ligne (e-commerce) et le prototypage de vêtements en 3D.
- **Inconvénients** :
  - Demande des calculs de rendu et physiques intensifs sur le processeur graphique (GPU), nécessitant l'utilisation de shaders WebGL/WebGPU haute performance et de WebWorkers dédiés.
