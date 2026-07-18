# ADR-013 : Base de Connaissances Structurée et Graphe de Connaissances Métier (Embroidery Knowledge Graph)

**Date :** 2026-07-12  
**Auteur :** ACOM Knowledge Engineer & Tailoring Expert  
**Statut :** Accepté  
**Maturité (Règle 52) :** Draft  

## Contexte
La numérisation automatique pilotée par de simples réseaux de neurones ou algorithmes mathématiques manque souvent du "savoir-faire" d'un maître tailleur ou d'un brodeur professionnel (ex. savoir qu'un fil de viscose Madeira Classic 40 glisse mieux sur la soie qu'un fil de polyester, ou qu'une sous-couche en filet est obligatoire sur du tissu polaire). Les règles métier d'ingénierie textile doivent être formalisées et centralisées dans une structure de données sémantique plutôt que d'être codées en dur dans des instructions conditionnelles (`if/else`) éparpillées.

## Décision
Intégrer une **Embroidery Knowledge Base** structurée sous la forme d'un **Knowledge Graph (Graphe de Connaissances Métier)** :
- Modéliser sémantiquement les relations complexes entre les entités clés de la broderie :
  
```
  [Machine] ─── (utilise) ───► [Aiguille (Taille/Type)]
      │
      └─────── (brode sur) ──────► [Substrat (Tissu)] ◄─── (nécessite) ─── [Stabilisateur]
                                       ▲
                                       │ (exige)
                                  [Stratégie (Tatami/Satin/Lattice)]
```

- Permettre au moteur d'IA (Acom PI Engine) de requêter ce graphe de connaissances (via des requêtes de type sémantique ou un moteur d'inférence léger) pour adapter automatiquement la densité, la tension, la sous-couche, et la compensation de retrait en fonction des propriétés croisées de l'aiguille, du fil et du tissu.
- Consigner les correctifs et retours d'expérience utilisateur dans cette base sémantique pour enrichir continuellement l'intelligence métier du système (AI Auto-Learning).

## Conséquences
- **Avantages** :
  - **Décisions intelligentes explicables** : Le moteur n'est plus une boîte noire algorithmique. Il est capable d'expliquer *pourquoi* il a choisi un Tatami à 45° avec une sous-couche grillagée (ex. *"Recommandé pour tissu polaire avec fil Madeira 40"*).
  - **Modularité & Extensibilité** : L'ajout de nouvelles machines, types de fils ou nouveaux tissus se fait par simple enrichissement du graphe de connaissances, sans modifier une seule ligne de code du compilateur géométrique.
- **Inconvénients** :
  - Exige une phase de modélisation et de saisie rigoureuse de l'expertise de maîtres tailleurs professionnels pour constituer le jeu de données initial.
