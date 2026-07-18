# ADR-008 : Spécifications Mathématiques du Moteur Physique (Physics Engine)

**Maturité (Règle 52) :** Designed
**Date :** 2026-07-14
**Auteurs :** ACOM Research & Validation Office

## 1. Contexte et Hypothèses

La compilation géométrique pure (Geometry, Topology, Ribbon) ignore les forces physiques exercées par le fil sur le tissu. Conformément aux **Règles 56 et 57**, l'AEE doit modéliser ces forces avant de générer l'ATIR final, afin de compenser les déformations.

Le *Physics Engine* repose sur trois modèles : `FabricModel` (Tissu), `ThreadModel` (Fil), `NeedleModel` (Aiguille).

## 2. Phénomène Push-Pull (PushPullSolver)

Le "Push-Pull" (Poussée-Traction) est la déformation asymétrique dominante en broderie. Le fil, sous tension, *tire* le tissu dans la direction des points (Pull), tandis que l'accumulation de fil *pousse* le tissu perpendiculairement (Push).

### 2.1 Équations Vectorielles de Base

Soit $\theta$ l'orientation locale du point de satin (en radians).
Soit $\rho$ la densité locale (points/mm).
Soit $E_f$ l'élasticité du tissu (`FabricModel.elasticity`).
Soit $T_f$ l'épaisseur du tissu (`FabricModel.thickness`).

**Vecteur de Traction (Pull)** - provoque un raccourcissement de la colonne le long de l'axe de couture :
$$ \vec{V}_{pull} = \rho \cdot E_f \cdot C_{pull} \cdot \begin{pmatrix} \cos(\theta) \\ \sin(\theta) \end{pmatrix} $$

**Vecteur de Poussée (Push)** - provoque un élargissement de la colonne perpendiculairement à l'axe de couture :
$$ \vec{V}_{push} = \rho \cdot T_f \cdot C_{push} \cdot \begin{pmatrix} \cos(\theta + \frac{\pi}{2}) \\ \sin(\theta + \frac{\pi}{2}) \end{pmatrix} $$

**Vecteur de Compensation Totale :**
$$ \vec{C} = \vec{V}_{pull} + \vec{V}_{push} $$

Où $C_{pull}$ et $C_{push}$ sont des constantes de calibration empiriques définies par défaut à $0.05$ et $0.02$.

Dans l'implémentation, chaque point $P_i$ généré par le `SatinPass` ou le `TatamiPass` est translaté par le vecteur inverse $-\vec{C}$ pour anticiper la déformation.

## 3. Détection de Collisions (CollisionSolver)

L'accumulation de fil (Thread Buildup) au même endroit de la grille provoque des densités critiques, augmentant drastiquement le risque de casse de l'aiguille (`NeedleModel`) et de rupture du fil (`ThreadModel`).

### 3.1 Modélisation par Grille de Densité Spatiale

L'espace de broderie est discrétisé. Pour un ensemble de points $P = \{p_1, p_2, \dots, p_n\}$, on définit l'indice de densité local $D(x, y)$ comme le nombre de pénétrations dans le rayon d'influence de l'aiguille $r_a$ (qui dépend de `NeedleModel.diameter`).

$$ D(x,y) = \sum_{i=1}^n \mathbb{1}_{\sqrt{(p_{ix}-x)^2 + (p_{iy}-y)^2} < r_a} $$

Si $D(x,y) > D_{max}$ (seuil critique, ex: 8 pénétrations dans un rayon de 0.5mm), le solveur enregistre une erreur `multiplePenetrations` et pénalise le score `collisionIndex` dans les `PhysicsMetrics`.

## 4. Tension et Buckling (TensionSolver & BucklingSolver)

Le flambement (Buckling) du tissu se produit lorsque la pression de densité dépasse la raideur du support.

$$ \text{Risque} = \frac{\rho \cdot S_f}{T_f + 0.1} $$

Où $S_f$ est la raideur (`stiffness`). Un risque $> 80$ indique un gondolement inévitable sans stabilisateur additionnel.
