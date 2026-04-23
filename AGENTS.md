# Conventions du Projet (Project Conventions)

## Firebase Firestore & Gestion des Quotas (CRITIQUE)

L'application a précédemment souffert d'épuisement prématuré des quotas de lecture Firestore (Firebase Quota Exhaustion) dus à des boucles de synchronisation et des interrogations non optimisées. Pour éviter que cela ne se reproduise à l'avenir, vous **DEVEZ IMPÉRATIVEMENT** respecter les règles suivantes lors du développement de nouvelles fonctionnalités :

### 1. Ne Jamais Interroger Firebase "à l'état brut"
N'utilisez jamais `getDocs()`, `onSnapshot()`, ou des boucles de récupération directement dans les composants React. Vous devez passer par l'architecture Repository et les outils locaux déjà en place :

*   **Pour les listes de données :** Utilisez `syncService.ts` couplé à Dexie (`db.ts`) ou utilisez le hook `useFirestoreData.ts` (si la donnée doit être en temps réel dynamique).
*   **Pour le Temps Réel (Real-time) :** Si vous avez besoin d'abonnements en temps réel, vous devez utiliser le fichier `subscription.engine.ts` (via un repository). Ce moteur gère le comptage de références et détruit les "écouteurs" orphelins (orphaned listeners) pour prévenir les fuites de mémoire et la consommation fantôme. Ne créez pas de `onSnapshot` manuel sans gestion stricte du cycle de vie (`unsubscribe` lors de l'`unmount`).

### 2. Le "Delta-Sync" Obligatoire
Lorsque vous ajoutez une nouvelle collection ou table à synchroniser pour une utilisation hors ligne ou en cache, **vous êtes tenus d'utiliser la méthode Delta-Sync**. 
*   **Ne téléchargez pas toute la collection à chaque chargement.**
*   Stockez la date du dernier appel dans le `localStorage` (ex: `last_sync_factures`).
*   Effectuez vos clauses avec la contrainte : `where('updated_at', '>=', lastSyncDate)`. 
*   Exemple de référence : Regardez la méthode `syncOrders` ou `syncSales` dans `src/services/syncService.ts`.

### 3. Protection Contre les Boucles Infinies
*   Les écritures (`updateDoc`, `setDoc`, `addDoc`) ne doivent être déclenchées **QUE par des actions humaines directes** (ex : un clic sur un bouton) ou par une fonction isolée. 
*   Un `useEffect` ne doit **jamais** écouter l'état d'un document Firebase pour y réécrire une donnée automatiquement sans un verrou (lock/flag) strict.

### 4. Suppression des Erreurs Bloquantes
Vérifiez toujours le traitement des objets "Timestamp" provenant de Firestore. Un Timestamp qui cause un plantage sur l'interface de l'administrateur provoque des rechargements automatiques (Refresh) par l'utilisateur, ce qui engendre des rafales de dizaines de milliers de lectures en cascade. Assurez-vous d'utiliser `timestamp.toDate()` ou la fonction associée plutôt que d'essayer d'afficher le `Timestamp` sous forme de primitive.
