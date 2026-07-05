# Charte de Gouvernance Technique & Rôles des Agents (LEVEL 1)

Ce document décrit les conventions de développement, l'architecture logicielle, les règles de qualité et les responsabilités des agents au sein de l'écosystème Acom Technologie. Pour les principes fondateurs, référez-vous à `CONSTITUTION.md`.

## 1. Conventions Générales de Développement
- **Architecture Obligatoire** : `Vue (React)` → `Hook` → `Service` → `Repository` → `Local DB (Dexie)` → `Cloud DB (Firestore)`.
- **TypeScript** : Zéro `any` non justifié, typage strict et complet.
- **Multi-Tenant** : Le champ `merchantId` est obligatoire dans toute requête ou écriture de données.
- **Offline-First** : Toute lecture de données se fait prioritairement via Dexie. Toute écriture est d'abord locale puis synchronisée (Delta Sync / Sync Queue).
- **Rendus React** : Interdiction des rendus inutiles ; utiliser `useMemo`, `useCallback`, et des dépendances stables dans `useEffect`.
- **Composants** : Fichiers < 1500 lignes. Séparation stricte UI / Logique.

## 2. Rôles et Workflow des Agents IA (ACOM Engineering Organization)
L'organisation est structurée en plusieurs niveaux de responsabilité (Orchestration, Architecture, Ingénierie, Métier, Design, Audit, Exploitation).

### L'ACOM Audit Center
Garant de la qualité, l'Audit Center contrôle systématiquement toute modification avant intégration.
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
