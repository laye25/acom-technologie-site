# Acom Broderie: Hexagonal CAD/CAM Architecture

This document establishes the architectural blueprint for the **Acom Broderie CAD/CAM Engine**. Moving away from a monolithic, UI-coupled service (`embroideryServices.ts`), Acom Broderie adopts a decoupled, highly testable, and robust **Hexagonal (Ports & Adapters) CAD/CAM Architecture**.

This architecture isolates raw mathematical, physical, and protocol-specific concerns from React visual elements, allowing the core CAD/CAM algorithms to run headlessly (e.g., in Electron background processes, cloud worker servers, or standard browser runtimes).

---

## 1. Architectural Blueprint Overview

The Acom Broderie system is split into three main circles:
1. **The Presentation Layer (UI)**: React components which provide the user interface, canvas renderers, and manual CAD tools.
2. **The Embroidery Application API (Boundary)**: The unified command interface that orchestrates calculations and handles file loading/saving.
3. **The Core Engines (Hexagon)**: Pure, stateless, mathematical, physical, and protocol engines that operate exclusively on pure geometric primitives, stitches, and machine instructions.

```
                    ┌───────────────────────────────────┐
                    │            UI (React)             │
                    │   TailleurEmbroideryManager.tsx   │
                    └─────────────────┬─────────────────┘
                                      │
                         Embroidery Application API
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
  Geometry Engine              Pattern Engine              Simulation Engine
 (GEOMETRY_ENGINE)            (PATTERN_ENGINE)            (PHYSICS_ENGINE)
         │                            │                            │
         └──────────────┬─────────────┴──────────────┬─────────────┘
                        ▼                            ▼
                 Embroidery Core Engine       Quality Engine
                    (CORE_ENGINE)            (QUALITY_ENGINE)
                        │
                        ▼
                 Export Engine (DST/PES/JEF)
                    (EXPORT_ENGINE)
```

---

## 2. Decoupled Architecture Model

### A. The Core Hexagon: Domain Entities & Ports
The central core operates on pure mathematical entities defined in a single, unified typing model (`/src/types/embroidery.ts` or `/src/modules/tailleur/types/`):
- `EmbroideryObject`: High-level vector geometry (Polylines, Bézier Splines, Closed Curves, Text Strings).
- `EmbroideryLayer`: A logical grouping of objects representing a thread color block with specific stitch strategies.
- `StitchPath`: A list of 3D spatial points $(x, y, z)$ representing needle penetrations, where $z$ encodes command types (Stitch, Jump, Trim, Color Change).
- `FabricProfile`: Physical properties of the backing/material (stretch, density, thickness, friction).
- `MachineProfile`: Operational limits of the targeted hardware (max jump length, tension curve, trim command encoding).

### B. Core Engines Responsibility Mapping

| Engine Name | Role & Scope | Key Mathematical / Algorithmic Focus |
| :--- | :--- | :--- |
| **Geometry Engine** | Raw shape analysis & Bézier curves | Step-adaptive spline sampling, Local normal vectors, Width estimation, Self-intersection detection. |
| **Pattern Engine** | Pattern Intelligence (Acom PI) | Structural recognition of monograms, arabesques, coptic knots, African Wax motifs, lace patterns. |
| **Simulation Engine** | Fabric Physics Model (Acom Phys) | Push-pull deformation vectors, micro-tension modeling, fabric shrinkage pre-compensation. |
| **Embroidery Core Engine** | Stitch Compilation & Toolpathing | Underlay generation (contour/grid), satin-fill column generation, tatami-fill raycasting, thread path sorting (TSP). |
| **Quality Engine** | CAD Verification & Correction | Counter-form detection, hole repairing, automatic overlap generation, density checks to prevent needle break. |
| **Export Engine** | Hardware serialization & Profiles | DST 3-byte delta coordinate compression, PES format blocks, JEF headers, Machine profiles. |
| **Benchmark Engine** | Software quality & efficiency | Geometric fidelity scoring, stitch-count ratio vs Industry leaders (Wilcom, Tajima DG, Pulse). |

---

## 3. The Port & Adapter Directory Structure

To support this architectural shift, the `/src/modules/tailleur/` directory will undergo a modular decomposition:

```
src/modules/tailleur/
├── api/
│   └── EmbroideryApplication.ts        # Primary API facade for React components
├── components/
│   ├── TailleurEmbroideryManager.tsx  # Pure UI layout, menus, timeline controls
│   └── EmbroideryCanvas.tsx            # Pure canvas drawing using WebGL or fast 2D Context
├── core/
│   ├── EmbroideryCore.ts               # Coordinates toolpath compilation
│   ├── GeometryEngine.ts               # Bézier, offset, and normal calculators
│   ├── PatternEngine.ts                # Classification, monograms, arabesques
│   ├── PhysicsEngine.ts                # Push-pull deformation, fabric profiles
│   ├── QualityEngine.ts                # Geometry validation, gap-closing
│   ├── BenchmarkEngine.ts              # Stitch efficiency scoring & comparators
│   └── ExportEngine.ts                 # DST/PES file encoders and Machine Profiles
├── types/
│   └── index.ts                        # Strict geometric and stitch types
└── services/
    └── index.ts                        # Infrastructure services (e.g., Firestore sync, local DB)
```

---

## 4. Architectural Benefits

1. **Deterministic Testing**: Every mathematical function inside `GeometryEngine` or `PhysicsEngine` can be tested using standard Node.js test frameworks (such as Jest or Vitest) with 100% test coverage, completely independent of the browser or React lifecycle.
2. **Performance Isolation**: Heavy geometric operations (like calculating the Voronoi Media Axis for Satin ribbon generation) can be offloaded to Web Workers using a simple, stateless request-response model without blocking the main UI thread.
3. **Pluggable AI & Grounding**: The `PatternEngine` can easily plug into external vision APIs or local small-vision models without changing how stitches are compiled or exported.
4. **Machine Adaptability**: When exporting a file, changing the targeted machine profile automatically recalculates stitch lengths and underlays at compile-time, guaranteeing flawless results across multiple machines (Tajima, Brother, Barudan, etc.) from a single source model.
