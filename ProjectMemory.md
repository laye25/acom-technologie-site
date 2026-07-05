# Project Memory (LEVEL 5)

Ce document liste les décisions fondamentales et l'historique des choix structurants d'Acom Technologie. Il sert de mémoire technique pour tous les agents.
Pour le registre détaillé, consultez le dossier `/docs/adr/`.

## Registre des Décisions Essentielles

### Décision 001 : Toutes les lectures passent par Dexie
- **Date** : [Historique]
- **Contexte** : Épuisement rapide des quotas de lecture Firestore (getDocs) en production.
- **Décision** : L'interface React ne lit les données que depuis la base locale IndexedDB (via Dexie). Les données distantes sont synchronisées en tâche de fond.
- **Impact** : Réduction massive des coûts Firestore, mode hors-ligne natif.

### Décision 002 : Aucun composant React ne communique avec Firestore
- **Date** : [Historique]
- **Contexte** : Complexité croissante des composants et couplage fort avec le backend.
- **Décision** : Instauration d'une Clean Architecture stricte. Composant → Hook → Service → Repository → DB.
- **Impact** : Séparation des responsabilités, testabilité améliorée, réutilisabilité.

### Décision 003 : Toute collection doit contenir merchantId
- **Date** : [Historique]
- **Contexte** : Passage en modèle Multi-Tenant SaaS.
- **Décision** : Tout document métier créé (Firestore et Dexie) doit inclure l'identifiant du commerçant (`merchantId`). Les requêtes doivent obligatoirement filtrer sur ce champ.
- **Impact** : Sécurité et isolation des données inter-commerçants.

### Décision 004 : L'Offline-First est obligatoire
- **Date** : [Historique]
- **Contexte** : Utilisation de l'ERP dans des zones à faible connectivité en Afrique.
- **Décision** : L'application doit pouvoir fonctionner, prendre des commandes et encaisser sans internet.
- **Impact** : Utilisation d'une file d'attente de synchronisation locale (Sync Queue) et de transactions locales.

### Décision 005 : Restructuration AI-Driven Engineering System (ADES)
- **Date** : 2026-07-03
- **Contexte** : Le fichier `AGENTS.md` devenait trop long (500+ lignes) et difficile à lire pour les agents IA.
- **Décision** : Mise en place d'une hiérarchie documentaire stricte en 5 niveaux (CONSTITUTION.md, AGENTS.md, Knowledge Base, Docs Métier, Project Memory).
- **Impact** : Gouvernance documentaire plus modulaire et spécialisée, évitant la surcharge cognitive des agents IA.
