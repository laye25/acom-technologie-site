// src/ai-demo/BusinessEvents/EventBus.ts
// Central Event Bus for Acom SaaS Business Events

import { BusinessEvent } from '../types';

type EventListener<T = any> = (event: BusinessEvent<T>) => void;

class EventBusService {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private history: BusinessEvent[] = [];
  private maxHistory = 100;

  /**
   * Subscribe to a specific event type, or '*' for all events.
   */
  public subscribe<T = any>(eventType: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(listener);
      }
    };
  }

  /**
   * Emit a business event to all matching subscribers.
   */
  public emit<T = any>(event: Omit<BusinessEvent<T>, 'id' | 'timestamp'>): BusinessEvent<T> {
    const fullEvent: BusinessEvent<T> = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };

    // Keep history
    this.history.unshift(fullEvent);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Notify specific type subscribers
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(fullEvent);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${event.type}:`, err);
        }
      });
    }

    // Notify wildcards
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        try {
          listener(fullEvent);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard listener:`, err);
        }
      });
    }

    return fullEvent;
  }

  /**
   * Get recent event history
   */
  public getHistory(): BusinessEvent[] {
    return [...this.history];
  }
}

export const EventBus = new EventBusService();
