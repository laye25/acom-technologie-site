# Technical Specification: ATCP Textile Intermediate Representation (ATIR)
**Maturité (Règle 52) :** Designed  

Cette spécification définit l'**ATIR (Acom Textile Intermediate Representation)**, le langage intermédiaire universel d'ATCP. L'ATIR agit comme une couche d'abstraction découplée entre la description vectorielle sémantique d'un dessin (SVG) et les instructions bas niveau spécifiques aux machines physiques d'usinage (DST, PES, G-Code).

---

## 1. Modèle Conceptuel de l'ATIR

Le SVG exprime des concepts de dessin bidimensionnels plats (points, courbes, couleurs, styles de trait). L'ATIR, quant à lui, exprime des **intentions textiles physiques** organisées de manière hiérarchique sous forme d'un graphe de flux de contrôle et d'objets :

```
                                  [ SVG Input ]
                                        │
                                        ▼ (Front-end parsing & AST)
                                  [ ATCP AST ]
                                        │
                                        ▼ (Semantic Analysis & Translation)
                                  [ ATIR Graph ]
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼ (Optimization passes)     ▼ (Simulation & Physics)    ▼ (Backend compilation)
        [ TSP-PC Optimizer ]       [ Physical Mass-Spring ]    [ Serialization ]
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        ▼
                            [ DST / PES / G-Code / K-Code ]
```

---

## 2. Structure Sémantique de l'ATIR (Schema Representation)

Un document ou flux ATIR est représenté par une structure JSON typée intégrant les propriétés géométriques, physiques, sémantiques et d'ordonnancement.

```json
{
  "atir_version": "1.0.0",
  "metadata": {
    "merchantId": "MERCHANT_ACOM_001",
    "patternId": "PAT_PHOENIX_042",
    "targetFabric": "Bazin_Riche",
    "tensionGrams": 110.0
  },
  "blocks": [
    {
      "id": "block_001_underlay",
      "semanticTag": "Underlay_Structure",
      "priority": 10,
      "color": "#D4AF37",
      "geometry": {
        "type": "RunningStitch",
        "stitches": [
          {"x": 10.25, "y": 14.50, "threadTension": 95.0},
          {"x": 11.10, "y": 15.35, "threadTension": 95.0}
        ]
      }
    },
    {
      "id": "block_002_main_satin",
      "semanticTag": "Satin_Ribbon",
      "priority": 20,
      "color": "#D4AF37",
      "dependencies": ["block_001_underlay"],
      "physics": {
        "activePullCompensation": 0.15,
        "stabilizerLayers": 2
      },
      "geometry": {
        "type": "SatinStitch",
        "rails": {
          "left": [{"x": 10.25, "y": 14.50}, {"x": 12.30, "y": 16.20}],
          "right": [{"x": 11.20, "y": 13.80}, {"x": 13.10, "y": 15.40}]
        },
        "stitches": [
          {"x": 10.25, "y": 14.50, "threadTension": 110.0},
          {"x": 11.20, "y": 13.80, "threadTension": 110.0},
          {"x": 12.30, "y": 16.20, "threadTension": 110.0},
          {"x": 13.10, "y": 15.40, "threadTension": 110.0}
        ]
      }
    }
  ],
  "global_constraints": {
    "maxJumpLength": 12.1,
    "minStitchLength": 0.5,
    "maxTrims": 12
  }
}
```

---

## 3. Les Passes d'Optimisation sur l'ATIR

Travailler sur la forme intermédiaire ATIR permet au moteur d'appliquer des optimisations découplées des spécificités binaires :

1. **L'Optimisation de Parcours (TSP-PC)** : Ordonnancer les blocs de l'ATIR en respectant l'ordre partiel défini par la propriété `dependencies` pour minimiser le coût de saut total.
2. **La Stabilisation Flottante (Bresenham feedback)** : Évacuer de manière prédictive les bruits d'arrondi sur les coordonnées géométriques.
3. **Le Solver de Connaissances Sémantiques** : Adapter dynamiquement la tension, le type de point ou les compensations de retrait selon le `targetFabric` déclaré.
