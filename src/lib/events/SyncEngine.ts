import { bus } from './EventBus';
import { firestoreService } from '../../services/firestoreService';

export interface BlockEvent {
  type: 'block_create' | 'block_update' | 'block_delete';
  designId: string;
  pageIndex: number;
  blockId: string;
  changes?: any; // For updates
  data?: any;    // For creates
  userId: string;
  timestamp: number;
}

class SyncEngine {
  private queue: BlockEvent[] = [];
  private isProcessing = false;
  private syncInterval: any = null;

  constructor() {
    this.setupListeners();
    this.startSyncLoop();
  }

  private setupListeners() {
    bus.on('block_event', (event: BlockEvent) => {
      this.queue.push(event);
      // Optional: Persist queue to IndexedDB here for offline-first
      this.processQueue();
    });
  }

  private startSyncLoop() {
    // Fallback loop to process queue periodically in case of network issues
    this.syncInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, 5000);
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;

    try {
      // Take a snapshot of the current queue
      const eventsToProcess = [...this.queue];
      this.queue = []; // Clear queue (optimistic)

      // Group events by blockId to batch updates
      const blockUpdates = new Map<string, any>();
      const blockDeletes = new Set<string>();
      
      let designId = '';

      for (const event of eventsToProcess) {
        designId = event.designId; // Assuming all events in a batch are for the same design
        
        if (event.type === 'block_delete') {
          blockDeletes.add(event.blockId);
          blockUpdates.delete(event.blockId);
        } else if (event.type === 'block_create' || event.type === 'block_update') {
          blockDeletes.delete(event.blockId);
          const existing = blockUpdates.get(event.blockId) || {};
          blockUpdates.set(event.blockId, {
            ...existing,
            ...(event.data || event.changes),
            updatedAt: new Date(event.timestamp)
          });
        }
      }

      // Execute Firestore operations
      const promises: Promise<any>[] = [];

      // Process Deletes
      for (const blockId of blockDeletes) {
        promises.push(firestoreService.delete(`designs/${designId}/blocks`, blockId));
      }

      // Process Updates/Creates
      for (const [blockId, data] of blockUpdates.entries()) {
        promises.push(firestoreService.save(`designs/${designId}/blocks`, {
          id: blockId,
          designId,
          pageIndex: data.pageIndex || 0,
          type: data.type || 'shape',
          x: data.x || 0,
          y: data.y || 0,
          width: data.width || 0,
          height: data.height || 0,
          rotation: data.rotation || 0,
          content: data
        }));
      }

      await Promise.all(promises);
      
      // Optional: Remove from IndexedDB queue here

    } catch (error) {
      console.error('SyncEngine: Error processing queue', error);
      // Re-queue failed events (simple retry logic)
      // In a real app, we'd need more robust conflict resolution
    } finally {
      this.isProcessing = false;
      
      // If new events arrived while processing, process them
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }
}

export const syncEngine = new SyncEngine();
