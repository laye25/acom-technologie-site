# Acom Broderie CAD/CAM Application Interface

This document specifies the unified application layer and state management boundaries of the **Acom Broderie CAD/CAM Engine**. It defines how the high-level React UI interacts with the underlying headless CAD engines.

---

## 1. The Separation of Concerns

The primary problem of traditional embroidery interfaces is the mixing of **Visual Representation State** (zoom, pan, active layer selection, hover elements) and **Embroidery Model State** (vector geometries, physical properties, generated stitch coordinates).

Acom Broderie isolates these concerns using a structured API gateway:

```
┌────────────────────────────────────────────────────────┐
│                        React UI                        │
│   (Listens to Application State & triggers Commands)   │
└───────────────────────────┬────────────────────────────┘
                            │ (Commands / Actions)
                            ▼
┌────────────────────────────────────────────────────────┐
│               EmbroideryApplication API                │
│   (Unified entry point, maintains transaction context) │
└───────────────────────────┬────────────────────────────┘
                            │ (State Mutations)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Headless CAD/CAM Core                  │
│       (Compiles layers, runs physics, exports)         │
└────────────────────────────────────────────────────────┘
```

---

## 2. API Facade Interface Specification

The `EmbroideryApplication` is implemented as a class or a hook-backed controller that manages transactions and undo/redo histories. Below is the strict TypeScript specification of the Application API:

```typescript
import { 
  EmbroideryProject, 
  EmbroideryLayer, 
  EmbroideryObject, 
  FabricProfile, 
  MachineProfile,
  StitchPath,
  ValidationResult
} from './types';

export interface IEmbroideryApplication {
  // Project Management
  loadProject(project: EmbroideryProject): void;
  exportProject(): EmbroideryProject;
  
  // Undo/Redo Transactions
  beginTransaction(description: string): void;
  commitTransaction(): void;
  rollbackTransaction(): void;
  undo(): boolean;
  redo(): boolean;

  // Layer & Object Manipulation
  addLayer(layer: Omit<EmbroideryLayer, 'id'>): string;
  updateLayer(id: string, updates: Partial<EmbroideryLayer>): void;
  removeLayer(id: string): void;
  reorderLayers(orderedIds: string[]): void;
  
  addObjectToLayer(layerId: string, object: Omit<EmbroideryObject, 'id'>): string;
  updateObject(objectId: string, updates: Partial<EmbroideryObject>): void;
  removeObject(objectId: string): void;

  // Compilation Pipeline Orchestration
  setFabricProfile(profile: FabricProfile): void;
  setMachineProfile(profile: MachineProfile): void;
  compileProject(): Promise<void>; // Triggers Core Geometry & Physics pipelines
  
  // Export Boundaries
  exportDST(): ArrayBuffer;
  exportPES(): ArrayBuffer;
  exportJEF(): ArrayBuffer;

  // Quality Audit
  validateProject(): Promise<ValidationResult[]>;
}
```

---

## 3. Data Flow and Event Life Cycle

Whenever a user modifies a vector shape or changes a parameter (like tatami density):

1. **Trigger**: The UI dispatches an action to `EmbroideryApplication.updateObject()`.
2. **Transaction**: `EmbroideryApplication` records the current state in the Undo Stack.
3. **Draft Compilation**: The changed shape is sent to the `GeometryEngine` to evaluate local curvatures and boundaries.
4. **Stitch Compilation**: 
   - The `PhysicsEngine` is queried to fetch the current fabric's push/pull deformation matrices.
   - The `EmbroideryCoreEngine` receives the deformed geometries and generates raw stitch points (underlay followed by the decorative stitches).
5. **Quality Review**: The `QualityEngine` scans the newly compiled stitches for issues (e.g., stitch density spike, short stitches, missing connections) and produces warnings.
6. **State Broadcast**: The application broadcasts the newly generated `StitchPath[]` and `ValidationResult[]` to the UI.
7. **Draw**: The Canvas rendering pipeline performs a highly optimized 2D or WebGL draw using the updated stitch paths.

---

## 4. Headless Execution Capabilities

Because the `EmbroideryApplication` does not import any browser-specific global variables (`window`, `document`, `HTMLCanvasElement`), it is capable of running:
- **Client-Side Workers**: Offloading heavy stitch generations (like a 100,000 stitch tatami fill) to a separate browser Thread via Web Workers.
- **Node.js / Cloud Functions**: Running automated batch conversions (e.g. SVG to DST using AI-guided presets) on a server backend.
- **CLI Utilities**: A command-line tool for tailors to optimize or convert files in bulk.
