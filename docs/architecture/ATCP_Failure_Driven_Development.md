# Engineering: Failure-Driven Development (FDD) & 3-Tier Validation
**Maturité (Règle 52) :** Designed  

Ce document spécifie la méthodologie de **Failure-Driven Development (FDD)** et l'architecture de validation continue à trois niveaux d'ATCP. Ce cadre garantit qu'aucun bug historique ne puisse réapparaître et que chaque régression de calcul soit détectée immédiatement de manière automatisée.

---

## 1. L'Architecture de Validation à Trois Niveaux (3-Tier)

La validation continue s'organise en trois niveaux d'isolation complémentaires, bloquant la transition vers le statut **Release Candidate** en cas de défaillance unitaire ou de régression géométrique :

```
┌────────────────────────────────────────────────────────┐
│             NIVEAU 1 : UNIT TESTS (Maths)              │
│  - Fonctions pures : PointInPolygon, Euler, Hausdorff  │
│  - Rapidité absolue, indépendance totale du graphe.    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         NIVEAU 2 : ENGINE COMPLIANCE (Moteurs)         │
│  - Isolation : Validation individuelle des moteurs    │
│  - Entrées/Sorties validées pour chaque transformateur│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      NIVEAU 3 : VISUAL BENCHMARK RUNNER (Règle 65)     │
│  - Intégration complète sur le Golden Dataset         │
│  - Analyse des cartes thermiques de Hausdorff (2D)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               RELEASE CANDIDATE VALIDÉE                │
└────────────────────────────────────────────────────────┘
```

---

## 2. Failure-Driven Development (FDD) : Cycle de Vie d'un Bug

Dans la philosophie industrielle d'ATCP, une anomalie de production n'est pas simplement résolue : elle est **modélisée, documentée et convertie en test de non-régression permanent**.

### Le protocole FDD en 4 étapes :

1. **Identification & Isolement** : Extraction du tracé ou de la sous-partie du dessin ayant provoqué le défaut (ex. effondrement d'un trou intérieur ou dérive binaire).
2. **Création du Cas de Test ID** : Ajout du motif minimal reproductible au sein de la **Failure Database** (fichiers `.svg` ou `.atir` associés).
3. **Écriture du Validateur Automatisé** : Ajout d'une assertion métrique stricte dans le runner (ex. `TPI === 100%` pour le maintien de l'îlot).
4. **Correction et Gel de Régression** : L'anomalie est corrigée dans le moteur concerné. Le test passe au vert et protège définitivement la base de code contre toute régression future.

---

## 3. Registre de la Failure Database Initiale

La Failure Database d'ATCP intègre des motifs critiques historiques servant de garde-fous géométriques et topologiques :

### 🐞 `BUG_0001` : Perte du triangle intérieur du glyphe 'A'
*   **Symptôme** : Fusion sémantique du trou d'inclusion triangulaire central de la lettre `A` avec son tracé extérieur lors du calcul de triangulation, provoquant un remplissage plein indésirable.
*   **Moteur Associé** : `Topology Engine v1`
*   **Validation de non-régression** : 
    *   ✓ Euler-Poincaré $\chi = 0$ pour la surface combinée.
    *   ✓ Indice de Préservation Topologique (**TPI**) $= 100.0\%$.

### 🐞 `BUG_0002` : Artefact d'entonnoir Tatami (Tunneling Effect)
*   **Symptôme** : Alignement involontaire des points d'inversion de trame provoquant une ligne de vide structurel (effet d'entonnoir physique), causant la rupture d'aiguille ou du fil sur machine.
*   **Moteur Associé** : `Tatami Engine v2`
*   **Validation de non-régression** : 
    *   ✓ Écart minimal de décalage de motif (Pattern Shift) $\ge 0.2\text{ mm}$ entre deux lignes successives.
    *   ✓ Densité locale de points contrôlée sans accumulation binaire.

### 🐞 `BUG_0003` : Glissement de couleur par dérive d'arrondi
*   **Symptôme** : Décalage de $2\text{ mm}$ de la tête de broderie suite à l'application d'un saut de fil de couleur, dû à une erreur d'arrondi Bresenham accumulée dans l'exportateur d'instructions.
*   **Moteur Associé** : `Machine Compilation Backend`
*   **Validation de non-régression** : 
    *   ✓ Dérive de coordonnées vectorielles cumulées sur l'intégralité du fichier d'usinage $\le 0.05\text{ mm}$.
