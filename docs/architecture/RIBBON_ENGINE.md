# Acom Broderie Ribbon Engine (Ribbon Reconstruction)

This document describes the mechanics of the **Acom Ribbon Reconstruction Engine** (Acom Ribbon).

Satin stitches (or column stitches) require a pair of boundary lines (left rail and right rail) to weave stitches back and forth. However, images, SVG files, and manual drawings are usually imported as closed vector boundaries (polygons). 

The Ribbon Engine is responsible for **decomposing arbitrary closed shapes into ribbons (dual guide rails)**.

---

## 1. Medial Axis Transform (MAT) and Voronoi Backbone Extraction

To reconstruct a ribbon from a closed polygon $\mathcal{P}$, the engine calculates its mathematical "backbone" using the **Medial Axis Transform (MAT)**.

The Medial Axis is the set of all points inside $\mathcal{P}$ that have more than one closest point on the polygon boundary $\partial \mathcal{P}$.

```
                 Closed Polygon                         Medial Axis / Backbone
              ┌──────────────────┐                       o───────o───────o
              │                  │                      /                 \
              └──────────────────┘                     o─────────────────o
```

### Algorithmic Pipeline:
1. **Delaunay Triangulation**: The polygon boundary is sampled, and a constrained Delaunay triangulation of the interior is performed.
2. **Voronoi Diagram**: The dual graph of the triangulation is constructed. The Voronoi edges inside the polygon form a close approximation of the Medial Axis.
3. **Pruning**: Minor branches caused by boundary noise (such as small serrations) are pruned. Any branch whose inscribed circle radius $R$ changes too rapidly relative to the branch length is collapsed.
4. **Centerline Spline**: The remaining backbone edges are connected into a single, continuous parametric curve $\mathbf{C}(s)$, parameterized by arc length $s$.
5. **Radius Field $R(s)$**: Each point along the centerline is assigned a radius $R(s)$, representing half the ribbon width at that point.

---

## 2. Dual Guide Rail Reconstruction

Using the pruned Medial Axis $\mathbf{C}(s)$ and the inscribed radius field $R(s)$, the engine reconstructs the two outer rails, $\mathbf{L}(s)$ and $\mathbf{R}(s)$, by projecting normal vectors:

$$\mathbf{L}(s) = \mathbf{C}(s) + R(s) \mathbf{N}(s)$$

$$\mathbf{R}(s) = \mathbf{C}(s) - R(s) \mathbf{N}(s)$$

Where $\mathbf{N}(s)$ is the normal vector of the centerline at $s$.

This process guarantees that even complex, organic shapes (like scrollwork, vine stems, and calligraphic lettering) are decomposed into clean ribbons with variable widths.

---

## 3. Stitch generation (Back-and-Forth Weaving)

Once the dual rails $\mathbf{L}(s)$ and $\mathbf{R}(s)$ are reconstructed, the engine weaves the satin stitches between them. 

The stitches must cross the ribbon at an angle $\theta(s)$ close to the local normal vector to ensure high-quality embroidery.

```
                    Left Rail L(s)
                 L_0     L_1     L_2     L_3
                  o───────o───────o───────o
                 / \     / \     / \     /
                /   \   /   \   /   \   /  Satin Weave
               /     \ /     \ /     \ /
              o───────o───────o───────o
             R_0     R_1     R_2     R_3
                    Right Rail R(s)
```

### Zig-Zag and Satin Weaving Strategy:

1. **Equidistant Sampling**: Both rails are re-parameterized by arc length.
2. **Dynamic Densities**: Stitches are generated alternating from Left to Right:
   - Stitch 1: $\mathbf{L}_k$ to $\mathbf{R}_k$
   - Stitch 2: $\mathbf{R}_k$ to $\mathbf{L}_{k+1}$
   - Stitch 3: $\mathbf{L}_{k+1}$ to $\mathbf{R}_{k+1}$
3. **Corner Miter Compensation (Turning Satin)**: On sharp turns where the inner rail is much shorter than the outer rail ($\Delta s_i \ll \Delta s_o$), a standard alternating weave would cause a density spike on the inside, bunching the thread.
   - The engine automatically implements **Short Stitches** (fans).
   - Only a fraction of the stitches (e.g., 1 out of 3) go all the way from the outer rail to the inner rail. The other 2 stitches terminate early (e.g., at 1/3 and 2/3 of the width), fanning out to form a perfect, smooth curve without thread piling.

---

## 4. Underlay Layer Integration

Before weaving the top satin cover, the Ribbon Engine automatically generates stabilizer underlays:
- **Centerline Underlay**: A simple running stitch along the Medial Axis $\mathbf{C}(s)$ to secure the fabric to the backing.
- **Edge-Walk Underlay**: Running stitches offset slightly inward (typically $0.4\text{ mm}$) from the rails $\mathbf{L}(s)$ and $\mathbf{R}(s)$. This lifts the satin stitches slightly, giving them a rich, high-relief three-dimensional look and preventing fabric from showing through the edges.
