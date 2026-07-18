# ATCP RFC (Request For Comments) Process
**Maturité (Règle 52) :** Implemented  

Ce répertoire rassemble les spécifications techniques et conceptuelles de la plateforme **Acom Textile Computing Platform (ATCP)** soumises au processus de RFC. À l'image de Rust ou LLVM, toute modification d'importance majeure ou d'algorithme critique doit être rédigée sous forme de RFC et approuvée par le comité d'ingénierie et d'audit d'Acom.

---

## 1. Le Cycle de Vie d'une RFC (RFC Lifecycle)

Une RFC progresse selon les cinq étapes de maturité et de validation technique :

```
      [ PROPOSED ] ─────────► [ APPROVED ] ─────────► [ PROTOTYPE ]
       Soumission              Validation              Évaluation
       Initiale                 de l'ADR              en Recherche
                                   │
                                   ▼
      [ INTEGRATED ] ◄─────── [ VALIDATED ]
       Déploiement              Benchmark
       Production               & QA Vert
```

1. **Proposed** : La RFC est rédigée selon le [gabarit officiel](./TEMPLATE.md) et ouverte aux commentaires des agents IA et experts de l'écosystème.
2. **Approved** : La proposition d'architecture et les formulations mathématiques associées sont formellement validées par l'**Audit Center**.
3. **Prototype** : L'algorithme fait l'objet d'un premier développement partiel dans `/aee-research` pour vérifier sa faisabilité technique et physique.
4. **Validated** : L'algorithme a été testé avec succès sur les 1000 motifs du **Golden Dataset** (aucun bug, aucune régression et gains validés, respectant les **Règles 53, 54 & 55**).
5. **Integrated** : Le code est intégré dans la branche de production principale, compilé avec succès et validé à $100\%$ par le pipeline de compilation automatique.

---

## 2. Index des RFC Actives

| Numéro | Titre | Auteur | Statut de Maturité | Lien |
| :--- | :--- | :--- | :---: | :---: |
| **RFC-0001** | Remplissage Tatami Adaptatif (Adaptive Tatami Fill) | Core Engine Agent | 🟢 Integrated | [RFC-0001](../specifications/AdaptiveTatami.md) |
| **RFC-0002** | Squelettisation par Voronoi (Acom Ribbon) | Topology Agent | 🟡 Approved | [RFC-0002](../specifications/Skeletonization.md) |
| **RFC-0003** | Modélisation Physique Mass-Spring (Acom Phys) | Physics Agent | 🟡 Approved | [RFC-0003](../specifications/NeedlePhysics.md) |
| **RFC-0004** | Optimiseur de Voyage (TSP-PC Optimizer) | Travel Agent | 🟢 Integrated | [RFC-0004](../specifications/TravelOptimization.md) |

---

## 3. Comment Soumettre une RFC ?
Pour soumettre une nouvelle proposition, dupliquez le fichier [`TEMPLATE.md`](./TEMPLATE.md), attribuez-lui le numéro séquentiel suivant, et initialisez son statut à `Proposed`.
