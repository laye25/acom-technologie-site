# Embroidery Semantic Engine (SemanticAnalyzer)

## Vision & Object-Oriented Vectorization

The traditional auto-digitizing pipeline converts pixels directly to vector shapes and then fills them with stitches. This often results in fragmented, jagged edges and inappropriate stitch types (e.g., using Tatami for a thin border just because the region is thick enough in some spots).

The new **Semantic Architecture** shifts the paradigm from pixel-based regions to object-oriented semantic recognition.

### New Pipeline Architecture
1. **Image Input**
2. **AI Vision & Semantic Segmentation**: Identifying semantic meaning before tracing (e.g., "This is a letter B", "This is a flower petal", "This is a stem").
3. **Object Recognition & Component Library (EKLE)**: Matching segmented regions to known geometric primitives or library components.
4. **Geometric Reconstruction (Bézier)**: Reconstructing the ideal geometric shape (e.g., a mathematical circle, a continuous spline for a stem) rather than following noisy pixel boundaries.
5. **Embroidery Rule Engine**: Applying rules based on object semantics and reconstructed geometry (e.g., thickness < 1.2mm -> Running, 1.2mm to 10mm -> Satin, > 10mm -> Tatami).
6. **Toolpath Optimization**
7. **Machine Code Generation (DST/PES)**

## SemanticAnalyzer Prototype

The `SemanticAnalyzer` is the core module responsible for orchestrating this new pipeline. It bridges AI Vision (Gemini) and the Embroidery Rule Engine.

### Responsibilities
- **Semantic Classification**: Receiving raw segmented regions and classifying them (e.g., `Letter`, `Circle`, `Line`, `Leaf`).
- **Geometric Parameter Extraction**: For a circle, extracting `center` and `radius`. For a line, extracting a `spline` path and `thickness`.
- **Stitch Strategy Delegation**: Deciding which stitch algorithm to apply based on the semantic class and parameters, bypassing generic region-filling when possible.
