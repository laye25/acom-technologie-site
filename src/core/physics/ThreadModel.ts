export class ThreadModel {
  public type: string;
  public diameter: number;
  public elasticity: number;
  public twist: number;
  public frictionCoefficient: number;
  public maxElongation: number;

  constructor(options: Partial<ThreadModel> = {}) {
    this.type = options.type ?? 'default';
    this.diameter = options.diameter ?? 0.2;
    this.elasticity = options.elasticity ?? 0.8;
    this.twist = options.twist ?? 1.0;
    this.frictionCoefficient = options.frictionCoefficient ?? 0.3;
    this.maxElongation = options.maxElongation ?? 0.05;
  }
}

