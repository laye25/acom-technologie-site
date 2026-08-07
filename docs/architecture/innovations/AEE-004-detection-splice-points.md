# Fiche Innovation AEE-004 : Détection des Splice Points (Preservation des Coins Vifs)

**Réf. Protocole : ASVP / APIF - Étape 4**
**Pilier Architecture : Pilier 2 - AEE Geometry & Topology**
**Module Cible : `CurveReconstructionEngine.ts` / `VectorizationPipelineService.ts`**

---

## 1. Description Synthétique
* **Origine** : Algorithme de détection des points de rupture d'angle de VTracer.
* **Problème Résolu** : Arrondissement indésirable des coins vifs, lettres, étoiles et pointes fines lors du lissage des contours.
* **Anomalie Factuelle Rapprochée** : Les coins d'étoiles et les sérifs de typographies perdent leur acuité et deviennent arrondis après la passe de lissage des contours.

---

## 2. Statut de Maturité, Risque & Dépendances

### Statut de Maturité (ASVP Lifecycle)
- [x] **Étudié**
- [ ] **Prototype**
- [ ] **Implémenté**
- [ ] **Validé Golden Dataset**
- [ ] **Certifié Production**

### Évaluation du Risque de Régression
* **Niveau de Risque** : **★★☆☆☆ (Faible)**
* **Impact Topologique** : Très ciblé (verrouillage de sommets clés).
* **Point d'Attention** : Réglage fin du seuil d'angle $\theta_{threshold}$ pour ne pas classifier de fausses ondulations en coins durs.

### Dépendances Préalables Stricte
* **Requiert** : [**AEE-001 (Consolidation Topologique)**](./AEE-001-consolidation-topologique.md) au statut **Validé Golden Dataset**.

---

## 3. Algorithmique : Verrouillage des Noeuds Durs par Angle Signé
1. Parcourir le contour polygonal brut sommet par sommet.
2. Calculer la variation de l'angle signé $\Delta \theta_i$ entre les vecteurs adjacents $(P_{i-1}P_i)$ et $(P_i P_{i+1})$.
3. Si $|\Delta \theta_i| > \theta_{threshold}$ (ex. $\theta > 45^\circ$), marquer le sommet $P_i$ comme **Splice Point** (sommet dur d'inflexion).
4. Isoler chaque segment entre deux Splice Points pour que le lissage ou le fitting Bézier ultérieur s'effectue indépendamment sans raboter les sommets verrouillés.

---

## 4. Critères d'Acceptation & KPIs Mesurables
L'innovation AEE-004 sera validée si et seulement si :
* **Conservation des Angles Aigus** : Erreur d'angle sur les sommets identifiés comme coins $< 3.0^\circ$.
* **Netoyage des Typos/Serifs** : Reconstitution acérée à $100\%$ des angles de la typographie de test.
* **Conservation du Nombre de Sommets Clés** : Indexation exacte des Splice Points dans le graphe SVG.
* **Temps de Calcul** : Impact d'analyse $< 5 \text{ ms}$ par motif.
