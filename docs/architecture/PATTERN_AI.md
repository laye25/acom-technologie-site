# Acom Broderie Pattern Intelligence Engine (Acom PI)

This document describes the design of the **Acom Pattern Intelligence Engine**.

Traditional auto-digitizing software treats every element of an import simply as a raw geometric vector to be filled. The Pattern Intelligence Engine introduces a **semantic layer** that recognizes the symbolic class of motifs before applying compilation strategies.

---

## 1. Classification Taxonomy

The Pattern Intelligence Engine classifies segmented vector groups into specialized semantic families:

```
                      ┌───────────────────────────┐
                      │    Pattern Intelligence   │
                      └─────────────┬─────────────┘
                                    │
         ┌──────────────┬───────────┴───────────┬──────────────┐
         ▼              ▼                       ▼              ▼
     Monograms      Arabesques               African         Logos &
    & Lettering    & Scrollwork            Wax Motifs       Emblems
```

- **Monograms & Lettering**: Typographic elements requiring strict stroke direction, consistent column widths, and kerning compensations.
- **Arabesques, Rosettes & Scrollwork**: Highly symmetrical, repeating curves requiring polar coordinate spacing and balanced start/end connection points.
- **African Wax & Lace Motifs**: Organic shapes with intricate, narrow interior segments requiring delicate lattice underlays and continuous running-stitch connections.
- **Logos & Emblems**: Solid geometric bounds requiring multi-directional tatami fills and precise outer borders (border offsets to prevent gaps).

---

## 2. Family-Specific Fill Strategies

### A. Arabesques and Rosettes
Arabesques have high symmetry. If treated as isolated shapes, the jumps and trims will be extremely high.
- **Radial Sorting**: The engine calculates the center of symmetry $\mathbf{O}_s = (x_c, y_c)$. It sorts the vector objects radially (by polar angle $\theta$) to build a circular continuous toolpath, cutting down jump counts by up to 90%.
- **Symmetric Underlays**: Instead of a simple diagonal grid, underlays are laid in concentric rings or spiral patterns to support the physical structure uniformly.

### B. Lettering & Monograms (Acom FontEngine)
When a segment is recognized as a character (using AI vision classification):
- **Stroke Decomposition**: Letters are split into natural brush/pen strokes (stems, bowls, serifs).
- **Overlapping Joints**: The engine automatically adds a $0.3\text{ mm}$ overlap at the junction of overlapping strokes (e.g., where a horizontal crossbar meets a vertical stem) to prevent the fabric from separating when the thread pulls during embroidery.
- **Directional Priority**: Stitched from the center outward or bottom-up to prevent distortion.

```
                  Overlapping Junction Compensation
                  
                  Vertical Stem         Horizontal Bar (With 0.3mm overlap)
                  ┌───────┐             ┌─────────────────────
                  │       │             │  ███████████████████
                  │   ┌───┼─────────────┼─┐
                  │   │   │             │ │ ◄── Overlap Area
                  │   └───┼─────────────┼─┘
                  │       │             │  ███████████████████
                  └───────┘             └─────────────────────
```

### C. African Wax and Lace (Acom Lace)
- **Lattice Fill**: Instead of dense tatami (which would make the fabric stiff), the engine implements a light, semi-transparent mesh lattice (under-density index of 1.2mm - 2.0mm) to mimic the airy look of lace.
- **Single-Path Outlining**: Continuous running stitch outlines trace around the lace segments, bypassing heavy fills to maintain fabric suppleness.

---

## 3. The AI Vision Semantic Loop

The Pattern Intelligence Engine leverages the **Gemini Vision API** as a high-level classifier:
1. **Sketch Segmentation**: The raw raster sketch is segmented into distinct visual blocks.
2. **AI Classification**: The blocks are fed to Gemini to retrieve semantic metadata:
   - *Prompt*: `"Identify the semantic category of this region: 'lettering', 'arabesque', 'dense_logo', 'wax_motif'."`
3. **Property Extraction**: If labeled as `'lettering'`, Gemini extracts the font style (serif/sans-serif) and letter sequence.
4. **Strategy Assignment**: The local database loads the matching compilation parameters and updates the layer config.
5. **Deterministic Execution**: The mathematical core runs the assigned strategy, keeping the compilation process 100% stable and fast.
