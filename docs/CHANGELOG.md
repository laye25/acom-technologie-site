# Acom Broderie Changelog

All notable changes to the **Acom Broderie CAD/CAM Engine** will be documented in this file.

---

## [2.0.0-draft] - 2026-07-12
### Added
- Created complete **Hexagonal CAD/CAM Architecture Blueprint** under `/docs/architecture/` to decouple calculation layers from React rendering.
- Defined independent **CAD/CAM Application Interface Specifications** (`CADCAM.md`) mapping event lifecycles and transactions.
- Documented mathematical formulation for the **Geometry Engine** (`GEOMETRY.md`) detailing adaptive curvature-based sampling and self-intersection checking.
- Documented backbone extraction and dual-rail stitching algorithms for the **Ribbon Reconstruction Engine** (`RIBBON_ENGINE.md`).
- Documented semantic classifications and specific stitch strategies for the **Pattern Intelligence Engine** (`PATTERN_AI.md`).
- Documented material profiles and inverse-deformation compensators for the **Fabric Physics Engine** (`PHYSICS_ENGINE.md`).
- Documented file formats (DST/PES) and hardware target adaptions for the **Machine Profile & Export Engine** (`EXPORT_ENGINE.md`).
- Documented counterform detection, density checks, and Traveling Salesperson path sorting for the **Quality & Optimization Engine** (`QUALITY_ENGINE.md`).
- Created the **Benchmark Framework Suite** (`BENCHMARKS.md`) to measure Acom's efficiency against industry giants (Wilcom, Tajima).
- Outlined a multi-phase **Engineering Roadmap** (`ROADMAP.md`) from architectural isolation to production.

---

## [1.1.0] - Prior Work
### Added
- Integrated basic SVG importing and raster-to-vector tracing capabilities.
- Added basic Tatami, Satin, and Running stitch generation strategies.
- Provided client-side local history management (Undo/Redo stack).
- Created a custom canvas component supporting interactive thread simulation.
- Integrated standard Tajima DST export module.
