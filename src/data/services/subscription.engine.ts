import { 
  onSnapshot, 
  Query, 
  DocumentData, 
  QuerySnapshot 
} from 'firebase/firestore';

type Unsubscribe = () => void;
type Callback = (snapshot: QuerySnapshot<DocumentData>) => void;

interface ActiveSubscription {
  unsub: Unsubscribe;
  listeners: Set<Callback>;
  lastSnapshot?: QuerySnapshot<DocumentData>;
}

class SubscriptionEngine {
  private activeSubs = new Map<string, ActiveSubscription>();

  /**
   * Subscribe to a Firestore query with reference counting.
   * If a subscription already exists for the given key, it adds the callback to the set of listeners.
   * Otherwise, it creates a new Firestore listener.
   */
  subscribe(key: string, query: Query<DocumentData>, callback: Callback): Unsubscribe {
    let sub = this.activeSubs.get(key);

    if (!sub) {
      // Create new Firestore subscription
      const listeners = new Set<Callback>();
      listeners.add(callback);

      const unsub = onSnapshot(query, (snapshot) => {
        const currentSub = this.activeSubs.get(key);
        if (currentSub) {
          currentSub.lastSnapshot = snapshot;
          currentSub.listeners.forEach(listener => listener(snapshot));
        }
      }, (error) => {
        console.error(`[SubscriptionEngine] Error for key ${key}:`, error);
      });

      sub = { unsub, listeners };
      this.activeSubs.set(key, sub);
    } else {
      // Add to existing subscription
      sub.listeners.add(callback);
      // Immediately replay the last snapshot if available
      if (sub.lastSnapshot) {
        callback(sub.lastSnapshot);
      }
    }

    // Return an unsubscribe function that handles reference counting
    return () => {
      const currentSub = this.activeSubs.get(key);
      if (!currentSub) return;

      currentSub.listeners.delete(callback);

      // If no more listeners, clean up the Firestore subscription
      if (currentSub.listeners.size === 0) {
        currentSub.unsub();
        this.activeSubs.delete(key);
        console.log(`[SubscriptionEngine] Cleaned up subscription for key: ${key}`);
      }
    };
  }

  /**
   * Get the number of active subscriptions (for debugging)
   */
  getStats() {
    return {
      activeSubscriptions: this.activeSubs.size,
      keys: Array.from(this.activeSubs.keys())
    };
  }
}

export const subscriptionEngine = new SubscriptionEngine();
