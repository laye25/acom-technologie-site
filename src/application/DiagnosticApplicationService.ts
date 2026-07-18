import { ScientificEventBus } from './ScientificEventBus';
import {
  ScientificPipelineExecutor,
  LoadScientificAssetStep,
  CreateSnapshotStep,
  CreateRevisionStep,
  GeometryAnalysisStep,
  TopologyAnalysisStep,
  ValidationStep,
  ScientificPipelineContext
} from './pipeline/ScientificPipeline';

export class DiagnosticApplicationService {
  static async executeRunDiagnosticCommand(payload: { assetId: string; layers: any[]; fabricKey: string }) {
    const { assetId, layers, fabricKey } = payload;
    
    // Deep clone to prevent mutating the UI state directly
    const pristineLayers = JSON.parse(JSON.stringify(layers));

    // RÈGLE N°13 : Composable pipeline for Geometry Autopsy
    const context: ScientificPipelineContext = {
      assetId,
      projectName: "Diagnostic Autopsy",
      layers: pristineLayers,
      format: 'DST',
      fabricKey,
      mode: 'fast',
      executivePriority: 'quality',
      executiveMachine: 'tajima',
      executiveThread: 'rayon',
      logs: []
    };

    // Partial pipeline: Geometry -> Topology -> Validation (No DST, No Persistence)
    const steps = [
      new LoadScientificAssetStep(),
      new CreateSnapshotStep(),
      new CreateRevisionStep(),
      new GeometryAnalysisStep(),
      new TopologyAnalysisStep(),
      new ValidationStep()
    ];

    const executor = new ScientificPipelineExecutor(steps);
    const resultContext = await executor.run(context);

    return resultContext.revision;
  }
}
