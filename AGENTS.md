# Charte de Gouvernance Technique & Rôles des Agents (LEVEL 1)

Ce document décrit les conventions de développement, l'architecture logicielle, les règles de qualité et les responsabilités des agents au sein de l'écosystème Acom Technologie. Pour les principes fondateurs, référez-vous à `CONSTITUTION.md`.

## 1. Conventions Générales de Développement
- **Architecture Obligatoire** : `Vue (React)` → `Hook` → `Service` → `Repository` → `Local DB (Dexie)` → `Cloud DB (Firestore)`.
- **TypeScript** : Zéro `any` non justifié, typage strict et complet.
- **Multi-Tenant** : Le champ `merchantId` est obligatoire dans toute requête ou écriture de données.
- **Offline-First** : Toute lecture de données se fait prioritairement via Dexie. Toute écriture est d'abord locale puis synchronisée (Delta Sync / Sync Queue).
- **Rendus React** : Interdiction des rendus inutiles ; utiliser `useMemo`, `useCallback`, et des dépendances stables dans `useEffect`.
- **Composants** : Fichiers < 1500 lignes. Séparation stricte UI / Logique.
- **Règle 40 — Le moteur est un produit** : Acom Embroidery Engine (AEE) est un produit autonome de l'écosystème Acom Technologie. Toute évolution doit préserver son indépendance vis-à-vis de React, de Firebase et de `TailleurEmbroideryManager`, sa compatibilité multi-plateforme (Web, Desktop, Mobile), et sa capacité à être packagé sous forme de SDK ou déployé comme micro-service.
- **Règle 50 — Le moteur est une plateforme** : L'AEE n'est plus un simple module de broderie, c'est une plateforme d'ingénierie CAD/CAM textile. Toute nouvelle fonctionnalité d'ingénierie doit être développée sous forme de moteur ou de noyau autonome (Engine/Kernel) possédant une interface publique claire, des tests unitaires, sa documentation, ses benchmarks, son ADR et ses spécifications mathématiques. Aucun algorithme complexe de CAO/FAO ne doit être couplé directement aux composants React ou au cycle de vie de l'UI.
- **Règle 51 — Aucune dette technique** : Lorsqu'une erreur de compilation, de lint ou de test unitaire apparaît, le développement de toute nouvelle fonctionnalité est strictement gelé. La priorité absolue et exclusive de tous les agents de l'écosystème devient la résolution complète et immédiate de cette régression. Aucune documentation supplémentaire ne doit être produite tant que l'intégrité de la base de code (compilation verte à 100%) n'est pas rétablie.
- **Règle 52 — Documentation ≠ Implémentation** : Tout document d'architecture, spécification algorithmique ou fiche décisionnelle (ADR) doit obligatoirement arborer un statut explicite de maturité parmi la grille suivante :
  - **Draft** : Idée ou concept préliminaire.
  - **Designed** : Architecture formellement validée par l'Audit Center.
  - **Prototype** : Code partiel ou expérimental en cours d'évaluation.
  - **Implemented** : Code de production pleinement fonctionnel.
  - **Tested** : Suite de tests unitaires et d'intégration validée à 100%.
  - **Benchmarked** : Profils de performances et limites de charge documentés.
  - **Production** : Module stable, éprouvé, résistant et déployé.
- **Règle 53 — Toute modification doit être mesurable** : Aucune modification ou optimisation d'algorithme (ex. ajustement du Tatami, modification du lisseur de courbe Satin) ne peut être intégrée sans être mesurée de manière quantitative par le Validation Center et le Benchmark permanent. Chaque soumission de code doit documenter ses impacts précis sur les indicateurs clés (densité, longueur de fil, nombre de trims/coupes, temps machine estimé et score de non-régression). Les gains doivent être chiffrés et validés par rapport au Golden Dataset.
- **Règle 54 — Toute affirmation doit être démontrée** : Aucune amélioration ne peut être considérée comme valide tant qu'elle n'est pas démontrée par des mesures reproductibles. Chaque évolution doit obligatoirement fournir le benchmark avant/après, les métriques utilisées, le jeu de données de référence et la reproductibilité du test pour éliminer les impressions subjectives.
- **Règle 55 — Les Golden Datasets sont immuables** : Le jeu de données de référence (Golden Dataset) ne doit jamais être altéré ou éludé pour "faire passer" un nouvel algorithme ou masquer une régression. Si un nouveau cas ou cas limite est nécessaire, il est ajouté sous forme de nouveau motif dans le dataset mais ne remplace jamais un ancien motif existant afin de garantir la validité historique des comparaisons temporelles.
- **Règle 56 — Les connaissances métier sont des actifs** : Toute décision d'un expert textile observée, validée et reproductible doit obligatoirement être modélisée et documentée au sein de la base de connaissances sémantique. Les algorithmes d'AEE doivent être nourris non seulement par la recherche mathématique, mais également par les heuristiques professionnelles des maîtres tailleurs.
- **Règle 57 — La recherche précède l'implémentation** : Avant tout développement ou modification majeure d'un algorithme (ex. passage au Tatami de courbure variable ou intégration du jumeau numérique), une phase d'analyse de l'état de l'art (revue de littérature, comparaison des approches scientifiques, hypothèses de gains) et la rédaction de spécifications mathématiques formelles sont impérativement requises.
- **Règle 58 — Toute théorie doit produire un prototype** : Chaque nouvelle théorie ou proposition de RFC doit obligatoirement conduire à un prototype expérimental fonctionnel. Ce prototype doit être rigoureusement évalué sur le Golden Dataset. S'il s'avère meilleur sur les indicateurs de performance, il devient candidat à la production ; sinon, il reste classé comme expérimentation documentée au sein du journal de recherche.
- **Règle 59 — Une innovation est définie par une amélioration mesurée** : Une fonctionnalité ou modification d'algorithme n'est qualifiée d'innovante que si elle améliore de manière mesurable et reproductible au moins un des indicateurs physiques ou mathématiques (fidélité géométrique, conservation des contreformes, réduction du nombre de points, du temps machine ou des coupes, réduction de la dérive d'arrondi, ou fidélité de la simulation physique).
- **Règle 60 — Le code devient prioritaire** : Pendant les prochains sprints, la priorité absolue d'exécution est attribuée à l'implémentation des algorithmes du moteur de calcul, à sa performance et aux benchmarks quantitatifs. L'effort doit être alloué à hauteur de 80% sur le code, les tests et l'évaluation sur le Golden Dataset, et 20% sur la documentation. La documentation scientifique doit être la conséquence directe du travail expérimental et de l'intégration de prototypes validés, et non un substitut à l'implémentation.
- **Règle 61 — Toute découverte devient une connaissance** : Chaque résolution de problème structurel ou physique (ex. biais d'arrondi binaire, perte de contreforme, artefact de Tatami) doit donner lieu à la rédaction d'une fiche d'analyse normalisée au sein de la base de pannes et connaissances d'ATCP afin de capitaliser de manière pérenne sur le patrimoine scientifique.
- **Règle 62 — Une compilation verte est un prérequis absolu** : Aucun document, aucune RFC, aucune architecture ne peut être considérée comme "validée" ou "stable" tant que TypeScript compile à 100%, ESLint s'exécute sans erreur, et que l'intégrité fonctionnelle des benchmarks critiques est formellement vérifiée. Cette règle protège l'alignement absolu entre la théorie et l'état réel de production.
- **Règle 63 — Séparation Moteur / Infrastructure** : Toute erreur doit faire l'objet d'une classification stricte avant de pouvoir bloquer un sprint. Les erreurs de **Catégorie A (Moteur)** comprenant TypeScript, exceptions de runtime, pannes d'interpolation géométrique, de connectivité topologique, d'optimisation de parcours ou de compilation machine (DST/PES) imposent le gel immédiat de l'ingénierie (Règle 51). Les erreurs de **Catégorie B (Infrastructure)** liées aux services tiers (quotas ou pannes Firestore/Auth, pannes CDN, instabilités ou limitations réseau) n'interrompent pas le développement. Le noyau de calcul textile d'ATCP est nativement autonome et dispose d'un **Offline Research Mode** s'appuyant exclusivement sur les bases de données locales (Dexie/IndexedDB) et les motifs de test hors ligne.
- **Règle 64 — Un ticket n'est terminé que s'il est mesuré** : Tout ticket d'ingénierie d'ATCP (sprints S1 à S6) n'est considéré comme "Terminé" que s'il produit un prototype fonctionnel, une suite de tests unitaires, l'intégration des cas limites associés au Golden Dataset, et un rapport de métrologie avant/après validé par le **Regression Scientist Agent**. Ce rapport doit obligatoirement prouver le gain quantitatif sur au moins un des indicateurs (GFI, TPI, SEI, $TPI^2$, SUI) sans aucune régression. À défaut, le ticket reste confiné au statut Prototype.
- **Règle 65 — Une métrique ne remplace jamais une image** : Une amélioration algorithmique n'est formellement validée que si les métriques quantitatives progressent ET que la comparaison visuelle systématique (Reference ➔ Generated ➔ Overlay ➔ Difference Heatmap ➔ Metrics) confirme l'amélioration réelle sans artefacts résiduels. Les chiffres guident, mais l'image démontre la conformité.
- **Règle 66 — Une architecture figée ne se modifie plus sans preuve** : Toute modification de l'ATIR ou des interfaces des moteurs (Geometry, Topology, Ribbon, Stitch, Travel) est interdite sans un dossier complet comprenant une justification théorique, des démonstrations quantitatives précises et un rapport d'écart sur le Golden Dataset de 1000 motifs.
- **Règle 67 — Un moteur ne progresse jamais seul** : Toute modification d'un moteur ou d'une passe de transformation individuelle doit être évaluée sur l'intégralité du pipeline. Une amélioration locale de métriques (ex: +2% de fidélité géométrique) ne peut être validée si elle dégrade la topologie aval, l'optimisation du parcours ou le comportement physique global.
- **Règle 68 — Isolation Stricte des Jeux de Données et Anti-Surapprentissage** : Un benchmark ne doit jamais être entraîné, calibré ou sur-ajusté (overfitted) sur les données qu'il a la charge de certifier. La suite d'évaluation doit s'appuyer sur une séparation étanche des motifs :
  - **Training Dataset** : Utilisé lors de l'expérimentation pour calibrer les hyperparamètres (ex. epsilon adaptatif, pas de rééchantillonnage, coefficients physiques).
  - **Golden Dataset** : Totalement gelé et en lecture seule, servant uniquement à la détection de non-régression locale.
  - **Industrial Validation Dataset** : Jeu de données tiers, inconnu des développeurs et des agents, servant exclusivement à l'audit de certification final.
- **Règle 69 — Jalonnement Obligatoire SPR-008.8 (Industrial Validation)** : Il est interdit d'entamer le simulateur machine (SPR-009) tant que la phase de transition SPR-008.8 n'est pas finalisée. Ce sprint intermédiaire exige la mise en œuvre d'un validateur topologique purement théorique (basé sur le Winding Number et le graphe d'adjacence sans dictionnaire manuel), le gel en lecture seule du Golden Dataset v1.0.0, et la validation physique multi-matières du moteur de calcul.
- **Règle 70 — Consolidation sémantique et gel de la complexité logicielle** : Afin de préserver l'intégrité fonctionnelle d'ATCP, aucune nouvelle fonctionnalité logicielle d'envergure ou module d'architecture global ne peut être développé s'il n'apporte pas de nouvelles observations (OBS), de nouvelles hypothèses (HYP), de nouvelles expériences (EXP) ou de nouvelles lois textiles (LAW) validées, ou s'il ne contribue pas directement à une amélioration mathématique ou physique mesurable des moteurs existants sur le Golden Dataset. L'effort principal est désormais dévolu à l'alimentation du registre sémantique par la preuve physique.


## 2. Rôles et Workflow des Agents IA (ACOM Engineering Organization)
# Version de la Charte : 1.0 (GELÉE) - Toute modification future doit être exceptionnelle et justifiée par l'implémentation.
L'organisation est structurée en plusieurs niveau de responsabilité (Orchestration, Architecture, Ingénierie, Métier, Design, Audit, Exploitation).

### L'ACOM Research & Validation Office
Cette division pilote la recherche textile avancée et supervise la robustesse expérimentale de l'AEE :
- **Chief Scientist** : Arbitre scientifique de la plateforme. Garanti que les choix d'ingénierie s'appuient sur des preuves quantitatives du benchmark. Il priorise l'évolution des prototypes de recherche vers la production et assure l'alignement sur la Vision 2030.
- **Research Librarian** : Effectue une veille permanente sur l'état de l'art scientifique (publications en géométrie computationnelle, mécanique des milieux continus, vision et simulation 3D), en extrait les approches applicables à l'AEE et formalise les protocoles expérimentaux.
- **Experiment Manager** : Prépare et administre les scénarios du Golden Dataset, configure les environnements du Test Lab, lance les campagnes de benchmarks permanent et génère automatiquement les rapports de performance comparatifs.
- **Scientific Reviewer** : Comité de lecture scientifique interne. Il ne développe jamais de code de production. Il valide la justesse théorique des équations, la pertinence des références académiques de l'état de l'art, la rigueur des démonstrations et la répétabilité absolue des protocoles de tests expérimentaux.
- **Regression Scientist** : Gardien de l'intégrité fonctionnelle et physique. Il compare de manière totalement automatisée les résultats d'exécution de la version $N$ versus la version $N+1$ du compilateur sur les 1000 motifs du Golden Dataset. Il calcule les indices différentiels de fidélité et arbitre souverainement si un nouvel algorithme engendre ou non une régression géométrique, topologique ou physique.

### L'ACOM Audit Center
Garant de la qualité, l'Audit Center contrôle systématiquement toute modification avant intégration.
- **Build Guardian** : Gardien absolu du pipeline CI/CD et de l'intégrité de la compilation. Il bloque l'intégration de toute modification géométrique, fonctionnelle ou documentaire si le linter ou le compilateur lève le moindre avertissement critique ou erreur de typage.
- **Architecture Compliance Auditor** : Vérifie l'architecture Clean, la modularité et l'isolation SaaS.
- **React Performance Auditor** : Traque les re-renders inutiles et optimise les hooks.
- **Firestore & Offline Auditor** : Protège les quotas Firestore, vérifie Dexie et la Delta Sync.
- **Multi-Tenant Security Auditor** : Sécurise les données (`merchantId`, Firestore Rules).
- **Desktop & Mobile Auditors** : Garantissent l'expérience Electron (Desktop) et tactile/responsive (Mobile).
- **UX, Business & Doc Auditors** : Valident l'ergonomie, les règles métier par SaaS et la documentation.
- **Technical Debt & AI Consistency Auditors** : Mesurent la dette et assurent la cohérence du travail des agents IA.
- **Audit Coordinator** : Rassemble les rapports et génère le plan de remédiation priorisé (P1 à P4).

### Rituel de Démarrage (Prompt Commun des Agents)
Avant de commencer toute tâche, procédez systématiquement selon les étapes suivantes :
1. Comprendre précisément la demande et son objectif métier.
2. Lire les fichiers, documents et conventions concernés, en premier lieu la Knowledge Base et `AGENTS.md`.
3. Identifier les impacts sur l'architecture, les autres modules et les plateformes (Web, Desktop, Mobile).
4. Vérifier la conformité avec les principes de sécurité, de performance, d'architecture et de modularité.
5. En cas d'incertitude ou d'information manquante, le signaler explicitement plutôt que de faire une hypothèse.
6. Produire une solution argumentée, maintenable et conforme aux standards d'Acom Technologie.
7. Terminer par une validation indiquant les risques, les recommandations et les éventuels points nécessitant l'intervention d'un autre agent.

## 3. Accès à la Knowledge Base
Ne mettez pas les détails métier ici. Consultez les sous-dossiers de `/docs/` :
- `/docs/architecture/` : Détails techniques et de persistance (Firestore, Dexie, etc.).
- `/docs/business/` : Règles spécifiques de chaque SaaS (BTP, RH, Medical, etc.).
- `/docs/ui/` : Design System, accessibilité et composants.
- `/docs/prompts/` : Prompts spécifiques pour chaque agent.
- `ProjectMemory.md` / `/docs/adr/` : L'historique des décisions.
