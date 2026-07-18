import { VerseauExecutive } from '../modules/tailleur/services/VerseauExecutive';
import { VerseauReasoner } from '../modules/tailleur/services/VerseauReasoner';
import { VerseauCritic } from '../modules/tailleur/services/VerseauCritic';
import { VerseauMemory } from '../modules/tailleur/services/VerseauMemory';
import { ScientificEventBus } from './ScientificEventBus';

export class VerseauApplicationService {
  static async executeReasonCommand(payload: { mode: string, fabricKey: string, fabricName: string, priority: string, machine: string, thread: string }) {
    const directive = VerseauExecutive.formulateDirective(payload.priority as any, payload.machine as any, payload.thread as any, payload.fabricKey);
    const reasoningResult = VerseauReasoner.reason(payload.mode as any, payload.fabricKey, payload.fabricName, directive);
    const criticReport = VerseauCritic.evaluate(reasoningResult.family, payload.fabricKey, reasoningResult.suggestions);

    return {
      directive,
      reasoningResult,
      criticReport
    };
  }

  static async executeFeedbackCommand(payload: { fabricKey: string, mode: string, success: boolean, stats: any, decisions: any, machine: string }) {
    const newObs = VerseauMemory.feedBack(payload.fabricKey, payload.mode, payload.success, payload.stats, payload.decisions, payload.machine);
    const memories = VerseauMemory.getMemories();
    const runs = VerseauMemory.getExperienceRuns();
    
    return {
      newObs,
      memories,
      runs
    };
  }

  static async executeAddMemoryCommand(payload: { memory: any }) {
    VerseauMemory.addMemory(payload.memory);
    return VerseauMemory.getMemories();
  }

  static async executeGetMemoriesCommand() {
    return {
      memories: VerseauMemory.getMemories(),
      runs: VerseauMemory.getExperienceRuns()
    };
  }
}
