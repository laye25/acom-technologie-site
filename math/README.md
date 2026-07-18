# ATCP Mathematical Knowledge Base (MKB)
**Maturité (Règle 52) :** Designed  

Bienvenue dans la base de connaissances mathématiques de l'**Acom Textile Computing Platform (ATCP)**. Ce référentiel centralise l'ensemble des théorèmes, démonstrations, équations de comportement, méta-heuristiques d'optimisation et modèles d'apprentissage machine qui régissent le noyau de calcul textile d'Acom.

---

## 1. Organisation du Référentiel Sémantique

Chaque sous-dossier de `/math/` est dédié à une discipline scientifique spécifique :

```
                                  /math/
                                    │
         ┌──────────┬──────────┬────┴─────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼          ▼          ▼
     geometry/  topology/   physics/  optimiz./   machine/   vision/ (et ai/)
```

### 📁 [geometry/](./geometry/README.md) — Géométrie Computationnelle Textile
- **Sujets** : Splines cubiques de Bézier, lissage adaptatif de trajectoire, décomposition polygonale plane, calcul de l'erreur géométrique de Hausdorff.
- **Actifs de recherche** : Détermination dynamique de l'épaisseur transversale locale par analyse d'aires locales.

### 📁 [topology/](./topology/README.md) — Topologie Algorithmique Textile
- **Sujets** : Indice d'enroulement (Winding Number), caractéristique d'Euler-Poincaré, squelettisation et graphes d'adjacence de rubans (Acom Ribbon Graph).
- **Actifs de recherche** : Algorithmes robustes de détection de contreformes imbriquées (exclusion de vides) pour éliminer les aiguillettes superflues.

### 📁 [physics/](./physics/README.md) — Mécanique Textile et Rhéologie du Fil
- **Sujets** : Systèmes masse-ressort tridimensionnels (mass-spring), éléments finis bidimensionnels, prédiction du froncement de couture (puckering), compensation de tension active.
- **Actifs de recherche** : Modélisation des micro-frottements fibre-aiguille sous haute vitesse ($1200\text{ points/min}$).

### 📁 [optimization/](./optimization/README.md) — Optimisation Combinatoire
- **Sujets** : TSP avec contraintes de précédence (TSP-PC) par programmation dynamique et méta-heuristiques, réduction du temps machine global et de la consommation de fil perdu.
- **Actifs de recherche** : Solveur de contraintes multicritères sur les graphes de parcours d'aiguille.

### 📁 [machine/](./machine/README.md) — Théorie de la Compilation Binaire Machine
- **Sujets** : Analyseurs d'instructions, formats binaires d'usinage (DST, PES, JEF, EXP), déviation d'arrondi binaire, backends spécifiques aux fabricants de machines industrielles (Tajima, Brother, Barudan).
- **Actifs de recherche** : Compensation de jeu mécanique sur le portique de broderie.

### 📁 [vision/ et ai/](./vision/README.md) — Vision Sémantique et Apprentissage Automatique
- **Sujets** : Segmentation d'images par micro-réseaux, extraction d'objets sémantiques (lettrage, contours dominants), modèles déterministes d'aide à la numérisation.
- **Actifs de recherche** : Prédiction neuronale d'angles de remplissage Tatami.

---

## 2. Intégrité Mathématique (Règles 54 & 57)

Toute équation implémentée dans la branche stable d'ATCP doit impérativement provenir d'une démonstration validée dans ce dossier. La base de connaissances mathématiques est immuable et s'enrichit par le biais du processus de **RFC**.
