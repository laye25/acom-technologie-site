import { CompilerPass } from './Pass';

export class PassManager {
  private static registry: Map<string, CompilerPass> = new Map();

  static register(pass: CompilerPass) {
    this.registry.set(pass.name, pass);
  }

  static getPass(name: string): CompilerPass | undefined {
    return this.registry.get(name);
  }

  static getAll(): CompilerPass[] {
    return Array.from(this.registry.values());
  }
}
