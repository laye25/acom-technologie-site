// src/ai-demo/services/SaiEventBus.ts
/**
 * Event Bus Central - Decoupled event emitter for ACOM AI Demo Platform
 * Enables real-time communication between Interaction Engine, Capture Engine,
 * Scenario Modeling Engine, AI Teaching Engine, and Publishing Engines.
 */

import { SaiInteractionEvent, SaiVisualSnapshot, ScenarioApplicationIntelligent } from '../types';

export type SaiEventTopic =
  | 'sai:event_captured'
  | 'sai:snapshot_captured'
  | 'sai:scenario_created'
  | 'sai:scenario_updated'
  | 'sai:timeline_built'
  | 'sai:knowledge_enriched'
  | 'sai:privacy_masked'
  | 'sai:diagnostic_completed'
  | 'sai:repository_saved';

export type SaiEventCallback<T = any> = (payload: T) => void;

export class SaiEventBus {
  private static listeners: Map<SaiEventTopic, Set<SaiEventCallback>> = new Map();

  /**
   * Subscribe to an event topic on the central bus
   */
  public static subscribe<T = any>(topic: SaiEventTopic, callback: SaiEventCallback<T>): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    const topicListeners = this.listeners.get(topic)!;
    topicListeners.add(callback);

    // Return unsubscribe handler
    return () => {
      topicListeners.delete(callback);
    };
  }

  /**
   * Publish an event with a payload to all topic subscribers
   */
  public static publish<T = any>(topic: SaiEventTopic, payload: T): void {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners && topicListeners.size > 0) {
      topicListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (e) {
          console.error(`[SaiEventBus] Error in subscriber for ${topic}:`, e);
        }
      });
    }
  }

  /**
   * Clears all topic listeners (useful for testing or reset)
   */
  public static clear(): void {
    this.listeners.clear();
  }
}
