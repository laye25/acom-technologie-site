# Scientific Specification: ATCP Mathematical Specifications
**Maturité (Règle 52) :** Designed  

Ce document pose les bases scientifiques, théoriques et formelles de l'**Acom Textile Computing Platform (ATCP)**. Il sert de référence mathématique immuable pour garantir la rigueur des calculs du noyau géométrique et physique, indépendamment des évolutions technologiques de la base de code.

---

## Volume I : Computational Geometry (Géométrie Computationnelle)

Ce volume traite de la discrétisation, du lissage et du découpage de formes géométriques complexes.

### 1. Continuité et Lissage Bézier
La reconstruction de courbes continues s'appuie sur des splines cubiques de Bézier définies par :

$$\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t) t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3, \quad t \in [0, 1]$$

La discrétisation adaptative s'assure que l'erreur de corde (la distance maximale entre le segment de droite discrétisé et la courbe de Bézier réelle) ne dépasse jamais un seuil de précision $\epsilon_{\text{chord}} = 0.05\text{ mm}$ :

$$\max_{t_i \le t \le t_{i+1}} \|\mathbf{B}(t) - \mathbf{S}_i(t)\| \le \epsilon_{\text{chord}}$$

### 2. Décomposition Polygonale Plane
Toute surface concave complexe $\Omega$ est partitionnée en un ensemble de sous-polygones convexes $\omega_k$ pour le calcul des trajectoires de Tatami :

$$\Omega = \bigcup_k \omega_k, \quad \omega_i \cap \omega_j = \emptyset \quad \forall i \neq j$$

---

## Volume II : Ribbon Theory (Théorie des Rubans et Axes Médians)

Le ruban est défini comme une variété bidimensionnelle paramétrée le long d'une courbe directrice centrale.

### 1. Formulations de l'Axe Médian (Medial Axis Transform - MAT)
L'axe médian d'une forme fermée $\mathcal{S} \subset \mathbb{R}^2$ est le lieu géométrique des centres des disques maximaux inscrits dans $\mathcal{S}$ :

$$\text{MAT}(\mathcal{S}) = \left\{ \mathbf{p} \in \mathcal{S} \mid \exists \mathbf{c} \in \mathbb{R}^2, r > 0 \text{ t.q. } \mathcal{B}(\mathbf{c}, r) \subseteq \mathcal{S}, \mathbf{p} \in \partial \mathcal{B}(\mathbf{c}, r) \text{ et } |\partial \mathcal{B} \cap \partial \mathcal{S}| \ge 2 \right\}$$

### 2. Reconstruction des Rails Satin (Symmetric Rails Generation)
Soit $\gamma(s)$ l'axe médian paramétré par son abscisse curviligne $s$, et $R(s)$ la fonction de rayon local (demi-largeur). Les rails gauche $\mathbf{R}_L(s)$ et droit $\mathbf{R}_R(s)$ sont construits par décalage le long du vecteur normal unitaire $\mathbf{n}(s)$ :

$$\mathbf{R}_L(s) = \gamma(s) + R(s) \mathbf{n}(s), \quad \mathbf{R}_R(s) = \gamma(s) - R(s) \mathbf{n}(s)$$

---

## Volume III : Embroidery Physics (Rhéologie et Physique du Fil et du Tissu)

Ce volume décrit la physique du point de broderie et de la déformation des matières.

### 1. Modèle de Déplacement par Éléments Finis (Push-Pull Solver)
Le tissu est modélisé comme un milieu élastique bidimensionnel caractérisé par son tenseur des contraintes $\boldsymbol{\sigma}$ et son tenseur des déformations $\boldsymbol{\varepsilon}$. La relation de comportement est régie par la loi de Hooke généralisée :

$$\boldsymbol{\sigma} = \mathbf{C} : \boldsymbol{\varepsilon}$$

L'équation d'équilibre statique en présence des forces de tension du fil $\mathbf{f}_{\text{thread}}$ s'écrit :

$$\nabla \cdot \boldsymbol{\sigma} + \mathbf{f}_{\text{thread}} = 0$$

### 2. Formule de Compensation Active (Active Pull-Compensation)
Pour contrecarrer le rétrécissement transversal lors de la pose d'un point Satin de largeur $w$, la largeur corrigée $w_{\text{comp}}$ est calculée par :

$$w_{\text{comp}} = w + \alpha_{\text{pull}} \left( \frac{T_{\text{emb}}}{C_{\text{fabric}} \cdot d_{\text{stitch}}} \right) w$$

---

## Volume IV : Machine Compilation (Théorie de la Compilation)

Ce volume théorise le passage d'une représentation abstraite à un flux binaire machine.

### 1. Forme de Représentation Intermédiaire (ATCP-IR)
Le flux géométrique abstrait est compilé sous forme d'instructions sémantiques universelles au sein d'une structure de graphe orienté acyclique (DAG).

### 2. Optimisation Ordonnancée (Traveling Salesperson with Precedence Constraints - TSP-PC)
Soit un ensemble d'objets de broderie $\mathcal{O} = \{O_1, \dots, O_M\}$ et une relation d'ordre partiel $\prec$ découlant des contraintes physiques (ex : broder un fond avant de broder le texte qui le recouvre) :

$$\min_{\pi \in \mathfrak{S}_M} \sum_{k=1}^{M-1} d(Out_{\pi(k)}, In_{\pi(k+1)}) \quad \text{sujet à} \quad O_i \prec O_j \implies \pi^{-1}(i) < \pi^{-1}(j)$$

---

## Volume V : Semantic Embroidery (Ontologies et Graphes de Connaissances)

Ce volume formalise la sémantique appliquée au textile.

### 1. L'Ontologie Sémantique de la Broderie (Embroidery Ontology)
Définition formelle des classes et prédicats décrivant les relations entre les concepts textiles :

$$\forall x \left( \text{BazinRiche}(x) \implies \text{Fabric}(x) \wedge \text{HighDensityRequired}(x) \wedge \text{SatinContourMandatory}(x) \right)$$

---

## Volume VI : AI Models (Modèles Prédictifs Déterministes)

Ce volume définit les fonctions d'évaluation et de prédiction d'attributs de broderie par apprentissage automatique.

### 1. Fonction de Coût IA de Complexité Géométrique
Une fonction d'évaluation neuronale estime l'indice de risque de bris d'aiguille d'une région à partir de son spectre de courbure et de sa densité locale :

$$R_{\text{needle}} = \sigma \left( \mathbf{W}_2 \cdot \max \left( 0, \mathbf{W}_1 \cdot \mathbf{x} + \mathbf{b}_1 \right) + \mathbf{b}_2 \right)$$

où $\mathbf{x}$ est le vecteur de caractéristiques géométriques locales (épaisseur minimale, angle maximal, densité nominale).
