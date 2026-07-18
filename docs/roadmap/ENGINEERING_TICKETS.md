# ATCP Algorithmic Sprints & Engineering Tickets
**Maturité (Règle 52) :** Designed  

Conformément au gel de la gouvernance et de la documentation d'architecture, ATCP entre dans sa phase d'industrialisation et d'exécution orientée données. Ce document répertorie les tickets d'ingénierie prioritaires et la séquence des sprints de stabilisation du noyau de calcul.

---

## 1. Séquence de Développement Prioritaire (No-Ripple Sequence)

Afin d'éviter tout effet de bord (où un module aval dépendrait d'une géométrie ou d'une topologie incorrecte), les composants sont implémentés, stabilisés et interconnectés dans l'ordre strict suivant :

1. **Geometry Engine v2** : Traitement de la géométrie de base sans biais directionnels, avec courbures adaptatives, conservation des micro-détails et simplification sans perte.
2. **Topology Engine v1** : Conservation absolue des trous, contreformes, îlots, modélisés par arbre topologique parent-enfant (Euler-Poincaré, Winding Number, Graphe de Régions).
3. **Ribbon Reconstruction Engine** : Squelettisation d'axe médian de largeur variable s'appuyant sur les primitives géométriques et topologiques stabilisées.
4. **Tatami Engine v2** : Moteur de remplissage haute performance tirant profit des structures géométriques, topologiques et des rubans d'axe médian.
5. **Satin Engine** : Colonnes satin stables à direction variable d'angles de points sur les rubans d'épaisseur variable.
6. **Travel Optimizer** : Optimisation globale de la trajectoire (TSP-PC) pour la réduction active des coupes (Trims) et sauts.
7. **Physics Engine** : Application finale des compensations asymétriques de déformation du tissu (tension active d'étoffe).

---

## 2. Registre des Tickets d'Ingénierie des Sprints (S1 à S7)

### 🎫 TICKET-S1 : Geometry Engine v2
*   **Module** : `Geometry Engine`
*   **Priorité** : Critique (Bloquant)
*   **Objectif** : Stabiliser le noyau de calcul géométrique et d'interpolation de splines directionnelles, en éliminant les biais directionnels et en préservant les micro-détails.
*   **Entrées** : Tracés vectoriels bruts (SVG, tracés Bézier).
*   **Sorties** : Courbes de splines directionnelles adoucies et de courbure adaptative sans perte d'information.
*   **Critères d'Acceptation & Validation** :
    *   ✓ Distance de Hausdorff moyenne entre le tracé lissé et l'original $\le 0.05\text{ mm}$ sur 1000 motifs.
    *   ✓ Conservation parfaite des micro-détails de virages serrés.
    *   ✓ Indice de Fidélité Géométrique (**GFI**) $\ge 99.0\%$.

---

### 🎫 TICKET-S2 : Topology Engine v1
*   **Module** : `Topology Engine`
*   **Priorité** : Critique (Bloquant)
*   **Objectif** : Assurer la conservation absolue des vides, trous et structures imbriquées sur les glyphes de caractères et logos complexes par arbre d'inclusion.
*   **Entrées** : Tracés vectoriels géométriques (issus de S1).
*   **Sorties** : Graphe de Régions et relations topologiques d'îlots d'exclusion.
*   **Critères d'Acceptation & Validation** :
    *   ✓ Préservation à $100.0\%$ des contreformes et trous sur les lettres de référence (`A`, `B`, `O`, `P`, `Q`, `R`, `8`, `0`, `@`).
    *   ✓ Taux d'Indice de Préservation Topologique (**TPI**) $= 100.0\%$.
    *   ✓ Invariance de la caractéristique d'Euler-Poincaré $\chi$.

---

### 🎫 TICKET-S3 : Ribbon Reconstruction v1
*   **Module** : `Ribbon Engine`
*   **Priorité** : Haute
*   **Objectif** : Construire le moteur de squelettisation et de reconstruction géométrique de rubans d'épaisseur variable sur des primitives géométriques/topologiques saines.
*   **Entrées** : Tracés lissés et topologiquement certifiés (S1 et S2).
*   **Sorties** : Axe médian (Medial Axis), largeurs locales associées et rails de guidage.
*   **Critères d'Acceptation & Validation** :
    *   ✓ Élimination complète des auto-intersections locales de rails.
    *   ✓ Indice de Fidélité Géométrique des rubans $\ge 98.5\%$.

---

### 🎫 TICKET-S4 : Tatami Engine v2
*   **Module** : `Satin / Tatami Fill Engine`
*   **Priorité** : Moyenne
*   **Objectif** : Générer des remplissages de Tatami haute densité stables, sans effet d'entonnoir ni artefacts d'angles directionnels.
*   **Entrées** : Polygones complexes avec trous (fournis par le Topology Engine S2).
*   **Sorties** : Matrice triée de points d'impacts d'aiguille alignés sur des lignes parallèles avec décalage de motif (Pattern Shift).
*   **Critères d'Acceptation & Validation** :
    *   ✓ Décalage régulier sans accumulation de points d'aiguille sur les mêmes lignes de trame.
    *   ✓ Zéro trou physique résiduel ou zone non couverte sur les polygones d'angles vifs.
    *   ✓ Indice de Qualité de Remplissage (Tatami Quality Score) $\ge 96.0\%$.

---

### 🎫 TICKET-S5 : Satin Engine v2
*   **Module** : `Satin / Column Fill Engine`
*   **Priorité** : Moyenne
*   **Objectif** : Générer des colonnes Satin stables à orientation variable d'angles de points (Stitch Angles) sur les rubans d'épaisseurs variables.
*   **Entrées** : Rails de guidage (fournis par le Ribbon Engine S3).
*   **Sorties** : Liste de coordonnées de points alternés droite-gauche (Satin stitches).
*   **Critères d'Acceptation & Validation** :
    *   ✓ Transition d'angle fluide (Lissage de courbure d'orientation par spline adaptative).
    *   ✓ Élimination des cassures de direction et des sur-densités intérieures dans les virages serrés (Short Stitch Fanning actif).
    *   ✓ Indice de Qualité Satin $\ge 98.0\%$.

---

### 🎫 TICKET-S6 : Travel Optimizer (TSP-PC)
*   **Module** : `Travel Engine`
*   **Priorité** : Haute
*   **Objectif** : Optimiser l'ordonnancement de broderie des blocs pour réduire au minimum absolu le nombre de coupes de fil (Trims) et de sauts (Jumps).
*   **Entrées** : Graphe de dépendances de blocs d'instructions sémantiques (ATIR).
*   **Sorties** : Séquence d'exécution ordonnée minimisant la distance euclidienne de déplacement hors-broderie.
*   **Critères d'Acceptation & Validation** :
    *   ✓ Réduction du nombre de coupes (Trims) $\ge 25\%$ par rapport à une génération naïve.
    *   ✓ Respect strict des dépendances d'empilement (Underlay brodé avant le Satin/Tatami associé).
    *   ✓ Indice d'Efficience machine (**SEI**) $\ge 98.0\%$.

---

### 🎫 TICKET-S7 : Physics Engine & Machine Export
*   **Module** : `Physics Engine & Machine Compilation`
*   **Priorité** : Haute
*   **Objectif** : Appliquer les calculs mécaniques de compensation active d'étoffe et sérialiser de manière exacte les instructions d'usinage binaires (DST/PES) sans dérive d'arrondi Bresenham.
*   **Entrées** : Points de broderie réels issus des moteurs précédents.
*   **Sorties** : Flux d'octets binaires encodés compenses des forces push-pull de déformation textile.
*   **Critères d'Acceptation & Validation** :
    *   ✓ Compensation de déformation asymétrique active selon le tissu.
    *   ✓ Dérive cumulative de coordonnées de fin de course $\le 0.05\text{ mm}$ (Bresenham étendu).
    *   ✓ Validation à 100% de la conformité du format binaire par les émulateurs de machines physiques.

---

## 3. Objectif Stratégique 2027 : Moteur Textile Générique Multi-Procédés

ATCP ne se limite pas à la broderie classique. Son architecture s'oriente vers un **noyau de calcul textile universel**. La représentation intermédiaire sémantique (**ATIR**) est conçue pour être indépendante du procédé final :
*   **Broderie** : Backend de génération de points (DST, PES, JEF, EXP...).
*   **Découpe Laser & Vinyle** : Backend de vectorisation de chemins de découpe continus.
*   **Impression Textile & Tricot CNC / Jacquard / Quilting** : Backends de trame et d'empilement textile.

---

## 4. Tableau de Bord des KPIs d'Ingénierie (Engineering KPIs)

Chaque exécution du **BenchmarkRunner** consolide les indicateurs individuels des moteurs pour produire une note globale de performance algorithmique :

| Moteur Associé | KPI Metric | Note de Référence | Note Actuelle | Seuil de Tolérance | Statut |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Geometry Engine** | **Geometry Score** (GFI / Hausdorff) | -- | -- | $\ge 99.0\%$ | -- |
| **Topology Engine** | **Topology Score** (TPI / Isomorphisme) | -- | -- | $= 100.0\%$ | -- |
| **Ribbon Engine** | **Ribbon Score** (Hausdorff rails / Intersect) | -- | -- | $\ge 98.5\%$ | -- |
| **Satin / Tatami** | **Tatami Score** (Densité / Pattern regularity) | -- | -- | $\ge 96.0\%$ | -- |
| **Travel Engine** | **Travel Score** (SEI / Taux de Trims) | -- | -- | $\ge 98.0\%$ | -- |
| **Physics Engine** | **Physics Score** (Précision compensation push-pull) | -- | -- | $\ge 97.0\%$ | -- |
| **Machine Backend** | **Machine Score** (Précision Bresenham / Dérive) | -- | -- | $\ge 99.9\%$ | -- |
| **Global** | **Overall Engine Score** (Moyenne pondérée) | -- | -- | $\ge 98.0\%$ | -- |

---

## 5. Matrice d'Évaluation de Non-Régression de Sprint (Golden Dataset)

Chaque fin de sprint d'ingénierie donne lieu au calcul et à la mise à jour de la matrice métrique comparative suivante sur le Golden Dataset :

| Indicateur Métrique | Sprint Précédent (Baseline) | Sprint Actuel | Évolution | Seuil Target | Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Geometry Fidelity Index (GFI)** | -- | -- | -- | $\ge 98.5\%$ | -- |
| **Topology Preservation Index (TPI)** | -- | -- | -- | $= 100.0\%$ | -- |
| **Stitch Efficiency Index (SEI)** | -- | -- | -- | $\ge 98.0\%$ | -- |
| **Textile Physics Index ($TPI^2$)** | -- | -- | -- | $\ge 97.0\%$ | -- |
| **Semantic Understanding Index (SUI)** | -- | -- | -- | $\ge 95.0\%$ | -- |
| **Nombre total de points** | -- | -- | -- | Optimisation active | -- |
| **Nombre total de Trims** | -- | -- | -- | Réduction active | -- |
| **Temps d'usinage machine** | -- | -- | -- | Optimisation active | -- |
| **Régressions géométriques** | -- | -- | -- | **$= 0$** | -- |
