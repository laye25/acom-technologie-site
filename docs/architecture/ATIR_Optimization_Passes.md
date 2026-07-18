# Architecture: ATIR Optimization Passes & Transform Pipeline (LLVM-like)
**Maturité (Règle 52) :** Designed  

Ce document spécifie le fonctionnement de la représentation intermédiaire **ATIR** (Acom Textile Intermediate Representation) sous forme de pipeline de transformations et de passes modulaires, inspiré de l'architecture moderne de compilateurs comme **LLVM**.

---

## 1. Philosophie du Découpage en Passes

Plutôt que d'exécuter un moteur de calcul monolithique et opaque, l'AEE applique une suite d'**Optimization Passes** (passes de transformation) autonomes et chaînées. Chaque passe :
1. **Lit** la structure sémantique d'ATIR issue de la passe précédente.
2. **Applique** une transformation algorithmique unique et ciblée.
3. **Réécrit** la structure ATIR modifiée sans jamais altérer directement la structure géométrique brute originale.

```
       [ DESSIN SOURCE ] ──► [ AST Générateur ] ──► [ ATIR Initiale ]
                                                          │
     ┌────────────────────────────────────────────────────┘
     │
     ├─► [ Pass 1 : Simplification & Interpolation ]
     │      Adoucissement des splines, lissage directionnel Hausdorff.
     │
     ├─► [ Pass 2 : Topology Solver ]
     │      Classification d'inclusion, arbre de régions parent-enfant.
     │
     ├─► [ Pass 3 : Ribbon Extractor ]
     │      Calcul de l'axe médian et reconstruction des colonnes.
     │
     ├─► [ Pass 4 : Underlay Compiler ]
     │      Génération sémantique des points de stabilisation sous-jacents.
     │
     ├─► [ Pass 5 : Stitch Generator ]
     │      Compilation des points de remplissage Satin et Tatami v2.
     │
     ├─► [ Pass 6 : Travel Optimizer ]
     │      Passe d'ordonnancement globale (solveur TSP-PC de réduction des sauts).
     │
     ├─► [ Pass 7 : Physics Compensator ]
     │      Application des forces de tension asymétriques selon le tissu.
     │
     └─► [ Pass 8 : Machine Code Emitted ] ──► [ Backends : DST, PES, G-Code... ]
```

---

## 2. Structure d'un Transformateur de Passe (Pass Contract)

Chaque passe hérite d'une structure de classe de passe unifiée garantissant l'encapsulation et l'indépendance de traitement :

```typescript
export interface IATIRPass {
  readonly id: string;
  readonly name: string;
  readonly type: "Analysis" | "Transformation" | "Optimization";
  
  /**
   * Exécute le traitement algorithmique sur la représentation intermédiaire.
   * @param ir La représentation ATIR courante.
   * @param context Options d'usinage et paramètres de l'étoffe.
   */
  run(ir: ATIRModel, context: PassContext): ATIRModel;
}
```

---

## 3. Le Registre des Passes Standards d'Ingénierie

### ⚙️ Pass 1 : `SimplificationPass`
- **Rôle** : Nettoie et rationalise les tracés vectoriels d'entrée (SVG).
- **Transformation** : Réduit les points superflus sur les segments rectilignes, adoucit les raccordements de courbes de Bézier par splines de courbure adaptative et valide la distance de Hausdorff par rapport à l'original ($\le 0.05\text{ mm}$).

### ⚙️ Pass 2 : `TopologyPass`
- **Rôle** : Analyse et classifie l'arbre d'inclusion topologique.
- **Transformation** : Calcule le Winding Number sur les régions fermées pour distinguer les surfaces pleines des trous et contreformes. Génère un graphe d'inclusion stable (isomorphisme topologique certifié).

### ⚙️ Pass 3 : `RibbonPass`
- **Rôle** : Reconstruit la géométrie de rubans.
- **Transformation** : Extrait l'axe médian des tracés fins pour générer des rails de guidage directionnels nécessaires au remplissage de type Satin à largeur adaptative.

### ⚙️ Pass 4 : `UnderlayPass`
- **Rôle** : Insère les points de stabilisation.
- **Transformation** : Calcule et insère les chemins de maintien (chemins de bâti, grilles, contours) sous les structures de broderie pour prévenir le rétrécissement physique du tissu lors de l'usinage.

### ⚙️ Pass 5 : `StitchPass`
- **Rôle** : Génère l'empilement de points réels (Tatami, Satin).
- **Transformation** : Traduit les régions de remplissage sémantiques en coordonnées discrètes de points de broderie selon des motifs de trames réguliers (Tatami v2) ou alternés (Satin v2).

### ⚙️ Pass 6 : `TravelPass`
- **Rôle** : Ordonnance et optimise le parcours.
- **Transformation** : Résout le problème du voyageur de commerce avec contraintes de préséance (TSP-PC) sur le graphe de blocs pour minimiser le nombre de sauts de fil (Jumps) et de coupes de fil (Trims).

### ⚙️ Pass 7 : `PhysicsPass`
- **Rôle** : Applique les compensations mécaniques textiles (Push-Pull).
- **Transformation** : Déforme légèrement les coordonnées géométriques des points de trame pour anticiper et annuler les forces de traction élastiques appliquées par le fil sur le tissu sélectionné.

### ⚙️ Pass 8 : `MachineBackendPass`
- **Rôle** : Sérialisation binaire.
- **Transformation** : Traduit les instructions logiques d'ATIR en formats binaires spécifiques d'usinage (Tajima DST avec Bresenham étendu, Brother PES, Bernina EXP, ou G-Code d'usinage CNC/Laser).
