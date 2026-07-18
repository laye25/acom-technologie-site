# Algorithmic Specification: Skeletonization & Medial Axis
**Maturité (Règle 52) :** Designed  

This document specifies the mathematical formulation for the **Skeletonization and Medial Axis Transform Engine** inside the Acom Embroidery Engine (AEE).

---

## 1. Problem Definition

Given a closed polygon boundary $\partial \mathcal{P}$ with $N$ vertices, find a simplified, tree-structured 1D skeleton $\mathcal{S}$ that lies exactly in the center of the shape and represents its topological flow.

---

## 2. Voronoi-Based Medial Axis Approximation

The continuous Medial Axis is approximated using the dual graph of a **Constrained Delaunay Triangulation (CDT)** of the polygon's interior:

1. **Boundary Sampling**: The polygon edges are densely sampled such that no segment is longer than $d_{\text{max}} = 0.5\text{ mm}$.
2. **Triangulation**: The sampled boundary vertices are triangulated to form a set of triangles $\mathcal{T} = \{T_1, T_2, ..., T_k\}$.
3. **Classification of Triangles**:
   - *Junction Triangles (Three neighbors)*: Triangle shares all three edges with other triangles. These form branching joints in the skeleton.
   - *Sleeve Triangles (Two neighbors)*: Triangle shares two edges with other triangles. These form the continuous body of the skeleton.
   - *Terminal Triangles (One neighbor)*: Triangle shares only one edge. These form the endpoints of the skeleton.

```
                    Boundary Triangle Classification
                    
                     o───────────o
                    / \         / \
                   /   \ Sleeve/   \
                  /     \     /     \
                 o───────o───o───────o
                  \     /     \     /
                   \   / Joint \   /
                    \ /         \ /
                     o───────────o
```

4. **Skeleton Node Extraction**:
   - For each Sleeve triangle, the skeleton segment connects the midpoints of its two shared edges.
   - For each Junction triangle, the skeleton segment connects the triangle's centroid to the midpoints of its three shared edges.
   - For each Terminal triangle, the segment connects the midpoint of its shared edge to the opposing boundary vertex.

---

## 3. Pruning Primitives

Raw Voronoi skeletons are highly sensitive to boundary perturbations, resulting in tiny, noisy branches. The engine prunes these branches using the **Radius-to-Length Ratio Rule**:

Let a candidate branch $\mathcal{B}$ connect a junction point $\mathbf{J}$ to a terminal endpoint $\mathbf{T}$.
- Let $L = \text{length}(\mathcal{B})$ be the arc length of the branch.
- Let $R(\mathbf{x})$ be the inscribed circle radius at point $\mathbf{x} \in \mathcal{B}$ (representing half the shape's width at that point).

The branch is **pruned** (deleted) if:

$$\frac{L}{R(\mathbf{J})} < \alpha_{\text{prune}}$$

Where $\alpha_{\text{prune}}$ is a user-configurable pruning coefficient (typically $1.2$ to $2.0$). 

This guarantees that small wrinkles and serrations on the shape boundary do not corrupt the clean, continuous flow of the generated centerline, enabling beautiful, single-path satin stitch coverage.
