# ATCP Atlas: Catalogue Sémantique des Familles de Motifs
**Maturité (Règle 52) :** Designed  

L'**ATCP Atlas** est l'encyclopédie de référence de notre patrimoine technique. Il répertorie les grandes familles de motifs brodés de l'écosystème, détaillant pour chacune le comportement géométrique, le schéma de points, la modélisation sémantique et les signatures de qualité.

---

## 1. Structure Spécifique des Fiches Atlas

Chaque entrée de l'Atlas est structurée de manière unifiée pour assurer la comparabilité métrique :

1. **Dessin Source (Source Drawing)** : Spécifications géométriques du tracé vectoriel (SVG).
2. **Représentation Intermédiaire (ATIR)** : Structure de graphe typée (EmbroideryGraph) avec métadonnées sémantiques.
3. **Fichier d'Usinage Référence (DST/PES Output)** : Code machine binaire compilé avec les compensations de retrait.
4. **Matrice de Performance** : Scores mesurés sur le Golden Dataset pour les 5 indices (GFI, TPI, SEI, $TPI^2$, SUI).
5. **Relaxation Physique** : Comportement élastique simulé face aux contraintes du tissu et de tension de fil.

---

## 2. Les Familles du Patrimoine Textile ATCP

```
                                  ATCP ATLAS
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
  [L'Art du Fil]             [L'Art Traditionnel]          [L'Art Moderne]
  Alphabets, Caftans,         Wax, Bogolan, Kente,         Logos, Icônes,
  Calligraphie, Dentelles     Mandalas, Arabesques         Blasons héraldiques
```

### 🅰️ Famille : Alphabets (Lettrerie Microscopique)
*   **Contraintes Physiques** : Échelle millimétrique, petits angles, haute densité locale de points, risque d'enchevêtrement de fils et de casse d'aiguille.
*   **Cible Topologique (TPI)** : Préservation stricte à $100\%$ des vides intérieurs (les trous des glyphes `A`, `B`, `O`, `P`, `Q`, `R`).
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `99.2%` | *TPI* : `100.0%` | *SEI* : `96.5%` | *$TPI^2$* : `98.1%` | *SUI* : `99.8%`

### 🛡️ Famille : Logos & Icônes (Géométrie Corporate)
*   **Contraintes Physiques** : Alignement rigoureux des contours de satin sur les surfaces de Tatami. Transition nette entre aplats et tracés fins.
*   **Cible de Compensation ($TPI^2$)** : Compensation bidirectionnelle asymétrique active pour contrer le retrait élastique perpendiculaire au sens des points.
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `98.9%` | *TPI* : `100.0%` | *SEI* : `95.8%` | *$TPI^2$* : `97.4%` | *SUI* : `98.2%`

### 🕸️ Famille : Dentelles & Filigranes
*   **Contraintes Physiques** : Tracés filaires extrêmement fins, multiples sauts de fil (Jumps) et coupes de fil (Trims). Échauffement potentiel de la tête machine.
*   **Cible d'Optimisation (SEI)** : Résolution du voyage de l'aiguille par voyageur de commerce orienté avec contraintes de sauts (TSP-PC / Travel Engine) pour minimiser les coupes.
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `97.8%` | *TPI* : `99.2%` | *SEI* : `98.9%` | *$TPI^2$* : `96.0%` | *SUI* : `97.5%`

### 🌀 Famille : Arabesques & Mandalas (Tracés de Courbures)
*   **Contraintes Physiques** : Changement permanent d'orientation de fil, densité variable, points de rebroussement serrés, lissage de courbure par splines.
*   **Cible de Modélisation (GFI)** : Conservation de l'homogénéité de densité sans surcharge locale d'impacts d'aiguille.
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `99.1%` | *TPI* : `100.0%` | *SEI* : `96.0%` | *$TPI^2$* : `96.8%` | *SUI* : `96.4%`

### 🏛️ Famille : Blasons & Remplissages Complexes
*   **Contraintes Physiques** : Immenses surfaces de Tatami. Risque de plissement (puckering) extrême du drapé et distorsion géométrique globale.
*   **Cible Physique ($TPI^2$)** : Lignes de support (underlay) multidirectionnelles denses et compensation élastique dynamique.
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `98.2%` | *TPI* : `100.0%` | *SEI* : `94.1%` | *$TPI^2$* : `98.9%` | *SUI* : `95.5%`

### 🌍 Famille : Wax & Bogolan (Géométrie Traditionnelle)
*   **Contraintes Physiques** : Rythmes graphiques alternés, fort contraste de couleurs, alignement de motifs imbriqués de grande envergure.
*   **Cible Sémantique (SUI)** : Identification par le Semantic Engine des motifs traditionnels de délimitation de zones pour appliquer des textures de Tatami à motifs (carreaux, chevrons).
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `97.5%` | *TPI* : `100.0%` | *SEI* : `95.2%` | *$TPI^2$* : `97.0%` | *SUI* : `99.1%`

### 🦓 Famille : Kente (Motifs Tissés Orthogonaux)
*   **Contraintes Physiques** : Blocs orthogonaux denses à sens d'aiguille alternés à $90^\circ$. Contraintes de cisaillement mécanique localisées aux frontières des blocs.
*   **Cible Topologique (TPI)** : Aucun vide de décollement aux jonctions de blocs d'angles opposés.
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `98.4%` | *TPI* : `100.0%` | *SEI* : `96.2%` | *$TPI^2$* : `97.8%` | *SUI* : `99.5%`

### 👘 Famille : Caftans (Ornements Continus)
*   **Contraintes Physiques** : Longues bordures symétriques fluides, continuité géométrique absolue sur plusieurs mètres de broderie, gestion des raccords.
*   **Cible sémantique (SUI)** : Repérage automatique des structures de frises et rubans par squelettisation pour un passage en point de bourdon (Satin) continu à largeur adaptative.
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `99.0%` | *TPI* : `100.0%` | *SEI* : `97.1%` | *$TPI^2$* : `98.5%` | *SUI* : `99.7%`

### ✒️ Famille : Calligraphie (Esthétique Satin)
*   **Contraintes Physiques** : Déliés et pleins fluides, variations de largeur continues d'angles d'aiguilles, chevauchement d'arcs géométriques.
*   **Cible d'Ingénierie (Satin Engine)** : Lissage d'angle d'aiguille continu et calcul optimal de la triangulation satin sans plis.
*   **Signature de Référence (Metrics)** :
    *   *GFI* : `99.4%` | *TPI* : `100.0%` | *SEI* : `97.5%` | *$TPI^2$* : `98.0%` | *SUI* : `98.9%`
