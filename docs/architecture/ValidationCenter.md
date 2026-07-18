# Acom Embroidery Engine (AEE) - Centre de Validation Continue (Validation Center)
**Maturité (Règle 52) :** Designed  

Ce document décrit le fonctionnement de l'**AEE Validation Center** et de son pipeline de validation continue multi-niveaux. Il sert de guide opérationnel pour garantir le maintien à 100 % de l'intégrité algorithmique et physique de la plateforme de CAO/FAO textile d'Acom Technologie à chaque étape du développement.

---

## 1. Philosophie & Objectifs du Validation Center

Dans un projet d'ingénierie textile de précision, une compilation verte (`tsc`) ou une absence d'erreurs de style (`eslint`) ne garantit pas la qualité d'un algorithme de génération de points. Une erreur imperceptible sur un écran peut détruire une étoffe ou briser une aiguille sur une machine industrielle.

Le **Validation Center** a pour rôles de :
1. **Évaluer de manière quantitative** la qualité des points générés.
2. **Détecter les régressions** physiques, géométriques et topologiques immédiatement après modification du code.
3. **Appliquer la Règle 64** : Aucun ticket n'est considéré comme "Terminé" sans passage par le banc de validation métrique.

---

## 2. Le Pipeline de Validation Multi-Niveaux

Le pipeline s'exécute de façon séquentielle à chaque modification ou soumission de ticket, bloquant l'intégration au premier échec :

```
                  ┌─────────────────────────────────┐
                  │       Soumission de Code        │
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 1 : SYNTAXE & COMPILATION]
                  ┌─────────────────────────────────┐
                  │   Compilation TypeScript & Lint │  ◄── [ÉCHEC] Arrêt du pipeline (Règle 51 / Catégorie A)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 2 : FIDÉLITÉ GÉOMÉTRIQUE]
                  ┌─────────────────────────────────┐
                  │        Geometry Validator       │  ◄── [ÉCHEC] Rejet (Distance de Hausdorff, NaN, doublons)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 3 : CONSERVATION TOPOLOGIQUE]
                  ┌─────────────────────────────────┐
                  │        Topology Validator       │  ◄── [ÉCHEC] Rejet (Caractéristique d'Euler, contreformes)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 4 : PARAMÈTRES DE COUTURE]
                  ┌─────────────────────────────────┐
                  │         Stitch Validator        │  ◄── [ÉCHEC] Rejet (Densité, longueurs, angles Satin/Tatami)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 5 : OPTIMISATION DES TRAJETS]
                  ┌─────────────────────────────────┐
                  │         Travel Validator        │  ◄── [ÉCHEC] Rejet (Efficacité machine, saut, trims, TSP-PC)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 6 : COMPENSATIONS PHYSIQUES]
                  ┌─────────────────────────────────┐
                  │        Physics Validator        │  ◄── [ÉCHEC] Rejet (Forces push-pull active, déformations)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 7 : SÉRIALISATION & EXPORT]
                  ┌─────────────────────────────────┐
                  │         Export Validator        │  ◄── [ÉCHEC] Rejet (Conformité binaire DST/PES, Bresenham)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 8 : JEU DE RÉFÉRENCE]
                  ┌─────────────────────────────────┐
                  │      Golden Dataset Runner      │  ◄── [ÉCHEC/RÉGRESSION] Rejet (Validation des 1000 motifs)
                  └────────────────┬────────────────┘
                                   │
                                   ▼ [NIVEAU 9 : PERFORMANCE COMPARATIVE]
                  ┌─────────────────────────────────┐
                  │       Continuous Benchmark      │  ◄── Rapport de non-régression validé (Verdict Vert)
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │    Merge dans la Branche Stable │
                  └─────────────────────────────────┘
```

---

## 3. Spécifications Techniques des Validateurs du Noyau

### A. Geometry Validator
- **Rôle** : S'assure que la géométrie des tracés calculés est mathématiquement pure et saine.
- **Vérifications & Métriques** :
  - **Distance de Hausdorff** : Mesure la déviation maximale entre le contour original et la trajectoire générée ($\le 0.05\text{ mm}$).
  - **Zéro Point Invalide** : Élimination des coordonnées `NaN`, `null`, `undefined` ou infinies.
  - **Détection des Doublons** : Empêcher deux points d'impact d'aiguille successifs à une distance $d < 0.1\text{ mm}$ (pour éliminer les risques physiques d'accumulation et de casse de l'aiguille).
  - **Intégrité Bézier** : Vérification de la continuité $C^1$ et $C^2$ lors du calcul des splines directionnelles.

### B. Topology Validator
- **Rôle** : Garantit la préservation absolue des relations spatiales et de l'intégrité structurelle des formes.
- **Vérifications & Métriques** :
  - **Conservation du Genre ($g$)** : Validation de l'égalité du genre topologique avant et après calcul de points.
  - **Caractéristique d'Euler-Poincaré ($\chi = V - E + F$)** : Doit rester parfaitement invariante pour chaque sous-île.
  - **Invariance des Trous** : Préservation systématique des contreformes (trous intérieurs de lettres comme `A`, `B`, `O`, `P`, `R`, `8`, `0`, `@` et des logos évidés).

### C. Stitch Validator
- **Rôle** : Contrôle la densité et l'organisation physique des points générés.
- **Vérifications & Métriques** :
  - **Validation de la Densité** : Vérification que la densité (nombre de points par unité de surface ou de longueur) reste dans la plage admissible textile ($4\text{ à }6\text{ points/mm}$ pour le Satin, décalage régulier pour le Tatami).
  - **Vérification des Longueurs de Point** : Alerte de non-conformité si la longueur d'un point franchit la plage technique ($1.0\text{ mm} \le l \le 12.0\text{ mm}$).
  - **Contrôle des Angles (Stitch Angles)** : Alignement régulier et lissage des angles de points Tatami/Satin pour éliminer tout effet d'entonnoir ou distorsion visuelle.
  - **Vérification des Sous-couches (Underlay)** : S'assurer que les structures de maintien physique (Zigzag, contour) sont bien présentes et positionnées sous le point de recouvrement.

### D. Travel Validator
- **Rôle** : Évalue et minimise le trajet hors-broderie de l'appareil.
- **Vérifications & Métriques** :
  - **Index d'Efficience Machine (SEI)** : Doit être $\ge 98.0\%$.
  - **Réduction des Coupes de Fil (Trims)** : Nombre de trims réduit de $\ge 25\%$ grâce au solveur TSP-PC.
  - **Regroupement par Couleur** : Interdiction d'introduire des sauts de couleur superflus (conservation stricte de l'ordre chromatique optimal).

### E. Physics Validator
- **Rôle** : Applique et vérifie les calculs de compensation de traction mécanique (Push-Pull compensation).
- **Vérifications & Métriques** :
  - **Compensation de Déformation** : Ajustement automatique de la largeur de colonne Satin et des points de bordure de Tatami en fonction du substrat textile sélectionné pour annuler la dérive d'enfoncement physique.
  - **Tension de Fil** : Intégration du modèle élastique du fil pour prédire et compenser le rétrécissement du motif après usinage.

### F. Export Validator
- **Rôle** : Valide l'exactitude sémantique et binaire des fichiers d'usinage exportés.
- **Vérifications & Métriques** :
  - **Encodage Binaire** : Validation octet par octet de la structure Tajima DST (instructions sur 3 octets, gestion exacte des flags de sauts, trims et changements de couleur).
  - **Atténuation de la Dérive Bresenham** : Application du lisseur Bresenham étendu pour garantir une dérive de fin de coordonnées $\le 0.05\text{ mm}$ sur toute la broderie.

---

## 4. Golden Dataset Runner & Métrologie de Non-Régression

Le **Golden Dataset Runner** charge la suite de 1000 motifs de référence représentant toutes les complexités de l'art textile (glyphes avec contreformes, entrelacs géométriques complexes, tatamis à angles variables, satin fins).

Pour chaque motif de test, le couplage des validateurs calcule les variables de performance et dresse le rapport métrique final pour comparaison historique :

| Nom de l'Indicateur | Acronyme | Définition Mathématique / Physique | Seuil de Tolérance Requis |
| :--- | :---: | :--- | :---: |
| **Geometry Fidelity Index** | **GFI** | Pourcentage de préservation de la géométrie de contour originelle. | $\ge 98.5\%$ |
| **Topology Preservation Index** | **TPI** | Taux de conservation des composantes connexes et trous. | **$= 100.0\%$** |
| **Stitch Efficiency Index** | **SEI** | Rapport entre la longueur utile brodée et la longueur totale parcourue. | $\ge 98.0\%$ |
| **Textile Physics Index** | **$TPI^2$** | Index de fidélité physique prédit après compensation de tension. | $\ge 97.0\%$ |
| **Semantic Understanding Index** | **SUI** | Précision d'identification automatique des types d'objets textiles. | $\ge 95.0\%$ |

---

## 5. Politique de Tolérance Zéro et Résolution des Erreurs (Règle 51 / 63)

En cas d'échec d'un validateur ou de baisse de performance observée par le **Golden Dataset Runner** :

1. **Classification Immédiate de l'Erreur** :
   - **Catégorie A (Moteur)** : Échec de validation TypeScript, ESLint, exception mathématique, ou baisse de GFI/TPI sous le seuil critique. ➡️ **GEL IMMÉDIAT du développement**. Priorité absolue de remédiation par l'ingénierie.
   - **Catégorie B (Infrastructure)** : Problèmes de connectivité réseau externe ou quotas Firebase temporairement expirés. ➡️ Le développement du noyau continue via le **Offline Research Mode** local (Dexie/IndexedDB).
2. **Production du Rapport d'Analyse Normalisé** (Règle 61) :
   - Le pipeline enregistre le motif défaillant et la métrique en faute au sein de la base de pannes d'ATCP.
   - Exemple de message produit : `[FAIL] TopologyValidator : TPI = 98.2% sur le motif 'Alphabet_Glyph_A.svg'. Une contreforme a été masquée lors de l'application du Tatami Engine S2.`
3. **Remédiation** : L'algorithme est ajusté localement, testé hors ligne, puis soumis à nouveau au pipeline pour réévaluation comparative.
