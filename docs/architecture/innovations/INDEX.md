# Index & Tableau de Bord des Innovations Algorithmiques AEE (ASVP / APIF)

**Référentiel Cadre - Acom Embroidery Engine (AEE)**
**Statut Global : In Execution & Governed (Règle 52 - AGENTS.md Level 1)**

---

## 1. Governance & Lifecycle des Innovations

Toute évolution du moteur de vectorisation AEE suit le **Protocole de Validation Scientifique ASVP** (voir [`../AEE_Scientific_Validation_Protocol_ASVP.md`](../AEE_Scientific_Validation_Protocol_ASVP.md)).

### Grille des Étapes de Maturité
- **[ ] Étudié / En attente** : Analyse de l'état de l'art, formalisation mathématique et problème métier identifié.
- **[ ] Prêt à démarrer** : Gouvernance validée, prérequis satisfaits, diagnostic et spécifications prêts. Développement non commencé.
- **[ ] Prototype** : Code d'expérimentation isolé et instrumenté.
- **[ ] Implémenté** : Code de production intégré dans l'AEE (`VectorizationPipelineService` / Kernel).
- **[ ] Validé Golden Dataset** : Test de non-régression à 100% vert avec métriques quantitatives validées par le `BenchmarkRunner`.
- **🟢 Certifié & Gelé (FROZEN v1.0)** : Validé par le Validation Board, archivé et inviolable.

---

## 2. AEE Innovation Dashboard (Tableau de Bord Général)

```
[ PILIER 1 : AEE FOUNDATION ]
AEE-000 : Instrumentation & Benchmark    [██████████] 100% 🟢 Certifié & Gelé (FROZEN v1.0)
AEE-001 : Consolidation Topologique       [██████████] 100% 🟢 Certifié & Gelé (FROZEN v1.0.0)
AEE-002 : Clustering Watershed Adaptatif  [███████░░░]  70% 🔵 Prototype Implémenté (Validation Golden Dataset en cours)

[ PILIER 2 : AEE GEOMETRY & TOPOLOGY ]
AEE-003 : Stacking Hiérarchique Anti-Gap   [░░░░░░░░░░]   0% ⚪ En attente
AEE-004 : Détection Splice Points         [░░░░░░░░░░]   0% ⚪ En attente
AEE-005 : Subdivision à 4 Points          [░░░░░░░░░░]   0% ⚪ En attente

[ PILIER 3 : AEE OPTIMIZATION ]
AEE-006 : Bézier Fitting Adaptatif        [░░░░░░░░░░]   0% ⚪ En attente
```

---

## 3. Matrice des Innovations par Pilier Architecture

### Pilier 1 : AEE Foundation & Region Segmentation Engine
| Code | Intitulé | Moteur Rattaché | Dépendance Stricte | Impact | Risque | Statut Scientifique | Statut Développement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [**AEE-000**](./AEE-000-instrumentation-benchmark.md) | Instrumentation & Métrologie | `Quality Engine` | *Aucune* | ★★★★★ | **Nul** | **Certifié Production** | **🟢 FROZEN v1.0** |
| [**AEE-001**](./AEE-001-consolidation-topologique.md) | Consolidation Topologique | `Topology Engine` | `AEE-000` | ★★★★★ | **★☆☆☆☆ (Faible)** | **Certifié Production** | **🟢 FROZEN v1.0.0** |
| [**AEE-002**](./AEE-002-diagnostic-technique.md) | Clustering Watershed Adaptatif | [`Region Segmentation Engine`](../engines/AEE-Region-Segmentation-Engine.md) | `AEE-001` | ★★★★☆ | **★★★☆☆ (Moyen)** | **Prototype Validé** | **🔵 Implémenté (Validation Golden Dataset)** |

### Pilier 2 : AEE Geometry & Topology Engine
| Code | Intitulé | Moteur Rattaché | Dépendance Stricte | Impact | Risque | Statut Scientifique | Statut Développement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [**AEE-003**](./AEE-003-stacking-hierarchique.md) | Stacking Hiérarchique Anti-Gap | `Topology Engine` | `AEE-001`, `AEE-002` | ★★★★☆ | **★★★☆☆ (Moyen)** | **Étudié** | **⚪ En attente** |
| [**AEE-004**](./AEE-004-detection-splice-points.md) | Détection des Splice Points | `Curve Reconstruction Engine` | `AEE-001` | ★★★★★ | **★★☆☆☆ (Faible)** | **Étudié** | **⚪ En attente** |
| [**AEE-005**](./AEE-005-subdivision-4-points.md) | Subdivision à 4 Points | `Curve Reconstruction Engine` | `AEE-004` | ★★★★☆ | **★★★☆☆ (Moyen)** | **Étudié** | **⚪ En attente** |

### Pilier 3 : AEE Optimization Engine
| Code | Intitulé | Moteur Rattaché | Dépendance Stricte | Impact | Risque | Statut Scientifique | Statut Développement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [**AEE-006**](./AEE-006-bezier-fitting-adaptatif.md) | Bézier Fitting Adaptatif | `SVG Optimization Engine` | `AEE-004`, `AEE-005` | ★★★☆☆ | **★★★★☆ (Élevé)** | **Étudié** | **⚪ En attente** |

---

## 4. Règles Inviolables de Gouvernance (Garde-Fous ASVP)

1. **Règle d'Immutabilité des Modules Gelés (Frozen State)** : Un module au statut `FROZEN v1.0` (ex: `AEE-001`) est strictement scellé. Aucune modification directe de son code de production n'est autorisée. Toute évolution ultérieure exige l'ouverture d'une révision d'architecture formelle (sub-version `AEE-001.1`) ou d'un nouvel ADR avec justification théorique et rapport d'impact.
2. **Garde-Fou des Dépendances** : Il est **strictement interdit** d'entamer le développement d'une innovation tant que son innovation parente directe n'a pas atteint au moins le statut `FROZEN v1.0`.
3. **Règle d'Anomalie Factuelle Réelle** : Toute nouvelle fiche `AEE-xxx` exige l'identification préalable d'une défaillance géométrique, topologique ou physique documentée sur un cas réel du Golden Dataset.
