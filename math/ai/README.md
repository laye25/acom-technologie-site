# Mathematical Specification - AI Lab
**Maturité (Règle 52) :** Designed  

## 1. Algorithmes Majeurs & Formulations

### A. Réseau de Neurones Graphiques pour l'Ordre de Broderie (Graph Neural Network - GNN)
L'ordonnancement optimal de broderie de motifs complexes est formulé comme un problème d'apprentissage par renforcement sur graphe de relations spatiales :
- Les nœuds représentent les objets géométriques $O_i$ dotés de leurs caractéristiques (type de point, couleur de fil, aire).
- Les arêtes représentent l'adjacence ou le recouvrement spatial de ces objets.

Le modèle prédit le score d'intégrité esthétique d'un ordonnancement proposé $\pi$ :

$$\text{Score}(\pi) = \sum_{k=1}^{N-1} \mathbf{W}^{\top} \cdot \mathbf{h}_{\pi(k)} + \mathbf{b}$$

où $\mathbf{h}_i$ correspond au vecteur d'état sémantique de l'objet extrait par le réseau de neurones par graphe.

### B. Régression de Compensation d'Étirement (Pull compensation Regression)
La valeur de compensation d'étirage (Pull Compensation) est estimée par un modèle prédictif entraîné sur le Golden Dataset et le savoir-faire des maîtres tailleurs :

$$\text{PullCompensation} = f(\text{FabricType}, \text{ThreadTension}, \text{StitchDensity}, \text{RibbonWidth})$$

---

## 2. Limites de Robustesse & Cas d'Échec Documentés
- **Généralisation hors domaine** : Les modèles de régression peuvent extrapoler des valeurs aberrantes de compensation (ex : compensation négative ou excessive $> 1.0\text{ mm}$) sur des tissus extrêmement élastiques ou inconnus. L'ATCP encapsule l'inférence IA dans une barrière de garde déterministe (Constraint Wrapper) assurant que :

$$\text{PullCompensation} \in [0.0\text{ mm}, 0.6\text{ mm}]$$
