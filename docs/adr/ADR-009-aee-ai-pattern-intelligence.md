# ADR-009 : Moteur de Classification Sémantique par Vision IA (Acom PI)

**Date :** 2026-07-12  
**Auteur :** ACOM AI Engineer  
**Statut :** Accepté  
**Maturité (Règle 52) :** Prototype  

## Contexte
La numérisation automatique classique (image-to-stitch) souffre d'un manque de compréhension sémantique : elle traite toutes les formes comme de simples aplats de pixels ou vecteurs bruts. Pour obtenir des broderies d'une qualité équivalente à un travail de numérisation artisanale, le logiciel doit comprendre la nature symbolique du motif (ex. distinguer une lettre d'une rosace, ou un tissu wax d'un logo d'entreprise) afin de lui appliquer les meilleures règles métier.

## Décision
Concevoir et intégrer un **Pattern Intelligence Engine (Acom PI)** piloté par l'IA :
- Exploiter les capacités de classification visuelle sémantique de l'API **Gemini Vision** pour étiqueter automatiquement les segments d'un dessin importé (Monogrammes, Arabesques, Wax Africain, Dentelle, Logos).
- Mapper chaque classe sémantique à une stratégie de remplissage et de sous-couche experte :
  - *Monogrammes* : Remplissages Satin directionnels avec jonctions de chevauchement automatique (0.3mm) pour éviter l'écartement des branches.
  - *Arabesques* : Tri radial (TSP polaire) réduisant de 90% les déplacements et coupes de fil inutiles.
  - *Wax Africain & Dentelle* : Structures de grilles légères (Lattice) préservant la souplesse naturelle du tissu.
- Assurer un traitement asynchrone sécurisé, préservant la réactivité de l'application cliente.

## Conséquences
- **Avantages** :
  - **Qualité inégalée** : Le moteur génère des points intelligents et sémantiques, surpassant de loin les algorithmes géométriques aveugles des logiciels amateurs.
  - **Automatisation assistée** : Les utilisateurs novices obtiennent des résultats de qualité professionnelle en un seul clic grâce au diagnostic IA.
- **Inconvénients** :
  - Dépendance réseau pour l'appel de l'API Gemini Vision (compensée par une mise en cache locale des prédictions et des stratégies géométriques déterministes par défaut).
