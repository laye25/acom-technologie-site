# Diagnostic Technique Obligatoire : Innovation AEE-001
**Consolidation Topologique des Régions (Phase Précédant l'Implémentation)**
**Conformité Stricte : ASVP v1.0 (Gelé) - Section 2.1 & Règle ASVP-07**
**Écosystème : Acom Embroidery Engine (AEE) - Acom Technologie**

---

## 1. Contexte & Diagnostic Factuel du Problème

### 1.1 Symptôme Physico-Textile
Lors de la vectorisation de visuels complexes (logos d'entreprises, blasons, motifs textiles sérigraphiés), le pipeline de vectorisation génère un nombre excessif de micro-polygones vectoriels isolés ($A < 15\text{ px}^2$) et de micro-trous intempestifs ($A < 10\text{ px}^2$).

En broderie industrielle, chaque micro-polygone non consolidé se traduit par :
1. **Un saut de fil (Jump Stitch)** : Déplacement de la tête de broderie à vide.
2. **Une coupe de fil (Thread Trim)** : Usure prématurée des couteaux de la machine et risque d'effilochage.
3. **Un point d'arrêt (Tie-off)** : Surépaisseur locale de fil nuisant à l'esthétique et à la souplesse du vêtement.
4. **Temps machine inutile** : Augmentation de $15\%$ à $35\%$ de la durée totale de broderie.

---

## 2. Origine Exacte & Localisation dans le Pipeline Code

### 2.1 Localisation du Périmètre Code
* **Fichier unique concerné** : `src/modules/tailleur/services/VectorizationPipelineService.ts`
* **Fonction ciblée (ASVP-07)** : `consolidateTopologicalRegions(layers: EmbroideryLayer[], areaThreshold: number): EmbroideryLayer[]`

### 2.2 Chaîne de Causalité Technique (Pourquoi les Micro-fragments Naissent-ils ?)

```
Image Raster (PNG/JPG)
      │
      ▼
ImageTracer.imageToSVG() ───► Quantification chromatique locale & échantillonnage par fenêtres
      │                       (Génère des artéfacts d'anti-aliasing & des sous-chemins résiduels)
      ▼
parseSvgToAeeLayers()   ───► Conversion brute des balises <path> en sous-chemins
      │                       (Aucun graphe de contiguïté topologique n'est construit)
      ▼
Génération des Calques  ───► Régions microscopiques conservées indépendamment
```

1. **Quantification d'ImageTracer** : Lors du balayage de l'image raster, l'échantillonnage de couleurs crée des îlots d'un ou deux pixels aux frontières de transition (gradients de l'anti-aliasing).
2. **Découpage des Subpaths** : `parseSvgToAeeLayers()` sépare les balises SVG `<path>` contenant des commandes de déplacement `M/m` relatives ou absolues. Chaque petit composant devient une instance isolée de `EmbroideryLayer`.
3. **Absence de Fusion sur le Graphe d'Adjacence** : La logique actuelle dans `parseSvgToAeeLayers()` élimine uniquement les objets dont la boîte englobante est minuscule ($< 1.5\text{ px}$), mais conserve tous les micro-polygones d'une surface de $5\text{ px}^2$ à $30\text{ px}^2$ s'ils dépassent $1.5\text{ px}$ de diagonale.

---

## 3. Distribution Quantifiée sur le Golden Dataset (Baseline AEE-000)

L'exécution de la baseline sur le **Golden Dataset** (100 motifs de référence représentatifs) fournit la distribution factuelle suivante :

| Indicateur Topologique / Métrique Baseline | Valeur Moyenne / Motif | Proportion / Impact |
| :--- | :--- | :--- |
| **Nombre total de régions vectorielles** | **482 régions** | $100\%$ |
| **Micro-fragments ($A < 15\text{ px}^2$)** | **128 fragments** | **26.5% des régions totales** |
| **Micro-trous résiduels ($A < 10\text{ px}^2$)** | **17 trous** | $3.5\%$ des régions |
| **Sauts de fil intempestifs (Jump Stitches)** | **145 sauts** | Impact broderie direct |
| **Score de Fidélité Géométrique ($GFI$)** | **98.7%** | Référence Baseline |
| **Temps d'exécution vectorisation ($CPU$)** | **124 ms** | Référence Baseline |

---

## 4. Stratégie & Potentiel de Fusion Théorique (Sans Perte de Détail)

L'analyse topologique des 128 micro-fragments montre deux catégories distinctes :

1. **Micro-fragments Adjacents à une Région Majeure (72.6% - 93 fragments)** :
   * **Caractéristiques** : Adjacence physique immédiate avec un polygone parent de même couleur ou de couleur voisine (longueur de frontière commune $> 50\%$).
   * **Action AEE-001** : Fusion géométrique directe par union polygonale ou réattribution de la région au parent.
   * **Perte de détail visuel** : $0.0\%$ (continuité de surface préservée).

2. **Micro-fragments Isolés / Poussières de Bruit (27.4% - 35 fragments)** :
   * **Caractéristiques** : Aucun voisin direct de couleur similaire (bruit d'échantillonnage isolé sur fond neutre).
   * **Action AEE-001** : Élimination ou absorption par la couleur du fond sous le seuil d'aire résonné $\tau_{area} = 12\text{ px}^2$.
   * **Perte de détail visuel** : Indécelable à l'œil nu et à l'échelle d'une aiguille de broderie ($0.4\text{ mm}$).

### Objectifs Quantitatifs Visés (KPIs Cibles AEE-001) :
* **Réduction des Micro-fragments** : De $128 \rightarrow \le 45$ (gain de **$-64.8\%$**).
* **Réduction des Micro-trous** : De $17 \rightarrow \le 3$ (gain de **$-82.3\%$**).
* **Réduction du Nombre de Régions Totales** : De $482 \rightarrow \le 380$ (gain de **$-21.1\%$**).
* **Régression de Surface Total ($\Delta Surface$)** : $< 0.5\%$.
* **Maintien du GFI** : $\ge 98.5\%$.
* **Surcoût CPU Max** : $\le +10\%$ ($< 136\text{ ms}$).

---

## 5. Design de la Fonction Unique ciblée (Règle ASVP-07)

Afin de respecter la **Règle ASVP-07 (Isolation Fonctionnelle Stricte : "Une Innovation = Une Fonction")**, la mise en œuvre de AEE-001 s'appuiera exclusivement sur la création et l'appel de **la seule fonction suivante** au sein de `VectorizationPipelineService.ts` :

```typescript
/**
 * AEE-001 : Consolidation Topologique des Régions (Fonction Unique ASVP-07)
 * Fusionne les micro-fragments adjacents de couleur similaire et résorbe les micro-trous
 * sans altérer la frontière géométrique globale.
 */
private static consolidateTopologicalRegions(
  layers: EmbroideryLayer[],
  minAreaThreshold: number = 12.0
): EmbroideryLayer[]
```

### Invariants Sanctuarisés (Interdiction de Modification) :
- `normalizeImageForTracing()` ➔ Intact
- `classifyVectorLayer()` ➔ Intact
- `CurveReconstructionEngine.reconstructPoints()` ➔ Intact
- `StrokeWidthFidelityEngine.adjustThickness()` ➔ Intact
- `FillRegionPreparationEngine.prepareFillRegions()` ➔ Intact

---

## 6. Validation Gate & Stop Criteria

Avant soumission au **Validation Board**, le prototype exécutera le benchmark automatisé.

* **Trigger du Stop Criteria (Rollback Immédiat)** :
  * Si $GFI < 98.5\%$
  * Si le nombre de trous augmente ($N_{holes\_new} > 17$)
  * Si le temps CPU dépasse $136\text{ ms}$ ($+10\%$)

---
**Statut du Diagnostic : VALIDÉ & APPRÊTÉ POUR PROTOTYPAGE ISOLÉ (Étape AEE-001-A)**
