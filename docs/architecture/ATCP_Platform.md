# Architectural Specification: Acom Textile Computing Platform (ATCP)
**Maturité (Règle 52) :** Designed / Implemented  

Ce document spécifie l'architecture de l'**Acom Textile Computing Platform (ATCP)**, l'infrastructure logicielle et mathématique unifiée de CAO/FAO textile d'Acom Technologie. 

L'ATCP ne se limite plus à la seule broderie numérique (Acom Embroidery Engine). Elle constitue un noyau de calcul géométrique, topologique et physique générique, capable de piloter l'ensemble des technologies de fabrication et de traitement textile de l'écosystème Acom.

---

## 1. Vision Holistique de la Plateforme (The ATCP Core)

Le paradigme de l'ATCP repose sur l'indépendance absolue entre le modèle géométrique abstrait et le procédé de fabrication final. Un même tracé vectoriel sémantisé est interprété par le noyau de calcul et compilé par des backends matériels dédiés :

```
                               ┌────────────────────────────────┐
                               │  Acom Textile Computing (ATCP) │
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │     Noyau Mathématique Commun  │
                               │ - Géométrie Computationnelle   │
                               │ - Théorie des Rubans (Ribbon)  │
                               │ - Solveurs de Contraintes     │
                               └───────────────┬────────────────┘
                                               ▼
         ┌──────────────────────┬──────────────┴───────┬──────────────────────┐
         ▼                      ▼                      ▼                      ▼
  ┌────────────┐         ┌────────────┐         ┌────────────┐         ┌────────────┐
  │  ATCP-AEE  │         │  ATCP-ALC  │         │  ATCP-ATP  │         │  ATCP-ACN  │
  │ Embroidery │         │   Laser    │         │  Printing  │         │    CNC     │
  │   Engine   │         │  Cutting   │         │ (Sublim.)  │         │  Knitting  │
  └────────────┘         └────────────┘         └────────────┘         └────────────┘
```

### Les Modules Métiers Spécifiques (Engines)
- **ATCP Embroidery Engine (AEE)** : Compilation en instructions de points de broderie (DST, PES, JEF) avec contrôle de la tension du fil et compensation physique d'étirage.
- **ATCP Laser Cutting (ALC)** : Compilation en trajectoires vectorielles continues de découpe laser (G-code) avec gestion dynamique de la puissance thermique selon la densité de la matière.
- **ATCP Vinyl Cutter Engine (AVC)** : Optimisation des trajectoires de découpe de vinyle transfert avec décalage de lame (offset) dynamique et échenillage sémantique assisté.
- **ATCP Textile Printing (ATP)** : Traitement sémantique colorimétrique pour l'impression directe (DTG), la sublimation et la sérigraphie numérique.
- **ATCP CNC Knitting (ACN)** : Calcul géométrique des mailles et trajectoires de tricotage industriel.
- **ATCP Quilting Engine (AQE)** : Calcul de motifs de matelassage continu et gestion des reliefs de piquage sur garnissages multi-épaisseurs.
- **ATCP Weaving Engine (AWE)** : Modélisation des armures de tissage complexes (Jacquard) et génération des cartes de trame.

---

## 2. Feuille de Route d'Exécution Trimestrielle (Quarterly Deliverables)

Pour maintenir la dynamique de la plateforme, l'ambition scientifique d'ATCP est équilibrée par des livrables de production précis :

* **T1 : Excellence Géométrique et Topologique (Ribbon High Fidelity)**
  - *Livrable* : Algorithme complet de reconstruction de rubans (Acom Ribbon) atteignant une fidélité d'axe médian mesurée supérieure à $99.5\%$ sur le Golden Dataset.
* **T2 : Compilateur Modulaire (ATCP Intermediate Representation)**
  - *Livrable* : Intégration du compilateur à Représentation Intermédiaire (IR) avec deux backends machines fonctionnels de production : DST (Tajima) et PES (Brother).
* **T3 : Jumeau Numérique Mécanique (Physical Mass-Spring Twin)**
  - *Livrable* : Production d'une simulation physique temps réel en trois dimensions, validée sur un jeu d'étoffes de référence (Bazin Riche, Coton, Velours) pour la prédiction de retrait.
* **T4 : Industrialisation et Ouverture (ATCP SDK Release)**
  - *Livrable* : Publication de la version stable v2.0 d'ATCP, de son kit de développement logiciel (SDK @acom/atcp-sdk) et de son API unifiée pour les intégrations SaaS.

---

## 3. Découplage de la Recherche et du Code de Production (R&D Isolation)

Conformément aux principes de gouvernance d'Acom Technologie, la plateforme dissocie strictement son cycle de vie d'innovation de son cycle de vie de production en divisant les dépôts de codes :

1. **ATCP Platform (`acom-textile-platform`)** :
   - *Nature* : Code stable de production, hautement optimisé, testé, packagé et déployé.
   - *Gouvernance* : Contrôle strict du Validation Center, linter à $100\%$, couverture de tests maximale.
2. **ATCP Research (`acom-textile-research`)** :
   - *Nature* : Espace d'expérimentation exploratoire, de recherche académique, de prototypage et de modélisation (les 14 laboratoires R&D).
   - *Gouvernance* : Cadre flexible autorisant l'échec constructif (Research Log), nourri par le Golden Dataset. Les réussites validées transitent vers la production via le processus de RFC.
3. **ATCP Benchmark (`acom-textile-benchmark`)** :
   - *Nature* : Référentiel automatisé de métrologie et d'évaluation continue.
   - *Rôle* : Contient le Golden Dataset complet (1000 motifs de référence), les sorties binaires cibles des logiciels historiques (Wilcom, Hatch, Ink/Stitch) et les scripts d'analyse différentielle générant des rapports de non-régression automatique.
4. **ATCP SDK Examples (`acom-textile-sdk-examples`)** :
   - *Nature* : Collection de gabarits d'implémentation et de démonstrateurs pratiques.
   - *Rôle* : Fournit aux développeurs tiers des modèles simples d'importation SVG, de compilation unifiée (ATIR), d'optimisation de parcours et de simulation physique.

---

## 4. Le Processus ATCP RFC (Request For Comments)

Avant d'intégrer une modification majeure d'algorithme ou une nouvelle fonctionnalité structurelle dans la plateforme de production, une **RFC** doit être rédigée, revue par l'Audit Center et validée scientifiquement.

### Les Étoiles de Maturité d'une RFC :
- **Proposed** : Soumission de l'hypothèse et des bases mathématiques.
- **Approved** : Validation de l'architecture par l'Audit Center.
- **Prototype** : Démonstration du fonctionnement sur un échantillon restreint.
- **Validated** : Exécution réussie sur l'ensemble du Golden Dataset avec gains mesurés (**Règle 53 & 54**).
- **Integrated** : Fusion finale dans la plateforme stable.

---

## 5. Le Conseil Scientifique ATCP (ATCP Scientific Board)

Pour asseoir sa crédibilité et piloter la plateforme de calcul d'art textile de manière rigoureuse, un **Conseil Scientifique** unifié est constitué au sein d'Acom Technologie. 

### Rôle & Fonctionnement :
- **Arbitrage de Maturité** : Le conseil statue de manière souveraine sur le passage des RFC du statut de `Prototype` à `Validated`, puis `Integrated` sur la base exclusive des rapports de performance chiffrés du dépôt `acom-textile-benchmark`.
- **Validation Artisanale** : Il associe de grands artisans d'art textile et des maîtres tailleurs africains pour valider l'adéquation esthétique des points brodés générés avec le drapé physique traditionnel de référence.

---

## 6. L'Objectif Scientifique 2030

L'Acom Textile Computing Platform se fixe un cap historique et mesurable à l'horizon 2030 :

> **Objectif 2030** : Créer le premier moteur open-source de calcul textile capable de produire de manière totalement autonome une numérisation et une compilation de broderie industrielle dont la qualité est jugée équivalente ou supérieure à celle d'une programmation manuelle réalisée par un professionnel hautement expérimenté, mesurée sur un ensemble représentatif de 1000 motifs du Golden Dataset.

