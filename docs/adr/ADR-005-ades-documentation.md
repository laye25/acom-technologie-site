# ADR-005 : Restructuration AI-Driven Engineering System (ADES)

**Date :** 2026-07-03  
**Auteur :** ACOM Orchestrator  
**Statut :** Accepté  

## Contexte
Le fichier `AGENTS.md` dépassait les 500 lignes, regroupant la constitution, l'architecture, les processus de l'audit center et des éléments métier. Cette surcharge cognitive limitait l'efficacité des agents IA qui perdaient le contexte ou omettaient certaines règles lors de leurs interventions.

## Décision
Adopter une hiérarchie documentaire stricte en 5 niveaux (Level 0 à Level 5) :
- LEVEL 0 : `CONSTITUTION.md` (Règles immuables)
- LEVEL 1 : `AGENTS.md` (Règles de dev. et rôles, limité à < 300 lignes)
- LEVEL 2 : `/docs/knowledge-base/` (Standards techniques)
- LEVEL 3 : `/docs/business/` (Règles métiers SaaS)
- LEVEL 4 : `/docs/technical/` (Infrastructure & API)
- LEVEL 5 : `ProjectMemory.md` et `/docs/adr/` (Historique des décisions)
- Création de `AIMemory.md` pour l'historique et le profil des agents.

## Conséquences
- **Avantages** : 
  - Les agents lisent uniquement les documents nécessaires à leur mission, optimisant le contexte des LLM.
  - La documentation est plus facilement maintenable et extensible pour de futurs SaaS.
- **Inconvénients** : 
  - Les agents doivent naviguer entre plusieurs fichiers, ce qui nécessite un bon respect du "Rituel de Démarrage".

## Notes Complémentaires
Chaque agent devra consulter la Knowledge Base et la Constitution en plus de son propre prompt stocké dans `/docs/prompts/`.
