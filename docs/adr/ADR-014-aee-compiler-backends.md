# ADR-014 : Architecture de Compilation LLVM-like et Backends Machines Multi-Formats

**Date :** 2026-07-12  
**Auteur :** ACOM Systems Architect  
**Statut :** Accepté  
**Maturité (Règle 52) :** Designed / Prototype  

## Contexte
La plupart des logiciels de broderie traduisent directement les vecteurs graphiques en instructions binaires d'un format spécifique (ex. SVG vers DST). Cette approche directe rend extrêmement complexe l'ajout de nouveaux formats de fichiers (PES, JEF, VP3, U01) car le code de génération de points doit être réécrit ou adapté pour chaque format. Pour offrir une extensibilité maximale, le moteur doit être structuré à l'image d'un compilateur moderne (comme GCC ou LLVM).

## Décision
Adopter une **Architecture de Compilation Modulaire** découplée :
- **Frontend (Analyse & AST)** : Analyse les fichiers géométriques sources (SVG, DXF, images tracées) et construit un **Abstract Syntax Tree (AST)** de la broderie représentant les intentions de conception.
- **Middle-End (Optimisation & Représentation Intermédiaire - IR)** :
  - Convertit l'AST en une **Représentation Intermédiaire (IR)** neutre et vectorielle. L'IR d'AEE contient des chemins de points 3D $(x, y, z)$ enrichis de méta-commandes génériques (Stitch, Jump, Trim, ChangeColor, SpeedZone).
  - Exécute tous les moteurs d'optimisation de manière générique sur l'IR (optimiseur de chemin TSP, décimateur de densité, compensateur de tension physique).
- **Backend (Générateurs de code machine)** :
  - Des backends spécialisés et interchangeables (Tajima DST Backend, Brother PES Backend, Janome JEF Backend, Husqvarna VIP3 Backend) consomment l'IR optimisée et la compilent dans les formats binaires physiques cibles en appliquant les encodages d'instructions spécifiques à chaque marque.

```
  [SVG/DXF] ──► [Frontend] ──► [AST] ──► [Middle-End (Optimisations)] ──► [IR]
                                                                           │
         ┌─────────────────────────┬─────────────────────────┬─────────────┴─────────────┐
         ▼                         ▼                         ▼                           ▼
  [DST Backend]             [PES Backend]             [JEF Backend]               [VP3 Backend]
         │                         │                         │                           │
         ▼                         ▼                         ▼                           ▼
   Fichier .dst              Fichier .pes              Fichier .jef                Fichier .vp3
```

## Conséquences
- **Avantages** :
  - **Extensibilité infinie** : L'ajout d'un nouveau format de broderie se résume à l'écriture d'un petit fichier "Backend" de sérialisation binaire qui consomme l'IR générique. Pas besoin de toucher aux algorithmes géométriques ou de simulation.
  - **Optimisations centralisées** : N'importe quelle amélioration du Middle-End (ex. meilleure résolution du TSP ou lissage physique) s'applique instantanément et automatiquement à tous les formats de sortie machine.
- **Inconvénients** :
  - Légère surcharge de calcul à cause des étapes d'analyse de l'arbre syntaxique abstrait et de conversion vers l'IR, négligeable face au gain de maintenance et de propreté logicielle.
