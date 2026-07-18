import { CompilerPass } from './Pass';
import { ATIR } from './ATIR';

export class CompilerPipeline {
  private passes: CompilerPass[] = [];

  addPass(pass: CompilerPass): this {
    this.passes.push(pass);
    return this;
  }

  execute(initialIR: ATIR, globalParams: any = {}): ATIR {
    let currentIR = initialIR;
    if (!currentIR.metadata.performance) {
      currentIR.metadata.performance = { passes: {}, totalMs: 0 };
    }
    
    const startTotal = performance.now();
    for (const pass of this.passes) {
      const startPass = performance.now();
      currentIR = pass.execute(currentIR, globalParams);
      const endPass = performance.now();
      
      const timeMs = endPass - startPass;
      currentIR.metadata.performance.passes[pass.name] = timeMs;
    }
    const endTotal = performance.now();
    currentIR.metadata.performance.totalMs = endTotal - startTotal;
    
    return currentIR;
  }
}
