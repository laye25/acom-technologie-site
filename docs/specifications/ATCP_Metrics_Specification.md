# Technical Specification: ATCP Textile Metrics (`acom-textile-metrics`)
**Maturité (Règle 52) :** Designed  

Cette spécification définit l'architecture et le schéma de données du dépôt indépendant **`acom-textile-metrics`**, garantissant la pérennité historique des mesures de performance géométriques, topologiques et physiques d'ATCP face aux logiciels propriétaires du marché.

---

## 1. Modèle Structurel de Stockage des Métriques

Le dépôt `acom-textile-metrics` est entièrement découplé du code source du compilateur. Il stocke les résultats d'exécution bruts, les fichiers d'usinage générés, les images de simulation physique et les rapports comparatifs sous forme d'historique temporel indexé par version sémantique.

```
acom-textile-metrics/
├── schemas/
│   └── execution_run.schema.json
├── golden-dataset/
│   ├── meta.json
│   ├── PAT_0001_A_letter/
│   │   ├── input.svg
│   │   ├── target_wilcom.dst
│   │   └── target_inkstitch.dst
│   └── ... (1000 motifs)
└── history/
    ├── v1.0.0/
    │   ├── run_summary.json
    │   ├── report.pdf
    │   └── compiled-designs/
    └── v1.1.0/
        ├── run_summary.json
        ├── report.pdf
        └── compiled-designs/
```

---

## 2. Format de Données d'Exécution Métrique (JSON Schema)

Chaque exécution de benchmark sur les 1000 motifs produit un fichier `run_summary.json` structuré de la manière suivante :

```json
{
  "runId": "RUN_20260712_154500",
  "engineVersion": "1.1.0",
  "timestamp": "2026-07-12T15:45:00Z",
  "environment": {
    "nodeVersion": "20.11.0",
    "compiler": "tsc-v5.3"
  },
  "global_indices": {
    "GFI": 0.9875,
    "TPI": 1.0000,
    "SEI": 0.9682,
    "TPI2": 0.9712,
    "SUI": 0.9850
  },
  "summary_metrics": {
    "totalStitchCount": 12450820,
    "totalThreadLengthMeters": 45120.5,
    "totalTrims": 10420,
    "totalJumps": 18500,
    "estimatedMachineTimeSeconds": 362400
  },
  "detailed_designs": {
    "PAT_0001_A_letter": {
      "comparisons": {
        "wilcom": {
          "stitchDifferencePercent": -4.2,
          "hausdorffDistanceMM": 0.045
        },
        "inkstitch": {
          "stitchDifferencePercent": -12.5,
          "hausdorffDistanceMM": 0.082
        }
      },
      "indices": {
        "GFI": 0.9942,
        "TPI": 1.0000,
        "SEI": 0.9850,
        "TPI2": 0.9810,
        "SUI": 0.9980
      }
    }
  }
}
```

---

## 3. Pipeline d'Analyse Comparative Automatisée

Le pipeline d'évaluation métrique s'exécute de manière autonome dans l'environnement de build :

```
     [ Nouvelle Version Moteur ] ───► [ Compilation des 1000 motifs ATIR ]
                                                        │
                                                        ▼
[ Rapport de Non-Régression PDF ] ◄─── [ Métrologie vs. Wilcom/Hatch (Golden) ]
```

1. **Génération ATIR** : Compilation des tracés SVG du Golden Dataset en instructions sémantiques ATIR.
2. **Usinage Virtuel** : Production des fichiers binaires d'export machine (DST/PES).
3. **Calcul Différentiel** : Calcul géométrique de l'écart Hausdorff face aux numérisations manuelles de référence (Wilcom/Hatch).
4. **Validation de Non-Régression** : Comparaison stricte par le **Regression Scientist Agent** entre la version courante ($N+1$) et la version de référence stable ($N$). Si une régression est détectée sur l'un des indices (ex. GFI ou TPI en baisse), la version est gelée.
