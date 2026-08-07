# Fiche Innovation AEE-006 : Bézier Fitting Adaptatif

**Réf. Protocole : ASVP / APIF - Étape 6**
**Pilier Architecture : Pilier 3 - AEE Optimization**
**Module Cible : `VectorizationPipelineService.ts` & `CurveReconstructionEngine.ts`**

---

## 1. Description Synthétique
* **Origine** : Approximation par courbes de Bézier cubiques de VTracer.
* **Problème Résolu** : Surcharge en points de contrôle (SVG lourd) générant des accélérations/décélérations micro-saccadées sur les têtes de machines à broder industrielles.
* **Anomalie Factuelle Rapprochée** : Certains fichiers SVG vectorisés contiennent jusqu'à 15 000 points pour des logos simples, ce qui ralentit considérablement la compilation des trajectoires DST.

---

## 2. Statut de Maturité, Risque & Dépendances

### Statut de Maturité (ASVP Lifecycle)
- [x] **Étudié**
- [ ] **Prototype**
- [ ] **Implémenté**
- [ ] **Validé Golden Dataset**
- [ ] **Certifié Production**

### Évaluation du Risque de Régression
* **Niveau de Risque** : **★★★★☆ (Élevé)**
* **Impact Géométrique** : Critique si la tolérance $\epsilon$ est mal calibrée (déformation des arrondis).
* **Point d'Attention** : Ne jamais exécuter le fitting sur des sommets non isolés par Splice Points (AEE-004) pour éviter d'arrondir les coins durs.

### Dépendances Préalables Stricte
* **Requiert** : [**AEE-004 (Splice Points)**](./AEE-004-detection-splice-points.md) et [**AEE-005 (Subdivision 4 Points)**](./AEE-005-subdivision-4-points.md) au statut **Validé Golden Dataset**.

---

## 3. Algorithmique : Fitting Bézier Cubique par Moindres Carrés
1. Prendre les chaînes de sommets subdivisés situées entre deux Splice Points (AEE-004).
2. Paramétrer les points par la méthode des longueurs de corde cumulées.
3. Ajuster une courbe de Bézier cubique $B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$.
4. Si l'erreur maximale d'approximation $\max \|P_i - B(t_i)\| > \epsilon$, scinder l'intervalle au point de déviation maximale et réitérer récursivement.

---

## 4. Critères d'Acceptation & KPIs Mesurables
L'innovation AEE-006 sera validée si et seulement si :
* **Réduction du Nombre de Nœuds** : Diminution de $\ge 50\%$ du nombre total de sommets SVG.
* **Fluidité Machine** : Disparition totale des micro-saccades sur la trajectoire moteur machine simulée.
* **Tolérance d'Erreur Strictement Contrôlée** : Écart géométrique max $\epsilon \le 0.5 \text{ px}$.
* **Fichier SVG Plus Léger** : Gain de taille de fichier $\ge 40\%$.
