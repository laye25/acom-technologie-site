# Acom Embroidery Engine (AEE) - Feuille de Route Scientifique & Projet Phoenix (2027–2030)
**Maturité (Règle 52) :** Designed / Implemented

Cette feuille de route définit la vision à long terme de l'Acom Embroidery Engine (AEE). L'objectif ultime de la plateforme n'est plus simplement de répliquer les capacités des outils classiques comme Wilcom, Hatch ou Pulse, mais d'**inventer la prochaine génération de moteurs CAD/CAM textiles** fondés sur l'intelligence sémantique, la géométrie des rubans, la simulation physique tridimensionnelle et la préservation des patrimoines culturels.

---

## 1. Project Phoenix : Le Nouveau Pipeline de Numérisation Sémantique

Le Projet Phoenix réinvente de fond en comble le pipeline classique de génération de points de broderie :

```
[ Image ] ──► [ Phase A : Vision IA ] ──► [ Phase B : Reconstruction de Rubans ] ──► [ Phase C : Compilateur Sémantique ]
                                                                                              │
[ DST/PES/JEF ] ◄── [ Phase E : Validation Physique ] ◄── [ Phase D : Compilateur AEE (AST/IR) ] ◄──┘
```

### Phase A : Vision Sémantique et Segmentation IA
- **Concept** : L'IA ne traite plus l'image comme un simple tableau de pixels ou de contours bruts à vectoriser sans discernement. Elle fragmente le motif en composants sémantiques identifiables.
- **Modèles** : Micro-réseaux de segmentation pour isoler les *lettres*, *pétales*, *arabesques*, *rubans*, *logos* et *zones de contreforme*.

### Phase B : Ribbon Reconstruction (Acom Ribbon)
- **Concept** : Abandon du paradigme des polygones fermés plats au profit de rubans continus d'épaisseur variable.
- **Algorithmes** : Squelettisation par diagramme de Voronoi contraint, extraction de l'axe médian (Centerline) et des rails gauche/droit directionnels pour une orientation optimale des points Satin.

### Phase C : Semantic Compilation & Knowledge Graph
- **Concept** : Le compilateur comprend la nature physique et culturelle de l'objet qu'il s'apprête à numériser en s'appuyant sur l'**Embroidery Knowledge Graph**.
- **Logique** :
  - *S'il s'agit d'une lettre* ──► Application d'un point Satin dynamique avec empattement et compensation d'étirement spécifique.
  - *S'il s'agit d'un logo de marque* ──► Priorisation de la continuité du contour dominant et réduction drastique des coupures de fil.
  - *S'il s'agit d'un motif Wax ou Bogolan* ──► Application des stratégies de remplissage et densités codifiées par les maîtres artisans africains.

### Phase D : Embroidery Compiler (Architecture LLVM-like)
- **Concept** : Remplacement de l'export direct "SVG-to-DST" par un compilateur modulaire structuré à l'image des compilateurs de langages informatiques modernes (LLVM, GCC).
- **Architecture** :
  1. **Front-End** : Analyse syntaxique des tracés vectoriels et génération d'un Arbre de Syntaxe Abstraite Textile (**AST**).
  2. **Middle-End** : Traduction de l'AST en Représentation Intermédiaire (**IR**) découplée des formats machines, permettant d'exécuter des passes d'optimisation globales (TSP-PC pour le déplacement, solveur de contraintes pour la densité).
  3. **Back-End** : Génération binaire hautement spécifique selon les profils physiques de chaque machine (Tajima, Brother, Barudan, SWF, ZSK).

### Phase E : Physics Validation and Correction Loop
- **Concept** : Simulation physique par éléments finis des forces de traction du fil et de déformation du tissu avant écriture binaire.
- **Boucle de rétroaction** : Si le simulateur détecte un froncement (puckering) ou un gap d'alignement, le compilateur ajuste de manière itérative les coordonnées de l'IR avant de produire le fichier DST final.

---

## 2. Horizons Stratégiques d'Exécution (The Three Horizons)

La croissance et l'industrialisation d'ATCP sont articulées autour de trois horizons stratégiques clairs :

*   **Horizon 1 : Industrialisation (6 à 12 mois)**
    *   Finaliser le moteur de reconstruction de rubans (*Ribbon Engine*).
    *   Stabiliser le moteur topologique (*Topology Engine*) pour la conservation des trous.
    *   Figer la spécification de la Représentation Intermédiaire Textile (**ATIR**).
    *   Publier le SDK stable v1.0.
    *   Déployer l'infrastructure automatisée de métrologie dans `acom-textile-benchmark`.
*   **Horizon 2 : Innovation (1 à 3 ans)**
    *   Intégrer le pipeline de compilation sémantique (Vision + Graphe de Connaissances).
    *   Stabiliser la boucle de rétroaction physique (Réseau Masse-Ressort temps réel).
    *   Mettre au point l'optimisation multi-machines et les barrières de garde par IA spécialisée.
    *   Faire valider les résultats par le Conseil Scientifique d'artisans experts.
*   **Horizon 3 : Plateforme Multiprocess (3 à 5 ans)**
    *   Déployer la plateforme de calcul unifiée ATCP sur les procédés connexes : broderie, découpe laser, impression directe (DTG/DTF), sublimation, découpe de vinyle transfert, tissage Jacquard, tricotage CNC et quilting industriel.

---

## 3. Plan de Développement Immédiat (The 4 Concrete Sprints)

Conformément à la **Règle 60 (Le code devient prioritaire)**, les efforts de développement sont concentrés à 80% sur l'implémentation et à 20% sur la documentation au cours des prochains sprints d'ingénierie :

*   **Sprint 1 : Ribbon Engine v1**
    *   *Objectif* : Construire le moteur de reconstruction géométrique de rubans d'épaisseur variable à partir de tracés de contours bruts.
    *   *Validation* : Suite de tests et de benchmarks géométriques sur l'axe médian et l'erreur de Hausdorff.
*   **Sprint 2 : Topology Engine & Hole Preservation**
    *   *Objectif* : Obtenir un taux d'exclusion des vides (Hole Preservation) de $100\%$ sur les caractères et formes complexes (lettres `A`, `B`, `O`, `P`, `R`, `8`, `0`, logos complexes).
    *   *Validation* : Non-régression totale validée par calcul de caractéristique d'Euler et winding numbers.
*   **Sprint 3 : Semantic Compiler**
    *   *Objectif* : Traduire les éléments du dessin vectoriel (SVG) non plus en simples coordonnées, mais en entités sémantiques distinctes (lettrage, logo, ornement, dentelle, ruban satin, broderie traditionnelle).
    *   *Validation* : Génération d'arbre de syntaxe abstraite (AST) et de blocs d'instructions sémantiques.
*   **Sprint 4 : Physics Engine v1**
    *   *Objectif* : Mettre au point un simulateur physique minimal viable (modèle masse-ressort) capable de prédire l'étirement ou le froissement théorique sur un jeu réduit d'étoffes de référence.
    *   *Validation* : Mesure quantitative de la déviation d'alignement provoquée par la tension physique du fil.

---

## 4. Feuille de Route d'Innovation (2027–2030)

| Période | Phase de Projet | Objectif Majeur | Statut |
| :--- | :--- | :--- | :---: |
| **2027 (Q1-Q2)** | **Phoenix Alpha** | Intégration de la représentation intermédiaire (IR) et découplage complet du compilateur. | `Designed` |
| **2027 (Q3-Q4)** | **Phoenix Beta** | Connexion du pipeline de vision IA et du moteur de reconstruction de rubans (Acom Ribbon). | `Prototype` |
| **2028** | **Semantic Release** | Déploiement de l'Embroidery Knowledge Graph et de l'African Pattern Dataset. | `Draft` |
| **2029** | **Physics Engine v2** | Intégration de la boucle de rétroaction physique en temps réel sur le simulateur 3D. | `Draft` |
| **2030** | **Total Autonomy** | Numérisation autonome et prédictive de motifs d'art par couplage IA-Artisanat. | `Draft` |
