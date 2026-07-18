# Mathematical Specification - Physics Lab
**Maturité (Règle 52) :** Designed  

## 1. Algorithmes Majeurs & Formulations

### A. Jumeau Numérique et Réseau de Ressorts-Masses (Mass-Spring System)
Le comportement mécanique d'une étoffe de tissu soumise aux tensions de broderie est simulé par un réseau de ressorts-masses bidimensionnel ou tridimensionnel :
- Chaque nœud $i$ de masse $m_i$ possède une coordonnée spatiale $\mathbf{x}_i(t) \in \mathbb{R}^3$.
- Les forces s'exerçant sur la masse $i$ comprennent les forces de ressort de traction/compression, de cisaillement et de flexion, ainsi que l'amortissement visqueux :

$$\mathbf{F}_i = \sum_{j \in \mathcal{N}(i)} \left[ -k_{ij} (\|\mathbf{x}_i - \mathbf{x}_j\| - L_{ij}) \frac{\mathbf{x}_i - \mathbf{x}_j}{\|\mathbf{x}_i - \mathbf{x}_j\|} - d_{ij} (\mathbf{v}_i - \mathbf{v}_j) \right] + \mathbf{F}_{\text{ext}}$$

où $\mathbf{F}_{\text{ext}}$ intègre la force de tension exercée par le fil de broderie lors du serrage du point :

$$\mathbf{F}_{\text{thread}} = - T_{\text{thread}} \frac{\mathbf{x}_{\text{needle}} - \mathbf{x}_{\text{fabric}}}{\|\mathbf{x}_{\text{needle}} - \mathbf{x}_{\text{fabric}}\|}$$

### B. Compensation de Retrait Active (Active Pull-Compensation)
Le coefficient de compensation active $\Delta w$ appliqué à un point de largeur nominale $w$ est régi par la loi empirique de comportement de l'étoffe et du fil :

$$\Delta w = w \cdot \alpha_{\text{pull}} \left( \frac{T_{\text{tension}}}{E_{\text{fabric}} \cdot D_{\text{stitch}}} \right)$$

où $T_{\text{tension}}$ est la tension du fil, $E_{\text{fabric}}$ le module d'Young du support textile, et $D_{\text{stitch}}$ la densité surfacique de pose.

---

## 2. Limites de Robustesse & Cas d'Échec Documentés
- **Plissement de Tissu (Puckering)** : Une tension trop élevée ou un manque de stabilisateur (non-tissé ou thermocollant) sur des tissus légers provoque des plis irréversibles. La simulation détecte si la déformation de flexion locale dépasse un seuil critique $\theta_{\text{flex}} > 15^\circ$, déclenchant une alerte de réduction automatique de tension ou de densité.
