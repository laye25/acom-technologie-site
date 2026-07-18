# Acom Broderie Geometry Engine (Acom Geo)

This document describes the mathematical and geometric foundations of the **Acom Broderie Geometry Engine**. 

Instead of converting shapes directly into approximate polylines, Acom Broderie maintains **mathematical parametric continuity (Bézier/B-Spline)** throughout the design phase, performing discrete sampling only at the final stitch-generation stage.

---

## 1. Parametric Spline Modeling & Adaptive Step Sampling

Traditional embroidery software samples parametric curves using fixed-distance steps (e.g., $t \in [0, 0.1, 0.2, ...]$). This leads to:
- **Under-sampling** on high-curvature bends, causing visible geometric flattening.
- **Over-sampling** on long straight line segments, creating a high density of redundant stitches.

Acom Broderie uses **Adaptive Curvature-Based Sampling**. Let $\mathbf{C}(t) = (x(t), y(t))$ be a cubic Bézier curve for $t \in [0, 1]$:

$$\mathbf{C}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t) t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3$$

The sampling interval $\Delta t$ is computed dynamically using the local curvature $\kappa(t)$. The curvature $\kappa$ is defined as:

$$\kappa(t) = \frac{x'(t)y''(t) - y'(t)x''(t)}{(x'(t)^2 + y'(t)^2)^{3/2}}$$

To keep the geometric deviation (sagitta $h$) below a maximum threshold (typically $h \le 0.05\text{ mm}$), the step size $\Delta s$ along the arc length is determined by:

$$\Delta s(t) \approx \sqrt{\frac{8 h}{\kappa(t)}}$$

The algorithm computes the next parameter step $t_{k+1}$ by solving:

$$\int_{t_k}^{t_{k+1}} \|\mathbf{C}'(t)\|\,dt = \Delta s(t_k)$$

Using a fast first-order Taylor approximation, we get:

$$t_{k+1} = t_k + \frac{\Delta s(t_k)}{\|\mathbf{C}'(t_k)\|}$$

This ensures that tight curves are populated with dense points to preserve visual precision, while straight segments use the maximum allowable stitch length, drastically reducing thread count and needle wear.

---

## 2. Normal Vector Projection and Ribbon Width Estimation

For **Satin and Column stitches**, the engine must estimate the local width and matching boundary points across a design "ribbon." 

Let the centerline of the ribbon be represented by the parametric curve $\mathbf{C}(t)$. At any point $t$, the unit tangent vector $\mathbf{T}(t)$ and unit normal vector $\mathbf{N}(t)$ are calculated:

$$\mathbf{T}(t) = \frac{\mathbf{C}'(t)}{\|\mathbf{C}'(t)\|}$$

$$\mathbf{N}(t) = \begin{pmatrix} -y'(t) \\ x'(t) \end{pmatrix} \frac{1}{\sqrt{x'(t)^2 + y'(t)^2}}$$

To find the left boundary $\mathbf{B}_L(t)$ and right boundary $\mathbf{B}_R(t)$ at distance $w(t)/2$ (where $w(t)$ is the width of the column):

$$\mathbf{B}_L(t) = \mathbf{C}(t) + \frac{w(t)}{2} \mathbf{N}(t)$$

$$\mathbf{B}_R(t) = \mathbf{C}(t) - \frac{w(t)}{2} \mathbf{N}(t)$$

```
                    B_L(t) [Left Rail]
                      o──────────o──────────o
                     /          /          /
                    /  N(t)    /          /
                   /   ▲      /          /
                  o────┼─────o──────────o  C(t) [Centerline]
                 /     │     /          /
                /      └─►  /          /
               /         T(t)          /
              o──────────o──────────o
                    B_R(t) [Right Rail]
```

### Self-Intersection Checking

When a ribbon takes a sharp turn, the inner rail may self-intersect. This causes overlapping loops which can break needles or pile up thread.
At any point $t$, a self-intersection on the left rail occurs if:

$$\mathbf{B}_L'(t) \cdot \mathbf{C}'(t) < 0$$

Expanding this relation:

$$\left( \mathbf{C}'(t) + \frac{w'(t)}{2} \mathbf{N}(t) + \frac{w(t)}{2} \mathbf{N}'(t) \right) \cdot \mathbf{C}'(t) < 0$$

Using the Frenet-Serret formula $\mathbf{N}'(t) = -\kappa(t) \|\mathbf{C}'(t)\| \mathbf{T}(t)$, we simplify the check for constant width ribbon ($w'(t) = 0$):

$$1 - \frac{w(t)}{2} \kappa(t) < 0 \implies \kappa(t) > \frac{2}{w(t)}$$

If this condition is met, the inner rail is guaranteed to loop. The `GeometryEngine` automatically detects these zones and triggers **stitch density mitigation** or converts the satin stitch into a **short-stitch fan pattern** (Corner Miter / Fan).

---

## 3. Vectorization & Geometry Simplification

When raw SVG or pixel-traced shapes are loaded, they often contain redundant vertices and micro-jitters. The `GeometryEngine` runs two simplification algorithms sequentially:

1. **Douglas-Peucker (RDP) Algorithm**: Simplifies polylines by removing points within a distance threshold $\epsilon$:
   - For straight lines: $\epsilon = 0.1\text{ mm}$.
   - For curved regions: $\epsilon = 0.02\text{ mm}$ (to preserve curves).

2. **Bézier Fitting**: Reconstructs continuous cubic Bézier splines from simplified polylines by solving a least-squares minimization of the distance error, ensuring high-fidelity mathematical smoothness before passing the geometry to stitch-generation algorithms.
