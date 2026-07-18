export class FabricModel {
  public type: string;
  public thickness: number;
  public elasticity: number;
  public anisotropy: number;
  public stiffness: number;
  public compression: number;
  public shear: number;
  public density: number;

  constructor(options: Partial<FabricModel> = {}) {
    this.type = options.type ?? 'default';
    this.thickness = options.thickness ?? 1.0;
    this.elasticity = options.elasticity ?? 0.5;
    this.anisotropy = options.anisotropy ?? 0.1;
    this.stiffness = options.stiffness ?? 0.5;
    this.compression = options.compression ?? 0.2;
    this.shear = options.shear ?? 0.3;
    this.density = options.density ?? 1.0;
  }
}

