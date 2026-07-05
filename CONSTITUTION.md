# CONSTITUTION — Acom Technologie

Ceci est le document fondateur (LEVEL 0) de l'écosystème **Acom Technologie**.
Il définit les principes immuables, la vision, la mission, les valeurs et les règles absolues qui ne doivent jamais être transgressées. Ce document évolue très rarement.

## 1. Vision d'Acom Technologie
Acom Technologie est une plateforme ERP Multi-SaaS modulaire et intégrée destinée aux PME, artisans, commerçants et entreprises africaines. L'écosystème est développé selon une approche **AI-Driven Engineering (ADES)** où les agents d'IA, les développeurs et les architectes logiciels collaborent de manière structurée autour d'une base documentaire unique.

## 2. Mission
Fournir un écosystème logiciel performant, évolutif et offline-first permettant à chaque module métier (SaaS) d'évoluer indépendamment tout en partageant une architecture robuste commune.

## 3. Principes d'Ingénierie & Valeurs
- **Qualité sans compromis** : Ne jamais privilégier la rapidité au détriment de l'architecture, de la sécurité ou de la performance.
- **Transparence et documentation** : Chaque décision architecturale doit être tracée et documentée.
- **Pérennité** : Concevoir pour le long terme, avec une maintenance facilitée et une dette technique maîtrisée.

## 4. Règles Absolues (Non Négociables)
1. **Offline-First par défaut** : La perte ou l'instabilité du réseau ne doit pas altérer les fonctionnalités critiques.
2. **Mobile-First & Desktop-Ready** : Interface réactive, adaptée au tactile (44px min) et optimisée Desktop.
3. **Performance-First** : Optimisation drastique des rendus React et des requêtes réseau/base de données.
4. **Security-First** : Cloisonnement strict multi-tenant et aucune exposition de clés secrètes sur le client.
5. **Multi-Tenant by Design** : Toutes les données sont cloisonnées par commerçant (`merchantId`).
6. **Type Safety** : Usage strict de TypeScript, zéro tolérance pour l'usage abusif de `any`.
7. **Clean Architecture** : Flux unidirectionnel strict (Vue → Hook → Service → Repository → Local DB → Cloud DB).
8. **Aucun composant React ne communique directement avec Firestore.** Les lectures et écritures passent par le Repository et la DB locale (Dexie).
9. **Maîtrise des coûts** : Optimisation drastique des quotas Firestore (pas d'écoutes temps réel non justifiées, pas de requêtes redondantes).

## 5. Hiérarchie Documentaire
- **LEVEL 0 : CONSTITUTION.md** — Principes fondateurs.
- **LEVEL 1 : AGENTS.md** — Conventions de développement, workflows, rôles des agents.
- **LEVEL 2 : Knowledge Base (`/docs/knowledge-base/`)** — Architecture globale, standards, modèles de données.
- **LEVEL 3 : Documentation Métier (`/docs/business/`)** — Règles spécifiques à chaque SaaS.
- **LEVEL 4 : Documentation Technique (`/docs/technical/`)** — API, base de données, infrastructure.
- **LEVEL 5 : Project Memory / ADR (`/docs/adr/`)** — Registre des décisions architecturales et mémoire du projet (`ProjectMemory.md`).
