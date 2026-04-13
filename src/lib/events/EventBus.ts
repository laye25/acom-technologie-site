type EventHandler = (data: any) => void;

class EventBus {
  private events: Record<string, EventHandler[]> = {};

  emit(event: string, data: any) {
    if (this.events[event]) {
      this.events[event].forEach(fn => fn(data));
    }
  }

  on(event: string, fn: EventHandler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(fn);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(handler => handler !== fn);
    };
  }
}

export const bus = new EventBus();
