import { ATIR } from '../compiler/ATIR';
import { CompilerPass } from '../compiler/Pass';
import { FabricModel } from './FabricModel';
import { ThreadModel } from './ThreadModel';
import { NeedleModel } from './NeedleModel';
import { PhysicsValidator } from './PhysicsValidator';

export class PhysicsPass implements CompilerPass {
  name = 'PhysicsPass';

  execute(ir: ATIR, context: any): ATIR {
    const start = performance.now();
    
    const fabric = new FabricModel(context.fabricOptions);
    const thread = new ThreadModel(context.threadOptions);
    const needle = new NeedleModel(context.needleOptions);

    const points = ir.stitches || [];

    // Analyze stitches through the physics validator
    const metrics = PhysicsValidator.validate(points, fabric, thread, needle);

    ir.metadata.physicsMetrics = metrics;

    if (ir.metadata.performance && ir.metadata.performance.passes) {
      ir.metadata.performance.passes[this.name] = performance.now() - start;
    }

    return ir;
  }
}
