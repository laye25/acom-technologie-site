# Acom Broderie Quality & Optimization Engine

This document describes the mechanics of the **Acom Quality and Optimization Engine** (Acom Quality).

Unlike vector graphics displayed on screens, embroidery must deal with mechanical realities. Gaps can form between filled shapes and outlines due to fabric pull, needles can bend or snap if stitch density is too high, and excess thread cuts waste time. 

The Quality Engine acts as an automated "pre-flight audit" to fix these issues before the files are sent to production.

---

## 1. Automatic Gap and Counter-Form Detection

Due to the pull effect, adjacent regions often pull away from each other, leaving unstitched gaps of bare fabric. This is especially true for **counterforms** (holes inside filled shapes, like the center of the letter 'O').

```
                   Fabric Pull Gap Generation (No Overlap)
                   
                 Layer A (Tatami Fill)          Layer B (Satin Outline)
                 ┌──────────────────┐  ◄───────►  ┌───────┐
                 │  ██████████████  │   Gap of   │  ███  │
                 │  ██████████████  │  bare fabric│  ███  │
                 └──────────────────┘            └───────┘
```

### Algorithmic Solutions:
1. **Geometric Intersection Audit**: The engine performs polygon intersection checks between adjacent objects.
2. **Overlap Insertion**: If two objects touch or are within $1.0\text{ mm}$ of each other, the engine automatically adds an **overlap offset** (typically $0.4\text{ mm}$ to $0.8\text{ mm}$) along the boundary matching the stitch direction of the bottom layer:
   - For layers stitching vertically, boundaries are expanded vertically.
   - For layers stitching horizontally, boundaries are expanded horizontally.
3. **Counterform Locking**: The engine locks the borders of inner cutouts by applying an automatic outline running stitch (contour walk) to bind the fabric threads before filling.

---

## 2. Needle Breaking and Density Checks

If stitch density is too high, multiple needle drops land in the same micro-region. This causes thread shredding, nesting under the hoop, needle bending, or needle breaks.

The `QualityEngine` runs a **Spatial Heatmap Density Check**:
- **Grid Segmentation**: The design bounds are divided into $1\text{ mm} \times 1\text{ mm}$ grid cells.
- **Stitch Counter**: The engine counts the number of needle penetrations in each cell.
- **Critical Threshold**: If a cell contains more than $8$ needle drops, it is flagged as a **critical density spike**.
- **Correction**: The engine automatically applies **Stitch Decimation** (selectively removing adjacent stitch coordinates) or offsets the start points of consecutive rows in tatami fills to distribute the needle drops evenly.

---

## 3. Path Sorting and Travel Optimization (The TSP Solver)

To minimize the number of thread trims (cuts) and jumps, which add minutes of non-productive movement to industrial runs, the engine models path planning as a **Traveling Salesperson Problem with Precedence Constraints (TSP-PC)**:

- **Cities**: Start and end connection points of each embroidery object.
- **Cost**: The 2D distance between an object's exit point and the next object's entry point.
- **Constraints**: Colors must be grouped together to minimize manual or automatic thread changes.

### Sorting Heuristics:
1. **Color Grouping**: Objects are first partitioned by color blocks.
2. **Nearest-Neighbor Thread Sorting**: Within a single color block, the engine runs a fast nearest-neighbor search starting from the hoop center to determine the optimal sequence of objects.
3. **Connection Running Stitches**: If the jump distance between two adjacent objects of the same color is less than $3.0\text{ mm}$, the engine replaces the jump command with a **traveling running stitch** hidden underneath the subsequent fill layer, eliminating the need for a thread cut.
