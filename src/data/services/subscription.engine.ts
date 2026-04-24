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
  timeoutId?: NodeJS.Timeout;
}

class SubscriptionEngine {
  private activeSubs = new Map<string, ActiveSubscription>();
  private readonly GRACE_PERIOD_MS = 60000; // 60 seconds grace period to prevent quota explosion on rapid mount/unmount

  /**
   * Subscribe to a Firestore query with reference counting and grace period.
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
      // Cancel any pending cleanup because a component reattached!
      if (sub.timeoutId) {
        clearTimeout(sub.timeoutId);
        sub.timeoutId = undefined;
      }
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

      // If no more listeners, DO NOT unsubscribe immediately. Set a delay.
      if (currentSub.listeners.size === 0) {
        if (currentSub.timeoutId) return; // Already scheduled
        
        currentSub.timeoutId = setTimeout(() => {
          // Check again after delay
          if (currentSub.listeners.size === 0) {
            currentSub.unsub();
            this.activeSubs.delete(key);
            console.log(`[SubscriptionEngine] Cleaned up subscription for key: ${key}`);
          }
        }, this.GRACE_PERIOD_MS);
      }
    };
  }

  /**
   * Force unmount all (for logout)
   */
  clearAll() {
    this.activeSubs.forEach(sub => {
      if (sub.timeoutId) clearTimeout(sub.timeoutId);
      sub.unsub();
    });
    this.activeSubs.clear();
  }

  getStats() {
    return {
      activeSubscriptions: this.activeSubs.size,
      keys: Array.from(this.activeSubs.keys())
    };
  }
}

export const subscriptionEngine = new SubscriptionEngine();
