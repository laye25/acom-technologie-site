import { ATIR } from './ATIR';
import { CompilerPipeline } from './Pipeline';
import { GeometryPass } from './passes/GeometryPass';
import { TopologyPass } from './passes/TopologyPass';
import { RibbonPass } from './passes/RibbonPass';
import { SatinPass } from './passes/SatinPass';
import { TatamiPass } from './passes/TatamiPass';
import { TravelPass } from './passes/TravelPass';
import { PhysicsPass } from '../physics/PhysicsPass';
import { DSTBackend } from './backends/DSTBackend';
import { PESBackend } from './backends/PESBackend';
import { CompilerPass } from './Pass';

export class ExportPass implements CompilerPass {
  name = 'ExportPass';

  execute(ir: ATIR, context: any): ATIR {
    const start = performance.now();
    
    // Generate binaries based on profile
    const profile = ir.metadata.profile || 'tajima';
    
    let dstBuffer: Uint8Array | null = null;
    let pesBuffer: Uint8Array | null = null;
    
    if (profile === 'tajima' || profile === 'all') {
      dstBuffer = DSTBackend.generate(ir);
    }
    
    if (profile === 'brother' || profile === 'all') {
      pesBuffer = PESBackend.generate(ir);
    }
    
    ir.metadata.export = {
      dst: dstBuffer,
      pes: pesBuffer,
      bytes: (dstBuffer?.length || 0) + (pesBuffer?.length || 0)
    };

    if (ir.metadata.performance && ir.metadata.performance.passes) {
      ir.metadata.performance.passes[this.name] = performance.now() - start;
    }

    return ir;
  }
}

export class ATCPCompiler {
  private pipeline: CompilerPipeline;

  constructor() {
    this.pipeline = new CompilerPipeline();
    // Default Industrial Pipeline
    this.pipeline.addPass(new GeometryPass());
    this.pipeline.addPass(new TopologyPass());
    this.pipeline.addPass(new RibbonPass());
    this.pipeline.addPass(new TatamiPass());
    this.pipeline.addPass(new SatinPass());
    this.pipeline.addPass(new TravelPass());
    this.pipeline.addPass(new PhysicsPass());
    this.pipeline.addPass(new ExportPass());
  }

  getPipeline(): CompilerPipeline {
    return this.pipeline;
  }

  compile(svgString: string, profile: string = 'tajima'): ATIR {
    const initialIR: ATIR = {
      version: '1.0',
      contours: [],
      regions: [],
      metadata: { profile }
    };
    
    return this.pipeline.execute(initialIR, { profile });
  }
}
