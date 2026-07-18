# Acom Broderie Fabric Physics Engine (Acom Phys)

This document describes the design and physical modeling used in the **Acom Fabric Physics Engine**.

Embroidery is not a static 2D drawing. Thread has tension, and fabric is flexible. When thousands of stitches are pulled tight, the fabric compresses along the direction of the stitches (Pull Effect) and expands perpendicular to it (Push Effect). 

Acom Phys models these physical distortions to **pre-compensate** the vector paths before generating stitches.

---

## 1. Material Profiles & Substrate Modeling

Different fabrics respond differently to embroidery forces. Acom Phys maintains a physical library of substrates:

| Substrate | Stretch Coefficient ($k_s$) | Friction Coefficient ($\mu$) | Compressive Limit ($C_{max}$) | Recommended Backing |
| :--- | :---: | :---: | :---: | :--- |
| **Cotton (Canvas)** | $0.05$ (Very Low) | $0.4$ | $0.2\text{ mm}$ | Light Tear-Away |
| **Jersey (Stretch)** | $0.65$ (Very High) | $0.2$ | $1.2\text{ mm}$ | Heavy Cut-Away (Double) |
| **Piqué (Polo)** | $0.35$ (High) | $0.3$ | $0.8\text{ mm}$ | Tear-Away + Wash-Away Top |
| **Silk (Satin)** | $0.15$ (Medium) | $0.1$ | $0.4\text{ mm}$ | Ultra-Light Mesh |
| **Fleece / Towel** | $0.45$ (High) | $0.5$ | $1.5\text{ mm}$ | Heavy Cut-Away + Solvy Top |
| **Leather** | $0.02$ (Zero) | $0.8$ | $0.1\text{ mm}$ | No-Show Mesh (Light) |

---

## 2. Mathematical Modeling of Push-Pull Distortion

For any given stitch vector $\mathbf{v}$ with length $L = \|\mathbf{v}\|$ and angle $\theta$ relative to the fabric grain:
- **Pull Force**: Pulls the boundaries inward along the stitch vector.
- **Push Force**: Pushes the boundaries outward perpendicular to the stitch vector.

Let $\mathbf{D}(x, y)$ be the 2D deformation vector field inside a region $\Omega$ filled with stitches. The deformation at point $\mathbf{x} = (x, y)$ is modeled by integrating the pulling forces exerted by all nearby stitches $\mathbf{v}_i$:

$$\mathbf{D}(\mathbf{x}) = \sum_{i \in \text{stitches}} \alpha \cdot F_{\text{tension}} \cdot e^{-\beta \|\mathbf{x} - \mathbf{x}_i\|^2} \cdot \mathbf{u}_i$$

Where:
- $F_{\text{tension}}$ is the thread tension force (typically $0.1\text{ N}$ to $0.2\text{ N}$).
- $\mathbf{u}_i$ is the unit vector of stitch $i$ (for Pull) or its normal (for Push).
- $\alpha$ is a scaling factor proportional to the fabric stretch coefficient $k_s$.
- $\beta$ is a spatial decay coefficient representing how the hoop tension distributes force over the fabric.

### Simplifying for Satin Columns:
For a satin column of width $w$ and angle $\theta$, the actual embroidered width $w_{\text{embroidered}}$ is smaller than the digital width $w_{\text{digital}}$:

$$w_{\text{embroidered}} = w_{\text{digital}} - \delta_{\text{pull}}$$

$$\delta_{\text{pull}} = k_s \cdot \left( a \cdot w_{\text{digital}} + b \cdot \rho \right)$$

Where:
- $\rho$ is the stitch density (stitches per mm).
- $a, b$ are empirical constants calibrated via tests.

```
                    Pull Distortion on Satin Column
                    
                     Digital Boundary (SVG)
                     ───────────────o───────────────
                                    │ \
                                    │  \  Pull Force
                                    ▼   ▼
                     - - - - - - - - - - - - - - - -  Actual Embroidered Border
                                                      (Fabric compresses)
```

---

## 3. Inverse-Deformation Pre-Compensation

To ensure the final embroidered piece matches the original digital artwork, Acom Phys applies **Inverse-Deformation Pre-Compensation**. 

Before generating stitches, the engine deforms the source vector geometries in the **opposite direction** of the expected physical distortion:

$$\mathbf{x}_{\text{compensated}} = \mathbf{x}_{\text{original}} - \mathbf{D}(\mathbf{x}_{\text{original}})$$

### Compensation Transformations:
1. **Width Expansion (Satin)**: The engine expands the boundaries of satin columns perpendicular to the stitch direction by $\delta_{\text{pull}}/2$ on each side:
   
$$w_{\text{compensated}} = w_{\text{digital}} + \delta_{\text{pull}}$$

2. **Length Shrinkage (Tatami)**: For large tatami fills, the shapes are offset outward by up to $1.0\text{ mm}$ in the direction of the stitches to prevent gaps at the borders (known as "underlap/overlap compensation").
3. **Jersey Elastic Lock**: For highly elastic jersey, underlay stitches are laid down in a secure "gridlock" pattern to bind the fabric fibers to the non-stretch stabilizer backing, preventing the fabric from stretching during the top-stitch run.
