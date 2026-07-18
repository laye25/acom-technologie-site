# Acom Embroidery Engine (AEE) - Journal de Recherche Scientifique (Research Log)
**Maturité (Règle 52) :** Designed  

Le **Research Log** est le registre académique d'Acom Technologie. Il documente de manière rigoureuse les recherches mathématiques, les formulations géométriques, ainsi que l'ensemble des expérimentations (réussies ou abandonnées) menées sur l'Acom Embroidery Engine (AEE). 

---

## 1. Structure d'une Fiche de Recherche (Research Template)

Chaque recherche ou expérimentation consignée doit respecter le formatage strict suivant pour garantir la transmission du savoir-faire au fil des générations d'ingénieurs :

- **Identifiant** : `RES-XXX` (ex. `RES-001`)
- **Titre** : Nom scientifique de la recherche.
- **Formulation Mathématique** : Équations, modèles géométriques ou physiques.
- **Expérience** : Protocole expérimental et résultats observés.
- **Statut** : `Active` / `Concluded (Success)` / `Abandoned (Failed)`
- **Pourquoi (en cas d'échec)** : Analyse approfondie des causes physiques ou géométriques de l'abandon.

---

## 2. Registre des Recherches Actives & Conclues

### RES-001 : Squelettisation par Triangulation de Delaunay
- **Objectif** : Numérisation Satin automatique de formes libres.
- **Formulation** : Exploitation du squelette géométrique par triangulation contrainte de Delaunay (CDT).
- **Statut** : `Concluded (Success)` -> Intégré dans l'ADR-007 (Acom Ribbon).

### RES-002 : Modélisation Physique Mass-Spring du Tissu
- **Objectif** : Prédire le froissement et le rétrécissement du tissu sous tension.
- **Formulation** : Réseau de particules liées par des ressorts de traction et de cisaillement obéissant à la loi de Hooke :
  
$$\mathbf{F}_{ij} = -k_s \left( \|\mathbf{x}_i - \mathbf{x}_j\| - L_0 \right) \frac{\mathbf{x}_i - \mathbf{x}_j}{\|\mathbf{x}_i - \mathbf{x}_j\|}$$

- **Statut** : `Active` -> Consolidation des profils matières (Acom Phys).

---

## 3. Registre des Expérimentations Abandonnées (Failed Experiments)

Conserver l'historique des échecs est capital pour éviter de répéter les mêmes erreurs techniques à l'avenir.

### RES-003 : Tracé de Streamlines par Intégration brute d'Euler
- **Date** : 2026-04-10
- **Objectif** : Générer des lignes de Tatami courbes le long du champ de vecteurs.
- **Méthode** : Intégration de premier ordre d'Euler :
  
$$\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta s \cdot \mathbf{V}(\mathbf{x}_k)$$

- **Statut** : `Abandoned (Failed)`
- **Analyse de l'Échec** : L'intégration d'Euler accumule une erreur de dérive géométrique trop importante dans les zones de forte courbure. Cela provoquait des écarts de lignes, des croisements de points et des brisures textiles inacceptables. L'expérience a démontré la nécessité absolue de passer à une méthode d'intégration de Runge-Kutta d'ordre 2 (RK2) ou ordre 4 (RK4).

### RES-004 : Optimisation TSP par Force Brute (Exact Solver)
- **Date** : 2026-05-18
- **Objectif** : Trouver l'ordre absolu de broderie le plus court.
- **Méthode** : Résolution exacte par l'algorithme d'Held-Karp (programmation dynamique en $\mathcal{O}(n^2 2^n)$).
- **Statut** : `Abandoned (Failed)`
- **Analyse de l'Échec** : L'algorithme exact provoque un effondrement complet des performances du navigateur (blocage du thread d'UI) dès que le motif contient plus de 15 objets de broderie. Pour une utilisation interactive dans l'iFrame, l'utilisation de méta-heuristiques rapides (Nearest-Neighbor combiné avec des passes locales de 2-Opt) s'est avérée incontournable pour rester sous la barre critique des $100\text{ ms}$.
