export interface PhysicsMetrics {
  pushCompensationError: number;
  pullCompensationError: number;
  fabricStretch: number;
  threadCompression: number;
  cornerCollapse: number;
  stitchRelaxationScore: number;
  needlePenetrationScore: number;
  physicsFidelityScore: number;
}

export interface FabricProperties {
  type: string;
  stretchX: number; // Percentage
  stretchY: number; // Percentage
  thickness: number; // mm
  density: number; // g/m2
}

export interface ThreadProperties {
  type: string; // e.g., Polyester, Rayon
  weight: number; // e.g., 40wt
  elasticity: number; // Percentage
  thickness: number; // mm
}
