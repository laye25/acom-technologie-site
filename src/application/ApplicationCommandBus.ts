import { Command } from './ScientificEventBus';
import { CompilationApplicationService } from './CompilationApplicationService';
import { DiagnosticApplicationService } from './DiagnosticApplicationService';
import { NightResearchApplicationService } from './NightResearchApplicationService';
import { EKLEApplicationService } from './EKLEApplicationService';
import { VerseauApplicationService } from './VerseauApplicationService';
import { ValidationApplicationService } from './ValidationApplicationService';
import { PerformanceProfiler } from '../core/profiler/PerformanceProfiler';

export class ApplicationCommandBus {
  static async dispatch(command: Command): Promise<any> {
    const runId = (command.payload as any)?.runId || 'NO-RUN-ID';
    console.log(`[ApplicationCommandBus] [${runId}] 🟢 Dispatching command: ${command.type}`, {
      payloadKeys: command.payload ? Object.keys(command.payload) : [],
      timestamp: new Date().toISOString()
    });
    
    const profilerStep = PerformanceProfiler.startStep(runId, `CommandBus: ${command.type}`);

    try {
      let result: any;
      switch (command.type) {
        case 'COMPILE':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to CompilationApplicationService.executeCompileCommand`);
          result = await CompilationApplicationService.executeCompileCommand(command.payload);
          break;
        case 'VALIDATE_ASSET':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to ValidationApplicationService.executeValidateCommand`);
          result = await ValidationApplicationService.executeValidateCommand(command.payload);
          break;
        case 'RUN_DIAGNOSTIC':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to DiagnosticApplicationService.executeRunDiagnosticCommand`);
          result = await DiagnosticApplicationService.executeRunDiagnosticCommand(command.payload);
          break;
        case 'LAUNCH_NIGHT_RESEARCH':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to NightResearchApplicationService.executeLaunchNightResearchCommand`);
          result = await NightResearchApplicationService.executeLaunchNightResearchCommand(command.payload);
          break;
        case 'EKLE_LEARN':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to EKLEApplicationService.executeLearnCommand`);
          result = await EKLEApplicationService.executeLearnCommand(command.payload);
          break;
        case 'EKLE_SUGGEST':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to EKLEApplicationService.executeSuggestCommand`);
          result = await EKLEApplicationService.executeSuggestCommand(command.payload);
          break;
        case 'VERSEAU_REASON':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to VerseauApplicationService.executeReasonCommand`);
          result = await VerseauApplicationService.executeReasonCommand(command.payload);
          break;
        case 'VERSEAU_FEEDBACK':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to VerseauApplicationService.executeFeedbackCommand`);
          result = await VerseauApplicationService.executeFeedbackCommand(command.payload);
          break;
        case 'VERSEAU_ADD_MEMORY':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to VerseauApplicationService.executeAddMemoryCommand`);
          result = await VerseauApplicationService.executeAddMemoryCommand(command.payload);
          break;
        case 'VERSEAU_GET_MEMORIES':
          console.log(`[ApplicationCommandBus] [${runId}] -> Routing to VerseauApplicationService.executeGetMemoriesCommand`);
          result = await VerseauApplicationService.executeGetMemoriesCommand();
          break;
        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }
      
      console.log(`[ApplicationCommandBus] [${runId}] 🔵 Finished dispatching ${command.type} successfully.`, {
        resultType: result ? typeof result : 'undefined',
        timestamp: new Date().toISOString()
      });
      profilerStep.end();
      return result;
    } catch (error: any) {
      const runId = (command.payload as any)?.runId || 'NO-RUN-ID';
      console.error(`[ApplicationCommandBus] [${runId}] 🔴 Command ${command.type} failed with exception:`, error);
      profilerStep.end();
      throw error;
    }
  }
}
