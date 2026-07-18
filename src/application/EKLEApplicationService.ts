import { EKLEService } from '../modules/tailleur/services/EKLEService';
import { ScientificEventBus } from './ScientificEventBus';

export class EKLEApplicationService {
  static async executeLearnCommand(payload: { sourceId: string, sourceName: string, layers: any[] }) {
    try {
      const components = await EKLEService.learnFromModel(payload.sourceId, payload.sourceName, payload.layers);
      ScientificEventBus.publish({ type: 'KNOWLEDGE_ACCEPTED', payload: { knowledgeId: payload.sourceId } });
      return components;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  static async executeSuggestCommand(payload: { layers: any[] }) {
    const matchesFound = [];
    try {
      const { ekleDb } = await import('../modules/tailleur/services/EKLEService');
      const preloadedComponents = await ekleDb.components.toArray();

      for (const layer of payload.layers) {
        if (layer.points && layer.points.length > 0) {
          const sig = EKLEService.calculateShapeSignature(layer.points);
          if (sig.solidity > 0.1) {
            const matches = await EKLEService.findSimilarComponents(sig, 92, preloadedComponents);
            if (matches && matches.length > 0) {
              matchesFound.push({
                layerId: layer.id,
                layerName: layer.name,
                match: matches[0]
              });
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return matchesFound;
  }
}
