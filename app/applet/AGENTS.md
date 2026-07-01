# Conventions du Projet (Project Conventions) & Architecture ACOM

Ce document est **OBLIGATOIRE** et **CRITIQUE** pour toute IA ou tout développeur intervenant sur le projet ACOM.
L'objectif est de garantir de façon absolue :
*   La stabilité du système
*   La performance maximale (Zero-lag)
*   La sécurité des données et des clés d'API
*   La maintenabilité à long terme
*   La cohérence visuelle et UX
*   La réduction drastique des coûts et quotas Firebase (anti-boucle et requêtes optimisées)
*   Une architecture évolutive Multi-SaaS étanche.

---

## 1. Philosophie du Projet

L'application ACOM est une plateforme Multi-SaaS destinée aux PME et artisans de divers secteurs (tailleurs, écoles, chantiers, etc.).
*   **Indépendance absolue :** Chaque SaaS métier doit être totalement indépendant, facilement activable/désactivable, et facilement maintenable.
*   **Couplage faible :** Aucune fonctionnalité métier ne doit dépendre directement d'une autre. Elles partagent uniquement les services et composants transversaux.
*   **Services communs :** Toutes les communications et fonctionnalités partagées (authentification, paiement, synchronisation, UI globale) passent par des modules partagés (`shared/`).

---

## 2. Principes Fondamentaux (NON NÉGOCIABLES)

Vous devez concevoir et développer en appliquant en permanence ces 9 piliers :
1.  **Offline First :** L'artisan doit pouvoir travailler dans son atelier ou sur le terrain sans aucune connexion internet. La base de données locale est la source de vérité immédiate.
2.  **Mobile First :** L'usage principal se fait sur smartphone sur le terrain. L'interface doit être ultra-fluide, tactile et parfaitement responsive.
3.  **Performance First :** Pas de lag au clic, chargement instantané, transition fluide, renders optimisés.
4.  **Security First :** Aucune clé privée dans le client, validation systématique de toutes les entrées.
5.  **Type Safety First :** Typage strict et complet, interdiction d'utiliser `any`.
6.  **Modularité :** Composants atomiques et réutilisables, pas de fichiers géants ou fourre-tout.
7.  **Réutilisabilité :** Factorisation systématique de la logique métier dans des hooks et utilitaires.
8.  **Évolutivité :** Facilité d'ajouter un nouveau domaine d'activité (SaaS) sans impacter les existants.
9.  **Coût Firebase Minimal :** Conception axée sur l'économie stricte des lectures/écritures Firestore.

> 💡 **RÈGLE DE DÉCISION :** Si plusieurs solutions techniques existent, choisissez toujours celle qui est la plus performante, la moins coûteuse en ressources/Firebase, et la plus simple à maintenir.

---

## 3. Architecture Obligatoire

Le flux de données et la communication entre les couches du projet doivent **STRICTEMENT** suivre ce schéma unidirectionnel :

```
    [ UI / Vues ]
         ↓
     [ Pages ]
         ↓
  [ Components ]
         ↓
     [ Hooks ]
         ↓
    [ Services ]
         ↓
  [ Repositories ]
         ↓
 [ Firestore / Dexie ]
```

*   **INTERDICTION STRICTE :** Aucun composant React (`Component` / `Page` / `Hook` UI) ne doit communiquer directement avec Firestore. Toute interaction de données doit transiter par la couche `Repository` ou `Service`.

---

## 4. Gestion Firebase & Contrôle des Quotas (CRITIQUE)

L'application a précédemment souffert d'épuisement prématuré des quotas de lecture Firestore (Firebase Quota Exhaustion) dus à des boucles de synchronisation et des interrogations non optimisées. Chaque ouverture d'écran doit produire le moins de lectures Firestore possible.

### 4.1 Interdictions Absolues (INTERDIT)
*   ❌ **INTERDIT** d'utiliser `getDocs()` ou `onSnapshot()` directement dans les composants React.
*   ❌ **INTERDIT** d'effectuer des requêtes Firebase imbriquées (N+1 queries).
*   ❌ **INTERDIT** d'exécuter des lectures répétitives ou d'interroger Firebase à l'intérieur d'une boucle ou d'un rendu (`render`).
*   ❌ **INTERDIT** de récupérer l'intégralité d'une collection sans filtre ou pagination.
*   ❌ **INTERDIT** de faire des scans complets Firestore.
*   ❌ **INTERDIT** d'utiliser des requêtes avec des clauses `where` sans s'assurer que les index associés sont correctement configurés.
*   ❌ **INTERDIT** d'utiliser `orderBy` de manière inutile ou surabondante.
*   ❌ **INTERDIT** de dupliquer ou de laisser des écouteurs (`listeners`) orphelins.

### 4.2 Règles d'Implémentation Firebase (OBLIGATOIRE)
1.  **Le "Delta-Sync" Obligatoire :** Lorsque vous ajoutez une nouvelle collection ou table à synchroniser pour une utilisation hors ligne ou en cache, vous devez utiliser la méthode de synchronisation incrémentale.
    *   *Méthode :* Ne téléchargez pas toute la collection à chaque chargement.
    *   Stockez la date du dernier appel dans le `localStorage` (ex: `last_sync_factures`).
    *   Effectuez vos clauses avec la contrainte : `where('updated_at', '>=', lastSyncDate)`.
    *   *Exemple de référence :* Regardez la méthode `syncOrders` ou `syncSales` dans `src/services/syncService.ts`.
2.  **Gestion Strict du Temps Réel (Real-time) :** Si vous devez utiliser des abonnements en temps réel, vous devez utiliser le fichier `subscription.engine.ts` (via un repository). Ce moteur gère le comptage de références et détruit les écouteurs orphelins pour prévenir les fuites de mémoire et la consommation de quotas fantôme. Tout abonnement manuel doit impérativement retourner et appeler sa fonction de désabonnement (`unsubscribe`) lors du démontage du composant (`unmount`).
3.  **Protection Contre les Boucles Infinies (CRITIQUE) :**
    *   Les écritures (`updateDoc`, `setDoc`, `addDoc`) ne doivent être déclenchées **QUE par des actions humaines directes** (ex : un clic sur un bouton) ou par une fonction isolée.
    *   Un `useEffect` ne doit **jamais** écouter l'état d'un document Firebase pour y réécrire une donnée automatiquement sans un verrou (lock/flag) strict et explicite.
4.  **Suppression des Erreurs Bloquantes sur Timestamps :** Vérifiez toujours le traitement des objets "Timestamp" provenant de Firestore. Un Timestamp qui cause un plantage sur l'interface utilisateur provoque des rechargements automatiques (Refresh) en rafale par l'utilisateur, ce qui engendre des dizaines de milliers de lectures en cascade. Assurez-vous d'utiliser `timestamp.toDate()` ou la fonction associée plutôt que d'essayer d'afficher le `Timestamp` sous forme de primitive.

---

## 5. Offline First

Toute donnée doit suivre ce cycle d'écriture et de lecture standardisé :

```
[ Utilisateur ] ➔ [ Base Dexie (Locale) ] ➔ [ Sync Queue ] ➔ [ Firestore ]
                                                                   │
                                                                   ▼
[ Utilisateur ] ⮌ [ Base Dexie (Locale) ] ⮌ [ Synchronisation Delta ]
```

*   **RÈGLE D'OR :** L'utilisateur écrit dans la base locale Dexie, puis le système synchronise en tâche de fond. L'utilisateur lit de la base locale Dexie, mise à jour par la synchronisation Delta.
*   **INTERDICTION :** Ne faites jamais interagir l'utilisateur en direct avec Firestore pour ses opérations quotidiennes (Utilisateur ➔ Firestore ➔ Dexie est STRICTEMENT INTERDIT).

---

## 6. Synchronisation

Toute synchronisation de données doit être :
*   **Incrémentale (Delta-Sync) :** Ne synchroniser que les enregistrements créés ou modifiés depuis la dernière synchronisation réussie.
*   **Annulable & Résiliente :** Gérer proprement les interruptions réseau, les coupures de courant ou la mise en veille de l'appareil.
*   **Automatique :** Reprendre automatiquement dès que la connexion internet est rétablie.
*   **Sans conflit :** Utiliser des stratégies claires de résolution de conflits (ex: "Last Write Wins" ou horodatage strict).
*   **Outils uniques autorisés :** Utilisez exclusivement `syncService`, `subscription.engine`, et `Dexie` pour gérer ces cycles.

---

## 7. Performances React

Pour garantir une interface fluide (60 FPS) et éviter les rendus inutiles :
*   **Optimisations à utiliser systématiquement :**
    *   `React.memo` pour les composants purs de liste ou de formulaire complexes.
    *   `useMemo` pour les calculs de coûts, de filtres, ou le formatage de gros volumes de données.
    *   `useCallback` pour toutes les fonctions passées en tant que props à des composants enfants afin d'éviter leur recréation.
    *   `lazy()` et `Suspense` pour charger dynamiquement les modules de chaque SaaS métier au besoin (Code Splitting).
    *   **Virtualisation de listes (ex: react-window / react-virtuoso) :** Obligatoire pour l'affichage de listes contenant plus de 100 éléments (historique des factures, liste des clients, tissus).
*   **INTERDICTIONS DANS LES RENDERS :**
    *   ❌ Ne jamais recréer des tableaux vides (`[]`), objets vides (`{}`), ou fonctions fléchées directes dans les props ou le corps du composant s'ils sont réévalués à chaque render sans mémoïsation.

---

## 8. Gestion de l'État

L'état de l'application doit être segmenté de façon étanche :
1.  **UI State :** État transitoire d'affichage (ex: modal ouverte, tiroir actif) -> géré localement (`useState`).
2.  **Local State :** État d'un composant autonome (ex: saisie en cours dans un champ de texte).
3.  **Shared State :** État partagé entre plusieurs vues non parentes (ex: filtre de recherche global, informations de session) -> géré par Context React ou un store léger.
4.  **Persistent State :** Données devant persister localement (ex: préférences utilisateur, brouillons) -> stocké dans la base locale Dexie ou `localStorage`.
5.  **Cloud State :** Données synchronisées globalement -> stocké dans Firestore.

*   **INTERDIT :** Ne mélangez jamais ces niveaux d'état (ex: stocker un état UI temporaire dans le Cloud ou dans Dexie).

---

## 9. Qualité du Code & Bonnes Pratiques

Le code doit être écrit selon les meilleurs standards de l'ingénierie logicielle :
*   **SOLID :** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
*   **DRY (Don't Repeat Yourself) :** Pas de duplication de logique de calcul ou de requêtes.
*   **KISS (Keep It Simple, Stupid) :** Favoriser la lisibilité du code par rapport à des astuces complexes.
*   **YAGNI (You Aren't Gonna Need It) :** Ne codez pas de fonctionnalités complexes "au cas où". Restez strictement dans le périmètre du besoin utilisateur.
*   **Clean Code :** Variables explicites en anglais ou français homogène, pas de commentaires redondants, fonctions pures dès que possible.
*   **Limites de taille strictes (OBLIGATOIRE) :**
    *   Maximum **150 lignes** de code par fichier composant. Si vous dépassez, extrayez des sous-composants.
    *   Maximum **40 lignes** de code par fonction. Si vous dépassez, découpez en sous-fonctions.

---

## 10. TypeScript Strict

Le projet utilise un typage fort pour prévenir les bugs d'exécution :
*   **INTERDICTION ABSOLUE d'utiliser `any` :** L'usage du type `any` est proscrit. Si un type est complexe ou dynamique, utilisez `unknown`, des génériques (`<T>`), ou des types utilitaires (`Record`, `Partial`, etc.).
*   **Déclaration des interfaces :** Toute entité de données (ex: Facture, Tissu, Client, Commande) doit posséder son interface TypeScript complète déclarée dans `src/types.ts` **avant** toute implémentation ou utilisation.
*   **Utilisation des Enums :** Utilisez des enums standardisés pour les statuts et constantes, sans utiliser `const enum`.

---

## 11. UI / UX & Design System

*   **Cohérence Visuelle :** Suivre strictement la charte graphique de la plateforme. Utiliser des espacements homogènes (système de grille Tailwind : `p-4`, `m-2`, etc.) et une typographie unique.
*   **Icônes Lucide Uniquement :** Utilisez exclusivement des icônes provenant de `lucide-react`. **INTERDICTION** d'intégrer des tracés SVG écrits en dur.
*   **Animations discrètes :** Les transitions (ouvertures de modals, changements d'onglets) doivent être fluides et rapides (utiliser `motion` de `motion/react` de manière subtile).
*   **Accessibilité (A11y) :** Les contrastes de couleurs doivent être élevés. Tous les éléments interactifs doivent avoir des focus visibles et être utilisables via navigation tactile (cibles tactiles d'au moins 44px sur mobile).
*   **Responsive & Dark Mode :** L'interface doit s'adapter parfaitement à tous les écrans (du petit smartphone à la tablette) et être compatible avec un thème sombre (Dark Mode) si celui-ci est activé.

---

## 12. Multi-SaaS & Isolation Métier

Pour garantir l'étanchéité et l'évolutivité de la plateforme :
*   **Structure des répertoires :**
    *   Les fonctionnalités propres à un métier spécifique doivent être placées dans leur sous-dossier respectif (ex: `src/apps/tailleur/`, `src/apps/ecole/`, `src/apps/chantier/`).
    *   Les composants et services réutilisables transversaux doivent aller exclusivement dans `src/shared/` ou `src/components/`.
*   **Isolation stricte :** Aucun module métier (ex: `ecole`) ne doit importer de fichier ou de type provenant d'un autre module métier (ex: `tailleur`).
*   **Activation dynamique :** L'interface utilisateur doit s'adapter dynamiquement au type de SaaS souscrit par l'utilisateur connecté. **INTERDICTON** d'afficher des menus, champs ou statistiques de couture à un artisan du bâtiment.

---

## 13. Sécurité

*   **Validation à double niveau :** Toutes les données utilisateur doivent être validées côté client (pour l'expérience utilisateur) ET côté serveur ou via les règles de sécurité Firestore (pour la sécurité).
*   **Sanitisation :** Protection stricte contre les injections de scripts (XSS) et de requêtes non autorisées.
*   **Sécurité des clés d'API (CRITIQUE) :**
    *   Il est **STRICTEMENT INTERDIT** d'exposer des clés d'API privées ou des secrets côté client.
    *   **INTERDICTION :** Ne préfixez jamais avec `VITE_` les clés privées (ex: `PAYDUNYA_PRIVATE_KEY` ou `STRIPE_SECRET_KEY`).
    *   Toutes les opérations sensibles nécessitant ces secrets doivent s'exécuter exclusivement côté serveur via des routes d'API sécurisées.
*   **Contrôle des rôles (RBAC) :** Vérification systématique des rôles et des autorisations avant d'afficher des données d'administration ou de permettre des écritures critiques.

---

## 14. Intégration des Paiements (Stripe & PayDunya)

*   **Idempotence :** S'assurer qu'une requête de paiement envoyée deux fois par erreur ne déclenche qu'une seule transaction réelle (génération d'UUID d'idempotence).
*   **Journalisation & Historique :** Enregistrer chaque étape du cycle de paiement (initiation, validation, échec, succès) dans un historique d'audit local et cloud.
*   **Système de Secours (Fallback) & Clarté :** En cas d'échec d'une transaction, l'interface doit fournir un message clair, poli et rédigé **en français** expliquant la cause de l'erreur et proposant une solution immédiate de secours (ex: essayer un autre moyen de paiement ou payer en espèces).
*   **Webhooks sécurisés :** Utiliser des webhooks pour écouter les événements de paiement Stripe ou PayDunya et valider systématiquement la signature cryptographique des requêtes reçues du prestataire.

---

## 15. Journalisation (Logs)

*   **Logs structurés :** Les messages de console ou de débogage doivent être structurés avec des niveaux clairs (info, warn, error).
*   **Désactivables :** Tous les logs de niveau "verbose" ou "debug" doivent être automatiquement désactivés en environnement de production.
*   **Respect de la vie privée :** **INTERDICTION** d'inclure des données personnelles sensibles (mots de passe, numéros de carte bancaire, secrets) dans les logs.

---

## 16. Gestion des Erreurs

*   ❌ **INTERDICTION** de faire des blocs `catch` silencieux (`catch(e) {}` vide).
*   **Pratiques obligatoires en cas d'erreur :**
    1.  Logger l'erreur de manière structurée et sécurisée.
    2.  Informer l'utilisateur final par un message convivial et compréhensible (sans jargon technique ni stacktrace brute).
    3.  Proposer une action de résolution immédiate (ex: bouton "Réessayer", "Retour à l'accueil").
    4.  Assurer la continuité du service en cas de panne d'un module non critique.

---

## 17. Optimisation Avancée de Firebase

*   **Pagination systématique :** Obligatoire pour toutes les listes de données historiques (factures, commandes passées).
*   **Batches & Transactions :** Regrouper les écritures multiples interdépendantes dans des objets `writeBatch()` ou des transactions pour garantir l'atomicité et économiser des appels réseau.
*   **Dénormalisation intelligente :** Utiliser des compteurs ou des résumés d'agrégation dénormalisés (ex: stocker le `total_commandes` sur le document client) pour éviter de devoir lire tous les documents d'une sous-collection pour obtenir un simple compte.

---

## 18. Testabilité & Pureté du Code

*   Les fonctions de calcul métier (ex: calcul de tva, prix de vente, durées) doivent être écrites sous forme de **fonctions pures** (entrées identiques ➔ sorties identiques, sans effets secondaires) afin d'être facilement testables de façon unitaire et isolée.

---

## 19. Documentation Intégrée

*   Chaque nouveau module complexe, service ou hook partagé doit être accompagné d'une brève section de documentation au sommet du fichier ou dans un fichier `README.md` dédié, décrivant : son rôle, ses entrées, ses sorties, un exemple d'usage type, et ses limitations.

---

## 20. Processus de Modification IA / Développeur

Avant d'apporter la moindre modification au code, l'IA ou le développeur doit **OBLIGATOIREMENT** effectuer les étapes suivantes :
1.  **Lecture Systématique :** Lire l'intégralité du contenu des fichiers cibles avant d'écrire ou de modifier du code. Ne jamais assumer le contenu.
2.  **Modifications Chirurgicales :** Préférer les éditions partielles ligne par ligne ou l'outil d'édition ciblée pour ne modifier que le strict nécessaire, plutôt que de réécrire des fichiers entiers (ce qui introduit des risques d'oublis ou d'erreurs de tokens).
3.  **Conservation de l'Existant :** Préserver scrupuleusement la logique métier, l'architecture globale et les comportements actuels de l'application qui fonctionnent déjà.
4.  **Zéro Duplication :** Toujours vérifier si un composant, utilitaire ou hook similaire existe déjà dans le projet pour le réutiliser plutôt que de le réimplémenter.

---

## 21. Checklist Obligatoire Avant de Valider un Turn / Commit

Avant de finaliser une modification, assurez-vous de valider chacun de ces points :
*   [ ] Aucun quota Firestore inutile ou écriture automatique non déclenchée par l'humain.
*   [ ] Aucune possibilité de boucle de rendu infinie (useEffect surveillé sur des primitives uniquement).
*   [ ] Aucun listener orphelin (désabonnement systématique).
*   [ ] Fonctionnalités "Offline First" préservées et fonctionnelles via Dexie.
*   [ ] Interfaces et types TypeScript complets déclarés dans `src/types.ts`.
*   [ ] Interface responsive, testée pour l'ergonomie mobile-first (boutons d'au moins 44px, etc.).
*   [ ] Respect absolu de la cohérence visuelle et du design system de la plateforme.
*   [ ] Aucune clé d'API privée ni secret exposé côté client (pas de `VITE_` pour les secrets).
*   [ ] Logs et messages d'erreurs d'échecs (notamment de paiement) clairs et rédigés en français.
*   [ ] Code modulaire divisé en composants de moins de 150 lignes et fonctions de moins de 40 lignes.
*   [ ] Absence de tout avertissement TypeScript ou ESLint critique à la compilation.
