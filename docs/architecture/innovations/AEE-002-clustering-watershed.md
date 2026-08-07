# Fiche Innovation AEE-002 : Clustering Watershed Adaptatif

**Réf. Protocole : ASVP / APIF - Étape 2**
**Pilier Architecture : Pilier 1 - AEE Foundation**
**Module Cible : `VectorizationPipelineService.ts` (Phase Pre-Tracing / Color Clustering)**

---

## 1. Description Synthétique
* **Origine** : Segmentation par ligne de partage des eaux (Watershed) de VTracer.
* **Problème Résolu** : Bruit de frontière sur les dégradés et contours flous, conduisant à des bords en dents de scie ou des découpages arbitraires en grille.
* **Anomalie Factuelle Rapprochée** : Les contours issus d'images à faible résolution ou fortement compressées (JPEG) présentent des franges de couleur parasites qui créent des vagues sur les colonnes Satin.

---

## 2. Statut de Maturité, Risque & Dépendances

### Statut de Maturité (ASVP Lifecycle)
- [x] **Étudié**
- [ ] **Prototype**
- [ ] **Implémenté**
- [ ] **Validé Golden Dataset**
- [ ] **Certifié Production**

### Évaluation du Risque de Régression
* **Niveau de Risque** : **★★★☆☆ (Moyen)**
* **Impact Topologique** : Élevé (re-découpage des contours de couleur).
* **Point d'Attention** : Préserver l'exactitude colorimétrique pour ne pas décaler la palette de fils.

### Dépendances Préalables Stricte
* **Requiert** : [**AEE-001 (Consolidation Topologique)**](./AEE-001-consolidation-topologique.md) au statut **Validé Golden Dataset**.

---

## 3. Algorithmique : Inondation Topographique par Gradient
Au lieu d'appliquer une simple quantification de couleur globale (K-Means ou Color Distance basique) :
1. Calculer la carte de gradient de couleur (magnitude des variations locales de chrominance).
2. Traiter le gradient comme une surface topographique 2D où les contours sont des crêtes.
3. Inonder les bassins versants (zones homogènes) jusqu'aux lignes de partage des eaux.
4. Générer des frontières lisses et naturelles fermement ancrées sur les variations réelles de l'image.

---

## 4. Critères d'Acceptation & KPIs Mesurables
L'innovation AEE-002 sera validée si et seulement si :
* **Réduction du Bruit de Contour** : Diminution de $\ge 30\%$ des micro-oscillations d'angle sur les bordures.
* **Réduction Continue des Fragments** : Gain cumulé de $\ge 50\%$ sur la baisse des micro-régions parasites par rapport à la baseline.
* **Fidélité des Couleurs** : Maintien de la distance colorimétrique $\Delta E_{CIE2000} \le 2.5$.
* **Temps de Calcul** : Surcoût de segmentation $\le +15\%$.
