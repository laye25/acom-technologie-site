# Algorithmic Specification: Fabric Displacement and Needle Physics
**Maturité (Règle 52) :** Designed  

This document specifies the physical and mathematical model of the **Fabric Physics Simulation and Compensation Engine** (Acom Phys) inside the Acom Embroidery Engine (AEE).

---

## 1. Physical Assumptions

When the needle pulls a thread lock tight:
1. The fabric is compressed along the stitch direction (Pull Effect).
2. The fabric bulges or stretches outwards perpendicular to the stitch direction (Push Effect).
3. The displacement field is localized, decaying exponentially with distance.

---

## 2. The Local Displacement Field Equation

Let $\mathbf{s} = (\mathbf{x}_s, \mathbf{x}_e)$ be a stitch vector representing a needle penetration from start $\mathbf{x}_s$ to end $\mathbf{x}_e$. 
Let $\mathbf{u} = \frac{\mathbf{x}_e - \mathbf{x}_s}{\|\mathbf{x}_e - \mathbf{x}_s\|}$ be its unit direction vector, and $\mathbf{n} = (-u_y, u_x)$ its normal vector.

The displacement field $\mathbf{D}(\mathbf{x})$ at any spatial point $\mathbf{x} = (x, y)$ in the fabric is modelled as a continuous integral over all active stitches:

$$\mathbf{D}(\mathbf{x}) = \sum_{i \in \text{stitches}} \left( -k_{\text{pull}} \cdot e^{-\lambda_1 d_i(\mathbf{x})^2} \cdot \mathbf{u}_i + k_{\text{push}} \cdot e^{-\lambda_2 d_i(\mathbf{x})^2} \cdot \mathbf{n}_i \right)$$

Where:
- $d_i(\mathbf{x})$ is the perpendicular distance from point $\mathbf{x}$ to the stitch line $i$.
- $k_{\text{pull}}, k_{\text{push}}$ are material-specific coefficients proportional to the substrate's stretch coefficient $k_s$.
- $\lambda_1, \lambda_2$ are spatial decay rates reflecting the tension distribution inside the embroidery hoop.

---

## 3. Pre-Compensation Numerical Solver

To ensure the final physical embroidery matches the target boundary $\Omega_{\text{target}}$, the engine must solve for the initial digital boundary $\Omega_{\text{digital}}$ such that:

$$\Omega_{\text{digital}} + \mathbf{D}(\Omega_{\text{digital}}) = \Omega_{\text{target}}$$

This is solved numerically on the polygon vertices using a fast **Newton-Raphson relaxation**:

$$\mathbf{x}_{k+1} = \mathbf{x}_k - \mathbf{J}^{-1} \left( \mathbf{x}_k + \mathbf{D}(\mathbf{x}_k) - \mathbf{x}_{\text{target}} \right)$$

Where $\mathbf{J}$ is the Jacobian matrix of the deformation field:

$$\mathbf{J}(\mathbf{x}) = \mathbf{I} + \nabla \mathbf{D}(\mathbf{x})$$

For performance optimization in browser runtimes, this is simplified to a decoupled coordinate-wise shift along normal and tangent axes:

$$\mathbf{x}_{\text{compensated}} = \mathbf{x}_{\text{original}} + \delta_{\text{pull}} \cdot \mathbf{n}_{\text{boundary}} - \delta_{\text{push}} \cdot \mathbf{t}_{\text{boundary}}$$

This numerical correction keeps the final stitched shapes perfectly aligned and prevents gaps between fillings and boundaries, regardless of fabric type.
