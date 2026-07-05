# AI Memory

Ce document est dédié à la collaboration avec les agents IA d'Acom Technologie. Il offre un référentiel stable et partagé sur les habitudes de développement et les préférences du projet.

## Préférences du Projet
- **Langue** : Les commentaires de code, les noms de commits et les explications doivent être majoritairement en français, bien que le code (variables, fonctions) soit en anglais technique.
- **Style de code** : Fonctionnel, composable, typage fort et strict. Pas de classes sauf nécessité absolue (ex: certaines erreurs custom ou Repositories si justifié).

## Erreurs Récurrentes à Éviter
- **Accès direct Firestore depuis UI** : Ne jamais écrire de `getDocs()` ou `onSnapshot()` dans un composant React.
- **Boucles infinies `useEffect`** : Ne pas écrire de données déclenchant un re-render sans condition d'arrêt stricte.
- **Oubli du `merchantId`** : Toute création de document nécessite le `merchantId` en cours.

## Conventions de Réponse des Agents
- Toujours commencer par le **Rituel de Démarrage** : comprendre, lire le contexte, vérifier les impacts, proposer une solution, évaluer les risques.
- Rédiger des rapports d'audit structurés (Analyse, Conformité, Risques, Recommandations, Plan d'Action, Validation).
- Privilégier les réponses concises et professionnelles. Ne pas écrire de code non demandé si une simple analyse (Audit) est requise.
