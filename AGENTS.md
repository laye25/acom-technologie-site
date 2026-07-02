# Charte de Gouvernance Technique & Conventions d'Ingénierie — Acom Technologie

Ce document définit les principes d'architecture, de gouvernance, de sécurité et d'ingénierie qui guident le développement de l'écosystème de produits **Acom Technologie**. Il s'adresse aussi bien aux développeurs humains qu'aux agents d'Intelligence Artificielle (IA) intervenant sur le projet.

---

## 0. Mission du Projet

### Vision
**Acom Technologie** est une plateforme ERP Multi-SaaS modulaire et intégrée destinée aux PME, artisans, commerçants et entreprises africaines. 

Chaque module métier (**Acom Gestion**, **Acom Studio**, **AcomZone**, **POS**, **Pressing**, **École**, **Santé**, **Transport**, etc.) doit pouvoir évoluer indépendamment tout en partageant une architecture technique commune, robuste et standardisée.

L'objectif ultime est de construire une plateforme :
*   **Performante** et optimisée pour des réseaux à faible débit.
*   **Évolutive** pour intégrer facilement de nouveaux modules métiers.
*   **Sécurisée** avec un cloisonnement strict multi-tenant.
*   **Offline-First** pour garantir la continuité opérationnelle sur le terrain.
*   **Cloud-Native** et compatible multi-plateforme (Web, Desktop et Mobile via Electron/Capacitor).
*   **Optimisée pour les coûts d'infrastructure**, en minimisant drastiquement les requêtes serveurs et lectures Firestore.

> 💡 *Toute décision technique doit privilégier la pérennité et la cohérence de l'écosystème global plutôt que la facilité d'implémentation à court terme.*

---

## 1. Principes Fondamentaux (Non négociables)

Avant toute implémentation ou modification du code, les principes suivants doivent être respectés de manière systématique :

1.  **Offline-First par défaut :** L'application doit fonctionner de manière fluide même en l'absence de réseau internet. Les opérations critiques ne doivent jamais être bloquantes.
2.  **Mobile-First & Desktop-Ready :** L'interface doit être réactive, fluide sur mobile (zones tactiles d'au moins 44px) et optimisée pour l'utilisation sur poste de travail de bureau.
3.  **Performance-First :** Pas de recalculs inutiles dans le cycle de rendu React, limitation stricte de la taille des bundles et gestion proactive de la mémoire.
4.  **Security-First :** Cloisonnement étanche des locataires (multi-tenant) et validation systématique de toutes les entrées utilisateur.
5.  **Multi-Tenant by Design :** Toutes les données et actions doivent être cloisonnées à l'échelle du commerçant (`merchantId`).
6.  **Type Safety (TypeScript) :** Zéro tolérance pour l'usage abusif du type `any`. Le typage doit être explicite, précis et exhaustif.
7.  **Clean Architecture & Modularité :** Séparation stricte des responsabilités (UI vs Logique métier vs Accès aux données).
8.  **Réutilisabilité & Évolutivité :** Concevoir des composants et services génériques et paramétrables pour éviter le code dupliqué.
9.  **Faible coût d'exploitation Cloud :** Optimisation drastique des quotas de lecture et d'écriture des bases de données.

En cas de conflit entre plusieurs approches techniques, privilégiez toujours la solution qui :
*   **Réduit les coûts de base de données (lectures/écritures Firestore) ;**
*   **Améliore les performances de rendu ou de synchronisation ;**
*   **Facilite la maintenance et la lisibilité du code ;**
*   **Respecte et s'intègre harmonieusement dans l'architecture existante.**

---

## 2. Gouvernance de l'Architecture

Pour garantir la découplabilité, la testabilité et la performance hors ligne, **aucun composant React ne doit communiquer directement avec Firestore**.

Le flux d'exécution et de données suit obligatoirement ce chemin unidirectionnel :

```
[ Vue / Interface Utilisateur ]
            ↓
    [ Composant React ]
            ↓
     [ Hook Spécialisé ]
            ↓
  [ Service Métier (Sync/Business) ]
            ↓
   [ Repository (Repository Pattern) ]
            ↓
[ Dexie / Store Local (Offline DB) ] <─── Synchronisation (Delta-Sync) ───> [ Cloud Firestore ]
```

*Toute dérogation à ce flux architectural (par exemple, un appel direct à Firestore depuis un composant) devra être explicitement documentée et justifiée dans le code par un commentaire détaillé.*

---

## 3. Architecture Multi-SaaS

L'écosystème **Acom Technologie** est conçu comme une fédération de micro-applications métiers (SaaS) isolées. Le projet doit être structuré de manière à maintenir cette isolation :

*   Chaque SaaS constitue un **domaine métier autonome** (ex: *Acom Gestion, Acom Studio, AcomZone, Pressing, Transport, École, Médical, Chantier, Restaurant, RH, etc.*).
*   Les éléments génériques transversaux, styles globaux, configurations et utilitaires système doivent être logés exclusivement dans des dossiers dédiés : `/src/shared/`, `/src/core/` ou `/src/common/`.
*   **Règle d'or :** Il est **strictement interdit** qu'un composant ou un service spécifique à un module métier (ex: `AcomZone`) importe directement un composant ou un état appartenant à un autre module métier (ex: `Pressing`). Les interactions inter-modules doivent passer par des interfaces communes ou des bus d'événements partagés.

---

## 4. Multi-Tenant (Sécurité & Cloisonnement)

Le modèle multi-tenant garantit qu'aucun commerçant ne peut voir, modifier ou corrompre les données d'un autre commerçant.

1.  **Marquage obligatoire :** Tout document stocké dans Firestore ou dans Dexie (base locale) lié aux opérations d'un commerçant doit impérativement comporter les attributs d'identification suivants :
    ```typescript
    interface TenantDocument {
      merchantId: string;         // Identifiant unique du commerçant / locataire
      organizationId?: string;     // Optionnel : Pour les structures multi-établissements
      createdBy: string;          // UID de l'utilisateur ayant créé le document
      createdAt: Date | any;      // Date de création
      updatedAt: Date | any;      // Date de dernière mise à jour
      schemaVersion: number;      // Version de structure pour futures migrations
    }
    ```
2.  **Filtrage à la source :** Toutes les requêtes de lecture Firestore et Dexie doivent inclure explicitement la clause de filtrage sur le locataire actif : `where('merchantId', '==', currentMerchantId)`.
3.  **Interdiction de filtrage client exclusif :** Il est strictement interdit de récupérer l'ensemble d'une collection pour filtrer les documents par `merchantId` côté client. Le filtrage doit être opéré au niveau de la requête de base de données (Firestore / Dexie) pour éviter des fuites de données et une consommation inutile de bande passante.

---

## 5. Versionnement des Données

Pour anticiper les évolutions de schémas de données sans interrompre les services des clients en production :
*   Toute structure de document importante (commandes, factures, profils commerçants) doit comporter un attribut `schemaVersion` (ex: `schemaVersion: 1`).
*   Lors de modifications majeures de la structure d'un modèle, un script de migration doit être intégré au niveau du service ou de l'initialisation du Repository pour convertir à la volée les anciennes structures de documents locaux et distants.

---

## 6. Compatibilité Web • Desktop • Mobile

L'application doit être conçue pour s'exécuter de façon transparente sur de multiples environnements d'exécution :
*   **Navigateurs Web** standards.
*   **Wrappers Desktop** (comme Electron ou des modules de bureau natifs).
*   **Runtimes Hybrides Mobiles** (comme Capacitor ou Cordova).

**Précautions techniques d'intégration :**
*   Avant d'utiliser une API spécifique au navigateur (ex: `window.open`, `localStorage`, `Notification`, `Navigator.share`), vérifiez toujours son support et enveloppez-la dans une vérification de sécurité (ex: `if (typeof window !== 'undefined' && 'Notification' in window)`).
*   Fournissez toujours une alternative (fallback) dégradée mais fonctionnelle si l'API n'est pas disponible (ex: remplacer l'ouverture d'un nouvel onglet par une navigation interne ou un modal contextuel).

---

## 7. Offline-First & Synchronisation Résiliente

La perte ou l'instabilité de la connexion internet ne doit jamais altérer les fonctionnalités critiques de terrain (encaissement POS, prise de commande, émission de devis ou facture).

### Cycle de Vie des Données (Offline-to-Cloud)
L'écriture et la synchronisation des données doivent obligatoirement suivre ce cycle :
1.  **Écriture Locale :** Les actions de l'utilisateur sont immédiatement enregistrées dans la base de données locale (Dexie/IndexedDB). La vue est mise à jour instantanément à partir de l'état local.
2.  **Mise en file d'attente (Sync Queue) :** Si la connexion est instable ou absente, l'opération est poussée dans une file d'attente locale de synchronisation (`syncQueue`).
3.  **Synchronisation en tâche de fond :** Dès que le réseau est détecté comme stable, les opérations en attente sont rejouées dans Firestore de manière transactionnelle.
4.  **Delta-Sync Obligatoire (Firestore-to-Local) :** La récupération des mises à jour distantes se fait uniquement par différentiel (Delta).
    *   Ne téléchargez pas toute la collection à chaque chargement d'écran.
    *   Stockez la date du dernier appel réussi dans le stockage persistant (ex: `last_sync_factures`).
    *   Effectuez la requête de synchronisation avec une contrainte temporelle : `where('updated_at', '>=', lastSyncDate)`.
    *   Exemple de référence : Étudiez les méthodes `syncOrders` ou `syncSales` dans `src/services/syncService.ts`.

---

## 8. Optimisation Firestore (Prévention d'épuisement de quotas)

L'application a précédemment souffert d'épuisement de quotas Firestore dus à des boucles de synchronisation infinies ou des requêtes non optimisées. Les règles ci-dessous sont **strictement obligatoires** :

### Pratiques Interdites ❌
*   **Interdiction d'appels `getDocs()` ou `onSnapshot()` directs dans le corps des composants React** ou dans des `useEffect` sans nettoyage adéquat.
*   **Interdiction de déclencher des écritures automatiques (`updateDoc`, `setDoc`) dans des `useEffect`** qui écoutent des données issues de ces mêmes documents (risque de boucle infinie). Toute écriture automatique doit posséder un verrou (lock/flag) ou être initiée exclusivement par une interaction humaine directe.
*   **Interdiction d'imbriquer des requêtes de base de données** dans des boucles (ex: récupérer une liste puis faire un `getDoc` individuel pour chaque élément). Utilisez des jointures en mémoire ou des index partagés.
*   **Interdiction d'écouter en temps réel des collections entières** sans filtres stricts de pagination, de statut ou de limitation de taille.

### Pratiques Privilégiées ✅
*   Utilisez exclusivement les méthodes centralisées de `syncService.ts` couplées à IndexedDB via Dexie pour la lecture et l'affichage des listes.
*   Pour les besoins réels en temps réel dynamique, utilisez le moteur d'abonnement centralisé `subscription.engine.ts` via les Repositories. Ce moteur gère un comptage de références et détruit automatiquement les écouteurs d'événements orphelins (listeners) lors du démontage des composants, évitant ainsi les fuites de mémoire et la surconsommation invisible.
*   Utilisez des écritures groupées (**Batches**) ou des **Transactions** pour les opérations interdépendantes complexes afin de garantir l'atomicité et réduire les coûts.

---

## 9. Sécurité et Confidentialité

Toute donnée provenant du client (navigateur, terminal mobile) doit être considérée comme potentiellement malveillante ou corrompue.

1.  **Double Validation :** Validez systématiquement la structure, le format et l'intégrité des données côté client (pour l'expérience utilisateur) ET côté serveur ou via les règles de sécurité Firestore (`firestore.rules`).
2.  **Contrôle d'accès et Permissions :** Tout accès aux ressources doit être validé en fonction du rôle de l'utilisateur (Administrateur, Manager, Employé, Partenaire).
3.  **Clés Privées et Secrets :** Aucune clé d'API privée (Gemini, Stripe, Twilio, Firebase Admin SDK) ou secret de configuration ne doit être exposé côté client (ne jamais préfixer une clé secrète par `VITE_` dans le cadre de Vite). Utilisez toujours des routes API serveurs (`/api/*`) comme proxy d'accès sécurisé pour interagir avec les services tiers.

---

## 10. Qualité de Code et Normes TypeScript

*   **Zéro `any` :** L'usage du type `any` est interdit sauf cas de force majeure dument documenté. Privilégiez les génériques, les unions de types, `unknown` ou des interfaces bien définies.
*   **Zéro logique métier dans les composants :** Les composants React doivent être purement déclaratifs (affichage de l'état, gestion des événements de l'interface, style Tailwind). Toute la logique de calcul, de validation de données et d'appel réseau doit être externalisée dans des services ou des custom hooks.
*   **Éviter les fichiers monolithiques :** Les fichiers ne doivent pas dépasser **1500 lignes**. Si un composant ou un service devient trop volumineux, il doit être immédiatement découpé en sous-composants ou en modules utilitaires plus petits sous `/src/components/`, `/src/types/` ou `/src/hooks/`.
*   **Nettoyage du code mort :** Ne laissez pas de code commenté ou de fichiers inutilisés encombrer la base de code.

---

## 11. Performance React & Gestion du Rendu

*   **Stabilisation des dépendances :** Ne mettez jamais d'objets, de tableaux ou de fonctions directement dans les tableaux de dépendances de vos `useEffect` ou `useMemo` à moins qu'ils ne soient mémoïsés ou déclarés en dehors du cycle de vie du composant. Privilégiez les valeurs primitives (string, number, boolean) pour assurer la stabilité.
*   **Optimisation de rendu :** Utilisez intelligemment `useMemo` pour les calculs lourds ou le filtrage de listes, et `useCallback` pour les gestionnaires d'événements complexes transmis à des composants enfants optimisés.
*   **Chargement paresseux (Lazy Loading) :** Utilisez `React.lazy` et `Suspense` pour charger à la demande les pages ou les modules lourds de l'application (comme les éditeurs graphiques ou les cartes interactives) afin d'accélérer le temps de chargement initial.

---

## 12. Gestion des Erreurs & Résilience

*   Enveloppez systématiquement les opérations asynchrones (promesses, accès IndexedDB, requêtes réseau) dans des blocs `try/catch`.
*   Toute erreur capturée doit être journalisée de manière descriptive en console (et via un service de monitoring en production).
*   **Expérience utilisateur :** Proposez toujours un message d'erreur clair, rédigé dans une langue compréhensible par l'utilisateur (français/wolof), et suggérez une solution ou une action de repli (ex: *"Vérifier votre connexion"*, *"Réessayer plus tard"*, *"Sauvegarde locale active"*). Ne bloquez jamais l'interface utilisateur avec un écran blanc ou un chargement infini.

---

## 13. Observabilité et Logs Structurés

Pour faciliter le diagnostic des dysfonctionnements en production ou en mode déconnecté :
*   Mettez en place ou alimentez un système de logs structurés au sein de vos services clés.
*   Chaque événement critique doit générer une trace descriptive contenant le contexte utile :
    *   Tentative de synchronisation locale/distante et statut (succès/échec/conflit).
    *   Mouvements financiers, initiations de paiements et validations de factures.
    *   Tentatives d'authentification et changements de rôles/permissions.
    *   Erreurs matérielles d'impression ou d'intégration d'API.

---

## 14. Accessibilité (a11y) & Ergonomie

Toute interface doit être accessible et utilisable par tous les profils d'utilisateurs :
*   **Contrastes :** Respectez des contrastes de couleurs suffisants entre le texte et l'arrière-plan pour assurer une lisibilité optimale sur des écrans de smartphones de faible qualité ou en extérieur ensoleillé.
*   **Navigation :** Assurez la compatibilité avec la navigation au clavier (pour les versions Desktop d'ERP où la saisie rapide est privilégiée).
*   **Tactile :** Sur mobile, les éléments interactifs (boutons, liens, éléments de liste) doivent posséder une taille de cible tactile d'au moins **44x44 pixels** avec un espacement suffisant pour éviter les clics accidentels.

---

## 15. Évolutivité Globale (Internationalisation & Flexibilité)

L'écosystème **Acom Technologie** se déploie dans plusieurs régions et pays :
*   **Pas de valeurs codées en dur :** Ne codez jamais en dur des textes utilisateur (utilisez le système de traduction existant ou la balise `<Translate>`), des devises (ex: `FCFA`, `€`), des taux de taxes ou des indicatifs téléphoniques dans les composants.
*   Ces variables doivent être récupérées dynamiquement depuis le profil du commerçant (`merchantId`) ou la configuration locale globale de l'ERP.

---

## 16. Exigences de Documentation

Chaque fois qu'un nouveau module métier ou un service complexe est introduit, il doit être accompagné d'une documentation synthétique décrivant :
1.  **L'objectif fonctionnel :** Qu'est-ce que ce module réalise pour l'utilisateur ?
2.  **L'architecture technique :** Quels sont ses composants, hooks, services et tables Dexie associés ?
3.  **Les dépendances externes :** De quelles librairies tierces dépend-il ?
4.  **Le schéma de données :** Quels sont les formats des documents Firestore ou Dexie ?
5.  **Les limitations ou contraintes connues** (ex: nécessité de coordonnées GPS, dépendance réseau spécifique, etc.).

---

## 17. Intelligence Artificielle (IA) - Règles d'Intervention

Tout agent d'Intelligence Artificielle (comme Gemini, Claude ou Antigravity) travaillant sur le projet **Acom Technologie** est tenu de respecter scrupuleusement la présente charte. L'IA doit agir comme un **architecte logiciel rigoureux** et non comme un simple générateur de code rapide.

### Consignes de Comportement pour les Agents IA :
1.  **Lecture Préalable Obligatoire :** Avant de modifier ou de créer un fichier, vous devez lire l'intégralité du code et des dépendances associées pour comprendre le contexte existant.
2.  **Respect Strict des Patterns :** Ne réinventez pas la roue. Utilisez les hooks de synchronisation, les repositories et les stores Dexie existants.
3.  **Modifications Chirurgicales et Minimales :** Privilégiez des modifications ciblées plutôt que de réécrire entièrement des fichiers complexes, ce qui risque d'introduire des régressions fonctionnelles invisibles.
4.  **Conservation des Signatures de Code :** Conservez scrupuleusement les signatures de fonctions, les conventions de nommage existantes et les commentaires de code décrivant des règles spécifiques.
5.  **Explications Claires des Impacts :** Expliquez de manière concise et objective chaque modification majeure apportée et signalez les risques potentiels de régression ou d'impact sur les quotas.

---

## 18. Focus Produits Historiques (En pause mais structurants)

### Acom Studio (Impression & Design)
*   **Slogan :** "L'excellence du design et de l'impression. Personnalisez et commandez vos supports physiques avec une qualité irréprochable."
*   **Objectif :** Faciliter la création graphique WYSIWYG et la commande directe d'imprimés de haute qualité.
*   **Univers / Catégories de Référence obligatoires :**
    1.  **Goodies :** Cadeaux d'affaires, stylos, t-shirts, mugs et objets promotionnels personnalisables.
    2.  **Marketing & Publicité :** Flyers, dépliants, affiches, rollups et plaquettes de présentation.
    3.  **Papeterie & Bureautique :** Cartes de visite professionnelles, papier en-tête, enveloppes personnalisées, tampons et blocs-notes.
    4.  **Signalétique :** Enseignes lumineuses, bâches de grand format, panneaux publicitaires, de chantiers et marquages de véhicule.
*   **Persistance Offline :** En mode hors-ligne, les catégories fondamentales de l'univers Studio doivent persister localement via IndexedDB (`StudioAcomDB`) et s'initialiser grâce au fallback statique `INITIAL_CATEGORIES`.

### AcomZone (Carte Interactive)
*   **Slogan :** "La carte interactive de nos partenaires. Découvrez les meilleures boutiques, commerces et services près de chez vous."
*   **Objectif :** Permettre aux utilisateurs de localiser visuellement et géographiquement les partenaires, boutiques, commerces et services de confiance d'Acom Technologie sur une carte dynamique.
*   **Fonctionnalités Clés :**
    *   **Cartographie Interactive :** Outils de géolocalisation et filtres multi-catégories (Boutique, Restauration, Transport, Pressing, etc.) propulsés par l'intégration d'API cartographiques performantes.
    *   **Accès Multicritère :** Consultation fluide des publications, produits et fiches de renseignements des partenaires directement depuis les bulles d'information de la carte ou le volet de recherche latéral.

---

## 19. Checklist de Pré-Validation (À valider avant chaque commit)

Avant de soumettre, pousser ou fusionner une fonctionnalité, l'ingénieur ou l'IA doit valider point par point la checklist suivante :

- [ ] **Architecture :** Le flux Vue → Hook → Service → Repository → Local DB → Firestore est-il respecté ?
- [ ] **TypeScript :** Le typage est-il complet, robuste et sans usage de `any` injustifié ?
- [ ] **Non-régression :** Les fonctionnalités existantes du module et des modules connexes fonctionnent-elles toujours parfaitement ?
- [ ] **Offline :** La fonctionnalité est-elle utilisable sans connexion internet ? Les données sont-elles lues et écrites localement dans Dexie d'abord ?
- [ ] **Multi-Tenant :** Le document contient-il le `merchantId` et les requêtes sont-elles correctement filtrées à la source ?
- [ ] **Optimisation Firestore :** Aucun appel direct ou redondant à `getDocs` ou `onSnapshot` n'est fait dans les composants. Le Delta-Sync est appliqué.
- [ ] **Responsive & Tactile :** L'interface a-t-elle été testée sur des tailles d'écrans mobiles et tactiles (cibles de 44px minimum) ?
- [ ] **Desktop & Wrappers :** Le code utilise-t-il des vérifications sécurisées pour les API Web exclusives afin d'éviter les plantages dans Electron/Capacitor ?
- [ ] **Sécurité :** Les clés privées sont-elles bien gardées côté serveur ?
- [ ] **Performance :** L'usage de `useMemo`, `useCallback` et de dépendances stables dans `useEffect` a-t-il été validé ?
- [ ] **Qualité du code :** Pas de code mort, de commentaires de débogage inutiles ou de duplication massive.
- [ ] **Compilation & Linting :** Les commandes de build et de lint s'exécutent-elles sans aucune erreur ni avertissement ?

---

## 20. Principe d'Autonomie Modulaire (Recommandation Stratégique)

> 🧩 **Toute nouvelle fonctionnalité ou module métier doit être pensée comme une entité autonome, réutilisable et évolutive, pouvant être déplacée, activée, désactivée ou commercialisée indépendamment du reste de la plateforme sans nécessiter de refonte majeure de l'architecture.**

Ce principe fondamental favorise une approche en **écosystème de produits (Multi-Product Ecosystem)** plutôt qu'un monolithe rigide. Pour accompagner l'ambitieuse trajectoire de croissance d'Acom Technologie, chaque brique doit posséder des frontières claires et des interfaces d'intégration normalisées pour être monétisable de manière isolée ou intégrée.
