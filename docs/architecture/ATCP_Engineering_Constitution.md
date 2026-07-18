# ATCP Engineering Constitution
**Maturité (Règle 52) :** Production (Stable)  

Cette constitution regroupe les règles d'ingénierie fondamentales et immuables régissant le développement, l'évolution et l'intégration du moteur de calcul textile d'ATCP (**Acom Textile Computation Platform**). Ces principes garantissent l'indépendance technologique, l'excellence scientifique et la résilience du système à long terme.

---

## Les 7 Principes Immuables d'ATCP

### 1. ATIR comme Représentation Pivot Unique
L'**ATIR** (Acom Textile Intermediate Representation) est la seule et unique représentation intermédiaire officielle du système. Tout dessin d'entrée ou image vectorielle doit obligatoirement être compilé sous forme d'ATIR avant d'être traité par le pipeline de transformation.

### 2. Isolation Complète des Moteurs
Chaque moteur de calcul (Geometry, Topology, Ribbon, Stitch, Travel, Physics) doit être strictement indépendant et testé de manière isolée. Les moteurs ne partagent aucun état global mutable et communiquent exclusivement via l'échange de structures ATIR spécifiées par contrat.

### 3. Non-Modification de l'ATIR par les Backends
Aucun backend de sérialisation ou d'usinage physique (DST, PES, G-Code...) n'est autorisé à modifier la structure ou la géométrie de l'ATIR sous-jacente. Les backends sont des compilateurs en lecture seule chargés d'émettre des instructions binaires ou d'usinage.

### 4. Justification Scientifique Double (Chiffres & Images)
En vertu de la **Règle 65**, aucune amélioration ou optimisation algorithmique ne peut être validée sans double preuve systématique :
1. **Métriques objectives** (Indicateurs quantitatifs Hausdorff, TPI, SEI...).
2. **Comparaison visuelle automatisée** (Reference ➔ Generated ➔ Overlay ➔ Difference Heatmap).

### 5. Failure-Driven Development (FDD) & Immunisation
Tout bug identifié en production ou en phase de test doit obligatoirement faire l'objet d'un cas d'étude minimal modélisé dans la **Failure Database**. L'anomalie est convertie en test unitaire ou d'intégration automatique pour empêcher définitivement sa réapparition.

### 6. Validation Obligatoire sur le Golden Dataset
La compatibilité parfaite avec le **Golden Dataset** (1000 motifs de référence) et l'absence de régression géométrique, topologique ou physique sont des prérequis bloquants et obligatoires avant toute fusion de code ou de passage au statut Release Candidate.

### 7. Indépendance Totale de l'Infrastructure
Le cœur algorithmique du moteur d'ATCP doit rester totalement décorrélé des frameworks d'interface utilisateur (React, Electron, Flutter), des bases de données cloud (Firebase) et des spécificités physiques de machines de broderie ou de découpe laser. Le moteur doit pouvoir fonctionner de manière autonome en **Offline Research Mode**.
