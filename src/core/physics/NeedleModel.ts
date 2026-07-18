export class NeedleModel {
  public diameter: number;
  public speed: number;
  public angle: number;
  public depth: number;
  public frequency: number;

  constructor(options: Partial<NeedleModel> = {}) {
    this.diameter = options.diameter ?? 0.7;
    this.speed = options.speed ?? 1000;
    this.angle = options.angle ?? 90;
    this.depth = options.depth ?? 1.5;
    this.frequency = options.frequency ?? 10;
  }
}
