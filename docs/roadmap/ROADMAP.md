# Acom Broderie Engineering Roadmap

This document outlines the phased development plan to transform the **Acom Broderie Engine** into a world-class, open-source CAD/CAM textile platform capable of competing with industry giants.

---

## Phase 1: Architectural Decoupling & Core Math APIs (Q3 2026)
*Establish the decoupled hexagonal boundaries and move calculations out of the UI.*

- [x] **Conceptual Design**: Define the Hexagonal CAD/CAM architecture and interface boundaries (`Architecture.md`, `CADCAM.md`).
- [ ] **Geometry Engine Isolation**: Move all Bézier spline and normal calculations into `GeometryEngine.ts`.
- [ ] **Stateless Unit Testing**: Set up standard automated tests for the math formulas (curvature, normal projection, and Douglas-Peucker) with 100% test coverage.
- [ ] **Web Worker Integration**: Offload stitch compilation from the main React UI thread to a background Web Worker.

---

## Phase 2: Medial Axis & Satin Ribbon Generation (Q4 2026)
*Implement advanced geometric reconstruction for organic and typographic shapes.*

- [ ] **Voronoi Backbone Extraction**: Code the constrained Delaunay triangulation and interior Voronoi edge generation inside `RibbonEngine.ts`.
- [ ] **Branch Pruning**: Implement noise-pruning algorithms to extract clean centerlines from hand-drawn sketches.
- [ ] **Corner Miter & Satin Fanning**: Implement fanned short-stitch patterns on tight corners to prevent thread bunching.
- [ ] **Satin Edge-Walk Underlay**: Code automatic 3D-relief edge-walk underlays based on reconstructed ribbon boundaries.

---

## Phase 3: Fabric Physics & Machine-Specific Adaptation (Q1 2027)
*Integrate physical material constraints and direct hardware profiles.*

- [ ] **Acom Phys Database**: Create standard physical parameter maps for basic substrates (Cotton, Jersey, Silk, Fleece).
- [ ] **Inverse-Deformation Compensator**: Code the pre-compensation module to dynamically expand satin columns and overlap tatami fills.
- [ ] **Tension Distributing Stitch-Decimation**: Implement dynamic thread-tension modeling to prevent fabric pucker.
- [ ] **Machine Profile Exporters**: Build dedicated profiles for Tajima, Brother, Barudan, and ZSK to optimize jump-splitting and automatic tie-off stitches.

---

## Phase 4: Pattern Intelligence & AI Digitization (Q2 2027)
*Leverage Vision AI to drive semantic, context-aware stitching.*

- [ ] **LLM/Vision Semantic Segmentation**: Integrate the Gemini-powered image classifier to label regions (Monograms, Arabesques, Wax Motifs).
- [ ] **Stroke Overlap Compensation**: Automatically add overlapping junctions to recognized typographic elements (stems, serifs).
- [ ] **Lattice Lace Patterns**: Write highly flexible, low-density lace-weave and outline-stitch strategies for lightweight African Wax designs.
- [ ] **Auto-Symmetry Lock**: Enforce geometric symmetry rules on identified rosette and mandala shapes during stitch pathing.

---

## Phase 5: Production Benchmarks & CAD Telemetry (Q3 2027)
*Validate, monitor, and scale production.*

- [ ] **Acom Bench Pipeline**: Set up a continuous integration test pipeline to automatically evaluate the "Fidelity Score," "Travel Efficiency," and "Stitch Count Ratio" on every code commit.
- [ ] **Comparative Dashboard**: Build a telemetry visualizer inside the SaaS manager to display side-by-side stitch metrics against industry standards.
- [ ] **Embedded G-Code Exporter**: Extend the export capability to standard CNC machines and garment cutters for holistic workshop orchestration.
