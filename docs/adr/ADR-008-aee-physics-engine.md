# ADR-008 : Moteur Physique Textile et Compensation Multi-Substrats (Acom Phys)

**Date :** 2026-07-12  
**Auteur :** ACOM Physics Engineer  
**Statut :** Accepté  
**Maturité (Règle 52) :** Designed  

## Contexte
La broderie réelle applique de fortes tensions sur les fils, provoquant des distorsions tridimensionnelles sur le tissu (effet de contraction "Pull" le long du fil, et d'étirement "Push" perpendiculairement). Ignorer ces forces physiques lors de la génération des points conduit à des décalages d'alignement visibles, des fronces sur le tissu ou des vides de broderie, en particulier sur des matières élastiques comme le jersey ou la maille piquée.

## Décision
Intégrer le module **Fabric Physics Engine (Acom Phys)** pour simuler et pré-compenser les distorsions :
- Modéliser mathématiquement les champs de forces Push-Pull en fonction de la direction et de la densité des points.
- Maintenir une base de profils de matières (matériau, élasticité $k_s$, compressibilité) pour calibrer dynamiquement les forces.
- Appliquer des algorithmes de déformation inverse sur la géométrie vectorielle source avant l'étape de génération de points (élargissement compensatoire des colonnes Satin et dépassement de sécurité pour les remplissages Tatami).

## Conséquences
- **Avantages** :
  - **Précision industrielle** : Les broderies produites sur des textiles extensibles conservent un alignement parfait sans nécessiter de corrections manuelles fastidieuses.
  - **Expertise intégrée** : Le moteur adapte intelligemment ses sous-couches et compensations selon que le tissu cible est du coton épais, du jersey élastique ou de la maille polo.
- **Inconvénients** :
  - Nécessite un étalonnage empirique continu des profils de matières à partir de tests physiques de broderie.
