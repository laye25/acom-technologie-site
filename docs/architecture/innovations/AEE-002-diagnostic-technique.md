# Diagnostic Technique Phase 1 : Innovation AEE-002
**Clustering Watershed Adaptatif (Region Segmentation Engine)**
**Conformité Stricte : ASVP v1.0 & Règle 50 (AGENTS.md Level 1)**
**Écosystème : Acom Embroidery Engine (AEE) - Acom Technologie**

---

## 1. Description de la Défaillance Métier & Factuelle

### 1.1 Contexte & Problème
Sur les images d'entrée matricielles (PNG transparents, logos exportés de Canva/Inkscape avec compression ou anti-aliasing), la segmentation couleur actuelle basée sur la simple distance RGB crée deux artefacts critiques :
1. **Effet "Frange / Dent de Scie"** : Les pixels intermédiaires de flou d'anti-aliasing sont attribués aléatoirement à des micro-couches différentes, créant des lignes de contour hachées.
2. **Sur-segmentation Parasite** : Génération de 15% à 30% de régions inutiles sur les limites de contours, qui surchargent ensuite les algorithmes de remplissage Satin et Tatami et provoquent des vagues inutiles sur les trajectoires d'aiguille.

### 1.2 Cas Perturbés du Golden Dataset
L'analyse sur le Golden Dataset identifie 4 motifs particulièrement affectés par ce défaut de segmentation amont :
* **Motif 04 (Logo Canva Gradient / Contours Flous)** : Bords en zigzag sur les typographies épaisses.
* **Motif 07 (Armoiries Complexes avec Anti-Aliasing)** : Multiplication des micro-bandes de transition.
* **Motif 09 (PNG Transparent à Bords Doux)** : Halo de pixels semi-transparents segmentés en faux contours.
* **Motif 11 (Blason Inkscape à Ombres Portées)** : Découpage arbitraire des ombres douces en grilles rigides.

---

## 2. Localisation dans l'Architecture & Point d'Injection

Le composant Watershed Adaptatif s'injectera dans le **`Region Segmentation Engine`** au tout début du pipeline de vectorisation :

```
[ Image Raster (PNG/JPEG) ]
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ Region Segmentation Engine                              │
│                                                        │
│  [Actuel] Color Distance sRGB                         │
│     │                                                  │
│     ▼ (Remplacement par AEE-002)                       │
│  [AEE-002] Gradient Map CIELAB + Watershed Flooding     │
└────────────────────────────────────────────────────────┘
            │
            ▼
[ Régions Homogènes Nettoyées ] ──► [ Topology Engine (AEE-001 FROZEN) ]
```

---

## 3. Spécification de l'Algorithme Watershed Adaptatif

1. **Conversion CIELAB** : Conversion des pixels de l'image de sRGB vers l'espace $L^*a^*b^*$ pour mesurer la distance perceptuelle $\Delta E_{CIE2000}$.
2. **Calcul de la Carte de Gradient $G(x,y)$** :
   $$G(x,y) = \sqrt{\left(\frac{\partial L}{\partial x}\right)^2 + \left(\frac{\partial a}{\partial x}\right)^2 + \left(\frac{\partial b}{\partial x}\right)^2 + \left(\frac{\partial L}{\partial y}\right)^2 + \left(\frac{\partial a}{\partial y}\right)^2 + \left(\frac{\partial b}{\partial y}\right)^2}$$
3. **Ligne de Partage des Eaux (Inondation Topographique)** :
   * Les minima locaux du gradient servent de "bassins d'inondation".
   * L'eau monte progressivement depuis les minima jusqu'à rencontrer la crête de gradient (la vraie frontière géométrique de l'objet).
4. **Stabilisation des Frontières** : Ancrage des bords sur les crêtes réelles pour éliminer l'oscillation des pixels d'anti-aliasing.

---

## 4. Métriques & KPIs de Qualification pour le Benchmark

Pour valider l'innovation AEE-002 lors de la Phase 4 (Validation Board), les indicateurs suivants devront être mesurés par le `BenchmarkRunner` :

| KPI | Description | Baseline Actuelle | Objectif Visé (AEE-002) |
| :--- | :--- | :--- | :--- |
| **Indice d'Oscillation de Bordure ($BOI$)** | Variance angulaire de la frontière | $18.4^\circ$ | $\le 8.0^\circ$ ($-56\%$) |
| **Micro-Régions Parasites d'Anti-aliasing** | Nombre de régions de transition $< 20\text{ px}^2$ | 94 régions | $\le 20$ régions ($-78\%$) |
| **Distance Colorimétrique Moyenne ($\Delta E$)** | Écart de couleur perceptuel | $1.8 \Delta E$ | $\le 2.2 \Delta E$ (Préservation couleur) |
| **Temps d'Exécution Segmentation ($CPU$)** | Temps de calcul du moteur | $32\text{ ms}$ | $\le 45\text{ ms}$ ($< +40\%$) |
| **Non-Régression Topologique (AEE-001)** | Score du Topology Engine | $100/100$ | **$100/100$ (Maintain FROZEN State)** |

---

## 5. Synthèse de la Fiche de Diagnostic

* **Statut Scientifique** : **PHASE 3B PROTOTYPE VALIDÉ EN LABORATOIRE**
* **Statut Développement** : **🔵 Prototype Implémenté (Phase 4 Validation Golden Dataset en cours)**
* **Grille de Maturité ASVP** :
  * **PHASE 1 (Recherche Scientifique)** : ✅ Validé
  * **PHASE 2 (Gouvernance & Architecture)** : ✅ Validé
  * **PHASE 3A (Préparation & Filtres)** : ✅ Validé
  * **PHASE 3B (Prototype Watershed & Fusion DeltaE)** : ✅ Implémenté & Testé
  * **PHASE 4 (Validation Golden Dataset Complète)** : ⏳ EN COURS (Logos Canva, SVG, PNG transparents, Armoiries)
  * **PHASE 5 (Certification Production & Freeze)** : ❌ NON (En attente du rapport de métrologie Golden Dataset)

