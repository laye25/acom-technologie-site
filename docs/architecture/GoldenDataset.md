# Acom Embroidery Engine (AEE) - Jeu d'Essais Permanent (Golden Dataset)
**Maturité (Règle 52) :** Designed  

Le **Golden Dataset** est l'actif technique le plus précieux de l'Acom Embroidery Engine. Il s'agit d'un ensemble immuable de **1000 motifs de référence**, soigneusement sélectionnés pour couvrir l'intégralité du spectre de la broderie (de la géométrie simple à l'artisanat complexe d'art textile), servant de base à l'évaluation systématique de chaque modification d'algorithme.

---

## 1. Composition Thématique des 1000 Motifs

Le jeu de données est divisé en dix classes thématiques de 100 motifs chacune, permettant un ciblage précis lors des tests :

```
                        Golden Dataset (1000 Motifs)
                                     │
       ┌───────────┬───────────┬─────┴─────┬───────────┬───────────┐
       ▼           ▼           ▼           ▼           ▼           ▼
  [Simples]    [Complexes]  [Logos]     [Textes]   [Mandalas]  [Dentelles]
   (100)        (100)        (100)       (100)       (100)       (100)
```

### A. Motifs Simples (100 fichiers)
- **Contenu** : Formes géométriques parfaites (cercles, rectangles, polygones réguliers, étoiles).
- **Objectif** : Validation des bases de calcul d'intersections de Tatami et de la régularité des points.

### B. Motifs Complexes (100 fichiers)
- **Contenu** : Formes concaves imbriquées, polygones à trous, formes auto-intersectantes.
- **Objectif** : Robustesse face aux cas géométriques limites et résolutions de contours.

### C. Logos d'Entreprises (100 fichiers)
- **Contenu** : Logos vectoriels réels combinant lettrages, aplats de couleurs et détails fins.
- **Objectif** : Qualité de numérisation industrielle et respect des chartes graphiques.

### D. Textes et Monogrammes (100 fichiers)
- **Contenu** : Caractères typographiques variés (serif, sans-serif, script calligraphique, cursive).
- **Objectif** : Reconstruction fine en colonnes Satin et jonction des branches de lettres.

### E. Arabesques et Ornements (100 fichiers)
- **Contenu** : Volutes, arabesques, rinceaux floraux et tracés de courbes serrées.
- **Objectif** : Squelettisation par Voronoi, reconstruction de rubans (Acom Ribbon) et fanning de virages.

### F. Mandalas et Motifs Radiaux (100 fichiers)
- **Contenu** : Motifs complexes de symétrie circulaire à forte densité géométrique.
- **Objectif** : Évaluation de la déformation accumulée et comportement physique des couches de fils.

### G. Dentelles et Motifs Transparents (100 fichiers)
- **Contenu** : Structures de grilles ouvertes, résilles, motifs de dentelle d'art.
- **Objectif** : Remplissages en treillis léger (Lattice) préservant la flexibilité naturelle du tissu.

### H. Motifs Ethniques & Wax Africain (100 fichiers)
- **Contenu** : Dessins géométriques denses typiques des motifs de tissus wax africains.
- **Objectif** : Analyse sémantique par IA (Acom PI) et sélection des meilleures stratégies de remplissage.

### I. Emblèmes et Écussons (100 fichiers)
- **Contenu** : Écussons militaires, sportifs et académiques avec bordures épaisses (Satin de bordure).
- **Objectif** : Optimisation des déplacements de contours et alignement des bordures.

### J. Portraits et Photo-Broderie (100 fichiers)
- **Contenu** : Photographies converties en trames de points (halftone, dithering de points).
- **Objectif** : Capacité de calcul de grand volume (plus de 150 000 points) et temps d'exportation.

---

## 2. Métriques de Référence Immuables (Ground Truth Metrics)

Chaque motif $m_i$ ($i \in [1, 1000]$) du Golden Dataset est associé à un fichier de métadonnées contenant les valeurs de référence absolues :

- **SVG Source** : Fichier vectoriel d'entrée.
- **DST de Référence** : Fichier machine idéal validé manuellement par un maître tailleur d'Acom Technologie.
- **Stitches Count ($N_{\text{stitches}}$)** : Nombre exact de points.
- **Thread Length ($L_{\text{thread}}$)** : Longueur de fil de broderie nécessaire en millimètres.
- **Trim Count ($N_{\text{trims}}$)** : Nombre de coupures de fil optimal.
- **Machine Time ($T_{\text{machine}}$)** : Temps de broderie réel estimé sur machine Tajima TFMX.

---

## 3. Détection des Régressions (Règle 53)

À chaque cycle de validation du pipeline :
1. Le moteur génère un nouveau fichier DST pour chacun des 1000 motifs.
2. Un algorithme de comparaison automatique (Diff Engine) calcule la déviation quadratique moyenne (MSE) par rapport à la référence :
   
$$\text{MSE} = \frac{1}{N} \sum_{j=1}^{N} \|\mathbf{P}_j^{\text{nouveau}} - \mathbf{P}_j^{\text{référence}}\|^2$$

3. Si la déviation ou l'un des indicateurs de fil/trims varie négativement de plus de $0.5\%$ sans justification documentée, la modification est refusée (respect strict de la **Règle 53**).
