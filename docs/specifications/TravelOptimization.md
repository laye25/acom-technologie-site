# Algorithmic Specification: Travel Optimization (TSP-PC)
**Maturité (Règle 52) :** Implemented  

This document specifies the mathematical formulation for the **Travel Optimization Engine** inside the Acom Embroidery Engine (AEE).

---

## 1. Mathematical Formulation

To minimize embroidery runtimes, the toolpath sequence must minimize non-stitching transitions (jumps and trims) while respecting strict ordering constraints. This is modeled as a **Traveling Salesperson Problem with Precedence Constraints (TSP-PC)**.

Let $O = \{o_1, o_2, ..., o_n\}$ be the set of embroidery objects in the project.
Each object $o_i$ has a entry needle-point $\mathbf{E}_i \in \mathbb{R}^2$ and an exit needle-point $\mathbf{X}_i \in \mathbb{R}^2$.

The cost of transitioning from object $o_i$ to $o_j$ is the Euclidean distance between the exit of $o_i$ and the entry of $o_j$:

$$d(o_i, o_j) = \|\mathbf{X}_i - \mathbf{E}_j\|$$

Let $c(o_i) \in C$ represent the color of object $o_i$. To prevent redundant thread changes on industrial machines, we enforce a strict grouping constraint:

$$c(o_{\pi(k)}) = c(o_{\pi(k+1)}) \quad \forall k \notin K_{\text{change}}$$

Where $K_{\text{change}}$ is the set of indices where a color change actually occurs, and $\pi$ is the permutation representing the traversal order.

---

## 2. Solver Architecture and Heuristics

Because the TSP is NP-Hard, AEE uses a combined heuristic approach to ensure near-instantaneous computation under $100\text{ ms}$ in the browser:

1. **Color Clustering**: The project is partitioned into disjoint subsets $S_c = \{o_i \mid c(o_i) = c\}$ for each color $c \in C$.
2. **Nearest-Neighbor with 2-Opt Optimization**:
   - For each color cluster $S_c$, a greedy nearest-neighbor chain is constructed starting from the exit point of the last cluster.
   - A local **2-Opt exchange** is run on the sequence to eliminate crossing transitions:
     
```
                   Before 2-Opt (Crossing)            After 2-Opt (Uncrossed)
                     X_1 o────────o E_2                 X_1 o────────o E_1
                          \      /                           ▲      ▲
                           \    /                            │      │
                            \  /                             │      │
                     X_2 o───\/───o E_1                 X_2 o────────o E_2
```

---

## 3. Dynamic Path Hiding

If two sequential objects $o_i$ and $o_{i+1}$ of the same color are close ($d(o_i, o_{i+1}) \le 3.0\text{ mm}$):
- Instead of inserting a Jump or Trim command, the engine inserts a **traveling running stitch**.
- To keep this traveling stitch invisible, AEE runs a path-finding search (A* or Dijkstra) constrained to the geometry of yet-unstitched elements of the same color or underlaying tatami shapes, burying the transition thread completely beneath the decorative cover layer.
