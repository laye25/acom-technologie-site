# Fiche Innovation AEE-005 : Subdivision à 4 Points (Lissage Continu)

**Réf. Protocole : ASVP / APIF - Étape 5**
**Pilier Architecture : Pilier 2 - AEE Geometry & Topology**
**Module Cible : `CurveReconstructionEngine.ts`**

---

## 1. Description Synthétique
* **Origine** : Schéma de subdivision 4-point subdivision scheme adaptatif de VTracer.
* **Problème Résolu** : Facettage polygonal sur les lignes courbes et ondulations non naturelles issues des lissages quadratiques basiques.
* **Anomalie Factuelle Rapprochée** : Les contours circulaires ou organiques présentent des segments droits visibles provoquant des aspérités lors de la génération des points Satin.

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
* **Impact Géométrique** : Élevé (insertion de nouveaux sommets).
* **Point d'Attention** : Garantir la nature interpolatoire du masque pour ne pas faire varier la surface des polygones.

### Dépendances Préalables Stricte
* **Requiert** : [**AEE-004 (Détection des Splice Points)**](./AEE-004-detection-splice-points.md) au statut **Validé Golden Dataset**.

---

## 3. Algorithmique : Subdivision Interpolatoire d'Ordre 4
Entre deux Splice Points isolés (AEE-004), insérer de nouveaux sommets en appliquant le masque de pondération à 4 voisins :
$$P_{new} = -\frac{1}{16}P_{i-1} + \frac{9}{16}P_i + \frac{9}{16}P_{i+1} -\frac{1}{16}P_{i+2}$$
* **Caractéristique Clé** : Contrairement aux courbes approximatives (B-Splines, Chaikin) qui décalent la courbe à l'intérieur des sommets originels, la subdivision à 4 points est **interpolatoire** : elle passe rigoureusement par les points de départ tout en produisant une continuité $C^1$.

---

## 4. Critères d'Acceptation & KPIs Mesurables
L'innovation AEE-005 sera validée si et seulement si :
* **Déviation Géométrique Normale** : Écart maximal aux contours originels $d_{max} \le 0.3 \text{ px}$.
* **Suppression du Facettage** : Continuité de la courbure mesurée sans saut d'accélération discontinue.
* **Régularité des Espaces Inter-Sommets** : Distribution homogène des points pour le guidage Tatami/Satin.
* **Aucune Déformation des Surfaces** : Variation de surface contournée $< 0.2\%$.
