# Architectural Specification: ATCP Institute & Knowledge Preservation
**Maturité (Règle 52) :** Designed  

L'**ATCP Institute** est l'organe centralisé de préservation, d'évaluation et de capitalisation scientifique d'Acom Technologie. Conformément à la **Règle 61 — Toute découverte devient une connaissance**, cet institut garantit que chaque percée technologique, chaque problème résolu et chaque étude ethnographique d'art textile s'inscrit durablement dans le patrimoine intellectuel de l'entreprise.

---

## 1. Structure Organisationnelle de l'Institut

L'institut est articulé autour de six divisions autonomes et complémentaires :

```
                                  ATCP INSTITUTE
                                         │
       ┌──────────────┬──────────────┬───┴───┬──────────────┬──────────────┐
       ▼              ▼              ▼       ▼              ▼              ▼
   [Research]   [Engineering]  [Validation] [Knowledge]  [Cultural]   [Education]
   State-of-   Algorithm dev   Continuous   Semantics &  Patrimoine &  Tutoriels &
    the-art     & Production    Metrology   Taxonomies    Savoir-faire  SDK Docs
```

1. **Research Division** : Analyse de l'état de l'art scientifique, modélisation physique des matières (rhéologie), formulation des équations d'ingénierie et brevets.
2. **Engineering Division** : Implémentation du compilateur, conception de l'**ATIR**, développement des backends d'export et correction de la dette technique.
3. **Validation Division** : Administration du Golden Dataset, rapports automatiques de non-régression et suivi du tableau de bord scientifique.
4. **Knowledge Division** : Maintenance de l'AEE Failure Database, des ontologies textiles et sémantiques.
5. **Cultural Heritage Division** : Numérisation haute fidélité des motifs traditionnels africains (Bogolan, Caftan, Kente, Wax) et codification des heuristiques des maîtres tailleurs.
6. **Education Division** : Publication de guides d'intégration, exemples de SDK, tutoriels et documentation des APIs publiques.

---

## 2. Base de Données de Pannes d'Usinage (AEE Failure Database)

Pour éviter de résoudre deux fois la même problématique mécanique ou géométrique, la division de la connaissance maintient une base de pannes documentée selon la nomenclature normalisée de la **Règle 61** :

```
/math/failures/
  ├── bug_0001_A_hole.md
  ├── bug_0002_tatami_funnel.md
  └── bug_0003_satin_overlap.md
```

### Exemple de fiche normalisée d'incident historique :
*   **Identifiant** : `BUG_0002`
*   **Désignation** : Artefact en entonnoir sur les coins Tatami
*   **Date d'observation** : 2026-07-12
*   **Cause Fondamentale** : Auto-intersection de rails courbes provoquant une déformation d'axe médian de squelettisation.
*   **Solution Implémentée** : Introduction du lissage adaptatif par splines cubiques de Bézier et mitigation par retrait d'angle.
*   **Statut** : Validé et intégré en production (Suite d'intégration verte).
*   **Impact Mesuré** : $+4.2\%$ sur l'indice de fidélité géométrique (GFI).

---

## 3. L'Atlas ATCP (The ATCP Atlas)

L'**Atlas ATCP** est une base de référence sémantique regroupant les cas réels d'utilisation et de compilation de motifs complexes. Il permet à l'institut d'auditer l'adéquation physique et esthétique des points brodés :

*   **Atlas / Alphabets** : Modèles de typographies microscopiques et lissage de contours fermés pour la lettrerie.
*   **Atlas / Logos** : Exemples d'icônes à forte contrainte géométrique (préservation absolue des trous).
*   **Atlas / Traditionnel** : Motifs sémantiques géométriques ethniques (Bogolan, Woven patterns).
*   **Atlas / Arabesques & Mandalas** : Tracés complexes à forte densité de courbes de Bézier.

Chaque entrée de l'Atlas référence :
1. Le dessin source vectoriel (SVG).
2. Sa représentation intermédiaire typée (**ATIR**).
3. Le fichier d'usinage compilé de référence (DST/PES).
4. La matrice d'évaluation des indices de qualité (GFI, TPI, SEI, $TPI^2$, SUI).

---

## 4. Le Panthéon Technique (ATCP Hall of Fame)

Le Hall of Fame célèbre les avancées marquantes d'ingénierie et de mathématiques qui ont jalonné la trajectoire d'ATCP. Chaque jalon documente l'historique d'innovation du moteur :

*   **Jalon 2026-07-11 : Préservation Fondamentale des Contreformes**
    *   *Auteur* : Audit Center & Topology Lab Agents
    *   *RFC associée* : `RFC-001-Topology-Core`
    *   *Gain Mesuré* : $+12.0\%$ sur l'Indice de Préservation Topologique (TPI). Conservation à $100\%$ des trous sur les glyphes de lettres `A`, `B`, `O`, `P`.
*   **Jalon 2026-07-12 : Alignement d'Arrondi Binaire (Extended Bresenham)**
    *   *Auteur* : Numerical Analysis & Machine Compilation Lab Agents
    *   *RFC associée* : `RFC-002-Numerical-Stabilization`
    *   *Gain Mesuré* : Dérive d'arrondi binaire cumulée abaissée sous la barre critique des $\le 0.05\text{ mm}$ sur $1000$ motifs.
